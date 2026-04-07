# SBS 아카데미 게임학원 · 노원지점 문의 페이지

순수 HTML/CSS/JS 정적 페이지. GitHub Pages 배포, Google Sheets로 문의 접수 관리.
실사용자는 개발 비전공자이므로 **비개발자가 유지보수 가능한 구조**를 최우선으로 설계한다.

---

## 프로젝트 현황

| 항목 | 상태 |
|------|------|
| 문의 접수 폼 (성함/연락처/나이/수강목적/과목) | ✅ 완성 |
| 유효성 검사 + 에러 표시 | ✅ 완성 |
| 개인정보 동의 | ✅ 완성 |
| Google Sheets 연동 (`Code.gs`) | ✅ 완성 (URL 입력 대기) |
| 배너 슬라이더 (Google Sheets 관리형) | ✅ 완성 (SHEET_URL 입력 후 활성화) |

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 마크업 | 순수 HTML5 |
| 스타일 | 순수 CSS3 (CSS Variables 활용) |
| 동작 | Vanilla JS (ES6+) |
| 백엔드 | Google Apps Script (Web App) |
| 데이터 저장 | Google Sheets |
| 배포 | GitHub Pages |
| 빌드 도구 | **없음** (빌드 불필요) |

**패키지 매니저(npm), 프레임워크(React 등), 번들러 도입 금지.**
이유: GitHub Pages 정적 배포 + 비개발자 유지보수 환경.

---

## 디렉토리 구조

```
sbs-inquiry/
├── index.html              ← 메인 페이지 (유일한 HTML)
├── Code.gs                 ← Google Apps Script (Sheets + 배너 API)
├── CLAUDE.md               ← 이 파일
├── README.md               ← 배포/세팅 가이드
└── assets/
    ├── css/
    │   └── style.css       ← 모든 스타일
    ├── js/
    │   ├── main.js         ← 폼 로직 (유효성 검사, 제출) — SHEET_URL 정의
    │   └── banner.js       ← 배너 슬라이더 로직 (main.js 다음에 로드)
    └── images/
        └── logo.png        ← 로고 이미지
```

---

## 배너 슬라이더 설계 (구현 예정)

### 위치
`index.html` 기준: `.phone-pill` ~ `.divider` 사이

### 데이터 관리 방식
**Google Sheets "배너" 탭**에서 비개발자가 직접 관리.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| A: 이미지URL | 구글 드라이브 공유 링크 or 외부 이미지 주소 | `https://drive.google.com/...` |
| B: 클릭링크 | 배너 클릭 시 이동할 URL | `https://academy.sbs.co.kr` |
| C: 표시여부 | `Y` 또는 `N` | `Y` |
| D: 설명(메모) | 관리용 메모 (화면에 안 보임) | `4월 신규강좌 배너` |

### 동작 흐름
1. 페이지 로드 시 `Code.gs doGet` 호출 → 배너 JSON 응답
2. `banner.js`에서 자동 슬라이드 (3~5초 간격)
3. 배너 클릭 → 새 탭으로 링크 이동
4. 구글 시트 행 추가/삭제/Y→N 수정 → 즉시 반영

### Code.gs 수정 계획
- `doPost`: 기존 문의 접수 (변경 없음)
- `doGet`: 배너 시트 데이터를 JSON으로 반환 (추가)

---

## 개발 규칙

### 코드 스타일

```javascript
// ✅ 함수는 명확한 이름 + 한국어 주석
// 배너 데이터를 구글 시트에서 불러와 슬라이더 초기화
async function initBannerSlider() { ... }

// ✅ const/let 사용, var 금지
const SLIDE_INTERVAL = 4000;

// ❌ 금지: var, 주석 없는 복잡한 로직
var x = document.querySelector('.banner');
```

```css
/* ✅ CSS Variables 활용 (style.css :root에 이미 정의됨) */
.banner-slide { background: var(--surface); border: 1px solid var(--border); }

/* ❌ 하드코딩 금지 */
.banner-slide { background: #0d1520; }
```

### HTML 구조 규칙
- `id` 네이밍: `kebab-case` (예: `banner-slider`, `banner-track`)
- 접근성: 배너 `<a>` 태그에 반드시 `aria-label` 또는 의미있는 텍스트
- 이미지 `<img>`에 `alt` 속성 필수

### JS 파일 분리 원칙
- `main.js` — 폼 로직만 (건드리지 말 것)
- `banner.js` — 배너 슬라이더 전용 (새 파일로 분리)
- 파일 간 공유 변수는 `window.xxx` 방식 사용 금지 → 각 파일이 독립적으로 동작

---

## 배포 전 체크리스트 (Claude 자동 수행)

코드 수정 후 커밋 전 **반드시 아래 항목을 순서대로 확인**한다.

### 1. HTML 구조 검사
```
□ 모든 <img>에 alt 속성 있는지
□ 모든 <a>에 href 속성 있는지 (빈 href="#" 금지)
□ id 중복 없는지
□ form 내부 button[type] 명시됐는지
□ </div> </section> 짝 맞는지 (들여쓰기로 육안 확인)
```

