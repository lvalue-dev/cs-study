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

/* ──────────────────────────────────────────
   VIEW: 인증 & 보안
   ──────────────────────────────────────── */
function viewAuth() {
  return `
<div class="page-header fade-in">
  <h1 class="page-title">🔐 인증 & 보안</h1>
  <p class="page-subtitle">JWT, OAuth 2.0, 비밀번호 해싱, HTTPS, 보안 취약점 방어</p>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">인증 vs 인가 <span class="badge badge-blue">개념 구분</span></div>
  <div class="concept-body">
    <div class="two-col">
      <div class="info-box note"><strong>인증(Authentication):</strong> "당신이 누구인지" 확인. 로그인, 생체 인식. "당신은 김철수입니까?"</div>
      <div class="info-box tip"><strong>인가(Authorization):</strong> "당신이 무엇을 할 수 있는지" 결정. 권한 확인. "김철수는 이 데이터에 접근할 수 있나요?"</div>
    </div>
    ${table(
      ['구분', '세션 기반', 'JWT 토큰 기반'],
      [
        ['상태', 'Stateful (서버에 세션 저장)', 'Stateless (서버 저장 없음)'],
        ['확장성', '수평 확장 시 세션 공유 필요', '각 서버가 독립 검증 가능'],
        ['무효화', '즉시 가능 (세션 삭제)', '만료 전 무효화 어려움'],
        ['저장', '서버: 메모리/Redis, 클라이언트: 쿠키', '클라이언트: localStorage/cookie'],
        ['적합', '전통적인 웹앱', '마이크로서비스, SPA, 모바일 앱'],
      ]
    )}
  </div>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">JWT (JSON Web Token) <span class="badge badge-green">토큰 구조</span></div>
  <div class="concept-body">
    <p>JWT는 세 부분을 Base64Url 인코딩 후 <code>.</code>으로 연결합니다:</p>
    <div class="diagram" style="font-family:var(--font-mono);font-size:13px">
      <span style="color:#fb923c">헤더</span>.<span style="color:#4f8ef7">페이로드</span>.<span style="color:#34d399">서명</span><br>
      <span style="color:#fb923c">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</span>.<span style="color:#4f8ef7">eyJ1c2VySWQiOjEyMywicm9sZSI6InVzZXIiLCJleHAiOjE3...</span>.<span style="color:#34d399">SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</span>
    </div>
    ${code('JavaScript', `${cmt('// 1. Header: 알고리즘 정보')}
{ ${str('"alg"')}: ${str('"HS256"')}, ${str('"typ"')}: ${str('"JWT"')} }

${cmt('// 2. Payload: 클레임 (사용자 데이터, 만료시간)')}
{
  ${str('"userId"')}: ${num('123')},
  ${str('"role"')}:   ${str('"admin"')},
  ${str('"exp"')}:    ${num('1703001600')}  ${cmt('// Unix timestamp')}
}

${cmt('// 3. Signature: 서버의 비밀키로 서명 (검증용)')}
${fn('HMACSHA256')}(
  ${fn('base64Url')}(header) + ${str('"."')} + ${fn('base64Url')}(payload),
  ${str('"server-secret-key"')}
)`)}
    ${infoBox('warn', '⚠️ 주의:', 'JWT Payload는 Base64 인코딩이므로 누구나 디코딩 가능합니다. 민감한 정보(비밀번호 등)는 절대 포함하지 마세요. 서명(Signature)만 위변조 방지에 사용됩니다.')}
  </div>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">보안 취약점 방어 <span class="badge badge-red">OWASP Top 10</span></div>
  <div class="concept-body">
    ${table(
      ['취약점', '공격 예시', '방어 방법'],
      [
        ['<strong>SQL Injection</strong>', "'; DROP TABLE users; --", 'Prepared Statement, ORM 사용, 입력값 검증'],
        ['<strong>XSS (Cross-Site Scripting)</strong>', '<script>document.cookie</script>', 'HTML 이스케이핑, CSP 헤더, HttpOnly 쿠키'],
        ['<strong>CSRF</strong>', '피해자의 쿠키로 비밀번호 변경', 'CSRF 토큰, SameSite 쿠키, Origin 확인'],
        ['<strong>IDOR</strong>', '/api/users/123 → /api/users/124', '서버 측 권한 검증 필수'],
        ['<strong>Broken Auth</strong>', '약한 비밀번호, 평문 저장', 'bcrypt 해싱, 비밀번호 정책, 2FA'],
      ]
    )}
    ${code('Node.js', `${cmt('// ❌ 취약한 코드: SQL Injection 가능')}
${kw('const')} query = ${str('`SELECT * FROM users WHERE id = ${userId}`')};

${cmt('// ✅ 안전한 코드: Prepared Statement')}
${kw('const')} query = ${str('"SELECT * FROM users WHERE id = ?"')};
db.${fn('execute')}(query, [userId]);

${cmt('// ✅ bcrypt로 비밀번호 해싱')}
${kw('const')} saltRounds = ${num('12')};
${kw('const')} hash = ${kw('await')} bcrypt.${fn('hash')}(password, saltRounds);
${kw('const')} ok   = ${kw('await')} bcrypt.${fn('compare')}(input, hash);`)}
  </div>
</div>`;
}

