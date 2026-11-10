# Distributed AI Systems

A guided, press-Next course on how AI models are trained and served on many GPUs. It builds the mental model you need before research on AI optimization: where the memory goes, where the time goes, and what every trick costs. Pictures, small calculators and questions to answer out loud, with the maths where it is needed and almost no code.

No install. No account. No server. Open `index.html` in a browser and press **Next**.

The chapter order follows the book *Distributed AI Systems* by Fuheng Wu (2026). The lessons are written independently, from the original papers and the project documentation, and do not reproduce the book.

## Chapters

| # | Chapter | Status |
| --- | --- | --- |
| 0 | Start here: the whole course on one page | Ready |
| 1 | Introduction to modern distributed AI | Ready. 36 minutes on Essentials, 44 with the deeper screens |
| 2 | GPU hardware, networking and parallelism strategies | Next |
| 3 | Distributed training with PyTorch DDP | Planned |
| 4 | Scaling with Fully Sharded Data Parallel (FSDP) | Planned |
| 5 | Beyond state sharding with DeepSpeed and Megatron | Planned |
| 6 | Distributed inference and vLLM | Planned |
| 7 | Cross-request optimization with SGLang | Planned |
| 8 | Running distributed training with SLURM | Planned |
| 9 | The production LLM serving stack | Planned |
| 10 | Distributed benchmarking and performance optimization | Planned |
| 11 | The evolving landscape of distributed AI | Planned |

## How each chapter teaches

| Step | What you do |
| --- | --- |
| **SEE** | Watch an animated diagram or a lab, one idea at a time. Orange blocks that move along an arrow are data. |
| **TRY** | Guess first, then check with a quiz, a bug hunt, an ordering game, a decision with a recommended answer, or a small calculator. |
| **SAY** | Explain the idea back in your own words, then compare with a model answer and tick the points you covered. |

Coach Sam talks you through every step. Every technique is taught the same way: the **wall** it hits, the **trick** that gets over it, and the **price** it charges. The price is usually communication.

### Two paths

| Path | For | Contains |
| --- | --- | --- |
| **Essentials** | Exactly what you need to reason about distributed training and serving | The ideas, the numbers, the decisions. Nothing extra |
| **Essentials and deeper** | When you want to see where the numbers come from | Adds derivations, the efficiency metric, and harder drills |

A small tag on a screen shows that it belongs to the deeper path only. Switch any time from the **Map** button. Times are estimates from reading each step.

## Open it

1. Download or clone this repository.
2. Double-click **`index.html`**.

It works from `file://` and from any web server, because every path is relative and there are no modules. Progress and answers are stored in your own browser (`localStorage`).

## Publish on GitHub Pages

Open **Settings, Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`. This works because `.nojekyll` is present. The course is then at `https://<your-user>.github.io/<repository-name>/`.

## Layout

```text
index.html               the course page
js/config.js             title, paths, welcome text, the list of chapters still to come
js/graphs.js             diagrams, as plain data (nodes, edges, groups, tags)
js/widgets.js            the labs: walls, scissors, fit, data parallel by hand
js/content/              the lessons, one file per chapter
css/course.css           styles for the labs
shared/                  the teaching engine (scenes, diagrams, progress, map)
  vendor/katex/            KaTeX, for the equations (MIT license, runs offline)
  assets/fonts/            fonts (SIL Open Font License)
dev/                     check tools (not part of the site)
CLAUDE.md                the teaching rules, so every session keeps the same style
```

## Check tools

The site has no build step. These scripts only check it. They need Node 20 or later.

```bash
npm install
npx playwright install chromium
```

```bash
npm run lint          # ids, tiers, code line ranges, diagram references, writing rules, and every formula parses
npm run smoke         # walks every frame in Chromium: errors, overflow, text size, stray undefined
npm run smoke:phone   # the same walk at phone width
npm run stats         # minutes per chapter on each path
```

`node dev/shot.js . m1-fit:0 out.png --click "[data-act=ft-preset][data-v='2']"` saves a screenshot of one frame.

## Where the numbers come from

