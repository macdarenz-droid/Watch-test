"""Evening booking for a paper day: every number is read from a tool or a file by this command (September goal).
usage: python bt/book_day.py DAY NEXT WEEKFILE "walk text" "feel text" PH_RANGE"""
import sys, re, subprocess
DAY, NXT, W, WALK, FEEL, PHR = sys.argv[1:7]; PHR = float(PHR)
run = lambda c: subprocess.run(c.split(), capture_output=True, text=True).stdout
def sub(p, a, b):
    s = open(p).read(); assert s.count(a) == 1, (p, a); open(p, "w").write(s.replace(a, b, 1)); print("ok", p)
def app(p, r):
    open(p, "a").write(r + "\n"); L = open(p).read().splitlines(); print(p, len(L), "lines | last:", L[-1][:70])
cc = [l.split() for l in run(f"python bt/coin_control.py {NXT} --check {DAY}").splitlines() if l.startswith(DAY)]
mine = [r for r in cc if r[-1] == "True"][0]; oth = [r for r in cc if r[-1] == "False"][0]
R, Ro, side, stopped = float(mine[2]), float(oth[2]), int(mine[1]), mine[3] == "True"
rec = open("journal/A2-paper-record.md").read().splitlines(); prev = float(rec[-1].split("|")[5]); n = int(re.search(r"\((\d+)\)", rec[-1]).group(1)) + 1
nc = run(f"python bt/no_chase_hour.py {NXT} check {DAY}").splitlines()[-1].split(); hour = float(nc[3])
ncskip = hour >= 15; nc0 = hour <= -15
ym = run(f"python bt/ym_forward.py {NXT} forward 2015-08-31").splitlines(); yl = [l for l in ym if l.startswith(DAY)][0]; ys = ym[-1]
en = run(f"python bt/en2_forward.py 2015-08-28 {NXT}").strip().splitlines()[-1]
mo = [l for l in run(f"python bt/side_monitor.py {NXT} --state").splitlines() if l.startswith(("MO1", "MO3"))]
mv = [float(re.search(r"= ([+-]\d\.\d+)R", m).group(1)) for m in mo]
import glob
wk = sorted(glob.glob("journal/2015-W*-funded.md"), key=lambda p: int(re.search(r"W(\d+)", p).group(1))); i_ = wk.index(W)
s = "".join(open(p).read() for p in wk[max(0, i_ - 1):i_ + 1])  # previous week + this week, so running tallies carry over
gap5 = float(re.findall(r"5-day gap ([+-]?\d+\.\d+)", s)[-1]); un_dis = (side > 0) != (gap5 > 0)
un = re.findall(r"disagree days ([+-]\d+\.\d+)R in (\d+)", s)[-1]
ag = re.findall(r"agree days ([+-]\d+\.\d+)R in (\d+)", s); ag = [a for a in ag][-1] if ag else None
lv = re.findall(r"(\d+) lively ([+-]\d+\.\d+)R", s)[-1]; qu = re.findall(r"(\d+) quiet ([+-]\d+\.\d+)R; PH2 about ([+-]\d+\.\d+)R against A2's ([+-]\d+\.\d+)R", s)[-1]
moa = float(re.findall(r"A2 [+-]\d\.\d+R \(running ([+-]\d+\.\d+)R\)", s)[-1]); mday = int(re.findall(r"MO PAPER RULE \(day (\d+)", s)[-1]) + 1
phd = int(re.findall(r"PH2 \(day (\d+)\)", s)[-1]) + 1; und = int(re.findall(r"UN3 \w+ \(day (\d+)\)", s)[-1]) + 1
lively = PHR >= 30; ph_r = R / 2 if lively else R
lvn, lvr = (int(lv[0]) + 1, float(lv[1]) + R) if lively else (int(lv[0]), float(lv[1]))
qun, qur = (int(qu[0]), float(qu[1])) if lively else (int(qu[0]) + 1, float(qu[1]) + R)
un_line = f"UN3 DISAGREED (day {und}): disagree days {float(un[0]) + R:+.2f}R in {int(un[1]) + 1}" if un_dis else f"UN3 agreed (day {und}): disagree days {float(un[0]):+.2f}R in {un[1]}"
how = "STOPPED" if stopped else "clock exit"
app(W, f"""{WALK}
  -> {DAY[5:]} result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor under the gate -> paper). VALID: no order placed. Trade mistakes 0; process mistakes 0.
     PAPER A2, day {n} (engine, costs on 1.0 + 0.1; coin_control): {'buy' if side > 0 else 'sell'}, {how}, {R:+.2f}R; the other side {Ro:+.2f}R. Running from 07-08: {n} days, {prev + R:+.2f}R.
     NC1 FORWARD (tool): hour {hour:+.1f} signed by A2 -> {'SKIP' if ncskip else 'kept'}; NC0 {'yes' if nc0 else 'no'}.
     YM1 FORWARD (tool): {yl}
       {ys}
     EN2 FORWARD (tool): {en}
     Paper lines: {un_line}. PH2 (day {phd}): {'lively' if lively else 'quiet'} ({PHR}) -> {'half' if lively else 'full'} = {ph_r:+.2f}R;
     {lvn} lively {lvr:+.2f}R; {qun} quiet {qur:+.2f}R; PH2 about {float(qu[2]) + ph_r:+.2f}R against A2's {float(qu[3]) + R:+.2f}R.
     MO PAPER RULE (day {mday} of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 {R:+.2f}R (running {moa + R:+.2f}R).
     For the next day (tool): MO1 {mv[0]:+.3f}R; MO3 {mv[1]:+.3f}R -> {'paper' if max(mv) < 0.60 else 'GATE CHECK'}.
     How it feels: {FEEL}""")
