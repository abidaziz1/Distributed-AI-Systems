# Distributed AI Systems: guide for Claude

## What this is

A press-Next teaching site, with no build step and no server, for one learner who will do research on AI optimization. The learner already knows inference (the KV cache, serving basics) and is now learning distributed training and serving. The course follows the chapter list of the book *Distributed AI Systems* by Fuheng Wu (2026). The eleven chapter titles are in `js/config.js` under `upcoming`.

We do not have the book's text. Teach from first principles, the original papers and the project documentation, in original words. Never copy book text. If the owner pastes pages, build the chapter around them, still in original words.

## What the owner asked for

- Teach theory first, with the maths where it is needed, and visually. Little code. Never overcomplicate.
- Teach exactly what a person needs before research. Skipping the unnecessary matters most.
- Make it enjoyable, not boring. Prefer the insight that changes how the learner thinks over coverage.
- Work chapter by chapter. Build one chapter, let the owner try it and react, then continue.
- The owner liked the style of the earlier data engineering course (Coach Sam, SEE, TRY, SAY, animated diagrams) and left the rest of the method to us.

## How every chapter teaches

- **Wall, trick, price.** Say what breaks, what trick fixes it, and what the trick costs. The price is usually communication. Never present a technique without its price.
- **Guess first.** Ask for a guess (a quiz) before showing a number, then show the working.
- **Formula, words, number.** Show the formula (KaTeX), say it in plain words, and put one worked number beside it. Never leave a formula alone.
- **One idea per screen**, a short line from Coach Sam per step, and a picture before a paragraph.
- **Labs are arithmetic on stated formulas.** A lab lets the learner change one input and see the result. State every assumption on the screen.
- **A chapter has this shape:** intro with goals; a hook that makes the learner guess; the wall; the trick; a lab; a decision (`decide`); quizzes and a bug hunt; two `qa` scenes ("explain it back"); a recap with a badge. About 30 to 40 minutes on Essentials.
- **Tiers.** `t: 1` is Essentials and is what the learner needs. `t: 2` is deeper (derivations, edge cases, harder drills). Do not pad Essentials. A chapter that cannot be said in one page of notes is too big.

## Honesty

- Every screen that quotes a number gets a `src` tag: `pub` (published figures, rounded), `calc` (worked out on the screen), `docs` (described from documentation). Nothing here has run on a GPU, and no screen may suggest it did.
- Put every new published figure and its source in the README table. Say when a figure came from a secondary summary.
- The sandbox has no GPU and the PyTorch CPU wheel host is blocked, so code shown is read-only and tagged `docs`. If the owner pastes real output from their own machines, turn it into a `Recorded` screen and say so.

## Structure

```text
index.html           loads the scripts in order. A new content file must be listed here.
js/config.js         title, paths, welcome text, levels, `upcoming` chapters
js/graphs.js         diagrams as plain data. Nodes, edges, groups, tags. Ids are checked by the lint.
js/widgets.js        labs. Each registers LAB.W.<kind> with steps, say, render. Narration lives in the content file.
js/content/NN-*.js   one file per chapter, written with the helpers in shared/js/build.js
shared/              the engine. Change it only when a chapter needs it, and keep old behavior working.
```

Scene helpers: `talk`, `flow` (animated diagram), `cmp` (table that reveals rows), `rows`, `code` (line-by-line walkthrough), `term`, `widget`, `quiz`, `bug`, `order`, `decide`, `challenge` (used as an estimation drill), `incident`, `qa`, `recap`.

Math: `$...$` inline, `$$...$$` display, through KaTeX. Never write a dollar sign for money, write "USD 2". Inside math, put a number with a thousands comma in `\text{}`, or the comma gets a gap. Diagrams (SVG) cannot hold math, so use plain Unicode there.

## Writing rules (the lint enforces them)

Plain, short sentences. No contractions. No em dashes or other dashes between words, and no emoji. Do not use: elevate, hustle, revolutionize, fostering, reimagine, subsequently, showcase, profound, groundbreaking, delve, synergy, insight(s), whisper, enablement, meanwhile, game changer, deep dive, leverage, unleash, harness, paradigm, ecosystem, cross-functional, think outside the box, touchpoint, across different, human oversight, to bridge, highlight, "not only", "That is not X. It is Y", "Why it matters", or a sentence that starts with "From X to Y".

## Commands

```bash
npm run lint          # must be clean before every commit
npm run smoke         # every frame, desktop. Must report no errors, overflow or small text
npm run smoke:phone   # every frame at 390 px. Diagram labels scale down, which is expected
npm run stats         # minutes per chapter
node dev/shot.js . <frame> out.png [--click "css selector"]   # frame keys look like m1-fit:0
```

After a visual change, take screenshots and look at them. The smoke test cannot tell whether a screen looks right.

## Workflow

Develop on the branch the session names, and ask before pushing to `main`. Do not open a pull request unless asked. Run lint and smoke before every commit. Keep commits small and named for the chapter.
