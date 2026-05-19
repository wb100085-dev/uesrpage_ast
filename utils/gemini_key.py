# utils/gemini_key.py
from __future__ import annotations
# - dotenv 로드 + GOOGLE_APPLICATION_CREDENTIALS 상대 경로를 프로젝트 루트 기준으로 절대 경로화
# - Vertex 자격 증명 + Streamlit Secrets 의 GEMINI_API_KEY (utils/gemini_client.GeminiClient 가 경로 선택)

import os
from typing import Any, Optional

_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


# Streamlit Cloud에서 [vertex] 등 하위 테이블·키 앞 공백도 찾기 위한 서브그룹 이름
_STREAMLIT_VERTEX_SUBGROUPS = (
    "vertex",
    "gcp",
    "google",
    "google_cloud",
    "GOOGLE",
    "GCP",
    "GEMINI",
)


def _secret_get_case_insensitive(container: object, name: str) -> Optional[Any]:
    if container is None or not name:
        return None
    try:
        getter = getattr(container, "get", None)
        if callable(getter):
            v = getter(name)
            if v is not None:
                return v
    except Exception:
        pass
    try:
        keys = getattr(container, "keys", None)
        if callable(keys):
            for k in keys():
                if str(k).strip().lower() == name.strip().lower():
                    return getter(k) if callable(getter) else None
    except Exception:
        pass
    return None


def streamlit_vertex_secret_get(*names: str) -> Optional[Any]:
    """
    최상위 키 + [vertex]·[gcp] 등 하위 dict 에서 Vertex 관련 값 조회.
    키 이름 앞뒤 공백·대소문자 차이를 완화한다.
    """
    try:
        import streamlit as st

        s = getattr(st, "secrets", None)
        if not s:
            return None
        for name in names:
            v = _secret_get_case_insensitive(s, name)
            if v is not None:
                return v
        for g in _STREAMLIT_VERTEX_SUBGROUPS:
            sub = _secret_get_case_insensitive(s, g)
            if isinstance(sub, dict):
                for name in names:
                    v = _secret_get_case_insensitive(sub, name)
                    if v is not None:
                        return v
        return None
    except Exception:
        return None


