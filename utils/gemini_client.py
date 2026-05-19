# =============================================================================
from __future__ import annotations
# utils/gemini_client.py — Gemini 호출 공통 레이어 (Vertex AI / Developer API)
# =============================================================================
#
# [이 파일이 하는 일]
#   1) 환경변수·Streamlit Secrets에서 API 키 또는 GCP 자격 증명을 읽고,
#      「API 키만 쓸지 / Vertex를 쓸지」를 분기한다 (use_gemini_developer_api 등).
#   2) google-genai SDK로 Client를 만들고 GeminiClient 클래스에 넣는다.
#   3) 앱 전역에서 쓰는 메서드를 제공한다:
#        - 스트리밍 텍스트(generate_stream)
#        - KOSIS 통계 JSON → 가상인구 대입 규칙 JSON(extract_kosis_assignment_rule)
#        - 시장성 조사: 인터뷰 방식 추천, 패널 추천, 질문 가이드, 1:1 응답, 리포트 분석 등
#
# [연관 파일] utils/gemini_key.py — Secrets·GOOGLE_APPLICATION_CREDENTIALS 경로 보조
# [주의] 민감한 키 값은 로그/예외에 넣지 않는다.
# =============================================================================

import os
import json
from typing import Any, Dict, Optional, Generator

# load_dotenv + GOOGLE_APPLICATION_CREDENTIALS 상대경로 해석 (gemini_key 측에서 처리)
try:
    import utils.gemini_key  # noqa: F401
except Exception:
    pass

# ---------------------------------------------------------------------------
# 모듈 상수: 기본 모델명·사용자에게 보여 줄 설정 안내 문구
# ---------------------------------------------------------------------------
# Vertex 기본 모델(로컬/Vertex 트랙)
VERTEX_DEFAULT_MODEL = "gemini-2.5-flash"
# 배포(API 키/Developer API 트랙) 기본 모델
DEVELOPER_API_DEFAULT_MODEL = "gemini-3.1-flash-lite-preview"
# 하위 호환: 예전 코드·UI에서 DEFAULT_MODEL import 시 Vertex 기본과 동일
DEFAULT_MODEL = VERTEX_DEFAULT_MODEL

VERTEX_AI_SETUP_USER_MESSAGE = (
    "Vertex AI를 쓰려면 GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS(서비스 계정 JSON), "
    "GOOGLE_CLOUD_LOCATION(선택)을 설정하고 GCP에서 Vertex AI API를 사용 설정하세요."
)

GEMINI_DEVELOPER_API_SETUP_MESSAGE = (
    "Streamlit Cloud 등 배포에서는 Secrets에 GEMINI_API_KEY(Google AI Studio / Gemini Developer API 키)를 넣거나, "
    "로컬과 같이 Vertex를 쓰려면 GEMINI_AUTH_MODE=vertex 와 GCP 자격 증명을 설정하세요."
)

# 마지막 자격 증명 로드 실패 시 GeminiClient 오류 메시지에 붙임(민감 값 없음)
VERTEX_LAST_CRED_DIAGNOSTIC: Optional[str] = None


# ---------------------------------------------------------------------------
# 섹션 A. 배포 환경 휴리스틱 · API 키 · Vertex 프로젝트/리전/모델 이름 해석
# ---------------------------------------------------------------------------


def _looks_like_streamlit_cloud() -> bool:
    """Streamlit Community Cloud 등 호스트에서 설정되는 환경 변수 휴리스틱."""
    return bool(
        os.getenv("STREAMLIT_COMMUNITY_CLOUD")
        or os.getenv("STREAMLIT_SHARING")
        or os.getenv("STREAMLIT_SHARING_MODE")
    )


def _resolve_gemini_api_key() -> str:
    """Gemini Developer API(API 키). env → Streamlit Secrets(중첩 키 포함)."""
    for key in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        v = (os.getenv(key) or "").strip()
        if v:
            return v
    try:
        from utils.gemini_key import streamlit_vertex_secret_get

        raw = streamlit_vertex_secret_get(
            "GEMINI_API_KEY", "GOOGLE_API_KEY", "gemini_api_key"
        )
        if raw is not None and not isinstance(raw, dict):
            t = str(raw).strip()
            if t:
                return t
    except Exception:
        pass
    return ""


def use_gemini_developer_api() -> bool:
    """
    True: google-genai · API 키(AI Studio) 경로.

    - GEMINI_AUTH_MODE=vertex → Vertex 강제
    - GEMINI_AUTH_MODE=developer_api | api_key 등 → Developer API 강제
    - Streamlit Cloud 류에서 API 키가 있으면 Developer API(배포 트랙)
    - API 키만 있고 GOOGLE_CLOUD_PROJECT 가 없으면 Developer API(Cloud 환경변수 누락 대비)
    - 그 외(API 키+프로젝트 동시에 있는 로컬) → Vertex 우선
    """
    mode = (os.getenv("GEMINI_AUTH_MODE") or "").strip().lower()
    if mode in ("vertex", "vertex_ai", "gcp"):
        return False
    if mode in ("developer", "developer_api", "api_key", "ai_studio"):
        return True
    if not _resolve_gemini_api_key():
        return False
    if _looks_like_streamlit_cloud():
        return True
    if not _resolve_vertex_project():
        return True
    return False


