"""
경상북도(시도코드 37) 전용: 1단계 축·핸들러·KOSIS convert·2단계 행/논리 일관성·DF 후처리.
"""
from __future__ import annotations

import re
from typing import Any, List, Optional, Tuple

import numpy as np
import pandas as pd
import streamlit as st

from core.constants import CACHE_TTL_SECONDS
from generate_logic.ipf_cache import hash_dataframe
from regions.base import AxisItem
from regions.default import DefaultRegionHandler


def _blank_for_series(s: pd.Series) -> Any:
    """컬럼 dtype에 맞는 공란값 반환 (배포 pandas 엄격 dtype 대응)."""
    try:
        if pd.api.types.is_numeric_dtype(s.dtype):
            return np.nan
        if pd.api.types.is_bool_dtype(s.dtype):
            return pd.NA
    except Exception:
        pass
    return ""


def _clear_where(df: pd.DataFrame, mask: pd.Series, columns: List[str]) -> None:
    """조건 마스크가 True인 셀을 dtype-safe 방식으로 비움."""
    for col in columns:
        if col not in df.columns:
            continue
        blank = _blank_for_series(df[col])
        try:
            df.loc[mask, col] = blank
        except Exception:
            # 일부 엄격 dtype/CoW 케이스: object 완화 후 None으로 대입
            try:
                df[col] = df[col].astype("object")
                df.loc[mask, col] = None
            except Exception:
                # 최종 fallback: 빈값을 NaN으로 강제
                try:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                except Exception:
                    pass
                df.loc[mask, col] = np.nan


# ---------------------------------------------------------------------------
# 2단계 행 방향 논리 일관성 (경북 전용 — 타 시도와 독립)
# ---------------------------------------------------------------------------
def apply_gyeongbuk_step2_row_consistency(df: pd.DataFrame) -> pd.DataFrame:
    """2단계 통계 대입 후 행 방향 논리 일관성 (경상북도)."""
    from regions.common import (
        age_to_num, apply_non_econ_employment_consistency,
        apply_pet_consistency, apply_debt_consistency,
        apply_donation_consistency, apply_retirement_consistency,
    )
    out = df.copy()
    apply_non_econ_employment_consistency(out)

    age_col, spouse_econ_col = "연령", "배우자의 경제활동 상태"
    if age_col in out.columns and spouse_econ_col in out.columns:
        ages = out[age_col].map(age_to_num)
        out.loc[ages.notna() & (ages < 20), spouse_econ_col] = "무"

    apply_pet_consistency(out)
    apply_debt_consistency(out)
    apply_donation_consistency(out)
    apply_retirement_consistency(out)
    return out


