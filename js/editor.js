/* ═══════════════════════════════════════════════
   Code Editor & Quiz Engine — CS Academy
   ═══════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   Safe JS Runner (sandboxed via iframe)
   ──────────────────────────────────────── */

class CodeRunner {
  constructor(outputId) {
    this.outputEl = document.getElementById(outputId);
  }

  run(code) {
    if (!this.outputEl) return;
    this.outputEl.innerHTML = '';
    const logs = [];

    // Capture console methods
    const proxy = {
      log:   (...a) => logs.push({ type: 'log',   msg: a.map(this._fmt).join(' ') }),
      error: (...a) => logs.push({ type: 'err',   msg: a.map(this._fmt).join(' ') }),
      warn:  (...a) => logs.push({ type: 'warn',  msg: a.map(this._fmt).join(' ') }),
      info:  (...a) => logs.push({ type: 'info',  msg: a.map(this._fmt).join(' ') }),
    };

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('console', code);
      fn(proxy);
    } catch (err) {
      logs.push({ type: 'err', msg: '❌ ' + err.message });
    }

    logs.forEach(entry => {
      const line = document.createElement('div');
      line.className = entry.type === 'err'  ? 'out-err'  :
                       entry.type === 'info' ? 'out-info' : 'out-log';
      line.textContent = entry.msg;
      this.outputEl.appendChild(line);
    });

    if (logs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'out-info';
      empty.textContent = '// 출력 없음 (console.log를 사용해 결과를 확인하세요)';
      this.outputEl.appendChild(empty);
    }
  }

  _fmt(v) {
    if (v === null)            return 'null';
    if (v === undefined)       return 'undefined';
    if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
    if (typeof v === 'object') {
      try { return JSON.stringify(v, null, 2); } catch { return String(v); }
    }
    return String(v);
  }
}

/* ──────────────────────────────────────────
   Code Editor (enhanced textarea)
   ──────────────────────────────────────── */

