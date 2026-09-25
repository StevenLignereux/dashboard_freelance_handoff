# Workflow Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the approved request lifecycle so completion, archiving, mission creation/completion, and contact relationship transitions stay consistent.

**Architecture:** Keep the React store and repository interface as the application boundary. Implement matching behavior in the seed repository and atomic Supabase RPC functions for multi-row mission transitions; use a single request update for manual status changes and let the database enforce the one-active-request constraint. Update the request editor, status metadata, generated database types, and tests alongside their owning layers.

**Tech Stack:** React 18, TypeScript, Supabase JS/PostgreSQL, Vitest, Testing Library, ESLint.

**Spec:** `WORKFLOW_LIFECYCLE_SPEC.md`

## Global Constraints

- “`terminee` et `sans_suite` sont des statuts de clôture.”
- “Archiver reste une action distincte d’organisation : le drapeau `archived` est indépendant du statut et masque la demande du flux courant comme aujourd’hui.”
- “À la création d’une mission, passer la demande liée à `mission_confirmee`.”
- “À la première mission d’un contact, faire passer `prospect` à `client`.”
- “À la création d’une mission ultérieure, faire passer `client` ou `ancien_client` à `client_recurrent`.”
- “Quand une mission passe à `terminee`, terminer aussi la demande si toutes ses missions sont terminées.”
- “Les changements de statut automatiques ci-dessus doivent être enregistrés ensemble côté Supabase.”
- “Préserver les demandes et missions existantes; aucun changement destructif ou reclassement historique automatique.”

## Review Focus

- Reopening when another request is already active: reject the transition without changing status or active pointer; test both repository implementations.
- Completing a mission when another mission for its request remains open: keep the request confirmed; test both repositories.
- Creating a mission for a terminal, archived, or mismatched request/contact pair: reject before insertion; test both repositories and the modal error state.
- Duplicate or retried create-mission RPC calls: ensure one RPC call creates one mission and all lifecycle writes commit or roll back together; test repository RPC arguments and SQL transaction behavior.
- Existing `ancien_client` with zero missions due historical/imported data: transition to recurrent only after the first newly created mission; test relationship mapping and store refresh.

---

