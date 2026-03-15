/* =============================================================
   CS Academy — Main Application (app.js)
   SPA Router + Views + Progress Tracking + Canvas Animation
   v2.0 · 2024
   ============================================================= */

'use strict';

/* ─────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────── */
class Router {
  constructor(routes) {
    this.routes = routes;
    window.addEventListener('hashchange', () => this.route());
  }

  route() {
    const hash = window.location.hash.slice(1) || 'home';
    const handler = this.routes[hash];
    if (handler) handler(hash);
    else if (this.routes['home']) this.routes['home']('home');
  }

  navigate(path) {
    window.location.hash = path;
  }
}

/* ─────────────────────────────────────────────
   PROGRESS TRACKER
───────────────────────────────────────────── */
class ProgressTracker {
  constructor() {
    this.storageKey = 'csacademy_visited';
    this.totalPages = 17;
  }

  getVisited() {
    try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); }
    catch { return []; }
  }

  markVisited(page) {
    if (page === 'home') return;
    const visited = this.getVisited();
    if (!visited.includes(page)) {
      visited.push(page);
      localStorage.setItem(this.storageKey, JSON.stringify(visited));
    }
  }

  getPercentage() {
    return Math.round((this.getVisited().length / this.totalPages) * 100);
  }

  isVisited(page) { return this.getVisited().includes(page); }
}

/* ─────────────────────────────────────────────
   APP CONTROLLER
───────────────────────────────────────────── */
class App {
  constructor() {
    this.progress = new ProgressTracker();
    this.currentSection = 'home';
    this._heroAnimId = null;

    this.breadcrumbMap = {
      home:              ['홈'],
      'cs/computer-arch':['홈', 'CS 기초', '컴퓨터 구조'],
      'cs/os':           ['홈', 'CS 기초', '운영체제'],
      'cs/network':      ['홈', 'CS 기초', '네트워크'],
      'cs/database':     ['홈', 'CS 기초', '데이터베이스'],
      'algo/visualizer':     ['홈', '알고리즘', '시각화 도구'],
      'algo/data-structures':['홈', '알고리즘', '자료구조'],
      'algo/complexity':     ['홈', '알고리즘', '시간 복잡도'],
      'algo/dp':             ['홈', '알고리즘', '동적 프로그래밍'],
      'fe/browser':   ['홈', '프론트엔드', '브라우저 동작 원리'],
      'fe/javascript':['홈', '프론트엔드', 'JavaScript 심화'],
      'fe/css-layout':['홈', '프론트엔드', 'CSS & 레이아웃'],
      'fe/playground':['홈', '프론트엔드', '코드 실습'],
      'be/http':        ['홈', '백엔드', 'HTTP & REST API'],
      'be/auth':        ['홈', '백엔드', '인증 & 보안'],
      'be/db-design':   ['홈', '백엔드', 'DB 설계'],
      'be/architecture':['홈', '백엔드', '서버 아키텍처'],
      quiz: ['홈', '퀴즈 & 평가'],
    };

    this.viewMap = {
      home:              viewHome,
      'cs/computer-arch':viewComputerArch,
      'cs/os':           viewOS,
      'cs/network':      viewNetwork,
      'cs/database':     viewDatabase,
      'algo/visualizer':     viewVisualizer,
      'algo/data-structures':viewDataStructures,
      'algo/complexity':     viewComplexity,
      'algo/dp':             viewDP,
      'fe/browser':   viewBrowser,
      'fe/javascript':viewJavaScript,
      'fe/css-layout':viewCSSLayout,
      'fe/playground':viewPlayground,
      'be/http':        viewHTTP,
      'be/auth':        viewAuth,
      'be/db-design':   viewDBDesign,
      'be/architecture':viewArchitecture,
      quiz: viewQuiz,
    };
  }

  setActiveNav(section) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section);
    });
  }

  updateBreadcrumb(section) {
    const el = document.getElementById('breadcrumb');
    if (!el) return;
    const parts = this.breadcrumbMap[section] || ['홈'];
    el.innerHTML = parts
      .map((p, i) => i < parts.length - 1
        ? `<span class="bc-link">${p}</span><span class="bc-sep">›</span>`
        : `<span class="bc-current">${p}</span>`)
      .join('');
  }

  updateProgress() {
    const pct  = this.progress.getPercentage();
    const fill = document.getElementById('progressFill');
    const pctEl= document.getElementById('progressPct');
    if (fill)  fill.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
  }

  renderSection(section) {
    if (this._heroAnimId) {
      cancelAnimationFrame(this._heroAnimId);
      this._heroAnimId = null;
    }

    this.currentSection = section;
    this.progress.markVisited(section);
    this.setActiveNav(section);
    this.updateBreadcrumb(section);
    this.updateProgress();

    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    const fn = this.viewMap[section] || viewHome;
    contentArea.innerHTML = fn();
    contentArea.scrollTop = 0;
    window.scrollTo(0, 0);

    // Close mobile sidebar after navigation
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('visible');

    // Post-render hooks
    if (section === 'home')           initHeroCanvas(this);
    if (section === 'algo/visualizer')initAlgoVisualizer();
    if (section === 'algo/complexity')initComplexityChart();
    if (section === 'fe/playground')  initPlayground();
    if (section === 'quiz')           initQuiz();
  }

  initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');
    const close     = document.getElementById('sidebarClose');
    const open  = () => { sidebar?.classList.add('open'); overlay?.classList.add('visible'); };
    const shut  = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('visible'); };
    hamburger?.addEventListener('click', open);
    overlay?.addEventListener('click', shut);
    close?.addEventListener('click', shut);
  }

  initThemeToggle() {
    const btn  = document.getElementById('themeToggle');
    if (!btn) return;
    const html = document.documentElement;

    const applyTheme = (theme) => {
      html.setAttribute('data-theme', theme);
      const icon  = btn.querySelector('.theme-icon');
      const label = btn.querySelector('.theme-label');
      if (icon)  icon.textContent  = theme === 'dark' ? '🌙' : '☀️';
      if (label) label.textContent = theme === 'dark' ? '다크 모드' : '라이트 모드';
      localStorage.setItem('csacademy_theme', theme);
    };

    applyTheme(localStorage.getItem('csacademy_theme') || 'dark');
    btn.addEventListener('click', () => {
      applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const index = [
      { term: 'cpu',            route: 'cs/computer-arch',     label: '컴퓨터 구조 — CPU' },
      { term: '캐시',            route: 'cs/computer-arch',     label: '컴퓨터 구조 — Cache' },
      { term: '파이프라인',      route: 'cs/computer-arch',     label: '컴퓨터 구조 — 파이프라이닝' },
      { term: '프로세스',        route: 'cs/os',                label: '운영체제 — 프로세스' },
      { term: '스레드',          route: 'cs/os',                label: '운영체제 — 스레드' },
      { term: '스케줄링',        route: 'cs/os',                label: '운영체제 — CPU 스케줄링' },
      { term: '데드락',          route: 'cs/os',                label: '운영체제 — Deadlock' },
      { term: 'osi',             route: 'cs/network',           label: '네트워크 — OSI 7계층' },
      { term: 'tcp',             route: 'cs/network',           label: '네트워크 — TCP/UDP' },
      { term: 'http',            route: 'cs/network',           label: '네트워크 — HTTP' },
      { term: 'dns',             route: 'cs/network',           label: '네트워크 — DNS' },
      { term: '인덱스',          route: 'cs/database',          label: 'DB — 인덱스' },
      { term: 'acid',            route: 'cs/database',          label: 'DB — ACID' },
      { term: '정규화',          route: 'cs/database',          label: 'DB — 정규화' },
      { term: '정렬',            route: 'algo/visualizer',      label: '알고리즘 시각화 — 정렬' },
      { term: '버블',            route: 'algo/visualizer',      label: '알고리즘 — Bubble Sort' },
      { term: '스택',            route: 'algo/data-structures', label: '자료구조 — 스택' },
      { term: '해시',            route: 'algo/data-structures', label: '자료구조 — 해시 테이블' },
      { term: '링크드',          route: 'algo/data-structures', label: '자료구조 — 연결 리스트' },
      { term: '빅오',            route: 'algo/complexity',      label: '시간 복잡도 — Big-O' },
      { term: 'dp',              route: 'algo/dp',              label: '동적 프로그래밍' },
      { term: '피보나치',        route: 'algo/dp',              label: 'DP — 피보나치' },
      { term: '렌더링',          route: 'fe/browser',           label: '브라우저 — 렌더링 파이프라인' },
      { term: '이벤트루프',      route: 'fe/browser',           label: '브라우저 — 이벤트 루프' },
      { term: '클로저',          route: 'fe/javascript',        label: 'JS — 클로저' },
      { term: '프로토타입',      route: 'fe/javascript',        label: 'JS — 프로토타입 체인' },
      { term: 'async',           route: 'fe/javascript',        label: 'JS — 비동기 처리' },
      { term: 'flexbox',         route: 'fe/css-layout',        label: 'CSS — Flexbox' },
      { term: 'grid',            route: 'fe/css-layout',        label: 'CSS — Grid' },
      { term: 'rest',            route: 'be/http',              label: 'HTTP — REST API' },
      { term: 'cors',            route: 'be/http',              label: 'HTTP — CORS' },
      { term: 'jwt',             route: 'be/auth',              label: '인증 — JWT' },
      { term: 'oauth',           route: 'be/auth',              label: '인증 — OAuth 2.0' },
      { term: '샤딩',            route: 'be/db-design',         label: 'DB 설계 — 샤딩' },
      { term: '마이크로서비스',  route: 'be/architecture',      label: '아키텍처 — 마이크로서비스' },
    ];

    let dropdown = null;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (dropdown) { dropdown.remove(); dropdown = null; }
      if (!q) return;

      const results = index.filter(s =>
        s.term.includes(q) || s.label.toLowerCase().includes(q)
      ).slice(0, 6);
      if (!results.length) return;

      dropdown = document.createElement('ul');
      dropdown.className = 'search-dropdown';
      results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r.label;
        li.addEventListener('mousedown', () => {
          window.location.hash = r.route;
          input.value = '';
          dropdown?.remove(); dropdown = null;
        });
        dropdown.appendChild(li);
      });
      input.parentElement.appendChild(dropdown);
    });

    document.addEventListener('click', (e) => {
      if (dropdown && !input.parentElement.contains(e.target)) {
        dropdown.remove(); dropdown = null;
      }
    });
  }

  init() {
    this.initHamburger();
    this.initThemeToggle();
    this.initSearch();
    this.updateProgress();

    const sections = Object.keys(this.viewMap);
    const routes = {};
    sections.forEach(s => { routes[s] = (sec) => this.renderSection(sec); });

    this.router = new Router(routes);
    this.router.route();
  }
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function codeBlock(code) {
  return `<pre class="code-block"><code>${code}</code></pre>`;
}

function infoBox(title, body, type = 'info') {
  return `<div class="info-box ${type}"><strong>${title}</strong><p>${body}</p></div>`;
}

function sectionTitle(icon, title, subtitle = '') {
  return `<div class="section-hero">
    <div class="section-icon">${icon}</div>
    <h1>${title}</h1>
    ${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ''}
  </div>`;
}


/* =============================================================
   VIEW: HOME
   ============================================================= */
function viewHome() {
  return `
<div class="home-view">
  <section class="hero-section">
    <canvas id="heroCanvas" class="hero-canvas"></canvas>
    <div class="hero-content">
      <span class="hero-badge">v2.0 · 2024</span>
      <h1 class="hero-title">컴퓨터 과학을<br>제대로 배우자</h1>
      <p class="hero-subtitle">CS 기초부터 알고리즘, 프론트엔드, 백엔드까지<br>인터랙티브 학습과 시각화로 깊이 있게 이해하는 플랫폼</p>
      <div class="hero-cta">
        <a href="#cs/computer-arch" class="btn btn-primary">학습 시작하기</a>
        <a href="#quiz" class="btn btn-outline">퀴즈 도전하기</a>
      </div>
    </div>
  </section>

  <section class="stats-section">
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-num">4</div><div class="stat-label">개 카테고리</div></div>
      <div class="stat-card"><div class="stat-num">20+</div><div class="stat-label">토픽</div></div>
      <div class="stat-card"><div class="stat-num">50+</div><div class="stat-label">예제</div></div>
      <div class="stat-card"><div class="stat-num">30+</div><div class="stat-label">퀴즈</div></div>
    </div>
  </section>

  <section class="features-section">
    <h2 class="features-title">무엇을 배울 수 있나요?</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">💻</div>
        <h3>CS 기초</h3>
        <p>컴퓨터 과학의 근간이 되는 핵심 개념들</p>
        <ul class="feature-list">
          <li><a href="#cs/computer-arch">컴퓨터 구조</a></li>
          <li><a href="#cs/os">운영체제 (OS)</a></li>
          <li><a href="#cs/network">네트워크</a></li>
          <li><a href="#cs/database">데이터베이스</a></li>
        </ul>
        <a href="#cs/computer-arch" class="feature-cta">시작하기 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔄</div>
        <h3>알고리즘 &amp; 자료구조</h3>
        <p>정렬·탐색·그래프 알고리즘과 핵심 자료구조</p>
        <ul class="feature-list">
          <li><a href="#algo/visualizer">정렬 알고리즘 시각화</a></li>
          <li><a href="#algo/data-structures">자료구조 완전 정복</a></li>
          <li><a href="#algo/complexity">시간/공간 복잡도</a></li>
          <li><a href="#algo/dp">동적 프로그래밍</a></li>
        </ul>
        <a href="#algo/visualizer" class="feature-cta">시작하기 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>프론트엔드</h3>
        <p>브라우저, JavaScript 심화, CSS 레이아웃</p>
        <ul class="feature-list">
          <li><a href="#fe/browser">브라우저 동작 원리</a></li>
          <li><a href="#fe/javascript">JavaScript 심화</a></li>
          <li><a href="#fe/css-layout">CSS &amp; 레이아웃</a></li>
          <li><a href="#fe/playground">코드 실습 플레이그라운드</a></li>
        </ul>
        <a href="#fe/browser" class="feature-cta">시작하기 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚙️</div>
        <h3>백엔드</h3>
        <p>HTTP, 인증, DB 설계, 서버 아키텍처</p>
        <ul class="feature-list">
          <li><a href="#be/http">HTTP &amp; REST API</a></li>
          <li><a href="#be/auth">인증 &amp; 보안</a></li>
          <li><a href="#be/db-design">DB 설계 패턴</a></li>
          <li><a href="#be/architecture">서버 아키텍처</a></li>
        </ul>
        <a href="#be/http" class="feature-cta">시작하기 →</a>
      </div>
      <div class="feature-card accent-green">
        <div class="feature-icon">🖥️</div>
        <h3>코드 실습</h3>
        <p>브라우저에서 바로 실행하는 JavaScript 플레이그라운드</p>
        <p class="feature-desc">이벤트 루프, 클로저, 프로토타입 체인, Promise 등 핵심 개념을 직접 실행해보세요.</p>
        <a href="#fe/playground" class="feature-cta">플레이그라운드 열기 →</a>
      </div>
      <div class="feature-card accent-purple">
        <div class="feature-icon">🎯</div>
        <h3>퀴즈 &amp; 평가</h3>
        <p>30개 이상의 문제로 실력을 점검하세요</p>
        <p class="feature-desc">CS 기초, 알고리즘, 프론트엔드, 백엔드 전 영역의 문제와 상세한 해설을 제공합니다.</p>
        <a href="#quiz" class="feature-cta">퀴즈 시작하기 →</a>
      </div>
    </div>
  </section>

  <section class="path-section">
    <h2>추천 학습 순서</h2>
    <div class="path-steps">
      <div class="path-step"><span class="step-num">1</span><span>CS 기초 다지기</span></div>
      <div class="path-arrow">→</div>
      <div class="path-step"><span class="step-num">2</span><span>알고리즘 학습</span></div>
      <div class="path-arrow">→</div>
      <div class="path-step"><span class="step-num">3</span><span>프론트/백엔드</span></div>
      <div class="path-arrow">→</div>
      <div class="path-step"><span class="step-num">4</span><span>퀴즈로 검증</span></div>
    </div>
  </section>
</div>`;
}

/* =============================================================
   VIEW: CS / COMPUTER ARCHITECTURE
   ============================================================= */
