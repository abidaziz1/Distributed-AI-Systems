/* Chapter 1: introduction to modern distributed AI.
   Where the numbers come from (details in the README): the 6ND rule and the 16 bytes per parameter are standard (Kaplan et al. 2020, the ZeRO paper);
   GPT-3 (175B parameters, 300B tokens, about 3.1e23 operations), Llama 2 and Llama 3.1 token counts, Megatron-LM (8.3B parameters, 8-way model parallel, 64-way data parallel, 512 GPUs),
   PaLM, DeepSeek-V3, AlexNet (two GTX 580 GPUs of 3 GB) and the H100, H200 and B200 memory sizes are published figures, rounded.
   The speed of one H100 is an assumption: about 40 percent of its 989 TFLOP/s bf16 peak. Nothing here ran on a GPU. */
(function () {
  var B = LAB.b, G = LAB.get;

  var HELLO = [
    '# launched with: torchrun --nproc_per_node=4 train.py',
    'import os',
    'import torch',
    'import torch.distributed as dist',
    'from torch.nn.parallel import DistributedDataParallel as DDP',
    '',
    'dist.init_process_group("nccl")',
    'local_rank = int(os.environ["LOCAL_RANK"])',
    'torch.cuda.set_device(local_rank)',
    '',
    'model = MyModel().cuda()',
    'model = DDP(model, device_ids=[local_rank])',
    '',
    'for x, y in loader:',
    '    loss = loss_fn(model(x.cuda()), y.cuda())',
    '    loss.backward()',
    '    optimizer.step()',
    '    optimizer.zero_grad()',
    '',
    'dist.destroy_process_group()'
  ].join('\n');

  var BUG_CODE = [
    'import torch.distributed as dist',
    'from torch.nn.parallel import DistributedDataParallel as DDP',
    'from torch.utils.data import DataLoader',
    '',
    'dist.init_process_group("nccl")',
    'rank = dist.get_rank()',
    'model = DDP(model.to(rank), device_ids=[rank])',
    '',
    'loader = DataLoader(dataset, batch_size=32, shuffle=True)',
    '',
    'for batch in loader:',
    '    loss = model(batch.to(rank)).mean()',
    '    loss.backward()',
    '    optimizer.step()',
    '    optimizer.zero_grad()'
  ].join('\n');

  var BUG_FIX = [
    'from torch.utils.data.distributed import DistributedSampler',
    '',
    'sampler = DistributedSampler(dataset)',
    'loader = DataLoader(dataset, batch_size=32, sampler=sampler)',
    '',
    'for epoch in range(num_epochs):',
    '    sampler.set_epoch(epoch)',
    '    for batch in loader:',
    '        ...'
  ].join('\n');

  LAB.addChapter({
    id: 'm1', n: 1, title: 'Introduction to modern distributed AI', short: 'Why distribute',
    blurb: 'The two walls, how we got here, the model lifecycle, and when you really need many GPUs', minutes: 40,
    focus: ['found'],
    goals: [
      'Say, with numbers, why one GPU cannot train a modern model.',
      'Work out in your head whether a model fits in memory.',
      'Explain what data parallelism does, and why the copies must be synchronized.',
      'Decide whether you need many GPUs at all, and what to try first.'
    ],
    say: 'Chapter 1 starts with a challenge. Before I teach anything, I want you to guess a number. Then we will see why that number shapes this whole field.',
    scenes: [

      /* ---------------------------------------------------------------- the two walls */
      B.quiz({
        id: 'm1-q-time', t: 1, src: 'calc',
        say: 'Guess first. Do not calculate yet. Which answer feels right?',
        q: 'GPT-3 has 175 billion parameters and was trained on 300 billion tokens. That takes about $3.1 \\times 10^{23}$ arithmetic operations. One H100 GPU does roughly $4 \\times 10^{14}$ useful operations per second. How long would one H100 need?',
        opts: [
          { t: 'About a week', fb: 'That would be a quiet weekend. The number of operations is far too large for that.' },
          { t: 'About three months', fb: 'A big cluster could get near that. One GPU is thousands of times slower than a big cluster.' },
          { t: 'About two years', fb: 'Still too fast. Divide $3.1 \\times 10^{23}$ by $4 \\times 10^{14}$ and see.' },
          { t: 'About twenty-five years', fb: '' }
        ],
        ok: 3,
        why: '$\\frac{3.1 \\times 10^{23}}{4 \\times 10^{14}} \\approx 7.8 \\times 10^{8}$ seconds, and a year has about $3.2 \\times 10^{7}$ seconds, so the answer is about 25 years. This is the **time wall**. The only way through it is to share the work between many GPUs.',
        cheer: 'Hold on to that number. It explains most of this course.'
      }),

      B.widget({
        id: 'm1-walls', kind: 'walls', t: 1, src: 'calc', title: 'Lab: the two walls',
        steps: [
          { say: 'This is the time wall for four real training runs. Pick a model, then add GPUs and watch the best-case time shrink. The rule of thumb: training costs about 6 operations for every parameter and every token.' },
          { say: 'Now the memory wall. Training keeps about 16 bytes for every parameter: the weights, the gradients and the optimizer state. Pick a model and see how many 80 GB GPUs it takes just to hold that, before any data arrives.' }
        ]
      }),

      B.talk({
        id: 'm1-deep-6', t: 2, src: 'calc', title: 'Where the 6 comes from',
        say: 'The rule of thumb has a short derivation. Press Next.',
        items: [
          ['The forward pass', 'Each parameter takes part in one multiply and one add for every token. That is about **2** operations per parameter per token.', 'Two per parameter.'],
          ['The backward pass', 'Backpropagation computes two things for every layer: the gradient for the inputs and the gradient for the weights. Each costs about as much as the forward pass, so about **4** operations.', 'Twice the forward pass.'],
          ['Together', '$2 + 4 = 6$ operations per parameter per token, so training costs about $6ND$ for $N$ parameters and $D$ tokens. Attention adds a little for long sequences. A mixture of experts model counts only the parameters it uses for each token.', 'Six, plus a little.']
        ]
      }),

      B.talk({
        id: 'm1-deep-mfu', t: 2, src: 'pub', title: 'How efficient is efficient?',
        say: 'The lab assumed 40 percent of the peak speed. Where does that come from?',
        items: [
          ['MFU', 'Model FLOPs utilization is the share of the GPU peak speed that goes into useful model math: $\\text{MFU} = \\frac{\\text{achieved operations per second}}{\\text{peak operations per second}}$.', 'Useful math over peak math.'],
          ['What published runs reach', 'The PaLM paper reports 46 percent. The Llama 3 paper reports roughly 38 to 43 percent for its 405 billion parameter model on up to 16,000 H100 GPUs. The lab used 40 percent of the 989 trillion operations per second that an H100 can peak at, which is about 400 trillion.', 'About 40 percent is a good run.'],
          ['Why not 100 percent', 'GPUs wait for memory, small operations do not fill the chip, and GPUs wait for each other during communication. Closing that gap is a large part of optimization research.', 'The gap is the research.']
        ]
      }),

      B.talk({
        id: 'm1-deep-16', t: 2, src: 'calc', title: 'Where the 16 comes from',
        say: 'The memory rule also adds up from parts. Press Next.',
        items: [
          ['Weights: 2 bytes', 'The 16-bit copy used by the forward and backward passes.', 'Two bytes.'],
          ['Gradients: 2 bytes', 'One 16-bit gradient for every weight.', 'Two bytes.'],
          ['A 32-bit master copy: 4 bytes', 'Small updates would vanish in 16-bit numbers, so the optimizer keeps its own 32-bit copy of the weights and adds the updates there.', 'Four bytes.'],
          ['Momentum and variance: 8 bytes', 'The Adam optimizer keeps two running averages for every parameter, 4 bytes each.', 'Eight bytes.'],
          ['Total: 16 bytes', '$2 + 2 + 4 + 4 + 4 = 16$ bytes per parameter. Different recipes change the number a little. It is the right figure to start with, and the ZeRO paper uses it too.', 'Sixteen in all.']
        ]
      }),

      B.talk({
        id: 'm1-price', t: 1, title: 'Two walls, one price',
        say: 'Two walls, and each has a fix. The fixes have a price. Press Next.',
        items: [
          ['The time wall', 'One GPU is too slow. The fix is to split the work over many GPUs, so that each one does a share.', 'Share the work.'],
          ['The memory wall', 'One GPU is too small. The fix is to split the model and its state over many GPUs, so that each one holds a piece.', 'Share the memory.'],
          ['The price', 'Splitting makes the GPUs depend on each other. They must exchange numbers all the time, and the exchange takes time. When it is slow, GPUs sit idle, and the extra GPUs buy less than you paid for.', 'Sharing costs communication.'],
          ['The craft', 'Distributed AI systems is the craft of buying the most capacity and speed for the least communication. Every chapter that follows is a different way to make that trade.', 'Most capacity, least talking.']
        ]
      }),

      B.cmp({
        id: 'm1-serve', t: 1, title: 'Training and serving hit different walls',
        say: 'The same two questions apply to serving: does it fit, and is it fast enough? The answers just come from different places. Press Next.',
        cols: ['', 'Training', 'Serving'],
        rows: [
          ['What fills memory', 'Weights, gradients and optimizer state, about 16 bytes per parameter, plus activations', 'Weights, plus a KV cache that grows with every user and every token'],
          ['What limits speed', 'Arithmetic, and the network between GPUs', 'Reading memory: every new token reads all the weights and the cache'],
          ['Why you distribute', 'The state does not fit, and one GPU would take years', 'The weights do not fit, or one GPU cannot serve all the users'],
          ['What you pay', 'Gradient and parameter traffic on every step', 'Partial results exchanged between GPUs in every layer, and more machines to run']
        ],
        steps: [
          { upto: 2, say: 'Memory first, then speed. Training is limited by math and by the wires between GPUs. Serving is mostly limited by how fast memory can be read.' },
          { upto: 4, say: 'Then why you distribute, and what you pay. If you know inference, you already know the right-hand column.' }
        ],
        pick: 'Training asks: how do I fit it and finish in time? Serving asks: how do I fit it and answer fast? Both come down to **memory** and **communication**.'
      }),

      /* ---------------------------------------------------------------- how we got here */
      B.widget({
        id: 'm1-scissors', kind: 'scissors', t: 1, src: 'pub', title: 'Why this keeps getting worse',
        steps: [
          { say: '2012. AlexNet has 60 million parameters, about 0.12 GB. It trained on two GPUs with 3 GB each, and the network was split across them because it did not fit on one. Even then, the model was bigger than the card.', cap: 'AlexNet, 2012: split over two small GPUs.' },
          { say: '2018 and 2019. BERT-large has 340 million parameters and GPT-2 has 1.5 billion. They fit on one GPU, so teams used many GPUs for speed, not for room.', cap: 'BERT and GPT-2: the weights fit on one GPU.' },
          { say: '2019. Megatron-LM trained a model with 8.3 billion parameters. The weights are 16.6 GB, but the training state is about 133 GB, far more than a 32 GB V100. NVIDIA split every layer across 8 GPUs and ran 64 copies of that group side by side. Now the model itself had to be distributed.', cap: 'Megatron-LM, 2019: the model is split.' },
          { say: '2020. GPT-3 has 175 billion parameters. Its weights alone are 350 GB, more than four 80 GB GPUs hold. Its training state is about 2.8 TB.', cap: 'GPT-3, 2020: not even the weights fit on one GPU.' },
          { say: '2022 to 2024. PaLM has 540 billion parameters and DeepSeek-V3 has 671 billion, a mixture of experts model with 37 billion active for each token. Llama 3.1 405B trained on up to 16,000 H100 GPUs. Memory on one GPU crept up to 80 GB, then 141 GB.', cap: 'The giants: thousands of GPUs for one run.' },
          { say: 'Between AlexNet and DeepSeek-V3, model weights grew more than 10,000 times. Memory on one GPU grew about 60 times. The gap is not closing, so spreading a model over many GPUs is not a phase. It is the normal condition of the field.', cap: 'Models grew about 10,000 times. One GPU grew about 60 times.' }
        ]
      }),

      B.cmp({
        id: 'm1-evo', t: 1, title: 'Three eras of machine learning',
        say: 'Here are the three eras side by side. Press Next to read what changed.',
        cols: ['', 'Classic ML', 'Deep learning', 'Foundation models'],
        rows: [
          ['Model size', 'Thousands to millions of parameters', 'Millions to a few billion', 'Billions to hundreds of billions'],
          ['Hardware', 'One CPU, data in memory', 'One GPU, then a few', 'Thousands of GPUs'],
          ['What gets split', 'The data, when it is huge (MapReduce, Spark)', 'The data, to go faster (data parallel)', 'Everything: data, model state, the math, even the requests'],
          ['What breaks first', 'The job is slow', 'Training is slow', 'It does not fit, it is slow, and hardware fails during the run']
        ],
        steps: [
          { upto: 2, say: 'Models grew, and the hardware went from one CPU to thousands of GPUs.' },
          { upto: 4, say: 'In classic ML you split the data. Now you split everything, and the first thing to break changed from speed to whether the job runs at all.' }
        ],
        pick: 'In the old world, distribution was an option for big data. In the new world it is part of the model.'
      }),

      /* ---------------------------------------------------------------- the lifecycle */
      B.flow({
        id: 'm1-flow-life', t: 1, title: 'The life of a model', g: 'life', legend: false,
        steps: [
          { say: 'A model has a life, and GPUs work differently at each stage. Press Next to walk through it.', cap: 'Raw text in, answers out, feedback back in.' },
          { say: 'Step 1. Data. Text, images and code are collected, cleaned, deduplicated and turned into tokens. It is mostly CPU and storage work, but it must keep thousands of GPUs fed.', on: ['l1'], focus: ['data', 'pre'], cap: 'Data has to arrive as fast as the GPUs eat it.' },
          { say: 'Step 2. Pretraining. The model learns to predict the next token over trillions of tokens. This is the largest single training job: thousands of GPUs for weeks.', on: ['l1'], focus: ['g_tr', 'pre'], tags: ['t_pre'], cap: 'The biggest cluster, the longest run.' },
          { say: 'Step 3. Post-training. Fine-tuning teaches the model to follow instructions, and preference tuning and reinforcement learning shape its behavior. The jobs are smaller, but reinforcement learning has the model generate answers and learn from them in one loop, so serving and training meet here.', on: ['l2'], focus: ['g_tr', 'post'], tags: ['t_post'], cap: 'Generation and training in the same loop.' },
          { say: 'Step 4. Evaluation. Benchmarks and tests decide whether the model is good enough. These are many small jobs, run often, and a short check also runs during training to catch problems early.', on: ['l3'], focus: ['post', 'eval'], cap: 'Many small jobs, run often.' },
          { say: 'Step 5. Serving. Users send requests and the model answers, around the clock. Now latency, cost per token and the memory of the KV cache matter more than raw arithmetic.', on: ['l4'], focus: ['g_in', 'serve'], tags: ['t_serve'], cap: 'Always on, and paid for by the token.' },
          { say: 'Step 6. Feedback. Logs, ratings and failures become new data, and the loop starts again.', on: ['fb'], focus: ['serve', 'data'], cap: 'The loop closes.' },
          { say: 'Each stage has a different bottleneck, so each stage has different targets for optimization. That is where research happens.', tags: ['t_pre', 't_post', 't_serve'], cap: 'Different stage, different wall.' }
        ]
      }),

      B.cmp({
        id: 'm1-life-cmp', t: 1, title: 'Where each stage hurts',
        say: 'The same loop as a table. Press Next to see what is scarce at each stage, and where optimization research lands.',
        cols: ['Stage', 'What is scarce', 'Where optimization research lands'],
        hl: 2,
        rows: [
          ['Pretraining', 'GPU hours, network bandwidth, and uptime across thousands of GPUs', 'Better parallel layouts, hiding communication behind compute, surviving failures'],
          ['Post-training', 'Memory and time, because generation and training share the cluster', 'Fast generation inside a training loop, moving weights between the two jobs'],
          ['Evaluation', 'Wall-clock time and the cost of many small runs', 'Batching, caching, cheaper approximations'],
          ['Serving', 'Memory for the KV cache, and cost per token', 'Smarter batching and cache use, quantization, speculative decoding, parallel layouts']
        ],
        steps: [
          { upto: 2, say: 'Training stages first: the big cluster, then the loop that mixes generation with training.' },
          { upto: 4, say: 'Then evaluation and serving.' }
        ],
        pick: 'Your research will usually attack one cell of this table. Knowing which wall that stage hits tells you which tools to learn first.'
      }),

      /* ---------------------------------------------------------------- the decision framework */
      B.talk({
        id: 'm1-ladder', t: 1, src: 'docs', title: 'Try the cheap tricks first',
        say: 'Before you add GPUs, try the tricks that cost nothing in communication. Press Next.',
        items: [
          ['Use 16-bit numbers', 'Half the bytes of 32-bit for weights, gradients and activations, and much faster on modern GPUs. Almost every large run already does this.', 'Fewer bytes per number.'],
          ['Recompute instead of store', 'Activation checkpointing throws away some intermediate results in the forward pass and recomputes them in the backward pass. It costs about one third more compute and saves a lot of memory.', 'Trade compute for memory.'],
          ['Accumulate gradients', 'Run several small batches, add their gradients, then update once. You get the effect of a big batch without the memory of one. It does not make training faster.', 'A big batch, in small pieces.'],
          ['Train less of the model', 'Adapters such as LoRA freeze the big weights and train small extra matrices, so almost all gradients and optimizer state disappear. Quantizing the frozen weights to 4-bit goes further.', 'Do not train what you do not need to.'],
          ['Only then, distribute', 'If it still does not fit, or is still too slow, add GPUs. Every GPU you add brings communication, failures and harder debugging.', 'Distribution is a cost, not a goal.']
        ]
      }),

      B.flow({
        id: 'm1-flow-tree', t: 1, title: 'When do you need many GPUs?', g: 'tree', legend: false,
        steps: [
          { say: 'This tree is the whole decision for training. Start at the top and answer honestly. Press Next to walk through it.', cap: 'Does it fit? Is it fast enough? Then climb.' },
          { say: 'Question 1. Does the training state fit on one GPU: weights, gradients, optimizer state and activations? If it does, go left.', on: ['t1'], focus: ['q1', 'q2'], cap: 'First, memory.' },
          { say: 'Question 2. Is one GPU fast enough? If yes, stop. A single GPU is the simplest system there is, and simple wins.', on: ['t3'], focus: ['q2', 'one'], cap: 'Fits and fast enough: stay.' },
          { say: 'If it fits but is too slow, copy the model to every GPU and split the data. That is data parallelism, DDP, in Chapter 3. The model still fits on each GPU, so only gradients travel.', on: ['t4'], focus: ['q2', 'ddp'], cap: 'Fits but slow: copy and split the data.' },
          { say: 'If the state does not fit, first try the cheap tricks: 16-bit numbers, recomputation, adapters. If they make it fit, you are back on the left side of the tree.', on: ['t2', 't5'], focus: ['q1', 'tr', 'q2'], cap: 'Does not fit: cheap tricks first.' },
          { say: 'If it still does not fit, shard the state: each GPU keeps only a slice and gathers the rest when needed. That is FSDP and ZeRO, in Chapter 4.', on: ['t6'], focus: ['tr', 'fs'], cap: 'Still too big: shard the state.' },
          { say: 'If it is still too big or too slow across machines, split the math itself: tensor, pipeline and expert parallelism, in Chapter 5. Each rung adds communication, so climb only as far as you must.', on: ['t7'], focus: ['fs', 'mg'], cap: 'Climb only as far as you must.' }
        ]
      }),

      B.widget({
        id: 'm1-fit', kind: 'fit', t: 1, src: 'calc', title: 'Lab: will it fit?',
        steps: [
          { say: 'This is the calculator to run before every project. Press the three training presets in order. The dashed line is the memory of one GPU. Watch what DDP fixes, and what it does not. Then try the serving presets.' }
        ]
      }),

      B.quiz({
        id: 'm1-q-state', t: 1, src: 'calc',
        q: 'A 7 billion parameter model has 14 GB of weights in 16-bit. How much memory does training it with the Adam optimizer need for weights, gradients and optimizer state, ignoring activations?',
        opts: [
          { t: 'About 14 GB', fb: 'That is the weights alone. Training also stores gradients and the optimizer state.' },
          { t: 'About 28 GB', fb: 'That adds the gradients, another 14 GB. The optimizer state is still missing, and it is the biggest part.' },
          { t: 'About 112 GB', fb: '' },
          { t: 'About 1.1 TB', fb: 'That is the figure for a 70 billion parameter model. This model is ten times smaller.' }
        ],
        ok: 2,
        why: 'About 16 bytes per parameter: 2 for the weights, 2 for the gradients and 12 for the optimizer. $7 \\times 10^{9} \\times 16 = 1.12 \\times 10^{11}$ bytes, which is 112 GB. That is 8 times the weights, and more than one 80 GB GPU can hold.'
      }),

      B.quiz({
        id: 'm1-q-ddp', t: 1, src: 'calc',
        q: 'You have 8 GPUs with 80 GB each. Fully fine-tuning a 7B model needs about 112 GB, so one GPU runs out of memory. You switch to data parallel training (DDP) on all 8 GPUs. What happens?',
        opts: [
          { t: 'It fits, because the 112 GB is shared over 8 GPUs', fb: 'That describes sharding (FSDP, ZeRO), not DDP. DDP gives every GPU a full copy.' },
          { t: 'It still runs out of memory on every GPU', fb: '' },
          { t: 'It fits, but each GPU trains a different part of the model', fb: 'Splitting the model is model parallelism. DDP keeps a whole model on every GPU and splits the data instead.' },
          { t: 'It runs 8 times slower', fb: 'DDP exists to make training faster. It fails here for a different reason.' }
        ],
        ok: 1,
        why: 'DDP copies the weights, the gradients and the optimizer state onto every GPU, so each one needs the full 112 GB. DDP buys speed, not room. To buy room you must shard the state (Chapter 4) or split the model (Chapter 5).'
      }),

      B.quiz({
        id: 'm1-q-serve', t: 1, src: 'calc',
        q: 'A 70 billion parameter model has 140 GB of weights in 16-bit. What is the fewest 80 GB GPUs that can hold the weights?',
        opts: [
          { t: '1', fb: 'One GPU has 80 GB, which is less than 140 GB.' },
          { t: '2', fb: '' },
          { t: '3', fb: 'Three would hold them, but two is enough. 140 / 80 is 1.75.' },
          { t: '4', fb: 'Four leaves lots of room, but the question asks for the fewest.' }
        ],
        ok: 1,
        why: '140 / 80 = 1.75, so 2 GPUs. That leaves only 20 GB for the KV cache and everything else, so real deployments often use 4. Chapter 6 shows how to size the cache.'
      }),

      B.decide({
        id: 'm1-dec-1', t: 1, title: 'Decision: fine-tune a 7B model',
        scenario: 'You want to fine-tune a **7 billion parameter** model on your own data. You have **one 80 GB GPU**. Full fine-tuning with Adam needs about 16 bytes per parameter, so about **112 GB**. The task is narrow: a style and a format, not new knowledge.',
        opts: [
          { t: 'Buy more GPUs and run data parallel (DDP)', d: 'Every GPU gets a full copy of the model and its state.', lose: 'DDP copies the state to every GPU. It makes training faster, but it does not make the state smaller. Each GPU would still need 112 GB.' },
          { t: 'Train small adapters (LoRA) on top of the frozen model', d: 'The 14 GB of weights stay frozen. Only small extra matrices get gradients and optimizer state.' },
          { t: 'Shard the state over several GPUs (FSDP)', d: 'Each GPU holds a slice of the 112 GB.', lose: 'This works, but you have one GPU. You would need to rent more, and pay communication, for a task that adapters can handle.' }
        ],
        pick: 1,
        why: 'The weights alone are 14 GB in 16-bit, which fits. The 112 GB comes from gradients and optimizer state for every parameter. LoRA trains only small adapter matrices, so those costs shrink to a tiny fraction. For a narrow task it often gets close to full fine-tuning.',
        when: 'Choose FSDP when the task needs full fine-tuning and you have several GPUs. Choose DDP only when the whole state already fits on one GPU and you want speed.'
      }),

      B.decide({
        id: 'm1-dec-2', t: 1, title: 'Decision: pretrain a 1B model in two weeks',
        scenario: 'You must pretrain a **1 billion parameter** model on **300 billion tokens** within **two weeks**. You have **one machine with 8 GPUs** of 80 GB each. The training state is about 16 GB, so it fits on one GPU. On one GPU the run would take about 52 days.',
        opts: [
          { t: 'Data parallel (DDP) on all 8 GPUs', d: 'Copy the model to each GPU, split the data, average the gradients.' },
          { t: 'Shard everything with FSDP', d: 'Split the state over the 8 GPUs.', lose: 'It would run, but you would pay extra communication to save memory you do not need. The state already fits.' },
          { t: 'Split every layer across the GPUs (tensor parallel)', d: 'Each GPU computes a slice of every matrix multiplication.', lose: 'This is for models that are too big for one GPU. Here it adds communication inside every layer for no gain.' }
        ],
        pick: 0,
        why: 'The model fits, so the only problem is time. Eight GPUs in the best case turn 52 days into about 6.5 days, which meets the deadline with room for lost efficiency. DDP adds the least communication: one gradient exchange per step.',
        when: 'Pick FSDP when the state does not fit on one GPU. Pick tensor parallelism when a single layer is too big, or when you must cut the time of every step across a fast link inside one machine.'
      }),

      B.decide({
        id: 'm1-dec-3', t: 2, title: 'Decision: serve a 70B model',
        scenario: 'You must serve a **70 billion parameter** model to many users. In 16-bit its weights are **140 GB**, but your GPUs have **80 GB**. Your evaluations show that 4-bit weights lose almost no quality on your task, and 4-bit weights take about **35 GB**.',
        opts: [
          { t: 'Split the model across 2 or more GPUs (tensor parallel)', d: 'Each GPU holds a slice of every layer, in 16-bit.', lose: 'It works and keeps full precision, but every replica needs 2 GPUs and a fast link between them, and every layer exchanges results. If quality is not at risk, there is a cheaper way.' },
          { t: 'Quantize to 4-bit and put one full copy on each GPU', d: '35 GB of weights leaves room for the KV cache on one 80 GB GPU.' },
          { t: 'Pipeline the layers across machines', d: 'Different GPUs run different layers and pass activations along.', lose: 'Pipelining is for models that are too large for the fast links inside one machine. Here it adds delay and complexity.' }
        ],
        pick: 1,
        why: 'The cheapest distribution is none. Shrinking the weights to 35 GB fits one GPU with about 45 GB left for the KV cache, so each GPU serves users on its own and you scale by adding copies. No GPU waits on another.',
        when: 'Choose tensor parallelism when you must keep 16-bit weights, or when even the 4-bit model leaves too little room for the KV cache at your context length.'
      }),

      B.challenge({
        id: 'm1-drill', t: 2, title: 'Estimation drill: how many GPUs?', file: 'estimate.txt', lang: 'text',
        q: 'You want to train a **13 billion parameter** model on **1 trillion tokens** in **10 days**. Assume one H100 delivers **400 trillion** useful operations per second and has **80 GB**. How many GPUs do you need for the time, and which strategy can hold the state?',
        starter: '# Write your steps here\n# 1. operations needed\n# 2. operations per second needed\n# 3. number of GPUs\n# 4. memory per GPU if you copy the state',
        hints: ['Operations = 6 x parameters x tokens.', 'Ten days is 10 x 86,400 = 864,000 seconds. Divide the operations by the seconds to get the speed you need, then divide by 4 x 10^14.', 'The state is 16 bytes per parameter. Would a full copy of it fit in 80 GB?'],
        sol: 'operations = 6 * 13e9 * 1e12    = 7.8e22\nseconds    = 10 * 86400         = 864,000\nneeded     = 7.8e22 / 864000    = 9.0e16 operations per second\nGPUs       = 9.0e16 / 4e14      = about 226, plan for 256\nstate      = 16 * 13e9 bytes    = 208 GB',
        expl: ['About 226 GPUs is the best case. Real runs lose time to communication, so plan for 256 or more.', 'The state is 208 GB. A full copy does not fit in 80 GB, so DDP alone cannot work. Sharding the state over 256 GPUs leaves under 1 GB of state per GPU, so FSDP fits easily (Chapter 4).', 'Time decided the number of GPUs. Memory decided the strategy. They are two separate questions.']
      }),

      /* ---------------------------------------------------------------- hands-on: one program, many processes */
      B.flow({
        id: 'm1-flow-ddp', t: 1, title: 'Hands-on: one training step on four GPUs', g: 'ddp', legend: true,
        steps: [
          { say: 'Hands-on time. First as a picture, then by hand with real arithmetic, then as PyTorch code. No GPU needed. Four GPUs, one model, one batch. Press Next to follow one training step.', cap: 'Four ranks, each with a full copy.' },
          { say: 'Every rank holds the same full copy of the model. Memory per GPU does not shrink. That is the price of this simplicity.', focus: ['r0', 'r1', 'r2', 'r3'], cap: 'The same model everywhere.' },
          { say: 'Step 1. The batch is cut into four slices. Each rank gets its own slice, so each GPU works on different data.', on: ['d0', 'd1', 'd2', 'd3'], focus: ['data', 'r0', 'r1', 'r2', 'r3'], cap: 'Different data on every GPU.' },
          { say: 'Step 2. Each rank runs the forward and backward pass on its own slice. Different data gives a different gradient on each rank.', focus: ['r0', 'r1', 'r2', 'r3'], tags: ['tg0', 'tg1', 'tg2', 'tg3'], cap: 'Four different gradients.' },
          { say: 'Step 3. The all-reduce. The ranks send their gradients in, and the system adds them up and divides by four.', on: ['g0', 'g1', 'g2', 'g3'], focus: ['r0', 'r1', 'r2', 'r3', 'bus'], tags: ['tg0', 'tg1', 'tg2', 'tg3'], cap: 'Gradients travel to the all-reduce.' },
          { say: 'The average comes back to every rank. Now all four hold exactly the same gradient.', on: ['a0', 'a1', 'a2', 'a3'], focus: ['r0', 'r1', 'r2', 'r3', 'bus'], tags: ['ta0', 'ta1', 'ta2', 'ta3'], cap: 'One average, delivered to everyone.' },
          { say: 'Step 4. Each rank updates its own copy with the same gradient, so the four copies stay identical. Training goes on as if one GPU had seen the whole batch. The price: one all-reduce of the whole gradient on every step.', status: { r0: 'ok', r1: 'ok', r2: 'ok', r3: 'ok' }, tags: ['ta0', 'ta1', 'ta2', 'ta3'], cap: 'Identical copies, one all-reduce per step.' }
        ]
      }),

      B.widget({
        id: 'm1-lab-dp', kind: 'dp', t: 1, src: 'calc', title: 'Lab: data parallel by hand',
        steps: [
          { say: 'Now the same step with real numbers: a model with one weight, eight data points, four ranks. Press Step once and read the four local gradients. They differ, because each rank saw different data. Then compare the average with the check underneath.' },
          { say: 'Now break it. All-reduce is switched off and the weights are reset. Press Step a few times and watch the four copies drift apart. Then switch all-reduce on, press Reset and step again. This is why the all-reduce is not optional.' }
        ]
      }),

      B.order({
        id: 'm1-order', t: 1, q: 'Put one training step of data parallelism in order.',
        items: [
          'Each GPU takes its own slice of the batch',
          'Each GPU runs the forward pass on its slice',
          'Each GPU runs the backward pass and gets its own gradient',
          'All GPUs average their gradients with an all-reduce',
          'Every GPU applies the same update to its own copy'
        ],
        why: 'The slices differ, so the gradients differ. The all-reduce makes the gradients identical everywhere, and identical updates keep every copy of the model identical.'
      }),

      B.code({
        id: 'm1-code-hello', t: 1, src: 'docs', title: 'The same idea in PyTorch', file: 'train.py', lang: 'python', code: HELLO,
        steps: [
          { say: 'The command line is part of the program. torchrun starts four copies of this file, one for each GPU, and tells every copy who it is through environment variables such as RANK, LOCAL_RANK and WORLD_SIZE.', lines: G.span(HELLO, /# launched with/) },
          { say: 'Every copy joins the same group. "nccl" is the library that moves data between NVIDIA GPUs. On a CPU you would write "gloo". After this line the copies can talk to each other.', lines: G.span(HELLO, /dist\.init_process_group/) },
          { say: 'LOCAL_RANK is the position of this copy inside its machine, 0 to 3 here. Each copy pins itself to the GPU with that number.', lines: G.span(HELLO, /local_rank = int/, /set_device/) },
          { say: 'DDP wraps the model. Every copy keeps a full model, and DDP adds the machinery that averages gradients across all copies while the backward pass runs.', lines: G.span(HELLO, /model = MyModel/, /model = DDP/) },
          { say: 'The training loop is the ordinary single-GPU loop. Nothing in it names another GPU. The averaging happens inside loss.backward().', lines: G.span(HELLO, /for x, y in loader/, /zero_grad/) },
          { say: 'When the job ends, leave the group.', lines: G.span(HELLO, /destroy_process_group/) }
        ],
        note: 'This is the standard pattern from the PyTorch documentation. It was not run here, because this machine has no GPU.'
      }),

      B.bug({
        id: 'm1-bug-sampler', t: 1, src: 'docs',
        q: 'This script runs on 4 GPUs. Training works, but an epoch takes exactly as long as on 1 GPU. Click the line that wastes the extra GPUs.',
        file: 'train_ddp.py', lang: 'python', code: BUG_CODE, bad: [G.at(BUG_CODE, /DataLoader\(dataset/)],
        hint: 'Who decides which samples each process reads?',
        why: 'Without a DistributedSampler, every process walks through the entire dataset. The four GPUs repeat the same work, so an epoch is no shorter. A DistributedSampler gives each rank its own slice with no overlap, so an epoch takes about a quarter of the time.',
        fix: BUG_FIX,
        cheer: 'Each rank must read its own slice.'
      }),

      B.talk({
        id: 'm1-vocab', t: 1, src: 'docs', title: 'The words every distributed program uses',
        say: 'Six words cover almost everything you will read in the documentation. Press Next.',
        items: [
          ['Process', 'One running copy of your program. In GPU training, one process drives one GPU.', 'One process per GPU.'],
          ['World size', 'The total number of processes in the job. Four machines with eight GPUs each, one process per GPU, make a world size of 32.', 'How many processes in total.'],
          ['Rank', 'The number that identifies a process, from 0 to world size minus 1. Rank 0 usually does the extra jobs, such as logging and saving checkpoints. The **local rank** is the number inside one machine.', 'Who am I?'],
          ['Process group and backend', 'The set of processes that talk to each other. The **backend** is the library that carries the messages: NCCL for NVIDIA GPUs, Gloo for CPUs.', 'Who talks to whom, and with what.'],
          ['Launcher and rendezvous', 'A launcher such as **torchrun** starts the processes and gives each one its rank. At start-up they meet at an agreed address, the **rendezvous**, to find each other.', 'Start them, then let them find each other.'],
          ['Collectives', 'Operations in which every process in the group takes part. **All-reduce** sums a tensor over all processes and gives everyone the result. Chapter 2 opens the whole toolbox.', 'The shared language of GPUs.']
        ]
      }),

      B.quiz({
        id: 'm1-q-rank', t: 1, src: 'docs',
        q: 'A job runs on 2 machines with 4 GPUs each, one process per GPU. What are the world size, and the global rank and local rank of the third GPU on the second machine?',
        opts: [
          { t: 'World size 2, rank 2, local rank 3', fb: 'World size counts processes, not machines. There are 8 processes.' },
          { t: 'World size 8, rank 6, local rank 2', fb: '' },
          { t: 'World size 8, rank 7, local rank 3', fb: 'That is the fourth GPU. Counting starts at 0, so the third GPU has local rank 2.' },
          { t: 'World size 4, rank 2, local rank 2', fb: 'World size is the total over all machines, not the count on one machine.' }
        ],
        ok: 1,
        why: 'World size is the number of processes: 2 x 4 = 8. The first machine holds global ranks 0 to 3 and the second holds 4 to 7. The third GPU on the second machine has local rank 2, counting from 0, and global rank 4 + 2 = 6.'
      }),

      /* ---------------------------------------------------------------- explain it back */
      B.qa({
        id: 'qa-why-not-one', t: 1, tag: 'Foundations', secs: 60,
        q: 'Why can we not just train large models on one big GPU?',
        pts: ['Memory: training needs about 16 bytes per parameter, far more than the weights', 'Example: a 70B model needs about 1.1 TB of state, and one GPU has 80 GB', 'Time: about 6 operations per parameter per token, so years on one GPU', 'Model size grew far faster than memory on one GPU', 'More GPUs fix both walls, but they must exchange data', 'The craft is paying the least communication for the capacity'],
        short: 'Two walls stop us: memory and time.\n\nMemory first. Training keeps about 16 bytes for every parameter: 2 for the weights, 2 for the gradients and 12 for the optimizer state. A 70 billion parameter model therefore needs about 1.1 terabytes of state, and one GPU has 80 gigabytes.\n\nThen time. Training costs about 6 operations per parameter per token. For a 70 billion parameter model on 2 trillion tokens that is about 8 times 10 to the power of 23, which is decades on one GPU, even at a good 40 percent efficiency.\n\nModel sizes grew more than ten thousand times in a decade, and GPU memory about sixty times, so the gap is not closing.\n\nMany GPUs fix both walls, but they depend on each other and must exchange data, and that costs time. Distributed systems work is getting the most capacity for the least communication.',
        fu: [
          ['Does more memory per GPU fix it?', 'It helps, and new GPUs do get more memory, but models grew faster. Even a 141 GB or 180 GB card cannot hold the training state of a 70B model, which is about 1.1 TB.'],
          ['Which wall is harder?', 'It depends on the job. Memory decides whether you can run at all. Time decides whether the run finishes. Most large runs hit both.']
        ],
        trap: 'Saying only "the model is too big". The training state is eight times the weights, and that surprises people.',
        real: 'Pick a model you know. Work out its training state and its training time on one GPU.'
      }),

      B.qa({
        id: 'qa-when-not', t: 1, tag: 'Decision', secs: 60,
        q: 'When would you not use many GPUs?',
        pts: ['The state fits on one GPU and the time is acceptable', 'Cheap tricks first: 16-bit, recomputation, gradient accumulation, adapters, quantization', 'Distribution adds communication, failures and debugging cost', 'DDP buys speed but not memory, so it cannot fix a model that does not fit', 'Use the least distribution that meets the memory and time goals'],
        short: 'I would stay on one GPU whenever the training state fits and the run finishes in time. One GPU is the simplest system there is. It has no communication cost and no synchronization bugs.\n\nBefore adding GPUs I try the cheap tricks: 16-bit numbers, activation recomputation, gradient accumulation, adapters such as LoRA, and quantized weights. Each of them saves memory or time without any network traffic.\n\nWhen those are not enough I add the least distribution that works. If the model fits but training is too slow, I use data parallelism. If the model does not fit, copying it to more GPUs will not help, so I shard the state or split the model. Each step up buys capacity and charges communication, so I stop as soon as the memory and time goals are met.',
        fu: [
          ['Why not always use many GPUs?', 'More GPUs bring communication cost, more failures and harder debugging. Scaling efficiency drops as you add GPUs, so the last GPUs are the least useful.'],
          ['How do you know the state fits?', 'Count 16 bytes per parameter for Adam in mixed precision, add the activations, and compare with the GPU memory. Then confirm with a short real run.']
        ],
        trap: 'Using DDP to fix an out-of-memory error. DDP copies the whole state to every GPU.',
        real: 'Think of a run you did. Could a cheaper trick have avoided adding GPUs?'
      }),

      B.recap({
        id: 'm1-recap', n: 1, badge: 'Wall Spotter', color: '#BFDBFE',
        pts: [
          'The **time wall**: training costs about $6ND$ operations. GPT-3 would take about 25 years on one H100.',
          'The **memory wall**: training keeps about **16 bytes per parameter**, so a 70B model needs about 1.1 TB of state.',
          'Models grew more than 10,000 times in a decade and GPU memory about 60 times, so distribution is permanent.',
          'The **price** of many GPUs is communication. Every technique in this course trades capacity or speed against it.',
          '**DDP copies, FSDP shards.** Data parallelism buys speed, not memory, and the all-reduce keeps the copies identical.',
          'Try the cheap tricks first, then use the least distribution that meets the memory and time goals.'
        ],
        lines: [
          'A GPU is limited by memory and by time.',
          'Every trick buys capacity and charges communication.',
          'Copy for speed, shard for room.'
        ]
      })
    ]
  });
})();