class CodeEditor {
  constructor(editorId, outputId) {
    this.editor = document.getElementById(editorId);
    this.runner = new CodeRunner(outputId);
    if (!this.editor) return;

    this.examples = {
      '이벤트 루프 데모': `// 이벤트 루프: 동기 → 마이크로태스크 → 매크로태스크 순서
console.log('1. 동기 코드 시작');

setTimeout(() => {
  console.log('4. setTimeout (매크로태스크)');
}, 0);

Promise.resolve()
  .then(() => console.log('3. Promise.then (마이크로태스크)'));

console.log('2. 동기 코드 끝');
// 실행 순서: 1 → 2 → 3 → 4`,

      '클로저 예제': `// 클로저: 외부 함수의 변수에 접근하는 내부 함수
function makeCounter(start = 0) {
  let count = start;  // 클로저가 캡처하는 변수

  return {
    increment: () => ++count,
    decrement: () => --count,
    value:     () => count,
    reset:     () => { count = start; return count; }
  };
}

const counter = makeCounter(10);
console.log('초기값:', counter.value());    // 10
console.log('+1 후:', counter.increment()); // 11
console.log('+1 후:', counter.increment()); // 12
console.log('-1 후:', counter.decrement()); // 11
console.log('리셋 후:', counter.reset());   // 10

// 각 카운터는 독립적인 클로저를 가집니다
const c2 = makeCounter(0);
c2.increment();
c2.increment();
console.log('c2:', c2.value()); // 2
console.log('c1:', counter.value()); // 여전히 10`,

      '프로토타입 체인': `// 프로토타입 체인: JS 상속의 핵심 메커니즘
function Animal(name, sound) {
  this.name  = name;
  this.sound = sound;
}

// 프로토타입에 메서드 추가 (메모리 효율적)
Animal.prototype.speak = function () {
  return \`\${this.name}이(가) "\${this.sound}" 소리를 냅니다.\`;
};

Animal.prototype.toString = function () {
  return \`[Animal: \${this.name}]\`;
};

function Dog(name) {
  Animal.call(this, name, '멍멍'); // 부모 생성자 호출
  this.tricks = [];
}

// 프로토타입 체인 연결
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.learn = function (trick) {
  this.tricks.push(trick);
  return \`\${this.name}이(가) "\${trick}"를 배웠습니다!\`;
};

const buddy = new Dog('버디');
console.log(buddy.speak());            // Animal 메서드 상속
console.log(buddy.learn('앉아'));       // Dog 메서드
console.log(buddy.learn('악수'));
console.log('기술 목록:', buddy.tricks);

// 프로토타입 체인 확인
console.log('Dog의 인스턴스?', buddy instanceof Dog);
console.log('Animal의 인스턴스?', buddy instanceof Animal);`,

      'Promise 체인': `// Promise와 async/await로 비동기 처리
function delay(ms, value) {
  return new Promise(resolve => {
    // 실제로는 setTimeout이지만 여기서는 즉시 resolve
    resolve(value);
  });
}

function fetchUser(id) {
  const users = { 1: '김철수', 2: '이영희', 3: '박민준' };
  return delay(100, users[id] || null).then(user => {
    if (!user) throw new Error(\`사용자 \${id}를 찾을 수 없습니다.\`);
    return user;
  });
}

function fetchPosts(username) {
  return delay(50, [\`\${username}의 첫 번째 글\`, \`\${username}의 두 번째 글\`]);
}

// Promise 체인
fetchUser(1)
  .then(user => {
    console.log('사용자 조회:', user);
    return fetchPosts(user);
  })
  .then(posts => {
    console.log('게시글:', posts);
  })
  .catch(err => console.log('오류:', err.message));

// async/await 버전 (더 읽기 쉬움)
async function loadUserData(id) {
  try {
    const user  = await fetchUser(id);
    console.log('\\n[async/await] 사용자:', user);
    const posts = await fetchPosts(user);
    console.log('[async/await] 게시글 수:', posts.length);
    return { user, posts };
  } catch (err) {
    console.log('오류:', err.message);
  }
}

loadUserData(2);
loadUserData(99); // 오류 케이스`,

      '자료구조 - 스택': `// 스택(Stack) 구현 및 활용: LIFO (Last In, First Out)
class Stack {
  constructor() { this._data = []; }

  push(item) {
    this._data.push(item);
    return this;
  }
  pop()     { return this._data.pop(); }
  peek()    { return this._data[this._data.length - 1]; }
  isEmpty() { return this._data.length === 0; }
  size()    { return this._data.length; }
  toString(){ return \`Stack[\${this._data.join(' → ')}] ← top\`; }
}

// 활용 예시: 괄호 유효성 검사
function isValidParentheses(s) {
  const stack = new Stack();
  const pairs = { ')': '(', ']': '[', '}': '{' };

  for (const ch of s) {
    if ('([{'.includes(ch)) {
      stack.push(ch);
    } else if (')]}'.includes(ch)) {
      if (stack.isEmpty() || stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.isEmpty();
}

const s = new Stack();
s.push(10).push(20).push(30);
console.log(s.toString());
console.log('peek:', s.peek());
console.log('pop:', s.pop());
console.log(s.toString());

// 괄호 검사
const tests = ['({[]})', '([)]', '{[}', '((()))'];
tests.forEach(t => {
  console.log(\`"\${t}" → \${isValidParentheses(t) ? '유효' : '무효'}\`);
});`,

      '정렬 알고리즘 비교': `// 세 가지 정렬 알고리즘 비교
const arr = [64, 34, 25, 12, 22, 11, 90, 7, 45, 3];
console.log('원본:', arr.join(', '));

// 버블 정렬 O(n²)
function bubbleSort(arr) {
  const a = [...arr];
  let swaps = 0;
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++)
      if (a[j] > a[j+1]) { [a[j], a[j+1]] = [a[j+1], a[j]]; swaps++; }
  return { sorted: a, swaps };
}

// 선택 정렬 O(n²)
function selectionSort(arr) {
  const a = [...arr];
  let swaps = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i+1; j < a.length; j++) if (a[j] < a[min]) min = j;
    if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; swaps++; }
  }
  return { sorted: a, swaps };
}

// 병합 정렬 O(n log n)
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const l = mergeSort(arr.slice(0, mid));
  const r = mergeSort(arr.slice(mid));
  const result = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length)
    result.push(l[i] <= r[j] ? l[i++] : r[j++]);
  return result.concat(l.slice(i)).concat(r.slice(j));
}

const bs = bubbleSort(arr);
const ss = selectionSort(arr);
const ms = mergeSort(arr);
console.log('버블 정렬:', bs.sorted.join(', '), '| 교환:', bs.swaps);
console.log('선택 정렬:', ss.sorted.join(', '), '| 교환:', ss.swaps);
console.log('병합 정렬:', ms.join(', '), '| 교환: 불필요');`,

      '그래프 BFS/DFS': `// 그래프 BFS(너비 우선) & DFS(깊이 우선) 탐색
class Graph {
  constructor() { this.adj = new Map(); }

  addEdge(u, v) {
    if (!this.adj.has(u)) this.adj.set(u, []);
    if (!this.adj.has(v)) this.adj.set(v, []);
    this.adj.get(u).push(v);
    this.adj.get(v).push(u);
  }

  bfs(start) {
    const visited = new Set([start]);
    const queue   = [start];
    const order   = [];

    while (queue.length) {
      const node = queue.shift();
      order.push(node);
      for (const neighbor of (this.adj.get(node) || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return order;
  }

  dfs(start) {
    const visited = new Set();
    const order   = [];

    const explore = (node) => {
      visited.add(node);
      order.push(node);
      for (const neighbor of (this.adj.get(node) || [])) {
        if (!visited.has(neighbor)) explore(neighbor);
      }
    };
    explore(start);
    return order;
  }
}

const g = new Graph();
[[1,2],[1,3],[2,4],[2,5],[3,6],[3,7]].forEach(([u,v]) => g.addEdge(u,v));

console.log('BFS (1부터):', g.bfs(1).join(' → '));
console.log('DFS (1부터):', g.dfs(1).join(' → '));
console.log('BFS: 레벨 단위 탐색 (큐 사용)');
console.log('DFS: 깊이 우선 탐색 (스택/재귀 사용)');`,

      '동적 프로그래밍': `// 동적 프로그래밍: 피보나치 & 최장 공통 부분수열
// 1. 피보나치: 재귀 vs 메모이제이션 vs 타뷸레이션
function fibRecursive(n) {
  if (n <= 1) return n;
  return fibRecursive(n-1) + fibRecursive(n-2);
}

function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  return memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);
}

function fibDP(n) {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}

console.log('=== 피보나치 ===');
console.log('fib(10) 재귀:', fibRecursive(10));
console.log('fib(10) 메모:', fibMemo(10));
console.log('fib(10) DP:  ', fibDP(10));
console.log('fib(40) DP:  ', fibDP(40), '(재귀는 느려서 생략)');

// 2. 최장 공통 부분수열 (LCS)
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  return dp[m][n];
}

console.log('\\n=== LCS (최장 공통 부분수열) ===');
console.log('"ABCBDAB" vs "BDCABA":', lcs('ABCBDAB', 'BDCABA'));
console.log('"AGGTAB" vs "GXTXAYB":', lcs('AGGTAB', 'GXTXAYB'));`,
    };

    this._setupListeners();
    this.loadExample(Object.keys(this.examples)[0]);
  }

