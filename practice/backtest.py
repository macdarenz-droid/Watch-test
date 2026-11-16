"""Offline backtest helper for testing an idea systematically on history you have
ALREADY LIVED THROUGH (everything before the clock). Contains no strategy.

    from backtest import history, Account, FundedNextChallenge
    h1 = history("H1")            # all closed H1 candles up to the clock
    acct = Account(); ...         # loop candles in time order, call acct.on_bar(bar)

Rules: decide on candle N, fills at candle N+1 open. Costs on (1.0 pip spread +
0.1 pip slippage). Stop first if stop and target are inside the same candle.
Count every variant you test in STATE.md.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
from zoneinfo import ZoneInfo

from sim import Feed, TF_MIN, _ts, resample

import pandas as pd

NY = ZoneInfo("America/New_York")
PIP = 0.0001
CONTRACT = 100_000


def server_day(ts) -> pd.Timestamp:
    """Broker server date (UTC+2 winter / UTC+3 summer; rolls at 17:00 New York)."""
    t = pd.Timestamp(ts)
    t = t.tz_localize("UTC") if t.tzinfo is None else t
    return (t.tz_convert(NY) + timedelta(hours=7)).normalize().tz_localize(None)


@dataclass
class Position:
    id: int
    side: int            # +1 long, -1 short
    lots: float
    entry: float
    entry_time: pd.Timestamp
    sl: float | None = None
    tp: float | None = None
    tag: str = ""


@dataclass
class Account:
    balance: float = 25_000.0
    spread: float = 1.0 * PIP          # used when bar spread is missing or use_bar_spread=False
    slippage: float = 0.1 * PIP        # applied against you on market/stop fills
    commission_per_lot: float = 0.0    # USD per lot per side
    use_bar_spread: bool = False       # use the data's 'spread' column when available
    positions: list = field(default_factory=list)
    pending: list = field(default_factory=list)
    trades: list = field(default_factory=list)
    _next_id: int = 1

    # ---- orders -------------------------------------------------------
    def market(self, side: int, lots: float, sl=None, tp=None, tag: str = "") -> int:
        """Queue a market order; fills at the next bar's open."""
        assert side in (1, -1) and lots > 0
        oid = self._next_id
        self._next_id += 1
        self.pending.append(dict(id=oid, side=side, lots=lots, sl=sl, tp=tp, tag=tag))
        return oid

    def close(self, pos_id: int | None = None):
        """Queue a market close (all positions if pos_id is None) at next open."""
        self.pending.append(dict(close=pos_id))

    def modify(self, pos_id: int, sl=None, tp=None):
        for p in self.positions:
            if p.id == pos_id:
                if sl is not None:
                    p.sl = sl
                if tp is not None:
                    p.tp = tp

    # ---- helpers ------------------------------------------------------
    def _spr(self, bar) -> float:
        s = bar.get("spread") if hasattr(bar, "get") else None
        if self.use_bar_spread and s is not None and pd.notna(s):
            return float(s)
        return self.spread

    def _pnl(self, p: Position, exit_px: float) -> float:
        return (exit_px - p.entry) * CONTRACT * p.lots * p.side

    def _exit(self, p: Position, px: float, t, reason: str):
        pnl = self._pnl(p, px) - self.commission_per_lot * p.lots
        self.balance += pnl
        self.positions.remove(p)
        self.trades.append(dict(id=p.id, side=p.side, lots=p.lots, entry_time=p.entry_time,
                                entry=p.entry, exit_time=t, exit=px, sl=p.sl, tp=p.tp,
                                pnl=pnl, reason=reason, tag=p.tag))

    def equity(self, bid: float, spread: float | None = None) -> float:
        s = self.spread if spread is None else spread
        return self.balance + sum(self._pnl(p, bid if p.side > 0 else bid + s)
                                  for p in self.positions)

    def worst_equity(self, bar) -> float:
        """Lowest floating equity inside the bar (longs at low bid, shorts at high ask)."""
        s = self._spr(bar)
        return self.balance + sum(self._pnl(p, bar["low"] if p.side > 0 else bar["high"] + s)
                                  for p in self.positions)

    # ---- main step ----------------------------------------------------
    def on_bar(self, bar) -> None:
        """Process one bar (dict/Series with time, open, high, low, close[, spread]).
        Call once per bar, in time order, AFTER deciding orders on the previous bar."""
        t, o, h, l = bar["time"], bar["open"], bar["high"], bar["low"]
        s = self._spr(bar)
        # 1) fill queued orders at this bar's open
        for od in self.pending:
            if "close" in od:
                for p in [p for p in self.positions if od["close"] in (None, p.id)]:
                    px = o - self.slippage if p.side > 0 else o + s + self.slippage
                    self._exit(p, px, t, "close")
                continue
            px = o + s + self.slippage if od["side"] > 0 else o - self.slippage
            self.balance -= self.commission_per_lot * od["lots"]
            self.positions.append(Position(od["id"], od["side"], od["lots"], px, t,
                                           od["sl"], od["tp"], od["tag"]))
        self.pending.clear()
        # 2) stops / targets (stop first if both touched)
        for p in list(self.positions):
            if p.side > 0:   # long exits at bid
                lo, hi, op = l, h, o
                sl_hit = p.sl is not None and lo <= p.sl
                tp_hit = p.tp is not None and hi >= p.tp
                if sl_hit:
                    self._exit(p, min(op, p.sl) - self.slippage, t, "sl")
                elif tp_hit:
                    self._exit(p, max(op, p.tp), t, "tp")
            else:            # short exits at ask
                lo, hi, op = l + s, h + s, o + s
                sl_hit = p.sl is not None and hi >= p.sl
                tp_hit = p.tp is not None and lo <= p.tp
                if sl_hit:
                    self._exit(p, max(op, p.sl) + self.slippage, t, "sl")
                elif tp_hit:
                    self._exit(p, min(op, p.tp), t, "tp")


