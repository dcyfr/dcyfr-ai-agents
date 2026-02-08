---
"@dcyfr/ai-agents": minor
---

Migrate to changesets for automated publishing

- Install @changesets/cli and @changesets/changelog-github
- Configure changesets with GitHub changelog
- Add changeset scripts to package.json
- Add changesets to devDependencies
- Update workflow to use changesets/action
- Upgrade npm to latest for OIDC support (>= 11.5)
- Bump to v0.2.1 for changesets migration

Pattern: Proven working for @dcyfr/ai-rag and @dcyfr/ai-code-gen
