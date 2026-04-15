# Love Family 앱

## 프로젝트 정보
- **경로:** /Users/jason/lovefamily
- **GitHub:** https://github.com/seadeang91/lovefamily.git
- **배포 URL:** https://lovefamily-3943e.web.app
- **Firebase 프로젝트:** lovefamily-3943e
- **사용자:** 가족 3명 전용 (iPhone Safari PWA)

## 기술 스택
- React 19 + Vite
- Firebase (Auth + Firestore + Hosting)
- Tailwind CSS

## 주요 명령어
```bash
# 로컬 개발 서버
npm run dev

# 빌드 + 배포 (한 번에)
npm run build && firebase deploy --only hosting
```

## Firebase 계정
- 로그인 계정: seadeang91@gmail.com
- Auth 방식: 이메일/비밀번호

## 주요 파일
- `src/pages/CalendarPage.jsx` — 캘린더 + 당번 + 댓글
- `src/pages/GroceriesPage.jsx` — 장보기 + 댓글
- `src/components/Layout.jsx` — 헤더 + 하단 네비게이션
- `src/components/NicknameModal.jsx` — 로그인 후 닉네임 설정
- `src/lib/firebase.js` — Firebase 초기화
- `.env` — Firebase 환경변수 (Git 제외)
