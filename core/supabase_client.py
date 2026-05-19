from __future__ import annotations
"""
Supabase 클라이언트 (st.secrets 또는 환경변수)
로컬: .streamlit/secrets.toml 에 SUPABASE_URL, SUPABASE_KEY 설정.
배포: Streamlit Cloud > Manage app > Secrets 에 동일 키 설정.
"""
import os
from typing import Optional, Tuple

import streamlit as st


def _get_supabase_credentials() -> Tuple[Optional[str], Optional[str]]:
    """st.secrets 우선, 없으면 환경변수에서 SUPABASE_URL, SUPABASE_KEY 반환."""
    url: Optional[str] = None
    key: Optional[str] = None
    try:
        if hasattr(st, "secrets") and st.secrets is not None:
            # Top-level (secrets.toml: SUPABASE_URL = "...")
            url = st.secrets.get("SUPABASE_URL")
            key = st.secrets.get("SUPABASE_KEY")
            if not url or not key:
                # Nested (secrets.toml: [supabase] url = "..." key = "...")
                supabase = st.secrets.get("supabase") or {}
                url = url or supabase.get("SUPABASE_URL") or supabase.get("url")
                key = key or supabase.get("SUPABASE_KEY") or supabase.get("key")
    except Exception:
        pass
    if not url or not key:
        url = url or os.environ.get("SUPABASE_URL")
        key = key or os.environ.get("SUPABASE_KEY")
    return (url, key)


@st.cache_resource
def get_supabase():
    """
    Supabase 클라이언트 반환. 연결 실패 시 RuntimeError 발생.
    @st.cache_resource로 전역 단일 인스턴스 재사용(연결 풀링 효과).
    """
    url, key = _get_supabase_credentials()
    if not url or not key or "your-" in str(key).lower() or "xxxxx" in str(url).lower():
        raise RuntimeError(
            "Supabase 설정이 없습니다. "
            "st.secrets 또는 환경변수에 SUPABASE_URL, SUPABASE_KEY를 설정하세요."
        )
    import httpx
    # supabase-py: lib의 ClientOptions는 베이스만 가리키고 storage 필드가 없음.
    # 동기 create_client는 SyncClientOptions를 써야 하며, 패키지 루트의 ClientOptions가 그 별칭이다.
    from supabase import ClientOptions, create_client

    # 배포(해외 RTT) 환경: 환경변수로 연결·읽기 시간 연장 가능
    read_s = float(os.environ.get("SUPABASE_POSTGREST_TIMEOUT", "120"))
    conn_s = float(os.environ.get("SUPABASE_CONNECT_TIMEOUT", "30"))
    postgrest_timeout = httpx.Timeout(read_s, connect=conn_s)
    opts = ClientOptions(postgrest_client_timeout=postgrest_timeout)
    return create_client(url.strip(), key.strip(), options=opts)
