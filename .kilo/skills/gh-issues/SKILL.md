---
name: gh-issues
description: Use when creating, triaging, or commenting on GitHub issues for the Kilo VS Code extension or JetBrains plugin via gh. Covers issue templates, project board assignment, title conventions, and required gh scopes.
---

# GitHub Issues

Use this skill whenever you create or manage a GitHub issue with gh for either the VS Code extension or the JetBrains plugin.

## Templates

The repo defines issue templates in .github/ISSUE_TEMPLATE/. Pick the matching template instead of opening a blank issue:

- Bug report - Reproducible defects with steps, expected, and actual behavior
- Feature Request - New capabilities, enhancements, or behavior changes
- Question - Usage or design questions that arent obviously bugs or feature requests

Pass the template title to gh issue create --template.

## Title Conventions

Use a plain, descriptive title that reads cleanly as a standalone sentence.
Do not add platform-specific prefixes such as [JetBrains], [VS Code], etc.

## Project Boards

Every new issue must land on the correct project board:

- VS Code extension - VS Code Extension project
- JetBrains plugin - Jetbrains Plugin project

## Recipes

Create a VS Code extension bug report:

gh issue create --template "Bug report" --project "VS Code Extension" --title "Sidebar chat fails to render" --body "..."

Create a JetBrains feature request:

gh issue create --template "Feature Request" --project "Jetbrains Plugin" --title "Support Kotlin Multiplatform target detection" --body "..."

## Scope Errors

If gh reports a missing scope when assigning a project, refresh the auth token:

gh auth refresh -s project

Then re-run the original gh issue create command.
