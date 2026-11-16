"""Tests on a SYNTHETIC feed (made-up prices) in a temp folder: no-peek, partial
candles, fills, stop-first, forward-only clock, end-of-data cap. Run: pytest -q"""
import gzip

import numpy as np
import pandas as pd
import pytest

import sim as S


@pytest.fixture
def env(tmp_path):
    feed, sd = tmp_path / "feed", tmp_path / "sim"
    feed.mkdir()
    t = pd.date_range("2020-01-06 00:00", "2020-01-10 21:59", freq="1min", tz="UTC")
    px = 1.1000 + 0.0001 * np.sin(np.arange(len(t)) / 50)
    d = pd.DataFrame({"time": t.strftime("%Y-%m-%d %H:%M:%S+00:00"), "open": px, "high": px + 0.0002,
                      "low": px - 0.0002, "close": px, "spread": 0.00002, "volume": 1.0})
    with gzip.open(feed / "2020-01.csv.gz", "wt") as f:
        d.to_csv(f, index=False)
    s = S.Sim(sd, feed)
    s.s = S._new_state("2020-01-06 00:00")
    return s


def test_no_future_bars(env):
    env.advance(minutes=150)                       # 02:30
    for tf in ("M1", "M15", "H1", "H4", "D1"):
        b = env.bars(tf, 50)
        assert b["time"].iloc[-1] < env.clock
        closed = b[~b["partial"]]
        assert (closed["time"] + pd.to_timedelta(S.TF_MIN[tf], "min") <= env.clock).all()


def test_partial_candle_built_from_closed_minutes(env):
    env.advance(until="2020-01-06 02:30")
    h4 = env.bars("H4", 5)
    assert bool(h4["partial"].iloc[-1]) and h4["time"].iloc[-1] == pd.Timestamp("2020-01-06", tz="UTC")
    m1 = env.feed.m1(pd.Timestamp("2020-01-06", tz="UTC"), env.clock)
    assert h4["high"].iloc[-1] == m1["high"].max() and h4["close"].iloc[-1] == m1["close"].iloc[-1]
    assert not env.bars("H4", 5, partial=False)["partial"].any()


def test_clock_forward_only_and_capped(env):
    env.advance(minutes=10)
    with pytest.raises(ValueError):
        env.advance(until="2020-01-06 00:05")
    note = env.advance(until="2030-01-01")
    assert "END OF RELEASED DATA" in note and env.clock == pd.Timestamp("2020-01-10 22:00", tz="UTC")


def test_market_fill_next_minute_with_costs(env):
    env.advance(minutes=60)
    env.order(1, 1.0)
    env.advance(minutes=1)
    p = env.s["positions"][0]
    o = env.feed.m1(pd.Timestamp("2020-01-06 01:00", tz="UTC"), env.clock)["open"].iloc[0]
    assert p["entry"] == pytest.approx(o + S.SPREAD + S.SLIP)


def test_stop_first_when_both_touched(env):
    env.advance(minutes=60)
    px = env.price()
    env.order(1, 1.0, sl=px - 0.0001, tp=px + 0.0001)   # both inside one minute's range
    env.advance(minutes=3)
    tr = pd.read_csv(env.dir / "trades.csv")
    assert tr["reason"].iloc[0] == "sl"


def test_label_shows_london_session():
    assert "Mon 2015-03-02 07:00 London" in S.label("2015-03-02 07:00")
    assert "weekend" in S.label("2015-03-07 12:00")
