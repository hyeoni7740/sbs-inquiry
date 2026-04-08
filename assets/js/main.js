/* ============================================================
   SBS 아카데미 게임학원 · 노원지점 문의 페이지
   main.js
   ============================================================ */

// ── Google Apps Script Web App URL을 여기에 입력하세요 ──
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwIxsWd49JIaxUoSlL6Vi3LSUWYX9Rz_566lJOUWq9A9Vp1lk7XPfdMOUrLLL3vN4PUqQ/exec";

const form       = document.getElementById('inquiry-form');
const btn        = document.getElementById('submit-btn');
const toast      = document.getElementById('toast');
let isSubmitting = false;

/* ── 토스트 알림 ── */
// duration: 토스트 표시 시간(ms), 기본 3800
function showToast(msg, type = 'success', duration = 3800) {
  toast.textContent = msg;
  toast.className   = 'toast' + (type !== 'success' ? ' ' + type : '');
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
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
    el.classList.toggle('placeholder-active', !el.value);
  });
});

document.querySelectorAll('input[name="course"]').forEach(cb => {
  cb.addEventListener('change', () => hideError('err-course'));
});

/* ── 폼 임시저장 ── */
const DRAFT_KEY  = 'sbs_form_draft';
let   _saveTimer = null;

// 현재 폼 상태를 localStorage에 저장
function saveDraft() {
  try {
    const draft = {
      name:      document.getElementById('name').value,
      phone:     document.getElementById('phone').value,
      branch:    document.getElementById('branch').value,
      age:       document.getElementById('age').value,
      purpose:   document.getElementById('purpose').value,
      // 선택된 과목 체크박스 id 목록
      courses:   [...document.querySelectorAll('input[name="course"]:checked')].map(c => c.id),
      otherText: document.getElementById('other-text').value,
    };
    // 모든 값이 비어있으면 저장하지 않음
    const hasData = draft.name || draft.phone || draft.branch ||
                    draft.age  || draft.purpose || draft.courses.length;
    if (hasData) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  } catch (e) { /* localStorage 사용 불가 환경 무시 */ }
}

// 연속 입력 시 저장을 800ms 뒤로 미룸 (debounce)
function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveDraft, 800);
}

// 페이지 로드 시 저장된 초안 복원
function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    const draft = JSON.parse(raw);
    let restored = false;

    if (draft.name)  { document.getElementById('name').value  = draft.name;  restored = true; }
    if (draft.phone) { document.getElementById('phone').value = draft.phone; restored = true; }

    // 드롭다운: 값 복원 + placeholder 스타일 업데이트
    ['branch', 'age', 'purpose'].forEach(id => {
      if (draft[id]) {
        const el = document.getElementById(id);
        el.value = draft[id];
        el.classList.remove('placeholder-active');
        restored = true;
      }
    });

    // 과목 체크박스 복원 (CSS가 other-text 표시 여부를 자동 처리)
    if (draft.courses && draft.courses.length) {
      draft.courses.forEach(chipId => {
        const el = document.getElementById(chipId);
        if (el) { el.checked = true; restored = true; }
      });
      // 기타 텍스트 복원
      if (draft.otherText) {
        document.getElementById('other-text').value = draft.otherText;
      }
    }

    if (restored) {
      showToast('이전에 작성 중이던 내용을 불러왔습니다.', 'info', 4500);
    }
  } catch (e) {
    // 손상된 데이터는 조용히 삭제
    localStorage.removeItem(DRAFT_KEY);
  }
}

// 제출 완료 후 초안 삭제
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

// 모든 입력 요소에 자동저장 연결
['name', 'phone', 'other-text'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', scheduleSave);
});
['branch', 'age', 'purpose'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', scheduleSave);
});
document.querySelectorAll('input[name="course"]').forEach(cb => {
  cb.addEventListener('change', scheduleSave);
});
document.getElementById('consent-input')?.addEventListener('change', scheduleSave);

/* ── 유효성 검사 ── */
function validate() {
  let ok = true;

  const name = document.getElementById('name').value.trim();
  if (!name) { showError('err-name', 'name'); ok = false; }

  const phone = document.getElementById('phone').value.trim();
  if (!/^010-\d{4}-\d{4}$/.test(phone)) { showError('err-phone', 'phone'); ok = false; }

  const branch = document.getElementById('branch').value.trim();
  if (!branch) { showError('err-branch', 'branch'); ok = false; }

  const age = document.getElementById('age').value.trim();
  if (!age) { showError('err-age', 'age'); ok = false; }

  const purpose = document.getElementById('purpose').value.trim();
  if (!purpose) { showError('err-purpose', 'purpose'); ok = false; }

  const checked = document.querySelectorAll('input[name="course"]:checked');
  if (checked.length === 0) { showError('err-course'); ok = false; }

  if (!document.getElementById('consent-input').checked) { showError('err-consent'); ok = false; }

  return ok;
}

/* ── 폼 제출 ── */
const SUBMIT_COOLDOWN = 30 * 1000; // 30초 쿨다운

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  // 허니팟 필드가 채워져 있으면 봇으로 간주 → 조용히 차단
  if (document.getElementById('hp_check')?.value) return;

  // 30초 내 중복 제출 방지
  const lastSubmit = Number(localStorage.getItem('sbs_last_submit') || 0);
  if (Date.now() - lastSubmit < SUBMIT_COOLDOWN) {
    showToast('잠시 후 다시 시도해주세요.', 'error');
    return;
  }

  if (!validate()) {
    const first = form.querySelector('.error-field, .course-error.show, .consent-error.show');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  isSubmitting = true;
  btn.classList.add('loading');
  btn.disabled = true;

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
                      hp_check: document.getElementById('hp_check')?.value || '' };

  try {
    if (SHEET_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL") {
      await new Promise(r => setTimeout(r, 1400));
      showToast('✅ 문의가 접수되었습니다! (데모 모드)', 'success', 5000);
    } else {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode:   'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      showToast('✅ 문의가 성공적으로 접수되었습니다!', 'success', 5000);
    }

    localStorage.setItem('sbs_last_submit', String(Date.now()));
    clearDraft(); // 임시저장 삭제

    // 폼 초기화
    form.reset();
    document.getElementById('consent-card').classList.remove('agreed');
    ['branch', 'age', 'purpose'].forEach(id => {
      document.getElementById(id).classList.add('placeholder-active');
    });

    // 접수 완료 후 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    showToast('❌ 제출 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
  } finally {
    isSubmitting = false;
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

/* ── 페이지 로드 시 임시저장 복원 ── */
restoreDraft();