def _resolve_vertex_project() -> Optional[str]:
    for key in (
        "GOOGLE_CLOUD_PROJECT",
        "GCP_PROJECT",
        "GCLOUD_PROJECT",
        "GEMINI_VERTEX_PROJECT",
    ):
        v = (os.getenv(key) or "").strip()
        if v:
            return v
    try:
        from utils.gemini_key import streamlit_vertex_secret_get

        raw = streamlit_vertex_secret_get(
            "GOOGLE_CLOUD_PROJECT", "GCP_PROJECT", "GEMINI_VERTEX_PROJECT"
        )
        if raw is not None and not isinstance(raw, dict) and str(raw).strip():
            return str(raw).strip()
    except Exception:
        pass
    return None


def _resolve_vertex_location() -> str:
    for key in ("GOOGLE_CLOUD_LOCATION", "GEMINI_VERTEX_LOCATION"):
        v = (os.getenv(key) or "").strip()
        if v:
            return v
    try:
        from utils.gemini_key import streamlit_vertex_secret_get

        raw = streamlit_vertex_secret_get(
            "GOOGLE_CLOUD_LOCATION", "GEMINI_VERTEX_LOCATION"
        )
        if raw is not None and not isinstance(raw, dict) and str(raw).strip():
            return str(raw).strip()
    except Exception:
        pass
    return "us-central1"


def _resolve_vertex_model(model: Optional[str]) -> str:
    if model is not None and str(model).strip():
        return str(model).strip()
    for key in ("GEMINI_MODEL", "GEMINI_VERTEX_MODEL"):
        v = (os.getenv(key) or "").strip()
        if v:
            return v
    try:
        from utils.gemini_key import streamlit_vertex_secret_get

        raw = streamlit_vertex_secret_get("GEMINI_MODEL", "GEMINI_VERTEX_MODEL")
        if raw is not None and not isinstance(raw, dict) and str(raw).strip():
            return str(raw).strip()
    except Exception:
        pass
    return VERTEX_DEFAULT_MODEL


def _resolve_developer_api_model(model: Optional[str]) -> str:
    """Developer API 트랙 모델 해석. 미지정 시 lite preview 기본값 사용."""
    if model is not None and str(model).strip():
        return str(model).strip()
    for key in ("GEMINI_MODEL", "GEMINI_DEVELOPER_MODEL"):
        v = (os.getenv(key) or "").strip()
        if v:
            return v
    try:
        from utils.gemini_key import streamlit_vertex_secret_get

        raw = streamlit_vertex_secret_get("GEMINI_MODEL", "GEMINI_DEVELOPER_MODEL")
        if raw is not None and not isinstance(raw, dict) and str(raw).strip():
            return str(raw).strip()
    except Exception:
        pass
    return DEVELOPER_API_DEFAULT_MODEL


def _vertex_adc_from_metadata_ok() -> bool:
    """Cloud Run·GAE·Functions 등 GCE 메타데이터(워크로드 자격 증명)를 쓸 수 있는 런타임."""
    return bool(
        os.getenv("K_SERVICE")
        or os.getenv("GOOGLE_CLOUD_RUN_JOB")
        or os.getenv("GAE_SERVICE")
        or os.getenv("FUNCTION_TARGET")
    )


def _parse_service_account_secret_raw(raw: Any) -> tuple[Optional[dict], Optional[str]]:
    """Streamlit Secrets에서 읽은 원본 → (service_account dict, 오류설명). 민감 값 미포함."""
    if raw is None:
        return None, "GCP_SERVICE_ACCOUNT_JSON 키가 없거나 비어 있습니다."
    if isinstance(raw, dict):
        if raw.get("type") == "service_account" or "private_key" in raw:
            return raw, None
        return None, "서비스 계정 JSON 객체가 아닙니다(type·private_key 확인)."
    s = str(raw).strip()
    if not s:
        return None, "GCP_SERVICE_ACCOUNT_JSON 값이 비어 있습니다."
    if s.startswith("\ufeff"):
        s = s.lstrip("\ufeff")
    try:
        info = json.loads(s)
    except json.JSONDecodeError as e:
        return (
            None,
            f"GCP_SERVICE_ACCOUNT_JSON JSON 파싱 실패({e.__class__.__name__}). "
            "TOML에서는 키 앞 공백 없이, JSON은 \"\"\" ... \"\"\" 로 감싸세요.",
        )
    except Exception as e:
        return None, f"JSON 처리 오류: {e.__class__.__name__}"
    if not isinstance(info, dict):
        return None, "파싱 결과가 객체가 아닙니다."
    if info.get("type") != "service_account" and "private_key" not in info:
        return None, "서비스 계정 JSON 형식이 아닙니다."
    return info, None