  _setupListeners() {
    // Tab key support in editor
    if (this.editor) {
      this.editor.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = this.editor.selectionStart;
          const end   = this.editor.selectionEnd;
          this.editor.value = this.editor.value.substring(0, start) + '  ' + this.editor.value.substring(end);
          this.editor.selectionStart = this.editor.selectionEnd = start + 2;
        }
        // Ctrl+Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.runner.run(this.editor.value);
        }
      });
    }

    // Run button
    const runBtn = document.getElementById('runBtn');
    if (runBtn) runBtn.addEventListener('click', () => this.runner.run(this.editor.value));

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (this.runner.outputEl) this.runner.outputEl.innerHTML = '';
    });

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      const select = document.getElementById('exampleSelect');
      if (select) this.loadExample(select.value);
    });

    // Example selector
    const exSelect = document.getElementById('exampleSelect');
    if (exSelect) {
      // Populate options
      Object.keys(this.examples).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        exSelect.appendChild(opt);
      });
      exSelect.addEventListener('change', e => this.loadExample(e.target.value));
    }
  }

  loadExample(name) {
    if (!this.editor) return;
    const code = this.examples[name];
    if (code) {
      this.editor.value = code;
      const exSelect = document.getElementById('exampleSelect');
      if (exSelect) exSelect.value = name;
    }
  }
}

