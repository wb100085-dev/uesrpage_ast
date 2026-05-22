# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 가장 먼저: AGENTS.md 확인

이 프로젝트는 **Next.js 16** (App Router) + **React 19** + **Tailwind CSS 4** 입니다. 이전 Next.js와 API·관례·파일 구조가 다릅니다. 코드를 쓰기 전에 `node_modules/next/dist/docs/` 의 해당 API 문서를 먼저 읽으세요. 개발 서버는 **Turbopack 기본**이며, Turbopack 이전의 워크어라운드는 적용되지 않을 수 있습니다.

## 명령어

```bash
npm run dev      # Next.js 개발 서버 :3000 (Turbopack)
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint     # ESLint (eslint-config-next: core-web-vitals + typescript)
```

테스트 프레임워크는 설정되어 있지 않습니다.

## 아키텍처

### 프론트엔드 전용 저장소 · 백엔드는 외부

이 저장소는 Next.js 프론트엔드만 포함합니다 (`wb100085-dev/uesrpage_ast` — 철자 주의: `uesrpage`, userpage 아님). `/api/auth/*`, `/api/survey/*` 호출은 모두 외부 Django 서비스(`dj-rest-auth` + `django-allauth`, `NEXT_PUBLIC_API_URL`)로 향합니다. Next.js API route는 없으며, `fetch`가 `credentials: "include"`로 직접 cross-origin 호출합니다.

**배포**: Vercel 프로젝트명 `userpage-ast`, 커스텀 도메인 `www.socialtwin.site`. **프로덕션에서 `NEXT_PUBLIC_API_URL=https://social-twin-backend.onrender.com` 필수** (미설정 시 `http://localhost:8000` 폴백 → 사용자 브라우저에서 실패). `NEXT_PUBLIC_` 접두사가 있어야 클라이언트 번들에 노출됨. 환경변수 변경 후 Vercel **Redeploy** 필수.

**관련 컴포넌트**: 같은 백엔드를 쓰는 관리자 프론트엔드(`admin_Frontend` → `admin-frontend-chi-two.vercel.app`)가 별도 저장소에 있음. **회원가입은 이 사용자 프론트엔드에서만 발생**, 그래서 백엔드의 `EMAIL_CONFIRMATION_REDIRECT_URL`은 `https://www.socialtwin.site/email-verified`로 설정돼야 함 — 이 페이지는 `app/email-verified/page.tsx` (정적, 로그인 진입 동선 제공).

### 인증 상태 모델

JWT `access`·`refresh` 토큰과 캐시된 사용자 객체는 `localStorage`의 `vpg.auth.access`, `vpg.auth.refresh`, `vpg.auth.user` 키에 보관됩니다. 인증 상태에 의존하는 컴포넌트(`Navbar`, `CtaLink`)는 `useEffect`에서 이 값들을 읽고, 탭 간 동기화를 위해 `storage` 윈도우 이벤트를 구독합니다.

컴포넌트 상태는 첫 effect가 실행되기 전까지 `null`(아직 "로그아웃"이 아님)에서 시작합니다. 이는 **SSR hydration mismatch 방지를 위한 의도된 패턴**이며, `authState === null` 동안에는 플레이스홀더 레이아웃을 렌더링하세요. effect가 끝나기 전에는 "로그아웃 상태"로 가정하지 말 것.

모든 인증 헬퍼(`authLogin`, `authRegister`, `authLogout`, `authGetMe`, `authPasswordReset*`, `authSocialLoginUrl`)는 `lib/auth-api.ts` 가 소유합니다. `dj-rest-auth` / SimpleJWT 에러는 `translateAuthError`를 통해 한국어 메시지로 번역됩니다. **페이지에서 `/api/auth/*`를 직접 호출하지 말고 이 헬퍼들을 재사용하세요.**

### ⚠️ 백엔드 호출은 반드시 헬퍼 경유 — raw `fetch` 금지

`lib/survey-api.ts`의 `apiFetch`와 `lib/auth-api.ts`의 `request`는 **`Authorization: Bearer <JWT>` 헤더를 자동 부착**합니다. 페이지에서 `fetch(\`${API_URL}/api/...\`, ...)` 형태로 직접 호출하면 헤더가 누락되어 백엔드가 비로그인 사용자로 처리합니다. 백엔드 `DEFAULT_PERMISSION_CLASSES = AllowAny` 이므로 401이 안 나고 **그대로 200**을 반환하지만, `request.user.is_authenticated = False` → 작성자 추적 컬럼(예: `survey_designs.user_email`)이 NULL로 저장됩니다.

