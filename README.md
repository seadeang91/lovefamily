# lovefamily
groceries and schedule

## 업데이트 방법
- 맥 터미널에서 claude 명령어 입력
- 스크립트 수정
- 배포 요청 (PWA 배포)
- 깃허브 업데이트 요청 (백업 용도)

## 프로젝트 배포 구조

```
로컬 PC (개발/수정)
    ↓ npm run build
dist/ 폴더 생성
    ↓ firebase deploy
Firebase Hosting (실제 배포 + 서비스)  ←── 사용자 접속 (PWA)
Firebase Firestore (데이터 저장)

GitHub ←── 소스코드 백업 전용 (배포와 무관)
```

- 로컬에서 수정 후 `firebase deploy` 실행 시 Firebase Hosting에 업로드되어 즉시 반영
- PWA는 Firebase Hosting에서 서비스되며, GitHub 업데이트와는 독립적

## Firebase 계정 정보 저장 경로

Firebase 로그인 인증 토큰 및 프로젝트 연결 정보가 아래 파일에 저장됨

```
/Users/jason/.config/configstore/firebase-tools.json
```

- `firebase login` 실행 시 Google 계정 인증 후 이 파일에 토큰 저장
- `firebase deploy` 실행 시 이 파일의 토큰으로 Firebase 서버에 자동 인증
- 민감한 인증 정보가 포함되어 있으므로 외부 공유 금지 (.gitignore 처리됨)

## GitHub 업데이트 용도

GitHub은 배포와 무관하며 **소스코드 백업 및 버전 관리** 용도로만 사용

```bash
git add .
git commit -m "변경 내용"
git push origin main
```