def _resolve_vertex_service_account_credentials() -> Optional[Any]:
    """
    서비스 계정 JSON 파일(GOOGLE_APPLICATION_CREDENTIALS) 또는 Streamlit secrets의
    GCP_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS_JSON 에서 Credentials 로드.
    없으면 None (이후 ADC → 비 GCE에서는 metadata.google.internal 타임아웃 유발).
    """
    global VERTEX_LAST_CRED_DIAGNOSTIC
    VERTEX_LAST_CRED_DIAGNOSTIC = None
    try:
        from utils.gemini_key import refresh_streamlit_vertex_credentials_from_secrets

        refresh_streamlit_vertex_credentials_from_secrets()
    except Exception:
        pass
    from google.oauth2 import service_account

    scopes = ("https://www.googleapis.com/auth/cloud-platform",)
    path = (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if path and os.path.isfile(path):
        try:
            return service_account.Credentials.from_service_account_file(path, scopes=scopes)
        except Exception as e:
            VERTEX_LAST_CRED_DIAGNOSTIC = f"서비스 계정 파일 로드 실패: {e.__class__.__name__}"
            return None
    try:
        from utils.gemini_key import streamlit_vertex_secret_get

        raw = streamlit_vertex_secret_get(
            "GCP_SERVICE_ACCOUNT_JSON", "GOOGLE_APPLICATION_CREDENTIALS_JSON"
        )
        info, err = _parse_service_account_secret_raw(raw)
        if err:
            VERTEX_LAST_CRED_DIAGNOSTIC = err
            return None
        assert info is not None
        return service_account.Credentials.from_service_account_info(info, scopes=scopes)
    except Exception as e:
        VERTEX_LAST_CRED_DIAGNOSTIC = VERTEX_LAST_CRED_DIAGNOSTIC or f"{e.__class__.__name__}"
        return None


def gemini_runtime_configured() -> bool:
    """
    Developer API: GEMINI_API_KEY 있으면 True.
    Vertex: 프로젝트 + 서비스 계정(또는 GCP 런타임 ADC).
    """
    if use_gemini_developer_api():
        return bool(_resolve_gemini_api_key())
    if not _resolve_vertex_project():
        return False
    if _vertex_adc_from_metadata_ok():
        return True
    return _resolve_vertex_service_account_credentials() is not None


# ---------------------------------------------------------------------------
# 섹션 B. generate_content 응답에서 본문 문자열만 안정적으로 꺼내기
#          (response.text 가 비어 있어도 candidates[].content.parts 를 훑음)
# ---------------------------------------------------------------------------


def _deep_collect_part_texts(obj: Any, out: list[str], depth: int = 0) -> None:
    """model_dump 트리에서 text/thought 등 본문 문자열 수집 (SDK·모델 버전별 Part 구조 차이 대비)."""
    if depth > 12 or obj is None:
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("text", "thought") and isinstance(v, str) and v.strip():
                out.append(v.strip())
            else:
                _deep_collect_part_texts(v, out, depth + 1)
    elif isinstance(obj, list):
        for x in obj:
            _deep_collect_part_texts(x, out, depth + 1)
    elif hasattr(obj, "model_dump"):
        try:
            _deep_collect_part_texts(obj.model_dump(mode="python"), out, depth + 1)
        except Exception:
            pass


def extract_generate_content_text(response: Any) -> tuple[str, str]:
    """
    google-genai `generate_content` 응답에서 본문만 추출.
    일부 환경에서 `response.text`가 None인데 candidates.parts에는 텍스트가 있는 경우가 있어
    페르소나/현시대 반영 등에서 빈 결과로 처리되지 않도록 한다.
    반환: (text, diagnostic) — text가 비면 diagnostic에 원인 힌트(디버깅·UI용).
    """
    if response is None:
        return "", "response_none"

    try:
        pf = getattr(response, "prompt_feedback", None)
        if pf is not None:
            br = getattr(pf, "block_reason", None)
            if br is not None and str(br).strip() and str(br).upper() not in ("BLOCK_REASON_UNSPECIFIED", "UNSPECIFIED"):
                return "", f"prompt_block:{br!s}"[:280]
    except Exception:
        pass

    try:
        raw = getattr(response, "text", None)
        if raw is not None and str(raw).strip():
            return str(raw).strip(), ""
    except Exception:
        pass

    try:
        parts = getattr(response, "parts", None) or []
        buf: list[str] = []
        for p in parts:
            if p is None:
                continue
            pt = getattr(p, "text", None)
            if pt:
                buf.append(str(pt))
        joined = "".join(buf).strip()
        if joined:
            return joined, ""
    except Exception:
        pass

    try:
        cands = getattr(response, "candidates", None) or []
        if not cands:
            pf = getattr(response, "prompt_feedback", None)
            return "", f"no_candidates:{pf!s}"[:280]
        buf: list[str] = []
        for cand in cands:
            content = getattr(cand, "content", None)
            if not content:
                continue
            for p in getattr(content, "parts", None) or []:
                if p is None:
                    continue
                pt = getattr(p, "text", None)
                if pt:
                    buf.append(str(pt).strip())
                elif hasattr(p, "model_dump"):
                    try:
                        deep: list[str] = []
                        _deep_collect_part_texts(p.model_dump(mode="python"), deep)
                        buf.extend(deep)
                    except Exception:
                        pass
        joined = " ".join(dict.fromkeys([b for b in buf if b])).strip()
        if joined:
            return joined, ""
        try:
            dumped_all = response.model_dump(mode="python")
            deep_all: list[str] = []
            _deep_collect_part_texts((dumped_all or {}).get("candidates"), deep_all)
            joined2 = " ".join(dict.fromkeys(deep_all)).strip()
            if joined2:
                return joined2, ""
        except Exception:
            pass
        fr = getattr(cands[0], "finish_reason", None)
        return "", f"no_text_parts finish_reason={fr!s}"[:280]
    except Exception as e:
        return "", f"parse_err:{type(e).__name__}"[:280]


# =============================================================================
# 섹션 C. GeminiClient — 클라이언트 생성 + 도메인별 고수준 메서드
# =============================================================================
#   __init__       : Developer API(키) 또는 Vertex(프로젝트+자격증명) 로 genai.Client 생성
#   generate_stream: 채팅·스트리밍 UI용 청크 yield
#   extract_kosis_*: 가상인구 생성 탭의 KOSIS 통계 구조 분석 → JSON 규칙
#   recommend_*     : 설문(시장성 조사) 심층면접 플로우
# =============================================================================


class GeminiClient:
    """
    google-genai 기반 단일 진입점.

    - 로컬·GCP: Vertex AI (프로젝트 + 서비스 계정 JSON 또는 런타임 ADC)
    - Streamlit Cloud·HF 등: GEMINI_API_KEY → Gemini Developer API

    model_name 프로퍼티로 현재 모델 문자열을 UI에 표시할 수 있다.
    """

    def __init__(self, model: Optional[str] = None):
        from google import genai
        from google.genai import types

        self._generation_config = types.GenerateContentConfig(max_output_tokens=8192)
        self._genai = genai

        if use_gemini_developer_api():
            api_key = _resolve_gemini_api_key()
            if not api_key:
                raise RuntimeError(
                    f"{GEMINI_DEVELOPER_API_SETUP_MESSAGE} "
                    "(원인: GEMINI_API_KEY 를 찾지 못했습니다.)"
                )
            self._use_vertex = False
            self._model = _resolve_developer_api_model(model)
            self._client = genai.Client(api_key=api_key)
            self._key_source = "Gemini Developer API (API key)"
            return

        self._use_vertex = True
        self._model = _resolve_vertex_model(model)
        project = _resolve_vertex_project()
        location = _resolve_vertex_location()
        if not project:
            raise RuntimeError(
                f"{VERTEX_AI_SETUP_USER_MESSAGE} "
                "(원인: 프로젝트 ID를 환경·Secrets에서 읽지 못했습니다. "
                "최상위 GOOGLE_CLOUD_PROJECT 또는 [vertex] 등 하위 블록 이름을 확인하세요. "
                "배포에서 API 키만 쓰려면 GEMINI_API_KEY 를 Secrets에 넣으세요.)"
            )

        sa_creds = _resolve_vertex_service_account_credentials()
        if sa_creds is None and not _vertex_adc_from_metadata_ok():
            extra = (VERTEX_LAST_CRED_DIAGNOSTIC or "").strip()
            raise RuntimeError(
                f"{VERTEX_AI_SETUP_USER_MESSAGE}"
                + (f" (원인: {extra})" if extra else "")
                + " 배포에서 Vertex 대신 AI Studio 키를 쓰려면 GEMINI_API_KEY 만 설정하세요."
            )

        self._key_source = f"Vertex AI (project={project}, location={location})"
        client_kw: Dict[str, Any] = dict(
            vertexai=True,
            project=project,
            location=location,
        )
        if sa_creds is not None:
            client_kw["credentials"] = sa_creds
        self._client = genai.Client(**client_kw)

    # ----- 공통: 모델명 표시 -----

    @property
    def model_name(self) -> str:
        """현재 사용 중인 모델명 반환 (UI 표시·디버깅용)."""
        return self._model

    # ----- 스트리밍 생성 (대화 UI 등) -----

    def generate_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
    ) -> Generator[str, None, None]:
        """
        스트리밍으로 텍스트 생성. 청크를 yield 하므로 st.write_stream() 등에 그대로 전달 가능.
        - prompt: 전송할 프롬프트 문자열.
        - model: None이면 self._model 사용. 복잡한 추론 시 'gemini-2.5-pro' 등 지정 가능.
        """
        use_model = model if model else self._model
        stream = self._client.models.generate_content_stream(
            model=use_model,
            contents=prompt,
            config=self._generation_config,
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text

    # ----- 가상인구 생성 파이프라인: KOSIS 원천 → 행별 대입 규칙 JSON -----

    def extract_kosis_assignment_rule(
        self,
        *,
        category_code: str,
        stat_name: str,
        kosis_url: str,
        kosis_data_sample: Any,
        axis_keys_kr: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        목적:
        - KOSIS 원천 구조가 통계마다 다르므로, Gemini가 '개인(6축) -> 어떤 차원 매칭 -> 어떤 값/범주 샘플링' 규칙을 JSON으로 반환하도록 강제

        반환 JSON 예시(형태만 예시, 통계별로 달라질 수 있음):
        {
          "mode": "categorical_sampling" | "numeric_lookup" | "score_sampling",
          "dimensions": {
             "sigungu": {"source": "...", "mapping": {...}},
             "gender": {"source": "...", "mapping": {...}},
             ...
          },
          "value_field_candidates": ["DT", "DATA", ...],
          "label_fields": ["ITM_NM","C1_NM",...],
          "notes": "..."
        }
        """

        prompt = f"""
너는 KOSIS 통계 JSON을 분석해 가상개인 데이터프레임에 값을 대입하는 규칙을 설계하는 분석가임.
목표는 '통계마다 구조가 다름'을 전제로 자동 규칙을 만든 뒤 코드가 그 규칙대로 개인별 값을 넣는 것임.

[입력 정보]
- category_code: {category_code}
- stat_name: {stat_name}
- kosis_url: {kosis_url}
- 6축(개인 속성) 한글 키: {json.dumps(axis_keys_kr, ensure_ascii=False)}
- kosis_data_sample: 아래 JSON 샘플 참고

[요구]
1) 이 통계가 개인별로 어떤 값 생성이 적절한지 mode를 결정
   - categorical_sampling: 범주형 응답(예: 만족/불만족, 의사 등) 확률분포 샘플링
   - numeric_lookup: 조건에 맞는 수치(비율/명/금액 등) 조회 후 대입
   - score_sampling: 점수형으로 변환 후 샘플링
2) KOSIS JSON에서 차원/라벨 필드 후보를 식별
3) 6축(거주지역, 성별, 연령, 경제활동, 교육, 월평균소득)을 KOSIS 차원에 매칭하는 방법을 제시
4) 반드시 JSON만 출력 (설명 문장 출력 금지)

