/* Chapter 0: pick a path, see the whole course on one page, and learn how the screens work. */
(function () {
  var B = LAB.b;

  LAB.addChapter({
    id: 'm0', n: 0, noIntro: true, title: 'Start here', short: 'Start', blurb: 'Pick your path and see the whole course on one page', minutes: 6,
    scenes: [
      B.welcome({ id: 'welcome' }),

      B.flow({
        id: 'm0-map', t: 1, title: 'The whole course on one page', g: 'map', legend: false,
        steps: [
          { say: 'This is the whole course on one page: eleven chapters in four zones. Press Next and I will walk you through it.', cap: 'Eleven chapters, four zones.' },
          { say: 'Foundations. Chapter 1 shows why one GPU is not enough. Chapter 2 shows what GPUs and the wires between them can really do. Everything else builds on these two.', on: ['e1'], focus: ['g_f', 'c1', 'c2'], cap: 'Why distribute, and what the hardware allows.' },
          { say: 'Training is a ladder. First copy the model onto every GPU and split the data. When the model state no longer fits on one GPU, shard it. When even that is too slow across machines, split the math itself. Each rung exists because the one below hit a wall.', on: ['e2', 'e4', 'e5'], focus: ['g_t', 'c3', 'c4', 'c5'], cap: 'Copy, then shard, then split the math.' },
          { say: 'Serving hits a different wall. Every request needs the weights and a growing memory of its own, the KV cache. vLLM manages that memory. SGLang goes further and reuses work across requests.', on: ['e3', 'e6'], focus: ['g_s', 'c6', 'c7'], cap: 'Serving is mostly a memory problem.' },
          { say: 'Running it for real. A cluster scheduler gives you the GPUs, a serving stack puts the model in front of users, and benchmarking tells you honestly whether any of it is fast.', focus: ['g_r', 'c8', 'c9', 'c10'], cap: 'Get GPUs, serve users, measure honestly.' },
          { say: 'The last chapter looks ahead: mixture of experts, edge and cloud, failures at scale, federated learning, agents, and cost.', focus: ['g_r', 'c11'], cap: 'Where the field is heading.' },
          { say: 'One idea runs through all of it. Every technique buys capacity or speed, and charges for it in communication. Watch for that price in every chapter.', cap: 'Wall, trick, price.' }
        ]
      }),

      B.talk({
        id: 'm0-skip', t: 1, title: 'What this course leaves out',
        say: 'Skipping the right things is part of the plan. Here is what I leave out on purpose. Press Next.',
        items: [
          ['Writing GPU kernels', 'You will learn what a kernel is and what it does for speed, but you will not write one. Kernel programming is a separate craft with its own courses.', 'No kernel programming.'],
          ['Model architecture details', 'Attention, layers and training recipes appear only where they change memory, compute or traffic.', 'Only what changes the cost.'],
          ['Every framework flag', 'Flags change every month. You learn the idea each one controls, so you can read the documentation yourself.', 'Ideas last. Flags do not.'],
          ['Vendor comparisons and the benchmark of the week', 'Specific GPU numbers appear as examples with their source. The method of working them out is what lasts.', 'Method over leaderboards.'],
          ['Long code listings', 'Code is short and read-only. You do not need a GPU to follow along.', 'Short code, read only.']
        ]
      }),

      B.talk({
        id: 'm0-how', t: 1, title: 'How this course works',
        say: 'Five quick things before we start. Press Next for each.',
        items: [
          ['SEE, TRY, SAY', '**SEE**: watch a diagram or a lab, one idea at a time. **TRY**: guess first, then check with a quiz, a decision or a small calculator. **SAY**: explain the idea back in your own words, then compare with a model answer.', 'Watch, try, say.'],
          ['Guess first', 'Before most numbers I ask for a guess. Being wrong for a few seconds is the fastest way to remember the right answer.', 'A wrong guess teaches.'],
          ['Wall, trick, price', 'Every technique is taught the same way: the **wall** it hits, the **trick** that gets over it, and the **price** it charges. The price is usually communication.', 'Wall, trick, price.'],
          ['Where numbers come from', 'A **Published figures** tag means the numbers come from papers and spec sheets, rounded. **Worked out** means computed on the screen from a formula you can see. **From documentation** means described from the project documentation. Nothing in this course ran on a GPU.', 'Every number says where it came from.'],
          ['Controls', 'The right and left arrow keys move between screens. **A-** and **A+** change the text size. **Map** jumps to any chapter and switches path. Your progress saves in this browser.', 'Next, Back, arrow keys, Map.']
        ]
      })
    ]
  });
})();
