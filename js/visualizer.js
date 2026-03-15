/* ═══════════════════════════════════════════════
   Algorithm Visualizer — CS Academy
   ═══════════════════════════════════════════════ */

class AlgorithmVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.array = [];
    this.steps = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.speed = 80;          // ms per step
    this.algorithm = 'bubble';
    this.arraySize = 40;
    this.timer = null;
    this.comparisons = 0;
    this.swaps = 0;
    this.startTime = null;

    this.colors = {
      default:   '#2a4070',
      comparing: '#fbbf24',
      swapping:  '#f87171',
      sorted:    '#34d399',
      pivot:     '#a78bfa',
      min:       '#22d3ee',
      highlight: '#fb923c',
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.generateArray();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width || 800;
    this.canvas.height = 320;
    if (this.array.length) this.render();
  }

  generateArray(size) {
    this.arraySize = size || this.arraySize;
    this.array = [];
    for (let i = 0; i < this.arraySize; i++) {
      this.array.push(Math.floor(Math.random() * (this.canvas.height - 40)) + 10);
    }
    this.steps = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.comparisons = 0;
    this.swaps = 0;
    clearInterval(this.timer);
    this.render();
    this.updateStats();
  }

  setAlgorithm(algo) {
    this.algorithm = algo;
    this.generateArray();
  }

  setSpeed(val) {
    // val: 1-100, map to ms: 200 → 5
    this.speed = Math.round(205 - val * 2);
  }

  // ── Generate all animation steps ──
  generateSteps() {
    const arr = [...this.array];
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;

    switch (this.algorithm) {
      case 'bubble':    this._bubbleSteps(arr); break;
      case 'selection': this._selectionSteps(arr); break;
      case 'insertion': this._insertionSteps(arr); break;
      case 'merge':     this._mergeSteps(arr, 0, arr.length - 1); break;
      case 'quick':     this._quickSteps(arr, 0, arr.length - 1); break;
      case 'heap':      this._heapSteps(arr); break;
      case 'counting':  this._countingSteps(arr); break;
    }

    // Final "all sorted" step
    this.steps.push({ arr: arr.slice(), highlights: [], sorted: Array.from({length: arr.length}, (_, i) => i) });
    return this.steps;
  }

  _addStep(arr, highlights, sorted = [], notes = '') {
    this.steps.push({
      arr:        arr.slice(),
      highlights: highlights.slice(),
      sorted:     sorted.slice(),
      notes,
    });
  }

  _bubbleSteps(arr) {
    const n = arr.length;
    const sortedIndices = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        this._addStep(arr, [{ idx: j, color: 'comparing' }, { idx: j + 1, color: 'comparing' }], sortedIndices, `비교: arr[${j}]=${arr[j]} vs arr[${j+1}]=${arr[j+1]}`);
        this.comparisons++;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          this.swaps++;
          this._addStep(arr, [{ idx: j, color: 'swapping' }, { idx: j + 1, color: 'swapping' }], sortedIndices, `교환!`);
        }
      }
      sortedIndices.push(n - 1 - i);
    }
    sortedIndices.push(0);
  }

  _selectionSteps(arr) {
    const n = arr.length;
    const sortedIndices = [];
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        this._addStep(arr, [
          { idx: j,      color: 'comparing' },
          { idx: minIdx, color: 'min' },
        ], sortedIndices, `최솟값 탐색: 현재 min=${arr[minIdx]} at [${minIdx}]`);
        this.comparisons++;
        if (arr[j] < arr[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        this.swaps++;
        this._addStep(arr, [{ idx: i, color: 'swapping' }, { idx: minIdx, color: 'swapping' }], sortedIndices, `최솟값을 위치 ${i}로 이동`);
      }
      sortedIndices.push(i);
    }
    sortedIndices.push(n - 1);
  }

  _insertionSteps(arr) {
    const n = arr.length;
    const sortedIndices = [0];
    for (let i = 1; i < n; i++) {
      let j = i;
      this._addStep(arr, [{ idx: i, color: 'highlight' }], sortedIndices, `키: ${arr[i]} 삽입 위치 탐색`);
      while (j > 0 && arr[j - 1] > arr[j]) {
        this._addStep(arr, [{ idx: j, color: 'comparing' }, { idx: j - 1, color: 'comparing' }], sortedIndices);
        this.comparisons++;
        [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]];
        this.swaps++;
        j--;
        this._addStep(arr, [{ idx: j, color: 'swapping' }, { idx: j + 1, color: 'swapping' }], sortedIndices);
      }
      sortedIndices.push(i);
    }
  }

  _mergeSteps(arr, l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    this._mergeSteps(arr, l, m);
    this._mergeSteps(arr, m + 1, r);
    this._merge(arr, l, m, r);
  }

  _merge(arr, l, m, r) {
    const left  = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      this._addStep(arr, [{ idx: l + i, color: 'comparing' }, { idx: m + 1 + j, color: 'comparing' }], [], `병합: ${left[i]} vs ${right[j]}`);
      this.comparisons++;
      if (left[i] <= right[j]) { arr[k++] = left[i++]; }
      else                     { arr[k++] = right[j++]; this.swaps++; }
      this._addStep(arr, [{ idx: k - 1, color: 'swapping' }]);
    }
    while (i < left.length) { arr[k++] = left[i++]; }
    while (j < right.length) { arr[k++] = right[j++]; }
    this._addStep(arr, [], []);
  }

  _quickSteps(arr, low, high) {
    if (low < high) {
      const pi = this._partition(arr, low, high);
      this._quickSteps(arr, low, pi - 1);
      this._quickSteps(arr, pi + 1, high);
    }
  }

  _partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    this._addStep(arr, [{ idx: high, color: 'pivot' }], [], `피벗: ${pivot}`);
    for (let j = low; j < high; j++) {
      this._addStep(arr, [{ idx: j, color: 'comparing' }, { idx: high, color: 'pivot' }]);
      this.comparisons++;
      if (arr[j] <= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        this.swaps++;
        this._addStep(arr, [{ idx: i, color: 'swapping' }, { idx: j, color: 'swapping' }, { idx: high, color: 'pivot' }]);
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    this.swaps++;
    this._addStep(arr, [{ idx: i + 1, color: 'sorted' }], [i + 1], `피벗 ${pivot} 정렬 완료`);
    return i + 1;
  }

  _heapSteps(arr) {
    const n = arr.length;
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this._heapify(arr, n, i);
    }
    // Extract elements
    for (let i = n - 1; i > 0; i--) {
      this._addStep(arr, [{ idx: 0, color: 'swapping' }, { idx: i, color: 'swapping' }], [], `루트(최대값) ${arr[0]}를 끝으로 이동`);
      [arr[0], arr[i]] = [arr[i], arr[0]];
      this.swaps++;
      this._heapify(arr, i, 0);
    }
  }

  _heapify(arr, n, i) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    this._addStep(arr, [{ idx: i, color: 'comparing' }], [], `힙 정렬: 인덱스 ${i} 확인`);
    this.comparisons++;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this.swaps++;
      this._addStep(arr, [{ idx: i, color: 'swapping' }, { idx: largest, color: 'swapping' }]);
      this._heapify(arr, n, largest);
    }
  }

  _countingSteps(arr) {
    const max = Math.max(...arr);
    const count = new Array(max + 1).fill(0);
    for (let i = 0; i < arr.length; i++) {
      count[arr[i]]++;
      this._addStep(arr, [{ idx: i, color: 'comparing' }], [], `계수: arr[${i}]=${arr[i]}`);
    }
    let k = 0;
    for (let v = 0; v <= max; v++) {
      while (count[v]-- > 0) {
        arr[k] = v;
        this._addStep(arr, [{ idx: k, color: 'sorted' }], Array.from({length: k + 1}, (_, i) => i), `값 ${v} 배치`);
        k++;
      }
    }
  }

  // ── Rendering ──
  render(stepIndex) {
    if (!this.canvas || !this.ctx) return;
    const step = this.steps.length
      ? this.steps[stepIndex !== undefined ? stepIndex : this.currentStep]
      : null;

    const arr = step ? step.arr : this.array;
    const highlights = step ? step.highlights : [];
    const sorted     = step ? (step.sorted || []) : [];

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const n = arr.length;

    // Background
    ctx.fillStyle = '#06090f';
    ctx.fillRect(0, 0, W, H);

    if (!n) return;

    const barW    = Math.max(2, (W - 2) / n);
    const gap     = barW > 6 ? 1 : 0;
    const maxVal  = Math.max(...arr, 1);
    const highlightMap = {};
    highlights.forEach(h => { highlightMap[h.idx] = h.color; });

    for (let i = 0; i < n; i++) {
      const barH = Math.round((arr[i] / maxVal) * (H - 20));
      const x    = i * barW + gap / 2;
      const y    = H - barH;
      const w    = barW - gap;

      let colorKey = 'default';
      if (sorted.includes(i))          colorKey = 'sorted';
      if (highlightMap[i] !== undefined) colorKey = highlightMap[i];

      const color = this.colors[colorKey] || this.colors.default;

      // Bar
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, barH, [2, 2, 0, 0]) : ctx.rect(x, y, w, barH);
      ctx.fill();

      // Glow for highlighted
      if (colorKey !== 'default' && colorKey !== 'sorted') {
        ctx.shadowColor = color;
        ctx.shadowBlur  = 8;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
    }

    // Step note
    if (step && step.notes) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(step.notes, 10, 18);
    }
  }

  play() {
    if (this.isPlaying) return;
    if (!this.steps.length) {
      this.startTime = Date.now();
      this.generateSteps();
    }
    if (this.currentStep >= this.steps.length - 1) {
      this.currentStep = 0;
      this.generateSteps();
    }
    this.isPlaying = true;
    this._tick();
  }

  _tick() {
    if (!this.isPlaying) return;
    if (this.currentStep >= this.steps.length - 1) {
      this.isPlaying = false;
      this.updateStats();
      this.updatePlayBtn();
      return;
    }
    this.currentStep++;
    this.render(this.currentStep);
    this.updateStats();
    this.timer = setTimeout(() => this._tick(), this.speed);
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.timer);
    this.updatePlayBtn();
  }

  toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  step() {
    if (!this.steps.length) { this.generateSteps(); }
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.render(this.currentStep);
      this.updateStats();
    }
  }

  reset() {
    this.pause();
    this.generateArray();
  }

  updateStats() {
    const step = this.steps[this.currentStep];
    const totalComps = this.steps.reduce((acc, s) => {
      return acc + (s.highlights ? s.highlights.filter(h => h.color === 'comparing').length > 0 ? 1 : 0 : 0);
    }, 0);

    setText('vizComparisons', step ? totalComps : '0');
    setText('vizSwaps', this.swaps);
    setText('vizStep', this.currentStep + '/' + this.steps.length);

    const pct = this.steps.length ? Math.round((this.currentStep / (this.steps.length - 1)) * 100) : 0;
    const bar = document.getElementById('vizProgress');
    if (bar) bar.style.width = pct + '%';
  }

  updatePlayBtn() {
    const btn = document.getElementById('btnPlayPause');
    if (btn) btn.textContent = this.isPlaying ? '⏸' : '▶';
  }

  getComplexityInfo() {
    const info = {
      bubble:    { best: 'O(n)',      avg: 'O(n²)',      worst: 'O(n²)',    space: 'O(1)',      stable: '✓' },
      selection: { best: 'O(n²)',     avg: 'O(n²)',      worst: 'O(n²)',    space: 'O(1)',      stable: '✗' },
      insertion: { best: 'O(n)',      avg: 'O(n²)',      worst: 'O(n²)',    space: 'O(1)',      stable: '✓' },
      merge:     { best: 'O(n log n)',avg: 'O(n log n)', worst: 'O(n log n)',space: 'O(n)',     stable: '✓' },
      quick:     { best: 'O(n log n)',avg: 'O(n log n)', worst: 'O(n²)',    space: 'O(log n)', stable: '✗' },
      heap:      { best: 'O(n log n)',avg: 'O(n log n)', worst: 'O(n log n)',space: 'O(1)',     stable: '✗' },
      counting:  { best: 'O(n+k)',    avg: 'O(n+k)',     worst: 'O(n+k)',   space: 'O(k)',      stable: '✓' },
    };
    return info[this.algorithm] || info.bubble;
  }
}