/* ──────────────────────────────────────────
   VIEW: DB 설계
   ──────────────────────────────────────── */
function viewDBDesign() {
  return `
<div class="page-header fade-in">
  <h1 class="page-title">🗃️ 데이터베이스 설계</h1>
  <p class="page-subtitle">테이블 설계, 인덱스 전략, 확장성, 트랜잭션 격리 수준</p>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">트랜잭션 격리 수준 <span class="badge badge-blue">동시성 제어</span></div>
  <div class="concept-body">
    ${table(
      ['격리 수준', 'Dirty Read', 'Non-Repeatable Read', 'Phantom Read', '성능'],
      [
        ['Read Uncommitted', '발생', '발생', '발생', '가장 빠름'],
        ['Read Committed (기본값)', '방지', '발생', '발생', '빠름'],
        ['Repeatable Read', '방지', '방지', '발생', '보통'],
        ['Serializable', '방지', '방지', '방지', '가장 느림'],
      ]
    )}
  </div>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">N+1 문제와 해결 <span class="badge badge-red">성능 안티패턴</span></div>
  <div class="concept-body">
    ${code('SQL', `${cmt('-- N+1 문제: 게시글 목록 + 각 작성자 조회')}
${kw('SELECT')} * ${kw('FROM')} posts;                    ${cmt('-- 1번')}
${kw('SELECT')} * ${kw('FROM')} users ${kw('WHERE')} id = ${num('1')};  ${cmt('-- N번 반복...')}
${kw('SELECT')} * ${kw('FROM')} users ${kw('WHERE')} id = ${num('2')};
${cmt('-- 총 N+1 쿼리 = 성능 문제!')}

${cmt('-- 해결: JOIN으로 한 번에')}
${kw('SELECT')} p.*, u.name
${kw('FROM')} posts p
${kw('JOIN')} users u ${kw('ON')} p.user_id = u.id;  ${cmt('-- 1번!')}

${cmt('-- 또는: Eager Loading (ORM)')}
${cmt('-- Post.findAll({ include: User })')}`)}
  </div>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">샤딩 vs 레플리케이션 <span class="badge badge-green">확장 전략</span></div>
  <div class="concept-body">
    <div class="two-col">
      <div class="info-box tip"><strong>레플리케이션(Replication):</strong> 동일한 데이터를 여러 서버에 복제. 읽기 성능↑, 고가용성. Primary-Replica 구조. 쓰기는 Primary에만.</div>
      <div class="info-box note"><strong>샤딩(Sharding):</strong> 데이터를 여러 DB에 분산 저장(수평 파티셔닝). 쓰기 성능↑. 하지만 JOIN, 트랜잭션이 복잡해짐.</div>
    </div>
    ${infoBox('warn', '💡 현실적 조언:', '대부분의 서비스는 먼저 인덱스 최적화 → 쿼리 최적화 → 캐시(Redis) → 레플리케이션 → (마지막으로) 샤딩 순서로 접근합니다. 조기 최적화는 피하세요.')}
  </div>
</div>`;
}

/* ──────────────────────────────────────────
   VIEW: 서버 아키텍처
   ──────────────────────────────────────── */