class FundedNextChallenge:
    """FundedNext-style 2-step tracker ($25k default).
    Phase 1 target +8%, Phase 2 target +5% (balance, flat), min 5 trading days per phase.
    Daily loss: equity may not drop below 95% of the start-of-day balance
    (server day rolls 00:00 server time = 17:00 New York).
    Max loss: equity may not drop below 90% of the phase starting balance.
    Feed it every bar with update(time, balance, worst_equity, traded_this_bar)."""

    def __init__(self, size=25_000.0, targets=(0.08, 0.05), daily=0.05, max_loss=0.10,
                 min_days=5):
        self.size, self.targets, self.daily, self.max_loss, self.min_days = (
            size, targets, daily, max_loss, min_days)
        self.phase = 1
        self.status = "active"       # active | passed | failed
        self.reason = ""
        self.history = []
        self._reset_phase(None)

    def _reset_phase(self, t):
        self.phase_start = t
        self.day = None
        self.sod_balance = self.size
        self.trading_days: set = set()

    def update(self, t, balance: float, worst_equity: float, traded: bool = False,
               flat: bool = True) -> str:
        if self.status != "active":
            return self.status
        d = server_day(t)
        if d != self.day:
            self.day, self.sod_balance = d, balance
        if traded:
            self.trading_days.add(d)
        if worst_equity <= self.sod_balance * (1 - self.daily):
            return self._end("failed", f"daily loss on {d.date()} (phase {self.phase})", t)
        if worst_equity <= self.size * (1 - self.max_loss):
            return self._end("failed", f"max loss (phase {self.phase})", t)
        tgt = self.size * (1 + self.targets[self.phase - 1])
        if flat and balance >= tgt and len(self.trading_days) >= self.min_days:
            self.history.append(dict(phase=self.phase, start=self.phase_start, end=t,
                                     days=len(self.trading_days)))
            if self.phase == len(self.targets):
                return self._end("passed", "all phases passed", t)
            self.phase += 1
            self._reset_phase(t)
            return "next_phase"   # caller should reset account balance to `size`
        return self.status

    def _end(self, status, reason, t):
        self.status, self.reason = status, reason
        self.history.append(dict(phase=self.phase, start=self.phase_start, end=t,
                                 result=status, reason=reason))
        return status


def history(tf: str = "H1", start: str = "2015-01-01") -> pd.DataFrame:
    """All CLOSED candles of tf from `start` up to the clock (no forming candle)."""
    from sim import Sim
    clock = Sim().clock
    m1 = Feed().m1(_ts(start), clock)
    r = resample(m1, tf)
    if not r.empty and r["time"].iloc[-1] + pd.Timedelta(minutes=TF_MIN[tf]) > clock:
        r = r.iloc[:-1]
    return r.drop(columns="partial").reset_index(drop=True)