### 2. CSS 검사
```
□ :root 변수 외 하드코딩 컬러값 없는지
□ 미디어쿼리 모바일(max-width: 500px) 대응 확인
□ 애니메이션에 prefers-reduced-motion 미적용이면 문제없는 수준인지
```

### 3. JS 검사
```
□ console.log 프로덕션 코드에 없는지 (Code.gs 포함)
□ SHEET_URL이 "YOUR_GOOGLE_APPS_SCRIPT_URL" 그대로인지 확인
  → 데모 모드인 상태로 커밋은 OK, 그러나 주석으로 명시
□ async/await에 try-catch 처리 됐는지
□ 폼 중복 제출 방지 로직 유지되는지 (isSubmitting 플래그)
```

### 4. 동작 테스트 (브라우저 직접 확인)
```
□ 로컬에서 index.html 열어서 폼 제출 동작 확인
□ 빈 폼 제출 시 에러 메시지 노출 확인
□ 전화번호 자동 하이픈 동작 확인
□ 과목 칩 선택/해제 동작 확인
□ 배너 슬라이드 자동 전환 확인 (배너 구현 후)
□ 배너 클릭 → 링크 새 탭 이동 확인 (배너 구현 후)
□ 모바일 뷰 (375px 기준) 레이아웃 깨짐 없는지
```

### 5. Google Apps Script 검사 (Code.gs 수정 시)
```
□ doPost: 기존 문의 접수 로직 정상 동작 유지
□ doGet: 배너 JSON 응답 형식 올바른지
□ 에러 응답 시 status: "error" + message 반환하는지
□ 배포 시 "모든 사용자" 액세스로 재배포했는지
```

---

## 하면 안 되는 것

| 금지 항목 | 이유 |
|-----------|------|
| npm/node_modules 도입 | GitHub Pages 정적 배포 구조 파괴 |
| 외부 JS 라이브러리 추가 (jQuery, Swiper 등) | 불필요한 의존성, 순수 JS로 충분 |
| `var` 사용 | 스코프 문제, `const`/`let` 사용 |
| `console.log` 프로덕션 코드에 남기기 | 민감 데이터 노출 위험 |
| `href="#"` 빈 링크 | 클릭 시 페이지 상단 이동 UX 오류 |
| CSS 하드코딩 색상값 | `:root` 변수 체계 파괴 |
| `index.html` 외 HTML 파일 추가 | SPA 구조 유지 (GitHub Pages 라우팅 제한) |
| Google Sheets 스키마 무단 변경 | 기존 데이터 연동 파괴 |
| `.env` 파일 생성 및 커밋 | 정적 사이트에서 의미 없음, 보안 리스크 |

---

## Google Sheets 구조

### 시트 1: "문의접수" (기존)
| A: 접수시각 | B: 성함 | C: 연락처 | D: 나이 | E: 수강목적 | F: 문의과목 |
|------------|---------|----------|---------|------------|------------|

### 시트 2: "배너" (구현 완료)
| A: 이미지URL | B: 클릭링크 | C: 표시여부 | D: 설명(메모) |
|-------------|-----------|-----------|-------------|

---

## Google Drive 이미지 URL 규칙

구글 드라이브 파일을 배너 이미지로 사용할 때 규칙.

### 파일 공유 설정 (필수)
드라이브 파일 우클릭 → 공유 → **"링크가 있는 모든 사용자"** 로 변경해야 외부에서 로드 가능.

### URL 입력 방식
구글 시트 "배너" 탭 A열에 **공유 링크 그대로** 붙여넣으면 됨. 자동 변환 처리됨.

```
입력값 (공유 링크):  https://drive.google.com/file/d/파일ID/view?usp=...
자동 변환 결과:      https://drive.google.com/thumbnail?id=파일ID&sz=w1200
```

`banner.js`의 `resolveImageUrl()` 함수가 자동으로 처리.
외부 이미지 URL(imgur, CDN 등)은 변환 없이 그대로 사용됨.

### banner.js 수정 시 주의
- `resolveImageUrl()` 함수는 `renderSlides()` 내에서만 호출
- Google Drive URL 변환 로직을 다른 파일로 이동 금지 (banner.js 자급자족 원칙)

---

## 자주 쓰는 명령어

```bash
# 로컬 개발 서버 (Python)
python -m http.server 3000
# 또는
npx serve .          # npx는 설치 없이 사용 가능

# GitHub 배포
git add .
git commit -m "feat: 배너 슬라이더 추가"
git push origin main
# → GitHub Pages 자동 빌드 (1~2분 소요)
```

---

## 주요 연락처 / 링크

- 학원 대표번호: 02-6229-7740
- Google Apps Script 배포 URL: `main.js` SHEET_URL 변수에 입력
- GitHub Pages URL: 배포 후 Settings → Pages에서 확인
