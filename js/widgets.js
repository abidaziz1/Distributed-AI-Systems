/* Labs for the Distributed AI Systems course. Each one registers LAB.W.<kind> with steps, say and render.
   The narration of every step lives in the content file (s.steps[i].say), so the writing lint covers it.
   Everything here is arithmetic on stated formulas and published figures. Nothing is measured. */
(function () {
  var LAB = (window.LAB = window.LAB || {});
  var W = (LAB.W = LAB.W || {});
  var esc = LAB.esc, md = LAB.md;

  /* ---------- small helpers ---------- */
  function chips(list, cur, act, fmt, cls) {
    return list.map(function (k) {
      return '<button type="button" class="sel-chip' + (cls ? ' ' + cls : '') + (String(k) === String(cur) ? ' on' : '') + '" data-act="' + act + '" data-v="' + esc(String(k)) + '">' + esc(fmt ? fmt(k) : String(k)) + '</button>';
    }).join('');
  }
  function row(label, inner) { return '<div class="lab-row"><span class="lab-l">' + esc(label) + '</span><div class="sel-chips">' + inner + '</div></div>'; }
  function fmtN(x, d) { d = d || 0; return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  /* 8.4e23 -> "8.4 \times 10^{23}" (TeX, for LAB.md) */
  function sci(x) {
    var e = Math.floor(Math.log10(x)), m = Math.round(x / Math.pow(10, e) * 10) / 10;
    if (m >= 10) { m = 1; e += 1; }
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + ' \\times 10^{' + e + '}';
  }
  var DAY = 86400, YEAR = 365.25 * DAY;
  function dur(s) {
    var v, unit;
    if (s >= YEAR) { v = s / YEAR; unit = 'year'; }
    else if (s >= DAY) { v = s / DAY; unit = 'day'; }
    else if (s >= 3600) { v = s / 3600; unit = 'hour'; }
    else { v = s / 60; unit = 'minute'; }
    var txt = fmtN(v, v >= 10 ? 0 : 1);
    return txt + ' ' + unit + (txt === '1.0' || txt === '1' ? '' : 's');
  }
  function gbs(x) { return fmtN(x, x < 10 ? 1 : 0) + ' GB'; }
  function big(value, label, cls) { return '<div class="big' + (cls ? ' ' + cls : '') + '"><b>' + value + '</b><span>' + esc(label) + '</span></div>'; }
  function stepsOf(s) { return s.steps.length; }
  function sayOf(s, i) { return s.steps[i].say; }
  function think() { return 'think'; }

  /* ================================================================== */
  /* walls: the time wall and the memory wall                            */
  /* ================================================================== */
  var WALL_MODELS = [
    { name: 'Llama 2 7B', n: 7e9, d: 2e12, nt: '7 billion', dt: '2 trillion' },
    { name: 'Llama 2 70B', n: 70e9, d: 2e12, nt: '70 billion', dt: '2 trillion' },
    { name: 'GPT-3 175B', n: 175e9, d: 300e9, nt: '175 billion', dt: '300 billion' },
    { name: 'Llama 3.1 405B', n: 405e9, d: 15.6e12, nt: '405 billion', dt: '15.6 trillion' }
  ];
  var FLOPS = 4e14;                 /* useful operations per second on one H100: about 40 percent of its peak */
  var STATE_BYTES = 16, GPU_GB = 80;

  W.walls = {
    steps: stepsOf, say: sayOf, mood: think,
    hint: function (s, i) { return i === 0 ? 'Pick a model, then try different numbers of GPUs.' : 'Pick a model and count the GPUs it takes just to hold it.'; },
    render: function (box, s, i, A) {
      var st = A.local.walls || (A.local.walls = { m: 1, g: 1 }), M = WALL_MODELS[st.m];
      var h = '<div class="lab">' + row('Model', chips([0, 1, 2, 3], st.m, 'wl-m', function (k) { return WALL_MODELS[k].name; }));
      h += '<p class="lab-note">' + esc(M.name) + ' has ' + M.nt + ' parameters and trained on ' + M.dt + ' tokens.</p>';
      if (i === 0) {
        var ops = 6 * M.n * M.d, one = ops / FLOPS, many = one / st.g;
        var cls = many >= YEAR ? 'bad' : many >= 30 * DAY ? 'warn' : 'good';
        h += row('GPUs', chips([1, 8, 64, 1024, 16384], st.g, 'wl-g', function (k) { return fmtN(+k); }));
        h += '<div class="formula">' + md('$6 \\times ' + sci(M.n) + ' \\times ' + sci(M.d) + ' = ' + sci(ops) + '$') + '<small>6 × parameters × tokens = operations to train</small></div>';
        h += '<div class="lab-out">' + big(dur(one), 'on one H100', one >= YEAR ? 'bad' : 'warn') + big(dur(many), st.g === 1 ? 'with 1 GPU: add GPUs above to shrink it' : 'on ' + fmtN(st.g) + ' GPUs, best case', cls) + '</div>';
        h += '<div class="callout warn"><b>Best case</b> means no time is lost waiting for other GPUs. Real runs lose some, and that loss is the price of distribution. Assumed speed: ' + md('$4 \\times 10^{14}$') + ' useful operations per second for each H100, about 40 percent of its peak.</div>';
      } else {
        var state = STATE_BYTES * M.n / 1e9, boxes = Math.ceil(state / GPU_GB), weights = 2 * M.n / 1e9, bad = boxes > 1 ? 'bad' : 'good';
        h += '<div class="formula">' + md('$16 \\times ' + sci(M.n) + ' \\text{ bytes} = \\text{' + fmtN(state) + ' GB}$') + '<small>16 bytes per parameter = 2 (weights) + 2 (gradients) + 12 (optimizer state)</small></div>';
        h += '<div class="lab-out">' + big(fmtN(state) + ' GB', 'training state' + (state >= 1000 ? ', ' + fmtN(state / 1000, 1) + ' TB' : ''), bad) + big(fmtN(boxes), 'GPUs of 80 GB just to hold it', bad) + big(fmtN(weights) + ' GB', 'the weights alone, in 16-bit') + '</div>';
        h += '<div class="gpus" aria-label="' + boxes + ' GPUs">' + new Array(boxes + 1).join('<i class="gpu"></i>') + '</div>';
        h += '<p class="lab-note">Each square is one 80 GB GPU. The blue one is the GPU you have. The training data and the activations need room on top of this.</p>';
      }
      box.innerHTML = h + '</div>';
      A.bindWidget = function (act, el) {
        var v = +el.getAttribute('data-v');
        if (act === 'wl-m') st.m = v; else if (act === 'wl-g') st.g = v; else return;
        A.render(true);
      };
    }
  };

  /* ================================================================== */
  /* scissors: model weights against the memory of one GPU               */
  /* ================================================================== */
  var SC = { L: 80, R: 960, T: 30, B: 420, Y0: 2010, Y1: 2026, LO: -1.3, HI: 3.6 };
  function sx(yr) { return SC.L + (yr - SC.Y0) / (SC.Y1 - SC.Y0) * (SC.R - SC.L); }
  function sy(v) { return SC.T + (SC.HI - Math.log10(v)) / (SC.HI - SC.LO) * (SC.B - SC.T); }
  /* era: the step at which a point appears. dx, dy, a: where its label goes. */
  var SC_G = [
    { y: 2011, v: 3, t: 'GTX 580, 3 GB', era: 0, dx: 12, dy: 34, a: 'start' },
    { y: 2016, v: 16, t: 'P100, 16 GB', era: 1, dx: 0, dy: 36, a: 'middle' },
    { y: 2018, v: 32, t: 'V100, 32 GB', era: 1, dx: 0, dy: -18, a: 'middle' },
    { y: 2020, v: 80, t: 'A100, 80 GB', era: 3, dx: 0, dy: -18, a: 'middle' },
    { y: 2022, v: 80, t: 'H100, 80 GB', era: 4, dx: 0, dy: -18, a: 'middle' },
    { y: 2024, v: 141, t: 'H200, 141 GB', era: 4, dx: 0, dy: 36, a: 'middle' },
    { y: 2025, v: 180, t: 'B200, ~180 GB', era: 4, dx: 45, dy: -20, a: 'end' }
  ];
  var SC_M = [
    { y: 2012, v: 0.12, t: 'AlexNet', era: 0, dx: -14, dy: -10, a: 'end' },
    { y: 2018, v: 0.68, t: 'BERT-large', era: 1, dx: 16, dy: 30, a: 'start' },
    { y: 2019, v: 3, t: 'GPT-2', era: 1, dx: 14, dy: 6, a: 'start' },
    { y: 2019, v: 16.6, t: 'Megatron-LM 8.3B', era: 2, dx: 14, dy: 6, a: 'start' },
    { y: 2020, v: 350, t: 'GPT-3 175B', era: 3, dx: -14, dy: 6, a: 'end' },
    { y: 2022, v: 1080, t: 'PaLM 540B', era: 4, dx: -14, dy: 6, a: 'end' },
    { y: 2024, v: 1342, t: 'DeepSeek-V3 671B', era: 4, dx: 0, dy: -16, a: 'middle' }
  ];
  W.scissors = {
    steps: stepsOf, say: sayOf, mood: function (s, i) { return i === s.steps.length - 1 ? 'wow' : 'think'; },
    hint: function () { return 'Press Next to move through the years.'; },
    render: function (box, s, i) {
      var gv = SC_G.filter(function (p) { return p.era <= i; }), mv = SC_M.filter(function (p) { return p.era <= i; });
      function pts(list) { return list.map(function (p) { return sx(p.y).toFixed(1) + ',' + sy(p.v).toFixed(1); }).join(' '); }
      var o = '<svg class="scissors" viewBox="0 0 1000 480" role="img" aria-label="Weights of landmark models compared with the memory of one GPU, both on a log scale, from 2010 to 2026">';
      [[0.1, '0.1 GB'], [1, '1 GB'], [10, '10 GB'], [100, '100 GB'], [1000, '1 TB']].forEach(function (g) {
        var y = sy(g[0]);
        o += '<line class="sc-grid" x1="' + SC.L + '" x2="' + SC.R + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="sc-tick" x="' + (SC.L - 10) + '" y="' + (y + 5).toFixed(1) + '" text-anchor="end">' + g[1] + '</text>';
      });
      for (var yr = 2010; yr <= 2026; yr += 2) o += '<text class="sc-tick" x="' + sx(yr).toFixed(1) + '" y="' + (SC.B + 30) + '" text-anchor="middle">' + yr + '</text>';
      o += '<line class="sc-axis" x1="' + SC.L + '" x2="' + SC.R + '" y1="' + SC.B + '" y2="' + SC.B + '"/><line class="sc-axis" x1="' + SC.L + '" x2="' + SC.L + '" y1="' + SC.T + '" y2="' + SC.B + '"/>';
      o += '<text class="sc-unit" x="' + SC.L + '" y="20">Gigabytes on a log scale: each gridline is ten times the one below</text>';
      if (gv.length > 1) o += '<polyline class="sc-gpu-line" points="' + pts(gv) + '"/>';
      var ml = mv.filter(function (p) { return p.line !== false; });
      if (ml.length > 1) o += '<polyline class="sc-model-line" points="' + pts(ml) + '"/>';
      gv.forEach(function (p) {
        var x = sx(p.y), y = sy(p.v);
        if (p.era === i) o += '<circle class="sc-ring" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="17"/>';
        o += '<rect class="sc-gpu-pt" x="' + (x - 8).toFixed(1) + '" y="' + (y - 8).toFixed(1) + '" width="16" height="16" rx="3"/><text class="sc-lab gpu" x="' + (x + p.dx).toFixed(1) + '" y="' + (y + p.dy).toFixed(1) + '" text-anchor="' + p.a + '">' + esc(p.t) + '</text>';
      });
      mv.forEach(function (p) {
        var x = sx(p.y), y = sy(p.v);
        if (p.era === i) o += '<circle class="sc-ring" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="17"/>';
        o += '<circle class="sc-model-pt" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9"/><text class="sc-lab" x="' + (x + p.dx).toFixed(1) + '" y="' + (y + p.dy).toFixed(1) + '" text-anchor="' + p.a + '">' + esc(p.t) + '</text>';
      });
      o += '</svg>';
      var h = '<div class="lab"><div class="sc-legend"><span><i class="dot-model"></i>weights of a landmark model, 16-bit</span><span><i class="dot-gpu"></i>memory of one GPU</span></div>' +
        '<div class="sc-wrap">' + o + '</div>';
      if (i === s.steps.length - 1) h += '<div class="lab-out">' + big('More than 10,000 times', 'growth of model weights, 2012 to 2024', 'bad') + big('About 60 times', 'growth of memory on one GPU, 2011 to 2025', 'warn') + '</div>';
      h += '<div class="cap">' + md(s.steps[i].cap || '') + '</div><p class="lab-note">Weights are counted at 2 bytes per parameter. These are landmark models, not typical ones. Figures are rounded and come from the papers and spec sheets.</p></div>';
      box.innerHTML = h;
    }
  };

  /* ================================================================== */
  /* fit: will it fit in the memory of one GPU?                          */
  /* ================================================================== */
  var FIT_M = [1, 7, 13, 70, 405], FIT_G = [24, 40, 80, 141], FIT_N = [1, 2, 4, 8, 16, 64, 256, 1024];
  var FIT_P = { 2: '16-bit', 1: '8-bit', 0.5: '4-bit' };
  var FIT_S = { one: 'One GPU', ddp: 'Copy to every GPU (DDP)', fsdp: 'Shard over the GPUs (FSDP)' };
  var PRESETS = [
    { t: 'Train 7B on one 80 GB GPU', s: { mode: 'train', m: 7, g: 80, strat: 'one', n: 1 } },
    { t: 'Same job on 8 GPUs, DDP', s: { mode: 'train', m: 7, g: 80, strat: 'ddp', n: 8 } },
    { t: 'Same job on 8 GPUs, FSDP', s: { mode: 'train', m: 7, g: 80, strat: 'fsdp', n: 8 } },
    { t: 'Serve 70B in 16-bit on one GPU', s: { mode: 'serve', m: 70, g: 80, n: 1, prec: 2 } },
    { t: 'Serve 70B on 2 GPUs', s: { mode: 'serve', m: 70, g: 80, n: 2, prec: 2 } },
    { t: 'Serve 70B in 4-bit on one GPU', s: { mode: 'serve', m: 70, g: 80, n: 1, prec: 0.5 } }
  ];
  W.fit = {
    steps: stepsOf, say: sayOf, mood: think,
    hint: function () { return 'Press a preset, or pick your own case. Watch the dashed line.'; },
    render: function (box, s, i, A) {
      var st = A.local.fit || (A.local.fit = { mode: 'train', m: 7, g: 80, strat: 'ddp', n: 8, prec: 2 });
      var psi = st.m, cap = st.g, train = st.mode === 'train', n = train && st.strat === 'one' ? 1 : st.n, segs;
      if (train) { var div = st.strat === 'fsdp' ? n : 1; segs = [['w', 'weights', 2 * psi / div], ['g', 'gradients', 2 * psi / div], ['o', 'optimizer state', 12 * psi / div]]; }
      else segs = [['w', 'weights', st.prec * psi / n]];
      var total = segs.reduce(function (a, g) { return a + g[2]; }, 0), scale = Math.max(cap, total), free = cap - total, capPct = cap / scale * 100;
      var bar = segs.map(function (g) { var pct = g[2] / scale * 100; return '<div class="seg ' + g[0] + '" style="width:' + pct.toFixed(2) + '%">' + (pct > 15 ? esc(g[1]) + ' ' + gbs(g[2]) : pct > 7 ? gbs(g[2]) : '') + '</div>'; }).join('');
      if (free > 0) bar += '<div class="seg free" style="width:' + (free / scale * 100).toFixed(2) + '%">' + (free / scale > 0.16 ? 'free ' + gbs(free) : '') + '</div>';
      if (free < 0) bar += '<div class="over" style="left:' + capPct.toFixed(2) + '%;width:' + (100 - capPct).toFixed(2) + '%"></div>';
      bar += '<div class="capline' + (capPct > 50 ? ' left' : '') + '" style="left:' + capPct.toFixed(2) + '%"><span>one GPU: ' + cap + ' GB</span></div>';
      var verdict = free >= 0
        ? '<div class="callout good"><b>It fits.</b> Each GPU needs ' + gbs(total) + ' of its ' + cap + ' GB. ' + gbs(free) + ' is left for ' + (train ? 'activations and everything else' : 'the KV cache and everything else') + '.</div>'
        : '<div class="callout bad"><b>It does not fit.</b> Each GPU needs ' + gbs(total) + ' but has ' + cap + ' GB. It is ' + gbs(-free) + ' short.</div>';
      var note = !train ? 'Splitting the weights over several GPUs (tensor parallelism) needs fast links between them. Making the numbers smaller (quantizing) can avoid the split. The KV cache is extra and grows with every user (Chapter 6).'
        : st.strat === 'one' ? 'One GPU holds the weights, the gradients and the optimizer state.'
        : st.strat === 'ddp' ? 'DDP puts a full copy of everything on every GPU. More GPUs make training faster, not roomier.'
        : 'FSDP gives each GPU a slice of everything. Memory per GPU shrinks as GPUs are added, and every step pays for gathering the slices in communication (Chapter 4).';
      var h = '<div class="lab">' +
        row('I want to', chips(['train', 'serve'], st.mode, 'ft-mode', function (k) { return k === 'train' ? 'Train it' : 'Serve it'; })) +
        row('Model', chips(FIT_M, st.m, 'ft-m', function (k) { return k + 'B'; })) +
        row('GPU memory', chips(FIT_G, st.g, 'ft-g', function (k) { return k + ' GB'; })) +
        (train ? row('Strategy', chips(['one', 'ddp', 'fsdp'], st.strat, 'ft-s', function (k) { return FIT_S[k]; })) : row('Weights', chips([2, 1, 0.5], st.prec, 'ft-p', function (k) { return FIT_P[k]; }))) +
        ((train && st.strat === 'one') ? '' : row('GPUs', chips(FIT_N, st.n, 'ft-n', function (k) { return fmtN(+k); }))) +
        '<div class="membar-wrap"><div class="membar">' + bar + '</div>' +
        '<div class="legend2"><span><i class="w"></i>weights</span>' + (train ? '<span><i class="g"></i>gradients</span><span><i class="o"></i>optimizer state</span>' : '') + '<span><i class="free"></i>free</span><span><i class="over"></i>over the limit</span></div></div>' +
        verdict + '<p class="lab-note">' + esc(note) + (train ? ' Activations are not drawn, because they depend on batch size and sequence length.' : '') + '</p>' +
        '<div class="lab-row"><span class="lab-l">Try this</span><div class="sel-chips">' + PRESETS.map(function (p, k) { return '<button type="button" class="sel-chip try" data-act="ft-preset" data-v="' + k + '">' + esc(p.t) + '</button>'; }).join('') + '</div></div></div>';
      box.innerHTML = h;
      A.bindWidget = function (act, el) {
        var v = el.getAttribute('data-v');
        if (act === 'ft-mode') st.mode = v;
        else if (act === 'ft-m') st.m = +v;
        else if (act === 'ft-g') st.g = +v;
        else if (act === 'ft-n') st.n = +v;
        else if (act === 'ft-s') { st.strat = v; if (v === 'one') st.n = 1; else if (st.n === 1) st.n = 8; }
        else if (act === 'ft-p') st.prec = +v;
        else if (act === 'ft-preset') Object.keys(PRESETS[+v].s).forEach(function (k) { st[k] = PRESETS[+v].s[k]; });
        else return;
        A.render(true);
      };
    }
  };

  /* ================================================================== */
  /* dp: data parallel training by hand, with real arithmetic            */
  /* ================================================================== */
  var DP_X = [1, 2, 3, 4, 5, 6, 7, 8], DP_Y = DP_X.map(function (x) { return 3 * x; }), DP_LR = 0.01;
  var DP_SHARDS = [[0, 1], [2, 3], [4, 5], [6, 7]], DP_ALL = [0, 1, 2, 3, 4, 5, 6, 7];
  function dpGrad(w, idx) { var g = 0; idx.forEach(function (k) { g += 2 * (w * DP_X[k] - DP_Y[k]) * DP_X[k]; }); return g / idx.length; }
  function dpLoss(w) { var l = 0; DP_X.forEach(function (x, k) { var e = w * x - DP_Y[k]; l += e * e; }); return l / DP_X.length; }
  W.dp = {
    steps: stepsOf, say: sayOf, mood: think,
    hint: function (s, i) { return i === 0 ? 'Press Step once and read the four local gradients.' : 'All-reduce is off. Press Step a few times and watch the weights.'; },
    render: function (box, s, i, A) {
      var st = A.local.dp || (A.local.dp = { w: [0, 0, 0, 0], n: 0, sync: true });
      if (i === 1 && !st.seenOff) { st.seenOff = true; st.sync = false; st.w = [0, 0, 0, 0]; st.n = 0; }
      var grads = st.w.map(function (w, r) { return dpGrad(w, DP_SHARDS[r]); });
      var avg = (grads[0] + grads[1] + grads[2] + grads[3]) / 4;
      var same = st.w.every(function (w) { return Math.abs(w - st.w[0]) < 1e-9; });
      var h = '<div class="lab"><div class="formula">' + md('Model: $\\hat{y} = w\\,x$. Data: $y = 3x$ for $x = 1, 2, \\dots, 8$. Loss: the mean of $(w x - y)^2$. The best weight is $w = 3$.') +
        '<small>Each rank holds its own copy of w and two of the eight points. Learning rate 0.01.</small></div>';
      h += '<div class="ranks">' + st.w.map(function (w, r) {
        var pts = DP_SHARDS[r].map(function (k) { return '(' + DP_X[k] + ', ' + DP_Y[k] + ')'; }).join(' ');
        return '<div class="rank g' + r + '"><b>Rank ' + r + '</b><span class="pts">' + pts + '</span><span>weight w = <b>' + w.toFixed(3) + '</b></span><span>local gradient <b>' + fmtN(grads[r], 1) + '</b></span><span>loss on all data ' + fmtN(dpLoss(w), 1) + '</span></div>';
      }).join('') + '</div>';
      if (st.sync) {
        if (same) h += '<div class="allred"><b>All-reduce: the average of the four gradients is ' + fmtN(avg, 1) + '</b>Check: one GPU holding all 8 points gets a gradient of ' + fmtN(dpGrad(st.w[0], DP_ALL), 1) + '. The two are equal, so data parallel training matches one GPU with a batch four times as big.</div>';
        else h += '<div class="allred"><b>All-reduce is on, but the copies already differ.</b>Averaging gradients cannot pull weights back together. Press Reset.</div>';
      } else h += '<div class="allred off"><b>All-reduce is off.</b>Each rank updates with its own gradient and never hears about the others.</div>';
      h += '<div class="sync-line ' + (same ? 'same' : 'drift') + '">' + (same ? 'All four copies of the model are identical.' : 'The four copies have drifted apart. Their weights are different models now.') + (same ? '' : '<small>In this toy problem every slice follows the same line, so each copy still heads toward 3, at its own speed. With real data each copy would fit only its own slice, and you would end up with four different models.</small>') + '</div>';
      h += '<div class="lab-buttons"><button type="button" class="btn-sm primary" data-act="dp-step">Step</button><button type="button" class="btn-sm" data-act="dp-step5">Step 5 times</button><button type="button" class="btn-sm" data-act="dp-reset">Reset</button>' +
        '<span class="lab-l">All-reduce</span>' + chips(['on', 'off'], st.sync ? 'on' : 'off', 'dp-sync') + '<span class="lab-note">Steps taken: ' + st.n + '</span></div></div>';
      box.innerHTML = h;
      A.bindWidget = function (act, el) {
        if (act === 'dp-sync') st.sync = el.getAttribute('data-v') === 'on';
        else if (act === 'dp-reset') { st.w = [0, 0, 0, 0]; st.n = 0; }
        else if (act === 'dp-step' || act === 'dp-step5') {
          for (var t = 0; t < (act === 'dp-step5' ? 5 : 1); t++) {
            var g = st.w.map(function (w, r) { return dpGrad(w, DP_SHARDS[r]); }), a = (g[0] + g[1] + g[2] + g[3]) / 4;
            st.w = st.w.map(function (w, r) { return w - DP_LR * (st.sync ? a : g[r]); });
            st.n++;
          }
        } else return;
        A.render(true);
      };
    }
  };
})();
