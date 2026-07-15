---
name: release-jetbrains
description: Use when releasing the Kilo JetBrains plugin -- resolve a version, run the prepare workflow, edit and commit a filtered human-readable changelog on the release PR, then watch publish to completion.
---

# JetBrains Release

Use this skill when releasing the Kilo JetBrains plugin.

This skill drives the existing JetBrains release workflows. It must not move, delete, or recreate JetBrains release tags.

## Preconditions

- Run from the repository root.
- gh must be authenticated for Kilo-Org/kilocode with permission to dispatch workflows.
- Check auth with gh auth status. Refresh common release scopes with:
gh auth refresh -s repo -s workflow

## Version Resolution

Resolved versions:

- next rc - If the latest JetBrains tag is an RC, increment its rc.n; otherwise start the next patch RC at rc.1.
- next stable - If the latest JetBrains tag is an RC, use its base version; otherwise use the next patch stable.
- x.y.z-rc.n - Explicit RC release.
- x.y.z - Explicit stable release.

Resolve version:
bun .kilo/skills/release-jetbrains/script/resolve-version.ts --spec "next rc"

## Prepare Workflow

After confirmation, dispatch and watch the prepare workflow:

bun .kilo/skills/release-jetbrains/script/dispatch-prepare.ts --kind rc --version 7.0.1-rc.7

## Publish Watch

Watch the publish workflow:

bun .kilo/skills/release-jetbrains/script/watch-publish.ts --pr <number> --version 7.0.1-rc.7 --merge

RC versions publish to the eap channel; stable versions publish to the default Marketplace channel.
