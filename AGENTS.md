# Agent instructions

Read [CLAUDE.md](CLAUDE.md) in full before making changes. It is the shared source of site context, architecture, design, publishing constraints, and build commands for Codex and Claude. Follow any applicable nested agent instructions too.

## Chris's coding workflow

- Work on a fresh feature branch in an isolated worktree based on the fetched canonical default branch. Never edit the primary checkout for feature work.
- Never push to `main`, merge a pull request, or enable automatic merging. Chris merges.
- Do not change Cloudflare configuration/settings, DNS, secrets, or deployment commands. Retrieve an existing preview link from PR checks/comments when available; do not deploy manually to manufacture one.
- Never hand-edit published content in `src/content/blog/`; Obsidian is its source of truth.
- Make the requested change, then run `npm run build`. If an install or build fails, stop and report the command and error; do not work around it or alter dependencies to force success.
- After a successful build, push only the feature branch and open a PR. Report the PR URL, build result, and verified Cloudflare preview URL (or explicitly say the preview is unavailable).
- New software or dependencies beyond an already approved setup require Chris's approval.

These restrictions apply to this agent workflow. Descriptions of Enveloppe's automatic publishing/merging in CLAUDE.md do not authorize an agent to merge or publish directly.
