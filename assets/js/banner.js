/* ============================================================
   SBS 아카데미 게임학원 · 노원지점 문의 페이지
   banner.js — 배너 슬라이더 (Google Sheets 연동)
   ============================================================ */

const SLIDE_INTERVAL = 4500; // 4.5초마다 자동 전환
const CIRCUMFERENCE  = 2 * Math.PI * 15; // SVG ring r=15 기준 원둘레 (≈94.25)

// SHEET_URL 미설정 시 화면에 표시할 데모 배너
const DEMO_BANNERS = [
  { imageUrl: '', linkUrl: '#', text: '🎮 게임 · 웹툰 · 일러스트 전문학원', sub: 'SBS 아카데미게임학원 노원지점' },
  { imageUrl: '', linkUrl: '#', text: '📚 게임그래픽 · 게임기획 · 게임프로그래밍', sub: '취미 · 입시 · 취업 전 과정 개설' },
  { imageUrl: '', linkUrl: '#', text: '☎️ 02-6229-7740', sub: '주말 · 공휴일 상담 및 접수 가능' },
];

let slideTimer   = null;
let currentIndex = 0;
let totalSlides  = 0;
let isPaused     = false; // 사용자가 수동으로 일시정지한 상태

// ── Google Drive URL 변환 ─────────────────────────────
// 공유 링크 형식: https://drive.google.com/file/d/파일ID/view?...
// → thumbnail URL: https://drive.google.com/thumbnail?id=파일ID&sz=w1200
function resolveImageUrl(url) {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  return url;
}

// ── 초기화 ────────────────────────────────────────────
async function initBannerSlider() {
  const slider = document.getElementById('banner-slider');
  if (!slider) return;

  let banners = [];
  let isDemo  = false;

  if (typeof SHEET_URL !== 'undefined' && SHEET_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    try {
      const res  = await fetch(SHEET_URL, { method: 'GET' });
      const data = await res.json();
      if (Array.isArray(data.banners) && data.banners.length > 0) {
        banners = data.banners;
      }
    } catch (err) {
      console.error('[banner] 배너 로드 실패:', err);
    }
  }

  if (banners.length === 0) {
    banners = DEMO_BANNERS;
    isDemo  = true;
  }

  totalSlides = banners.length;
  renderSlides(slider, banners, isDemo);

  if (totalSlides <= 1) return;

  renderDots(totalSlides);
  renderControls(totalSlides);
  updateCounter(currentIndex + 1, totalSlides);
  startAutoSlide();
}

// ── 슬라이드 렌더링 ───────────────────────────────────
function renderSlides(slider, banners, isDemo) {
  const track = document.getElementById('banner-track');
  track.innerHTML = '';

  banners.forEach((banner, i) => {
    const slide = document.createElement('div');
    slide.className = 'banner-slide' + (i === 0 ? ' active' : '');

    const link = document.createElement('a');
    const isExternalLink = banner.linkUrl && banner.linkUrl !== '#';
    link.href   = banner.linkUrl || '#';
    link.target = isExternalLink ? '_blank' : '_self';
    link.rel    = 'noopener noreferrer';
    link.setAttribute('aria-label', banner.memo || banner.text || `배너 ${i + 1}`);

    if (!isDemo && banner.imageUrl) {
      const img     = document.createElement('img');
      img.src       = resolveImageUrl(banner.imageUrl);
      img.alt       = banner.memo || `배너 ${i + 1}`;
      img.className = 'banner-img';
      img.addEventListener('load',  () => img.classList.add('loaded'));
      img.addEventListener('error', () => {
        slide.classList.add('banner-slide--text');
        img.remove();
        link.appendChild(buildTextContent('이미지를 불러올 수 없습니다', banner.memo || ''));
      });
      link.appendChild(img);
    } else {
      slide.classList.add('banner-slide--text');
      link.appendChild(buildTextContent(banner.text || '', banner.sub || ''));
    }

    slide.appendChild(link);
    track.appendChild(slide);
  });
}

function buildTextContent(mainText, subText) {
  const wrap = document.createElement('div');
  wrap.className = 'banner-text-wrap';
  wrap.innerHTML = `
    <p class="banner-main-text">${mainText}</p>
    ${subText ? `<p class="banner-sub-text">${subText}</p>` : ''}
  `;
  return wrap;
}

// ── 인디케이터 도트 ───────────────────────────────────
function renderDots(count) {
  const dotsWrap = document.getElementById('banner-dots');
  dotsWrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.type      = 'button';
    dot.className = 'banner-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `${i + 1}번 배너로 이동`);
    dot.addEventListener('click', () => {
      goToSlide(i);
      if (!isPaused) startAutoSlide();
    });
    dotsWrap.appendChild(dot);
  }
}