# ---------------------------------------------------------------------------
# 2단계 개연성(논리 일관성) — 경상북도 설문 컬럼명 기준 (inplace)
# ---------------------------------------------------------------------------
def apply_gyeongbuk_step2_logical_consistency_inplace(df: pd.DataFrame) -> None:
    """2단계 결과 개연성: 조건 불일치 시 셀 비움·값 조정 (inplace)."""
    if "소득 여부" in df.columns:
        no_income = df["소득 여부"].astype(str).str.strip().str.lower().isin(["아니오", "없음", "없다", "0", "no", ""])
        _clear_where(df, no_income, ["소득 만족도", "소비생활만족도"])

    if "학생 및 미취학 자녀 유무" in df.columns:
        no_child = df["학생 및 미취학 자녀 유무"].astype(str).str.strip().isin(["무", "없음", "없다"])
        _clear_where(df, no_child, ["공교육비", "사교육비"])

    if "자원봉사 활동 여부" in df.columns:
        no_vol = df["자원봉사 활동 여부"].astype(str).str.strip().isin(["없다", "없음"])
        _clear_where(df, no_vol, ["자원봉사 활동 방식", "지난 1년 동안 자원봉사 활동 시간"])

    if "기부 여부" in df.columns:
        no_donation = df["기부 여부"].astype(str).str.strip().isin(["없다", "없음"])
        _clear_where(df, no_donation, ["기부 방식", "기부금액(만원)"])

    if "자신의 평소 준법수준" in df.columns and "평소 법을 지키지 않는 주된 이유" in df.columns:
        obey = df["자신의 평소 준법수준"].astype(str).str.strip().str.contains("잘 지킨다", na=False)
        _clear_where(df, obey, ["평소 법을 지키지 않는 주된 이유"])

    if "연령" in df.columns and "경제활동" in df.columns and "종사상 지위" in df.columns:
        try:
            age_numeric = pd.to_numeric(df["연령"], errors='coerce')
            elderly = age_numeric > 75
            econ_active = df["경제활동"].astype(str).str.strip() == "경제활동"
            invalid_elderly = elderly & econ_active
            if invalid_elderly.sum() > 0:
                invalid_indices = df[invalid_elderly].index
                paid_status = df.loc[invalid_indices, "종사상 지위"].astype(str).str.strip().str.contains("유급|상용|임시|일용", na=False, regex=True)
                paid_indices = invalid_indices[paid_status]
                if len(paid_indices) > 0:
                    df.loc[paid_indices, "종사상 지위"] = "무급"
                np.random.seed(42)
                to_inactive_mask = pd.Series(np.random.rand(len(df)) < 0.5, index=df.index)
                to_inactive = invalid_elderly & to_inactive_mask
                if to_inactive.sum() > 0:
                    df.loc[to_inactive, "경제활동"] = "비경제활동"
        except Exception:
            pass

    if "연령" in df.columns:
        try:
            age_numeric = pd.to_numeric(df["연령"], errors='coerce')
            if "시도 거주기간" in df.columns:
                young = age_numeric < 30
                long_residence = df["시도 거주기간"].astype(str).str.contains("20년|30년|40년|50년", na=False, regex=True)
                invalid_residence = young & long_residence
                if invalid_residence.sum() > 0:
                    for idx in df[invalid_residence].index:
                        age_val = age_numeric.iloc[idx]
                        if pd.notna(age_val) and age_val < 30:
                            max_years = int(age_val)
                            if max_years < 5:
                                df.loc[idx, "시도 거주기간"] = "5년 미만"
                            elif max_years < 10:
                                df.loc[idx, "시도 거주기간"] = "5-10년"
                            elif max_years < 20:
                                df.loc[idx, "시도 거주기간"] = "10-20년"
                            else:
                                df.loc[idx, "시도 거주기간"] = "20년 이상"

            if "시도 거주기간" in df.columns and "시군구 거주기간" in df.columns:
                def parse_residence_years(s):
                    if pd.isna(s) or s == "":
                        return 0
                    s_str = str(s)
                    if "5년 미만" in s_str:
                        return 2.5
                    elif "5-10년" in s_str:
                        return 7.5
                    elif "10-20년" in s_str:
                        return 15
                    elif "20년" in s_str or "30년" in s_str or "40년" in s_str or "50년" in s_str:
                        return 25
                    return 0

                sido_years = df["시도 거주기간"].apply(parse_residence_years)
                sigungu_years = df["시군구 거주기간"].apply(parse_residence_years)
                invalid_order = sigungu_years > sido_years
                if invalid_order.sum() > 0:
                    for idx in df[invalid_order].index:
                        sido_val = sido_years.iloc[idx]
                        if sido_val <= 2.5:
                            df.loc[idx, "시군구 거주기간"] = "5년 미만"
                        elif sido_val <= 7.5:
                            df.loc[idx, "시군구 거주기간"] = "5-10년"
                        elif sido_val <= 15:
                            df.loc[idx, "시군구 거주기간"] = "10-20년"
                        else:
                            df.loc[idx, "시군구 거주기간"] = df.loc[idx, "시도 거주기간"]
        except Exception:
            pass

    if "경제활동" in df.columns and "월평균소득" in df.columns and "학생 및 미취학 자녀 유무" in df.columns:
        try:
            inactive = df["경제활동"].astype(str).str.strip() == "비경제활동"
            no_child = df["학생 및 미취학 자녀 유무"].astype(str).str.strip().isin(["무", "없음", "없다"])
            high_income = df["월평균소득"].astype(str).str.contains("200|300|400|500|600|700|800", na=False, regex=True)
            invalid_income = inactive & no_child & high_income
            if invalid_income.sum() > 0:
                df.loc[invalid_income, "월평균소득"] = np.random.choice(
                    ["50만원미만", "50-100만원", "100-200만원"],
                    size=invalid_income.sum(),
                    p=[0.3, 0.4, 0.3]
                )
        except Exception:
            pass

    if "연령" in df.columns and "교육정도" in df.columns:
        try:
            age_numeric = pd.to_numeric(df["연령"], errors='coerce')
            young = age_numeric < 22
            high_edu = df["교육정도"].astype(str).str.contains("대졸|대학|대학원", na=False, regex=True)
            invalid_edu = young & high_edu
            if invalid_edu.sum() > 0:
                df.loc[invalid_edu, "교육정도"] = np.random.choice(
                    ["중졸이하", "고졸"],
                    size=invalid_edu.sum(),
                    p=[0.3, 0.7]
                )
        except Exception:
            pass

    if "연령" in df.columns:
        try:
            age_numeric = pd.to_numeric(df["연령"], errors='coerce')
            very_young = age_numeric < 25
            has_spouse = pd.Series([False] * len(df), index=df.index)
            spouse_cols = [col for col in df.columns if "배우자" in col and ("경제활동" in col or "상태" in col)]
            if spouse_cols:
                spouse_col = spouse_cols[0]
                has_spouse = df[spouse_col].astype(str).str.strip().isin(["경제활동", "비경제활동", "유", "있음", "있다", "있습니다"])
            has_child = pd.Series([False] * len(df), index=df.index)
            if "학생 및 미취학 자녀 유무" in df.columns:
                has_child = df["학생 및 미취학 자녀 유무"].astype(str).str.strip().isin(["유", "있음", "있다", "있습니다"])
            invalid_family = very_young & has_spouse & has_child
            if invalid_family.sum() > 0:
                np.random.seed(42)
                remove_spouse_mask = pd.Series(np.random.rand(len(df)) < 0.5, index=df.index)
                remove_spouse = invalid_family & remove_spouse_mask
                if spouse_cols and remove_spouse.sum() > 0:
                    df.loc[remove_spouse, spouse_cols[0]] = "무"
                remove_child = invalid_family & ~remove_spouse
                if "학생 및 미취학 자녀 유무" in df.columns and remove_child.sum() > 0:
                    df.loc[remove_child, "학생 및 미취학 자녀 유무"] = "무"
        except Exception:
            pass

    if "주택점유형태" in df.columns and "향후 10년 거주 희망의사" in df.columns:
        try:
            rental = df["주택점유형태"].astype(str).str.contains("전세|월세|임대", na=False, regex=True)
            will_stay = df["향후 10년 거주 희망의사"].astype(str).str.contains("계속|유지|그대로", na=False, regex=True)
            invalid_stay = rental & will_stay
            if invalid_stay.any():
                df.loc[invalid_stay, "향후 10년 거주 희망의사"] = "이사 희망"
        except Exception:
            pass

    if "경제활동" in df.columns:
        inactive = df["경제활동"].astype(str).str.strip() == "비경제활동"
        _clear_where(df, inactive, ["종사상 지위", "하는 일의 종류(직업 종분류)", "근로만족도"])

    # 복지 만족도 2열은 KOSIS로 전 행 대입 유지 (여기서 공란 처리하지 않음)

    if "교육정도" in df.columns and "하는 일의 종류(직업 종분류)" in df.columns:
        try:
            low_edu = df["교육정도"].astype(str).str.contains("중졸|고졸", na=False, regex=True)
            professional_job = df["하는 일의 종류(직업 종분류)"].astype(str).str.contains("전문|관리|경영|의사|변호사|회계사", na=False, regex=True)
            invalid_edu_job = low_edu & professional_job
            if invalid_edu_job.any():
                _clear_where(df, invalid_edu_job, ["하는 일의 종류(직업 종분류)"])
        except Exception:
            pass


