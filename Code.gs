// ══════════════════════════════════════════════════════
//  SBS 아카데미 게임학원 · 문의 접수
//  Google Apps Script (Code.gs)
// ══════════════════════════════════════════════════════

const SHEET_NAME = "문의접수";

// 허용 목록 — 클라이언트가 보내는 값과 정확히 일치해야 저장됨
const ALLOWED_AGE     = ["10대", "20대", "30대", "40대이상"];
const ALLOWED_PURPOSE = ["취미", "입시", "취업", "기타"];
const ALLOWED_BRANCH  = [
  "노원", "강남/신논현", "신촌/홍대", "인천", "수원/동탄",
  "분당", "일산", "안산", "안양", "부산", "대구", "울산",
  "대전", "천안/아산", "광주", "청주",
];

// ── 문의 접수 (POST) ──────────────────────────────────
function doPost(e) {
  try {
    const raw = JSON.parse(e.postData.contents);

    // 허니팟 필드가 채워져 있으면 봇 → 조용히 성공 응답 후 저장 안 함
    if (raw.hp_check) {
      return buildJsonResponse({ status: "success" });
    }

    // 입력값 검증 및 정제 — 통과 못하면 에러 반환
    const data = validateAndSanitize(raw);

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // 시트가 없으면 자동 생성 + 헤더 추가
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["접수시각", "성함", "연락처", "나이", "수강목적", "지점", "문의과목"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#00d4ff");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), // 서버 시각 사용 (클라이언트 위조 방지)
      data.name,
      data.phone,
      data.age,
      data.purpose,
      data.branch,
      data.courses,
    ]);

    // 방금 입력된 행 전체 중앙 정렬
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 7).setHorizontalAlignment("center");

    // 새 문의 접수 시 이메일 알림 발송
    sendNotificationEmail(data);

    return buildJsonResponse({ status: "success" });

  } catch (err) {
    // 에러 내용을 외부에 노출하지 않음 (내부 로그만 남김)
    console.error("[doPost error]", err.message);
    return buildJsonResponse({ status: "error", message: "접수 처리 중 오류가 발생했습니다." });
  }
}

// ── 입력값 검증 + 정제 ────────────────────────────────
function validateAndSanitize(raw) {
  // HTML 태그 및 특수문자 제거 (XSS/스크립트 주입 방지)
  function clean(val, maxLen) {
    if (typeof val !== 'string') return '';
    return val.replace(/<[^>]*>/g, '')   // HTML 태그 제거
              .replace(/[<>"'`]/g, '')   // 위험 특수문자 제거
              .trim()
              .slice(0, maxLen);
  }

  const name    = clean(raw.name,    20);
  const phone   = clean(raw.phone,   13);
  const age     = clean(raw.age,     10);
  const purpose = clean(raw.purpose, 10);
  const branch  = clean(raw.branch,  20);
  const courses = clean(raw.courses, 300);

  // 필수 필드 빈값 체크
  if (!name || !phone || !age || !purpose || !branch || !courses) {
    throw new Error("필수 입력값 누락");
  }

  // 전화번호 형식 검증 (010-XXXX-XXXX)
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    throw new Error("전화번호 형식 오류");
  }

  // 이름: 한글/영문/공백만 허용
  if (!/^[가-힣a-zA-Z\s]{1,20}$/.test(name)) {
    throw new Error("이름 형식 오류");
  }

  // 드롭다운 값 허용 목록 검증 (임의 값 주입 방지)
  if (!ALLOWED_AGE.includes(age)) {
    throw new Error("나이 값 오류");
  }
  if (!ALLOWED_PURPOSE.includes(purpose)) {
    throw new Error("수강목적 값 오류");
  }
  if (!ALLOWED_BRANCH.includes(branch)) {
    throw new Error("지점 값 오류");
  }

  return { name, phone, age, purpose, branch, courses };
}

// ── 문의 접수 알림 이메일 발송 ────────────────────────
const NOTIFY_EMAIL = "hyeon_6166@naver.com";

function sendNotificationEmail(data) {
  try {
    const subject = `[SBS 아카데미] 새 문의 접수 - ${data.name} (${data.branch})`;
    const body = [
      "새로운 문의가 접수되었습니다.",
      "",
      `성함:     ${data.name}`,
      `연락처:   ${data.phone}`,
      `나이:     ${data.age}`,
      `수강목적: ${data.purpose}`,
      `희망지점: ${data.branch}`,
      `문의과목: ${data.courses}`,
      "",
      "▶ 스프레드시트 바로가기",
      SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    ].join("\n");

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (err) {
    // 이메일 발송 실패해도 문의 접수는 정상 처리
    console.error("[sendNotificationEmail error]", err.message);
  }
}

// ── 공통: JSON 응답 빌더 ──────────────────────────────
function buildJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
