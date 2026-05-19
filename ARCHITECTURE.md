# 시스템 아키텍처 — Market Research B2C

## 전체 구성

```mermaid
flowchart TD
    subgraph Client["브라우저 (사용자)"]
        U["일반 사용자"]
    end

    subgraph Frontend["프론트엔드 — Next.js (localhost:3000)"]
        direction TB
        P_LAND["/ 랜딩 페이지"]
        P_LOGIN["app/login 로그인"]
        P_DESIGN["app/design 조사 설계 (6단계 UI)"]
        P_SURVEY["app/survey/[id] 설문 실행"]
        P_RESULT["app/results/[id] 결과 대시보드"]
        P_DASH_U["app/dashboard/user 사용자 대시보드"]
        P_DASH_A["app/dashboard/admin 관리자 대시보드"]
        NAV["Navbar"]
        REVEAL["Reveal (스크롤 애니메이션)"]
        SURVEY_API["lib/survey-api.ts (API 클라이언트)"]
        AUTH_CB["app/auth/callback 인증 콜백"]
        SUPABASE_CLIENT["lib/supabase/client.ts"]
    end

    subgraph Backend["백엔드 — FastAPI (localhost:8000)"]
        direction TB
        RT_DESIGN["POST /api/survey/design\n(가설 + 설문 문항 생성)"]
        RT_RUN["POST /api/survey/run\n(가상인구 선별 + 설문 실행)"]
        RT_STATUS["GET /api/survey/{id}/status"]
        RT_RESULT["GET /api/survey/{id}/results"]
    end

    subgraph Logic["분석 로직 (Python)"]
        direction TB
        GEN_LOGIC["generate_logic/\n  step2_logic.py\n  ipf_cache.py\n  kosis_helpers.py\n  excel_export.py"]
        REGIONS["regions/\n  seoul / daegu / gyeongbuk\n  common / base / default\n  sido_codes.py"]
        UTILS["utils/\n  gemini_client.py\n  kosis_client.py\n  ipf_generator.py\n  step2_records.py"]
        CORE["core/\n  db.py\n  constants.py\n  supabase_client.py\n  session_cache.py"]
    end

    subgraph ExternalServices["외부 서비스"]
        SUPABASE["Supabase (PostgreSQL)\n\n기존 테이블:\n  virtual_population_db\n  stats\n  sido_axis_margin_stats\n  kosis_cache\n\nB2C 전용 테이블:\n  users / surveys\n  payments / reports"]
        GEMINI["Google Gemini API\n(Vertex AI / Developer API)\n\n가설 도출\n설문 문항 생성\n응답 분석"]
        KOSIS["KOSIS Open API\n(통계청)\n\n지역별 인구 통계\n시군구 / 성별 / 연령\n소득 / 교육 수준"]
        STRIPE["Stripe\n(건당 결제)"]
        VERCEL["Vercel\n(프론트 배포)"]
        RAILWAY["Railway / Render\n(백엔드 배포)"]
    end

    %% 사용자 → 프론트엔드
    U -->|HTTPS| P_LAND
    U --> P_LOGIN
    U --> P_DESIGN
    U --> P_SURVEY
    U --> P_RESULT

    %% 프론트엔드 내부
    P_DESIGN -->|fetch POST| SURVEY_API
    P_SURVEY -->|fetch GET| SURVEY_API
    P_RESULT -->|fetch GET| SURVEY_API
    P_LOGIN --> AUTH_CB
    AUTH_CB --> SUPABASE_CLIENT

    %% 프론트엔드 → 백엔드
    SURVEY_API -->|HTTP REST\nNEXT_PUBLIC_API_URL=:8000| RT_DESIGN
    SURVEY_API --> RT_RUN
    SURVEY_API --> RT_STATUS
    SURVEY_API --> RT_RESULT

    %% 백엔드 → 분석 로직
    RT_DESIGN --> GEN_LOGIC
    RT_RUN --> GEN_LOGIC
    RT_RUN --> REGIONS
    GEN_LOGIC --> UTILS
    GEN_LOGIC --> CORE
    UTILS --> CORE

    %% 분석 로직 → 외부
    CORE -->|supabase-py| SUPABASE
    UTILS -->|google-genai SDK| GEMINI
    UTILS -->|HTTP requests| KOSIS
    CORE -->|kosis_cache 테이블| SUPABASE

    %% 프론트엔드 → Supabase (인증)
    SUPABASE_CLIENT -->|Auth / RLS| SUPABASE

    %% 결제
    RT_RESULT -.->|Stripe SDK| STRIPE

    %% 배포
    Frontend -.->|배포| VERCEL
    Backend -.->|배포| RAILWAY
```

---

## 데이터 흐름 — 조사 설계 ~ 결과