// ── 컨트롤 바 (일시정지/재생 · 이전 · 다음 · 카운터) ──
function renderControls(total) {
  const existing = document.getElementById('banner-controls');
  if (existing) existing.remove();

  const ctrl = document.createElement('div');
  ctrl.id        = 'banner-controls';
  ctrl.className = 'banner-controls';
  ctrl.innerHTML = `
    <!-- 일시정지/재생 버튼 (원형 progress ring 포함) -->
    <button type="button" class="bctrl-btn bctrl-play" id="bctrl-play" aria-label="일시정지">
      <svg class="ring-svg" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <circle class="ring-track" cx="18" cy="18" r="15"/>
        <circle class="ring-fill"  cx="18" cy="18" r="15" id="ring-fill"/>
      </svg>
      <!-- 일시정지 아이콘 (기본 표시) -->
      <svg class="bctrl-icon icon-pause" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6"  y="5" width="4" height="14" rx="1"/>
        <rect x="14" y="5" width="4" height="14" rx="1"/>
      </svg>
      <!-- 재생 아이콘 (일시정지 상태일 때 표시) -->
      <svg class="bctrl-icon icon-play" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="7,4 20,12 7,20"/>
      </svg>
    </button>

    <!-- 이전 버튼 -->
    <button type="button" class="bctrl-btn" id="bctrl-prev" aria-label="이전 배너">
      <svg class="bctrl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15,18 9,12 15,6"/>
      </svg>
    </button>

    <!-- 다음 버튼 -->
    <button type="button" class="bctrl-btn" id="bctrl-next" aria-label="다음 배너">
      <svg class="bctrl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9,18 15,12 9,6"/>
      </svg>
    </button>

    <!-- 카운터: 현재|전체 -->
    <span class="bctrl-counter">
      <span id="bctrl-cur">1</span>
      <span class="bctrl-sep">|</span>
      <span id="bctrl-tot">${total}</span>
    </span>
  `;

  document.getElementById('banner-slider').appendChild(ctrl);

  // 이벤트 연결
  document.getElementById('bctrl-play').addEventListener('click', togglePlayPause);
  document.getElementById('bctrl-prev').addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    if (!isPaused) startAutoSlide();
  });
  document.getElementById('bctrl-next').addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    if (!isPaused) startAutoSlide();
  });

  // 초기 ring 스타일 적용
  applyRingStyle();
}

// ── 슬라이드 전환 ─────────────────────────────────────
function goToSlide(index) {
  const slides = document.querySelectorAll('.banner-slide');
  const dots   = document.querySelectorAll('.banner-dot');
  if (!slides.length) return;

  slides[currentIndex].classList.remove('active');
  if (dots.length) dots[currentIndex].classList.remove('active');

  currentIndex = ((index % totalSlides) + totalSlides) % totalSlides;

  slides[currentIndex].classList.add('active');
  if (dots.length) dots[currentIndex].classList.add('active');

  updateCounter(currentIndex + 1, totalSlides);

  // 재생 중이면 ring 처음부터 재시작
  if (!isPaused) restartRing();
}

// ── 카운터 업데이트 ───────────────────────────────────
function updateCounter(current, total) {
  const cur = document.getElementById('bctrl-cur');
  const tot = document.getElementById('bctrl-tot');
  if (cur) cur.textContent = current;
  if (tot) tot.textContent = total;
}

// ── 재생/일시정지 토글 ────────────────────────────────
function togglePlayPause() {
  isPaused = !isPaused;

  const btn       = document.getElementById('bctrl-play');
  const iconPause = btn?.querySelector('.icon-pause');
  const iconPlay  = btn?.querySelector('.icon-play');

  if (isPaused) {
    stopTimer();
    clearRing(); // 일시정지 시 ring을 완전히 비움
    if (iconPause) iconPause.style.display = 'none';
    if (iconPlay)  iconPlay.style.display  = 'block';
    btn?.setAttribute('aria-label', '재생');
  } else {
    startAutoSlide();
    if (iconPause) iconPause.style.display = 'block';
    if (iconPlay)  iconPlay.style.display  = 'none';
    btn?.setAttribute('aria-label', '일시정지');
  }
}

// ── 자동 전환 제어 ────────────────────────────────────
function startAutoSlide() {
  stopTimer();
  restartRing();
  slideTimer = setInterval(() => goToSlide(currentIndex + 1), SLIDE_INTERVAL);
}

function stopTimer() {
  if (slideTimer) {
    clearInterval(slideTimer);
    slideTimer = null;
  }
}

// ── ring 애니메이션 제어 ──────────────────────────────
function applyRingStyle() {
  const fill = document.getElementById('ring-fill');
  if (!fill) return;
  // strokeDasharray/offset만 설정 — 회전은 CSS .ring-svg { rotate(-90deg) }가 담당
  // fill에 별도 transform 적용하면 SVG 회전과 중첩되어 6시 방향에서 시작하는 버그 발생
  fill.style.strokeDasharray  = CIRCUMFERENCE;
  fill.style.strokeDashoffset = CIRCUMFERENCE;
}

function restartRing() {
  const fill = document.getElementById('ring-fill');
  if (!fill) return;
  // SVG 요소는 offsetWidth가 항상 0이라 reflow 트리거 불가
  // getBoundingClientRect()로 SVG reflow 강제
  fill.style.animation        = 'none';
  fill.style.strokeDashoffset = String(CIRCUMFERENCE); // 시작값 명시적 초기화
  fill.getBoundingClientRect();                        // SVG reflow 강제
  fill.style.animation = `ringProgress ${SLIDE_INTERVAL}ms linear forwards`;
}

function pauseRing() {
  const fill = document.getElementById('ring-fill');
  if (fill) fill.style.animationPlayState = 'paused';
}

// ring을 완전히 비운 상태로 초기화 (일시정지 버튼 클릭 시)
function clearRing() {
  const fill = document.getElementById('ring-fill');
  if (!fill) return;
  fill.style.animation        = 'none';
  fill.getBoundingClientRect(); // SVG reflow 강제
  fill.style.strokeDashoffset = String(CIRCUMFERENCE);
}

// ── 실행 ─────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBannerSlider);
} else {
  initBannerSlider();
}
