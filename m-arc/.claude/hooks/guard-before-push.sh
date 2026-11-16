#!/usr/bin/env bash
# PreToolUse(Bash) hook (WF-2, change 5): runs the Agent guard before any `git push`.
# Exit 2 blocks the push and its stderr reaches the agent; any other exit lets it through.
# The CI guard (.github/scripts/agent-guard.sh) stays the final check: this hook only sees
# pushes run as shell commands. Each push is checked in its own directory (the hook input's
# `cwd`, then any `cd X` or `git -C X` in the command), so pushes from worktrees are covered.
set -uo pipefail

note() {  # exit 0, but tell the agent (stderr on exit 0 reaches only the debug log)
  local msg=${1//\\/\\\\}; msg=${msg//\"/\\\"}; msg=${msg//$'\n'/ }
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"%s"}}\n' "$msg"
  exit 0
}
block() { echo "Push refused by .claude/hooks/guard-before-push.sh: $1" >&2; exit 2; }

input=$(cat)
case "$input" in *push*) ;; *) exit 0;; esac
command -v python3 >/dev/null 2>&1 \
  || note 'guard-before-push hook could not check this command: python3 is missing. If it pushes, run bash .github/scripts/agent-guard.sh yourself first; the CI guard still runs.'

# Prints "BLOCK<TAB>reason" or one "PUSH<TAB>dir" line per real push; nothing otherwise.
plan=$(HOOK_INPUT="$input" python3 - <<'PY'
import json, os, re, shlex, subprocess
PROTECTED = {"main", "claude/escobar-v2-implementation-eidx64"}
data = json.loads(os.environ["HOOK_INPUT"])
cmd = (data.get("tool_input") or {}).get("command") or ""
cwd = data.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

def branch(d):
    r = subprocess.run(["git", "-C", d, "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True)
    return r.stdout.strip()

def stop(reason):
    print("BLOCK\t" + reason); raise SystemExit

pushes = []
for seg in re.split(r"&&|\|\||[;|\n]", cmd):
    try:
        words = shlex.split(seg)
    except ValueError:
        words = seg.split()
    while words and words[0].startswith("("):  # (cd x && git push)
        words[0] = words[0][1:]
        if not words[0]:
            words = words[1:]
    if not words:
        continue
    if words[0] == "cd":
        target = words[1] if len(words) > 1 else "~"
        cwd = os.path.normpath(os.path.join(cwd, os.path.expanduser(target)))
        continue
    if words[0] != "git":
        continue
    d, words = cwd, words[1:]
    while words and words[0].startswith("-"):  # git -C dir / -c k=v push
        if words[0] == "-C" and len(words) > 1:
            d = os.path.normpath(os.path.join(d, os.path.expanduser(words[1])))
        words = words[2:] if words[0] in ("-C", "-c") else words[1:]
    if not words or words[0] != "push":
        continue
    current, positional = branch(d), []
    for a in words[1:]:
        if a == "--all":
            stop("--all can push main; push your own branch by name")
        if a in ("-f", "--force", "--mirror") or a.startswith(("--force-with-lease", "--force-if-includes")) \
                or re.fullmatch(r"-[a-zA-Z]*f[a-zA-Z]*", a):
            stop(f"force-push ({a}) is not allowed")
        if not a.startswith("-"):
            positional.append(a)
    for r in positional[1:] or [current]:
        if r.startswith("+"):
            stop(f"force-push refspec ({r}) is not allowed")
        dst = r.split(":", 1)[1] if ":" in r else r
        dst = current if dst == "HEAD" else dst
        dst = dst.removeprefix("refs/heads/")
        if dst in PROTECTED:
            stop(f"pushing to {dst} is never allowed; open a pull request instead")
    if d not in pushes:
        pushes.append(d)
for d in pushes:
    print("PUSH\t" + d)
PY
) || note 'guard-before-push hook could not parse this command. If it pushes, run bash .github/scripts/agent-guard.sh yourself first; the CI guard still runs.'

[ -n "$plan" ] || exit 0
reason=$(printf '%s\n' "$plan" | awk -F'\t' '$1=="BLOCK"{print $2}')
[ -z "$reason" ] || block "$reason"

notes=''
while IFS=$'\t' read -r kind dir; do
  [ "$kind" = PUSH ] || continue
  top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || continue
  guard="$top/.github/scripts/agent-guard.sh"
  [ -f "$guard" ] || continue
  # The guard compares with origin/main, and a checkout may be shallow, so fetch it first.
  git -C "$top" fetch -q --no-tags origin +main:refs/remotes/origin/main 2>/dev/null
  out=$(cd "$top" && bash "$guard" 2>&1) || block "the Agent guard failed in $top (read docs/AGENT-RULES.md):
$out"
  # If there is no merge base, the guard's watch-file check silently compares nothing.
  git -C "$top" merge-base HEAD origin/main >/dev/null 2>&1 \
    || notes+="Agent guard ran before this push in $top, but its watch-file check was skipped: git merge-base HEAD origin/main failed (shallow or unrelated history). The CI guard still runs on the pushed commit. "
done <<< "$plan"
[ -z "$notes" ] || note "$notes"
exit 0
