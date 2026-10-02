# Sending the APK after a merge

After a merge, find that commit's green build. Confirm the step "Sign with the permanent key and verify the fingerprint" passed. Then send one message:

"New test build `<commit>`: <link>. What changed for you: • <'You will notice' line> (#PR) … Needs a check on your phone: <items or 'nothing'>."

Include every PR merged since the last APK you sent. Then set `last APK sent: <commit>` in Relay `PROJECT_STATE.md`, which is where the next message starts from.