[kosis_data_sample]
{json.dumps(kosis_data_sample, ensure_ascii=False)[:12000]}
"""

        resp = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=self._generation_config,
        )

        text = (resp.text or "").strip()
        # 모델이 JSON 외 텍스트를 섞는 경우를 대비한 최소한의 방어
        try:
            return json.loads(text)
        except Exception:
            # JSON 덩어리만 추출 시도
            l = text.find("{")
            r = text.rfind("}")
            if l >= 0 and r > l:
                return json.loads(text[l : r + 1])
            raise RuntimeError(f"Gemini rule JSON 파싱 실패. raw={text[:500]}")

    # ----- 시장성 조사 설계 (pages/survey 등): 인터뷰 방식·패널·가이드·응답·리포트 -----

    INTERVIEW_METHODS = [
        "FGI (Focus Group Interview)",
        "FGD (Focus Group Discussion)",
        "IDI (Individual Depth Interview)",
    ]

    def recommend_interview_method(self, definition: str, needs: str) -> tuple[str, str]:
        """
        제품/서비스 정의(definition)와 조사 목적·니즈(needs)를 바탕으로
        FGI / FGD / IDI 중 가장 적합한 인터뷰 방식을 추천하고 이유를 반환.
        반환: (방식_전체문자열, 이유_한줄)
        """
        definition = (definition or "").strip()
        needs = (needs or "").strip()
        if not definition or not needs:
            return self.INTERVIEW_METHODS[0], "입력 정보가 부족해 기본값(FGI)을 추천합니다."

        prompt = f"""다음은 조사 의뢰자가 적은 '제품/서비스 정의'와 '조사의 목적과 니즈'입니다.
