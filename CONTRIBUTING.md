# Contributing

## Workflow

1. Open a **GitHub Issue** for the change (feature, bug, chore).
2. Create a branch from `main`, e.g. `issue-12-short-slug` or `feat/12-short-slug`.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/) and reference the issue in the **body**:

   ```text
   chore(docs): expand README prerequisites

   Refs #12
   ```

4. Open a **Pull Request**; use `Closes #12` or `Fixes #12` in the PR description when the issue is fully done.
5. Merge via squash or merge commit; keep `Fixes #n` in the squash message body if GitHub should auto-close the issue.

## Scope

- Prefer **small PRs** and meaningful commit history.
- Run **tests** and **content validation** (once `npm test` / `validate:content` exist) before requesting review.
- **Curriculum** under `content/` should stay reviewable JSON; follow the project plan for keys and packs.

## Tooling

Recommended extensions (VS Code / Cursor): **rust-analyzer**, **Tauri** (see `.vscode/extensions.json`).
