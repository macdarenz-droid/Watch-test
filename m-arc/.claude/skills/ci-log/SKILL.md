---
name: ci-log
description: Read a failing GitHub Actions run or job and return only its exact failing lines. Use it instead of reading a whole CI log in the main context.
argument-hint: "[run or job URL]"
context: fork
agent: general-purpose
model: claude-sonnet-5
background: false
---

Read the failing CI run or job at $ARGUMENTS in the `macdarenz-droid/m-arc` repository, using the GitHub tools (for example `actions_get` and `get_job_logs` with only the failed jobs).

Return the job URL, the failing step's name and the exact error lines, quoted word for word with their log line numbers. Do not suggest a fix.
