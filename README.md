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

공식 JavaScript SDK 12.2.1은 `/hackle-relay.html`의 수집 전용 iframe에서 실행합니다.
iframe은 정적 HTML이어서 앱 레이아웃과 GA4를 중복 실행하지 않고, `no-referrer`로
인증·결제 URL을 전달하지 않습니다. 부모 페이지에서는 SDK를 실행하지 않습니다.
같은 출처의 부모/iframe 메시지만 처리하고 이벤트·속성을 양쪽에서 허용 목록으로 제한합니다.

| 핵클 코드 | 한글 표시명 | 발생 기준 |
|---|---|---|
| page_view | 페이지 방문 | 인증·결제 콜백을 제외한 경로 이동 |
| click_start_survey | 조사 시작 버튼 클릭 | 본문·상단·모바일 메뉴, button_location으로 구분 |
| complete_signup | 회원가입 완료 | 기존 이메일 인증·신규 소셜 가입 이벤트 |
| complete_login | 로그인 완료 | 이메일 토큰 발급·소셜 로그인 콜백 |
| click_run_free_trial | 무료체험 실행 시도 | 실행 버튼을 통과한 시점, 서버 성공과 구분 |
| start_survey | 조사 실행 접수 완료 | 서버가 작업 ID를 반환한 후 |
| view_survey_result | 조사 결과 열람 | 완료 결과를 불러온 후 |
| begin_checkout | 결제 주문 생성 | 서버가 결제 주문을 생성한 후 |
| complete_purchase | 결제 승인 완료 | 서버 승인 ok=true 이후, 주문별 중복 방지 |
| click_contact | 문의 창 열기 | 문의 창을 연 시점, 문의 제출과 구분 |
| download_detailed_report | 상세보고서 다운로드 요청 | 파일 요청 시점, 다운로드 성공과 구분 |
| download_summary_report | 요약보고서 다운로드 요청 | 파일 요청 시점 |
| download_raw_data | 원본자료 다운로드 요청 | 파일 요청 시점 |
| request_detailed_report | 상세보고서 생성 요청 | 생성 요청 시점 |
| click_report_login | 보고서 열람 로그인 유도 클릭 | 무료 열람 버튼 클릭 |
| open_free_report_link | 무료열람 링크 진입 | 토큰을 제외한 진입 이벤트 |

인증 토큰이 있고 캐시 사용자에 숫자 pk/id가 있을 때만 `st-member-번호`를 사용합니다.
이메일·이름·연락처·조사 원문·인증값은 보내지 않습니다. 회원 번호는 가명 식별자이며,
로그아웃·다른 계정 전환 시 SDK 사용자를 초기화합니다. 숫자 번호가 없으면 기기 기준입니다.

미전달 이벤트는 SDK 환경별 브라우저 저장소에 최대 100개·7일간 보관하고 재시도합니다.
가입/결제 이벤트를 일반 방문보다 우선 보관합니다. 중복 방지 키(주문 ID)는 브라우저 안에서만
사용하며 SDK로 보내지 않습니다. 수집 화면의 수신 확인 이후 대기열에서 제거합니다.
브라우저 저장소 차단/삭제, 장기 미방문, 네트워크 차단으로 인한 누락까지 보장하지는 않습니다.
SDK 수락 확인은 결제 원장의 영속성 보장이 아니므로 매출 정산은 백엔드 결제 기록을 기준으로 합니다.

모든 이벤트에 `utm_*`, `first_utm_*`, `last_utm_*` 이벤트 속성을 연결합니다.
분석에서는 iframe 자체의 자동 URL/UTM 속성 대신 **이벤트 속성 page_path/utm_source**를 사용합니다.
SDK 자동 page/route 이벤트는 끄며 기존 `$page_view` 샘플 리포트 대신 맞춤 리포트를 사용합니다.
유입 라벨은 영숫자·한글·점·밑줄·물결·하이픈으로 최대 160자이며 URL/이메일은 허용하지 않습니다.

홍보 링크 예시(게시물마다 utm_content 값을 다르게 설정):
- 블로그: https://www.socialtwin.site/?utm_source=naver_blog&utm_medium=organic_social&utm_campaign=modu&utm_content=report_guide_01
- 스레드: https://www.socialtwin.site/?utm_source=threads&utm_medium=organic_social&utm_campaign=modu&utm_content=post_01

운영 리포트: https://dashboard.hackle.io/workspaces/118048/reports/63864

실제 리포트는 관심→시작 클릭, 시작→조사 접수→결과 열람, 결제 주문→승인을 구분합니다.
신규 가입자 퍼널과 기존 회원 이용 퍼널을 섞지 않고, 내부 점검 방문은 utm_campaign=hackle_setup으로
구분합니다. 개발 검증은 개발 키, 운영 검증은 운영 키를 사용합니다.

검증: `node --test tests/*.test.cjs`, 변경 파일 ESLint, `tsc --noEmit --incremental false`, `npm run build`.

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
