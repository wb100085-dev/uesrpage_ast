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
NEXT_PUBLIC_HACKLE_SDK_KEY=                # 핵클 App/Browser SDK 키 (비워 두면 비활성)
```

## 핵클 연결

핵클 대시보드 `설정 → SDK 및 API 연동`의 **App/Browser** 키를 사용합니다.
개발 키는 `.env.development.local`, 운영 키는 `.env.production.local`에 설정합니다.
호스팅에서는 배포 환경별 환경 변수로 설정하고 다시 빌드/배포해야 적용됩니다.
Server 키·Admin API 키는 브라우저 환경 변수에 넣지 않습니다.

공식 JavaScript SDK 12.2.1을 화면 실행 후 불러오며, 기존 GA4는 유지합니다.
초기 연결에서는 SDK가 관리하는 브라우저 기기 식별자를 사용하고 고객 프로필 정보는
전송하지 않습니다. 동일 고객의 여러 기기를 합치는 회원 ID 연결은 포함하지 않습니다.

| 핵클 이벤트 | 발생 시점 |
|---|---|
| `page_view` | 안전한 페이지 진입·경로 이동 (`page_path`, UTM 속성) |
| `click_start_survey` | 조사 시작 버튼 클릭 |
| `complete_signup` | 기존 가입 완료 이벤트 (이메일 인증·소셜 신규 가입) |
| `click_run_free_trial` | 기존 무료체험 실행 버튼 이벤트 |
| `start_survey` | 조사 실행 API가 작업 ID를 반환한 시점 (`is_free_trial`, `panel_size`) |
| `view_survey_result` | 완료된 조사 결과를 불러와 표시하는 시점 |
| `complete_purchase` | 기존 결제 승인 성공 이벤트 (`amount`, `product`) |
| `click_contact` | 문의 창 열기 |
| `download_detailed_report` | 기존 상세보고서 다운로드 요청 이벤트 |

`lib/hackle-analytics.ts`에서 허용한 이벤트·속성만 전달합니다. 경로의 결과 ID는
`/results/[id]`, `/survey/[id]`로 정규화하고, 쿼리 전체는 커스텀 이벤트에 넣지 않습니다.
SDK 자동 페이지·경로 추적은 끄고 커스텀 `page_view`를 사용합니다. 가입 콜백,
비밀번호 재설정, 무료열람 토큰, 결제 성공 콜백처럼 자격증명을 포함할 수 있는 화면에서는
SDK 초기화와 대기 이벤트 전송을 보류합니다. 해당 화면에서 발생한 이벤트는 안전한
페이지로 이동한 뒤 전달됩니다(이동 전에 탭을 닫으면 전달되지 않을 수 있습니다).
중첩된 복귀 주소와 리퍼러에 인증값이 있는 경우도 보류합니다. 클라이언트 경로 전환
직전에는 SDK의 공식 옵트아웃 기능으로 자동 체류·오류 이벤트까지 일시 중지하고,
안전한 화면이 열린 뒤에만 다시 수집합니다. 인증값을 포함한 리퍼러가 남은 방문은
해당 문서를 벗어나기 전까지 핵클 수집이 보류될 수 있습니다.

검증: `node --test tests/hackle-analytics.test.cjs`, `npm run lint`, `npm run build`.
운영 반영 후 핵클 `이벤트 조회`에서 `page_view`와 `click_start_survey` 수신을 확인합니다.

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