function viewComputerArch() {
  return `
<div class="content-view">
  ${sectionTitle('💻', '컴퓨터 구조', '현대 컴퓨터의 내부 동작 원리를 이해합니다')}
  <div class="topic-section">
    <h2>CPU 구조</h2>
    <p>CPU(Central Processing Unit)는 컴퓨터의 두뇌로, 연산·제어·데이터 처리를 담당합니다.</p>
    <div class="cpu-diagram">
      <div class="cpu-box">
        <div class="cpu-title">CPU</div>
        <div class="cpu-inner">
          <div class="cpu-unit alu"><strong>ALU</strong><small>산술논리연산장치</small><small>+, -, ×, AND, OR</small></div>
          <div class="cpu-unit cu"><strong>Control Unit</strong><small>제어 장치</small><small>명령어 해석 &amp; 제어</small></div>
          <div class="cpu-unit rf"><strong>Register File</strong><small>레지스터 파일</small><small>PC, IR, ACC, SP</small></div>
          <div class="cpu-unit cache"><strong>L1/L2 Cache</strong><small>고속 임시 메모리</small><small>수 KB ~ 수십 MB</small></div>
        </div>
      </div>
    </div>
    ${infoBox('주요 레지스터', 'PC(Program Counter): 다음 실행할 명령어 주소 | IR(Instruction Register): 현재 명령어 | ACC(Accumulator): 연산 결과 임시 저장 | SP(Stack Pointer): 스택 최상단 주소')}
  </div>

  <div class="topic-section">
    <h2>Fetch-Decode-Execute 사이클</h2>
    <div class="pipeline-diagram">
      <div class="stage fetch"><div class="stage-num">1</div><strong>Fetch</strong><small>PC가 가리키는 메모리에서 명령어를 가져옴</small></div>
      <div class="stage-arrow">→</div>
      <div class="stage decode"><div class="stage-num">2</div><strong>Decode</strong><small>명령어를 해석하여 어떤 연산인지 파악</small></div>
      <div class="stage-arrow">→</div>
      <div class="stage execute"><div class="stage-num">3</div><strong>Execute</strong><small>ALU가 실제 연산 수행</small></div>
      <div class="stage-arrow">→</div>
      <div class="stage writeback"><div class="stage-num">4</div><strong>Write Back</strong><small>결과를 레지스터/메모리에 저장</small></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>메모리 계층 구조</h2>
    <p>빠를수록 작고 비싸며, 느릴수록 크고 저렴합니다.</p>
    <div class="memory-pyramid">
      <div class="mem-level l1" style="width:120px"><strong>레지스터</strong><small>&lt;1KB · 1ns</small></div>
      <div class="mem-level l2" style="width:180px"><strong>L1 Cache</strong><small>32–64KB · 1–4ns</small></div>
      <div class="mem-level l3" style="width:240px"><strong>L2 Cache</strong><small>256KB–4MB · 4–12ns</small></div>
      <div class="mem-level l4" style="width:300px"><strong>RAM</strong><small>4–64GB · 50–100ns</small></div>
      <div class="mem-level l5" style="width:360px"><strong>SSD (NVMe)</strong><small>256GB–4TB · 50–200μs</small></div>
      <div class="mem-level l6" style="width:420px"><strong>HDD</strong><small>1–20TB · 5–20ms</small></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>Cache 원리</h2>
    <div class="two-col">
      <div class="concept-card"><h4>시간적 지역성 (Temporal Locality)</h4><p>최근에 접근한 데이터는 <strong>곧 다시 접근될 가능성</strong>이 높다. 예: 루프 내 변수</p></div>
      <div class="concept-card"><h4>공간적 지역성 (Spatial Locality)</h4><p>접근한 주소의 <strong>인접한 주소도 곧 접근될 가능성</strong>이 높다. 예: 배열 순회</p></div>
    </div>
    ${codeBlock('<span class="cmt">// 캐시 친화적 코드 vs 비친화적 코드</span>\n<span class="cmt">// ❌ 캐시 미스 많음 (열 우선 접근)</span>\n<span class="kw">for</span> (<span class="kw">let</span> <span class="var">j</span> = <span class="num">0</span>; <span class="var">j</span> &lt; N; <span class="var">j</span>++)\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> = <span class="num">0</span>; <span class="var">i</span> &lt; N; <span class="var">i</span>++)\n    <span class="var">sum</span> += <span class="var">matrix</span>[<span class="var">i</span>][<span class="var">j</span>]; <span class="cmt">// 열 순서 → 캐시 미스</span>\n\n<span class="cmt">// ✅ 캐시 친화적 (행 우선 접근)</span>\n<span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> = <span class="num">0</span>; <span class="var">i</span> &lt; N; <span class="var">i</span>++)\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">j</span> = <span class="num">0</span>; <span class="var">j</span> &lt; N; <span class="var">j</span>++)\n    <span class="var">sum</span> += <span class="var">matrix</span>[<span class="var">i</span>][<span class="var">j</span>]; <span class="cmt">// 행 순서 → 공간적 지역성</span>')}
  </div>

  <div class="topic-section">
    <h2>파이프라이닝 (Pipelining)</h2>
    <p>여러 명령어를 동시에 처리하여 처리량(throughput)을 높이는 기법입니다.</p>
    <div class="pipeline-table-wrap">
      <table class="pipeline-table">
        <thead><tr><th>명령어</th><th>Fetch</th><th>Decode</th><th>Execute</th><th>Memory</th><th>WriteBack</th></tr></thead>
        <tbody>
          <tr><td>I1</td><td class="pstage f">IF</td><td class="pstage d">ID</td><td class="pstage e">EX</td><td class="pstage m">MEM</td><td class="pstage w">WB</td></tr>
          <tr><td>I2</td><td></td><td class="pstage f">IF</td><td class="pstage d">ID</td><td class="pstage e">EX</td><td class="pstage m">MEM</td></tr>
          <tr><td>I3</td><td></td><td></td><td class="pstage f">IF</td><td class="pstage d">ID</td><td class="pstage e">EX</td></tr>
          <tr><td>I4</td><td></td><td></td><td></td><td class="pstage f">IF</td><td class="pstage d">ID</td></tr>
          <tr><td>I5</td><td></td><td></td><td></td><td></td><td class="pstage f">IF</td></tr>
        </tbody>
      </table>
    </div>
    ${infoBox('파이프라인 해저드(Hazard)', '데이터 해저드: 이전 명령어 결과에 의존 | 제어 해저드: 분기 명령어로 인한 파이프라인 플러시 | 구조적 해저드: 동일 하드웨어 자원 충돌', 'warning')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: CS / OS
   ============================================================= */
function viewOS() {
  return `
<div class="content-view">
  ${sectionTitle('🖥️', '운영체제 (OS)', '프로세스, 메모리, 스케줄링, 동기화의 핵심 개념')}

  <div class="topic-section">
    <h2>프로세스 vs 스레드</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>프로세스 (Process)</th><th>스레드 (Thread)</th></tr></thead>
      <tbody>
        <tr><td>정의</td><td>실행 중인 프로그램의 인스턴스</td><td>프로세스 내의 실행 단위</td></tr>
        <tr><td>메모리</td><td>독립적인 주소 공간</td><td>프로세스 메모리 공유</td></tr>
        <tr><td>컨텍스트 스위칭</td><td>느림 (오버헤드 큼)</td><td>빠름 (오버헤드 작음)</td></tr>
        <tr><td>통신 방식</td><td>IPC (파이프, 소켓, 공유메모리)</td><td>공유 메모리 직접 접근</td></tr>
        <tr><td>안전성</td><td>하나가 죽어도 다른 프로세스 영향 없음</td><td>하나가 죽으면 프로세스 전체 영향</td></tr>
        <tr><td>생성 비용</td><td>높음</td><td>낮음</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>프로세스 상태 다이어그램</h2>
    <div class="process-states">
      <div class="pstate new">New<br><small>생성됨</small></div>
      <div class="pstate-arrow">→ 승인</div>
      <div class="pstate ready">Ready<br><small>대기 중</small></div>
      <div class="pstate-arrow">→ 디스패치</div>
      <div class="pstate running">Running<br><small>실행 중</small></div>
      <div class="pstate-col">
        <div class="pstate-arrow down">↓ I/O 요청</div>
        <div class="pstate waiting">Waiting<br><small>대기 (I/O)</small></div>
        <div class="pstate-arrow up">↑ I/O 완료</div>
      </div>
      <div class="pstate-arrow">→ 종료</div>
      <div class="pstate terminated">Terminated<br><small>종료됨</small></div>
    </div>
    <p style="text-align:center;margin-top:8px;color:var(--text-muted);font-size:.85rem">Running → Ready: 타임아웃(선점) | Running → Terminated: exit() 호출</p>
  </div>

  <div class="topic-section">
    <h2>CPU 스케줄링 알고리즘</h2>
    <div class="algo-cards">
      <div class="algo-card"><h4>FCFS (First Come First Served)</h4><p>도착 순서대로 처리. 비선점형.</p><p class="algo-detail">단점: Convoy Effect — 긴 작업이 짧은 작업들을 막음</p></div>
      <div class="algo-card"><h4>SJF (Shortest Job First)</h4><p>실행 시간이 가장 짧은 작업 먼저. 평균 대기 시간 최소화.</p><p class="algo-detail">단점: Starvation — 긴 작업은 영원히 기다릴 수 있음</p></div>
      <div class="algo-card"><h4>Round Robin (RR)</h4><p>각 프로세스에 동일한 타임 퀀텀(time quantum) 할당. 선점형.</p><p class="algo-detail">퀀텀이 너무 크면 FCFS와 같아지고, 너무 작으면 컨텍스트 스위칭 오버헤드 증가</p></div>
      <div class="algo-card"><h4>Priority Scheduling</h4><p>우선순위가 높은 프로세스 먼저 실행.</p><p class="algo-detail">Aging 기법으로 Starvation 해결: 오래 기다린 프로세스의 우선순위를 높임</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>메모리 관리</h2>
    <div class="two-col">
      <div>
        <h4>가상 메모리 (Virtual Memory)</h4>
        <p>각 프로세스에 독립적인 가상 주소 공간을 제공. 실제 물리 메모리보다 큰 주소 공간을 사용 가능.</p>
        <h4>페이징 (Paging)</h4>
        <p>물리 메모리를 고정 크기의 <strong>프레임(Frame)</strong>으로, 가상 메모리를 동일 크기의 <strong>페이지(Page)</strong>로 나눔. 페이지 테이블이 가상-물리 주소 매핑을 관리.</p>
      </div>
      <div>
        <h4>세그멘테이션 (Segmentation)</h4>
        <p>프로그램을 논리적 세그먼트(코드, 데이터, 스택)로 분할. 가변 크기.</p>
        <h4>페이지 교체 알고리즘</h4>
        <ul>
          <li><strong>FIFO</strong>: 가장 먼저 들어온 페이지 교체</li>
          <li><strong>LRU</strong>: 가장 오래 사용 안 된 페이지 교체</li>
          <li><strong>Optimal</strong>: 앞으로 가장 오래 사용 안 될 페이지 교체 (이론적)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="topic-section">
    <h2>동기화 (Synchronization)</h2>
    <div class="two-col">
      <div class="concept-card danger">
        <h4>Race Condition (경쟁 조건)</h4>
        <p>두 스레드가 공유 자원에 동시 접근할 때 결과가 실행 순서에 따라 달라지는 상황</p>
        ${codeBlock('<span class="cmt">// Thread A          Thread B</span>\n<span class="cmt">// read count(0)      read count(0)</span>\n<span class="cmt">// count = 0+1=1      count = 0+1=1</span>\n<span class="cmt">// write count(1)     write count(1)</span>\n<span class="cmt">// 결과: 2가 돼야 하지만 1이 됨 ☠️</span>')}
      </div>
      <div class="concept-card success">
        <h4>Mutex vs Semaphore</h4>
        <p><strong>Mutex</strong>: 하나의 스레드만 임계 구역(Critical Section) 진입. 잠금 &amp; 해제는 같은 스레드가 수행.</p>
        <p><strong>Semaphore</strong>: N개 스레드 동시 진입 허용. Binary(0/1) vs Counting.</p>
      </div>
    </div>
    <h4>Deadlock (교착 상태) — Coffman 4조건</h4>
    <div class="coffman-grid">
      <div class="coffman-card"><strong>상호 배제</strong><br><small>Mutual Exclusion</small><br>자원은 한 번에 한 프로세스만 사용</div>
      <div class="coffman-card"><strong>점유 대기</strong><br><small>Hold &amp; Wait</small><br>자원 점유 중 다른 자원 대기</div>
      <div class="coffman-card"><strong>비선점</strong><br><small>No Preemption</small><br>자원 강제 회수 불가</div>
      <div class="coffman-card"><strong>순환 대기</strong><br><small>Circular Wait</small><br>P1→P2→P3→P1 순환 의존</div>
    </div>
    ${infoBox('Deadlock 해결 방법', '예방(Prevention): Coffman 조건 하나를 없앰 | 회피(Avoidance): Banker 알고리즘으로 안전 상태 유지 | 탐지(Detection): 데드락 감지 후 프로세스 종료 | 무시(Ignorance): 발생 빈도가 낮을 때 재부팅', 'warning')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: CS / NETWORK
   ============================================================= */
function viewNetwork() {
  return `
<div class="content-view">
  ${sectionTitle('🌐', '네트워크', 'OSI 7계층부터 HTTP, DNS, CDN까지')}

  <div class="topic-section">
    <h2>OSI 7계층 모델</h2>
    <div class="osi-stack">
      <div class="osi-layer app" tabindex="0"><span class="layer-num">7</span><span class="layer-name">응용 계층 (Application)</span><span class="layer-proto">HTTP, FTP, SMTP, DNS, SSH</span></div>
      <div class="osi-layer pres" tabindex="0"><span class="layer-num">6</span><span class="layer-name">표현 계층 (Presentation)</span><span class="layer-proto">SSL/TLS, JPEG, MPEG</span></div>
      <div class="osi-layer sess" tabindex="0"><span class="layer-num">5</span><span class="layer-name">세션 계층 (Session)</span><span class="layer-proto">NetBIOS, RPC</span></div>
      <div class="osi-layer trans" tabindex="0"><span class="layer-num">4</span><span class="layer-name">전송 계층 (Transport)</span><span class="layer-proto">TCP, UDP</span></div>
      <div class="osi-layer net" tabindex="0"><span class="layer-num">3</span><span class="layer-name">네트워크 계층 (Network)</span><span class="layer-proto">IP, ICMP, ARP</span></div>
      <div class="osi-layer data" tabindex="0"><span class="layer-num">2</span><span class="layer-name">데이터 링크 계층 (Data Link)</span><span class="layer-proto">Ethernet, Wi-Fi (802.11)</span></div>
      <div class="osi-layer phys" tabindex="0"><span class="layer-num">1</span><span class="layer-name">물리 계층 (Physical)</span><span class="layer-proto">케이블, 광섬유, 무선 신호</span></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>TCP vs UDP</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>TCP</th><th>UDP</th></tr></thead>
      <tbody>
        <tr><td>연결 방식</td><td>연결 지향 (3-way handshake)</td><td>비연결 (Connectionless)</td></tr>
        <tr><td>신뢰성</td><td>데이터 전달 보장</td><td>보장 없음</td></tr>
        <tr><td>순서 보장</td><td>O (순서 번호 사용)</td><td>X</td></tr>
        <tr><td>흐름 제어</td><td>O (슬라이딩 윈도우)</td><td>X</td></tr>
        <tr><td>속도</td><td>느림 (오버헤드 있음)</td><td>빠름</td></tr>
        <tr><td>사용 예</td><td>HTTP, FTP, 이메일</td><td>DNS, 스트리밍, 게임</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>TCP 3-Way Handshake</h2>
    <div class="handshake-diagram">
      <div class="hs-side"><strong>클라이언트</strong><div class="hs-state">CLOSED</div><div class="hs-state">SYN_SENT</div><div class="hs-state">ESTABLISHED</div></div>
      <div class="hs-messages">
        <div class="hs-msg right">─── SYN (seq=x) ────────────→</div>
        <div class="hs-msg left">←─── SYN-ACK (seq=y, ack=x+1) ─</div>
        <div class="hs-msg right">─── ACK (ack=y+1) ──────────→</div>
      </div>
      <div class="hs-side"><strong>서버</strong><div class="hs-state">LISTEN</div><div class="hs-state">SYN_RCVD</div><div class="hs-state">ESTABLISHED</div></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>HTTP 메서드 &amp; 상태 코드</h2>
    <div class="two-col">
      <table class="compare-table">
        <thead><tr><th>메서드</th><th>의미</th><th>멱등성</th></tr></thead>
        <tbody>
          <tr><td><code>GET</code></td><td>리소스 조회</td><td>O</td></tr>
          <tr><td><code>POST</code></td><td>리소스 생성</td><td>X</td></tr>
          <tr><td><code>PUT</code></td><td>리소스 전체 교체</td><td>O</td></tr>
          <tr><td><code>PATCH</code></td><td>리소스 부분 수정</td><td>X</td></tr>
          <tr><td><code>DELETE</code></td><td>리소스 삭제</td><td>O</td></tr>
        </tbody>
      </table>
      <table class="compare-table">
        <thead><tr><th>코드</th><th>의미</th></tr></thead>
        <tbody>
          <tr><td>200 OK</td><td>요청 성공</td></tr>
          <tr><td>201 Created</td><td>생성 성공</td></tr>
          <tr><td>301 Moved</td><td>영구 리다이렉트</td></tr>
          <tr><td>400 Bad Request</td><td>잘못된 요청</td></tr>
          <tr><td>401 Unauthorized</td><td>인증 필요</td></tr>
          <tr><td>403 Forbidden</td><td>권한 없음</td></tr>
          <tr><td>404 Not Found</td><td>리소스 없음</td></tr>
          <tr><td>500 Internal Error</td><td>서버 오류</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="topic-section">
    <h2>DNS 동작 원리</h2>
    <div class="dns-steps">
      <div class="dns-step"><span class="step-badge">1</span>브라우저 캐시 확인</div>
      <div class="dns-arrow">→</div>
      <div class="dns-step"><span class="step-badge">2</span>OS 캐시 &amp; hosts 파일</div>
      <div class="dns-arrow">→</div>
      <div class="dns-step"><span class="step-badge">3</span>Local DNS Resolver 질의</div>
      <div class="dns-arrow">→</div>
      <div class="dns-step"><span class="step-badge">4</span>Root DNS 서버 질의</div>
      <div class="dns-arrow">→</div>
      <div class="dns-step"><span class="step-badge">5</span>TLD (.com) DNS 질의</div>
      <div class="dns-arrow">→</div>
      <div class="dns-step"><span class="step-badge">6</span>Authoritative DNS → IP 반환</div>
    </div>
    ${infoBox('TTL (Time To Live)', 'DNS 응답은 TTL 값 동안 캐시됩니다. CDN 전환 시 TTL을 미리 낮추는 것이 일반적인 전략입니다.')}
  </div>

  <div class="topic-section">
    <h2>CDN &amp; 로드 밸런싱</h2>
    <div class="two-col">
      <div class="concept-card"><h4>CDN (Content Delivery Network)</h4><p>전 세계 엣지 서버에 콘텐츠를 캐싱하여 사용자에게 가장 가까운 서버에서 응답. 레이턴시 감소 및 원본 서버 부하 절감.</p></div>
      <div class="concept-card"><h4>로드 밸런싱 (Load Balancing)</h4><p>여러 서버에 트래픽을 분산. 알고리즘: Round Robin, Least Connections, IP Hash, Weighted.</p><p>L4 (Transport) vs L7 (Application) 로드 밸런서</p></div>
    </div>
  </div>
</div>`;
}

/* =============================================================
   VIEW: CS / DATABASE
   ============================================================= */
function viewDatabase() {
  return `
<div class="content-view">
  ${sectionTitle('🗄️', '데이터베이스', 'RDBMS, 인덱스, ACID, 정규화, NoSQL')}

  <div class="topic-section">
    <h2>RDBMS vs NoSQL</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>RDBMS (관계형)</th><th>NoSQL</th></tr></thead>
      <tbody>
        <tr><td>데이터 모델</td><td>테이블 (행/열)</td><td>문서, 키-값, 그래프, 컬럼</td></tr>
        <tr><td>스키마</td><td>엄격한 고정 스키마</td><td>유연한 스키마</td></tr>
        <tr><td>트랜잭션</td><td>ACID 완전 지원</td><td>제한적 (BASE)</td></tr>
        <tr><td>확장성</td><td>수직 확장 (Scale Up)</td><td>수평 확장 (Scale Out)</td></tr>
        <tr><td>쿼리</td><td>SQL</td><td>각 DB별 API</td></tr>
        <tr><td>대표 제품</td><td>MySQL, PostgreSQL, Oracle</td><td>MongoDB, Redis, Cassandra</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>인덱스 구조 (B-Tree Index)</h2>
    <p>인덱스는 데이터 검색 속도를 높이기 위한 별도의 자료구조입니다. B-Tree 인덱스는 범위 검색과 정렬에 효과적입니다.</p>
    <div class="btree-diagram">
      <div class="btree-level"><div class="btree-node root">[40]</div></div>
      <div class="btree-level"><div class="btree-node">[10, 20]</div><div class="btree-node">[60, 80]</div></div>
      <div class="btree-level">
        <div class="btree-node leaf">[1,5,9]</div>
        <div class="btree-node leaf">[11,15,19]</div>
        <div class="btree-node leaf">[21,30,35]</div>
        <div class="btree-node leaf">[41,50,55]</div>
        <div class="btree-node leaf">[61,70,75]</div>
        <div class="btree-node leaf">[81,90,99]</div>
      </div>
    </div>
    ${infoBox('인덱스 장단점', '장점: SELECT 쿼리 성능 대폭 향상, ORDER BY / GROUP BY 최적화 | 단점: INSERT/UPDATE/DELETE 시 인덱스도 갱신 → 쓰기 성능 저하, 추가 디스크 공간 사용')}
  </div>

  <div class="topic-section">
    <h2>ACID 트랜잭션 속성</h2>
    <div class="acid-grid">
      <div class="acid-card a"><div class="acid-letter">A</div><h4>Atomicity (원자성)</h4><p>트랜잭션의 모든 연산은 <strong>전부 성공</strong>하거나 <strong>전부 실패</strong>. 중간 상태 없음.</p></div>
      <div class="acid-card c"><div class="acid-letter">C</div><h4>Consistency (일관성)</h4><p>트랜잭션 완료 후 데이터는 항상 <strong>데이터베이스 제약 조건</strong>을 만족해야 함.</p></div>
      <div class="acid-card i"><div class="acid-letter">I</div><h4>Isolation (격리성)</h4><p>동시에 실행되는 트랜잭션들이 <strong>서로 영향을 주지 않음</strong>.</p></div>
      <div class="acid-card d"><div class="acid-letter">D</div><h4>Durability (지속성)</h4><p>커밋된 트랜잭션의 결과는 <strong>영구적으로 반영</strong>됨. 장애 시에도 유지.</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>정규화 (Normalization)</h2>
    <div class="normalization">
      <div class="normal-form"><h4>1NF (제1 정규형)</h4><p>각 컬럼이 <strong>원자값(Atomic Value)</strong>만 가져야 함. 반복 그룹 제거.</p><p class="bad">❌ 취미 컬럼에 "독서, 등산, 코딩" 같은 다중 값</p><p class="good">✅ 취미를 별도 행으로 분리</p></div>
      <div class="normal-form"><h4>2NF (제2 정규형)</h4><p>1NF + <strong>부분 함수 종속 제거</strong>. 복합 PK에서 일부 컬럼에만 종속되는 컬럼 분리.</p></div>
      <div class="normal-form"><h4>3NF (제3 정규형)</h4><p>2NF + <strong>이행 함수 종속 제거</strong>. A→B, B→C이면 A→C 제거.</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>JOIN 종류</h2>
    <table class="compare-table">
      <thead><tr><th>JOIN 종류</th><th>설명</th><th>특징</th></tr></thead>
      <tbody>
        <tr><td>INNER JOIN</td><td>양쪽 테이블에 모두 일치하는 행만 반환</td><td>가장 일반적</td></tr>
        <tr><td>LEFT JOIN</td><td>왼쪽 테이블 전체 + 오른쪽 일치하는 행</td><td>오른쪽 없으면 NULL</td></tr>
        <tr><td>RIGHT JOIN</td><td>오른쪽 테이블 전체 + 왼쪽 일치하는 행</td><td>왼쪽 없으면 NULL</td></tr>
        <tr><td>FULL OUTER JOIN</td><td>양쪽 테이블의 모든 행 반환</td><td>일치 안 하면 NULL</td></tr>
        <tr><td>CROSS JOIN</td><td>카테시안 곱 (모든 조합)</td><td>행 수 = N × M</td></tr>
        <tr><td>SELF JOIN</td><td>같은 테이블을 두 번 조인</td><td>계층 구조 쿼리에 사용</td></tr>
      </tbody>
    </table>
  </div>
</div>`;
}

/* =============================================================
   VIEW: ALGO / VISUALIZER
   ============================================================= */
function viewVisualizer() {
  return `
<div class="content-view">
  ${sectionTitle('🔄', '알고리즘 시각화', '정렬 알고리즘의 동작을 눈으로 확인하세요')}
  <div class="topic-section">
    <p>배열의 정렬 과정을 실시간으로 시각화합니다. 알고리즘을 선택하고 배열 크기와 속도를 조절하여 동작 원리를 직접 확인해보세요.</p>
  </div>
  <div class="visualizer-container">
    <div class="viz-toolbar">
      <div class="viz-control">
        <label>알고리즘</label>
        <select id="algoSelect">
          <option value="bubble">Bubble Sort</option>
          <option value="selection">Selection Sort</option>
          <option value="insertion">Insertion Sort</option>
          <option value="merge">Merge Sort</option>
          <option value="quick">Quick Sort</option>
          <option value="heap">Heap Sort</option>
        </select>
      </div>
      <div class="viz-control">
        <label>크기: <span id="sizeLabel">40</span></label>
        <input type="range" id="sizeSlider" min="10" max="80" value="40" />
      </div>
      <div class="viz-control">
        <label>속도: <span id="speedLabel">5</span></label>
        <input type="range" id="speedSlider" min="1" max="10" value="5" />
      </div>
      <button class="viz-btn" id="generateBtn">🎲 생성</button>
      <button class="viz-btn primary" id="playBtn">▶ 시작</button>
      <button class="viz-btn" id="stepBtn">⏭ 스텝</button>
      <button class="viz-btn danger" id="resetBtn">↺ 초기화</button>
    </div>
    <canvas id="algoCanvas" width="900" height="320"></canvas>
    <div class="viz-info">
      <div class="viz-stat">비교: <strong id="compCount">0</strong></div>
      <div class="viz-stat">교환: <strong id="swapCount">0</strong></div>
      <div class="viz-stat">시간 복잡도: <strong id="timeComp">O(n²)</strong></div>
      <div class="viz-stat">공간 복잡도: <strong id="spaceComp">O(1)</strong></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>알고리즘 상세 설명</h2>
    <div class="algo-tabs">
      <button class="tab-btn active" data-tab="bubble">Bubble</button>
      <button class="tab-btn" data-tab="selection">Selection</button>
      <button class="tab-btn" data-tab="insertion">Insertion</button>
      <button class="tab-btn" data-tab="merge">Merge</button>
      <button class="tab-btn" data-tab="quick">Quick</button>
      <button class="tab-btn" data-tab="heap">Heap</button>
    </div>
    <div class="tab-content active" id="tab-bubble">
      <h4>Bubble Sort (버블 정렬)</h4>
      <p>인접한 두 원소를 비교하여 정렬. 큰 값이 오른쪽으로 "버블"처럼 올라감.</p>
      <ul><li>시간 복잡도: 최선 O(n), 평균 O(n²), 최악 O(n²)</li><li>공간 복잡도: O(1)</li><li>안정 정렬(Stable Sort)</li></ul>
      ${codeBlock('<span class="kw">function</span> <span class="fn">bubbleSort</span>(<span class="var">arr</span>) {\n  <span class="kw">const</span> <span class="var">n</span> = <span class="var">arr</span>.<span class="var">length</span>;\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> = <span class="num">0</span>; <span class="var">i</span> &lt; <span class="var">n</span> - <span class="num">1</span>; <span class="var">i</span>++)\n    <span class="kw">for</span> (<span class="kw">let</span> <span class="var">j</span> = <span class="num">0</span>; <span class="var">j</span> &lt; <span class="var">n</span> - <span class="var">i</span> - <span class="num">1</span>; <span class="var">j</span>++)\n      <span class="kw">if</span> (<span class="var">arr</span>[<span class="var">j</span>] &gt; <span class="var">arr</span>[<span class="var">j</span>+<span class="num">1</span>])\n        [<span class="var">arr</span>[<span class="var">j</span>], <span class="var">arr</span>[<span class="var">j</span>+<span class="num">1</span>]] = [<span class="var">arr</span>[<span class="var">j</span>+<span class="num">1</span>], <span class="var">arr</span>[<span class="var">j</span>]];\n  <span class="kw">return</span> <span class="var">arr</span>;\n}')}
    </div>
    <div class="tab-content" id="tab-selection">
      <h4>Selection Sort (선택 정렬)</h4>
      <p>매 회전마다 미정렬 구간에서 최솟값을 찾아 맨 앞과 교환.</p>
      <ul><li>시간 복잡도: 항상 O(n²)</li><li>공간 복잡도: O(1)</li><li>불안정 정렬</li></ul>
    </div>
    <div class="tab-content" id="tab-insertion">
      <h4>Insertion Sort (삽입 정렬)</h4>
      <p>정렬된 구간에 새 원소를 적절한 위치에 삽입. 거의 정렬된 배열에서 매우 효율적.</p>
      <ul><li>시간 복잡도: 최선 O(n), 평균 O(n²), 최악 O(n²)</li><li>공간 복잡도: O(1)</li><li>안정 정렬</li></ul>
    </div>
    <div class="tab-content" id="tab-merge">
      <h4>Merge Sort (병합 정렬)</h4>
      <p>분할 정복: 배열을 반으로 나누고 정렬 후 합병. 항상 O(n log n) 보장.</p>
      <ul><li>시간 복잡도: 항상 O(n log n)</li><li>공간 복잡도: O(n)</li><li>안정 정렬</li></ul>
    </div>
    <div class="tab-content" id="tab-quick">
      <h4>Quick Sort (퀵 정렬)</h4>
      <p>피벗(pivot)을 기준으로 작은 값을 왼쪽, 큰 값을 오른쪽에 배치하고 재귀 호출.</p>
      <ul><li>시간 복잡도: 평균 O(n log n), 최악 O(n²)</li><li>공간 복잡도: O(log n)</li><li>불안정 정렬</li></ul>
    </div>
    <div class="tab-content" id="tab-heap">
      <h4>Heap Sort (힙 정렬)</h4>
      <p>최대 힙을 구성한 뒤 루트를 추출하며 정렬.</p>
      <ul><li>시간 복잡도: 항상 O(n log n)</li><li>공간 복잡도: O(1)</li><li>불안정 정렬</li></ul>
    </div>
  </div>

  <div class="topic-section">
    <h2>정렬 알고리즘 비교</h2>
    <table class="compare-table">
      <thead><tr><th>알고리즘</th><th>최선</th><th>평균</th><th>최악</th><th>공간</th><th>안정</th></tr></thead>
      <tbody>
        <tr><td>Bubble Sort</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>✅</td></tr>
        <tr><td>Selection Sort</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>❌</td></tr>
        <tr><td>Insertion Sort</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>✅</td></tr>
        <tr><td>Merge Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td>✅</td></tr>
        <tr><td>Quick Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td><td>❌</td></tr>
        <tr><td>Heap Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>❌</td></tr>
      </tbody>
    </table>
  </div>
</div>`;
}

/* =============================================================
   VIEW: ALGO / DATA STRUCTURES
   ============================================================= */
function viewDataStructures() {
  return `
<div class="content-view">
  ${sectionTitle('📦', '자료구조', '핵심 자료구조의 원리와 JavaScript 구현')}

  <div class="topic-section">
    <h2>배열 (Array)</h2>
    <p>연속된 메모리 공간에 동일한 타입의 데이터를 순서대로 저장. 인덱스로 O(1) 접근.</p>
    <div class="ds-complexity">
      <span class="cx good">접근: O(1)</span><span class="cx ok">탐색: O(n)</span>
      <span class="cx ok">삽입(끝): O(1)</span><span class="cx bad">삽입(앞/중간): O(n)</span>
    </div>
  </div>

  <div class="topic-section">
    <h2>연결 리스트 (Linked List)</h2>
    <p>각 노드가 데이터와 다음 노드의 포인터를 가짐. 동적 크기, 삽입/삭제 효율적.</p>
    <div class="ds-complexity">
      <span class="cx bad">접근: O(n)</span><span class="cx bad">탐색: O(n)</span>
      <span class="cx good">삽입(앞): O(1)</span><span class="cx ok">삽입(중간): O(n)</span>
    </div>
    ${codeBlock('<span class="kw">class</span> <span class="typ">Node</span> {\n  <span class="fn">constructor</span>(<span class="var">data</span>) { <span class="kw">this</span>.<span class="var">data</span> = <span class="var">data</span>; <span class="kw">this</span>.<span class="var">next</span> = <span class="kw">null</span>; }\n}\n<span class="kw">class</span> <span class="typ">LinkedList</span> {\n  <span class="fn">constructor</span>() { <span class="kw">this</span>.<span class="var">head</span> = <span class="kw">null</span>; }\n  <span class="fn">prepend</span>(<span class="var">data</span>) {\n    <span class="kw">const</span> <span class="var">node</span> = <span class="kw">new</span> <span class="typ">Node</span>(<span class="var">data</span>);\n    <span class="var">node</span>.<span class="var">next</span> = <span class="kw">this</span>.<span class="var">head</span>;\n    <span class="kw">this</span>.<span class="var">head</span> = <span class="var">node</span>;\n  }\n}')}
  </div>

  <div class="topic-section">
    <h2>스택 (Stack)</h2>
    <p>LIFO (Last In, First Out). 가장 나중에 넣은 것이 가장 먼저 나옴.</p>
    <div class="ds-complexity">
      <span class="cx good">push: O(1)</span><span class="cx good">pop: O(1)</span><span class="cx good">peek: O(1)</span>
    </div>
    <p><strong>활용:</strong> 함수 호출 스택, Undo/Redo, 괄호 검사, DFS, 역순 출력</p>
    ${codeBlock('<span class="kw">class</span> <span class="typ">Stack</span> {\n  <span class="fn">constructor</span>() { <span class="kw">this</span>.<span class="var">items</span> = []; }\n  <span class="fn">push</span>(<span class="var">item</span>) { <span class="kw">this</span>.<span class="var">items</span>.<span class="fn">push</span>(<span class="var">item</span>); }\n  <span class="fn">pop</span>()      { <span class="kw">return</span> <span class="kw">this</span>.<span class="var">items</span>.<span class="fn">pop</span>(); }\n  <span class="fn">peek</span>()     { <span class="kw">return</span> <span class="kw">this</span>.<span class="var">items</span>[<span class="kw">this</span>.<span class="var">items</span>.<span class="var">length</span> - <span class="num">1</span>]; }\n  <span class="fn">isEmpty</span>()  { <span class="kw">return</span> <span class="kw">this</span>.<span class="var">items</span>.<span class="var">length</span> === <span class="num">0</span>; }\n}')}
  </div>

  <div class="topic-section">
    <h2>큐 (Queue)</h2>
    <p>FIFO (First In, First Out). 먼저 넣은 것이 먼저 나옴.</p>
    <div class="ds-complexity">
      <span class="cx good">enqueue: O(1)</span><span class="cx good">dequeue: O(1)</span><span class="cx good">front: O(1)</span>
    </div>
    <p><strong>활용:</strong> BFS 탐색, 작업 스케줄링, 프린터 큐, 이벤트 처리</p>
    ${codeBlock('<span class="kw">class</span> <span class="typ">Queue</span> {\n  <span class="fn">constructor</span>() { <span class="kw">this</span>.<span class="var">items</span> = {}; <span class="kw">this</span>.<span class="var">head</span> = <span class="num">0</span>; <span class="kw">this</span>.<span class="var">tail</span> = <span class="num">0</span>; }\n  <span class="fn">enqueue</span>(<span class="var">item</span>) { <span class="kw">this</span>.<span class="var">items</span>[<span class="kw">this</span>.<span class="var">tail</span>++] = <span class="var">item</span>; }\n  <span class="fn">dequeue</span>() {\n    <span class="kw">const</span> <span class="var">item</span> = <span class="kw">this</span>.<span class="var">items</span>[<span class="kw">this</span>.<span class="var">head</span>];\n    <span class="kw">delete</span> <span class="kw">this</span>.<span class="var">items</span>[<span class="kw">this</span>.<span class="var">head</span>++];\n    <span class="kw">return</span> <span class="var">item</span>;\n  }\n  <span class="fn">isEmpty</span>() { <span class="kw">return</span> <span class="kw">this</span>.<span class="var">head</span> === <span class="kw">this</span>.<span class="var">tail</span>; }\n}')}
  </div>

  <div class="topic-section">
    <h2>해시 테이블 (Hash Table)</h2>
    <p>키(Key)를 해시 함수로 인덱스로 변환하여 값을 저장. 평균 O(1) 접근.</p>
    <div class="ds-complexity">
      <span class="cx good">삽입(평균): O(1)</span><span class="cx good">탐색(평균): O(1)</span><span class="cx bad">최악: O(n)</span>
    </div>
    <p><strong>충돌 해결:</strong> Chaining (연결 리스트), Open Addressing (Linear/Quadratic Probing)</p>
    ${codeBlock('<span class="kw">class</span> <span class="typ">HashTable</span> {\n  <span class="fn">constructor</span>(<span class="var">size</span> = <span class="num">53</span>) { <span class="kw">this</span>.<span class="var">table</span> = <span class="kw">new</span> <span class="typ">Array</span>(<span class="var">size</span>); }\n  <span class="fn">_hash</span>(<span class="var">key</span>) {\n    <span class="kw">return</span> [...<span class="var">key</span>].<span class="fn">reduce</span>((<span class="var">acc</span>, <span class="var">c</span>, <span class="var">i</span>) =>\n      (<span class="var">acc</span> + <span class="var">c</span>.<span class="fn">charCodeAt</span>(<span class="num">0</span>) * (<span class="var">i</span>+<span class="num">1</span>)) % <span class="kw">this</span>.<span class="var">table</span>.<span class="var">length</span>, <span class="num">0</span>);\n  }\n  <span class="fn">set</span>(<span class="var">key</span>, <span class="var">val</span>) {\n    <span class="kw">const</span> <span class="var">idx</span> = <span class="kw">this</span>.<span class="fn">_hash</span>(<span class="var">key</span>);\n    <span class="kw">if</span> (!<span class="kw">this</span>.<span class="var">table</span>[<span class="var">idx</span>]) <span class="kw">this</span>.<span class="var">table</span>[<span class="var">idx</span>] = [];\n    <span class="kw">this</span>.<span class="var">table</span>[<span class="var">idx</span>].<span class="fn">push</span>([<span class="var">key</span>, <span class="var">val</span>]);\n  }\n  <span class="fn">get</span>(<span class="var">key</span>) {\n    <span class="kw">const</span> <span class="var">b</span> = <span class="kw">this</span>.<span class="var">table</span>[<span class="kw">this</span>.<span class="fn">_hash</span>(<span class="var">key</span>)];\n    <span class="kw">return</span> <span class="var">b</span>?.<span class="fn">find</span>(<span class="var">p</span> => <span class="var">p</span>[<span class="num">0</span>] === <span class="var">key</span>)?.[<span class="num">1</span>];\n  }\n}')}
  </div>

  <div class="topic-section">
    <h2>이진 탐색 트리 (BST)</h2>
    <p>왼쪽 자식 &lt; 부모 &lt; 오른쪽 자식. 탐색·삽입·삭제 평균 O(log n).</p>
    <div class="ds-complexity">
      <span class="cx ok">탐색(평균): O(log n)</span><span class="cx ok">삽입(평균): O(log n)</span><span class="cx bad">최악(편향): O(n)</span>
    </div>
    <p><strong>순회:</strong> 중위(Inorder, 오름차순) | 전위(Preorder) | 후위(Postorder)</p>
  </div>

  <div class="topic-section">
    <h2>그래프 (Graph)</h2>
    <div class="two-col">
      <div>
        <h4>인접 행렬 (Adjacency Matrix)</h4>
        <p>V×V 크기의 2D 배열. 간선 확인 O(1), 공간 O(V²)</p>
      </div>
      <div>
        <h4>인접 리스트 (Adjacency List)</h4>
        <p>각 정점의 이웃 리스트. 공간 O(V+E), 희소 그래프에 유리</p>
      </div>
    </div>
  </div>

  <div class="topic-section">
    <h2>힙 (Heap)</h2>
    <p>완전 이진 트리 기반. 최대힙: 부모 ≥ 자식. 최소힙: 부모 ≤ 자식.</p>
    <div class="ds-complexity">
      <span class="cx good">삽입: O(log n)</span><span class="cx good">최대/최소 조회: O(1)</span><span class="cx ok">삭제: O(log n)</span>
    </div>
    <p><strong>활용:</strong> 우선순위 큐, Dijkstra 알고리즘, Heap Sort, Top-K 문제</p>
    ${codeBlock('<span class="kw">class</span> <span class="typ">MinHeap</span> {\n  <span class="fn">constructor</span>() { <span class="kw">this</span>.<span class="var">heap</span> = []; }\n  <span class="fn">insert</span>(<span class="var">val</span>) {\n    <span class="kw">this</span>.<span class="var">heap</span>.<span class="fn">push</span>(<span class="var">val</span>);\n    <span class="kw">this</span>.<span class="fn">_bubbleUp</span>(<span class="kw">this</span>.<span class="var">heap</span>.<span class="var">length</span> - <span class="num">1</span>);\n  }\n  <span class="fn">_bubbleUp</span>(<span class="var">i</span>) {\n    <span class="kw">while</span> (<span class="var">i</span> > <span class="num">0</span>) {\n      <span class="kw">const</span> <span class="var">p</span> = Math.<span class="fn">floor</span>((<span class="var">i</span>-<span class="num">1</span>)/<span class="num">2</span>);\n      <span class="kw">if</span> (<span class="kw">this</span>.<span class="var">heap</span>[<span class="var">p</span>] &lt;= <span class="kw">this</span>.<span class="var">heap</span>[<span class="var">i</span>]) <span class="kw">break</span>;\n      [<span class="kw">this</span>.<span class="var">heap</span>[<span class="var">p</span>], <span class="kw">this</span>.<span class="var">heap</span>[<span class="var">i</span>]] = [<span class="kw">this</span>.<span class="var">heap</span>[<span class="var">i</span>], <span class="kw">this</span>.<span class="var">heap</span>[<span class="var">p</span>]];\n      <span class="var">i</span> = <span class="var">p</span>;\n    }\n  }\n}')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: ALGO / COMPLEXITY
   ============================================================= */
function viewComplexity() {
  return `
<div class="content-view">
  ${sectionTitle('📊', '시간 복잡도 & 공간 복잡도', 'Big-O 표기법과 알고리즘 효율성 분석')}
  <div class="topic-section">
    <h2>Big-O 표기법이란?</h2>
    <p>알고리즘의 <strong>최악의 경우(Worst Case)</strong> 실행 시간 또는 공간 사용량이 입력 크기 n에 따라 어떻게 증가하는지를 나타내는 점근 표기법입니다.</p>
    ${infoBox('핵심 규칙', '상수 무시: O(2n) → O(n) | 낮은 차수 무시: O(n² + n) → O(n²) | 최악 기준: 항상 가장 느린 경우를 기준으로 함')}
  </div>
  <div class="topic-section">
    <h2>복잡도 비교표</h2>
    <table class="compare-table">
      <thead><tr><th>표기법</th><th>이름</th><th>n=10</th><th>n=100</th><th>n=1000</th><th>예시</th></tr></thead>
      <tbody>
        <tr class="cx-row good"><td><strong>O(1)</strong></td><td>상수 시간</td><td>1</td><td>1</td><td>1</td><td>배열 인덱스 접근, 해시 조회</td></tr>
        <tr class="cx-row good"><td><strong>O(log n)</strong></td><td>로그 시간</td><td>3</td><td>7</td><td>10</td><td>이진 탐색, BST 연산</td></tr>
        <tr class="cx-row ok"><td><strong>O(n)</strong></td><td>선형 시간</td><td>10</td><td>100</td><td>1,000</td><td>선형 탐색, 배열 순회</td></tr>
        <tr class="cx-row ok"><td><strong>O(n log n)</strong></td><td>선형로그</td><td>33</td><td>664</td><td>9,966</td><td>병합 정렬, 힙 정렬</td></tr>
        <tr class="cx-row warn"><td><strong>O(n²)</strong></td><td>이차 시간</td><td>100</td><td>10,000</td><td>1,000,000</td><td>버블/선택/삽입 정렬</td></tr>
        <tr class="cx-row bad"><td><strong>O(2ⁿ)</strong></td><td>지수 시간</td><td>1,024</td><td>~10³⁰</td><td>∞</td><td>재귀 피보나치, 부분집합</td></tr>
        <tr class="cx-row bad"><td><strong>O(n!)</strong></td><td>팩토리얼</td><td>3,628,800</td><td>∞</td><td>∞</td><td>순열 생성, TSP 브루트포스</td></tr>
      </tbody>
    </table>
  </div>
  <div class="topic-section">
    <h2>복잡도 성장 곡선</h2>
    <div style="position:relative">
      <canvas id="complexityCanvas" width="700" height="300" style="max-width:100%"></canvas>
      <div class="chart-legend">
        <span style="color:#22c55e">O(1)</span> &nbsp;
        <span style="color:#84cc16">O(log n)</span> &nbsp;
        <span style="color:#3b82f6">O(n)</span> &nbsp;
        <span style="color:#f59e0b">O(n log n)</span> &nbsp;
        <span style="color:#f97316">O(n²)</span> &nbsp;
        <span style="color:#ef4444">O(2ⁿ)</span>
      </div>
    </div>
  </div>
  <div class="topic-section">
    <h2>공간 복잡도 (Space Complexity)</h2>
    <table class="compare-table">
      <thead><tr><th>알고리즘</th><th>공간 복잡도</th><th>이유</th></tr></thead>
      <tbody>
        <tr><td>Bubble/Selection/Insertion</td><td>O(1)</td><td>제자리(In-place) 정렬</td></tr>
        <tr><td>Merge Sort</td><td>O(n)</td><td>임시 배열 필요</td></tr>
        <tr><td>Quick Sort</td><td>O(log n)</td><td>재귀 호출 스택</td></tr>
        <tr><td>DFS (재귀)</td><td>O(h)</td><td>h = 트리 높이</td></tr>
        <tr><td>BFS</td><td>O(w)</td><td>w = 최대 너비</td></tr>
        <tr><td>DP (메모이제이션)</td><td>O(n) ~ O(n²)</td><td>캐시 테이블</td></tr>
      </tbody>
    </table>
  </div>
  <div class="topic-section">
    <h2>상각 분석 (Amortized Analysis)</h2>
    ${infoBox('예시: 동적 배열(Dynamic Array)', '배열이 꽉 찼을 때 2배 확장 후 복사. 대부분의 push는 O(1), 가끔 O(n) 복사 발생. 총 n번의 push에 대한 총 비용 = O(n). 따라서 연산당 평균 = O(1) (상각 분석 결과)')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: ALGO / DP
   ============================================================= */
function viewDP() {
  return `
<div class="content-view">
  ${sectionTitle('🧩', '동적 프로그래밍 (DP)', '복잡한 문제를 부분 문제로 나누어 효율적으로 해결')}

  <div class="topic-section">
    <h2>동적 프로그래밍이란?</h2>
    <p>큰 문제를 <strong>겹치는 부분 문제(Overlapping Subproblems)</strong>로 나누고, 각 부분 문제의 해를 저장하여 재사용함으로써 중복 계산을 제거하는 알고리즘 설계 기법입니다.</p>
    <div class="two-col">
      <div class="concept-card"><h4>DP 적용 조건</h4><ul><li><strong>최적 부분 구조</strong>: 전체 문제의 최적해가 부분 문제의 최적해로 구성</li><li><strong>겹치는 부분 문제</strong>: 동일한 부분 문제가 반복 등장</li></ul></div>
      <div class="concept-card"><h4>DP vs 분할 정복</h4><p>분할 정복(Merge Sort)은 부분 문제가 겹치지 않음. DP는 부분 문제가 겹쳐서 메모이제이션이 효과적.</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>메모이제이션 vs 타뷸레이션</h2>
    <div class="two-col">
      <div>
        <h4>메모이제이션 (Top-Down, 재귀)</h4>
        ${codeBlock('<span class="kw">const</span> <span class="var">memo</span> = {};\n<span class="kw">function</span> <span class="fn">fib</span>(<span class="var">n</span>) {\n  <span class="kw">if</span> (<span class="var">n</span> &lt;= <span class="num">1</span>) <span class="kw">return</span> <span class="var">n</span>;\n  <span class="kw">if</span> (<span class="var">memo</span>[<span class="var">n</span>] !== <span class="kw">undefined</span>) <span class="kw">return</span> <span class="var">memo</span>[<span class="var">n</span>];\n  <span class="kw">return</span> <span class="var">memo</span>[<span class="var">n</span>] = <span class="fn">fib</span>(<span class="var">n</span>-<span class="num">1</span>) + <span class="fn">fib</span>(<span class="var">n</span>-<span class="num">2</span>);\n}\n<span class="cmt">// O(n) 시간, O(n) 공간</span>')}
      </div>
      <div>
        <h4>타뷸레이션 (Bottom-Up, 반복)</h4>
        ${codeBlock('<span class="kw">function</span> <span class="fn">fib</span>(<span class="var">n</span>) {\n  <span class="kw">const</span> <span class="var">dp</span> = [<span class="num">0</span>, <span class="num">1</span>];\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> = <span class="num">2</span>; <span class="var">i</span> &lt;= <span class="var">n</span>; <span class="var">i</span>++)\n    <span class="var">dp</span>[<span class="var">i</span>] = <span class="var">dp</span>[<span class="var">i</span>-<span class="num">1</span>] + <span class="var">dp</span>[<span class="var">i</span>-<span class="num">2</span>];\n  <span class="kw">return</span> <span class="var">dp</span>[<span class="var">n</span>];\n}\n<span class="cmt">// O(n) 시간, O(n) 공간</span>')}
      </div>
    </div>
  </div>

  <div class="topic-section">
    <h2>피보나치 수열 — 재귀 vs DP</h2>
    ${codeBlock('<span class="cmt">// ❌ 순수 재귀: O(2ⁿ) — 지수 시간</span>\n<span class="kw">function</span> <span class="fn">fibNaive</span>(<span class="var">n</span>) {\n  <span class="kw">if</span> (<span class="var">n</span> &lt;= <span class="num">1</span>) <span class="kw">return</span> <span class="var">n</span>;\n  <span class="kw">return</span> <span class="fn">fibNaive</span>(<span class="var">n</span>-<span class="num">1</span>) + <span class="fn">fibNaive</span>(<span class="var">n</span>-<span class="num">2</span>); <span class="cmt">// 같은 값을 수백번 재계산</span>\n}\n<span class="cmt">// ✅ DP 공간 최적화: O(n) 시간, O(1) 공간</span>\n<span class="kw">function</span> <span class="fn">fibDP</span>(<span class="var">n</span>) {\n  <span class="kw">let</span> [<span class="var">a</span>, <span class="var">b</span>] = [<span class="num">0</span>, <span class="num">1</span>];\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> = <span class="num">2</span>; <span class="var">i</span> &lt;= <span class="var">n</span>; <span class="var">i</span>++) [<span class="var">a</span>, <span class="var">b</span>] = [<span class="var">b</span>, <span class="var">a</span> + <span class="var">b</span>];\n  <span class="kw">return</span> <span class="var">b</span>;\n}')}
  </div>

  <div class="topic-section">
    <h2>동전 교환 (Coin Change)</h2>
    ${codeBlock('<span class="kw">function</span> <span class="fn">coinChange</span>(<span class="var">coins</span>, <span class="var">amount</span>) {\n  <span class="kw">const</span> <span class="var">dp</span> = <span class="kw">new</span> <span class="typ">Array</span>(<span class="var">amount</span>+<span class="num">1</span>).<span class="fn">fill</span>(<span class="typ">Infinity</span>);\n  <span class="var">dp</span>[<span class="num">0</span>] = <span class="num">0</span>;\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> = <span class="num">1</span>; <span class="var">i</span> &lt;= <span class="var">amount</span>; <span class="var">i</span>++)\n    <span class="kw">for</span> (<span class="kw">const</span> <span class="var">c</span> <span class="kw">of</span> <span class="var">coins</span>)\n      <span class="kw">if</span> (<span class="var">c</span> &lt;= <span class="var">i</span>)\n        <span class="var">dp</span>[<span class="var">i</span>] = Math.<span class="fn">min</span>(<span class="var">dp</span>[<span class="var">i</span>], <span class="var">dp</span>[<span class="var">i</span>-<span class="var">c</span>] + <span class="num">1</span>);\n  <span class="kw">return</span> <span class="var">dp</span>[<span class="var">amount</span>] === <span class="typ">Infinity</span> ? -<span class="num">1</span> : <span class="var">dp</span>[<span class="var">amount</span>];\n}\n<span class="fn">coinChange</span>([<span class="num">1</span>,<span class="num">5</span>,<span class="num">10</span>,<span class="num">25</span>], <span class="num">36</span>); <span class="cmt">// → 3 (25+10+1)</span>\n<span class="cmt">// 시간: O(amount × coins), 공간: O(amount)</span>')}
  </div>

  <div class="topic-section">
    <h2>최장 공통 부분 수열 (LCS)</h2>
    ${codeBlock('<span class="kw">function</span> <span class="fn">lcs</span>(<span class="var">a</span>, <span class="var">b</span>) {\n  <span class="kw">const</span> [<span class="var">m</span>, <span class="var">n</span>] = [<span class="var">a</span>.<span class="var">length</span>, <span class="var">b</span>.<span class="var">length</span>];\n  <span class="kw">const</span> <span class="var">dp</span> = <span class="typ">Array</span>.<span class="fn">from</span>({<span class="var">length</span>:<span class="var">m</span>+<span class="num">1</span>}, () => <span class="kw">new</span> <span class="typ">Array</span>(<span class="var">n</span>+<span class="num">1</span>).<span class="fn">fill</span>(<span class="num">0</span>));\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span>=<span class="num">1</span>; <span class="var">i</span>&lt;=<span class="var">m</span>; <span class="var">i</span>++)\n    <span class="kw">for</span> (<span class="kw">let</span> <span class="var">j</span>=<span class="num">1</span>; <span class="var">j</span>&lt;=<span class="var">n</span>; <span class="var">j</span>++)\n      <span class="var">dp</span>[<span class="var">i</span>][<span class="var">j</span>] = <span class="var">a</span>[<span class="var">i</span>-<span class="num">1</span>] === <span class="var">b</span>[<span class="var">j</span>-<span class="num">1</span>]\n        ? <span class="var">dp</span>[<span class="var">i</span>-<span class="num">1</span>][<span class="var">j</span>-<span class="num">1</span>] + <span class="num">1</span>\n        : Math.<span class="fn">max</span>(<span class="var">dp</span>[<span class="var">i</span>-<span class="num">1</span>][<span class="var">j</span>], <span class="var">dp</span>[<span class="var">i</span>][<span class="var">j</span>-<span class="num">1</span>]);\n  <span class="kw">return</span> <span class="var">dp</span>[<span class="var">m</span>][<span class="var">n</span>];\n}\n<span class="fn">lcs</span>(<span class="str">"ABCBDAB"</span>, <span class="str">"BDCAB"</span>); <span class="cmt">// → 4</span>')}
  </div>

  <div class="topic-section">
    <h2>0/1 배낭 문제 (0/1 Knapsack)</h2>
    ${codeBlock('<span class="kw">function</span> <span class="fn">knapsack</span>(<span class="var">weights</span>, <span class="var">values</span>, <span class="var">W</span>) {\n  <span class="kw">const</span> <span class="var">n</span> = <span class="var">weights</span>.<span class="var">length</span>;\n  <span class="kw">const</span> <span class="var">dp</span> = <span class="typ">Array</span>.<span class="fn">from</span>({<span class="var">length</span>:<span class="var">n</span>+<span class="num">1</span>}, () => <span class="kw">new</span> <span class="typ">Array</span>(<span class="var">W</span>+<span class="num">1</span>).<span class="fn">fill</span>(<span class="num">0</span>));\n  <span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span>=<span class="num">1</span>; <span class="var">i</span>&lt;=<span class="var">n</span>; <span class="var">i</span>++)\n    <span class="kw">for</span> (<span class="kw">let</span> <span class="var">w</span>=<span class="num">0</span>; <span class="var">w</span>&lt;=<span class="var">W</span>; <span class="var">w</span>++) {\n      <span class="var">dp</span>[<span class="var">i</span>][<span class="var">w</span>] = <span class="var">dp</span>[<span class="var">i</span>-<span class="num">1</span>][<span class="var">w</span>];\n      <span class="kw">if</span> (<span class="var">weights</span>[<span class="var">i</span>-<span class="num">1</span>] &lt;= <span class="var">w</span>)\n        <span class="var">dp</span>[<span class="var">i</span>][<span class="var">w</span>] = Math.<span class="fn">max</span>(<span class="var">dp</span>[<span class="var">i</span>][<span class="var">w</span>],\n          <span class="var">dp</span>[<span class="var">i</span>-<span class="num">1</span>][<span class="var">w</span>-<span class="var">weights</span>[<span class="var">i</span>-<span class="num">1</span>]] + <span class="var">values</span>[<span class="var">i</span>-<span class="num">1</span>]);\n    }\n  <span class="kw">return</span> <span class="var">dp</span>[<span class="var">n</span>][<span class="var">W</span>];\n}\n<span class="cmt">// 시간: O(n×W), 공간: O(n×W)</span>')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: FE / BROWSER
   ============================================================= */
function viewBrowser() {
  return `
<div class="content-view">
  ${sectionTitle('🌏', '브라우저 동작 원리', '렌더링 파이프라인, 이벤트 루프, 성능 최적화')}

  <div class="topic-section">
    <h2>브라우저 렌더링 파이프라인</h2>
    <div class="pipeline-steps">
      <div class="pipe-step"><div class="pipe-icon">📄</div><strong>HTML 파싱</strong><small>HTML → DOM Tree</small></div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-step"><div class="pipe-icon">🎨</div><strong>CSS 파싱</strong><small>CSS → CSSOM</small></div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-step"><div class="pipe-icon">🌳</div><strong>Render Tree</strong><small>DOM + CSSOM 결합</small></div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-step"><div class="pipe-icon">📐</div><strong>Layout</strong><small>위치/크기 계산</small></div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-step"><div class="pipe-icon">🖌️</div><strong>Paint</strong><small>픽셀로 그리기</small></div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-step"><div class="pipe-icon">🔀</div><strong>Composite</strong><small>레이어 합성</small></div>
    </div>
    ${infoBox('Critical Rendering Path 최적화', 'CSS는 &lt;head&gt;에, JS는 &lt;body&gt; 끝 또는 defer/async 속성 사용 | 렌더 블로킹 리소스 최소화 | 미디어 쿼리로 불필요한 CSS 로딩 방지')}
  </div>

  <div class="topic-section">
    <h2>JavaScript 엔진 (V8)</h2>
    <div class="engine-flow">
      <div class="ef-step">소스 코드</div><div class="ef-arrow">→</div>
      <div class="ef-step">파서(Parser)<br><small>AST 생성</small></div><div class="ef-arrow">→</div>
      <div class="ef-step">Ignition<br><small>바이트코드 생성</small></div><div class="ef-arrow">→</div>
      <div class="ef-step">TurboFan<br><small>JIT 컴파일<br>(최적화 기계어)</small></div>
    </div>
    <p>V8은 <strong>JIT (Just-In-Time) 컴파일</strong> 방식을 사용. 자주 실행되는 "Hot" 코드를 감지하여 최적화된 기계어로 컴파일합니다.</p>
  </div>

  <div class="topic-section">
    <h2>이벤트 루프 (Event Loop)</h2>
    <div class="event-loop-diagram">
      <div class="el-box call-stack"><h4>Call Stack</h4><div class="el-item">함수 실행 공간</div><div class="el-item">LIFO 구조</div><small>동기 코드 실행</small></div>
      <div class="el-middle">
        <div class="el-box web-apis"><h4>Web APIs</h4><div class="el-item">setTimeout</div><div class="el-item">fetch</div><div class="el-item">DOM Events</div></div>
        <div class="el-loop-icon">🔄<br><small>Event Loop</small></div>
      </div>
      <div class="el-queues">
        <div class="el-box microtask"><h4>Microtask Queue</h4><small>Promise.then, queueMicrotask<br>★ 우선순위 높음</small></div>
        <div class="el-box macrotask"><h4>Macrotask Queue</h4><small>setTimeout, setInterval<br>DOM 이벤트 콜백</small></div>
      </div>
    </div>
    ${codeBlock('<span class="fn">console</span>.<span class="fn">log</span>(<span class="str">\'1\'</span>);                          <span class="cmt">// 동기 → 즉시</span>\n<span class="fn">setTimeout</span>(() => <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">\'2\'</span>), <span class="num">0</span>); <span class="cmt">// Macrotask</span>\n<span class="typ">Promise</span>.<span class="fn">resolve</span>().<span class="fn">then</span>(() =>\n  <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">\'3\'</span>)                       <span class="cmt">// Microtask</span>\n);\n<span class="fn">console</span>.<span class="fn">log</span>(<span class="str">\'4\'</span>);                          <span class="cmt">// 동기 → 즉시</span>\n<span class="cmt">// 출력 순서: 1 → 4 → 3 → 2</span>\n<span class="cmt">// 동기 → Microtask → Macrotask 순서!</span>')}
  </div>

  <div class="topic-section">
    <h2>Reflow vs Repaint</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>Reflow (Layout)</th><th>Repaint (Paint)</th></tr></thead>
      <tbody>
        <tr><td>발생 원인</td><td>요소 크기/위치 변경</td><td>색상, 배경, 외곽선 변경</td></tr>
        <tr><td>비용</td><td>매우 높음 (전체 레이아웃 재계산)</td><td>중간 (픽셀 재렌더링)</td></tr>
        <tr><td>예시 속성</td><td>width, height, margin, padding</td><td>color, background, border-color</td></tr>
        <tr><td>최적화</td><td>transform 사용, 일괄 DOM 수정</td><td>opacity/transform으로 GPU 처리</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>Core Web Vitals</h2>
    <div class="cwv-grid">
      <div class="cwv-card good"><h4>LCP</h4><p><strong>Largest Contentful Paint</strong></p><p>가장 큰 콘텐츠 요소가 렌더링되는 시간</p><p>✅ Good: &lt; 2.5s</p></div>
      <div class="cwv-card warn"><h4>INP</h4><p><strong>Interaction to Next Paint</strong></p><p>사용자 입력에 대한 응답 속도</p><p>✅ Good: &lt; 200ms</p></div>
      <div class="cwv-card ok"><h4>CLS</h4><p><strong>Cumulative Layout Shift</strong></p><p>예상치 못한 레이아웃 변화 정도</p><p>✅ Good: &lt; 0.1</p></div>
    </div>
  </div>
</div>`;
}

/* =============================================================
   VIEW: FE / JAVASCRIPT
   ============================================================= */
function viewJavaScript() {
  return `
<div class="content-view">
  ${sectionTitle('⚡', 'JavaScript 심화', '실행 컨텍스트, 클로저, 프로토타입, 비동기 처리')}

  <div class="topic-section">
    <h2>실행 컨텍스트 (Execution Context)</h2>
    <p>JavaScript 코드가 실행되는 환경. 코드 평가 시 생성되며 Variable Environment, Lexical Environment, this 바인딩을 포함합니다.</p>
    ${codeBlock('<span class="kw">let</span> <span class="var">x</span> = <span class="num">10</span>; <span class="cmt">// 전역 실행 컨텍스트</span>\n<span class="kw">function</span> <span class="fn">outer</span>() {\n  <span class="kw">let</span> <span class="var">y</span> = <span class="num">20</span>; <span class="cmt">// outer EC</span>\n  <span class="kw">function</span> <span class="fn">inner</span>() {\n    <span class="kw">let</span> <span class="var">z</span> = <span class="num">30</span>; <span class="cmt">// inner EC</span>\n    <span class="fn">console</span>.<span class="fn">log</span>(<span class="var">x</span> + <span class="var">y</span> + <span class="var">z</span>); <span class="cmt">// 스코프 체인으로 접근</span>\n  }\n  <span class="fn">inner</span>();\n}\n<span class="cmt">// 콜 스택: [전역 EC] → [outer EC] → [inner EC]</span>')}
  </div>

  <div class="topic-section">
    <h2>클로저 (Closure)</h2>
    <p>함수가 <strong>자신이 정의된 렉시컬 스코프를 기억</strong>하는 특성. 외부 함수 종료 후에도 외부 변수에 접근 가능.</p>
    ${codeBlock('<span class="kw">function</span> <span class="fn">makeCounter</span>(<span class="var">start</span> = <span class="num">0</span>) {\n  <span class="kw">let</span> <span class="var">count</span> = <span class="var">start</span>; <span class="cmt">// 클로저로 캡처될 변수</span>\n  <span class="kw">return</span> {\n    <span class="fn">increment</span>: () => ++<span class="var">count</span>,\n    <span class="fn">decrement</span>: () => --<span class="var">count</span>,\n    <span class="fn">getCount</span>:  () => <span class="var">count</span>,\n    <span class="fn">reset</span>:     () => { <span class="var">count</span> = <span class="var">start</span>; },\n  };\n}\n<span class="kw">const</span> <span class="var">c</span> = <span class="fn">makeCounter</span>(<span class="num">10</span>);\n<span class="var">c</span>.<span class="fn">increment</span>(); <span class="cmt">// 11</span>\n<span class="var">c</span>.<span class="fn">increment</span>(); <span class="cmt">// 12</span>\n<span class="var">c</span>.<span class="fn">getCount</span>();  <span class="cmt">// 12 — count에 직접 접근 불가, 캡슐화!</span>')}
  </div>

  <div class="topic-section">
    <h2>프로토타입 체인 (Prototype Chain)</h2>
    ${codeBlock('<span class="kw">const</span> <span class="var">animal</span> = { <span class="fn">breathe</span>() { <span class="kw">return</span> <span class="str">\'호흡 중\'</span>; } };\n<span class="kw">const</span> <span class="var">dog</span> = <span class="typ">Object</span>.<span class="fn">create</span>(<span class="var">animal</span>); <span class="cmt">// dog.__proto__ === animal</span>\n<span class="var">dog</span>.<span class="fn">bark</span> = () => <span class="str">\'멍멍\'</span>;\n<span class="var">dog</span>.<span class="fn">bark</span>();    <span class="cmt">// dog 자체에서 찾음</span>\n<span class="var">dog</span>.<span class="fn">breathe</span>(); <span class="cmt">// [[Prototype]] 체인으로 animal에서 찾음</span>\n<span class="cmt">// 체인: dog → animal → Object.prototype → null</span>\n\n<span class="kw">class</span> <span class="typ">Animal</span> {\n  <span class="fn">constructor</span>(<span class="var">name</span>) { <span class="kw">this</span>.<span class="var">name</span> = <span class="var">name</span>; }\n  <span class="fn">speak</span>() { <span class="kw">return</span> `${<span class="kw">this</span>.<span class="var">name</span>} 소리를 냄`; }\n}\n<span class="kw">class</span> <span class="typ">Dog</span> <span class="kw">extends</span> <span class="typ">Animal</span> {\n  <span class="fn">bark</span>() { <span class="kw">return</span> <span class="str">\'멍멍!\'</span>; }\n}')}
  </div>

  <div class="topic-section">
    <h2>비동기 처리 진화</h2>
    <div class="async-evolution">
      <div class="async-stage">
        <h4>1. Callback</h4>
        ${codeBlock('<span class="fn">readFile</span>(<span class="str">\'a.txt\'</span>, (<span class="var">err</span>, <span class="var">data</span>) => {\n  <span class="fn">readFile</span>(<span class="str">\'b.txt\'</span>, (<span class="var">e2</span>, <span class="var">d2</span>) => {\n    <span class="cmt">// Callback Hell ☠️</span>\n  });\n});')}
      </div>
      <div class="async-stage">
        <h4>2. Promise</h4>
        ${codeBlock('<span class="fn">readFile</span>(<span class="str">\'a.txt\'</span>)\n  .<span class="fn">then</span>(<span class="var">d</span> => <span class="fn">readFile</span>(<span class="str">\'b.txt\'</span>))\n  .<span class="fn">then</span>(<span class="fn">process</span>)\n  .<span class="fn">catch</span>(<span class="fn">handleError</span>);')}
      </div>
      <div class="async-stage">
        <h4>3. async/await</h4>
        ${codeBlock('<span class="kw">async function</span> <span class="fn">main</span>() {\n  <span class="kw">try</span> {\n    <span class="kw">const</span> <span class="var">a</span> = <span class="kw">await</span> <span class="fn">readFile</span>(<span class="str">\'a.txt\'</span>);\n    <span class="kw">const</span> <span class="var">b</span> = <span class="kw">await</span> <span class="fn">readFile</span>(<span class="str">\'b.txt\'</span>);\n    <span class="kw">return</span> <span class="fn">process</span>(<span class="var">a</span>, <span class="var">b</span>);\n  } <span class="kw">catch</span> (<span class="var">err</span>) { <span class="fn">handleError</span>(<span class="var">err</span>); }\n}')}
      </div>
    </div>
  </div>

  <div class="topic-section">
    <h2>이벤트 버블링 &amp; 캡처링</h2>
    ${codeBlock('<span class="cmt">// 이벤트 전파 3단계: Capture → Target → Bubble</span>\n<span class="var">child</span>.<span class="fn">addEventListener</span>(<span class="str">\'click\'</span>, <span class="var">handler</span>);        <span class="cmt">// 버블링(기본)</span>\n<span class="var">parent</span>.<span class="fn">addEventListener</span>(<span class="str">\'click\'</span>, <span class="var">handler</span>, <span class="kw">true</span>); <span class="cmt">// 캡처링</span>\n\n<span class="cmt">// 이벤트 위임 (Event Delegation)</span>\n<span class="var">ul</span>.<span class="fn">addEventListener</span>(<span class="str">\'click\'</span>, (<span class="var">e</span>) => {\n  <span class="kw">if</span> (<span class="var">e</span>.<span class="var">target</span>.<span class="fn">matches</span>(<span class="str">\'li\'</span>)) <span class="fn">handleItem</span>(<span class="var">e</span>.<span class="var">target</span>);\n});\n<span class="var">e</span>.<span class="fn">stopPropagation</span>();  <span class="cmt">// 전파 중단</span>\n<span class="var">e</span>.<span class="fn">preventDefault</span>();  <span class="cmt">// 기본 동작 중단</span>')}
  </div>

  <div class="topic-section">
    <h2>this 바인딩 규칙</h2>
    ${codeBlock('<span class="cmt">// 1. 기본 바인딩</span>\n<span class="kw">function</span> <span class="fn">foo</span>() { <span class="fn">console</span>.<span class="fn">log</span>(<span class="kw">this</span>); } <span class="cmt">// window / undefined</span>\n<span class="cmt">// 2. 암시적 바인딩 — 메서드 호출</span>\n<span class="kw">const</span> <span class="var">obj</span> = { <span class="var">name</span>: <span class="str">\'홍\'</span>, <span class="fn">greet</span>() { <span class="kw">return</span> <span class="kw">this</span>.<span class="var">name</span>; } };\n<span class="cmt">// 3. 명시적 바인딩</span>\n<span class="fn">foo</span>.<span class="fn">call</span>(<span class="var">obj</span>);         <span class="cmt">// 즉시 호출, this=obj</span>\n<span class="fn">foo</span>.<span class="fn">apply</span>(<span class="var">obj</span>, [<span class="num">1</span>,<span class="num">2</span>]);  <span class="cmt">// 즉시 호출, 인자 배열</span>\n<span class="kw">const</span> <span class="var">bound</span> = <span class="fn">foo</span>.<span class="fn">bind</span>(<span class="var">obj</span>); <span class="cmt">// 새 함수 반환</span>\n<span class="cmt">// 4. 화살표 함수 — 렉시컬 스코프의 this 상속</span>\n<span class="kw">const</span> <span class="var">t</span> = {\n  <span class="var">count</span>: <span class="num">0</span>,\n  <span class="fn">start</span>() {\n    <span class="fn">setInterval</span>(() => <span class="kw">this</span>.<span class="var">count</span>++, <span class="num">1000</span>); <span class="cmt">// this === t ✅</span>\n  }\n};')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: FE / CSS LAYOUT
   ============================================================= */
function viewCSSLayout() {
  return `
<div class="content-view">
  ${sectionTitle('🎨', 'CSS & 레이아웃', '박스 모델, Flexbox, Grid, 반응형 디자인')}

  <div class="topic-section">
    <h2>박스 모델 (Box Model)</h2>
    <div class="box-model-diagram">
      <div class="bm-margin"><span class="bm-label">Margin</span>
        <div class="bm-border"><span class="bm-label">Border</span>
          <div class="bm-padding"><span class="bm-label">Padding</span>
            <div class="bm-content">Content<br><small>width × height</small></div>
          </div>
        </div>
      </div>
    </div>
    ${codeBlock('<span class="cmt">/* box-sizing: content-box (기본) — width = content만 */</span>\n.<span class="var">box</span> { <span class="var">width</span>: <span class="num">200px</span>; <span class="var">padding</span>: <span class="num">20px</span>; } <span class="cmt">/* 실제 너비: 240px */</span>\n\n<span class="cmt">/* box-sizing: border-box (권장) — width = content+padding+border */</span>\n* { <span class="var">box-sizing</span>: <span class="var">border-box</span>; } <span class="cmt">/* 실제 너비: 200px */</span>')}
  </div>

  <div class="topic-section">
    <h2>Flexbox</h2>
    <div class="two-col">
      <div>
        <h4>컨테이너 속성</h4>
        <table class="compare-table">
          <thead><tr><th>속성</th><th>값</th></tr></thead>
          <tbody>
            <tr><td>display</td><td>flex | inline-flex</td></tr>
            <tr><td>flex-direction</td><td>row | column | row-reverse | column-reverse</td></tr>
            <tr><td>justify-content</td><td>flex-start | center | flex-end | space-between | space-around</td></tr>
            <tr><td>align-items</td><td>stretch | flex-start | center | flex-end | baseline</td></tr>
            <tr><td>flex-wrap</td><td>nowrap | wrap | wrap-reverse</td></tr>
            <tr><td>gap</td><td>10px (행/열 간격)</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h4>아이템 속성</h4>
        <table class="compare-table">
          <thead><tr><th>속성</th><th>의미</th></tr></thead>
          <tbody>
            <tr><td>flex-grow</td><td>남은 공간 분배 비율</td></tr>
            <tr><td>flex-shrink</td><td>공간 부족 시 줄어드는 비율</td></tr>
            <tr><td>flex-basis</td><td>기본 크기</td></tr>
            <tr><td>flex: 1</td><td>flex: 1 1 0 단축 속성</td></tr>
            <tr><td>align-self</td><td>개별 아이템 정렬</td></tr>
            <tr><td>order</td><td>표시 순서 변경</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    ${codeBlock('<span class="cmt">/* 자주 쓰는 Flexbox 패턴 */</span>\n.<span class="var">center</span>   { <span class="var">display</span>: <span class="var">flex</span>; <span class="var">justify-content</span>: <span class="var">center</span>; <span class="var">align-items</span>: <span class="var">center</span>; }\n.<span class="var">nav</span>      { <span class="var">display</span>: <span class="var">flex</span>; <span class="var">justify-content</span>: <span class="var">space-between</span>; }\n.<span class="var">sidebar</span>  { <span class="var">display</span>: <span class="var">flex</span>; <span class="var">gap</span>: <span class="num">1rem</span>; }\n.<span class="var">sidebar</span> > .<span class="var">main</span>  { <span class="var">flex</span>: <span class="num">1</span>; } <span class="cmt">/* 남은 공간 차지 */</span>\n.<span class="var">sidebar</span> > .<span class="var">aside</span> { <span class="var">width</span>: <span class="num">280px</span>; <span class="var">flex-shrink</span>: <span class="num">0</span>; }')}
  </div>

  <div class="topic-section">
    <h2>CSS Grid</h2>
    ${codeBlock('<span class="cmt">/* 기본 Grid 설정 */</span>\n.<span class="var">grid</span> {\n  <span class="var">display</span>: <span class="var">grid</span>;\n  <span class="var">grid-template-columns</span>: <span class="num">1fr</span> <span class="num">2fr</span> <span class="num">1fr</span>; <span class="cmt">/* 1:2:1 비율 3열 */</span>\n  <span class="var">gap</span>: <span class="num">1rem</span>;\n}\n<span class="cmt">/* 반응형 그리드 */</span>\n.<span class="var">cards</span> {\n  <span class="var">display</span>: <span class="var">grid</span>;\n  <span class="var">grid-template-columns</span>: <span class="fn">repeat</span>(<span class="var">auto-fit</span>, <span class="fn">minmax</span>(<span class="num">250px</span>, <span class="num">1fr</span>));\n}\n<span class="cmt">/* 그리드 아이템 배치 */</span>\n.<span class="var">header</span> { <span class="var">grid-column</span>: <span class="num">1</span> / -<span class="num">1</span>; } <span class="cmt">/* 전체 너비 */</span>\n.<span class="var">feature</span>{ <span class="var">grid-area</span>: <span class="num">2</span> / <span class="num">1</span> / <span class="num">4</span> / <span class="num">3</span>; } <span class="cmt">/* row/col start/end */</span>')}
  </div>

  <div class="topic-section">
    <h2>Position 속성</h2>
    <table class="compare-table">
      <thead><tr><th>값</th><th>설명</th><th>특징</th></tr></thead>
      <tbody>
        <tr><td>static</td><td>기본값. 일반적인 문서 흐름</td><td>top/left 등 무효</td></tr>
        <tr><td>relative</td><td>자신의 원래 위치 기준으로 이동</td><td>공간은 그대로 유지</td></tr>
        <tr><td>absolute</td><td>가장 가까운 positioned 조상 기준</td><td>문서 흐름에서 제거</td></tr>
        <tr><td>fixed</td><td>뷰포트(viewport) 기준</td><td>스크롤해도 고정</td></tr>
        <tr><td>sticky</td><td>스크롤 위치에 따라 relative ↔ fixed</td><td>헤더/사이드바에 유용</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>반응형 디자인 &amp; CSS 변수</h2>
    ${codeBlock('<span class="cmt">/* CSS 변수 (Custom Properties) */</span>\n:<span class="var">root</span> {\n  --<span class="var">color-primary</span>: <span class="num">#6366f1</span>;\n  --<span class="var">spacing-md</span>: <span class="num">1rem</span>;\n  --<span class="var">border-radius</span>: <span class="num">8px</span>;\n}\n.<span class="var">btn</span> { <span class="var">background</span>: <span class="fn">var</span>(--<span class="var">color-primary</span>); }\n\n<span class="cmt">/* Mobile First 미디어 쿼리 */</span>\n.<span class="var">container</span> { <span class="var">width</span>: <span class="num">100%</span>; } <span class="cmt">/* 모바일 기본 */</span>\n@<span class="kw">media</span> (<span class="var">min-width</span>: <span class="num">768px</span>)  { .<span class="var">container</span> { <span class="var">max-width</span>: <span class="num">768px</span>;  } }\n@<span class="kw">media</span> (<span class="var">min-width</span>: <span class="num">1024px</span>) { .<span class="var">container</span> { <span class="var">max-width</span>: <span class="num">1024px</span>; } }\n@<span class="kw">media</span> (<span class="var">min-width</span>: <span class="num">1280px</span>) { .<span class="var">container</span> { <span class="var">max-width</span>: <span class="num">1280px</span>; } }')}
    ${infoBox('CSS 특이성(Specificity) 계산', 'inline style(1000) > id(100) > class/pseudo-class(10) > tag(1) | !important는 특이성을 무시하므로 최소화 권장')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: FE / PLAYGROUND
   ============================================================= */
function viewPlayground() {
  return `
<div class="content-view">
  ${sectionTitle('🖥️', '코드 실습 플레이그라운드', '브라우저에서 바로 JavaScript를 실행해보세요')}
  <div class="topic-section">
    <p>아래 에디터에 JavaScript 코드를 입력하고 <strong>실행</strong> 버튼을 눌러 결과를 확인하세요. <kbd>Ctrl+Enter</kbd>로도 실행할 수 있습니다.</p>
  </div>
  <div class="playground-wrap">
    <div class="pg-header">
      <div class="pg-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
      <select id="exampleSelect" class="pg-example-select">
        <option value="eventloop">이벤트 루프 데모</option>
        <option value="closure">클로저 예제</option>
        <option value="prototype">프로토타입 체인</option>
        <option value="promise">Promise 체인</option>
        <option value="dom">DOM 조작 시뮬레이션</option>
      </select>
      <button class="pg-run-btn" id="pgRunBtn">▶ 실행</button>
      <button class="pg-clear-btn" id="pgClearBtn">🗑 지우기</button>
    </div>
    <textarea class="code-editor" id="pgEditor" spellcheck="false" rows="18"></textarea>
    <div class="pg-console">
      <div class="pg-console-header">콘솔 출력</div>
      <div class="pg-output" id="pgOutput"></div>
    </div>
  </div>
  <div class="topic-section">
    <h2>사용 방법</h2>
    <ul>
      <li><strong>예제 선택</strong>: 드롭다운에서 미리 준비된 예제를 선택하면 에디터에 코드가 로드됩니다.</li>
      <li><strong>직접 작성</strong>: 에디터에 JavaScript 코드를 직접 입력할 수 있습니다.</li>
      <li><strong>실행</strong>: <code>▶ 실행</code> 버튼 또는 <kbd>Ctrl+Enter</kbd>로 코드를 실행합니다.</li>
      <li><strong>Tab 키</strong>: 들여쓰기(2 spaces)가 삽입됩니다.</li>
    </ul>
    ${infoBox('주의사항', '코드는 브라우저 sandbox 환경에서 실행됩니다. 무한 루프는 페이지를 멈출 수 있으니 주의하세요. setTimeout/Promise 등 비동기 코드도 실행 가능합니다.', 'warning')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: BE / HTTP
   ============================================================= */
function viewHTTP() {
  return `
<div class="content-view">
  ${sectionTitle('🌐', 'HTTP & REST API', 'HTTP 프로토콜 기초부터 REST API 설계까지')}

  <div class="topic-section">
    <h2>HTTP 프로토콜 기초</h2>
    <p>HTTP는 <strong>무상태(Stateless)</strong> 프로토콜로, 각 요청은 독립적이며 이전 요청 상태를 기억하지 않습니다.</p>
    <div class="request-response">
      <div class="rr-box request">
        <h4>HTTP Request</h4>
        ${codeBlock('GET /api/users/123 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJhbG...\nAccept: application/json')}
      </div>
      <div class="rr-arrow">→<br><small>응답</small></div>
      <div class="rr-box response">
        <h4>HTTP Response</h4>
        ${codeBlock('HTTP/1.1 200 OK\nContent-Type: application/json\n\n{ "id": 123, "name": "홍길동" }')}
      </div>
    </div>
  </div>

  <div class="topic-section">
    <h2>REST API 설계 원칙</h2>
    <div class="rest-principles">
      <div class="rp-card"><strong>자원 중심 URL</strong><br><small>명사 사용: /users, /products</small></div>
      <div class="rp-card"><strong>HTTP 메서드로 동작 표현</strong><br><small>GET(조회), POST(생성), PUT(수정), DELETE(삭제)</small></div>
      <div class="rp-card"><strong>Stateless</strong><br><small>요청에 필요한 모든 정보를 포함</small></div>
      <div class="rp-card"><strong>Cacheable</strong><br><small>응답에 캐시 가능 여부 명시</small></div>
      <div class="rp-card"><strong>Uniform Interface</strong><br><small>일관된 인터페이스</small></div>
      <div class="rp-card"><strong>Layered System</strong><br><small>클라이언트는 중간 레이어 인식 불필요</small></div>
    </div>
    <h4>User API 설계 예시</h4>
    <table class="compare-table">
      <thead><tr><th>메서드</th><th>URL</th><th>동작</th><th>응답 코드</th></tr></thead>
      <tbody>
        <tr><td>GET</td><td>/users</td><td>전체 사용자 목록</td><td>200</td></tr>
        <tr><td>GET</td><td>/users/:id</td><td>특정 사용자 조회</td><td>200 / 404</td></tr>
        <tr><td>POST</td><td>/users</td><td>사용자 생성</td><td>201</td></tr>
        <tr><td>PUT</td><td>/users/:id</td><td>사용자 전체 수정</td><td>200</td></tr>
        <tr><td>PATCH</td><td>/users/:id</td><td>사용자 부분 수정</td><td>200</td></tr>
        <tr><td>DELETE</td><td>/users/:id</td><td>사용자 삭제</td><td>204</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>HTTP 상태 코드</h2>
    <div class="two-col">
      <table class="compare-table">
        <thead><tr><th>2xx 성공</th><th>의미</th></tr></thead>
        <tbody>
          <tr><td>200 OK</td><td>요청 성공</td></tr>
          <tr><td>201 Created</td><td>생성 성공</td></tr>
          <tr><td>204 No Content</td><td>성공 (응답 본문 없음)</td></tr>
        </tbody>
      </table>
      <table class="compare-table">
        <thead><tr><th>4xx/5xx 오류</th><th>의미</th></tr></thead>
        <tbody>
          <tr><td>400 Bad Request</td><td>잘못된 요청</td></tr>
          <tr><td>401 Unauthorized</td><td>인증 필요</td></tr>
          <tr><td>403 Forbidden</td><td>권한 없음</td></tr>
          <tr><td>404 Not Found</td><td>리소스 없음</td></tr>
          <tr><td>500 Internal Error</td><td>서버 오류</td></tr>
          <tr><td>503 Service Unavailable</td><td>서비스 불가</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="topic-section">
    <h2>HTTP/2 vs HTTP/3</h2>
    <div class="two-col">
      <div class="concept-card"><h4>HTTP/2 (2015)</h4><ul><li><strong>멀티플렉싱</strong>: 하나의 TCP 연결로 여러 요청 병렬 처리</li><li><strong>헤더 압축</strong>: HPACK 방식</li><li><strong>서버 푸시</strong>: 요청 없이 서버가 먼저 리소스 전송</li></ul></div>
      <div class="concept-card"><h4>HTTP/3 (2022)</h4><ul><li><strong>QUIC 프로토콜</strong>: TCP 대신 UDP 기반</li><li><strong>0-RTT 연결</strong>: 연결 설정 최소화</li><li><strong>HOL 블로킹 해결</strong>: 스트림별 독립 오류 복구</li></ul></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>CORS (Cross-Origin Resource Sharing)</h2>
    ${codeBlock('<span class="cmt">// CORS 허용 응답 헤더</span>\nAccess-Control-Allow-Origin: https://myapp.com\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\nAccess-Control-Allow-Headers: Content-Type, Authorization\nAccess-Control-Allow-Credentials: <span class="kw">true</span>\n\n<span class="cmt">// Preflight Request (OPTIONS) — 실제 요청 전 브라우저 자동 전송</span>\nOPTIONS /api/data HTTP/1.1\nOrigin: https://myapp.com\nAccess-Control-Request-Method: POST')}
  </div>
</div>`;
}

/* =============================================================
   VIEW: BE / AUTH
   ============================================================= */
function viewAuth() {
  return `
<div class="content-view">
  ${sectionTitle('🔐', '인증 & 보안', 'JWT, OAuth, 비밀번호 해싱, 보안 위협 방어')}

  <div class="topic-section">
    <h2>인증(Authentication) vs 인가(Authorization)</h2>
    <div class="two-col">
      <div class="concept-card"><h4>인증 (Authentication) — "누구냐?"</h4><p>사용자의 신원을 확인하는 과정. 아이디/비밀번호, 생체인식, OTP 등</p></div>
      <div class="concept-card"><h4>인가 (Authorization) — "무엇을 할 수 있냐?"</h4><p>인증된 사용자가 특정 리소스에 접근할 권한이 있는지 확인. RBAC, ABAC 등</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>Session vs Token 기반 인증</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>세션 기반</th><th>토큰 기반 (JWT)</th></tr></thead>
      <tbody>
        <tr><td>저장 위치</td><td>서버 메모리/DB</td><td>클라이언트 (localStorage, cookie)</td></tr>
        <tr><td>확장성</td><td>낮음 (세션 공유 필요)</td><td>높음 (Stateless)</td></tr>
        <tr><td>보안</td><td>서버에서 즉시 무효화 가능</td><td>만료 전까지 무효화 어려움</td></tr>
        <tr><td>성능</td><td>DB 조회 필요</td><td>토큰 자체에 정보 포함</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>JWT (JSON Web Token)</h2>
    ${codeBlock('<span class="cmt">// Header.Payload.Signature 구조</span>\n<span class="cmt">// Header: 알고리즘 &amp; 타입</span>\n{ <span class="str">"alg"</span>: <span class="str">"HS256"</span>, <span class="str">"typ"</span>: <span class="str">"JWT"</span> }\n\n<span class="cmt">// Payload: Claims (사용자 정보) — 암호화 아님! 누구나 디코딩 가능</span>\n{\n  <span class="str">"sub"</span>: <span class="str">"user123"</span>,\n  <span class="str">"name"</span>: <span class="str">"홍길동"</span>,\n  <span class="str">"role"</span>: <span class="str">"admin"</span>,\n  <span class="str">"iat"</span>: <span class="num">1700000000</span>,  <span class="cmt">// Issued At</span>\n  <span class="str">"exp"</span>: <span class="num">1700086400</span>   <span class="cmt">// Expires (24시간 후)</span>\n}\n\n<span class="cmt">// Signature: HMACSHA256(base64(header)+"."+base64(payload), secret)</span>')}
    ${infoBox('JWT 보안 주의사항', 'payload는 암호화되지 않음 — 민감한 정보(비밀번호) 절대 포함 금지 | Access Token 유효기간을 짧게(15분~1시간), Refresh Token을 별도 관리 | httpOnly cookie로 저장하면 XSS 방어', 'warning')}
  </div>

  <div class="topic-section">
    <h2>OAuth 2.0 흐름 (Authorization Code)</h2>
    <div class="oauth-flow">
      <div class="of-step"><span class="step-badge">1</span>사용자가 "Google로 로그인" 클릭</div>
      <div class="of-arrow">↓</div>
      <div class="of-step"><span class="step-badge">2</span>Authorization Code 요청 (redirect_uri 포함)</div>
      <div class="of-arrow">↓</div>
      <div class="of-step"><span class="step-badge">3</span>구글 로그인 &amp; 권한 동의</div>
      <div class="of-arrow">↓</div>
      <div class="of-step"><span class="step-badge">4</span>Authorization Code 발급 (redirect_uri로 전달)</div>
      <div class="of-arrow">↓</div>
      <div class="of-step"><span class="step-badge">5</span>서버에서 Code + Client Secret으로 Access Token 교환</div>
      <div class="of-arrow">↓</div>
      <div class="of-step"><span class="step-badge">6</span>Access Token으로 Google API 호출</div>
    </div>
  </div>

  <div class="topic-section">
    <h2>비밀번호 해싱 (bcrypt)</h2>
    ${codeBlock('<span class="cmt">// ❌ 절대 하면 안 되는 것들</span>\n<span class="var">db</span>.<span class="fn">save</span>({ <span class="var">password</span>: <span class="str">\'mypassword\'</span> });      <span class="cmt">// 평문 저장</span>\n<span class="var">db</span>.<span class="fn">save</span>({ <span class="var">password</span>: <span class="fn">md5</span>(<span class="str">\'mypassword\'</span>) }); <span class="cmt">// MD5: Rainbow table 취약</span>\n\n<span class="cmt">// ✅ bcrypt + Salt 사용</span>\n<span class="kw">const</span> <span class="var">SALT_ROUNDS</span> = <span class="num">12</span>;\n<span class="kw">const</span> <span class="var">hashedPw</span> = <span class="kw">await</span> <span class="var">bcrypt</span>.<span class="fn">hash</span>(<span class="var">plainPw</span>, <span class="var">SALT_ROUNDS</span>);\n<span class="kw">const</span> <span class="var">isMatch</span>  = <span class="kw">await</span> <span class="var">bcrypt</span>.<span class="fn">compare</span>(<span class="var">plainPw</span>, <span class="var">hashedPw</span>);\n<span class="cmt">// Salt는 자동으로 해시 결과에 포함됨</span>')}
  </div>

  <div class="topic-section">
    <h2>주요 보안 위협 &amp; 방어</h2>
    <div class="security-grid">
      <div class="sec-card"><h4>XSS (Cross-Site Scripting)</h4><p>공격자의 스크립트가 사용자 브라우저에서 실행</p><p class="defense">✅ 방어: 입력값 이스케이프, CSP 헤더, DOMPurify, httpOnly cookie</p></div>
      <div class="sec-card"><h4>CSRF (Cross-Site Request Forgery)</h4><p>사용자 인증 정보를 이용한 위조 요청</p><p class="defense">✅ 방어: CSRF 토큰, SameSite cookie, Referer 검증</p></div>
      <div class="sec-card"><h4>SQL Injection</h4><p>악의적인 SQL 쿼리 삽입으로 DB 조작</p><p class="defense">✅ 방어: Prepared Statement, ORM 사용, 입력값 검증</p></div>
      <div class="sec-card"><h4>보안 체크리스트</h4><ul><li>✅ HTTPS 사용 (TLS 1.2+)</li><li>✅ 최소 권한 원칙</li><li>✅ 의존성 정기 업데이트</li><li>✅ Rate Limiting</li><li>✅ 에러 메시지 상세 숨김</li><li>✅ Security Headers 설정</li></ul></div>
    </div>
  </div>
</div>`;
}

/* =============================================================
   VIEW: BE / DB DESIGN
   ============================================================= */
function viewDBDesign() {
  return `
<div class="content-view">
  ${sectionTitle('🗃️', 'DB 설계', 'ER 다이어그램, 인덱스 전략, 샤딩, N+1, 트랜잭션 격리')}

  <div class="topic-section">
    <h2>ER 다이어그램 개념</h2>
    <div class="er-diagram">
      <div class="er-entity"><div class="er-title">User</div><div class="er-attr pk">🔑 id (PK)</div><div class="er-attr">email</div><div class="er-attr">name</div></div>
      <div class="er-relation">1 ─── N<br><small>주문</small></div>
      <div class="er-entity"><div class="er-title">Order</div><div class="er-attr pk">🔑 id (PK)</div><div class="er-attr fk">🔗 user_id (FK)</div><div class="er-attr">status</div></div>
      <div class="er-relation">1 ─── N<br><small>포함</small></div>
      <div class="er-entity"><div class="er-title">OrderItem</div><div class="er-attr pk">🔑 id (PK)</div><div class="er-attr fk">🔗 order_id (FK)</div><div class="er-attr fk">🔗 product_id (FK)</div></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>인덱스 전략</h2>
    ${codeBlock('<span class="cmt">-- ✅ WHERE 조건에 자주 사용되는 컬럼</span>\nCREATE INDEX idx_email ON users(email);\n\n<span class="cmt">-- ✅ JOIN 조건에 사용되는 FK</span>\nCREATE INDEX idx_user_id ON orders(user_id);\n\n<span class="cmt">-- ✅ 복합 인덱스 (선택도 높은 컬럼을 앞에)</span>\nCREATE INDEX idx_status_created ON orders(status, created_at);\n\n<span class="cmt">-- ❌ 인덱스 피해야 할 경우</span>\n<span class="cmt">-- 카디널리티 낮은 컬럼 (gender, boolean)</span>\n<span class="cmt">-- 자주 UPDATE되는 컬럼 (쓰기 성능 저하)</span>')}
  </div>

  <div class="topic-section">
    <h2>정규화 vs 비정규화 트레이드오프</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>정규화 (Normalization)</th><th>비정규화 (Denormalization)</th></tr></thead>
      <tbody>
        <tr><td>데이터 중복</td><td>최소화</td><td>의도적 중복 허용</td></tr>
        <tr><td>쓰기 성능</td><td>좋음</td><td>나쁨 (여러 테이블 동기화)</td></tr>
        <tr><td>읽기 성능</td><td>나쁨 (많은 JOIN 필요)</td><td>좋음 (JOIN 최소화)</td></tr>
        <tr><td>사용 상황</td><td>OLTP (트랜잭션 중심)</td><td>OLAP (분석 중심), 캐시</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>샤딩 vs 레플리케이션</h2>
    <div class="two-col">
      <div class="concept-card"><h4>샤딩 (Sharding) — 수평 분할</h4><p>데이터를 여러 DB 서버에 나누어 저장. 각 서버가 데이터의 일부만 담당.</p><p><strong>샤딩 키 선택이 중요</strong>: user_id % N, 지역별, 날짜별</p></div>
      <div class="concept-card"><h4>레플리케이션 (Replication) — 복제</h4><p>Primary(Write) → Replica(Read) 복제. 읽기 부하 분산 및 고가용성.</p><p><strong>동기식</strong>: 강한 일관성, 쓰기 느림 | <strong>비동기식</strong>: 빠른 쓰기, Replication Lag</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>N+1 문제와 해결책</h2>
    ${codeBlock('<span class="cmt">// ❌ N+1 문제: 게시글 10개 → 댓글 10번 추가 쿼리</span>\n<span class="kw">const</span> <span class="var">posts</span> = <span class="kw">await</span> <span class="typ">Post</span>.<span class="fn">findAll</span>();             <span class="cmt">// 쿼리 1번</span>\n<span class="kw">for</span> (<span class="kw">const</span> <span class="var">post</span> <span class="kw">of</span> <span class="var">posts</span>)\n  <span class="var">post</span>.<span class="var">comments</span> = <span class="kw">await</span> <span class="typ">Comment</span>.<span class="fn">findAll</span>({    <span class="cmt">// 게시글당 1번</span>\n    <span class="kw">where</span>: { <span class="var">postId</span>: <span class="var">post</span>.<span class="var">id</span> }\n  });\n<span class="cmt">// 총 1 + N쿼리 ☠️</span>\n\n<span class="cmt">// ✅ 해결: Eager Loading (JOIN)</span>\n<span class="kw">const</span> <span class="var">posts</span> = <span class="kw">await</span> <span class="typ">Post</span>.<span class="fn">findAll</span>({\n  <span class="var">include</span>: [{ <span class="var">model</span>: <span class="typ">Comment</span> }] <span class="cmt">// LEFT JOIN으로 한 번에</span>\n});\n<span class="cmt">// 또는 IN 쿼리로 배칭: 쿼리 2번으로 해결!</span>')}
  </div>

  <div class="topic-section">
    <h2>트랜잭션 격리 수준</h2>
    <table class="compare-table">
      <thead><tr><th>격리 수준</th><th>Dirty Read</th><th>Non-Repeatable Read</th><th>Phantom Read</th><th>성능</th></tr></thead>
      <tbody>
        <tr><td>Read Uncommitted</td><td>발생</td><td>발생</td><td>발생</td><td>최고</td></tr>
        <tr><td>Read Committed</td><td>방지</td><td>발생</td><td>발생</td><td>좋음</td></tr>
        <tr><td>Repeatable Read</td><td>방지</td><td>방지</td><td>발생*</td><td>보통</td></tr>
        <tr><td>Serializable</td><td>방지</td><td>방지</td><td>방지</td><td>최저</td></tr>
      </tbody>
    </table>
    <p><small>* MySQL InnoDB는 MVCC로 Repeatable Read에서도 Phantom Read 대부분 방지</small></p>
  </div>
</div>`;
}

/* =============================================================
   VIEW: BE / ARCHITECTURE
   ============================================================= */
function viewArchitecture() {
  return `
<div class="content-view">
  ${sectionTitle('🏗️', '서버 아키텍처', '모놀리식, 마이크로서비스, 메시지 큐, 캐싱, 스케일링')}

  <div class="topic-section">
    <h2>모놀리식 vs 마이크로서비스</h2>
    <table class="compare-table">
      <thead><tr><th>구분</th><th>모놀리식 (Monolithic)</th><th>마이크로서비스 (MSA)</th></tr></thead>
      <tbody>
        <tr><td>구조</td><td>하나의 코드베이스</td><td>작고 독립적인 서비스들</td></tr>
        <tr><td>배포</td><td>전체 재배포</td><td>서비스별 독립 배포</td></tr>
        <tr><td>확장</td><td>전체 스케일 아웃</td><td>필요한 서비스만 스케일</td></tr>
        <tr><td>복잡성</td><td>낮음 (초기)</td><td>높음 (분산 시스템 복잡도)</td></tr>
        <tr><td>장애 격리</td><td>낮음 (전체 영향)</td><td>높음 (서비스별 격리)</td></tr>
        <tr><td>적합한 경우</td><td>소규모, 스타트업, 초기</td><td>대규모, 팀별 자율성 필요</td></tr>
      </tbody>
    </table>
  </div>

  <div class="topic-section">
    <h2>레이어드 아키텍처 (MVC 기반)</h2>
    <div class="layered-arch">
      <div class="la-layer presentation"><strong>Presentation Layer</strong> — Controller<br><small>HTTP 요청/응답 처리, 입력 유효성 검증</small></div>
      <div class="la-arrow">↕ 서비스 호출</div>
      <div class="la-layer business"><strong>Business Layer</strong> — Service<br><small>비즈니스 로직, 트랜잭션 관리</small></div>
      <div class="la-arrow">↕ DB 접근</div>
      <div class="la-layer persistence"><strong>Persistence Layer</strong> — Repository<br><small>데이터 접근 로직, ORM/Query</small></div>
      <div class="la-arrow">↕ SQL/API</div>
      <div class="la-layer database"><strong>Database Layer</strong><br><small>MySQL, PostgreSQL, Redis 등</small></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>메시지 큐 (Message Queue)</h2>
    <div class="two-col">
      <div class="concept-card"><h4>사용 이유</h4><ul><li><strong>비동기 처리</strong>: 이메일 발송, 알림</li><li><strong>서비스 디커플링</strong>: 직접 의존 제거</li><li><strong>트래픽 완충</strong>: 급격한 요청 폭발 흡수</li><li><strong>재처리</strong>: 실패한 작업 자동 재시도</li></ul></div>
      <div class="concept-card"><h4>RabbitMQ vs Kafka</h4><p><strong>RabbitMQ</strong>: 전통적 메시지 브로커. 메시지 소비 후 삭제. 낮은 레이턴시.</p><p><strong>Kafka</strong>: 분산 로그 스트리밍. 메시지 보존 &amp; 재소비. 대용량 처리. 이벤트 소싱.</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>캐싱 전략</h2>
    <div class="cache-strategies">
      <div class="cs-card"><h4>Cache-Aside (Lazy Loading)</h4><p>앱이 캐시 확인 → 미스 시 DB 조회 → 캐시 저장. 가장 일반적.</p>
        ${codeBlock('<span class="kw">async function</span> <span class="fn">getUser</span>(<span class="var">id</span>) {\n  <span class="kw">const</span> <span class="var">cached</span> = <span class="kw">await</span> <span class="var">redis</span>.<span class="fn">get</span>(`user:${<span class="var">id</span>}`);\n  <span class="kw">if</span> (<span class="var">cached</span>) <span class="kw">return</span> <span class="typ">JSON</span>.<span class="fn">parse</span>(<span class="var">cached</span>);\n  <span class="kw">const</span> <span class="var">user</span> = <span class="kw">await</span> <span class="var">db</span>.<span class="fn">findUser</span>(<span class="var">id</span>);\n  <span class="kw">await</span> <span class="var">redis</span>.<span class="fn">setex</span>(`user:${<span class="var">id</span>}`, <span class="num">3600</span>, <span class="typ">JSON</span>.<span class="fn">stringify</span>(<span class="var">user</span>));\n  <span class="kw">return</span> <span class="var">user</span>;\n}')}
      </div>
      <div class="cs-card"><h4>Write-Through</h4><p>DB 쓰기 시 캐시도 동시 업데이트. 캐시 항상 최신 상태 유지.</p></div>
      <div class="cs-card"><h4>Write-Behind (Write-Back)</h4><p>캐시에만 먼저 쓰고 나중에 DB에 비동기 반영. 높은 쓰기 성능, 데이터 손실 위험.</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>수평적 vs 수직적 스케일링</h2>
    <div class="two-col">
      <div class="concept-card"><h4>수직적 스케일링 (Scale Up)</h4><p>서버 사양 업그레이드 (CPU, RAM, SSD). 한계가 있고, 단일 장애점(SPOF) 위험.</p></div>
      <div class="concept-card"><h4>수평적 스케일링 (Scale Out)</h4><p>서버 대수 증가. 로드 밸런서로 트래픽 분산. 무한 확장 가능, 아키텍처 복잡도 증가.</p></div>
    </div>
  </div>

  <div class="topic-section">
    <h2>CI/CD 파이프라인</h2>
    <div class="cicd-pipeline">
      <div class="cicd-step"><strong>Code</strong><br><small>개발자 푸시</small></div>
      <div class="cicd-arrow">→</div>
      <div class="cicd-step"><strong>Build</strong><br><small>컴파일/번들</small></div>
      <div class="cicd-arrow">→</div>
      <div class="cicd-step"><strong>Test</strong><br><small>Unit/E2E</small></div>
      <div class="cicd-arrow">→</div>
      <div class="cicd-step"><strong>Staging</strong><br><small>QA 환경</small></div>
      <div class="cicd-arrow">→</div>
      <div class="cicd-step"><strong>Production</strong><br><small>Blue/Green 배포</small></div>
    </div>
    ${infoBox('배포 전략', 'Blue/Green: 동일한 환경 2개를 유지하고 트래픽을 전환. 빠른 롤백 가능 | Canary: 일부 사용자(1~10%)에게만 새 버전 배포 후 점진 확대 | Rolling: 서버를 순차적으로 업데이트')}
  </div>
</div>`;
}

/* =============================================================
   QUIZ DATA
   ============================================================= */
const QUIZ_DATA = [
  { cat:'CS 기초',  q:'CPU에서 산술 및 논리 연산을 담당하는 장치는?', options:['Control Unit','ALU','Register','Cache'], answer:1, explanation:'ALU(Arithmetic Logic Unit)는 CPU 내에서 덧셈, 뺄셈 등 산술 연산과 AND, OR 등 논리 연산을 수행하는 핵심 장치입니다.' },
  { cat:'CS 기초',  q:'메모리 계층에서 가장 빠른 것은?', options:['RAM','SSD','L1 Cache','Register'], answer:3, explanation:'레지스터는 CPU 내부에 위치하며 접근 속도가 1 사이클 미만으로 가장 빠릅니다. 계층 순서: Register > L1 > L2 > RAM > SSD > HDD' },
  { cat:'CS 기초',  q:'프로세스와 스레드의 차이로 올바른 것은?', options:['스레드는 독립적인 주소 공간을 가진다','프로세스 간 컨텍스트 스위칭이 더 빠르다','스레드는 같은 프로세스 내 메모리를 공유한다','프로세스는 스레드보다 생성 비용이 낮다'], answer:2, explanation:'스레드는 같은 프로세스 내에서 heap, code, data 영역을 공유합니다. 프로세스는 독립적인 메모리 공간을 가지며 컨텍스트 스위칭 비용이 더 높습니다.' },
  { cat:'CS 기초',  q:'Deadlock 발생의 4가지 조건 중 아닌 것은?', options:['상호 배제(Mutual Exclusion)','점유 대기(Hold & Wait)','선점(Preemption)','순환 대기(Circular Wait)'], answer:2, explanation:'Coffman 조건: 상호 배제, 점유 대기, 비선점(Non-Preemption), 순환 대기. 선점(Preemption)은 데드락 조건이 아닙니다.' },
  { cat:'CS 기초',  q:'TCP 3-Way Handshake의 올바른 순서는?', options:['SYN → ACK → SYN-ACK','SYN → SYN-ACK → ACK','ACK → SYN → SYN-ACK','SYN-ACK → SYN → ACK'], answer:1, explanation:'TCP 연결 수립: (1) 클라이언트 → SYN (2) 서버 → SYN-ACK (3) 클라이언트 → ACK. 이 과정으로 양방향 통신 준비를 확인합니다.' },
  { cat:'CS 기초',  q:'ACID 중 트랜잭션의 모든 연산이 전부 성공하거나 전부 실패해야 하는 속성은?', options:['Consistency','Isolation','Durability','Atomicity'], answer:3, explanation:'원자성(Atomicity): 트랜잭션은 더 이상 쪼갤 수 없는 최소 작업 단위입니다. 중간 상태 없이 전부 성공 또는 전부 롤백됩니다.' },
  { cat:'CS 기초',  q:'OSI 7계층에서 TCP/UDP가 속하는 계층은?', options:['응용 계층(7)','세션 계층(5)','전송 계층(4)','네트워크 계층(3)'], answer:2, explanation:'전송 계층(Transport Layer, 4계층)에 TCP와 UDP가 속합니다. 포트 번호를 이용한 프로세스 간 통신을 담당합니다.' },
  { cat:'CS 기초',  q:'B-Tree 인덱스의 특징이 아닌 것은?', options:['범위 검색에 효율적','정렬된 순서 유지','해시 기반 O(1) 접근 지원','균형 트리 구조 유지'], answer:2, explanation:'B-Tree는 정렬된 트리 구조로 범위 검색과 ORDER BY에 효율적입니다. O(1) 해시 접근은 Hash Index의 특징입니다.' },
  { cat:'알고리즘', q:'최악의 경우 O(n log n)을 보장하는 정렬 알고리즘은?', options:['Quick Sort','Bubble Sort','Merge Sort','Insertion Sort'], answer:2, explanation:'Merge Sort는 항상 O(n log n)을 보장합니다. Quick Sort는 최악 O(n²), Bubble/Insertion Sort는 O(n²)입니다.' },
  { cat:'알고리즘', q:'스택(Stack)의 특성으로 올바른 것은?', options:['FIFO (First In, First Out)','LIFO (Last In, First Out)','인덱스로 O(1) 접근','양쪽 끝에서 삽입/삭제'], answer:1, explanation:'스택은 LIFO 구조입니다. 나중에 넣은 것이 먼저 나옵니다. 활용: 함수 호출 스택, 괄호 검사, Undo/Redo' },
  { cat:'알고리즘', q:'이진 탐색(Binary Search)의 시간 복잡도는?', options:['O(1)','O(log n)','O(n)','O(n²)'], answer:1, explanation:'이진 탐색은 매 단계마다 탐색 범위를 절반으로 줄입니다. n → n/2 → n/4 → ... → 1, 총 log₂n 단계 → O(log n)' },
  { cat:'알고리즘', q:'동적 프로그래밍(DP)의 핵심 조건이 아닌 것은?', options:['최적 부분 구조','겹치는 부분 문제','탐욕 선택 속성(Greedy Choice)','메모이제이션 또는 타뷸레이션'], answer:2, explanation:'탐욕 선택 속성은 그리디(Greedy) 알고리즘의 조건입니다. DP의 핵심은 최적 부분 구조와 겹치는 부분 문제입니다.' },
  { cat:'알고리즘', q:'해시 테이블 충돌 해결 방법이 아닌 것은?', options:['체이닝(Chaining)','선형 탐지(Linear Probing)','이중 해싱(Double Hashing)','버블 정렬(Bubble Sort)'], answer:3, explanation:'충돌 해결 방법: 체이닝(연결 리스트), Open Addressing(Linear/Quadratic Probing, Double Hashing). 버블 정렬은 정렬 알고리즘입니다.' },
  { cat:'알고리즘', q:'Min-Heap에서 최솟값 삭제의 시간 복잡도는?', options:['O(1)','O(log n)','O(n)','O(n log n)'], answer:1, explanation:'최솟값(루트) 제거 후 마지막 원소를 루트로 옮기고 Heapify Down 수행. 힙의 높이 = O(log n)이므로 전체 O(log n)' },
  { cat:'알고리즘', q:'BFS와 DFS의 차이로 올바른 것은?', options:['BFS는 스택, DFS는 큐를 사용한다','BFS는 최단 경로 탐색에 유리하다','DFS는 너비 우선으로 탐색한다','BFS는 재귀로만 구현 가능하다'], answer:1, explanation:'BFS(너비 우선): 큐(Queue) 사용, 가중치 없는 그래프 최단 경로에 유리. DFS(깊이 우선): 스택/재귀 사용, 경로 탐색, 위상 정렬에 유리.' },
  { cat:'프론트엔드', q:'Microtask(마이크로태스크)의 예로 올바른 것은?', options:['setTimeout 콜백','setInterval 콜백','Promise.then 콜백','DOM 이벤트 핸들러'], answer:2, explanation:'Microtask Queue: Promise.then/catch/finally, queueMicrotask, MutationObserver. Macrotask Queue: setTimeout, setInterval, DOM Events. Microtask가 Macrotask보다 우선 처리됩니다.' },
  { cat:'프론트엔드', q:'JavaScript 클로저(Closure)에 대한 설명으로 올바른 것은?', options:['함수 실행 후 외부 변수에 접근 불가','함수가 자신의 렉시컬 스코프를 기억하는 특성','클로저는 메모리 누수와 무관하다','화살표 함수에서만 클로저가 생성된다'], answer:1, explanation:'클로저는 함수와 그 함수가 선언된 렉시컬 환경의 조합입니다. 외부 함수 종료 후에도 내부 함수가 외부 변수에 접근할 수 있습니다.' },
  { cat:'프론트엔드', q:'Reflow와 Repaint의 차이로 올바른 것은?', options:['Repaint는 레이아웃 재계산을 포함한다','Reflow는 색상 변경 시 발생한다','Reflow가 Repaint보다 비용이 크다','Repaint 시 항상 Reflow가 발생한다'], answer:2, explanation:'Reflow(Layout): 위치/크기 재계산, 매우 비쌈. Repaint(Paint): 픽셀 재렌더링, 상대적으로 저렴. Reflow 발생 시 Repaint도 함께 발생하지만, Repaint만 발생할 수도 있습니다.' },
  { cat:'프론트엔드', q:'화살표 함수(Arrow Function)의 this 바인딩 특징은?', options:['새로운 this를 생성한다','자신만의 this가 없으며 외부 스코프의 this를 상속한다','new 키워드로 생성자로 사용할 수 있다','bind()로 this를 변경할 수 있다'], answer:1, explanation:'화살표 함수는 자체 this가 없습니다. 렉시컬 스코프의 this를 상속하므로 setTimeout 콜백 등에서 this 문제를 해결하는 데 유용합니다.' },
  { cat:'프론트엔드', q:'Flexbox에서 주축(Main Axis) 정렬을 담당하는 속성은?', options:['align-items','justify-content','align-content','flex-direction'], answer:1, explanation:'justify-content: 주축(Main Axis, flex-direction 방향) 정렬. align-items: 교차축(Cross Axis) 정렬. flex-direction이 row면 justify-content는 좌우 정렬.' },
  { cat:'프론트엔드', q:'Core Web Vitals의 LCP가 측정하는 것은?', options:['첫 번째 바이트 수신 시간','가장 큰 콘텐츠 요소의 렌더링 시간','첫 번째 사용자 입력 응답 시간','레이아웃 변화 누적 점수'], answer:1, explanation:'LCP(Largest Contentful Paint): 뷰포트에서 가장 큰 이미지/텍스트 블록이 렌더링되는 시간. 2.5초 이내가 Good.' },
  { cat:'프론트엔드', q:'CSS position: sticky의 동작 방식은?', options:['뷰포트 기준으로 항상 고정된다','가장 가까운 positioned 조상 기준으로 이동한다','스크롤 위치에 따라 relative와 fixed 사이를 전환한다','문서 흐름에서 완전히 제거된다'], answer:2, explanation:'sticky는 지정된 임계점에 도달하기 전에는 relative처럼, 도달한 후에는 fixed처럼 동작합니다. 스크롤 헤더, 사이드바 등에 활용됩니다.' },
  { cat:'백엔드',   q:'JWT payload의 특징은?', options:['AES로 암호화되어 안전하다','Base64URL 인코딩되어 누구나 디코딩 가능하다','서버만 읽을 수 있다','signature로 내용이 숨겨진다'], answer:1, explanation:'JWT payload는 Base64URL 인코딩만 되어 있으므로 누구나 디코딩할 수 있습니다. 민감한 정보를 포함하면 안 됩니다. signature는 무결성 검증용이지 암호화가 아닙니다.' },
  { cat:'백엔드',   q:'HTTP 상태 코드 401과 403의 차이는?', options:['401: 서버 오류, 403: 클라이언트 오류','401: 인증 필요(Unauthorized), 403: 권한 없음(Forbidden)','401: 리소스 없음, 403: 요청 오류','차이 없음'], answer:1, explanation:'401 Unauthorized: 인증이 필요하거나 인증 실패(로그인 필요). 403 Forbidden: 인증은 됐지만 해당 리소스에 대한 권한이 없음.' },
  { cat:'백엔드',   q:'N+1 문제를 가장 직접적으로 해결하는 방법은?', options:['인덱스 추가','Eager Loading (JOIN 쿼리)','캐시 적용','샤딩'], answer:1, explanation:'N+1 문제: 1번 쿼리 후 N개 관련 데이터를 N번 추가 조회. 해결: Eager Loading으로 JOIN을 사용해 한 번에 조회하거나, DataLoader로 배칭(IN 쿼리)합니다.' },
  { cat:'백엔드',   q:'CSRF 공격 방어 방법으로 적절하지 않은 것은?', options:['CSRF 토큰 사용','SameSite cookie 속성 설정','Referer 헤더 검증','SQL Prepared Statement 사용'], answer:3, explanation:'Prepared Statement는 SQL Injection 방어 기법입니다. CSRF 방어: CSRF 토큰, SameSite=Strict/Lax cookie, Origin/Referer 헤더 검증.' },
  { cat:'백엔드',   q:'마이크로서비스 아키텍처의 단점이 아닌 것은?', options:['분산 시스템 복잡도 증가','서비스 간 네트워크 통신 오버헤드','서비스별 독립 배포 가능','분산 트랜잭션 관리 어려움'], answer:2, explanation:'서비스별 독립 배포는 MSA의 장점입니다. MSA 단점: 서비스 간 통신 복잡성, 분산 트랜잭션, 운영 복잡도 등입니다.' },
  { cat:'백엔드',   q:'REST API에서 멱등성(Idempotent)을 가지지 않는 메서드는?', options:['GET','PUT','DELETE','POST'], answer:3, explanation:'POST는 매번 새로운 리소스를 생성하므로 같은 요청을 여러 번 해도 결과가 다릅니다. GET, PUT, DELETE는 멱등성을 가집니다.' },
  { cat:'백엔드',   q:'트랜잭션 격리 수준 중 가장 강한 격리를 제공하는 것은?', options:['Read Uncommitted','Read Committed','Repeatable Read','Serializable'], answer:3, explanation:'Serializable은 가장 강한 격리 수준으로 Dirty Read, Non-Repeatable Read, Phantom Read를 모두 방지합니다. 단, 성능이 가장 낮습니다.' },
  { cat:'백엔드',   q:'비밀번호 해싱으로 가장 적절한 방법은?', options:['MD5','SHA-1','bcrypt','Base64 인코딩'], answer:2, explanation:'bcrypt는 의도적으로 느린 알고리즘 + salt를 사용하여 Rainbow table 공격과 무차별 대입 공격에 강합니다. MD5, SHA-1은 빠르고 Rainbow table에 취약합니다.' },
];

/* =============================================================
   VIEW: QUIZ
   ============================================================= */
function viewQuiz() {
  const categories = ['전체','CS 기초','알고리즘','프론트엔드','백엔드'];
  return `
<div class="content-view">
  ${sectionTitle('🎯', '퀴즈 & 평가', `${QUIZ_DATA.length}개의 문제로 실력을 점검하세요`)}
  <div class="quiz-container" id="quizContainer">
    <div class="quiz-cat-bar">
      ${categories.map((c, i) => `<button class="quiz-cat-btn${i===0?' active':''}" data-cat="${c}">${c}</button>`).join('')}
    </div>
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" id="quizProgressFill"></div>
    </div>
    <div class="quiz-meta">
      <span id="quizCurrent">1</span> / <span id="quizTotal">${QUIZ_DATA.length}</span>
      <span class="quiz-score-display">점수: <strong id="quizScore">0</strong></span>
    </div>
    <div class="quiz-card" id="quizCard"></div>
    <div class="quiz-nav">
      <button class="btn btn-outline" id="quizPrevBtn">← 이전</button>
      <button class="btn btn-primary" id="quizNextBtn">다음 →</button>
      <button class="btn btn-outline" id="quizRestartBtn" style="display:none">↺ 다시 시작</button>
    </div>
  </div>
</div>`;
}

/* =============================================================
   POST-RENDER: HERO CANVAS (Neural Network Animation)
   ============================================================= */
function initHeroCanvas(app) {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const NODE_COUNT = 65;
  const MAX_DIST   = 130;
  const nodes = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || 900;
    H = canvas.height = canvas.offsetHeight || 420;
  }

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.55;
      this.vy = (Math.random() - 0.5) * 0.55;
      this.r  = Math.random() * 2.2 + 1;
      this.a  = Math.random() * 0.4 + 0.3;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99,102,241,${this.a})`;
      ctx.fill();
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    nodes.forEach(n => { n.update(); n.draw(); });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const opacity = (1 - d / MAX_DIST) * 0.35;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    app._heroAnimId = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Particle());
  frame();
}

/* =============================================================
   POST-RENDER: ALGO VISUALIZER
   ============================================================= */
function initAlgoVisualizer() {
  const canvas = document.getElementById('algoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let arr = [], steps = [], stepIdx = 0, playing = false, playTimer = null;
  let comparisons = 0, swaps = 0;

  const algoInfo = {
    bubble:    { time:'O(n²)',      space:'O(1)' },
    selection: { time:'O(n²)',      space:'O(1)' },
    insertion: { time:'O(n²)',      space:'O(1)' },
    merge:     { time:'O(n log n)', space:'O(n)' },
    quick:     { time:'O(n log n)', space:'O(log n)' },
    heap:      { time:'O(n log n)', space:'O(1)' },
  };

  const $ = id => document.getElementById(id);
  const getSize  = () => parseInt($('sizeSlider')?.value  || 40);
  const getSpeed = () => parseInt($('speedSlider')?.value || 5);
  const getAlgo  = () => $('algoSelect')?.value || 'bubble';

  function generate() {
    const n = getSize();
    arr = Array.from({length:n}, () => Math.floor(Math.random() * (canvas.height - 20)) + 5);
    steps = []; stepIdx = 0; comparisons = 0; swaps = 0;
    updateStats(); draw(arr, [], []);
  }

  function draw(a, hi = [], sorted = []) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const bw = W / a.length;
    a.forEach((v, i) => {
      const x = i * bw, h = v, y = H - h;
      let color = '#6366f1';
      if (sorted.includes(i)) color = '#22c55e';
      if (hi.includes(i))     color = '#f59e0b';
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y, bw - 2, h);
    });
  }

  function updateStats() {
    const info = algoInfo[getAlgo()] || algoInfo.bubble;
    const upd = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    upd('compCount', comparisons); upd('swapCount', swaps);
    upd('timeComp',  info.time);   upd('spaceComp', info.space);
  }

  function* bubbleGen(a) {
    const n = a.length;
    for (let i = 0; i < n-1; i++) {
      for (let j = 0; j < n-i-1; j++) {
        comparisons++;
        yield { arr:[...a], hi:[j,j+1], sorted:Array.from({length:i},(_,k)=>n-1-k) };
        if (a[j] > a[j+1]) { [a[j],a[j+1]] = [a[j+1],a[j]]; swaps++; }
      }
    }
    yield { arr:[...a], hi:[], sorted:Array.from({length:n},(_,k)=>k) };
  }

  function* selectionGen(a) {
    const n = a.length, done = [];
    for (let i = 0; i < n-1; i++) {
      let minIdx = i;
      for (let j = i+1; j < n; j++) {
        comparisons++;
        yield { arr:[...a], hi:[minIdx,j], sorted:[...done] };
        if (a[j] < a[minIdx]) minIdx = j;
      }
      if (minIdx !== i) { [a[i],a[minIdx]] = [a[minIdx],a[i]]; swaps++; }
      done.push(i);
    }
    yield { arr:[...a], hi:[], sorted:Array.from({length:n},(_,k)=>k) };
  }

  function* insertionGen(a) {
    const n = a.length;
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0 && a[j-1] > a[j]) {
        comparisons++; [a[j-1],a[j]] = [a[j],a[j-1]]; swaps++; j--;
        yield { arr:[...a], hi:[j,j+1], sorted:[] };
      }
    }
    yield { arr:[...a], hi:[], sorted:Array.from({length:n},(_,k)=>k) };
  }

  function* quickGen(a, lo=0, hi=a.length-1) {
    if (lo >= hi) return;
    const pivot = a[hi]; let i = lo-1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      yield { arr:[...a], hi:[j,hi], sorted:[] };
      if (a[j] <= pivot) { i++; [a[i],a[j]] = [a[j],a[i]]; swaps++; }
    }
    [a[i+1],a[hi]] = [a[hi],a[i+1]]; swaps++;
    const p = i+1;
    yield { arr:[...a], hi:[p], sorted:[] };
    yield* quickGen(a, lo, p-1);
    yield* quickGen(a, p+1, hi);
  }

  function* mergeGen(a, lo=0, hi=a.length-1) {
    if (lo >= hi) return;
    const mid = Math.floor((lo+hi)/2);
    yield* mergeGen(a, lo, mid);
    yield* mergeGen(a, mid+1, hi);
    const L = a.slice(lo,mid+1), R = a.slice(mid+1,hi+1);
    let i=0, j=0, k=lo;
    while (i < L.length && j < R.length) {
      comparisons++; a[k++] = L[i] <= R[j] ? L[i++] : R[j++]; swaps++;
      yield { arr:[...a], hi:[k-1], sorted:[] };
    }
    while (i < L.length) { a[k++] = L[i++]; swaps++; }
    while (j < R.length) { a[k++] = R[j++]; swaps++; }
    yield { arr:[...a], hi:[], sorted:[] };
  }

  function* heapGen(a) {
    const n = a.length;
    function* heapify(sz, root) {
      let lg = root, l = 2*root+1, r = 2*root+2;
      comparisons++;
      if (l < sz && a[l] > a[lg]) lg = l;
      if (r < sz && a[r] > a[lg]) lg = r;
      if (lg !== root) {
        [a[root],a[lg]] = [a[lg],a[root]]; swaps++;
        yield { arr:[...a], hi:[root,lg], sorted:[] };
        yield* heapify(sz, lg);
      }
    }
    for (let i = Math.floor(n/2)-1; i >= 0; i--) yield* heapify(n, i);
    for (let i = n-1; i > 0; i--) {
      [a[0],a[i]] = [a[i],a[0]]; swaps++;
      yield { arr:[...a], hi:[0,i], sorted:Array.from({length:n-i},(_,k)=>i+k) };
      yield* heapify(i, 0);
    }
    yield { arr:[...a], hi:[], sorted:Array.from({length:n},(_,k)=>k) };
  }

  function buildSteps() {
    const a = [...arr];
    const genMap = { bubble:bubbleGen, selection:selectionGen, insertion:insertionGen,
                     merge:mergeGen, quick:quickGen, heap:heapGen };
    steps = [...genMap[getAlgo()](a)];
    comparisons = 0; swaps = 0; stepIdx = 0; updateStats();
  }

  function doStep() {
    if (stepIdx >= steps.length) { stopPlay(); return; }
    const s = steps[stepIdx++];
    draw(s.arr, s.hi, s.sorted);
    updateStats();
  }

  function startPlay() {
    if (!steps.length) buildSteps();
    playing = true;
    const delay = Math.max(10, 220 - getSpeed() * 20);
    playTimer = setInterval(() => { if (stepIdx >= steps.length) stopPlay(); else doStep(); }, delay);
    const btn = $('playBtn');
    if (btn) btn.textContent = '⏸ 일시정지';
  }

  function stopPlay() {
    playing = false; clearInterval(playTimer);
    const btn = $('playBtn');
    if (btn) btn.textContent = '▶ 시작';
  }

  $('generateBtn')?.addEventListener('click', generate);
  $('resetBtn')?.addEventListener('click', () => { stopPlay(); steps=[]; stepIdx=0; generate(); });
  $('playBtn')?.addEventListener('click', () => { playing ? stopPlay() : startPlay(); });
  $('stepBtn')?.addEventListener('click', () => { stopPlay(); if (!steps.length) buildSteps(); doStep(); });
  $('sizeSlider')?.addEventListener('input', e => { $('sizeLabel').textContent = e.target.value; generate(); });
  $('speedSlider')?.addEventListener('input', e => {
    $('speedLabel').textContent = e.target.value;
    if (playing) { stopPlay(); startPlay(); }
  });
  $('algoSelect')?.addEventListener('change', () => { stopPlay(); steps=[]; stepIdx=0; updateStats(); });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });

  generate();
}

/* =============================================================
   POST-RENDER: COMPLEXITY CHART
   ============================================================= */
function initComplexityChart() {
  const canvas = document.getElementById('complexityCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 45;
  const maxN = 20, maxY = 420;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, W, H);

  const fns = [
    { fn: n => 1,                   color:'#22c55e', label:'O(1)' },
    { fn: n => Math.log2(n+1),      color:'#84cc16', label:'O(log n)' },
    { fn: n => n,                   color:'#3b82f6', label:'O(n)' },
    { fn: n => n * Math.log2(n+1),  color:'#f59e0b', label:'O(n log n)' },
    { fn: n => n * n,               color:'#f97316', label:'O(n²)' },
    { fn: n => Math.pow(2, n),      color:'#ef4444', label:'O(2ⁿ)' },
  ];

  ctx.strokeStyle = 'rgba(128,128,128,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad + (H - pad*2) * i / 5;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W-pad, y); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(128,128,128,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad, H-pad); ctx.lineTo(W-pad, H-pad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad, pad);   ctx.lineTo(pad, H-pad);   ctx.stroke();

  fns.forEach(({ fn, color }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let n = 1; n <= maxN; n++) {
      const val = fn(n);
      if (val > maxY) break;
      const x = pad + (n / maxN) * (W - pad*2);
      const y = H - pad - (val / maxY) * (H - pad*2);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

/* =============================================================
   POST-RENDER: PLAYGROUND
   ============================================================= */
const PLAYGROUND_EXAMPLES = {
  eventloop: `// 이벤트 루프 데모 — 실행 순서를 예측해보세요!
console.log('1: 동기 실행');

setTimeout(() => console.log('2: setTimeout (Macrotask)'), 0);

Promise.resolve()
  .then(() => console.log('3: Promise.then (Microtask)'))
  .then(() => console.log('4: 두 번째 .then (Microtask)'));

console.log('5: 동기 실행');

// 예상 출력: 1 → 5 → 3 → 4 → 2
// 동기 → Microtask Queue → Macrotask Queue 순서!`,

  closure: `// 클로저 예제 — 카운터 팩토리
function makeCounter(start = 0, step = 1) {
  let count = start; // 클로저로 캡처된 변수

  return {
    increment: () => (count += step),
    decrement: () => (count -= step),
    reset:     () => { count = start; },
    getCount:  () => count,
  };
}

const counter = makeCounter(10, 2);
console.log('초기값:', counter.getCount()); // 10
counter.increment();
console.log('+2 후:', counter.getCount());  // 12
counter.increment();
console.log('+2 후:', counter.getCount());  // 14
counter.reset();
console.log('리셋:', counter.getCount());   // 10

// 커링(Currying) 예시
const multiply = a => b => a * b;
const double = multiply(2);
console.log('double(7):', double(7)); // 14`,

  prototype: `// 프로토타입 체인 탐색
function Animal(name, sound) {
  this.name = name;
  this.sound = sound;
}
Animal.prototype.speak = function() {
  return this.name + ': ' + this.sound + '!';
};

function Dog(name) {
  Animal.call(this, name, '멍멍');
  this.tricks = [];
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.learn = function(trick) {
  this.tricks.push(trick);
  return this.name + '이(가) "' + trick + '"를 배웠어요!';
};

const dog = new Dog('초코');
console.log(dog.speak());          // 초코: 멍멍!
console.log(dog.learn('앉아'));    // 초코이(가) "앉아"를 배웠어요!
console.log(dog.tricks);           // ['앉아']
console.log(dog instanceof Dog);   // true
console.log(dog instanceof Animal);// true
console.log('프로토타입 체인: dog → Dog.prototype → Animal.prototype → Object.prototype → null');`,

  promise: `// Promise 체인 & async/await
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function fetchUser(id) {
  return delay(200).then(() => ({ id, name: '홍길동', role: 'admin' }));
}
function fetchPosts(userId) {
  return delay(200).then(() => [
    { id: 1, title: 'Promise 이해하기', userId },
    { id: 2, title: 'async/await 마스터', userId },
  ]);
}

// Promise 체인
fetchUser(1)
  .then(user => {
    console.log('유저:', user.name);
    return fetchPosts(user.id);
  })
  .then(posts => {
    console.log('게시물 수:', posts.length);
    posts.forEach(p => console.log('-', p.title));
  });

// async/await
async function main() {
  const user = await fetchUser(2);
  console.log('async - 유저:', user.name);
  const posts = await fetchPosts(user.id);
  console.log('게시물:', posts.map(p => p.title).join(', '));
}
main();

// 병렬 처리
Promise.all([fetchUser(1), fetchUser(2)])
  .then(users => console.log('병렬:', users.map(u => u.name).join(', ')));`,

  dom: `// DOM 조작 시뮬레이션
class VirtualNode {
  constructor(tag, attrs = {}, children = []) {
    this.tag = tag; this.attrs = attrs; this.children = children;
  }
  toString(indent = 0) {
    const pad = ' '.repeat(indent);
    const attrStr = Object.entries(this.attrs)
      .map(([k, v]) => k + '="' + v + '"').join(' ');
    const open = pad + '<' + this.tag + (attrStr ? ' '+attrStr : '') + '>';
    if (!this.children.length) return open.slice(0,-1) + ' />';
    const kids = this.children
      .map(c => typeof c === 'string' ? pad+'  '+c : c.toString(indent+2))
      .join('\\n');
    return open + '\\n' + kids + '\\n' + pad + '</' + this.tag + '>';
  }
}

const dom = new VirtualNode('div', { id: 'app' }, [
  new VirtualNode('h1', { class: 'title' }, ['CS Academy']),
  new VirtualNode('ul', { id: 'list' }, [
    new VirtualNode('li', {}, ['컴퓨터 구조']),
    new VirtualNode('li', {}, ['운영체제']),
  ]),
]);
console.log('Virtual DOM 구조:');
console.log(dom.toString());

console.log('\\n이벤트 위임 패턴:');
console.log('❌ li 100개에 각각 이벤트 리스너 = 100개의 리스너');
console.log('✅ ul 하나에 이벤트 리스너 = 1개의 리스너');
console.log('   → e.target.matches("li")으로 클릭된 li 판별');`,
};

function initPlayground() {
  const editor  = document.getElementById('pgEditor');
  const output  = document.getElementById('pgOutput');
  const runBtn  = document.getElementById('pgRunBtn');
  const clearBtn= document.getElementById('pgClearBtn');
  const select  = document.getElementById('exampleSelect');
  if (!editor) return;

  editor.value = PLAYGROUND_EXAMPLES[select?.value || 'eventloop'];

  select?.addEventListener('change', () => {
    editor.value = PLAYGROUND_EXAMPLES[select.value] || '';
    if (output) output.innerHTML = '';
  });

  function run() {
    if (!output) return;
    output.innerHTML = '';
    const origLog   = console.log;
    const origError = console.error;
    const origWarn  = console.warn;

    const intercept = type => (...args) => {
      const msg = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
        catch { return String(a); }
      }).join(' ');
      const el = document.createElement('div');
      el.className = `pg-log ${type}`;
      el.textContent = msg;
      output.appendChild(el);
    };

    console.log   = intercept('log');
    console.error = intercept('error');
    console.warn  = intercept('warn');

    try {
      // eslint-disable-next-line no-new-func
      new Function(editor.value)();
    } catch (e) {
      const el = document.createElement('div');
      el.className = 'pg-log error';
      el.textContent = '❌ ' + e.message;
      output.appendChild(el);
    } finally {
      setTimeout(() => {
        console.log   = origLog;
        console.error = origError;
        console.warn  = origWarn;
      }, 3000);
    }
  }

  runBtn?.addEventListener('click', run);
  clearBtn?.addEventListener('click', () => { if (output) output.innerHTML = ''; });
  editor.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
    }
  });
}

/* =============================================================
   POST-RENDER: QUIZ
   ============================================================= */
function initQuiz() {
  let currentCat = '전체';
  let filtered   = [...QUIZ_DATA];
  let currentIdx = 0;
  let answered   = {};
  let score      = 0;

  function getFiltered() {
    return currentCat === '전체' ? [...QUIZ_DATA]
      : QUIZ_DATA.filter(q => q.cat === currentCat);
  }

  function render() {
    filtered = getFiltered();
    const q = filtered[currentIdx];
    if (!q) return;

    const card   = document.getElementById('quizCard');
    const fill   = document.getElementById('quizProgressFill');
    const upd    = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    upd('quizCurrent', currentIdx + 1);
    upd('quizTotal',   filtered.length);
    upd('quizScore',   score);
    if (fill) fill.style.width = `${((currentIdx + 1) / filtered.length) * 100}%`;

    const key = `${currentCat}:${currentIdx}`;
    const ans = answered[key];
    const isAnswered = ans !== undefined;
    const nextBtn    = document.getElementById('quizNextBtn');
    const prevBtn    = document.getElementById('quizPrevBtn');
    const restartBtn = document.getElementById('quizRestartBtn');

    if (card) {
      card.innerHTML = `
        <div class="quiz-question">
          <span class="quiz-cat-badge">${q.cat}</span>
          <p class="quiz-q-text">${q.q}</p>
        </div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (isAnswered) {
              if (i === q.answer) cls += ' correct';
              else if (i === ans) cls += ' wrong';
            }
            return `<button class="${cls}" data-idx="${i}" ${isAnswered?'disabled':''}>${String.fromCharCode(65+i)}. ${opt}</button>`;
          }).join('')}
        </div>
        ${isAnswered ? `<div class="quiz-explanation">
          <strong>${ans === q.answer ? '🎉 정답!' : '❌ 오답'}</strong>
          <p>${q.explanation}</p>
        </div>` : ''}`;

      if (!isAnswered) {
        card.querySelectorAll('.quiz-option').forEach(btn => {
          btn.addEventListener('click', () => {
            const sel = parseInt(btn.dataset.idx);
            answered[key] = sel;
            if (sel === q.answer) score++;
            render();
          });
        });
      }
    }

    if (nextBtn)    nextBtn.style.display    = currentIdx < filtered.length - 1 ? '' : 'none';
    if (prevBtn)    prevBtn.disabled         = currentIdx === 0;
    if (restartBtn) restartBtn.style.display = (currentIdx === filtered.length-1 && isAnswered) ? '' : 'none';
  }

  document.querySelectorAll('.quiz-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quiz-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      currentIdx = 0; score = 0; answered = {};
      render();
    });
  });

  document.getElementById('quizNextBtn')?.addEventListener('click', () => {
    if (currentIdx < filtered.length - 1) { currentIdx++; render(); }
  });
  document.getElementById('quizPrevBtn')?.addEventListener('click', () => {
    if (currentIdx > 0) { currentIdx--; render(); }
  });
  document.getElementById('quizRestartBtn')?.addEventListener('click', () => {
    currentIdx = 0; score = 0; answered = {}; render();
  });

  render();
}

/* =============================================================
   INIT APP
   ============================================================= */
function initApp() {
  const app = new App();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