Every screen that quotes a number carries a tag: **Published figures** (papers and spec sheets, rounded), **Worked out** (computed on the screen from a formula you can see), or **From documentation**. These are the published figures, with the source to read before you cite one.

| What | Source |
| --- | --- |
| Training state of about 16 bytes per parameter: 2 weights, 2 gradients, 12 optimizer state (mixed precision with Adam) | The ZeRO paper, [arXiv 1910.02054](https://arxiv.org/abs/1910.02054) |
| Training costs about 6 operations per parameter per token | Kaplan et al., [arXiv 2001.08361](https://arxiv.org/abs/2001.08361) |
| GPT-3: 175B parameters, 300B tokens, about 3.1e23 operations | Brown et al., [arXiv 2005.14165](https://arxiv.org/abs/2005.14165) |
| Llama 2: 2T tokens for the 7B and 70B models | [arXiv 2307.09288](https://arxiv.org/abs/2307.09288) |
| Llama 3.1: 405B parameters, 15.6T tokens, up to 16,000 H100 GPUs, roughly 38 to 43 percent MFU | [arXiv 2407.21783](https://arxiv.org/abs/2407.21783). The MFU range comes from a secondary summary of the paper |
| Megatron-LM: 8.3B parameters, 8-way model parallel and 64-way data parallel on 512 V100 GPUs | [arXiv 1909.08053](https://arxiv.org/abs/1909.08053) |
| PaLM: 540B parameters, 46.2 percent MFU | [arXiv 2204.02311](https://arxiv.org/abs/2204.02311) |
| DeepSeek-V3: 671B parameters, 37B active for each token | [arXiv 2412.19437](https://arxiv.org/abs/2412.19437) |
| AlexNet: 60M parameters, two GTX 580 GPUs with 3 GB each, split because it did not fit on one | Krizhevsky, Sutskever and Hinton (2012). Checked against summaries, not the paper |
| H100: 80 GB, about 989 TFLOP/s dense bf16. The 1,979 figure on the same page is with sparsity | [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100.html) |
| H200: 141 GB. B200: 180 to 192 GB, and sources differ, so the chart says about 180 | [NVIDIA H200](https://www.nvidia.com/h200) |
| P100 16 GB, V100 32 GB, A100 80 GB, GTX 580 3 GB | Spec sheets, from memory, not re-checked here |
| One H100 does about 4e14 useful operations a second | An assumption: about 40 percent of the peak, in line with the published MFU figures |

## What was not checked

- **Nothing ran on a GPU.** The PyTorch code in Chapter 1 follows the PyTorch documentation. It was not run, because the machine that built this course had no GPU and PyTorch was not installed.
- **The numbers were checked against search summaries** of the papers and spec sheets, not by reading the papers themselves. Read the paper before you cite a number.
- **The labs are arithmetic.** The walls lab assumes 4e14 operations a second for one H100. The data-parallel lab is a one-weight toy problem computed in the browser. The fit lab ignores activations, because they depend on batch size and sequence length.
- **The chart shows landmark models**, not typical ones, and its figures are rounded.
- **At phone width** the labels inside diagrams scale down to about 9 to 11 px. Body text stays at 14 px or larger.

## Add a chapter

1. Write `js/content/NN-name.js` with `LAB.addChapter({...})`, using the helpers in `shared/js/build.js`. Give every scene a tier `t` of 1 (Essentials) or 2 (deeper).
2. List the file in `index.html`.
3. Put new diagrams in `js/graphs.js` and new labs in `js/widgets.js`. The narration of a lab step belongs in the content file, so the lint reads it.
4. Remove the chapter from `upcoming` in `js/config.js`.
5. Run the check tools, then update the table above.

## Notes

- No license file has been added yet. Choose one before you share the course if you want others to reuse it.
- The coach is an illustration. To use a photo, put a picture next to `js/config.js` and set `coachPhoto`.
- This is independent study material. It is not affiliated with or endorsed by the author or publisher of the book, NVIDIA, Meta, OpenAI, Google, DeepSeek, the PyTorch project or any other organization named here.