/* ──────────────────────────────────────────
   Data Structure Visualizer (Canvas)
   ──────────────────────────────────────── */

class DSVisualizer {
  constructor(canvasId, type) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.type = type;
    this.data = [];
    this.animFrame = null;
    this.colors = {
      node:   '#1a2640',
      border: '#4f8ef7',
      text:   '#e8f0fe',
      arrow:  '#8ba3c8',
      active: '#34d399',
      accent: '#a78bfa',
    };
    this.canvas.height = 180;
    this.draw();
  }

  draw() {
    if (!this.canvas) return;
    const W = this.canvas.offsetWidth || 600;
    this.canvas.width = W;
    const ctx = this.ctx;

    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, W, this.canvas.height);

    switch (this.type) {
      case 'stack':        this.drawStack(ctx, W); break;
      case 'queue':        this.drawQueue(ctx, W); break;
      case 'linkedlist':   this.drawLinkedList(ctx, W); break;
      case 'bst':          this.drawBST(ctx, W); break;
      case 'heap':         this.drawHeap(ctx, W); break;
    }
  }

  drawNode(ctx, x, y, r, label, color = null) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color || this.colors.node;
    ctx.fill();
    ctx.strokeStyle = this.colors.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  drawRect(ctx, x, y, w, h, label, color = null) {
    ctx.fillStyle = color || this.colors.node;
    ctx.strokeStyle = this.colors.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
  }

  drawArrow(ctx, x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len   = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;

    ctx.strokeStyle = this.colors.arrow;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const aLen = 8;
    ctx.fillStyle = this.colors.arrow;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - aLen * Math.cos(angle - 0.4), y2 - aLen * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - aLen * Math.cos(angle + 0.4), y2 - aLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  drawStack(ctx, W) {
    const items = [42, 17, 8, 55, 23];
    const cw = 80, ch = 28, cx = W / 2 - cw / 2;
    ctx.fillStyle = this.colors.arrow;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('← TOP', cx + cw + 10, 90 - (items.length - 1) * 30);

    items.slice().reverse().forEach((v, i) => {
      const y = 90 - i * 30;
      const color = i === items.length - 1 ? this.colors.active : this.colors.node;
      this.drawRect(ctx, cx, y, cw, ch, String(v), color);
    });

    ctx.fillStyle = this.colors.arrow;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STACK (LIFO)', W / 2, 150);
  }

  drawQueue(ctx, W) {
    const items = [10, 20, 30, 40, 50];
    const cw = 50, ch = 36;
    const startX = (W - items.length * (cw + 6)) / 2;
    const y = 72;

    items.forEach((v, i) => {
      const x = startX + i * (cw + 6);
      const color = i === 0 ? this.colors.accent : i === items.length - 1 ? this.colors.active : this.colors.node;
      this.drawRect(ctx, x, y, cw, ch, String(v), color);
    });

    // Arrows
    ctx.fillStyle = this.colors.arrow;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← DEQUEUE', startX - 20, y + 18);
    ctx.fillText('ENQUEUE →', startX + items.length * (cw + 6) + 20, y + 18);
    ctx.fillText('QUEUE (FIFO)', W / 2, 150);
  }

  drawLinkedList(ctx, W) {
    const items = [12, 37, 5, 82, 29];
    const nw = 60, nh = 34;
    const spacing = 30;
    const totalW = items.length * (nw + spacing) - spacing;
    let x = (W - totalW) / 2;
    const y = 73;

    items.forEach((v, i) => {
      // Node box
      this.drawRect(ctx, x, y, nw, nh, String(v));

      // next pointer box
      ctx.fillStyle = '#1e3050';
      ctx.strokeStyle = this.colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x + nw, y, 16, nh);
      ctx.fill();
      ctx.stroke();

      // Arrow to next
      if (i < items.length - 1) {
        this.drawArrow(ctx, x + nw + 16, y + nh / 2, x + nw + spacing, y + nh / 2);
      } else {
        ctx.fillStyle = this.colors.arrow;
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('null', x + nw + 8, y + nh / 2);
      }
      x += nw + spacing;
    });

    ctx.fillStyle = this.colors.arrow;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Linked List → 각 노드는 다음 노드의 주소를 저장', W / 2, 150);
  }

  drawBST(ctx, W) {
    const nodes = [
      { val: 50, x: 0.5,  y: 0.18 },
      { val: 25, x: 0.28, y: 0.40 },
      { val: 75, x: 0.72, y: 0.40 },
      { val: 12, x: 0.17, y: 0.65 },
      { val: 37, x: 0.38, y: 0.65 },
      { val: 62, x: 0.61, y: 0.65 },
      { val: 87, x: 0.83, y: 0.65 },
    ];
    const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
    const H = this.canvas.height;

    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b];
      this.drawArrow(ctx, na.x * W, na.y * H + 14, nb.x * W, nb.y * H - 14);
    });
    nodes.forEach((n, i) => {
      const color = i === 0 ? this.colors.accent : this.colors.node;
      this.drawNode(ctx, n.x * W, n.y * H, 16, String(n.val), color);
    });

    ctx.fillStyle = this.colors.arrow;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Binary Search Tree: 왼쪽 < 루트 < 오른쪽', W / 2, H - 10);
  }

  drawHeap(ctx, W) {
    const nodes = [
      { val: 90, x: 0.5,  y: 0.15 },
      { val: 70, x: 0.3,  y: 0.38 },
      { val: 80, x: 0.7,  y: 0.38 },
      { val: 40, x: 0.18, y: 0.62 },
      { val: 50, x: 0.42, y: 0.62 },
      { val: 60, x: 0.58, y: 0.62 },
      { val: 30, x: 0.82, y: 0.62 },
    ];
    const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
    const H = this.canvas.height;

    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b];
      ctx.strokeStyle = this.colors.arrow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(na.x * W, na.y * H + 15);
      ctx.lineTo(nb.x * W, nb.y * H - 15);
      ctx.stroke();
    });
    nodes.forEach((n, i) => {
      const color = i === 0 ? '#fb923c' : this.colors.node;
      this.drawNode(ctx, n.x * W, n.y * H, 16, String(n.val), color);
    });

    ctx.fillStyle = this.colors.arrow;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Max-Heap: 부모 ≥ 자식, 루트가 항상 최대값', W / 2, H - 10);
  }
}

