#!/usr/bin/env bash
# Agent guard: enforces docs/AGENT-RULES.md on every push. Claude builders work on claude/*
# branches and the watch agent on codex/*. Each failure prints WHY and the FIX.
set -uo pipefail
BRANCH="${GUARD_BRANCH:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"
BASE_REF="${GUARD_BASE:-origin/main}"
FP='05:66:9A:D2:72:1C:6A:BA:F9:FD:D4:B9:B8:4E:2F:B7:94:48:44:B1:DE:F3:59:84:5F:01:5F:2B:67:CA:F1:F5'
RULES='docs/AGENT-RULES.md'
fail=0; warnn=0
err()  { echo "::error title=$1::$2 FIX: $3 (see $RULES)"; fail=1; }
warn() { echo "::warning title=$1::$2 FIX: $3 (see $RULES)"; warnn=1; }

# Rule 1: one permanent signing identity (Huawei Wear Engine is registered to it).
if [ -f .github/workflows/build-apk.yml ]; then
  grep -q 'Sign with the permanent key and verify the fingerprint' .github/workflows/build-apk.yml \
    || err 'Signing step removed' 'build-apk.yml no longer re-signs the debug APK with the permanent key, so APKs get a random key and fail Huawei Wear Engine and in-place updates.' "restore the steps 'Decode the permanent signing key' and 'Sign with the permanent key and verify the fingerprint' from origin/main."
  grep -q "$FP" .github/workflows/build-apk.yml \
    || err 'Fingerprint changed' 'build-apk.yml no longer pins SHA-256 05:66:9A:...:F1:F5, the only key registered with Huawei (App ID 119100049).' 'restore EXPECTED_SHA256 exactly as on origin/main. Never rotate the key.'
fi
if [ -f .github/workflows/release-apk.yml ] && grep -q 'MARC_SIGNING_KEYSTORE_B64' .github/workflows/release-apk.yml; then
  grep -q "$FP" .github/workflows/release-apk.yml \
    || err 'Release fingerprint changed' 'release-apk.yml signs with MARC_SIGNING_* but does not pin 05:66:9A:...:F1:F5.' 'restore EXPECTED_SHA256 in the release signing step as on origin/main.'
fi

# Rule 2: public repo, no key material.
if grep -rEl 'MII[A-Za-z0-9+/]{100,}' .github/workflows >/dev/null 2>&1; then
  err 'Keystore committed' 'a base64 keystore is embedded in a workflow; the repo is public.' 'delete it and read keys only from repository secrets.'
fi
BAD=$(git ls-files | grep -iE '(^|/)agconnect-services\.json$|\.(jks|keystore|p12|pfx)$' || true)
[ -z "$BAD" ] || err 'Key file committed' "tracked key/credential files: $(echo $BAD | tr '\n' ' ')" 'git rm --cached them, add them to .gitignore, and rotate anything that was real.'

# Rule 3: file ownership between the two agents (compared with the merge base on main).
if git rev-parse --verify -q "$BASE_REF" >/dev/null; then
  MB=$(git merge-base HEAD "$BASE_REF")
  CHANGED=$(git diff --name-only "$MB" HEAD)
  case "$BRANCH" in
    codex/*)
      HIT=$(echo "$CHANGED" | grep -E '^(escobar-worker/|src/escobar/|src/brain/|docs/(REMEDIATION|QA-|qa/))' || true)
      [ -z "$HIT" ] || err 'Watch agent outside its files' "the watch branch changes files owned by the remediation work: $(echo $HIT | tr '\n' ' ')" 'revert these paths to origin/main; ask the owner if the watch needs a change there.'
      HIT=$(echo "$CHANGED" | grep -E '^src/(slices/workout/session\.ts|core/models\.ts|core/store\.ts)$' || true)
      [ -z "$HIT" ] || warn 'Gate B files touched' "session/models/store changed: $(echo $HIT | tr '\n' ' ')" 'only for Gate B, built on the R2.8 ids already on main (ActiveSession.id, entry id, set id, set status); no second id scheme.'
      ;;
    claude/*)
      HIT=$(echo "$CHANGED" | grep -E '^(native/wear/|src/native/wearEngine\.ts|src/slices/settings/WatchLab\.tsx)' || true)
      [ -z "$HIT" ] || err 'Claude builder in watch files' "this claude/* branch changes watch-owned files: $(echo $HIT | tr '\n' ' ')" 'revert these paths; they belong to codex/gt6-gate-a-watch-lab.'
      ;;
  esac
  BEHIND=$(git rev-list --count "HEAD..$BASE_REF" 2>/dev/null || echo 0)
  [ "$BEHIND" -eq 0 ] || warn 'Behind main' "this branch is $BEHIND commits behind main." "git fetch origin main && git merge origin/main (keep both sides; never drop the signing steps)."
else
  warn 'No main to compare' "$BASE_REF not fetched; ownership rules skipped." 'fetch origin/main.'
fi

[ $fail -eq 0 ] && echo "Agent guard passed for $BRANCH$( [ $warnn -eq 1 ] && echo ' (with warnings)')."
exit $fail
