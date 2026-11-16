"""Execute my written plan for rule A (London trend-follow) through sim.py only.
usage: python trade_a.py sell|buy|skip [--entry 08:00] [--exit 12:00] [--sl 40] [--risk 125] [--next 07:00]
Enters at market at entry time (UTC, today), closes at exit time, then advances to next weekday --next and prints the look."""
import subprocess, sys, re, argparse, datetime as dt
def sh(*a):
    r = subprocess.run([sys.executable, "sim.py", *a], capture_output=True, text=True); return r.stdout + r.stderr
p = argparse.ArgumentParser(); p.add_argument("side"); p.add_argument("--entry", default="08:00"); p.add_argument("--exit", default="12:00")
p.add_argument("--sl", type=float, default=40); p.add_argument("--risk", type=float, default=125); p.add_argument("--next", default="07:00")
p.add_argument("--tp", type=float, default=None)
p.add_argument("--london", action="store_true", help="--entry/--exit/--next are LONDON local times (converted to UTC for the sim)")
a = p.parse_args()
now = sh("now"); day = re.search(r"(\d{4}-\d\d-\d\d)", now).group(1)
def _utc(d, hhmm):
    """London local time on date d -> UTC HH:MM (the sim clock is UTC)."""
    from zoneinfo import ZoneInfo
    t = dt.datetime.fromisoformat(f"{d}T{hhmm}").replace(tzinfo=ZoneInfo("Europe/London")).astimezone(dt.timezone.utc)
    return t.strftime("%H:%M")
if a.london: a.entry, a.exit = _utc(day, a.entry), _utc(day, a.exit)
if a.side != "skip":
    print(sh("advance", "--until", f"{day}T{a.entry}").strip().splitlines()[-4:][0:2])
    bid = float(re.search(r"last price \(bid\): ([\d.]+)", sh("now")).group(1))
    lots = round(a.risk / (a.sl * 10), 2); sgn = 1 if a.side == "buy" else -1
    args = [a.side, str(lots), "--sl", f"{bid - sgn*a.sl*1e-4:.5f}"]
    if a.tp: args += ["--tp", f"{bid + sgn*a.tp*1e-4:.5f}"]
    print(sh(*args).strip())
    out = sh("advance", "--until", f"{day}T{a.exit}"); print("\n".join(l for l in out.splitlines() if re.search(r"fill|stop|sl|tp|clos|BREACH|END", l, re.I))[:600])
    print(sh("close").strip()[:300])
d = dt.date.fromisoformat(day) + dt.timedelta(days=1)
while d.weekday() >= 5: d += dt.timedelta(days=1)
if dt.date.fromisoformat(day).weekday() == 4:  # Friday: stop at the close first so the weekend is visible
    pass
out = sh("advance", "--until", f"{d}T{_utc(d, a.next) if a.london else a.next}"); print("\n".join(l for l in out.splitlines() if re.search(r"END|BREACH|balance", l)))
print(sh("trades").strip().splitlines()[-1] if a.side != "skip" else "")