/* ──────────────────────────────────────────
   Hero Network Animation
   ──────────────────────────────────────── */

class NetworkAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.maxDist = 130;
    this.running = false;
    this.frame = null;

    this.resize();
    this.initNodes();
    window.addEventListener('resize', () => { this.resize(); this.initNodes(); });
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width  = this.canvas.parentElement.offsetWidth  || 800;
    this.canvas.height = this.canvas.parentElement.offsetHeight || 280;
  }

  initNodes(count = 50) {
    const W = this.canvas.width, H = this.canvas.height;
    this.nodes = Array.from({ length: count }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r:  Math.random() * 2 + 1.5,
    }));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  _loop() {
    if (!this.running) return;
    this._update();
    this._draw();
    this.frame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const W = this.canvas.width, H = this.canvas.height;
    this.nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const md = this.maxDist;

    // Draw edges
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i], b = this.nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < md) {
          const alpha = (1 - d / md) * 0.35;
          ctx.strokeStyle = `rgba(79,142,247,${alpha})`;
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    this.nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79,142,247,0.7)';
      ctx.fill();
    });
  }
}

/* ──────────────────────────────────────────
   Complexity Chart (Canvas)
   ──────────────────────────────────────── */

class ComplexityChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.canvas.offsetWidth || 600;
    this.canvas.height = 300;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const nMax  = 20;

    ctx.fillStyle = '#06090f';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1e3050';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#2a4070';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    ctx.fillStyle = '#526685';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('n (입력 크기)', pad.left + plotW / 2, H - 5);

    ctx.save();
    ctx.translate(12, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('연산 횟수', 0, 0);
    ctx.restore();

    const functions = [
      { name: 'O(1)',       fn: () => 1,               color: '#34d399' },
      { name: 'O(log n)',   fn: n => Math.log2(n),     color: '#4f8ef7' },
      { name: 'O(n)',       fn: n => n,                color: '#fbbf24' },
      { name: 'O(n log n)', fn: n => n * Math.log2(n), color: '#fb923c' },
      { name: 'O(n²)',      fn: n => n * n,            color: '#f87171' },
    ];

    const maxY = nMax * nMax;
    const toX = n => pad.left + (n / nMax) * plotW;
    const toY = v => pad.top + plotH - Math.min((v / maxY) * plotH, plotH);

    functions.forEach(({ name, fn, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      let first = true;
      for (let n = 1; n <= nMax; n += 0.2) {
        const v = fn(n);
        const x = toX(n), y = toY(v);
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Legend
    let lx = pad.left + 10;
    functions.forEach(({ name, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, pad.top + 8, 16, 3);
      ctx.fillStyle = '#8ba3c8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name, lx + 20, pad.top + 13);
      lx += 80;
    });
  }
}

/* ──────────────────────────────────────────
   Helper
   ──────────────────────────────────────── */

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Global visualizer instance
window.algoViz = null;
window.networkAnim = null;
window.dsVizMap = {};

function initAlgoVisualizer() {
  if (!document.getElementById('algoCanvas')) return;
  window.algoViz = new AlgorithmVisualizer('algoCanvas');

  // Toolbar wiring
  const algoSelect = document.getElementById('algoSelect');
  const sizeRange  = document.getElementById('sizeRange');
  const speedRange = document.getElementById('speedRange');
  const btnGen     = document.getElementById('btnGenerate');
  const btnPlay    = document.getElementById('btnPlayPause');
  const btnStep    = document.getElementById('btnStep');
  const btnReset   = document.getElementById('btnReset');

  if (algoSelect) algoSelect.addEventListener('change', e => {
    window.algoViz.setAlgorithm(e.target.value);
    updateComplexityDisplay();
  });
  if (sizeRange) sizeRange.addEventListener('input', e => {
    setText('sizeVal', e.target.value);
    window.algoViz.arraySize = +e.target.value;
  });
  if (speedRange) speedRange.addEventListener('input', e => {
    setText('speedVal', e.target.value);
    window.algoViz.setSpeed(+e.target.value);
  });
  if (btnGen)   btnGen.addEventListener('click', () => window.algoViz.generateArray());
  if (btnPlay)  btnPlay.addEventListener('click', () => {
    window.algoViz.toggle();
    window.algoViz.updatePlayBtn();
  });
  if (btnStep)  btnStep.addEventListener('click', () => window.algoViz.step());
  if (btnReset) btnReset.addEventListener('click', () => window.algoViz.reset());

  updateComplexityDisplay();
}

function updateComplexityDisplay() {
  if (!window.algoViz) return;
  const info = window.algoViz.getComplexityInfo();
  setText('cxBest',   info.best);
  setText('cxAvg',    info.avg);
  setText('cxWorst',  info.worst);
  setText('cxSpace',  info.space);
  setText('cxStable', info.stable);
}

function initDSVisualizers() {
  const types = ['stack', 'queue', 'linkedlist', 'bst', 'heap'];
  types.forEach(t => {
    const canvas = document.getElementById('ds-' + t);
    if (canvas) window.dsVizMap[t] = new DSVisualizer('ds-' + t, t);
  });
}

function initComplexityChart() {
  if (document.getElementById('complexityChart')) {
    new ComplexityChart('complexityChart');
  }
}

function initHeroAnimation() {
  if (!document.getElementById('heroCanvas')) return;
  if (window.networkAnim) window.networkAnim.stop();
  window.networkAnim = new NetworkAnimation('heroCanvas');
  window.networkAnim.start();
}
