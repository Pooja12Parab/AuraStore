---
name: vscode-visual-regression
description: Write Storybook stories and visual regression tests for VS Code extension UI components.
---

# VS Code Visual Regression Tests

Use this skill when adding visual regression tests for components in packages/vscode-webview-ui.

## Architecture

- Storybook + Playwright for visual regression testing
- Stories define UI scenarios using SolidJS components with mock contexts
- Playwright auto-discovers stories, renders in headless Chromium, compares screenshots
- Baselines stored in tests/visual-regression.spec.ts-snapshots/ (Git LFS)

## How to Add a Test

Stories live in packages/kilo-vscode/webview-ui/src/stories/:
- agent-manager.stories.tsx - FileTree, DiffPanel, FullScreenDiffView, WorktreeItem
- chat.stories.tsx - ChatView, QuestionDock
- composite.stories.tsx - AssistantMessage with tool cards, permissions
- prompt-input.stories.tsx - PromptInput
- settings.stories.tsx - Settings panel
- history.stories.tsx - SessionList
- shared.stories.tsx - ModelSelector and shared controls

Write stories with StoryProviders wrapper and explicit dimensions. For narrow viewports, use -200 suffix on export name.