function viewArchitecture() {
  return `
<div class="page-header fade-in">
  <h1 class="page-title">🏗️ 서버 아키텍처</h1>
  <p class="page-subtitle">모놀리식 vs 마이크로서비스, 캐싱 전략, 확장성 패턴</p>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">모놀리식 vs 마이크로서비스 <span class="badge badge-blue">아키텍처 선택</span></div>
  <div class="concept-body">
    ${table(
      ['구분', '모놀리식', '마이크로서비스'],
      [
        ['배포', '단일 배포', '서비스별 독립 배포'],
        ['개발', '간단, 빠른 시작', '복잡, 팀 독립성'],
        ['확장', '전체 스케일아웃', '서비스별 독립 스케일'],
        ['기술', '하나의 언어/프레임워크', '서비스별 다른 기술 스택 가능'],
        ['장애', '전체 영향', '서비스 격리 (Circuit Breaker)'],
        ['적합', '스타트업, 소규모 팀', '대규모, 복잡한 도메인'],
      ]
    )}
    ${infoBox('tip', '💡 실용적 조언:', '"마이크로서비스로 시작하지 마라. 모놀리식으로 시작해서, 명확한 경계가 보일 때 분리하라." — Martin Fowler의 Strangler Fig Pattern')}
  </div>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">캐싱 전략 <span class="badge badge-green">성능의 핵심</span></div>
  <div class="concept-body">
    ${table(
      ['패턴', '설명', '사용 예'],
      [
        ['<strong>Cache-Aside (Lazy Loading)</strong>', '캐시 미스 시 DB 조회 후 캐시 저장', '일반적인 읽기 캐싱'],
        ['<strong>Write-Through</strong>', 'DB 쓰기 시 캐시도 동시에 업데이트', '높은 일관성 필요 시'],
        ['<strong>Write-Behind</strong>', '캐시에 먼저 쓰고 비동기로 DB 업데이트', '쓰기 성능 최우선'],
        ['<strong>CDN</strong>', '지리적으로 분산된 정적 콘텐츠 캐싱', '이미지, JS, CSS'],
      ]
    )}
    ${code('JavaScript', `${cmt('// Redis Cache-Aside 패턴')}
${kw('async')} ${kw('function')} ${fn('getUser')}(id) {
  ${kw('const')} cacheKey = ${str('`user:')}${op('${')}id${op('}')}${str('`')};
  
  ${cmt('// 1. 캐시 확인')}
  ${kw('const')} cached = ${kw('await')} redis.${fn('get')}(cacheKey);
  ${kw('if')} (cached) ${kw('return')} ${typ('JSON')}.${fn('parse')}(cached);
  
  ${cmt('// 2. 캐시 미스 → DB 조회')}
  ${kw('const')} user = ${kw('await')} db.${fn('query')}(
    ${str('"SELECT * FROM users WHERE id = ?"')}, [id]
  );
  
  ${cmt('// 3. 캐시 저장 (TTL: 1시간)')}
  ${kw('await')} redis.${fn('setex')}(cacheKey, ${num('3600')}, ${typ('JSON')}.${fn('stringify')}(user));
  ${kw('return')} user;
}`)}
  </div>
</div>

<div class="concept-section fade-in">
  <div class="concept-title">MVC 패턴 & 레이어드 아키텍처 <span class="badge badge-purple">설계 패턴</span></div>
  <div class="concept-body">
    <div class="diagram">
<pre style="text-align:left;font-size:13px">Client (Browser/App)
        ↓
┌──────────────────┐
│  Controller      │ ← HTTP 요청 수신, 라우팅
│  (Routes)        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Service         │ ← 비즈니스 로직, 트랜잭션
│  (Business)      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Repository      │ ← DB 접근, 쿼리
│  (Data Access)   │
└────────┬─────────┘
         ↓
  ┌─────────────┐
  │  Database   │
  └─────────────┘</pre>
    </div>
    <p>각 레이어는 <strong>한 가지 책임</strong>만 가지며 단방향으로만 의존합니다. 테스트, 유지보수성이 향상됩니다.</p>
  </div>
</div>`;
}

/* ──────────────────────────────────────────
   VIEW: 퀴즈
   ──────────────────────────────────────── */
function viewQuiz() {
  return `
<div class="page-header fade-in">
  <h1 class="page-title">🎯 퀴즈 & 평가</h1>
  <p class="page-subtitle">카테고리별 문제로 CS 지식을 점검해보세요. 정답 후 상세 해설이 제공됩니다.</p>
</div>

<div class="fade-in" style="margin-bottom:20px">
  <div class="tabs">
    <button class="tab-btn active" data-quiz-cat="all">전체 (${30})</button>
    <button class="tab-btn" data-quiz-cat="cs">CS 기초</button>
    <button class="tab-btn" data-quiz-cat="algo">알고리즘</button>
    <button class="tab-btn" data-quiz-cat="fe">프론트엔드</button>
    <button class="tab-btn" data-quiz-cat="be">백엔드</button>
  </div>
</div>

<div class="quiz-container">
  <div id="quizContainer"></div>
  <div class="quiz-score-board" id="quizScoreBoard"></div>
</div>`;
}

/* ──────────────────────────────────────────
   Tab switcher helper
   ──────────────────────────────────────── */
function switchTab(btn, targetId) {
  const parent = btn.closest('.concept-body') || btn.closest('.concept-section') || btn.parentElement.parentElement;
  if (!parent) return;
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');
}
window.switchTab = switchTab;

/* ──────────────────────────────────────────
   Routes map
   ──────────────────────────────────────── */
