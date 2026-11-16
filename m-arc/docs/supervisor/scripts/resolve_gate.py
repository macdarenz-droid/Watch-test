# resolve_gate.py: resolves "keep both" conflicts in scripts/screenshot-gate.mjs, where two branches each appended a gate block at the same spot.
# Usage, from the repo root of the conflicted worktree:
#   python3 docs/supervisor/scripts/resolve_gate.py                  # resolve the block conflicts in place
#   python3 docs/supervisor/scripts/resolve_gate.py --check <side>... # after resolving: the add-only check against each side
# Resolve: for each conflict (any ">>>>>>> <label>": origin/main in a catch-up, the PR's SHA in a train) it writes the HEAD block,
# the shared closing lines (up to the first line that is exactly "}"), then the other block, then the rest. It leaves a conflict on
# the final "Screenshot gate PASS" summary line for hand resolution (HANDOVER 6.8 step 4) and exits 1 while any conflict is left.
# Check: against each side, the only allowed removed line is that side's old summary line, and each of its phrases must appear in the
# new summary line. Prints OK and exits 0, or prints each bad line and exits 1. Then run node --check on the file as well.
import re, subprocess, sys

P = 'scripts/screenshot-gate.mjs'
SUMMARY = "console.log('Screenshot gate PASS"


def phrases(line):
    body = line.split('PASS: ', 1)[1].rsplit("');", 1)[0]
    return [x.strip().rstrip('.') for x in body.split(', and ')]


if sys.argv[1:2] == ['--check']:
    new = [l for l in open(P).read().split('\n') if l.startswith(SUMMARY)]
    ok = len(new) == 1
    if not ok:
        print(f'{len(new)} summary lines; there must be exactly one')
    for side in sys.argv[2:]:
        diff = subprocess.run(['git', 'diff', side, '--', P], capture_output=True, text=True, check=True).stdout
        for l in diff.split('\n'):
            if not l.startswith('-') or l.startswith('---'):
                continue
            l = l[1:]
            if new and l.startswith(SUMMARY) and all(x in new[0] for x in phrases(l)):
                continue
            print(f'{side}: removed line: {l[:120]}')
            ok = False
    print('OK' if ok else 'FAIL')
    sys.exit(0 if ok else 1)

s = open(P).read()
END = re.compile(r'^>>>>>>> [^\n]*\n', re.M)
pos = 0
while True:
    a = s.find('<<<<<<< HEAD\n', pos)
    if a < 0:
        break
    b = s.index('=======\n', a)
    m = END.search(s, b)
    c, e = m.start(), m.end()
    head = s[a + 13:b]
    theirs = s[b + 8:c]
    rest = s[e:]
    if head.lstrip().startswith(SUMMARY):
        pos = e  # the summary line: resolve it by hand
        continue
    closer = []
    for ln in rest.split('\n'):
        closer.append(ln)
        if ln == '}':
            break
    s = s[:a] + head + '\n'.join(closer) + '\n' + '\n' + theirs + rest
    pos = a
open(P, 'w').write(s)
sys.exit(1 if '<<<<<<< ' in s else 0)
