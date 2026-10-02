# App rating against competitors

**Status: delivered to the owner** in chat on 2026-10-01 at about 03:46 UTC. It is a snapshot of `main` at `f1e514a`. It is not a task and nothing is waiting on it. Rate again before quoting the scores later: merge trains 1 to 5 have landed since (see `docs/supervisor/HANDOVER.md`, section 8).

## What it is

An honest rating of M/ARC as a product, built from two inputs that are kept here as files. The scores themselves were a chat message from the supervisor and exist only in this README (copied from that message).

| File | What it is |
|---|---|
| `rate-0.md` | Inventory of M/ARC on `main` at `f1e514a`, read from code: features users can use, what most gym apps have that M/ARC lacks, how it is built (stack, tests, CI gates, signing, size), release status. File paths cited for every claim. |
| `rate-1.md` | Competitor scan, Android focus, dated 2026-10-01: Hevy, Strong, Fitbod, JEFIT, Alpha Progression, Boostcamp, Gymshark Training, Future and the AI features of the big apps. Comparison table, top complaints, Philippines and Australia market signals, table stakes, what makes people pay, gaps a solo app could own, sources. Unverified items are marked **[unverified]**. |

## Method

One in-chat Workflow, `marc-rating`, ran two agents in parallel, both read-only:
1. **App inventory.** Reads `origin/main` and the audit docs, cites file paths, marks anything unconfirmed "not verified".
2. **Competitors.** Web research on primary sources: live Google Play pages, App Store pages for US, PH and AU prices, the newest App Store reviews, official help pages, market reports. Cites a URL for each fact. Play "most relevant" reviews lean positive, so complaints come mostly from App Store reviews. Prices are iOS prices; Android prices may differ.

The supervisor then scored the app from both reports. The workflow script is `docs/supervisor/workflows/marc-rating.js`. To redo the rating, rerun it (see that folder's README).

## The rating the owner received (at `f1e514a`)

**5.5 out of 10 as a product people can download. 8 out of 10 for the foundation underneath.** The gap: not on Google Play, 8 of 153 exercises have How-to sheets, and serious bugs were still being fixed.

| Area | Score |
|---|---|
| Logging workouts | 7 |
| Smart training (targets, recovery, readiness) | 7.5, could be 9 |
| AI coach (Escobar) | 8 |
| How-to and exercise guidance | 3 |
| Watch and health | 6 |
| Design and polish | 7 |
| Reach | 2 |
| Social | 0 |
| How it is built | 8 |
| Privacy and trust | 8 |

Rivals, supervisor's scores: Hevy 9, Alpha Progression 8, Boostcamp 8, Strong 7.5, Fitbod 7, JEFIT 7.

## What it says to do

1. Get on Google Play (the closed test of 12 testers for 14 days is the real starting line).
2. Match the basics: supersets, a plate calculator, fewer taps per set.
3. Keep the smart parts free (progression targets and the recovery model are paid elsewhere).
4. Plan the coach's cost before launch (daily cap exists; a cheaper model for easy questions or a paid tier are owner decisions, and the paid plan is parked).
5. Finish the library How-to (153 exercises; 8 done at the time).
6. No nagging, stable plans, ask about injuries (the top complaints about rivals).
7. Start with the Philippines (mostly Android, weak premium coaching apps); Australia needs iOS later.
8. Protect user data (data lives only on the phone unless backed up).

The supervisor's view: the app's brain (coach, targets, recovery) is ahead of most paid apps; its body (library coverage, store presence, everyday logging polish) is behind free ones. The quickest way to a real 8 is to finish the bugs, the How-to and the library, and launch on Play, not to add features.
