# Skill Enforcement Rule

**When ANY skill is loaded, the following is mandatory:**

1. **Create its checklist as todos** — immediately, before any other action. Convert every step in the skill's workflow into a todo item.

2. **Gate every action against the current step** — do not proceed to the next step until the current one is complete and its requirements are satisfied. The current step's criteria must be met before advancing.

3. **No file tools until permitted** — do NOT use edit/write/create/move/delete file tools until the skill's checklist step explicitly allows file manipulation. For the brainstorming skill, this is step 6 (Write design doc), which requires step 5 (user approval) to be complete first.

4. **No implementation until full flow completes** — do NOT invoke any implementation skill, scaffold projects, write code, or take execution actions until the terminal state of the current skill is reached.

## Violation history

- 2026-07-15: 3 violations in one session — bypassed brainstorming skill checklist, started creating todos for execution instead of approval, edited plan document without design approval.
- Fix implemented: this file + project memory.

## Checklist for this rule

When I load a skill:
- [ ] Create todo for each step in the skill's workflow
- [ ] Set first step as in_progress
- [ ] Complete steps in order, never skipping ahead