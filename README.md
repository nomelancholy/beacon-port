![Beacon Port Logo](./public/icon.png)

# Beacon Port

**인재의 신호가 모이는 곳** - 온라인 이력서 작성 및 공유 플랫폼

Beacon Port는 사용자가 쉽고 직관적으로 이력서를 작성하고, 공유할 수 있는 웹 애플리케이션입니다. 드래그 앤 드롭으로 항목 순서를 조정하고, 실시간 미리보기로 작성 중인 이력서를 확인할 수 있습니다.

## 주요 기능

### 📝 이력서 관리

- **이력서 작성/수정**: 직관적인 UI로 이력서 작성 및 수정
- **실시간 미리보기**: 작성 중인 이력서를 실시간으로 미리보기
- **드래그 앤 드롭**: 항목 순서를 드래그 앤 드롭으로 자유롭게 조정
- **이력서 삭제**: 작성한 이력서 삭제 기능
- **공개/비공개 설정**: 이력서를 공개 또는 비공개로 설정

### 📊 스킬 스택 그래프

- 경력과 사이드 프로젝트에서 사용한 기술 스택을 시각화
- 사용 기간이 가장 긴 상위 6개 스킬을 자동으로 표시
- "X년 Y개월" 형식으로 사용 기간 표시

### 👤 사용자 인증

- **이메일 회원가입/로그인**: 이메일과 비밀번호로 회원가입 및 로그인
- **GitHub OAuth**: GitHub 계정으로 간편 로그인
- **비밀번호 검증**: 최소 8자, 영문/숫자/특수문자 포함 강제

### 📱 반응형 디자인

- 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 UI
- 모바일에서 사이드바를 햄버거 메뉴로 전환
- 터치 친화적인 인터페이스

### 🖨️ 인쇄 기능

- 이력서를 PDF로 저장하거나 인쇄 가능
- 인쇄 시 불필요한 요소(헤더, 푸터 등) 자동 제거

### 🔒 접근 제어

- 비공개 이력서는 소유자만 접근 가능
- 공개 이력서는 링크를 통해 누구나 접근 가능
- 비공개 이력서 접근 시 명확한 안내 메시지 표시

## 기술 스택

### 프론트엔드

- **React Router v7**: 최신 버전의 React Router로 서버 사이드 렌더링 지원
- **TypeScript**: 타입 안정성 보장
- **Tailwind CSS v4**: 유틸리티 우선 CSS 프레임워크
- **shadcn/ui**: 재사용 가능한 UI 컴포넌트 라이브러리
- **Recharts**: 스킬 스택 그래프 시각화
- **dnd-kit**: 드래그 앤 드롭 기능 구현

### 백엔드 & 데이터베이스

- **Supabase**: 인증 및 데이터베이스 서비스
  - PostgreSQL 데이터베이스
  - Row Level Security (RLS)로 데이터 보안
  - Storage를 통한 이미지 저장
- **Drizzle ORM**: 타입 안전한 데이터베이스 쿼리
- **Zod**: 스키마 검증

### 기타 라이브러리

- **browser-image-compression**: 이미지 압축
- **lucide-react**: 아이콘 라이브러리

## 프로젝트 구조

```
beacon-port/
├── app/
│   ├── common/              # 공통 페이지 (홈)
│   ├── components/          # React 컴포넌트
│   │   └── ui/            # shadcn/ui 컴포넌트
│   ├── features/           # 기능별 모듈
│   │   ├── auth/          # 인증 관련
│   │   │   ├── pages/     # 로그인, 회원가입 페이지
│   │   │   └── schema.ts # 인증 스키마
│   │   └── resume/        # 이력서 관련
│   │       ├── pages/     # 이력서 작성/수정/상세 페이지
│   │       ├── queries.ts # 데이터베이스 쿼리
│   │       └── schema.ts # 이력서 스키마
│   ├── lib/               # 유틸리티 함수
│   ├── sql/               # SQL 마이그레이션 파일
│   ├── supabase/          # Supabase 클라이언트 설정
│   ├── app.css            # 전역 스타일
│   └── root.tsx           # 루트 컴포넌트
├── public/                # 정적 파일
├── components.json        # shadcn/ui 설정
├── drizzle.config.ts      # Drizzle 설정
└── package.json
```

## 주요 기능 상세

### 이력서 작성

- **About Me**: 이름, 역할, 사진, 연락처, 주소, 소셜 미디어 링크, 자기소개
- **Experience**: 회사명, 역할, 기간, 기술 스택, 작업 내용
- **Side Project**: 프로젝트명, 기간, 링크, 기술 스택, 설명
- **Education**: 기관명, 전공, 기간, 교육 내용
- **자격증**: 자격증명, 발급기관, 취득일
- **어학 성적**: 시험명, 점수, 응시일
- **그 외 활동**: 활동명, 기간, 링크, 활동 내용

### 스킬 관리

- 기술 스택 자동완성 기능
- 영어 스킬명은 자동으로 소문자 변환
- `skills_alias` 테이블을 통한 스킬 별칭 관리
- 미검증 스킬 자동 생성 (`is_verified: false`)