const routes = {
  'home':               viewHome,
  'cs/computer-arch':   viewComputerArch,
  'cs/os':              viewOS,
  'cs/network':         viewNetwork,
  'cs/database':        viewDatabase,
  'algo/visualizer':    viewAlgoVisualizer,
  'algo/data-structures': viewDataStructures,
  'algo/complexity':    viewComplexity,
  'algo/dp':            viewDP,
  'fe/browser':         viewBrowser,
  'fe/javascript':      viewJavaScript,
  'fe/css-layout':      viewCSSLayout,
  'fe/playground':      viewPlayground,
  'be/http':            viewHTTP,
  'be/auth':            viewAuth,
  'be/db-design':       viewDBDesign,
  'be/architecture':    viewArchitecture,
  'quiz':               viewQuiz,
};

/* ──────────────────────────────────────────
   Theme Manager
   ──────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('cs-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cs-theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const icon  = document.querySelector('.theme-icon');
  const label = document.querySelector('.theme-label');
  if (icon)  icon.textContent  = theme === 'dark' ? '🌙' : '☀️';
  if (label) label.textContent = theme === 'dark' ? '다크 모드' : '라이트 모드';
}

/* ──────────────────────────────────────────
   Search
   ──────────────────────────────────────── */
const SEARCH_INDEX = [
  { title: 'CPU 구조', section: 'cs/computer-arch', keywords: 'cpu alu 캐시 파이프라인 레지스터' },
  { title: '운영체제', section: 'cs/os', keywords: '프로세스 스레드 스케줄링 교착상태 mutex' },
  { title: '네트워크', section: 'cs/network', keywords: 'osi tcp udp http dns 네트워크' },
  { title: '데이터베이스', section: 'cs/database', keywords: 'rdbms nosql 인덱스 트랜잭션 acid sql' },
  { title: '정렬 시각화', section: 'algo/visualizer', keywords: '버블 퀵 합병 정렬 시각화' },
  { title: '자료구조', section: 'algo/data-structures', keywords: '스택 큐 트리 그래프 힙 연결리스트' },
  { title: '시간 복잡도', section: 'algo/complexity', keywords: 'big-o 복잡도 on2 nlogn' },
  { title: '동적 프로그래밍', section: 'algo/dp', keywords: 'dp 메모이제이션 피보나치 lcs 배낭' },
  { title: '브라우저 동작', section: 'fe/browser', keywords: '브라우저 dom 렌더링 이벤트루프 v8' },
  { title: 'JavaScript 심화', section: 'fe/javascript', keywords: '클로저 프로토타입 비동기 promise async' },
  { title: 'CSS 레이아웃', section: 'fe/css-layout', keywords: 'css flexbox grid 반응형 box-model' },
  { title: '코드 실습', section: 'fe/playground', keywords: '실습 코드 에디터 playground' },
  { title: 'HTTP & REST', section: 'be/http', keywords: 'http rest api 상태코드 메서드' },
  { title: '인증 & 보안', section: 'be/auth', keywords: 'jwt oauth 인증 보안 xss csrf bcrypt' },
  { title: 'DB 설계', section: 'be/db-design', keywords: '데이터베이스 설계 n+1 샤딩 레플리케이션' },
  { title: '서버 아키텍처', section: 'be/architecture', keywords: '마이크로서비스 모놀리식 캐시 mvc' },
];

function initSearch() {
  const input = $('searchInput');
  if (!input) return;

  let dropdown = null;

  input.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (dropdown) { dropdown.remove(); dropdown = null; }
    if (!q) return;

    const results = SEARCH_INDEX.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!results.length) return;

    dropdown = document.createElement('div');
    dropdown.style.cssText = 'position:absolute;top:calc(100% + 6px);right:24px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow-md);z-index:200;min-width:220px;overflow:hidden';

    results.forEach(r => {
      const el = document.createElement('div');
      el.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:13px;color:var(--text-2);border-bottom:1px solid var(--border);transition:background 0.15s';
      el.textContent = r.title;
      el.onmouseenter = () => { el.style.background = 'var(--bg-hover)'; };
      el.onmouseleave = () => { el.style.background = ''; };
      el.onclick = () => {
        window.location.hash = '#' + r.section;
        dropdown.remove(); dropdown = null;
        input.value = '';
      };
      dropdown.appendChild(el);
    });

    document.querySelector('.topbar').style.position = 'relative';
    document.querySelector('.topbar').appendChild(dropdown);
  });

  document.addEventListener('click', e => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
      dropdown.remove(); dropdown = null;
    }
  });
}

/* ──────────────────────────────────────────
   Init
   ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  Progress.update();

  const router = new Router(routes);

  // Hamburger / Sidebar
  const hamburger = $('hamburger');
  const sidebar   = $('sidebar');
  const overlay   = $('sidebarOverlay');
  const closeBtn  = $('sidebarClose');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);
  if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth < 900) closeSidebar();
    });
  });

  // Theme toggle
  const themeBtn = $('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Search
  initSearch();

  // Initial route
  router.route();
});
