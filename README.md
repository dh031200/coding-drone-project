# 코딩 드론 플랫폼

강사와 학생 간의 실시간 코딩 및 드론 제어를 위한 웹 애플리케이션입니다. 강사는 실시간으로 학생들의 코드를 모니터링하고, 학생은 자신의 드론을 제어하며, 코드 실행과 질문을 할 수 있습니다.

## Features

#### 강사 기능

- 로그인
- 강의 생성
- 실시간 코드 모니터링
- 학생 창 제어
- 채팅 기능
- 일괄 코드 실행 및 드론 제어 버튼 제어
- 개별 코드 실행 및 드론 제어 버튼 제어
- 드론 일괄 제어

#### 학생 기능

- 강의 접속
- 코드 작성 및 실행
- 드론 제어
- 채팅 기능

## Tech Stack

- React.js: 사용자 인터페이스를 구축하기 위한 라이브러러리
- Tailwind CSS: 스타일링을 위해 사용된 유틸리티 기반의 CSS 프레임워크
- Recoil: 글로벌 상태 관리를 위해 사용된 상태 관리 라이브러리

## Run Locally

Clone the project

```bash
  git clone https://github.com/Echchi/coding-drone-project.git
```

Go to the project directory

```bash
  cd coding-drone-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

## Roadmap

💤 개발 시작 전
🟡 개발 진행 중
✅ 완료

- 화면 설계 ✅
- 환경 설정 ✅
- 화면 구현
  - 강사
    - 로그인 ✅
    - 실시간 모니터링 ✅
    - 학생 창 제어 ✅
    - 일괄 코드 및 드론 실행 제어 ✅
  - 학생 ✅
    - 강의 접속 ✅
    - 코드창 ✅
    - 드론 제어 창 ✅
    - 채팅 창 ✅
- 기능 구현
  - 강사
    - 로그인 ✅
    - 강의 생성 ✅
    - 리프레시 토큰 처리 ✅
    - 강의 종료 ✅
    - 로그아웃 ✅
    - 실시간 코드 모니터링 ✅
    - 학생 창 제어 ✅
    - 일괄 코드 및 드론 실헹 제어 ✅
    - 개별 코드 및 드론 실행 제어 ✅
  - 학생
    - 강의 접속 ✅
    - 토큰 구현 ✅
    - 코드 작성 ✅
    - 코드 실행 ✅
    - 드론 제어 ✅
    - 채팅 💤
