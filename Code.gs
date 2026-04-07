// ══════════════════════════════════════════════════════
//  SBS 아카데미 게임학원 · 문의 접수 + 배너 관리
//  Google Apps Script (Code.gs)
// ══════════════════════════════════════════════════════

const SHEET_NAME        = "문의접수";
const BANNER_SHEET_NAME = "배너";

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

    return buildJsonResponse({ status: "success" });

  } catch (err) {
    return buildJsonResponse({ status: "error", message: err.message });
  }
}

// ── 배너 데이터 반환 (GET) ────────────────────────────
// 구글 시트 "배너" 탭에서 표시여부가 Y인 행만 반환
// 컬럼 구조: A=이미지URL, B=클릭링크, C=표시여부(Y/N), D=설명(메모)
function doGet(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(BANNER_SHEET_NAME);

    // "배너" 시트가 없거나 데이터가 없으면 빈 배열 반환
    if (!sheet || sheet.getLastRow() < 2) {
      return buildJsonResponse({ banners: [] });
    }

    // 컬럼 구조: A=PC이미지URL, B=클릭링크, C=표시여부(Y/N), D=설명, E=모바일이미지URL
    const rows    = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    const banners = rows
      // 이미지URL이 있고 표시여부가 Y인 행만 필터
      .filter(row => row[0] && String(row[2]).trim().toUpperCase() === 'Y')
      .map(row => ({
        imageUrl:       String(row[0]).trim(),
        linkUrl:        String(row[1]).trim(),
        memo:           String(row[3]).trim(),
        mobileImageUrl: String(row[4]).trim(), // 모바일 전용 이미지 (없으면 PC 이미지 사용)
      }));

    return buildJsonResponse({ banners });

  } catch (err) {
    return buildJsonResponse({ banners: [], error: err.message });
  }
}

// ── 공통: JSON 응답 빌더 ──────────────────────────────
function buildJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
