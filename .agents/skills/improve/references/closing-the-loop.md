# Closing the Loop — execute, reconcile, issues

The advisor's job doesn't end at the plan. This file covers the three follow-through flows: dispatching an executor and reviewing its work (`execute`), keeping the plan backlog alive (`reconcile`), and publishing plans where work gets picked up (`--issues`).

The founding rule survives unchanged: **the advisor never edits source code.** In `execute`, a *separate executor subagent* edits code. The advisor dispatches, reviews, and renders a verdict — like a tech lead who doesn't push commits to your branch.

---

## `execute <plan>` — dispatch and review

### Preconditions (check all before dispatching)

- The plan file exists and its dependencies show DONE in `plans/README.md`. If not: stop, name the missing dependency.
- Run the plan's drift check yourself. If in-scope files changed since `Planned at`, reconcile the plan first (see below) — don't hand a stale plan to an executor.
- Confirm the plan is ready for execution and that the executor can edit the files listed in scope.
- Confirm `wt` and `gt` are available (`wt --help`, `gt --version`) and the repository's worktrunk hooks are approved for automation. Use `--yes` on worktrunk commands in this flow to skip interactive approval prompts.

### Dispatch

Create a dedicated worktrunk worktree for the execution, then spawn **one** executor subagent in that worktree. In OpenCode, use the built-in `general` subagent for implementation execution. Executor model: default `sonnet`; use what the user named if they named one (`execute 003 haiku`). In this repo, worktrunk owns worktree directories and Graphite owns branch/commit/stack state.

1. Derive the branch from the plan's Git workflow. Prefer the repo's Linear-style convention (`ui-<ticket>-<slug>`). Use `advisor/NNN-<slug>` only when the plan names no branch and no issue key is available.
2. Create the isolated worktree from the repository's worktrunk default branch, which should be `canary`:

   ```sh
   wt switch -c <branch> --yes --no-cd --format=json
   ```

   If the plan must build on the current branch or another explicit base, use `--base=@` or the named base from the plan instead. Worktrunk's project hooks copy env files and run dependency install on creation. Dependent plans that form one Graphite stack should execute in the same worktree, not one worktree per stacked branch; otherwise use `gt create --onto <branch>` to stack on a branch checked out elsewhere.
3. Capture the returned `worktree_path`. All executor edits, `gt` commands, and verification commands must run inside that path. Do not let the executor edit the user's original worktree.

The subagent prompt must contain:

1. **The full plan file text, inlined.** Never assume the executor can read the plan file from disk.
2. The absolute worktree path and the executor preamble:

> You are the executor for the implementation plan below. Follow it step by
> step. Run every verification command and confirm the expected result before
> moving on. Work only in this isolated worktree: `<absolute worktree path>`.
> Touch only the files listed as in scope. If any STOP condition occurs, stop
> immediately and report. Do not improvise around obstacles.
> Use Graphite for branch and commit state: adopt a `wt switch -c` branch with
> `gt track --parent canary` when needed, and create commits/stack branches with
> `gt create` using the plan's Commit / PR title. Do not use `git commit`,
> `git push`, `wt merge`, `gt submit`, or update the user's original branch.
> Leave the final result as a reviewable Graphite branch/stack in this worktree.
> One override: SKIP the plan's instruction to update `plans/README.md` —
> your reviewer maintains the index. Before reporting, audit every claim in
> your report against an actual tool result from this session — only report
> what you can point to evidence for; if a verification failed or was
> skipped, say so plainly. When finished, reply with exactly the report
> format below.

3. The report format:

```
STATUS: COMPLETE | STOPPED
STEPS: per step — done/skipped + verification command result
STOPPED BECAUSE: (only if STOPPED) which STOP condition, what was observed
FILES CHANGED: list
NOTES: anything the reviewer should know (deviations, surprises, judgment calls)
```

### Review (the advisor's real job here)

