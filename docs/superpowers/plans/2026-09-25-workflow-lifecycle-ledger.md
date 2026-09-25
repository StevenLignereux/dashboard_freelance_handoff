# Workflow Lifecycle Execution Ledger

- BASE: 3c5a064a1c6f48c59c785f10b7bedb6aba48e4c8
- Branch: codex/workflow-lifecycle
- Worktree: C:\Users\devil\.codex\worktrees\workflow-lifecycle\dashboard_freelance_handoff
- Baseline: `npm test` — 23 files, 261 tests passed.
- Task 1: complete — new request status, badge, and DB mapper; targeted tests 17/17, typecheck passed.
- Task 2: complete — seed close/reopen rules and `UpdateRequestInput.status`; repository tests 87/87 passed.
- Task 3: complete — Supabase status updates persist through the repository; unique-index conflicts return a clear active-request error; repository tests passed.
- Task 4: complete — additive enum migration, derived-active trigger, and invoker RPCs for atomic mission lifecycle writes; Supabase repository tests passed; local pgTAP passed 21/21.
- Task 5: complete — seed request/contact transitions mirror Supabase; targeted seed and store tests passed.
- Task 6: complete — store updates requests, missions, contact relationship/count and active pointer only after persistence succeeds; targeted tests passed.
- Task 7: complete — request status editor, terminal request visibility/action availability, and stale mission-create error behavior are covered by UI tests.
- Final verification: `npm test -- --run` — 25 files / 287 tests passed; `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and local pgTAP (21/21) passed.
- Concurrency review finding: lock the parent request before locking/updating its mission in `update_mission_with_lifecycle`; a controlled two-session PostgreSQL run completed both last missions concurrently and returned `terminee:0` (terminal request, zero open missions).
- Spec edge case: mission creation always confirms its request, even when the submitted mission is already terminal; seed, store, and SQL integration tests cover this behavior.
- Fresh whole-branch review after those fixes: no actionable findings.
- Ruling: derive `requests.is_active` in a database trigger instead of sending a client-derived boolean — the repository does not load `archived`, and a client-computed value could reactivate an archived request; cost if wrong: trigger adds a database invariant that must be validated in local PostgreSQL.
