/* ============================================================
   SBS 아카데미 게임학원 · 노원지점 문의 페이지
   main.js
   ============================================================ */

// ── Google Apps Script Web App URL을 여기에 입력하세요 ──
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxFMCO087JcFe9TswqB2ZXhBkyS23TwvbN7ED2yKaLd_GI7smZ3IAsGuniktIHjUWv6DA/exec";

const form       = document.getElementById('inquiry-form');
const btn        = document.getElementById('submit-btn');
const toast      = document.getElementById('toast');
let isSubmitting = false;

/* ── 토스트 알림 ── */
function showToast(msg, type = 'success') {
  toast.textContent = msg;
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3800);
}

/* ── 전화번호 자동 하이픈 ── */
document.getElementById('phone').addEventListener('input', function (e) {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if      (v.length <= 3) e.target.value = v;
  else if (v.length <= 7) e.target.value = v.slice(0,3) + '-' + v.slice(3);
  else                    e.target.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7,11);
});

/* ── 동의 카드 테두리 상태 ── */
document.getElementById('consent-input').addEventListener('change', function () {
  document.getElementById('consent-card').classList.toggle('agreed', this.checked);
  if (this.checked) hideError('err-consent');
});

/* ── 에러 표시 / 해제 ── */
function showError(id, inputId) {
  document.getElementById(id).classList.add('show');
  if (inputId) document.getElementById(inputId).classList.add('error-field');
}
function hideError(id, inputId) {
  document.getElementById(id).classList.remove('show');
  if (inputId) document.getElementById(inputId)?.classList.remove('error-field');
}

/* 텍스트 입력 시 에러 자동 해제 */
['name', 'phone'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => hideError('err-' + id, id));
});

/* 드롭다운 선택 시 에러 해제 + placeholder 색상 전환 */
['age', 'purpose', 'branch'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('change', () => {
    hideError('err-' + id, id);
    // 값이 있으면 placeholder 스타일 제거, 없으면 유지
    el.classList.toggle('placeholder-active', !el.value);
  });
});

document.querySelectorAll('input[name="course"]').forEach(cb => {
  cb.addEventListener('change', () => hideError('err-course'));
});

/* ── 유효성 검사 ── */
function validate() {
  let ok = true;

  // 성함
  const name = document.getElementById('name').value.trim();
  if (!name) { showError('err-name', 'name'); ok = false; }

  // 연락처: 010-XXXX-XXXX (총 13자)
  const phone = document.getElementById('phone').value.trim();
  if (!/^010-\d{4}-\d{4}$/.test(phone)) { showError('err-phone', 'phone'); ok = false; }

  // 지점
  const branch = document.getElementById('branch').value.trim();
  if (!branch) { showError('err-branch', 'branch'); ok = false; }

  // 나이
  const age = document.getElementById('age').value.trim();
  if (!age) { showError('err-age', 'age'); ok = false; }

  // 수강목적
  const purpose = document.getElementById('purpose').value.trim();
  if (!purpose) { showError('err-purpose', 'purpose'); ok = false; }

  // 과목 (최소 1개)
  const checked = document.querySelectorAll('input[name="course"]:checked');
  if (checked.length === 0) { showError('err-course'); ok = false; }

  // 개인정보 동의
  if (!document.getElementById('consent-input').checked) { showError('err-consent'); ok = false; }

  return ok;
}

/* ── 폼 제출 ── */
const SUBMIT_COOLDOWN = 30 * 1000; // 30초 쿨다운 (스팸 연속 제출 방지)

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  // 허니팟 필드가 채워져 있으면 봇으로 간주 → 조용히 차단
  if (document.getElementById('hp_check').value) return;

  // 마지막 제출로부터 30초 미경과 시 차단
  const lastSubmit = Number(localStorage.getItem('sbs_last_submit') || 0);
  if (Date.now() - lastSubmit < SUBMIT_COOLDOWN) {
    showToast('잠시 후 다시 시도해주세요.', 'error');
    return;
  }

  if (!validate()) {
    // 첫 번째 에러로 스크롤
    const first = form.querySelector('.error-field, .course-error.show, .consent-error.show');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 제출 시작
  isSubmitting = true;
  btn.classList.add('loading');
  btn.disabled = true;

  // 데이터 수집
  const name    = document.getElementById('name').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const branch  = document.getElementById('branch').value.trim();
  const age     = document.getElementById('age').value.trim();
  const purpose = document.getElementById('purpose').value.trim();

  const courseVals = [...document.querySelectorAll('input[name="course"]:checked')].map(c => c.value);
  const otherText  = document.getElementById('other-text').value.trim();
  if (courseVals.includes('기타') && otherText) {
    courseVals[courseVals.indexOf('기타')] = '기타: ' + otherText;
  }
  const courses   = courseVals.join(', ');
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const payload   = { timestamp, name, phone, branch, age, purpose, courses,
                      hp_check: document.getElementById('hp_check').value };

  try {
    if (SHEET_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL") {
      // 데모 모드 (URL 미설정 시)
      await new Promise(r => setTimeout(r, 1400));
      console.log('📋 제출 데이터:', payload);
      showToast('✅ 문의가 접수되었습니다! (데모 모드)');
    } else {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showToast('✅ 문의가 성공적으로 접수되었습니다!');
    }
    localStorage.setItem('sbs_last_submit', String(Date.now())); // 쿨다운 기록
    // 폼 초기화
    form.reset();
    document.getElementById('consent-card').classList.remove('agreed');
    // 드롭다운 초기화 후 placeholder 스타일 복원
    ['branch', 'age', 'purpose'].forEach(id => {
      document.getElementById(id).classList.add('placeholder-active');
    });
  } catch (err) {
    showToast('❌ 제출 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
  } finally {
    isSubmitting = false;
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});
