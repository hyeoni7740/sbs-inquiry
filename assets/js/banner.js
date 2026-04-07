/* ============================================================
   SBS 아카데미 게임학원 · 문의 페이지
   banner.js — 배너 슬라이더 (이미지 자동 감지)

   [배너 추가 방법]
   PC    이미지: assets/images/banners/pc/PC01.jpg (PC02, PC03 ...)
   모바일 이미지: assets/images/banners/mobile/M01.jpg (M02, M03 ...)
   - 지원 확장자: jpg, jpeg, png, webp
   - 번호 순서대로 표시되며, 번호가 끊기면 그 앞까지만 표시
   - 모바일 이미지가 없으면 PC 이미지로 자동 대체
   ============================================================ */

const SLIDE_INTERVAL = 4500;
const CIRCUMFERENCE  = 2 * Math.PI * 15;
const MAX_BANNERS    = 20;   // 탐색할 최대 배너 수
const EXTENSIONS     = ['jpg', 'jpeg', 'png', 'webp'];
const PC_BASE        = 'assets/images/banners/pc/PC';
const MOBILE_BASE    = 'assets/images/banners/mobile/M';

// 이미지가 없을 때 표시할 데모 배너
const DEMO_BANNERS = [
  { text: '🎮 게임 · 웹툰 · 일러스트 전문학원', sub: 'SBS 아카데미게임학원' },
  { text: '📚 게임그래픽 · 게임기획 · 게임프로그래밍', sub: '취미 · 입시 · 취업 전 과정 개설' },
  { text: '☎️ 02-6229-7740', sub: '주말 · 공휴일 상담 및 접수 가능' },
];

let slideTimer   = null;
let currentIndex = 0;
let totalSlides  = 0;
let isPaused     = false;

// ── 파일 존재 여부 확인 (HEAD 요청) ──────────────────
async function fileExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// basePath + 번호(2자리) + 확장자 조합으로 실제 파일 탐색
// 예: 'assets/images/banners/pc/PC', 1 → 'assets/images/banners/pc/PC01.jpg'
async function findFile(basePath, index) {
  const num = String(index).padStart(2, '0');
  for (const ext of EXTENSIONS) {
    const url = `${basePath}${num}.${ext}`;
    if (await fileExists(url)) return url;
  }
  return null;
}

// ── 배너 목록 자동 감지 (번호 중간 공백 허용) ──────────
// BANNER_COUNT까지만 병렬 확인 → 존재하는 것만 번호 오름차순으로 표시
async function detectBanners() {
  // banner-links.js의 BANNER_COUNT 우선, 없으면 MAX_BANNERS 사용
  const count = (typeof BANNER_COUNT !== 'undefined') ? BANNER_COUNT : MAX_BANNERS;
  const checks = Array.from({ length: count }, (_, i) => i + 1).map(async (i) => {
    const pcUrl = await findFile(PC_BASE, i);
    if (!pcUrl) return null; // 해당 번호 없으면 스킵 (중간 공백 허용)
    const mobileUrl = await findFile(MOBILE_BASE, i) || '';
    // BANNER_LINKS[i-1] 에 링크가 있으면 사용, 없으면 '#'
    const link = (typeof BANNER_LINKS !== 'undefined' && BANNER_LINKS[i - 1])
      ? BANNER_LINKS[i - 1]
      : '#';
    return {
      imageUrl:       pcUrl,
      mobileImageUrl: mobileUrl,
      linkUrl:        link,
      memo:           `배너 ${i}`,
    };
  });

  // 병렬 실행 후 null(없는 번호) 제거 → 번호 순 유지
  const results = await Promise.all(checks);
  return results.filter(Boolean);
}

// ── 초기화 ────────────────────────────────────────────
async function initBannerSlider() {
  const slider = document.getElementById('banner-slider');
  if (!slider) return;

  let banners = await detectBanners();
  let isDemo  = false;

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
    // 우클릭 저장 · 드래그 방지 — <img>가 아닌 <a>에 등록해야 pointer-events 영향 없음
    link.addEventListener('contextmenu', e => e.preventDefault());
    link.addEventListener('dragstart',   e => e.preventDefault());

    if (!isDemo && banner.imageUrl) {
      const img = document.createElement('img');
      const useMobile = window.innerWidth <= 500 && banner.mobileImageUrl;
      img.src       = useMobile ? banner.mobileImageUrl : banner.imageUrl;
      img.alt       = banner.memo || `배너 ${i + 1}`;
      img.className = 'banner-img';
      img.setAttribute('draggable', 'false');
      img.addEventListener('load',  () => img.classList.add('loaded'));
      img.addEventListener('error', () => {
        slide.classList.add('banner-slide--text');
        img.remove();
        link.appendChild(buildTextContent('이미지를 불러올 수 없습니다', ''));
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
    <button type="button" class="bctrl-btn bctrl-play" id="bctrl-play" aria-label="일시정지">
      <svg class="ring-svg" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <circle class="ring-track" cx="18" cy="18" r="15"/>
        <circle class="ring-fill"  cx="18" cy="18" r="15" id="ring-fill"/>
      </svg>
      <svg class="bctrl-icon icon-pause" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6"  y="5" width="4" height="14" rx="1"/>
        <rect x="14" y="5" width="4" height="14" rx="1"/>
      </svg>
      <svg class="bctrl-icon icon-play" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="7,4 20,12 7,20"/>
      </svg>
    </button>

    <button type="button" class="bctrl-btn" id="bctrl-prev" aria-label="이전 배너">
      <svg class="bctrl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15,18 9,12 15,6"/>
      </svg>
    </button>

    <button type="button" class="bctrl-btn" id="bctrl-next" aria-label="다음 배너">
      <svg class="bctrl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9,18 15,12 9,6"/>
      </svg>
    </button>

    <span class="bctrl-counter">
      <span id="bctrl-cur">1</span>
      <span class="bctrl-sep">|</span>
      <span id="bctrl-tot">${total}</span>
    </span>
  `;

  document.getElementById('banner-slider').appendChild(ctrl);

  document.getElementById('bctrl-play').addEventListener('click', togglePlayPause);
  document.getElementById('bctrl-prev').addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    if (!isPaused) startAutoSlide();
  });
  document.getElementById('bctrl-next').addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    if (!isPaused) startAutoSlide();
  });

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
    clearRing();
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
  fill.style.strokeDasharray  = CIRCUMFERENCE;
  fill.style.strokeDashoffset = CIRCUMFERENCE;
}

function restartRing() {
  const fill = document.getElementById('ring-fill');
  if (!fill) return;
  fill.style.animation        = 'none';
  fill.style.strokeDashoffset = String(CIRCUMFERENCE);
  fill.getBoundingClientRect();
  fill.style.animation = `ringProgress ${SLIDE_INTERVAL}ms linear forwards`;
}

function clearRing() {
  const fill = document.getElementById('ring-fill');
  if (!fill) return;
  fill.style.animation        = 'none';
  fill.getBoundingClientRect();
  fill.style.strokeDashoffset = String(CIRCUMFERENCE);
}

// ── 실행 ─────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBannerSlider);
} else {
  initBannerSlider();
}
