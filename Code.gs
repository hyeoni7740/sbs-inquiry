// ══════════════════════════════════════════════════════
//  SBS 아카데미 게임학원 · 문의 접수 + 배너 관리
//  Google Apps Script (Code.gs)
// ══════════════════════════════════════════════════════

const SHEET_NAME = "문의접수";

// ── 문의 접수 (POST) ──────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

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
      data.timestamp || new Date().toLocaleString('ko-KR'),
      data.name     || "",
      data.phone    || "",
      data.age      || "",
      data.purpose  || "",
      data.branch   || "",
      data.courses  || "",
    ]);

    // 방금 입력된 행 전체 중앙 정렬
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 7).setHorizontalAlignment("center");

    // 새 문의 접수 시 이메일 알림 발송
    sendNotificationEmail(data);

    return buildJsonResponse({ status: "success" });

  } catch (err) {
    return buildJsonResponse({ status: "error", message: err.message });
  }
}

// ── 문의 접수 알림 이메일 발송 ────────────────────────
// 알림 받을 이메일 주소를 아래에 입력하세요
const NOTIFY_EMAIL = "hyeon_6166@naver.com";

function sendNotificationEmail(data) {
  try {
    const subject = `[SBS 아카데미] 새 문의 접수 - ${data.name || "이름없음"} (${data.branch || ""})`;
    const body = [
      "새로운 문의가 접수되었습니다.",
      "",
      `접수시각: ${data.timestamp || ""}`,
      `성함:     ${data.name    || ""}`,
      `연락처:   ${data.phone   || ""}`,
      `나이:     ${data.age     || ""}`,
      `수강목적: ${data.purpose || ""}`,
      `희망지점: ${data.branch  || ""}`,
      `문의과목: ${data.courses || ""}`,
      "",
      "▶ 스프레드시트 바로가기",
      SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    ].join("\n");

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (err) {
    // 이메일 발송 실패해도 문의 접수는 정상 처리
  }
}

// ── 공통: JSON 응답 빌더 ──────────────────────────────
function buildJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
