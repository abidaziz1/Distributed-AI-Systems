/* Diagram specs for the course. Plain data: nodes, edges, groups, tags. shared/js/graph.js draws them.
   Orange blocks that move along an arrow are data. A pill (tag) is a short note that a step switches on. */
(function () {
  var LAB = (window.LAB = window.LAB || {});
  var H = LAB.Graph.h, V = LAB.Graph.v;
  var S = (LAB.graphs = {});

  /* ------------------------------------------------------------------ */
  /* 1. The whole course on one page                                     */
  /* ------------------------------------------------------------------ */
  S.map = {
    w: 1100, h: 660,
    label: 'The course map: foundations in chapters 1 and 2, a training ladder in chapters 3 to 5, serving in chapters 6 and 7, and running, measuring and looking ahead in chapters 8 to 11',
    groups: [
      { id: 'g_f', x: 190, y: 40, w: 720, h: 112, t: 'FOUNDATIONS', c: 'src' },
      { id: 'g_t', x: 20, y: 200, w: 520, h: 330, t: 'TRAINING', c: 'stg' },
      { id: 'g_s', x: 560, y: 200, w: 520, h: 230, t: 'SERVING', c: 'con' },
      { id: 'g_r', x: 0, y: 566, w: 1100, h: 94, t: 'RUN IT, MEASURE IT, LOOK AHEAD', c: 'mon' }
    ],
    nodes: [
      { id: 'c1', x: 210, y: 66, w: 320, h: 76, t: '1. Why distribute', s: 'the walls and the price', c: 'src', k: 'chip' },
      { id: 'c2', x: 570, y: 66, w: 320, h: 76, t: '2. Hardware and links', s: 'GPUs, networks, collectives', c: 'src', k: 'chip' },
      { id: 'c3', x: 40, y: 232, w: 480, h: 76, t: '3. Data parallel (DDP)', s: 'copy the model, split the data', c: 'stg', k: 'chip' },
      { id: 'c4', x: 40, y: 336, w: 480, h: 76, t: '4. Sharding (FSDP, ZeRO)', s: 'split the model state', c: 'stg', k: 'chip' },
      { id: 'c5', x: 40, y: 440, w: 480, h: 76, t: '5. Megatron and DeepSpeed', s: 'split the math itself', c: 'stg', k: 'chip' },
      { id: 'c6', x: 580, y: 232, w: 480, h: 76, t: '6. vLLM', s: 'batching and the KV cache', c: 'con', k: 'chip' },
      { id: 'c7', x: 580, y: 336, w: 480, h: 76, t: '7. SGLang', s: 'reuse work across requests', c: 'con', k: 'chip' },
      { id: 'c8', x: 15, y: 592, w: 250, h: 56, t: '8. SLURM', s: 'get the GPUs', c: 'mon', k: 'chip' },
      { id: 'c9', x: 285, y: 592, w: 250, h: 56, t: '9. Serving stack', s: 'routing, Kubernetes', c: 'mon', k: 'chip' },
      { id: 'c10', x: 555, y: 592, w: 250, h: 56, t: '10. Benchmarking', s: 'measure, then optimize', c: 'mon', k: 'chip' },
      { id: 'c11', x: 825, y: 592, w: 260, h: 56, t: '11. What comes next', s: 'MoE, edge, faults, agents', c: 'mon', k: 'chip' }
    ],
    edges: [
      { id: 'e1', a: 'c1', b: 'c2', d: 'M530 104 H570', pk: 1 },
      { id: 'e2', a: 'c2', b: 'c3', d: V(640, 142, 280, 232), pk: 1 },
      { id: 'e3', a: 'c2', b: 'c6', d: V(820, 142, 820, 232), pk: 1 },
      { id: 'e4', a: 'c3', b: 'c4', d: 'M280 308 V336', label: 'state does not fit', lx: 390, ly: 327, pk: 1 },
      { id: 'e5', a: 'c4', b: 'c5', d: 'M280 412 V440', label: 'too slow across nodes', lx: 400, ly: 431, pk: 1 },
      { id: 'e6', a: 'c6', b: 'c7', d: 'M820 308 V336', label: 'repeated prefixes', lx: 930, ly: 327, pk: 1 }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* 2. The life of a model                                              */
  /* ------------------------------------------------------------------ */
  S.life = {
    w: 1100, h: 400,
    label: 'The life of a model: data, pretraining, post-training, evaluation and serving, with logs and ratings from users flowing back into the data',
    groups: [
      { id: 'g_tr', x: 210, y: 80, w: 435, h: 170, t: 'TRAINING', c: 'stg' },
      { id: 'g_in', x: 885, y: 80, w: 210, h: 170, t: 'INFERENCE', c: 'con' }
    ],
    nodes: [
      { id: 'data', x: 0, y: 100, w: 180, h: 130, t: 'Data', ss: ['collect, clean,', 'tokenize'], c: 'src' },
      { id: 'pre', x: 225, y: 100, w: 180, h: 130, t: 'Pretraining', ss: ['next-token', 'prediction'], c: 'stg' },
      { id: 'post', x: 450, y: 100, w: 180, h: 130, t: 'Post-training', ss: ['fine-tuning,', 'preferences, RL'], c: 'stg' },
      { id: 'eval', x: 675, y: 100, w: 180, h: 130, t: 'Evaluation', ss: ['benchmarks,', 'safety tests'], c: 'mart' },
      { id: 'serve', x: 900, y: 100, w: 180, h: 130, t: 'Serving', ss: ['users, around', 'the clock'], c: 'con' }
    ],
    edges: [
      { id: 'l1', a: 'data', b: 'pre', d: 'M180 165 H225', pk: 1 },
      { id: 'l2', a: 'pre', b: 'post', d: 'M405 165 H450', pk: 1 },
      { id: 'l3', a: 'post', b: 'eval', d: 'M630 165 H675', pk: 1 },
      { id: 'l4', a: 'eval', b: 'serve', d: 'M855 165 H900', pk: 1 },
      { id: 'fb', a: 'serve', b: 'data', d: 'M990 230 C990 350 90 350 90 230', label: 'logs, ratings and failures become new data', lx: 540, ly: 334, pk: 3 }
    ],
    tags: [
      { id: 't_pre', x: 170, y: 8, t: 'thousands of GPUs, weeks', c: 'stg' },
      { id: 't_post', x: 470, y: 8, t: 'generation plus training', c: 'stg' },
      { id: 't_serve', x: 800, y: 8, t: 'replicas, always on', c: 'con' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* 3. The decision tree for training                                   */
  /* ------------------------------------------------------------------ */
  S.tree = {
    w: 1100, h: 620,
    label: 'Decision tree for training: if the state fits on one GPU and one GPU is fast enough, stay on one GPU. If it fits but is too slow, use data parallel. If it does not fit, try cheap tricks, then shard the state, then split the math.',
    nodes: [
      { id: 'q1', x: 300, y: 10, w: 500, h: 84, t: 'Does the training state fit on one GPU?', s: 'weights, gradients, optimizer state, activations', c: 'mon', k: 'chip' },
      { id: 'q2', x: 20, y: 170, w: 430, h: 84, t: 'Is one GPU fast enough?', s: 'compare the time estimate with your deadline', c: 'mon', k: 'chip' },
      { id: 'tr', x: 640, y: 170, w: 440, h: 84, t: 'Do the cheap tricks make it fit?', s: '16-bit, recompute, adapters, quantize', c: 'mon', k: 'chip' },
      { id: 'one', x: 0, y: 330, w: 260, h: 84, t: 'Stay on one GPU', s: 'the simplest system', c: 'mart', k: 'chip' },
      { id: 'ddp', x: 290, y: 330, w: 330, h: 84, t: 'Data parallel (DDP)', s: 'copy the model, split data. Ch 3', c: 'stg', k: 'chip' },
      { id: 'fs', x: 650, y: 330, w: 430, h: 84, t: 'Shard the state (FSDP, ZeRO)', s: 'each GPU keeps a slice. Ch 4', c: 'int', k: 'chip' },
      { id: 'mg', x: 650, y: 490, w: 430, h: 84, t: 'Split the math too', s: 'tensor, pipeline, expert. Ch 5', c: 'con', k: 'chip' },
      { id: 'srv', x: 0, y: 500, w: 560, h: 74, t: 'Serving has its own version of this tree', s: 'weights fit? KV cache fits? fast enough? Ch 6', c: 'src', k: 'chip' }
    ],
    edges: [
      { id: 't1', a: 'q1', b: 'q2', d: V(380, 94, 235, 170), label: 'yes' },
      { id: 't2', a: 'q1', b: 'tr', d: V(720, 94, 860, 170), label: 'no' },
      { id: 't3', a: 'q2', b: 'one', d: V(150, 254, 130, 330), label: 'yes' },
      { id: 't4', a: 'q2', b: 'ddp', d: V(330, 254, 440, 330), label: 'no' },
      { id: 't5', a: 'tr', b: 'q2', d: H(640, 212, 450, 212), label: 'yes, it fits' },
      { id: 't6', a: 'tr', b: 'fs', d: V(860, 254, 865, 330), label: 'no' },
      { id: 't7', a: 'fs', b: 'mg', d: V(865, 414, 865, 490), label: 'still too big or too slow' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* 4. Data parallel in one picture                                     */
  /* ------------------------------------------------------------------ */
  S.ddp = {
    w: 1100, h: 560, pk: 1,
    label: 'Data parallel training on four GPUs: each GPU holds a full copy of the model and works on its own slice of the batch, an all-reduce averages the four gradients, and every copy applies the same update',
    nodes: [
      { id: 'data', x: 0, y: 150, w: 230, h: 260, t: 'One batch', ss: ['8 samples,', 'cut into 4 slices'], c: 'src' },
      { id: 'r0', x: 300, y: 10, w: 330, h: 110, t: 'Rank 0', ss: ['GPU 0, full model copy'], c: 'stg' },
      { id: 'r1', x: 300, y: 150, w: 330, h: 110, t: 'Rank 1', ss: ['GPU 1, full model copy'], c: 'stg' },
      { id: 'r2', x: 300, y: 290, w: 330, h: 110, t: 'Rank 2', ss: ['GPU 2, full model copy'], c: 'stg' },
      { id: 'r3', x: 300, y: 430, w: 330, h: 110, t: 'Rank 3', ss: ['GPU 3, full model copy'], c: 'stg' },
      { id: 'bus', x: 780, y: 130, w: 310, h: 300, t: 'All-reduce', ss: ['add the four gradients', 'divide by four', 'send the result to all'], c: 'mon' }
    ],
    edges: [
      { id: 'd0', a: 'data', b: 'r0', d: H(230, 190, 300, 65) },
      { id: 'd1', a: 'data', b: 'r1', d: H(230, 250, 300, 205) },
      { id: 'd2', a: 'data', b: 'r2', d: H(230, 310, 300, 345) },
      { id: 'd3', a: 'data', b: 'r3', d: H(230, 370, 300, 485) },
      { id: 'g0', a: 'r0', b: 'bus', d: H(630, 45, 780, 160) },
      { id: 'g1', a: 'r1', b: 'bus', d: H(630, 185, 780, 220) },
      { id: 'g2', a: 'r2', b: 'bus', d: H(630, 325, 780, 280) },
      { id: 'g3', a: 'r3', b: 'bus', d: H(630, 465, 780, 340) },
      { id: 'a0', a: 'bus', b: 'r0', d: H(780, 190, 630, 85) },
      { id: 'a1', a: 'bus', b: 'r1', d: H(780, 250, 630, 225) },
      { id: 'a2', a: 'bus', b: 'r2', d: H(780, 310, 630, 365) },
      { id: 'a3', a: 'bus', b: 'r3', d: H(780, 370, 630, 505) }
    ],
    tags: [
      { id: 'tg0', x: 520, y: 18, t: 'grad 0', c: 'raw' },
      { id: 'tg1', x: 520, y: 158, t: 'grad 1', c: 'int' },
      { id: 'tg2', x: 520, y: 298, t: 'grad 2', c: 'con' },
      { id: 'tg3', x: 520, y: 438, t: 'grad 3', c: 'air' },
      { id: 'ta0', x: 520, y: 18, t: 'average', c: 'mart' },
      { id: 'ta1', x: 520, y: 158, t: 'average', c: 'mart' },
      { id: 'ta2', x: 520, y: 298, t: 'average', c: 'mart' },
      { id: 'ta3', x: 520, y: 438, t: 'average', c: 'mart' }
    ]
  };
})();