### Task 1: Add lifecycle status contract and presentation

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/tokens/design-tokens.ts`
- Modify: `src/lib/supabase/database.types.ts`
- Modify: `src/data/mappers/index.ts`
- Test: `src/components/ui/StatusBadge.test.tsx`
- Test: `src/data/mappers/index.test.ts`

**Interfaces:**
- Produces `RequestStatus` with terminal value `terminee`, and `statusMeta.terminee` for the existing `StatusBadge` API.
- Database mapping remains exhaustive: each generated `request_status` maps to exactly one application `RequestStatus`.

- [x] **Step 1: Add failing status rendering and mapping tests**

Add a badge test asserting a request with status `terminee` renders the French label `Terminée`; add a mapper test asserting DB status `terminee` maps to application status `terminee`.

- [x] **Step 2: Run those tests and confirm they fail**

Run: `npm test -- --run src/components/ui/StatusBadge.test.tsx src/data/mappers/index.test.ts`
Expected: the status type/metadata or mapping rejects the new value.

- [x] **Step 3: Add the status type, metadata, and generated enum value**

Add `| 'terminee'` to `RequestStatus`; add a `statusMeta.terminee` entry labelled `Terminée`; add `terminee` to both generated enum tuple/type locations; add the exhaustive DB-to-app map entry.

- [x] **Step 4: Run the focused tests and typecheck**

Run: `npm test -- --run src/components/ui/StatusBadge.test.tsx src/data/mappers/index.test.ts`
Run: `npm run typecheck`
Expected: both commands pass.

### Task 2: Add status editing and active-request transitions to repository contract

**Files:**
- Modify: `src/data/repositories/interface.ts`
- Modify: `src/data/repositories/seedRepository.ts`
- Test: `src/data/repositories/seedRepository.test.ts`

**Interfaces:**
- `UpdateRequestInput` gains `status?: Request['status']`.
- Seed `updateRequest(requestId, input)` updates status and derived contact `activeRequestId`; terminal statuses are `terminee` and `sans_suite`.

- [x] **Step 1: Add failing seed tests for close, reopen, and blocked reopen**

Test that setting `terminee` clears `activeRequestId` but preserves `archived: false`; setting a nonterminal status restores `activeRequestId` when no other active request exists; reopening while another request is active rejects and leaves both records unchanged.

- [x] **Step 2: Run the seed repository tests and confirm the new assertions fail**

Run: `npm test -- --run src/data/repositories/seedRepository.test.ts`
Expected: status updates are currently ignored and active pointers are unchanged.

- [x] **Step 3: Implement seed request status transitions**

Add the optional status to `UpdateRequestInput`. In seed `updateRequest`, validate a requested reopen against another nonarchived request for the same contact whose status is not terminal, then update request status and synchronize the contact pointer. Keep title/description behavior unchanged.

- [x] **Step 4: Run the seed repository tests**

Run: `npm test -- --run src/data/repositories/seedRepository.test.ts`
Expected: PASS, including the new transition cases.

### Task 3: Persist request status transitions in Supabase

**Files:**
- Modify: `src/data/repositories/supabaseRepository.ts`
- Test: `src/data/repositories/supabaseRepository.test.ts`

**Interfaces:**
- Supabase `updateRequest` persists `status`; a database trigger derives `is_active` from status and archive state, and the returned request has refreshed active-request derivation.
- The unique partial index remains the final concurrency guard for reopening.

- [x] **Step 1: Add failing repository tests for close and reopen payloads**

Assert status `terminee` sends `{ status: 'terminee', is_active: false }`, a nonterminal status sends `is_active: true`, and a unique-index conflict is surfaced without returning a successful update.

- [x] **Step 2: Run focused Supabase repository tests and confirm failures**

Run: `npm test -- --run src/data/repositories/supabaseRepository.test.ts`
Expected: current implementation strips status and `is_active` from the patch.

- [x] **Step 3: Implement status persistence and conflict errors**

Allow only the requested `status` through the update patch; derive `is_active` from `!archived && status !== 'terminee' && status !== 'sans_suite'`. Preserve existing archive fields and reload/map contact derivations after the request update. Convert a unique-index conflict into a clear “another active request exists” error.

- [x] **Step 4: Run focused Supabase repository tests**

Run: `npm test -- --run src/data/repositories/supabaseRepository.test.ts`
Expected: PASS, including existing field-preservation cases.

### Task 4: Add atomic database lifecycle operations

**Files:**
- Create: `supabase/migrations/20260925000000_add_request_terminee_status.sql`
- Create: `supabase/migrations/20260925000100_request_mission_lifecycle.sql`
- Modify: `src/lib/supabase/database.types.ts`
- Test: `src/data/repositories/supabaseRepository.test.ts`
- Test: `supabase/tests/request_mission_lifecycle.test.sql` (if the repository's local pgTAP setup is available; otherwise document the unavailable runner and validate migration SQL statically)

**Interfaces:**
- RPC `create_mission_with_lifecycle(p_request_id uuid, p_contact_id uuid, p_title text, p_status mission_status, p_progress integer, p_notes text)` returns the inserted `missions` row.
- RPC `update_mission_with_lifecycle(p_mission_id uuid, p_title text, p_update_title boolean, p_status mission_status, p_update_status boolean, p_progress integer, p_update_progress boolean, p_notes text, p_update_notes boolean)` returns the updated `missions` row.
- Both RPCs run as invoker, require `auth.uid()`, and perform all lifecycle writes in one transaction under RLS.

- [x] **Step 1: Add failing RPC invocation tests**

Assert create calls `create_mission_with_lifecycle` with all input fields and update calls `update_mission_with_lifecycle`; assert database errors are returned as failures and no local successful result is fabricated.

- [x] **Step 2: Run focused Supabase repository tests and confirm failures**

Run: `npm test -- --run src/data/repositories/supabaseRepository.test.ts`
Expected: current repository inserts or updates the mission table directly and makes no RPC call.

- [x] **Step 3: Add the new enum value in its own migration**

Write `ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'terminee';` as the only statement in the first migration. Keeping this enum change in its own migration ensures the new value is committed before a later migration's function bodies refer to it.

- [x] **Step 4: Write SQL lifecycle functions in the next migration**

Add a before-insert/status-or-archive-update trigger on `requests` that derives `is_active` from `NOT archived AND status NOT IN ('terminee','sans_suite')`; backfill existing terminal or archived requests to inactive. In create RPC, lock and validate the request/contact, reject terminal or archived requests, insert the mission, set request status to `mission_confirmee`, and update relationship to `client` for a prospect with no prior missions or `client_recurrent` when work already exists (also promote an `ancien_client` after new work). In update RPC, preserve omitted fields with explicit update booleans (so `p_update_notes=true, p_notes=null` clears notes), and when status becomes `terminee`, set the request to `terminee` only if no linked mission remains nonterminal. Keep functions `SECURITY INVOKER`, validate the authenticated owner, and grant execution only to `authenticated`.

- [x] **Step 5: Route repository mission writes through the RPCs**

Replace direct mission insert/update in `supabaseRepository.ts` with the RPC calls, preserve `mapMission`, and update generated `Functions` types for both RPC signatures.

- [x] **Step 6: Verify the migration and repository tests**

Run: `npm test -- --run src/data/repositories/supabaseRepository.test.ts`
Run: `supabase test db` when Supabase CLI/Docker are available.
Expected: repository tests pass; SQL checks prove success commits every row update and rejected requests do not create a mission. If DB tests cannot run, report that limitation explicitly.

### Task 5: Mirror mission lifecycle rules in the seed repository

**Files:**
- Modify: `src/data/repositories/seedRepository.ts`
- Test: `src/data/repositories/seedRepository.test.ts`

**Interfaces:**
- Seed `createMission` validates request/contact ownership relation, rejects terminal or archived requests, confirms the request, and updates the contact relationship consistently.
- Seed `updateMission` completes the request only after its final open mission completes.

- [x] **Step 1: Add failing seed tests for mission-driven transitions**

Cover first mission prospect-to-client, later mission client-to-recurrent, `ancien_client` promotion after new work, archived/terminal request rejection, completion with another open mission, and final-mission completion.

- [x] **Step 2: Run seed tests and confirm failures**

Run: `npm test -- --run src/data/repositories/seedRepository.test.ts`
Expected: current seed mission methods only mutate the mission list/record.

- [x] **Step 3: Implement in-memory lifecycle changes**

Validate before mutation; keep a pre-insert mission count for relationship transitions; update the request and contact together with mission creation; on mission completion count all linked missions after applying the proposed status and close the request only when all are `terminee`.

- [x] **Step 4: Run seed repository tests**

Run: `npm test -- --run src/data/repositories/seedRepository.test.ts`
Expected: PASS across both existing and lifecycle cases.

### Task 6: Keep application state synchronized after lifecycle writes

**Files:**
- Modify: `src/store/AppStore.tsx`
- Test: `src/store/AppStore.test.tsx`

**Interfaces:**
- Store methods continue returning `Mission`/`Request` and update requests, missions, contact relationship, counts, and `activeRequestId` only after repository success.

- [x] **Step 1: Add failing store tests for success and persistence failure**

Assert request close clears the contact active pointer; mission creation updates request status, contact relationship, mission list and count; mission completion updates request status and pointer when the repository returns the completed lifecycle state; rejection leaves every store collection unchanged.

- [x] **Step 2: Run focused store tests and confirm failures**

Run: `npm test -- --run src/store/AppStore.test.tsx`
Expected: current callbacks update only a subset of affected collections.

- [x] **Step 3: Update store collections from repository results**

After each successful mutation, apply all returned authoritative entities. Where repository APIs return only the changed row, derive the same request/contact transition from the already-loaded store state and returned mission; keep all setters after the awaited repository call so failures cannot optimistically mutate state.

- [x] **Step 4: Run focused store tests**

Run: `npm test -- --run src/store/AppStore.test.tsx`
Expected: PASS, including failure atomicity assertions.

### Task 7: Expose request status editing and explain terminal requests in the UI

**Files:**
- Modify: `src/components/request/RequestEditModal.tsx`
- Modify: `src/components/contact/ContactCardModal.tsx`
- Modify: `src/components/mission/MissionCreateModal.tsx`
- Modify: `src/pages/RequestsPage.tsx`
- Test: `src/components/request/RequestEditModal.test.tsx`
- Test: `src/components/contact/ContactCardModal.test.tsx`
- Test: `src/components/mission/MissionCreateModal.test.tsx`
- Test: `src/pages/RequestsPage.test.tsx`

**Interfaces:**
- Request editor submits `status` through existing `updateRequest`.
- Terminal requests remain in the Requests page with their status badge and have no mission-creation action.
- Mission creation displays repository validation errors and does not close as though a mission were created.

- [x] **Step 1: Add failing UI tests**

Verify status can be selected and submitted in the request editor; terminal requests remain listed without the create-mission button; attempting mission submission on a stale terminal/archived request shows the repository error and keeps the modal open; success still closes once.

- [x] **Step 2: Run focused UI tests and confirm failures**

Run: `npm test -- --run src/components/request/RequestEditModal.test.tsx src/components/contact/ContactCardModal.test.tsx src/components/mission/MissionCreateModal.test.tsx src/pages/RequestsPage.test.tsx`
Expected: the editor has no status control and mission availability/error behavior is not covered.

- [x] **Step 3: Implement the status control and lifecycle affordances**

Add a select using all `RequestStatus` labels, initialized from the current request and included in submit. Hide `onCreateMission` for terminal requests. Keep terminal records visible and show the existing badge. In mission creation, rely on repository validation for stale screens and render its error without closing the modal.

- [x] **Step 4: Run focused UI tests**

Run: `npm test -- --run src/components/request/RequestEditModal.test.tsx src/components/contact/ContactCardModal.test.tsx src/components/mission/MissionCreateModal.test.tsx src/pages/RequestsPage.test.tsx`
Expected: PASS.

### Task 8: Full deterministic verification and review

**Files:**
- Review: all files listed in Tasks 1–7.

**Interfaces:**
- No additional API changes. Final state must satisfy every acceptance criterion in `WORKFLOW_LIFECYCLE_SPEC.md`.

- [x] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: all tests pass.

- [x] **Step 2: Run typecheck, lint, and production build**

Run: `npm run typecheck`
Run: `npm run lint`
Run: `npm run build`
Expected: all commands exit successfully.

- [x] **Step 3: Inspect the final diff and database migration**

Run: `git diff --check`
Run: `git diff --stat`
Review all changed files against the spec, confirm no unrelated changes or generated cache artifacts are included, and report any unavailable local PostgreSQL verification precisely.
