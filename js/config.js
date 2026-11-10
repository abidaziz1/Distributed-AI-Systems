/* Distributed AI Systems: course settings. Edit and reload.
   coachPhoto: put a picture next to this file (for example coach.jpg) and set the path.
   Leave it empty to keep the illustrated Coach Sam. */
window.LAB = window.LAB || {};
LAB.config = {
  id: 'dai',
  storageKey: 'dai.v1',
  unit: 'Chapter',
  totalChapters: 11,
  coachPhoto: '',
  defaultTrack: 'essentials',
  goalsTitle: 'After this chapter you can:',
  titles: { qa: 'Explain it back', challenge: 'Estimation drill', decide: 'Decision' },
  qaWho: 'A COLLEAGUE ASKS',
  qaSay: [
    'Explain it back. Say your answer out loud before you look at anything. Explaining is the fastest test of whether you understood.',
    'This is a model answer to compare with. Tick the points you covered, and notice the ones you missed.',
    'Follow-up questions are where understanding gets tested. Open each one and answer first. The warning box shows a mistake that is easy to make.'
  ],
  qaHonest: 'Say it in your own words. If a step feels fuzzy, go back to that screen and run the numbers again.',
  recapSay: 'Say these in your own words',
  welcome: {
    titleHtml: 'Distributed AI Systems<br><span>how models are trained and served on many GPUs</span>',
    sub: 'Why one GPU is not enough · Hardware and links · Data parallel · Sharding · Splitting the math · Serving · Clusters · Production · Measuring · What comes next',
    say: 'Hi, I am Coach Sam. This course gives you the mental model you need before research on AI optimization: where the memory goes, where the time goes, and what every trick costs. There is almost no code to write. You will watch pictures, work out numbers, and explain ideas back. You only need the Next button. First, tell me how deep you want to go.',
    question: 'How deep do you want to go?',
    note: 'Switch any time from the Map button. Progress saves in this browser. Nothing in this course ran on a GPU. Numbers are published figures (papers and spec sheets, rounded), worked out on the screen from simple formulas, or described from the documentation, and each screen says which. Independent study material, not affiliated with or endorsed by NVIDIA, Meta, OpenAI, Google, DeepSeek, the PyTorch project or any other organization named here.'
  },
  rhythm: [
    { k: 'see', b: 'SEE', t: 'Watch diagrams and labs, one idea at a time' },
    { k: 'try', b: 'TRY', t: 'Guess first, then check with quizzes and calculators' },
    { k: 'say', b: 'SAY', t: 'Explain the idea back, then compare' }
  ],
  tracks: [
    { id: 'essentials', level: 1, name: 'Essentials', rec: true, text: 'Exactly what you need to reason about distributed training and serving. Nothing extra.' },
    { id: 'deeper', level: 2, name: 'Essentials and deeper', text: 'Adds where the numbers come from, the derivations, and the harder drills.' }
  ],
  tierLabels: { 2: 'Deeper' },
  srcLabels: { pub: 'Published figures', calc: 'Worked out', docs: 'From documentation' },
  levels: ['Rookie', 'Wall Spotter', 'Rank Zero', 'Copy Maker', 'Shard Keeper', 'Math Splitter', 'Cache Keeper', 'Prefix Reuser', 'Job Runner', 'Stack Builder', 'Benchmarker', 'Distributed Mind'],
  miniMap: {
    caption: 'You are here in the course:',
    row1: [['found', 'Foundations'], ['train', 'Training'], ['infer', 'Inference'], ['ops', 'Run it and measure it'], ['next', 'Frontier']]
  },
  upcoming: [
    { n: 2, title: 'GPU hardware, networking and parallelism strategies', blurb: 'GPUs, links, collectives, and the four ways to split a job' },
    { n: 3, title: 'Distributed training with PyTorch DDP', blurb: 'Copy the model, split the data, average the gradients' },
    { n: 4, title: 'Scaling with Fully Sharded Data Parallel', blurb: 'Shard the model state so each GPU holds a slice' },
    { n: 5, title: 'Beyond state sharding with DeepSpeed and Megatron', blurb: 'Split the math itself: tensor, pipeline and expert parallelism' },
    { n: 6, title: 'Distributed inference and vLLM', blurb: 'The KV cache, PagedAttention and parallel serving' },
    { n: 7, title: 'Cross-request optimization with SGLang', blurb: 'Reuse work between requests, route and split prefill from decode' },
    { n: 8, title: 'Running distributed training with SLURM', blurb: 'Get GPUs from a cluster and launch jobs on them' },
    { n: 9, title: 'The production LLM serving stack', blurb: 'Routing, Kubernetes, cost and reliability' },
    { n: 10, title: 'Distributed benchmarking and performance optimization', blurb: 'Measure honestly, find the bottleneck' },
    { n: 11, title: 'The evolving landscape of distributed AI', blurb: 'Mixture of experts, edge, failures, federated learning, agents' }
  ],
  langLabels: { python: 'Python (PyTorch)', bash: 'Terminal', text: 'Text' }
};