이 내용에 가장 적합한 심층면접 방식을 아래 세 가지 중 **정확히 하나**만 골라 주세요.

[방식 종류]
- FGI (Focus Group Interview): 진행자 주도로 소수(6~12명) 대상 그룹 인터뷰. 가이드라인에 따른 질문·청취, 공통 인식/패턴 파악에 유리.
- FGD (Focus Group Discussion): FGI와 유사하나 진행자 개입 최소화, 참여자 간 자유 토론·상호작용으로 데이터 도출. 집단 역학, 의견 충돌/보완 관찰에 유리.
- IDI (Individual Depth Interview): 연구자와 대상자 1:1 대면. 민감한 주제·개인 경험, 무의식적 반응·복잡한 동기 심층 탐구에 적합.

[입력]
제품/서비스 정의:
{definition[:2000]}

조사의 목적과 니즈:
{needs[:2000]}

[출력 형식] 반드시 아래 두 줄만 출력하세요. 다른 설명 금지.
첫 줄: FGI (Focus Group Interview) 또는 FGD (Focus Group Discussion) 또는 IDI (Individual Depth Interview) (위 세 문장 중 정확히 하나)
둘째 줄: 추천 이유를 한 문장(100자 이내)으로만 작성
"""

        resp = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=self._generation_config,
        )
        text = (resp.text or "").strip()
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        chosen = self.INTERVIEW_METHODS[0]
        reason = "입력 내용을 바탕으로 해당 방식을 추천합니다."
        for ln in lines:
            for m in self.INTERVIEW_METHODS:
                if m in ln or m.split(" ")[0] in ln:
                    chosen = m
                    break
        if len(lines) >= 2:
            reason = lines[1][:200]
        elif len(lines) == 1 and "추천" not in lines[0] and chosen != lines[0]:
            reason = lines[0][:200]
        return chosen, reason

    def recommend_interview_panel(
        self,
        definition: str,
        needs: str,
        interview_type: str,
        panel_list: list[Dict[str, Any]],
        *,
        max_panel_entries: int = 80,
    ) -> tuple[list[Any], str]:
        """
        제품/서비스 정의·조사 목적·니즈에 맞는 심층면접용 가상인구를 추천.
        - panel_list: [{"idx": int, "name": str, "age": str, "gender": str, "region": str, "persona": str}, ...]
        - IDI면 1명, FGI/FGD면 6~12명의 idx 목록과 추천 이유를 반환.
        반환: (추천 idx 리스트, 이유 한 줄)
        """
        definition = (definition or "").strip()
        needs = (needs or "").strip()
        interview_type = (interview_type or "").strip() or "FGI (Focus Group Interview)"
        if not panel_list:
            return [], "가상인구 목록이 비어 있어 추천할 수 없습니다."
        entries = panel_list[:max_panel_entries]
        is_idi = "IDI" in interview_type
        want_n = 1 if is_idi else 10  # FGI/FGD는 6~12명이면 되므로 10명까지 추천 가능

        lines = []
        for i, p in enumerate(entries):
            idx = p.get("idx", i)
            name = p.get("name", "")
            age = p.get("age", "")
            gender = p.get("gender", "")
            region = p.get("region", "")
            persona = (p.get("persona") or "")[:300]
            lines.append(f"[{idx}] {name} | {age}세 {gender} {region} | {persona}")
        panel_text = "\n".join(lines)

        n_ask = "정확히 1명" if is_idi else "6명 이상 12명 이하"
        prompt = f"""다음은 조사 의뢰자가 적은 '제품/서비스 정의'와 '조사의 목적·니즈', 그리고 선택한 심층면접 방식입니다.