@st.cache_data(ttl=CACHE_TTL_SECONDS, max_entries=2, hash_funcs={pd.DataFrame: hash_dataframe})
def apply_gyeongbuk_step2_logical_consistency_cached(df: pd.DataFrame) -> pd.DataFrame:
    """경북 2단계 논리 일관성 (캐시)."""
    out = df.copy()
    apply_gyeongbuk_step2_logical_consistency_inplace(out)
    return out


# ---------------------------------------------------------------------------
# 2단계 DataFrame 후처리(표기·보충)
# ---------------------------------------------------------------------------
_WELFARE_SAT_COLS = (
    "임신·출산·육아에 대한 복지 만족도",
    "저소득층 등 취약계층에 대한 복지 만족도",
)
_WELFARE_FALLBACK = (
    "보통이다",
    "그런 편이다",
    "매우그렇다",
    "그렇지 않은 편이다",
    "전혀 그렇지 않다",
    "잘모르겠다",
)


def _find_pet_has_column(df: pd.DataFrame) -> Optional[str]:
    for c in df.columns:
        s = str(c)
        if "반려동물" in s and "유무" in s:
            return c
    return None


def _fill_empty_welfare_from_empirical(df: pd.DataFrame, col: str) -> None:
    if col not in df.columns:
        return
    s = df[col]
    empty = s.isna() | (s.astype(str).str.strip() == "")
    if not empty.any():
        return
    valid = s[~empty].astype(str).str.strip()
    valid = valid[valid != ""]
    if valid.empty:
        df.loc[empty, col] = np.random.choice(list(_WELFARE_FALLBACK), size=int(empty.sum()))
        return
    vc = valid.value_counts(normalize=True)
    labels = vc.index.astype(str).tolist()
    probs = (vc.values / vc.values.sum()).astype(float)
    df.loc[empty, col] = np.random.choice(labels, size=int(empty.sum()), p=probs)