Review like a tech lead reviewing a PR against the spec — never fix anything yourself:

1. **Re-run every done criterion in the isolated worktree**. Don't trust the executor's report — verify.
2. **Scope compliance**: inspect the isolated worktree branch/stack diff against the plan's in-scope list (`gt log`, then `git diff <trunk>...HEAD --stat` and `git diff <trunk>...HEAD`). Any file outside scope fails review, full stop.
3. **Read the full branch/stack diff.** Judge it against "Why this matters" (does it solve the actual problem?) and the repo conventions named in the plan (does it look like the rest of the codebase?).
4. **Audit the new tests.** Executors game criteria — a test that asserts nothing meaningful passes `pnpm test` and proves nothing. Read what the tests assert.

### Verdict

**Documented deviations are judged on merit, not reflex-blocked.** "Do not improvise" exists to stop silent drift; an executor that hits a real obstacle (e.g. the plan's approach breaks existing test mocks), adapts minimally, and explains it in NOTES has done the right thing. Approve it if the adaptation serves the plan's intent and stays in scope; treat *undocumented* deviations as review failures.

| Verdict | When | Action |
|---|---|---|
| **APPROVE** | Criteria pass, scope clean, quality holds | Update index status to DONE. Present to the user: branch/stack name, worktree path, diff summary, and anything from NOTES. **Submitting and merging are the user's decision — never run `gt submit`, `wt merge`, push, or commit yourself.** Leave the worktree in place for review. |
| **REVISE** | Fixable gaps | SendMessage to the same executor with specific, actionable feedback ("criterion 3 fails: X; the error handling in `api.ts:90` swallows the error — use the Result pattern per the plan"). **Max 2 revision rounds**, then BLOCK. |
| **BLOCK** | STOP condition hit, scope violated unrecoverably, or revisions exhausted | Mark BLOCKED in the index with the reason. Refine or rewrite the plan with what was learned. Tell the user what happened and what changed in the plan. Ask before removing the worktree if it contains useful debugging state; otherwise clean it with `wt remove <branch> --force --no-delete-branch --yes --foreground`. |

Keep verification to the plan's stated gates, call out any artifacts produced, and never clean up or revert executor changes yourself.

---

## `reconcile` — keep `plans/` alive

Process what happened since the last session. Read `plans/README.md` and every plan file, then per status:

- **DONE** — spot-check that the done criteria still hold on the current HEAD (cheap ones only). Mark verified in the index. Don't delete plan files — they're the record.
- **BLOCKED** — read the reason. Investigate the underlying obstacle in the codebase. Either rewrite the plan around it (new number if the approach changed fundamentally, in-place refresh otherwise) or mark REJECTED with one line of rationale.
- **IN PROGRESS** (stale) — flag it to the user; an executor probably died mid-run.
- **TODO** — run the drift check. If drifted: re-verify the finding still exists (it may have been fixed in passing), then refresh the "Current state" excerpts and `Planned at` SHA. If the finding is gone, mark REJECTED ("fixed independently").

Finish with a short report: what's verified done, what was refreshed, what's rejected, and what's executable right now.

---

## `--issues` — publish plans as GitHub issues

Modifier on any planning invocation (`/improve --issues`, `/improve security --issues`). The flag is the user's authorization to create issues — never create them without it.

1. Preflight: `gh auth status` succeeds and the repo has a GitHub remote. If either fails, write the plan files as normal and say why issues were skipped.
2. Show the list of titles about to become issues; confirm once if interactive.
3. Per plan: `gh issue create --title "<plan title>" --body-file <plan file>`. Labels: `improve` plus the category — apply only if the labels exist or can be created without erroring; skip labels rather than fail.
4. Record each issue URL in the plan's Status block (`- **Issue**: <url>`) and the index.

The plan file remains the source of truth; the issue is distribution. The self-containment rule pays off here — the issue body needs no edits to make sense to whoever (or whatever) picks it up.