이 조사에 **가장 적합한 가상인구**를 아래 후보 목록에서 골라 주세요.

[심층면접 방식] {interview_type}
[제품/서비스 정의]
{definition[:2000]}

[조사의 목적과 니즈]
{needs[:2000]}

[가상인구 후보] (각 줄 앞 [숫자]가 해당 인물의 고유 번호입니다)
{panel_text}

[출력 형식] 반드시 아래만 지키세요.
1) 첫 줄: "추천 이유:" 로 시작해 한 문장(150자 이내)으로 추천 이유만 작성
2) 둘째 줄: "추천 번호:" 로 시작해 위 후보의 [숫자]만 콤마로 구분해 나열 (예: 추천 번호: 42, 17, 89). 추천 인원은 {n_ask}만 선택하세요.
다른 설명이나 번호 외 문자 없이 두 줄만 출력하세요."""

        try:
            resp = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=self._generation_config,
            )
            text = (resp.text or "").strip()
            reason = ""
            recommended_indices = []
            for ln in text.splitlines():
                ln = ln.strip()
                if not ln:
                    continue
                if "추천 이유:" in ln or ln.startswith("추천 이유:"):
                    reason = ln.replace("추천 이유:", "").strip()[:200]
                elif "추천 번호:" in ln or ln.startswith("추천 번호:"):
                    rest = ln.replace("추천 번호:", "").strip()
                    for part in rest.split(","):
                        part = part.strip()
                        try:
                            num = int(part)
                            if num not in recommended_indices:
                                recommended_indices.append(num)
                        except ValueError:
                            continue
            idx_set = {p.get("idx") for p in entries}
            recommended_indices = [x for x in recommended_indices if x in idx_set]
            if is_idi and len(recommended_indices) > 1:
                recommended_indices = recommended_indices[:1]
            elif not is_idi and len(recommended_indices) > 12:
                recommended_indices = recommended_indices[:12]
            if not reason:
                reason = "제품·조사 목적에 맞는 가상인구를 추천했습니다."
            return recommended_indices, reason
        except Exception as e:
            return [], f"추천 생성 중 오류: {e}"

    def generate_interview_questions(
        self,
        interview_type: str,
        definition: str,
        needs: str,
    ) -> str:
        """
        선택한 인터뷰 방식(FGI/FGD/IDI)에 따른 질문 방식(Questioning Style)을 반영하여
        제품 정의·시장성 조사 목적·니즈를 검토한 맞춤형 모더레이터 질문 가이드를 생성.
        """
        definition = (definition or "").strip()
        needs = (needs or "").strip()
        interview_type = (interview_type or "").strip() or "FGI (Focus Group Interview)"

        method_style = ""
        if "FGI" in interview_type:
            method_style = """