def apply_gyeongbuk_step2_postprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
    경상북도 2단계 통계 대입 직후 전용 정리.
    - 반려동물 유무: 예/아니오 → 유/무
    - 부모님 생존 여부: 해당없음·해당없으면 → 부
    - 반려동물 양육비용: 0 → 공란
    - 공교육비·사교육비 → 공교육(만원/월), 사교육비(만원/월)
    - 복지 만족도 2열: 공란 보충
    - 기부금액(만원): 기부 응답인데 0만 있는 행 보정
    """
    out = df.copy()

    pet_col = _find_pet_has_column(out)
    if pet_col:
        ser = out[pet_col].astype(str).str.strip()
        out[pet_col] = ser.replace(
            {
                "예": "유",
                "아니오": "무",
                "아니요": "무",
            }
        )

    surv = "부모님 생존 여부"
    if surv in out.columns:
        ser = out[surv].astype(str).str.strip()
        out[surv] = ser.replace({"해당없음": "부", "해당없으면": "부"})

    pet_cost = "반려동물 양육비용"
    if pet_cost in out.columns:

        def _is_zeroish(x: Any) -> bool:
            if pd.isna(x):
                return False
            try:
                return float(str(x).replace(",", "").strip()) == 0.0
            except Exception:
                return str(x).strip() in ("0", "0.0", "0.00")

        zmask = out[pet_cost].map(_is_zeroish)
        _clear_where(out, zmask, [pet_cost])

    ren: dict[str, str] = {}
    if "공교육비" in out.columns:
        ren["공교육비"] = "공교육(만원/월)"
    if "사교육비" in out.columns:
        ren["사교육비"] = "사교육비(만원/월)"
    if ren:
        out = out.rename(columns=ren)

    for wc in _WELFARE_SAT_COLS:
        _fill_empty_welfare_from_empirical(out, wc)

    yes_col = "기부 여부"
    amt_col = "기부금액(만원)"
    if yes_col in out.columns and amt_col in out.columns:
        no_donation = out[yes_col].astype(str).str.strip().isin(
            ("", "없다", "없음", "아니오", "No", "no", "비경험")
        )
        has_donation = ~no_donation
        amt = out[amt_col]
        zero_amt = amt.isna() | (amt.astype(str).str.strip().isin(("", "0", "0.0", "0.00")))
        fix_mask = has_donation & zero_amt
        if fix_mask.any():
            nfix = int(fix_mask.sum())
            fills = np.round(np.exp(np.random.uniform(np.log(1.0), np.log(300.0), size=nfix)), 2)
            out.loc[fix_mask, amt_col] = fills

    return out


# ---------------------------------------------------------------------------
# 인구통계·1단계: 경상북도는 직업분류 제외 6축
# ---------------------------------------------------------------------------
GYEONGBUK_DATA_MANAGEMENT_AXES: List[AxisItem] = [
    ("sigungu", "거주지역"),
    ("gender", "성별"),
    ("age", "연령"),
    ("econ", "경제활동"),
    ("income", "소득"),
    ("edu", "교육"),
]
GYEONGBUK_GENERATION_AXIS_KEYS = ["sigungu", "gender", "age", "econ", "income", "edu"]


class GyeongbukRegionHandler:
    """경상북도: 인구통계 기본 소스·1단계 6축(직업 제외), 변환 로직은 default."""

    def __init__(self) -> None:
        self._default = DefaultRegionHandler()

    def get_data_management_axes(self) -> List[AxisItem]:
        """경상북도는 직업분류(job) 없이 6축만 노출."""
        return list(GYEONGBUK_DATA_MANAGEMENT_AXES)

    def get_generation_axis_keys(self) -> List[str]:
        """1단계에서 job 제외 6축 사용."""
        return list(GYEONGBUK_GENERATION_AXIS_KEYS)

    def get_dashboard_title(self, sido_name: str) -> str:
        return "요약 지표"

    def get_step2_preset_config(self) -> None:
        return None

    def get_step2_stat_columns(self) -> None:
        return None

    def use_slug_fallback_for_unknown_stat(self) -> bool:
        return True

    def get_edu_fallback_handler(self) -> None:
        return None

    def convert(self, kosis_data: Any, axis_key: str) -> Tuple[List[Any], List[float]]:
        """default(C2_NM·C3_NM 경상북도 형식) 로직 사용."""
        return self._default.convert(kosis_data, axis_key)


__all__ = [
    "GyeongbukRegionHandler",
    "GYEONGBUK_DATA_MANAGEMENT_AXES",
    "GYEONGBUK_GENERATION_AXIS_KEYS",
    "apply_gyeongbuk_step2_row_consistency",
    "apply_gyeongbuk_step2_logical_consistency_inplace",
    "apply_gyeongbuk_step2_logical_consistency_cached",
    "apply_gyeongbuk_step2_postprocess",
]