```mermaid
sequenceDiagram
    actor User as 사용자
    participant FE as Next.js 프론트엔드
    participant BE as FastAPI 백엔드
    participant AI as Gemini API
    participant DB as Supabase
    participant KOSIS as KOSIS API

    User->>FE: 산업분류 + 제품정의 + 조사목적 입력
    FE->>BE: POST /api/survey/design
    BE->>AI: 가설 도출 요청 (Gemini)
    AI-->>BE: hypotheses[] + questions[]
    BE-->>FE: DesignResponse
    FE->>User: 가설 검토 화면 (선택/수정)

    User->>FE: 가설 선택 → 조사 실행
    FE->>BE: POST /api/survey/run {hypotheses, questions, sido, sample_size}
    BE->>DB: virtual_population_db 가상인구 조회
    BE->>KOSIS: 지역별 통계 조회 (캐시 미스 시)
    KOSIS-->>BE: 인구 분포 데이터
    BE->>AI: 가상인구 응답 생성 (Gemini)
    AI-->>BE: 설문 응답 배열
    BE-->>FE: RunResponse {job_id}

    loop 폴링
        FE->>BE: GET /api/survey/{job_id}/status
        BE-->>FE: {status: running | done}
    end

    FE->>BE: GET /api/survey/{job_id}/results
    BE-->>FE: ResultsResponse {results, report, n_respondents}
    FE->>User: 결과 대시보드 렌더링
```

---

## 폴더 구조

```
market_research_b2c_starter/
│
├── frontend/                    ← Next.js 15 (App Router)
│   ├── app/
│   │   ├── page.tsx             - 랜딩 페이지
│   │   ├── login/page.tsx       - Supabase Auth 로그인
│   │   ├── auth/callback/       - OAuth 콜백
│   │   ├── design/page.tsx      - 6단계 조사 설계 UI
│   │   ├── survey/[id]/         - 설문 실행
│   │   ├── results/[id]/        - 결과 대시보드
│   │   └── dashboard/
│   │       ├── user/            - 사용자 대시보드
│   │       └── admin/           - 관리자 대시보드
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Reveal.tsx
│   └── lib/
│       ├── survey-api.ts        - 백엔드 HTTP 클라이언트
│       └── supabase/client.ts   - Supabase 브라우저 클라이언트
│
├── core/                        ← 백엔드 공통 레이어
│   ├── constants.py             - 시도 마스터, 캐시 TTL 등
│   ├── db.py                    - Supabase DB 레이어 (virtual_population_db 청크 관리)
│   ├── supabase_client.py       - Supabase 클라이언트 초기화
│   └── session_cache.py         - 세션 캐시
│
├── generate_logic/              ← 가상인구 생성 핵심 로직
│   ├── step2_logic.py           - 2단계 대입 로직 (IPF 기반)
│   ├── ipf_cache.py             - IPF 결과 캐시
│   ├── kosis_helpers.py         - KOSIS 데이터 변환
│   └── excel_export.py          - 엑셀 내보내기
│
├── regions/                     ← 지역별 가상인구 설정
│   ├── base.py / common.py
│   ├── seoul.py / daegu.py / gyeongbuk.py
│   └── sido_codes.py
│
├── utils/                       ← 외부 서비스 클라이언트
│   ├── gemini_client.py         - Gemini AI (가설 생성, 응답 분석)
│   ├── kosis_client.py          - KOSIS Open API 연동
│   ├── ipf_generator.py         - IPF(반복비례맞춤) 인구 생성
│   └── step2_records.py         - 2단계 기록 관리
│
└── requirements.txt             ← Python 의존성
    (streamlit, supabase, google-genai, pandas, ipfn, pymc 등)
```

---

## 기술 스택 요약

| 계층 | 기술 | 용도 |
|------|------|------|
| 프론트엔드 | Next.js 15 (React, TypeScript) | B2C SaaS UI, App Router |
| 스타일링 | Tailwind CSS | 유틸리티 기반 UI |
| 백엔드 | FastAPI (Python) | REST API 서버 |
| AI | Google Gemini (google-genai) | 가설 도출, 설문 생성, 응답 분석 |
| 데이터베이스 | Supabase (PostgreSQL) | 가상인구 DB, 인증, 캐시 |
| 인구 통계 | KOSIS Open API | 지역별 실제 인구 분포 |
| 가상인구 생성 | IPF (iterative proportional fitting) | 통계 마진 맞춤 인구 합성 |
| 결제 | Stripe | 건당 결제 |
| 프론트 배포 | Vercel | Next.js 최적화 호스팅 |
| 백엔드 배포 | Railway / Render | Python 서버 호스팅 |

---

## 환경 변수

### 프론트엔드 (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 백엔드 (`.env` 또는 Streamlit Secrets)
```
SUPABASE_URL=<supabase_project_url>
SUPABASE_KEY=<supabase_service_key>
GEMINI_API_KEY=<google_ai_api_key>
KOSIS_API_KEY=<kosis_open_api_key>
```
