"""
2단계 결과 컬럼 리네임·미적용 축 블랭크·다운로드용 Excel 바이트 생성.
"""
from __future__ import annotations

from io import BytesIO

import pandas as pd
import streamlit as st

from core.constants import CACHE_TTL_SECONDS, STEP2_COLUMN_RENAME
from generate_logic.ipf_cache import hash_dataframe


def apply_step2_column_rename(df: pd.DataFrame) -> pd.DataFrame:
    """2단계 결과 컬럼명을 출력용으로 변경 (존재하는 컬럼만)."""
    rename = {k: v for k, v in STEP2_COLUMN_RENAME.items() if k in df.columns}
    return df.rename(columns=rename) if rename else df


def blank_unapplied_axis_columns(df: pd.DataFrame, margins_axis: dict) -> pd.DataFrame:
    """1단계 미리보기용: KOSIS 미반영 축 컬럼을 '—'로 비워서 어느 축이 미적용인지 알 수 있게 함."""
    out = df.copy()
    axis_to_col = {
        "sigungu": "거주지역",
        "gender": "성별",
        "age": "연령",
        "econ": "경제활동",
        "income": "월평균소득",
        "edu": "교육정도",
        "job": "직업분류",
    }
    for axis_key, col in axis_to_col.items():
        if axis_key not in (margins_axis or {}) and col in out.columns:
            out[col] = "—"
    return out


@st.cache_data(ttl=CACHE_TTL_SECONDS, max_entries=2, hash_funcs={pd.DataFrame: hash_dataframe})
def build_excel_bytes_for_download(df: pd.DataFrame, _is_step2: bool) -> bytes:
    """다운로드 탭에서 요청 시에만 Excel 바이트 생성 (캐시됨)."""
    buf = BytesIO()
    df.to_excel(buf, index=False, engine="xlsxwriter")
    buf.seek(0)
    return buf.getvalue()
