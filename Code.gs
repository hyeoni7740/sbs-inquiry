// ══════════════════════════════════════════════════════
//  SBS 아카데미 게임학원 · 문의 접수
//  Google Apps Script (Code.gs)
// ══════════════════════════════════════════════════════

const SHEET_NAME = "문의접수";

// ── 문의 접수 (POST) ──────────────────────────────────
function doPost(e) {
  try {
    const raw = JSON.parse(e.postData.contents);

    // 허니팟 필드가 채워져 있으면 봇 → 조용히 성공 응답만 반환
    if (raw.hp_check) {
      return buildJsonResponse({ status: "success" });
    }

    // HTML 태그 제거 (스크립트 주입 방지)
    function clean(val, maxLen) {
      if (typeof val !== 'string') return '';
      return val.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
    }

    const name    = clean(raw.name,    50);
    const phone   = clean(raw.phone,   20);
    const age     = clean(raw.age,     20);
    const purpose = clean(raw.purpose, 20);
    const branch  = clean(raw.branch,  30);
    const courses = clean(raw.courses, 500);

    // 필수 필드 빈값 체크
    if (!name || !phone || !branch || !courses) {
      throw new Error("필수 입력값 누락");
    }

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
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      name, phone, age, purpose, branch, courses,
    ]);

    // 방금 입력된 행 전체 중앙 정렬
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 7).setHorizontalAlignment("center");

    // 새 문의 접수 시 이메일 알림 발송
    sendNotificationEmail({ name, phone, age, purpose, branch, courses });

    return buildJsonResponse({ status: "success" });

  } catch (err) {
    console.error("[doPost error]", err.message);
    return buildJsonResponse({ status: "error", message: "접수 처리 중 오류가 발생했습니다." });
  }
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
    console.error("[sendNotificationEmail error]", err.message);
  }
}

// ── 공통: JSON 응답 빌더 ──────────────────────────────
function buildJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