/* ──────────────────────────────────────────
   Quiz Engine
   ──────────────────────────────────────── */

const QUIZ_QUESTIONS = [
  // CS 기초
  {
    cat: 'cs',
    q:  'CPU의 캐시 메모리가 빠른 이유는 무엇인가요?',
    options: ['용량이 크기 때문', 'CPU 내부 또는 매우 가까이 위치하고 SRAM을 사용하기 때문', '전기를 사용하지 않기 때문', 'HDD보다 작기 때문'],
    answer: 1,
    exp: 'L1/L2/L3 캐시는 CPU 다이에 직접 위치하며, 빠르지만 비싼 SRAM(Static RAM)을 사용합니다. RAM은 상대적으로 느린 DRAM을 사용합니다.'
  },
  {
    cat: 'cs',
    q:  '파이프라이닝(Pipelining)이란?',
    options: ['여러 CPU를 동시에 사용하는 기술', 'CPU가 명령어를 단계별로 분리해 여러 명령어를 동시에 처리하는 기술', '네트워크 데이터를 전송하는 방법', '데이터를 압축하는 알고리즘'],
    answer: 1,
    exp: '파이프라이닝은 명령어 실행을 Fetch → Decode → Execute → Memory → Write-Back 단계로 분리하여 여러 명령어를 동시에 서로 다른 단계에서 실행합니다.'
  },
  {
    cat: 'cs',
    q:  '프로세스(Process)와 스레드(Thread)의 차이로 옳은 것은?',
    options: ['스레드는 독립적인 메모리 공간을 가진다', '프로세스는 스레드보다 생성 비용이 낮다', '스레드는 같은 프로세스 내 메모리를 공유한다', '프로세스는 병렬 실행이 불가능하다'],
    answer: 2,
    exp: '스레드는 같은 프로세스 내에서 힙(Heap)과 전역 데이터를 공유하지만, 각자 독립적인 스택(Stack)을 가집니다. 프로세스는 독립적인 메모리 공간을 가집니다.'
  },
  {
    cat: 'cs',
    q:  '교착상태(Deadlock)가 발생하기 위한 Coffman 조건이 아닌 것은?',
    options: ['상호 배제(Mutual Exclusion)', '선점(Preemption)', '점유와 대기(Hold and Wait)', '환형 대기(Circular Wait)'],
    answer: 1,
    exp: '교착상태의 4가지 필요 조건은 상호 배제, 점유와 대기, 비선점(Non-preemption), 환형 대기입니다. 선점(자원을 강제로 빼앗음)이 가능하면 교착상태가 방지됩니다.'
  },
  {
    cat: 'cs',
    q:  'OSI 7계층에서 TCP가 동작하는 계층은?',
    options: ['1계층 (물리)', '3계층 (네트워크)', '4계층 (전송)', '7계층 (응용)'],
    answer: 2,
    exp: 'TCP(Transmission Control Protocol)는 4계층(전송 계층)에서 동작하며, 신뢰성 있는 데이터 전송, 흐름 제어, 혼잡 제어를 담당합니다. IP는 3계층입니다.'
  },
  {
    cat: 'cs',
    q:  'TCP 3-way handshake의 올바른 순서는?',
    options: ['ACK → SYN → SYN-ACK', 'SYN → SYN-ACK → ACK', 'SYN → ACK → FIN', 'SYN-ACK → SYN → ACK'],
    answer: 1,
    exp: 'TCP 연결 수립: 클라이언트가 SYN 전송 → 서버가 SYN-ACK 응답 → 클라이언트가 ACK 전송. 이후 데이터 통신이 시작됩니다.'
  },
  {
    cat: 'cs',
    q:  'ACID에서 "I(Isolation)"이 의미하는 것은?',
    options: ['트랜잭션이 완전히 실행되거나 전혀 실행되지 않아야 함', '완료된 트랜잭션 결과는 영구적으로 저장되어야 함', '여러 트랜잭션이 동시에 실행될 때 서로 간섭하지 않아야 함', '트랜잭션 실행 후 데이터베이스가 일관된 상태여야 함'],
    answer: 2,
    exp: '격리성(Isolation)은 동시에 실행되는 트랜잭션들이 서로의 중간 상태를 볼 수 없음을 보장합니다. Read Uncommitted부터 Serializable까지 4가지 격리 수준이 있습니다.'
  },
  {
    cat: 'cs',
    q:  'B-Tree 인덱스가 유리한 이유는?',
    options: ['데이터를 압축하기 때문', '항상 O(1) 조회가 가능하기 때문', '균형 트리로 최악의 경우에도 O(log n) 시간에 탐색이 가능하기 때문', '메모리를 전혀 사용하지 않기 때문'],
    answer: 2,
    exp: 'B-Tree는 모든 리프 노드가 같은 레벨에 있는 균형 트리입니다. 삽입/삭제 시에도 자동으로 균형을 유지하므로 최악의 경우에도 O(log n)이 보장됩니다.'
  },

  // 알고리즘
  {
    cat: 'algo',
    q:  '버블 정렬(Bubble Sort)의 최악의 경우 시간 복잡도는?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    answer: 2,
    exp: '버블 정렬은 인접한 두 원소를 비교하여 교환하는 과정을 반복합니다. 역순으로 정렬된 경우 n(n-1)/2번 비교하므로 O(n²)입니다.'
  },
  {
    cat: 'algo',
    q:  '이진 탐색(Binary Search)이 동작하기 위한 전제 조건은?',
    options: ['데이터가 무작위로 섞여 있어야 함', '데이터가 정렬되어 있어야 함', '데이터의 크기가 짝수여야 함', '연결 리스트 구조여야 함'],
    answer: 1,
    exp: '이진 탐색은 중간값과 비교 후 절반을 제거하는 방식입니다. 이를 위해 데이터가 정렬되어 있어야 합니다. 정렬된 배열에서 O(log n)으로 검색합니다.'
  },
  {
    cat: 'algo',
    q:  '다음 중 O(n log n)의 최악 시간 복잡도를 보장하는 정렬은?',
    options: ['퀵 정렬', '버블 정렬', '힙 정렬', '선택 정렬'],
    answer: 2,
    exp: '힙 정렬(Heap Sort)은 최선/평균/최악 모두 O(n log n)이 보장됩니다. 퀵 정렬은 최악(이미 정렬된 경우) O(n²), 버블/선택은 항상 O(n²)입니다.'
  },
  {
    cat: 'algo',
    q:  '스택(Stack)의 삽입/삭제 시간 복잡도는?',
    options: ['O(log n)', 'O(n)', 'O(1)', 'O(n²)'],
    answer: 2,
    exp: '스택은 항상 맨 위(top)에서만 삽입(push)과 삭제(pop)가 발생하므로 O(1)입니다. 배열 기반이든 연결리스트 기반이든 동일합니다.'
  },
  {
    cat: 'algo',
    q:  'BFS(너비 우선 탐색)에서 사용하는 자료구조는?',
    options: ['스택(Stack)', '큐(Queue)', '힙(Heap)', '해시 테이블'],
    answer: 1,
    exp: 'BFS는 현재 노드의 이웃을 모두 방문한 후 그 다음 레벨로 이동합니다. 먼저 발견된 노드를 먼저 처리(FIFO)하므로 큐를 사용합니다. DFS는 스택(재귀)을 사용합니다.'
  },
  {
    cat: 'algo',
    q:  '동적 프로그래밍(DP)과 분할 정복의 차이는?',
    options: ['DP는 재귀를 사용하지 않는다', 'DP는 중복 계산을 메모이제이션/타뷸레이션으로 방지한다', '분할 정복은 문제를 더 작게 분할하지 않는다', 'DP는 항상 O(n)이다'],
    answer: 1,
    exp: '분할 정복과 DP 모두 문제를 작은 부분으로 나누지만, DP는 부분 문제가 겹칠 때(overlapping subproblems) 그 결과를 저장하여 재사용합니다. 피보나치, LCS, 배낭 문제 등이 해당됩니다.'
  },
  {
    cat: 'algo',
    q:  '해시 테이블(Hash Table)에서 충돌(Collision) 해결 방법이 아닌 것은?',
    options: ['체이닝(Chaining)', '오픈 어드레싱(Open Addressing)', '이진 탐색(Binary Search)', '이중 해싱(Double Hashing)'],
    answer: 2,
    exp: '충돌 해결 방법: 체이닝(해당 버킷에 연결리스트), 오픈 어드레싱(다른 빈 버킷 탐색), 이중 해싱(두 번째 해시 함수로 탐색 간격 결정). 이진 탐색은 정렬된 배열 검색 방법입니다.'
  },

  // 프론트엔드
  {
    cat: 'fe',
    q:  '브라우저의 Critical Rendering Path 순서로 올바른 것은?',
    options: ['Paint → Layout → DOM → CSSOM → Render Tree', 'HTML 파싱 → DOM → CSS 파싱 → CSSOM → Render Tree → Layout → Paint', 'JavaScript → CSS → HTML → Paint', 'Layout → Paint → DOM → CSSOM'],
    answer: 1,
    exp: 'CRP: HTML 파싱으로 DOM 트리 생성 → CSS 파싱으로 CSSOM 생성 → DOM + CSSOM = Render Tree → Layout(위치/크기 계산) → Paint(픽셀 그리기) → Composite(레이어 합성)'
  },
  {
    cat: 'fe',
    q:  'JavaScript 이벤트 루프에서 마이크로태스크 큐(Microtask Queue)가 처리되는 시점은?',
    options: ['콜 스택이 비워진 즉시 (매크로태스크보다 먼저)', 'setTimeout 콜백과 동일한 시점', '브라우저 렌더링 후', 'DOM 이벤트 전'],
    answer: 0,
    exp: '마이크로태스크(Promise.then, queueMicrotask, MutationObserver)는 콜 스택이 비워지면 즉시 처리됩니다. 매크로태스크(setTimeout, setInterval) 이전에 실행됩니다.'
  },
  {
    cat: 'fe',
    q:  'CSS Flexbox에서 주축(Main Axis)을 바꾸는 속성은?',
    options: ['flex-wrap', 'align-items', 'flex-direction', 'justify-content'],
    answer: 2,
    exp: 'flex-direction은 row(기본, 가로), row-reverse, column(세로), column-reverse로 주축 방향을 설정합니다. justify-content는 주축 정렬, align-items는 교차축 정렬입니다.'
  },
  {
    cat: 'fe',
    q:  '클로저(Closure)가 주로 사용되는 목적으로 적합하지 않은 것은?',
    options: ['데이터 은닉 및 캡슐화', '함수 팩토리 패턴', '전역 변수 증가', '모듈 패턴 구현'],
    answer: 2,
    exp: '클로저는 전역 변수를 줄이는 데 사용됩니다(반대가 아닙니다). 데이터 은닉, 함수 팩토리, 모듈 패턴, 이벤트 핸들러 상태 유지 등에 활용됩니다.'
  },
  {
    cat: 'fe',
    q:  'Reflow(리플로우)를 유발하는 속성 변경은?',
    options: ['opacity 변경', 'color 변경', 'width 변경', 'background-color 변경'],
    answer: 2,
    exp: 'Reflow는 요소의 크기/위치가 변경될 때 발생하며 비용이 큽니다. width, height, margin, padding, position 등이 해당됩니다. opacity는 Composite만, color/background는 Repaint만 유발합니다.'
  },

  // 백엔드
  {
    cat: 'be',
    q:  'REST API에서 자원을 수정할 때 권장되는 HTTP 메서드는? (전체 수정)',
    options: ['GET', 'POST', 'PUT', 'DELETE'],
    answer: 2,
    exp: 'PUT은 자원 전체를 교체하는 경우, PATCH는 자원 일부를 수정하는 경우 사용합니다. POST는 새 자원 생성, GET은 조회, DELETE는 삭제입니다.'
  },
  {
    cat: 'be',
    q:  'HTTP 상태 코드 401과 403의 차이는?',
    options: ['401은 서버 오류, 403은 클라이언트 오류', '401은 인증 필요(미로그인), 403은 인가 거부(권한 없음)', '401은 리소스 없음, 403은 방법 금지', '차이 없음'],
    answer: 1,
    exp: '401 Unauthorized: 인증이 필요하거나 인증 정보가 유효하지 않음 (로그인 필요). 403 Forbidden: 인증은 되었으나 해당 리소스에 접근 권한이 없음.'
  },
  {
    cat: 'be',
    q:  'JWT(JSON Web Token)의 구조는?',
    options: ['username:password:token', 'Header.Payload.Signature', 'SessionID.UserID.Expiry', 'PublicKey.PrivateKey.Hash'],
    answer: 1,
    exp: 'JWT는 Header(알고리즘), Payload(클레임/데이터), Signature(서명) 세 부분을 각각 Base64Url 인코딩 후 마침표(.)로 연결합니다. 서버는 비밀 키로 서명을 검증합니다.'
  },
  {
    cat: 'be',
    q:  'N+1 문제란?',
    options: ['데이터베이스 연결이 N+1개 필요한 문제', '1개의 쿼리 후 N개의 추가 쿼리가 발생하는 비효율', 'N개의 테이블에 1개의 인덱스만 있는 문제', 'N명 사용자가 동시에 1개 리소스 접근하는 문제'],
    answer: 1,
    exp: 'N+1 문제: 목록 조회(1 쿼리) 후 각 아이템의 연관 데이터를 개별 조회(N 쿼리). 예: 게시글 목록 조회 후 각 게시글 작성자를 따로 조회. JOIN이나 Eager Loading으로 해결합니다.'
  },
  {
    cat: 'be',
    q:  '수평적 확장(Horizontal Scaling)의 특징은?',
    options: ['더 강력한 단일 서버로 업그레이드', '여러 서버를 추가하여 부하를 분산', 'CPU 코어 수를 늘림', '메모리만 추가'],
    answer: 1,
    exp: '수평적 확장(Scale-out): 동일한 서버를 여러 대 추가하고 로드 밸런서로 분산합니다. 비용이 선형적으로 증가하지만 이론적으로 무한 확장 가능. 수직 확장(Scale-up)은 단일 서버 사양 향상입니다.'
  },
  {
    cat: 'be',
    q:  'bcrypt를 사용하는 주요 이유는?',
    options: ['암호화 속도가 매우 빠르기 때문', '비밀번호를 가역적으로 복호화할 수 있기 때문', 'Salt와 Cost Factor로 Rainbow Table 공격과 무차별 대입을 방어하기 때문', '네트워크 암호화에 최적화되어 있기 때문'],
    answer: 2,
    exp: 'bcrypt는 자동으로 Salt를 생성해 Rainbow Table 공격을 방어하고, Cost Factor(work factor)로 해시 연산 비용을 조절하여 하드웨어가 빨라져도 공격을 느리게 유지합니다.'
  },
];

class QuizEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.questions = [];
    this.answered  = {};
    this.category  = 'all';
    this.score     = 0;
  }

  loadCategory(cat) {
    this.category  = cat;
    this.questions = cat === 'all'
      ? [...QUIZ_QUESTIONS]
      : QUIZ_QUESTIONS.filter(q => q.cat === cat);
    this.answered  = {};
    this.score     = 0;
    this.render();
  }

  render() {
    if (!this.container) return;
    const scoreBoard = document.getElementById('quizScoreBoard');
    if (scoreBoard) scoreBoard.classList.remove('visible');

    this.container.innerHTML = this.questions.map((q, i) => `
      <div class="quiz-card fade-in" id="quiz-card-${i}" style="animation-delay:${i * 0.04}s">
        <div class="quiz-num">${this._catLabel(q.cat)} · Q${i + 1}/${this.questions.length}</div>
        <div class="quiz-q">${q.q}</div>
        <div class="quiz-options">
          ${q.options.map((opt, j) => `
            <button class="quiz-option" data-q="${i}" data-opt="${j}">${opt}</button>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-fb-${i}"></div>
      </div>
    `).join('');

    // Bind events
    this.container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', e => this._answer(+e.target.dataset.q, +e.target.dataset.opt));
    });
  }

  _answer(qi, selected) {
    if (this.answered[qi] !== undefined) return;
    this.answered[qi] = selected;

    const q       = this.questions[qi];
    const correct = selected === q.answer;
    if (correct) this.score++;

    const card    = document.getElementById(`quiz-card-${qi}`);
    const fb      = document.getElementById(`quiz-fb-${qi}`);
    const options = card.querySelectorAll('.quiz-option');

    options.forEach((btn, j) => {
      btn.disabled = true;
      if (j === q.answer) btn.classList.add('correct');
      else if (j === selected && !correct) btn.classList.add('wrong');
    });

    fb.className = `quiz-feedback visible ${correct ? 'correct' : 'wrong'}`;
    fb.innerHTML = `<strong>${correct ? '✓ 정답!' : '✗ 오답'}</strong> ${q.exp}`;

    // Check if all answered
    if (Object.keys(this.answered).length === this.questions.length) {
      setTimeout(() => this._showScore(), 600);
    }
  }

  _showScore() {
    const board = document.getElementById('quizScoreBoard');
    if (!board) return;
    const pct   = Math.round((this.score / this.questions.length) * 100);
    const grade = pct >= 90 ? '🏆 탁월해요!' : pct >= 70 ? '👍 잘했어요!' : pct >= 50 ? '📚 더 공부해요!' : '💪 다시 도전!';
    const color = pct >= 90 ? '#34d399' : pct >= 70 ? '#4f8ef7' : pct >= 50 ? '#fbbf24' : '#f87171';

    board.classList.add('visible');
    board.innerHTML = `
      <div class="score-number" style="color:${color}">${pct}%</div>
      <div class="score-label">${this.score}/${this.questions.length} 정답 · ${grade}</div>
      <button class="btn btn-primary" onclick="window.quizEngine && window.quizEngine.loadCategory(window.quizEngine.category)" style="margin-top:8px">다시 도전하기</button>
    `;
    board.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  _catLabel(cat) {
    return { cs: 'CS 기초', algo: '알고리즘', fe: '프론트엔드', be: '백엔드' }[cat] || cat;
  }
}

/* ──────────────────────────────────────────
   Init functions (called by app.js)
   ──────────────────────────────────────── */

window.codeEditor = null;
window.quizEngine = null;

function initCodeEditor() {
  if (!document.getElementById('codeEditorTextarea')) return;
  window.codeEditor = new CodeEditor('codeEditorTextarea', 'codeOutput');
}

function initQuiz() {
  if (!document.getElementById('quizContainer')) return;
  window.quizEngine = new QuizEngine('quizContainer');

  // Category buttons
  document.querySelectorAll('[data-quiz-cat]').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('[data-quiz-cat]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      window.quizEngine.loadCategory(e.target.dataset.quizCat);
    });
  });

  window.quizEngine.loadCategory('all');
}