실제 사례: `app/design/page.tsx`가 `/api/survey/design`을 raw fetch로 호출해 user_email이 NULL로 쌓이던 버그를 헤더 명시 부착으로 수정한 적 있음. 새 백엔드 호출 추가 시 헬퍼를 쓰거나, raw fetch 사용 시 반드시 `getAccessToken()`을 헤더에 부착할 것.

### 소셜 로그인 흐름

`app/login/page.tsx`의 소셜 버튼은 `window.location`을 `${API_BASE}/accounts/{provider}/login/?process=login`로 설정합니다. Django가 OAuth를 처리하고 `/auth/callback?access=...&refresh=...&username=...`로 리다이렉트합니다. 콜백 페이지는 토큰을 localStorage에 저장하고 `authGetMe()`로 사용자 캐시를 갱신한 뒤 `/dashboard/user`로 라우팅합니다. `/login`과 `/auth/callback` 둘 다 콘텐츠를 `<Suspense>`로 감쌌는데, Next.js 16 static build에서 `useSearchParams()`를 쓰려면 필수입니다.

### 클라이언트 컴포넌트 위주

`app/layout.tsx`를 제외한 모든 route 페이지에 `"use client"`가 붙어 있습니다. 서버 사이드 데이터 페칭은 어디에도 없습니다. 설문 작업은 클라이언트에서 폴링합니다(`app/survey/[id]/page.tsx`의 `getSurveyStatus(jobId)`). **데이터 흐름을 추가할 때 server actions나 RSC fetch가 아닌 이 패턴을 따르세요.**

### 페이지 단위 컨벤션 (알려진 기술부채)

route 페이지 파일은 의도적으로 크고 자기완결적입니다 — 상수·타입·서브컴포넌트·헬퍼가 한 파일에 모두 들어 있습니다:

- `app/design/page.tsx` 1117줄, `app/page.tsx` 798줄, `app/dashboard/admin/page.tsx` 605줄, `app/dashboard/user/page.tsx` 441줄, `app/login/page.tsx` 393줄.

아직 리팩토링되지 않은 중복:

- `INDUSTRIES` 배열이 `app/design/page.tsx`와 `app/dashboard/user/page.tsx` **양쪽에** 정의됨
- `SIDO_LIST`는 `app/dashboard/user/page.tsx`에 있음
- `fmtDate`, `fmtAgo`, `StatusBadge`가 `app/dashboard/admin/page.tsx`와 `app/dashboard/user/page.tsx`에 중복

이 중 하나를 바꾸면 **모든 복사본을 함께 수정**하세요. 재구성 기획안(`constants/`, `lib/utils/`, `components/ui/`, `features/<domain>/`로 추출)이 있으니, 해당 영역을 크게 손볼 때는 그 방향을 우선 고려하세요.

### 경로 별칭 · 구조

`@/*`는 프로젝트 루트로 해석됩니다(예: `@/components/Navbar` → `./components/Navbar`). **`src/` 디렉토리는 없습니다.** `app/`, `components/`, `lib/`, `public/`이 설정 파일들과 함께 루트에 있습니다.

### 외부 서비스

- **이미지 도메인** (`next.config.ts`): `images.unsplash.com`, `i.pravatar.cc`. Unsplash URL은 원본 사진이 삭제되면 404가 날 수 있으니 `<Image>` 추가 시 dev 콘솔을 확인하세요.
- **문의 폼** (`components/ContactDialog.tsx`): Formspree(`https://formspree.io/f/xwvwokke`, Omninode 사이트와 공유)로 전송. `prefill` prop에 "설계 요약" 필드가 첨부되며, `app/design/page.tsx`가 현재 설문 설계를 전달하는 용도로 사용합니다.

### 스타일링

Tailwind v4 + `@tailwindcss/postcss` 플러그인. `app/globals.css`에 사이트 전반에서 쓰는 커스텀 유틸이 정의되어 있습니다: `.glass`, `.glass-light`, `.mesh-bg`, `.noise`, `.btn-primary`, `.btn-ghost`, `.text-shimmer`, 애니메이션 keyframes(`fade-up`, `pulse-ring`, `float`, `shimmer`), 그리고 `components/Reveal.tsx`(IntersectionObserver 기반)가 사용하는 `.reveal` / `.reveal.visible` 쌍. Pretendard는 같은 파일에서 CDN import로 로드됩니다.

### UI 언어

모든 사용자 노출 문구는 한국어입니다. Django 백엔드의 영어 에러 응답은 `lib/auth-api.ts`의 `translateAuthError`를 거쳐 한국어로 변환된 후 표시됩니다. 새로운 에러 케이스를 노출할 때는 이 함수를 확장하세요.