[FGI 전용 질문 방식 – 정보 수집을 위한 구조적 질의 (Structured Inquiry)]
- 사전 설계된 가이드라인을 엄격히 준수하고, 특정 주제에 대한 명확한 응답을 위해 **구체적·직접적 질문**을 사용하세요.
- 모더레이터는 '답변 수집가' 역할로, 논점 일탈을 막고 효율적으로 정보를 추출하는 데 집중합니다.
- **직접적 질문(Direct Questioning)**: "이 기능의 장점은 무엇인가?"처럼 답변 범위를 명확히 한정하여 혼란을 최소화합니다.
- **순차적 진행(Sequential Flow)**: 참여자 전원의 의견을 고르게 청취하기 위해 개별 지명 질문을 활용하고 발언권을 통제합니다.
- **확인 및 요약**: 모호한 답변에는 "방금 말씀하신 내용은 A라는 의미인가?"처럼 재확인하여 데이터 정확성을 확보합니다.
"""
        elif "FGD" in interview_type:
            method_style = """
[FGD 전용 질문 방식 – 상호작용 촉발을 위한 자극제 제시 (Stimulation for Interaction)]
- 구체적 답변 요구보다 **참여자 간 대화·논쟁을 유발하는 포괄적 화두나 시나리오**를 제시하세요.
- 모더레이터는 '촉진자'로서 질문자보다 토론의 심판·관찰자 위치에서 **개입을 최소화**합니다.
- **연결형 질문(Linking)**: "A님의 의견에 대해 B님은 어떻게 생각하나요?"처럼 참여자 간 관계를 잇는 질문을 주로 사용합니다.
- **투사법 활용(Projective Technique)**: "만약 이 브랜드가 사람이라면 어떤 성격일까요?"처럼 우회적 질문으로 잠재 인식을 표출시킵니다.
- **갈등 조장 및 심화**: 의견이 대립할 때 봉합하지 말고 "왜 의견 차이가 발생하는지"를 질문하여 집단 역학을 관찰합니다.
"""
        else:
            method_style = """
[IDI 전용 질문 방식 – 본질 규명을 위한 심층 탐구 (Deep Probing)]
- 대상자 답변에 따라 **유연하게 후속 질문을 이어가는 래더링(Laddering)**으로 표면적 행동 이면의 근본 동기를 파헤칩니다.
- 모더레이터는 '상담가'처럼 라포(Rapport)를 형성하고, 심리적 방어 기제를 해제시키는 질문을 구사합니다.
- **속성-혜택-가치 연결(Laddering)**: "왜 그 점이 중요한가?"를 반복 질문하여 제품 속성을 개인의 핵심 가치관과 연결합니다.
- **유연한 추적(Flexible Tracing)**: 준비된 질문 순서에 얽매이지 않고, 대상자의 의식 흐름(Flow)을 따라가며 돌발 인사이트를 포착합니다.
- **침묵의 활용**: 답변을 재촉하지 않고 침묵을 견디거나 비언어적 신호를 관찰하여 무의식적 반응을 이끌어냅니다.
"""

        prompt = f"""당신은 질적 연구 및 심층면접 설계 전문가입니다. **질문 방식(Questioning Style)**은 데이터의 성격을 결정하는 핵심 통제 변수이므로, 방법론별 구조적 특성에 따라 질문의 개방성·개입 빈도·탐구 깊이를 차별화해야 합니다.

아래 **제품 정의**와 **시장성 조사 목적·니즈**를 검토한 뒤, 선택한 인터뷰 방식에 특화된 **모더레이터 질문 가이드**를 작성해 주세요.

[입력 정보]
- 인터뷰 방식: {interview_type}
- 제품/서비스 정의: {definition[:1500]}
- 조사의 목적과 니즈(시장성 조사): {needs[:1500]}
{method_style}

[공통 요구사항]
1. 질문 개수는 **20개 내외**로 작성하세요.
2. 논리적 흐름으로 **섹션**을 구분하세요: 도입(오프닝) → 본론(상세 탐구, 조사 목적에 맞게 소제목 사용) → 마무리.
3. 위에서 제시한 해당 방식의 질문 스타일을 반드시 반영하여, **그 방식만의 톤과 기법**이 드러나도록 질문을 구체적으로 작성하세요.
4. 출력은 **Markdown 형식**만 사용하세요. 각 섹션은 ## 또는 ### 제목으로, 질문은 번호 목록(1. 2. ...) 또는 - 로 나열하세요.
5. 다른 설명 문단 없이, 질문 가이드 본문만 출력하세요.

