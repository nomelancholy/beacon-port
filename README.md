# Beacon Port

React Router v7 + TypeScript + Tailwind CSS + shadcn/ui 프로젝트

## 시작하기

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 타입 체크

```bash
npm run typecheck
```

## 기술 스택

- **React Router v7**: 최신 버전의 React Router
- **TypeScript**: 타입 안정성
- **Tailwind CSS v4**: 유틸리티 우선 CSS 프레임워크
- **shadcn/ui**: 재사용 가능한 컴포넌트 라이브러리

## 프로젝트 구조

```
beacon-port/
├── app/
│   ├── components/     # React 컴포넌트
│   │   └── ui/        # shadcn/ui 컴포넌트
│   ├── lib/           # 유틸리티 함수
│   ├── routes/        # 라우트 파일
│   ├── app.css        # 전역 스타일
│   └── root.tsx       # 루트 컴포넌트
├── public/            # 정적 파일
└── components.json    # shadcn/ui 설정
```

## shadcn/ui 컴포넌트 추가

새로운 shadcn/ui 컴포넌트를 추가하려면:

```bash
npx shadcn@latest add [component-name]
```

예시:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

## 참고 자료

- [React Router 문서](https://reactrouter.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/)
- [shadcn/ui 문서](https://ui.shadcn.com/)
