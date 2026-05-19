"""
IPF(Iterative Proportional Fitting) 기반 가상인구 생성 캐시.
"""
from __future__ import annotations

import hashlib
import json

import pandas as pd
import streamlit as st

from core.constants import CACHE_TTL_SECONDS


def hash_dataframe(df: pd.DataFrame) -> str:
    """st.cache_data용 DataFrame 해시. 동일 데이터면 동일 해시."""
    return hashlib.md5(df.to_json(orient="split").encode()).hexdigest()


@st.cache_data(ttl=CACHE_TTL_SECONDS, max_entries=2)
def cached_generate_base_population(
    n: int,
    selected_sigungu_json: str,
    weights_6axis_json: str,
    sigungu_pool_json: str,
    seed: int,
    margins_axis_json: str,
    apply_ipf_flag: bool,
):
    """generate_base_population 결과를 24시간 캐시. 동일 인자면 재계산 생략."""
    from utils.ipf_generator import generate_base_population
    selected_sigungu = json.loads(selected_sigungu_json) if selected_sigungu_json else []
    weights_6axis = json.loads(weights_6axis_json) if weights_6axis_json else {}
    sigungu_pool = json.loads(sigungu_pool_json) if sigungu_pool_json else []
    margins_axis = json.loads(margins_axis_json) if margins_axis_json else {}
    return generate_base_population(
        n=n,
        selected_sigungu=selected_sigungu,
        weights_6axis=weights_6axis,
        sigungu_pool=sigungu_pool,
        seed=seed,
        margins_axis=margins_axis,
        apply_ipf_flag=apply_ipf_flag,
    )
