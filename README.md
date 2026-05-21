# Socialtwin

AI 기반 시장조사 SaaS의 Next.js 16 프론트엔드.
한 문장으로 시작해 가상인구가 응답하는 설문을 5분 안에 완성합니다.

## 스택

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS 4**
- **lucide-react** 아이콘
- 인증·설문 API는 외부 Django 백엔드 (`dj-rest-auth` + `django-allauth`)

## 시작하기

```bash
npm install
npm run dev    # http://localhost:3000
```

## 환경 변수 (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000   # Django 백엔드 베이스 URL
```

## 폴더 구조

```
app/             # Next.js App Router (라우트 + 페이지)
  ├ login, forgot-password, reset-password   # 인증
  ├ auth/callback                            # 소셜 로그인 콜백
  ├ dashboard/{user,admin}                   # 대시보드
  ├ design                                   # 조사 설계 6단계 UI
  ├ survey/[id]                              # 설문 실행
  └ results/[id]                             # 결과 대시보드
components/      # 공용 UI (Navbar, ContactDialog, Reveal, CtaLink)
lib/             # API 클라이언트 (auth-api.ts, survey-api.ts)
public/          # 정적 자산 (로고)
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |

## 백엔드

본 저장소는 프론트엔드만 포함합니다. 백엔드(Django API)는 별도 저장소에서 관리되며
`NEXT_PUBLIC_API_URL`로 지정한 주소의 다음 엔드포인트를 호출합니다:

- `/api/auth/{login,logout,registration,me,password/reset,password/reset/confirm}/`
- `/api/survey/{design,run,<id>/status,<id>/results}`
