# The hourly tick

The hourly Routine's prompt is "Run the tick in the supervisor skill." Everything already written in `SKILL.md` still applies; this is the order to do it in.

Every tick, work from live state, never from memory or from the message that woke you:
1. Read the tracker, the open PRs and every running builder's session status.
2. Do the tracker sweep in SKILL.md. Also start every `ready` card whose `depends_on` are all done, in parallel when they are independent.
3. A builder has stalled when all of these hold: its card is `running`; its session is idle; it has pushed and commented nothing since the last tick; and its HANDOFF "Waiting on" is nothing, or something that has already happened (the CI run finished, the supervisor already replied). If it is waiting on you, answer it this tick. For a stalled builder:
   - check whether your last one-shot message reached it (`list_triggers` with `include_completed: true`, then read that Routine's last run). If it reached the builder, send one new message. If it failed, retry once now with a new one-shot Routine. If the trigger service itself fails, post the instruction on the builder's PR as a comment, and retry the Routine next tick;
   - if it still has not moved at the next tick, archive it, then start a fresh builder from its HANDOFF.
4. Subscribe to activity on every open PR, so a green check or a comment wakes you straight away.
5. When a CI run fails, run `/ci-log`. Open the full log before any code change based on it.
6. When something slipped through that a rule would have caught, add one line to `gotchas.md` naming the incident.
7. Merge through a merge train (since 2026-10-01) when one or more PRs have their final PASS and a frozen head. Follow `docs/supervisor/HANDOVER.md` 6.8 step by step; it is the only full description of a train.
8. Every merge train carries a handover update: `docs/supervisor/HANDOVER.md` section 8 re-captured live (merged, left, parked, important) plus any new decision, ruling or gotcha, as one row of the train (HANDOVER section 11). If no train has carried one for 3 hours, push the update on its own.

Send at most one message per builder per tick, and archive the original before starting its replacement, so two builders never push to one card.
