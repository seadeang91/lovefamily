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
- `src/components/WeeklyScheduleModal.jsx` — 주간스케쥴표 모달 (표 렌더링, 확대/축소, 삭제모드)
- `src/components/ScheduleItemForm.jsx` — 주간스케쥴표 항목 추가/수정 팝업
- `src/lib/firebase.js` — Firebase 초기화
- `.env` — Firebase 환경변수 (Git 제외)

## 주간스케쥴표 규칙
- **진입:** 헤더 닉네임 옆 🐶 아이콘 → 모달. 표는 월~토 × 8~20시.
- **데이터 모델 (Firestore):**
  - `weeklySchedules` 컬렉션: 문서 1개 = 항목 1개. `days`(복수 요일 배열), `startTime`/`endTime`(`HH:mm`, 10분 단위), `title`.
  - `weeklyScheduleSettings/main` 문서: 표 제목(`title`).
- **삭제는 요일 단위:** 한 문서가 여러 요일(`days`)에 걸쳐 있어도, 삭제는 항상 특정 요일 인스턴스만 제거해야 함. `days`에서 해당 요일만 빼고 `updateDoc`, 남은 요일이 없으면 `deleteDoc` (일괄 삭제 금지).
- **시간 선택 UI:** 오전/오후 없이 8~20시, 분은 10분 단위 리스트, 분 선택 시 자동으로 닫힘. 요일은 복수 선택 가능.
- **색상 배정 규칙 (`assignColors` in `WeeklyScheduleModal.jsx`):**
  - 팔레트는 파스텔톤 10색 고정. 스케쥴명(title)마다 팔레트에서 중복 없이 하나씩 배정 (동일 이름 = 항상 동일 색상).
  - 같은 요일에 함께 나타나는(인접한) 스케쥴명일수록 색상 계열(hue) 차이를 크게 배정. 스케쥴명이 10개를 넘으면 부득이하게 재사용.
  - 시간(`startTime`/`endTime`)은 색상 결정에 관여하지 않음 — 이름이 같으면 시간/요일이 달라도 같은 색.
- **모달 확대/축소(핀치 줌):**
  - 모달 창(프레임) 크기는 확대/축소와 무관하게 항상 고정 — 확대 시 내부 콘텐츠만 커지고 프레임은 스크롤 가능한 뷰포트로 동작.
  - 축소는 원래 크기(1x) 이하로 내려가지 않음 (`MIN_ZOOM = 1`).
  - 요일 헤더(월~토) 행은 확대/스크롤 시에도 상단에 고정(sticky)되고, 가로 스크롤에는 그리드와 함께 정렬되어 움직임.
  - 세로 기본 크기는 원래 대비 +10%로 고정된 값(`ROW_HEIGHT` 등 상수) — 줌 배율과는 별개 개념이므로 섞어서 계산하지 않음.
