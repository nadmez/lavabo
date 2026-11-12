---
name: spec-writer
description: Use when writing or drafting a spec (or phase sub-specs under specs/phase-N/*.md) to feed into the tdd-pipeline skill. Produces concrete, testable spec files formatted specifically for the tdd-pipeline test-writer step. When run inside a subagent, return any blocking/edge-case questions to the parent orchestrator so the parent can ask the user via AskQuestion before writing the spec.
---

# Spec Writer

## Purpose

`tdd-pipeline` needs a clear, concrete spec before it can spawn a test-writer --
a vague feature name isn't enough for an isolated subagent to write a meaningful
failing test from. This skill's only job is producing that spec, and producing it
honestly: by asking about the gaps instead of guessing through them.

Guessing is the failure mode to avoid. A spec that quietly assumes an answer to
"what happens on empty input?" hands the test-writer a blind spot it will never
know to question -- it'll just write a test around whatever was assumed. Asking
costs you thirty seconds now; a wrong assumption baked into a spec costs a wasted
pipeline round later.

## Before writing anything: interview the user

Take the user's raw request and check it against these dimensions. Some are
always worth asking about regardless of how detailed the request already sounds
-- edge cases and error handling are exactly the kind of thing people describe
correctly for the happy path and forget to mention otherwise, so probe for them
even when the rest of the request feels complete.

| Dimension                                                                                | When to ask                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Core behavior, trigger, and observable result                                            | **Blocking.** If you can't state in one sentence what happens and how you'd know it worked, ask before drafting anything else.            |
| Edge cases (empty/missing/invalid/boundary input)                                        | **Always ask**, unless already answered in the approved plan or prompt.                                                                   |
| Error handling (what should happen when something goes wrong, not just the success path) | **Always ask**, unless already answered in the approved plan or prompt.                                                                   |
| Scope boundaries (what this explicitly should _not_ do)                                  | Ask if the request could plausibly be read more broadly than intended.                                                                    |
| Related existing code/files/conventions                                                  | Ask only if you don't already know and it would change how acceptance criteria are worded (e.g. matching an existing validation pattern). |

If the request or phase bundles multiple distinct behaviors, split it into
separate sub-specs (for example `specs/phase-3/query-engine.md` and
`specs/phase-3/facet-counts.md`). `tdd-pipeline` works best on one coherent
behavior per run -- a test-writer handed a grab-bag spec will produce a
sprawling, hard-to-verify test file.

### Running inside a Cursor subagent

A subagent cannot call `AskQuestion` directly to talk to the user:

- If you are a subagent and have unresolved blocking, edge-case, or error-handling questions, return your consolidated list of questions to the parent orchestrator agent and stop without writing the spec yet.
- The parent orchestrator asks the user in one batch via `AskQuestion`, then spawns a fresh spec-writer subagent with the user's answers to write the spec file(s).
- If the parent orchestrator already supplied explicit answers for core behavior, edge cases, error handling, and scope boundaries from the user/plan, proceed directly to writing the spec file(s).

## Writing the spec

Once you have real answers (not assumptions) for the blocking dimension and the
always-ask dimensions, write the spec to `specs/<slug>.md` or
`specs/phase-<N>/<slug>.md` at the project root (create the directory if it
doesn't exist). Derive `<slug>` from the title in kebab-case. If that file
already exists, ask whether to overwrite it or save alongside it with a `-2`
suffix -- don't silently clobber a spec that might represent someone else's
work in progress.

Use this exact template:

```markdown
# <Title>

## Summary

One or two sentences: what this feature/fix does and why, in plain language.

## Scope

One coherent behavior this spec covers. If it was split from a larger phase or
request, say so here.

## Acceptance criteria

Plain "must" statements. Each one should be independently testable -- if a
bullet has "and" joining two unrelated checks, split it into two bullets.

- The system must ...
- The system must ...

## Edge cases and error handling

What must happen for empty/invalid/boundary input and failure states. Every
edge case goes here with its answer -- this is what stops the test-writer from
guessing.

- When ..., the system must ...

## Out of scope

Explicitly not covered by this spec, so the code-writer doesn't over-build.

- ...

## Context / notes

Optional: relevant existing files, conventions, or prior art worth pointing to.
Do not mention end-to-end / browser testing here (see "Keep specs free of e2e").

## Open questions

Only include this section if something genuinely couldn't be resolved after
asking (rare -- if you did the interview above properly, this should usually be
empty or omitted entirely).
```

Keep every acceptance-criteria and edge-case bullet phrased as an observable,
testable outcome ("must show X", "must return Y", "must reject Z") rather than
an implementation detail ("must use a regex") -- the test-writer needs to know
what to assert on, not how to build it. Implementation choices belong to the
code-writer, not the spec.

## Keep specs free of e2e

A spec is handed to `tdd-pipeline`, whose agents act on whatever it mentions.
If a spec brings up Playwright, `e2e/`, or "optional e2e checks" -- even as a
suggestion or an out-of-scope note -- an agent downstream may treat that as a
cue to write or run browser tests. End-to-end testing happens only when the
user invokes `/playwright-tester` themselves, never as a side effect of a spec.

So, in every section of the spec (acceptance criteria, edge cases, out of
scope, context/notes):

- Do not mention Playwright, Cypress, `e2e/`, end-to-end, or browser-automation
  tests, and do not suggest e2e checks -- not even as "optional".
- Do not write criteria that can only be verified in a real browser (e.g. real
  navigation, HTTP status of a live server, pixel/visual layout). Phrase them as
  what a unit or component test can observe: rendered output, attributes,
  props, DOM structure, text, links, accessible names.
- Point only to unit-level conventions (the Vitest + Testing Library setup and
  existing `src/**/*.test.js` files).
- If something genuinely needs a live browser to verify, leave it out of the
  spec and note in your reply that it isn't covered, so the user can decide
  whether to verify manually or run `playwright-tester` later.

## After saving

Report the saved spec file path(s) and a short summary of the sub-specs so the
orchestrator can hand each spec to `tdd-pipeline`.