def _streamlit_secrets_into_environ() -> None:
    """Streamlit secrets 를 os.environ에 반영(미설정된 키만). 중첩·별칭 키 지원."""
    try:
        import streamlit as st

        if not getattr(st, "secrets", None):
            return

        def _set_if_empty(env_key: str, *secret_names: str) -> None:
            if os.getenv(env_key):
                return
            v = streamlit_vertex_secret_get(*secret_names)
            if v is None or isinstance(v, dict):
                return
            t = str(v).strip()
            if t:
                os.environ[env_key] = t

        _set_if_empty("GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT", "GCP_PROJECT", "GEMINI_VERTEX_PROJECT")
        _set_if_empty("GCP_PROJECT", "GCP_PROJECT", "GOOGLE_CLOUD_PROJECT", "GEMINI_VERTEX_PROJECT")
        _set_if_empty("GEMINI_VERTEX_PROJECT", "GEMINI_VERTEX_PROJECT", "GOOGLE_CLOUD_PROJECT", "GCP_PROJECT")
        _set_if_empty("GOOGLE_CLOUD_LOCATION", "GOOGLE_CLOUD_LOCATION", "GEMINI_VERTEX_LOCATION")
        _set_if_empty("GEMINI_VERTEX_LOCATION", "GEMINI_VERTEX_LOCATION", "GOOGLE_CLOUD_LOCATION")
        _set_if_empty("GEMINI_MODEL", "GEMINI_MODEL", "GEMINI_VERTEX_MODEL")
        _set_if_empty("GEMINI_VERTEX_MODEL", "GEMINI_VERTEX_MODEL", "GEMINI_MODEL")
        _set_if_empty("GOOGLE_APPLICATION_CREDENTIALS", "GOOGLE_APPLICATION_CREDENTIALS")
        _set_if_empty("GEMINI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "gemini_api_key")
        _set_if_empty("GOOGLE_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY")

        for k in (
            "GOOGLE_CLOUD_PROJECT",
            "GCP_PROJECT",
            "GEMINI_VERTEX_PROJECT",
            "GOOGLE_CLOUD_LOCATION",
            "GEMINI_VERTEX_LOCATION",
            "GEMINI_MODEL",
            "GEMINI_VERTEX_MODEL",
            "GOOGLE_APPLICATION_CREDENTIALS",
        ):
            if os.getenv(k):
                continue
            v = _secret_get_case_insensitive(st.secrets, k)
            if v is None or isinstance(v, dict):
                continue
            t = str(v).strip()
            if t:
                os.environ[k] = t
    except Exception:
        pass


def _resolve_relative_google_application_credentials() -> None:
    """GOOGLE_APPLICATION_CREDENTIALS가 상대 경로면 프로젝트 루트 기준(실행 cwd와 무관)."""
    _cred = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if _cred and not os.path.isabs(_cred):
        _abs_cred = os.path.normpath(os.path.join(_ROOT_DIR, _cred))
        if os.path.isfile(_abs_cred):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _abs_cred


_streamlit_secrets_into_environ()
_resolve_relative_google_application_credentials()


def _drop_google_application_credentials_if_missing_file() -> None:
    """
    Secrets에 로컬 PC 경로만 넣은 채 배포하면 서버에 파일이 없어 ADC만 시도하게 됨.
    잘못된 경로는 env에서 제거해 GCP_SERVICE_ACCOUNT_JSON 임시 파일 적용이 가능하게 함.
    """
    p = (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if not p:
        return
    if not os.path.isfile(p):
        os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)


def _apply_streamlit_service_account_json_from_secrets() -> None:
    """Streamlit Secrets에 JSON 본문만 넣는 경우(클라우드 배포 등) 임시 파일로 풀어 GOOGLE_APPLICATION_CREDENTIALS 설정."""
    existing = (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if existing and os.path.isfile(existing):
        return
    try:
        import json
        import tempfile

        raw = streamlit_vertex_secret_get(
            "GCP_SERVICE_ACCOUNT_JSON", "GOOGLE_APPLICATION_CREDENTIALS_JSON"
        )
        if not raw:
            return
        if isinstance(raw, dict):
            data = raw
        else:
            data = json.loads(str(raw))
        fd, path = tempfile.mkstemp(suffix=".json", prefix="gcp_vertex_sa_")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = path
    except Exception:
        pass


def _finalize_google_application_credentials_path() -> None:
    """JSON으로 잡힌 경로가 상대경로인 경우 프로젝트 루트 기준으로 절대화."""
    _cred2 = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if _cred2 and not os.path.isabs(_cred2):
        _abs2 = os.path.normpath(os.path.join(_ROOT_DIR, _cred2))
        if os.path.isfile(_abs2):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _abs2


_drop_google_application_credentials_if_missing_file()
_apply_streamlit_service_account_json_from_secrets()
_finalize_google_application_credentials_path()


def refresh_streamlit_vertex_credentials_from_secrets() -> None:
    """
    Gemini 호출 직전에 한 번 더 실행.
    - import 직후와 달리 이 시점에는 st.secrets가 확실히 로드된 경우가 많음
    - Secrets에 로컬 PC용 GOOGLE_APPLICATION_CREDENTIALS 경로만 넣은 경우 서버에서 제거 후
      GCP_SERVICE_ACCOUNT_JSON으로 임시 파일 생성
    """
    _resolve_relative_google_application_credentials()
    _drop_google_application_credentials_if_missing_file()
    _apply_streamlit_service_account_json_from_secrets()
    _finalize_google_application_credentials_path()


_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""

if not _GEMINI_API_KEY:
    try:
        raw = streamlit_vertex_secret_get(
            "GEMINI_API_KEY", "GOOGLE_API_KEY", "gemini_api_key"
        )
        if raw is not None and not isinstance(raw, dict):
            _GEMINI_API_KEY = str(raw).strip()
    except Exception:
        pass

GEMINI_API_KEY = _GEMINI_API_KEY
