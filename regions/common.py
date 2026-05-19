"""공통 step2 행 방향 논리 일관성 헬퍼 (regions/ 전 파일 공유)."""
from __future__ import annotations

import re
from typing import Any, List, Optional

import numpy as np
import pandas as pd


def age_to_num(a) -> Optional[int]:
    """연령 문자열에서 첫 번째 정수 추출 (예: '35세' → 35, '35~39세' → 35)."""
    if a is None or (isinstance(a, float) and pd.isna(a)):
        return None
    s = str(a).strip()
    for part in re.findall(r"\d+", s):
        return int(part)
    return None


def _blank_for_series(s: pd.Series) -> Any:
    try:
        if pd.api.types.is_numeric_dtype(s.dtype):
            return np.nan
        if pd.api.types.is_bool_dtype(s.dtype):
            return pd.NA
    except Exception:
        pass
    return ""


def clear_where(df: pd.DataFrame, mask: pd.Series, columns: List[str]) -> None:
    """조건 마스크가 True인 셀을 dtype-safe 방식으로 비움 (inplace)."""
    for col in columns:
        if col not in df.columns:
            continue
        blank = _blank_for_series(df[col])
        try:
            df.loc[mask, col] = blank
        except Exception:
            try:
                df[col] = df[col].astype("object")
                df.loc[mask, col] = None
            except Exception:
                try:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                except Exception:
                    pass
                df.loc[mask, col] = np.nan


_EMPLOYMENT_COLS = [
    "종사상 지위", "직장명(산업 대분류)", "하는 일의 종류(직업 종분류)",
    "하는일 만족도", "임금/가구소득 만족도", "근로시간 만족도", "근무환경 만족도", "근무 여건 전반적인 만족도",
]


def apply_non_econ_employment_consistency(df: pd.DataFrame) -> None:
    """비경제활동 행의 취업 관련 컬럼 클리어 (inplace)."""
    econ_col = "경제활동"
    if econ_col not in df.columns:
        return
    non_econ = df[econ_col].astype(str).str.strip().isin(("비경제활동", "비경제 활동"))
    clear_where(df, non_econ, _EMPLOYMENT_COLS)


def apply_pet_consistency(df: pd.DataFrame) -> None:
    """반려동물 없음 → 취득경로 클리어 (inplace)."""
    pet_has = pet_path = None
    for c in df.columns:
        cs = str(c)
        if "반려동물" in cs and "유무" in cs:
            pet_has = c
        elif "반려동물" in cs and ("취득" in cs or "경로" in cs):
            pet_path = c
    if pet_has and pet_path:
        no_pet = df[pet_has].astype(str).str.strip().str.lower().isin(
            ("없다", "없음", "아니오", "no", "유무없음")
        )
        clear_where(df, no_pet, [pet_path])


def apply_debt_consistency(df: pd.DataFrame) -> None:
    """부채 없음 → 부채 주된 이유 클리어 (inplace)."""
    debt_has = debt_reason = None
    for c in df.columns:
        cs = str(c)
        if "부채" in cs and ("여부" in cs or "유무" in cs):
            debt_has = c
        elif "부채" in cs and "주된 이유" in cs:
            debt_reason = c
    if debt_has and debt_reason:
        no_debt = df[debt_has].astype(str).str.strip().isin(("부채 없음", "없음"))
        clear_where(df, no_debt, [debt_reason])


def apply_donation_consistency(df: pd.DataFrame) -> None:
    """기부 비경험 → 기부 형태 클리어 (inplace)."""
    don_has = don_type = None
    for c in df.columns:
        cs = str(c)
        if "기부" in cs and ("여부" in cs or "유무" in cs):
            don_has = c
        elif "기부" in cs and "형태" in cs:
            don_type = c
    if don_has and don_type:
        no_don = df[don_has].astype(str).str.strip().isin(("비경험", "없다", "없음", "아니오"))
        clear_where(df, no_don, [don_type])


def apply_retirement_consistency(df: pd.DataFrame) -> None:
    """노후 준비 안 함 → 노후 준비 방법 클리어 (inplace). default/daegu/gyeongbuk 전용."""
    old_prep = old_method = None
    for c in df.columns:
        cs = str(c)
        if "노후" in cs and "여부" in cs:
            old_prep = c
        elif "노후" in cs and "방법" in cs:
            old_method = c
    if old_prep and old_method:
        no_old = df[old_prep].astype(str).str.strip().str.contains(
            "안한다|하지 않는다|안 함|하지 않음", na=False, regex=True
        )
        clear_where(df, no_old, [old_method])
