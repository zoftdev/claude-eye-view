---
name: claude-eye-view
description: "Draw this conversation from Claude's point of view: a workflow diagram of how the discussion moved — where it started, where it drilled down, where it pivoted, what got blocked, what is still open — where hovering any node shows what Claude knew at that point (reasons, numbers, fixes, rejected options, which helper did the work). Use when the user says /claude-eye-view, asks to show the flow of the conversation, 'where did we go', 'how did we get here', or wants a map of a long session before handing it off."
license: Apache-2.0
metadata:
  version: "0.1"
  author: zoftdev
  requires: "archify from zoftdev/claude-eye-view (hover-explain viewer mod)"
---

# Claude eye view

One page that shows the path of a conversation as a native Archify workflow diagram. Each node is a turning point; its
**hover box** carries what Claude knew there — the part a short label cannot hold. No click: point at a node and the
explanation appears in the screen corner that does not cover it.

## When to use
- The user asks to see how the conversation moved, where it drilled in, or what changed direction.
- Before a handoff, so a reader can rebuild the story without the transcript.
- Not for drawing a system or codebase — use `archify` for that.

## Requirements
- The `archify` skill **from this repository** (it ships the hover-explain viewer mod). Find its CLI at
  `../archify/bin/archify.mjs` relative to this skill's directory. Check the mod is present:
  `grep -c hoverExplain ../archify/assets/template.html` → `1`. If it is `0` or missing, tell the user to install
  archify from `zoftdev/claude-eye-view` (`npx skills add zoftdev/claude-eye-view`) and stop.
- Node 18+.

## Steps

### 1. Recall the conversation (from your own context — no tool calls needed)
List, in order:
- **Asks** — what the user asked and every change of direction they gave (quote short phrases).
- **Turning points** — the decisions, pivots and why (a number, a failure, a user call).
- **Work threads** — investigation, build, tests, side sessions or subagents, posts/messages sent.
- **Blockers and workarounds** — what broke and what replaced it.
- **Open now** — what waits on the user or on someone else.
If part of the conversation was compacted, use the summary and say in the page which parts come from it.

### 2. Shape the diagram (Archify workflow, schema v2)
- **Lanes = threads**, top to bottom: the user's direction/decisions first, then the work threads, an
  `"variant": "exception"` lane for blockers, and a lane for messages/posts if any.
- **Columns 0–5 = time.** Group the conversation into 2–3 phases (`phases[]`) such as *Question → Drill down → Scale out*.
  Only six columns exist: merge small steps rather than adding columns.
- **`mainPath`** = the chain of the user's direction nodes, left to right.
- **Node** = one turning point: `label` ≤ 4 words, `sublabel` = the key number or outcome, `icon` where it helps
  (`start`, `decision`, `success`, `failure`, `waiting`).
- **Edges** say why the story moved: `label` 1–2 words (`MCP works`, `change plan`, `workaround`), `role: "branch"` for
  side threads, `role: "error"` + `variant: "security"` for a failure.
- **`explanation`** on every node (≤ 1,200 characters; a blank line starts a paragraph). Write what you knew there:
  1. what was asked or done, 2. why (the reason or trigger), 3. numbers that decided it, 4. fixes made on the way and
  options rejected, 5. who did it (you, a subagent, a named session) and the files it produced. Mark guesses as guesses.
- **Cards** (optional, ≤ 2): the drill path in three lines, and what is open now.
- Write the user's language in explanations; keep labels short. Set `meta.locale` to a bundled locale (`en`, `zh-CN`,
  `zh-TW`, `es`, `ko`, `ar`) or `en` for others.

Before writing, scrub: no secrets, tokens, passwords, internal hostnames:ports, customer data or personal details the user
would not post. The page is a file the user may share.

### 3. Render
Work in `.claude-eye-view/<slug>-<YYYYMMDD-HHMMSS>/` under the working directory (or where the user says). Write
`candidate.json` there with `meta.output` pointing at `<slug>.html` in the same folder (path relative to the working
directory), then run from the working directory:

```bash
node <archify-dir>/bin/archify.mjs finalize workflow <folder>/candidate.json <folder>/<slug>.html --quality showcase --json
```

- On a failure, read `diagnostics`, fix the named node or edge, and rerun with `--out-dir <folder>/review-<n>`.
- `composition/proper-crossing`: move a branch node so its edge runs in an empty corridor, or drop the edge and say it
  in the target node's sublabel/explanation. Do not drop a node.

### 4. Reply
One link to the HTML (absolute path), then 2–4 lines: the drill path in one sentence, how to read it ("hover a node to
see what I knew there"), and what is open. Mention parts that came from a compacted summary.

## Example
`examples/session-flow.workflow.json` (in this skill directory): a fictional session (build a CSV import, a failed
approach, a pivot, a side session) showing lanes, phases, edges and explanations.
