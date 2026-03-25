# Contributing

## Branch per issue (required)

Do **not** commit product changes directly to `main`.

1. Open (or pick) a **GitHub Issue** for the unit of work.
2. From latest `main`, create a **dedicated branch** that includes the issue number:

   | Style | Example |
   |-------|---------|
   | `issue-<n>-slug` | `issue-12-skill-tree-purchase` |
   | `feat/<n>-slug` | `feat/12-add-ci-workflow` |
   | `fix/<n>-slug` | `fix/3-readme-typo` |

3. Implement and push **only** that branch; open a **Pull Request** to `main`.
4. One issue → one focused branch → one PR (avoid mixing unrelated work).

Cursor project rules under [`.cursor/rules/`](.cursor/rules/) reinforce this for AI-assisted work.

## Workflow (detail)

1. Open a **GitHub Issue** for the change (feature, bug, chore).
2. `git checkout main` → `git pull` → `git checkout -b issue-<n>-short-description`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/) and reference the issue in the **body**:

   ```text
   chore(docs): expand README prerequisites

   Refs #12
   ```

4. Open a **Pull Request**; use `Closes #12` or `Fixes #12` in the PR description when the issue is fully done.
5. Merge via squash or merge commit; keep `Fixes #n` in the squash message body if GitHub should auto-close the issue.
6. Delete the remote branch after merge if you like.

## Scope

- Prefer **small PRs** and meaningful commit history.
- Run **tests** and **content validation** (once `npm test` / `validate:content` exist) before requesting review.
- **Curriculum** under `content/` should stay reviewable JSON; follow the project plan for keys and packs.

## Tooling

Recommended extensions (VS Code / Cursor): **rust-analyzer**, **Tauri** (see `.vscode/extensions.json`).
