// =====================================================
//  배너 설정 파일
// =====================================================
//
// 1. BANNER_COUNT: 현재 올라와 있는 배너 총 개수를 입력하세요.
//    (이 숫자까지만 이미지를 확인합니다 → 없는 번호 404 에러 방지)
//
// 2. BANNER_LINKS: 배너 번호 순서대로 클릭 링크를 입력하세요.
//    링크 없는 배너는 '#' 입력 (클릭해도 이동 안함)

const BANNER_COUNT = 4; // ← 배너 개수가 바뀌면 여기만 수정

const BANNER_LINKS = [
  'http://sbs-nowonwebtoon.co.kr/landing/before-after.asp',  // 1번
  'http://sbs-gamekorea.com/2025/event/event2301_is.asp',    // 2번
  'http://sbs-nowonwebtoon.co.kr/curri/curri_wrt.asp',      // 3번
  'http://sbs-gamekorea.com/2025/landing/startup-class.asp', // 4번
  // 배너 추가 시 아래에 계속 입력하세요
];