[출력 예시 형식]
## 도입 (오프닝)
1. (방식에 맞는 오프닝 질문)
2. ...

## 본론 - (소제목)
...

## 마무리
...
"""

        resp = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=self._generation_config,
        )
        return (resp.text or "").strip()

    def generate_interview_answer(
        self,
        question_text: str,
        person: Dict[str, Any],
        interview_type: str = "FGI",
    ) -> str:
        """
        심층면접 질문에 대해 한 명의 가상 패널이 답하는 내용을 생성.
        person: 가상이름, 연령, 성별, 거주지역, 경제활동, 교육정도, 월평균소득, 페르소나, 현시대 반영 등.
        진짜 사람이 말하듯 상세하고 자연스러운 대답을 반환.
        """
        name = person.get("가상이름", "응답자")
        age = person.get("연령", "")
        gender = person.get("성별", "")
        region = person.get("거주지역", "")
        econ = person.get("경제활동", "")
        edu = person.get("교육정도", "")
        income = person.get("월평균소득", "")
        persona = (person.get("페르소나") or "").strip() or "(없음)"
        reflection = (person.get("현시대 반영") or "").strip() or "(없음)"

        profile = f"""
- 이름: {name}
- 연령: {age}세
- 성별: {gender}
- 거주지역: {region}
- 경제활동: {econ}
- 교육정도: {edu}
- 월평균소득: {income}
- 페르소나: {persona}
- 현시대 반영(관심·트렌드 키워드): {reflection}
""".strip()

        prompt = f"""당신은 심층면접에서 한 명의 응답자가 모더레이터 질문에 답하는 장면을 재현하는 역할을 합니다.

[가상 응답자 프로필]
{profile}

[모더레이터 질문]
{question_text}

[요구사항]
1. 위 프로필과 페르소나, 현시대 반영을 바탕으로 **이 인물이 실제로 말할 법한** 답변을 작성하세요.
2. 진짜 사람이 심층면접에 참여한 것처럼 **구체적이고 상세하게** 답하세요. (2~5문장 이상, 상황에 따라 더 길게)
3. 말투는 자연스럽고, 개인 경험·감정·의견이 드러나도록 하세요. 단순한 예/아니오가 아닌 서술형으로.
4. 다른 설명 없이 **응답자의 대답 본문만** 출력하세요.
"""
        try:
            resp = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=self._generation_config,
            )
            return (resp.text or "").strip()
        except Exception:
            return "(응답 생성 중 오류가 발생했습니다.)"

    def generate_interview_report_analysis(
        self,
        questions_answers: list,
        interview_type: str = "FGI",
    ) -> Dict[str, str]:
        """
        심층면접 질문별 패널 응답 전체를 바탕으로 상세분석·결론 및 시사점 생성.
        questions_answers: [ {"question": str, "answers": [ {"name": str, "answer": str } ] }, ... ]
        반환: {"상세분석": str, "결과및전략": str}
        """
        lines = []
        for i, qa in enumerate(questions_answers[:30], 1):
            q = qa.get("question", "")
            answers = qa.get("answers", [])
            lines.append(f"[질문 {i}] {q}")
            for a in answers:
                name = a.get("name", "응답자")
                ans = a.get("answer", "")
                lines.append(f"  - {name}: {ans[:500]}{'…' if len(ans) > 500 else ''}")
            lines.append("")
        context = "\n".join(lines)

        prompt = f"""다음은 심층면접에서 모더레이터 질문에 대한 가상 패널 응답 요약입니다.

{context[:12000]}

위 내용을 바탕으로 다음 두 가지를 작성해 주세요.

1. **상세분석**: 공통 패턴, 의견 차이, 핵심 인사이트, 타깃 그룹별 특성 등을 3~5문단으로 정리.
2. **결론 및 시사점**: 종합 결론, 시장성·수요에 대한 시사점, 실행 방안을 2~4문단으로 제안.

출력 형식 (따옴표 없이):
---
[상세분석]
(내용)

[결론 및 시사점]
(내용)
---
"""
        try:
            resp = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=self._generation_config,
            )
            text = (resp.text or "").strip()
            상세분석 = ""
            결과및전략 = ""
            if "[상세분석]" in text and "[결론 및 시사점]" in text:
                parts = text.split("[결론 및 시사점]", 1)
                상세분석 = parts[0].replace("[상세분석]", "").strip()
                결과및전략 = parts[1].strip() if len(parts) > 1 else ""
            elif "---" in text:
                parts = text.split("---")
                if len(parts) >= 2:
                    상세분석 = parts[1].strip()
                if len(parts) >= 3:
                    결과및전략 = parts[2].strip()
            else:
                상세분석 = text[:4000]
                결과및전략 = text[4000:] if len(text) > 4000 else ""
            return {"상세분석": 상세분석, "결과및전략": 결과및전략}
        except Exception:
            return {"상세분석": "", "결과및전략": ""}