### 스킬 스택 그래프

- 경력과 사이드 프로젝트에서 사용한 기술의 누적 사용 기간 계산
- 상위 6개 스킬을 막대 그래프로 시각화
- 모바일에서도 최적화된 레이아웃

### 코드 스타일

- TypeScript 사용
- Tailwind CSS로 스타일링
- 컴포넌트는 함수형 컴포넌트 사용
- React Hooks 활용

## 저장 안정성 및 새 Supabase 연결

이력서 저장은 전체 폼 검증 후 `public.save_resume` RPC를 한 번 호출합니다.
기본 정보, 상세 항목 6종, 스킬 연결은 하나의 트랜잭션으로 저장되며,
어느 단계에서든 실패하면 기존 데이터가 유지됩니다. 기존의 개별 테이블 저장 방식으로
되돌아가는 우회 처리는 없습니다.

새 Supabase에 기존 테이블과 RLS 정책을 구성한 다음,
SQL Editor에서 [`supabase/save_resume.sql`](./supabase/save_resume.sql)을 실행하세요.
이 SQL은 기존 스키마에 저장 함수를 추가하며, 빈 데이터베이스의 전체 초기화 스크립트는 아닙니다.
함수를 적용한 뒤 `npm run db:typegen`으로 RPC 타입을 재생성할 수 있습니다.
함수가 없는 환경에서는 저장 실패를 표시하고 기존 데이터를 변경하지 않습니다.

사진 업로드에는 `photos` 버킷과 사용자 본인 경로에 대한 Storage 정책이 필요합니다.
DB 저장이 명확하게 실패하면 이번 요청에서 올린 사진만 정리합니다.
응답 유실로 DB 커밋 여부를 알 수 없는 경우에는 저장된 사진을 지우지 않도록 유지합니다.

검증 명령:

```sh
npm test
npm run build
npm run typecheck
```

DB 트랜잭션 테스트는 실제 Supabase 계정 없이 PGlite의 로컬 PostgreSQL 엔진에서 실행할 수 있습니다.
테스트용 의존성은 별도 임시 폴더에 설치합니다.

```sh
npm install --prefix /tmp/beacon-port-db-tests --no-save @electric-sql/pglite@0.3.16
PGLITE_MODULE=/tmp/beacon-port-db-tests/node_modules/@electric-sql/pglite/dist/index.js npm run test:db
```

DB 테스트는 마이그레이션 저널 순서로 스키마·RLS와 저장 함수를 구성해 생성·수정,
저장 후반부 오류의 전체 롤백, 다른 사용자와 익명 사용자의 접근 차단을 확인합니다.
실제 Supabase의 Auth·Storage 연결 검증은 별도로 필요합니다.

## Vercel 운영

운영 주소는 `https://beacon-port.vercel.app`을 사용합니다.
공유 메타데이터는 접속한 주소를 사용하므로 기존 유료 도메인에 의존하지 않습니다.
GitHub 저장소는 `nomelancholy/beacon-port`이며, 운영 브랜치는 `master`입니다.
다른 브랜치는 Vercel 미리보기 환경에서 확인한 뒤 운영에 반영합니다.

Vercel에는 서버용 `SUPABASE_URL`, `SUPABASE_ANON_KEY`와 브라우저용
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정합니다.
새 Supabase의 테이블·저장 함수·Storage 구성을 완료한 뒤 운영 환경변수를 전환합니다.
Supabase Auth의 Site URL은 운영 주소로, 허용 Redirect URL은 운영 주소의
`/auth/callback` 및 사용하는 로컬·미리보기 콜백 주소로 설정해야 합니다.

## 소셜 로그인 설정

로그인과 회원가입 화면은 Google·GitHub OAuth를 지원합니다.
테이블 생성 후 `app/sql/triggers/user_to_profile_trigger.sql`을 적용하면
이메일·Google·GitHub 신규 가입자의 프로필을 생성하고 기존 누락 프로필도 보완합니다.

GitHub 설정:

1. https://github.com/settings/developers → OAuth Apps → New OAuth App
2. Application name: `Beacon Port`
3. Homepage URL: `https://beacon-port.vercel.app`
4. Authorization callback URL: `https://wujwypdjjryisbcsxhsb.supabase.co/auth/v1/callback`
5. Register application 후 Client ID와 Generate a new client secret으로 생성한 값을
   Supabase → Authentication → Sign In / Providers → GitHub에 입력하고 활성화·저장

Supabase → Authentication → URL Configuration에는 Site URL로
`https://beacon-port.vercel.app`을 설정하고, Redirect URLs에
`https://beacon-port.vercel.app/auth/callback` 및 사용하는 미리보기 주소의
`/auth/callback`, `http://localhost:5173/auth/callback`을 추가합니다.
GitHub Client secret은 Supabase 제공자 설정에만 저장합니다.

## 문의

건의 사항 및 문의: takeknowledge@naver.com

---

**Beacon Port** - 인재의 신호가 모이는 곳