app("journal/A2-paper-record.md", f"| {run('date -d '+DAY+' +%a').strip()} {DAY} ({n}) | {'buy' if side > 0 else 'sell'} | {R:+.2f} | {Ro:+.2f} | {prev + R:+.2f} | {'stopped' if stopped else 'clock exit'}; monitor after the day {mv[0]:+.3f}R |")
y1 = float(re.search(r"YM1 ([+-]\d\.\d+)R", yl).group(1)); y0 = float(re.search(r"YM0 ([+-]\d\.\d+)R", yl).group(1)); yst = float(re.search(r"stressed ([+-]\d\.\d+)R", yl).group(1))
ysd = int(re.search(r"YM1 side ([+-]\d)", yl).group(1)); ysum = float(re.search(r"net ([+-]\d+\.\d+)", ys).group(1))
app("journal/YM-forward-record.md", f"| {run('date -d '+DAY+' +%a').strip()} {DAY} | {ysd:+d} | {side:+d} | {'agree' if ysd == side else 'DISAGREE'} | {y1:+.2f} | {y0:+.2f} | {yst:+.2f} | {ysum:+.2f} |")
nsk = len([l for l in open("journal/NC1-forward-record.md") if "SKIP" in l and l.startswith("| ")]) + (1 if ncskip else 0)
app("journal/NC1-forward-record.md", f"| {run('date -d '+DAY+' +%a').strip()} {DAY} | {side:+d} | {hour:+.1f} | {'SKIP ('+str(nsk)+' of 30)' if ncskip else 'kept'} | {'yes' if nc0 else 'no'} | {R:+.2f} |")
t = open("journal/FUNDED-TRACKER.md").read(); m = re.search(r"A2 paper \d+ days [+-]\d+\.\d+R \(after (?:\w+ )?\d\d-\d\d; monitor for \d\d-\d\d [+-]\d\.\d+R;", t)
sub("journal/FUNDED-TRACKER.md", m.group(0), f"A2 paper {n} days {prev + R:+.2f}R (after {DAY[5:]}; monitor for {NXT[5:]} {mv[0]:+.3f}R;")
st = open("STATE.md").read(); m = re.search(r"\| Sim clock \| \w+ 2015-\d\d-\d\d 21:00 UTC", st)
sub("STATE.md", m.group(0), f"| Sim clock | {run('date -d '+DAY+' +%a').strip()} {DAY} 21:00 UTC")
m = re.search(r"on track at day \d+: MO1 0\.00R vs A2 [+-]\d+\.\d+R", st); sub("STATE.md", m.group(0), f"on track at day {mday}: MO1 0.00R vs A2 {moa + R:+.2f}R")
m = re.search(r"; for (\d\d-\d\d): ([+-]\d\.\d+)R\)", st); sub("STATE.md", m.group(0), f"; {m.group(1)}: {m.group(2)}R; for {NXT[5:]}: {mv[0]:+.3f}R)")
print("script reached its end")
