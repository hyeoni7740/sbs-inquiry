# SBS 아카데미 게임학원 · 노원지점 문의 페이지

## 📁 폴더 구조

```
sbs-inquiry/
├── index.html                  ← 메인 페이지
├── Code.gs                     ← Google Apps Script (Sheets 연동)
├── README.md
└── assets/
    ├── css/
    │   └── style.css           ← 스타일시트
    ├── js/
    │   └── main.js             ← 자바스크립트 (유효성 검사, 제출)
    └── images/
        └── logo.png            ← ⭐ 로고 이미지 여기에 넣기
```

## 🖼️ 로고 이미지 설정

`assets/images/` 폴더에 `logo.png` 파일을 넣어주세요.
- 보내주신 `KakaoTalk_20260311_190134977.png` 파일을 `logo.png`로 이름 바꿔서 넣으면 됩니다.
- 권장: 흰색 또는 투명 배경 PNG, 높이 64~128px

## 🚀 GitHub Pages 배포

```bash
git init
git add .
git commit -m "feat: SBS 아카데미 문의 페이지"
git remote add origin https://github.com/YOUR_USERNAME/sbs-inquiry.git
git push -u origin main
```

GitHub 레포 → **Settings → Pages → Deploy from branch (main / root)**

## 📊 Google Sheets 연동

1. [sheets.new](https://sheets.new) 에서 스프레드시트 생성
2. **확장 프로그램 → Apps Script** → `Code.gs` 내용 붙여넣기
3. **배포 → 웹 앱** (액세스: 모든 사용자) → URL 복사
4. `assets/js/main.js` 첫 줄 수정:
   ```js
   const SHEET_URL = "https://script.google.com/macros/s/.../exec";
   ```
5. `git add . && git commit -m "feat: Sheets 연동" && git push`

## 📞 문의

SBS 아카데미 게임학원 노원지점 · **02-6229-7740**
