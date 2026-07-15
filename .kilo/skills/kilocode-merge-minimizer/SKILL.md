---
name: kilocode-merge-minimizer
description: Use when changing shared upstream-owned files to add Kilo-specific behavior, editing kilocode_change markers in shared code, or moving additive behavior out of shared code to reduce upstream merge conflicts.
---

# Kilo Merge Minimizer

Use this skill whenever a normal development task touches shared upstream-owned code and includes Kilo-specific behavior, especially for marker cleanup, extraction work, or kilocode_change annotations.

## Goal

Minimize Kilos long-term diff against upstream OpenCode while preserving behavior. Prefer this shape for Kilo-specific additions:

1. Shared upstream file contains only a minimal hook, import, call, registration, or config entry.
2. Kilo-specific behavior lives in Kilo-owned code.
3. Unavoidable shared-file changes have narrow kilocode_change markers.
4. The annotation checker passes.

## Core Rules

- Use script/check-opencode-annotations.ts as the source of truth for current shared scopes and exempt paths.
- Mark only Kilo-specific diff lines in shared upstream files.
- Put Kilo-only imports on separate marked lines instead of reorganizing upstream imports.
- Preserve upstream formatting and import style in shared files.
- Do not change shared files unless the change is required for Kilo functionality.

## Marker Rules

- Prefer inline markers for single-line changes: const value = 42 // kilocode_change
- Use block markers only for adjacent Kilo-specific lines:
// kilocode_change start
registerKiloFeature(app)
// kilocode_change end

Use the files native comment style, including JSX block comments inside JSX.

## Verification

After editing shared files or marker comments, run:

bun run script/check-opencode-annotations.ts

If the PR uses a non-default comparison base, pass the correct base ref:

bun run script/check-opencode-annotations.ts --base <base-ref>
