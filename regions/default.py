"""
미등록 시도용 기본(fallback) 로직.
- 등록된 지역(서울·대구·경상북도 등)은 각 지역 파일에서 처리.
- 등록되지 않은 시도 코드는 이 핸들러 사용 (C2_NM·C3_NM 중심 파싱).
"""
from __future__ import annotations

import re
from typing import Any, List, Optional, Tuple

import pandas as pd

from regions.base import AxisItem, DEFAULT_GENERATION_AXIS_KEYS

# 데이터 관리 기본 7축 (직업분류 포함)
DEFAULT_DATA_MANAGEMENT_AXES: List[AxisItem] = [
    ("sigungu", "거주지역"),
    ("gender", "성별"),
    ("age", "연령"),
    ("econ", "경제활동"),
    ("income", "소득"),
    ("edu", "교육"),
    ("job", "직업분류"),
]


class DefaultRegionHandler:
    """미등록 시도용: C2_NM·C3_NM 중심 파싱. 1·2단계 기본 동작(7축, 슬러그 사용)."""

    def get_data_management_axes(self) -> List[AxisItem]:
        return list(DEFAULT_DATA_MANAGEMENT_AXES)

    def get_generation_axis_keys(self) -> List[str]:
        """1단계에서 수집할 축: 7축(직업 포함)."""
        return list(DEFAULT_GENERATION_AXIS_KEYS)

    def get_dashboard_title(self, sido_name: str) -> str:
        return "요약 지표"

    def get_step2_preset_config(self) -> Optional[Any]:
        return None

    def get_step2_stat_columns(self) -> Optional[Any]:
        return None

    def use_slug_fallback_for_unknown_stat(self) -> bool:
        return True

    def get_edu_fallback_handler(self) -> Optional["DefaultRegionHandler"]:
        return None

    def convert(self, kosis_data: Any, axis_key: str) -> Tuple[List[Any], List[float]]:
        labels: List[Any] = []
        values: List[float] = []

        if axis_key == "sigungu":
            exclude_sigungu = ["소계", "합계", "Total", "경상북도"]
            seen = set()
            for row in kosis_data:
                if isinstance(row, dict):
                    label = (row.get("C1_NM") or "").strip()
                    val = row.get("DT", "0")
                    if label and label not in exclude_sigungu and label not in seen:
                        try:
                            values.append(float(val))
                            labels.append(label)
                            seen.add(label)
                        except Exception:
                            pass

        elif axis_key == "gender":
            gender_map = {"남자": 0.0, "여자": 0.0}
            for row in kosis_data:
                if isinstance(row, dict):
                    label = (row.get("C2_NM") or "").strip()
                    val = row.get("DT", "0")
                    try:
                        val_float = float(val)
                        if "남자" in label or label == "남":
                            gender_map["남자"] += val_float
                        elif "여자" in label or label == "여":
                            gender_map["여자"] += val_float
                    except (ValueError, TypeError):
                        pass
            for gender in ["남자", "여자"]:
                if gender_map[gender] > 0:
                    labels.append(gender)
                    values.append(gender_map[gender])

        elif axis_key == "age":
            age_map = {}
            for row in kosis_data:
                if not isinstance(row, dict):
                    continue
                try:
                    val = float(str(row.get("DT", "0")).replace(",", "").strip() or 0)
                except (ValueError, TypeError):
                    val = 0
                age_str = (row.get("C3_NM") or "").strip()
                if not age_str or age_str == "계":
                    continue
                range_match = re.search(r"(\d+)\s*[-~]\s*(\d+)", age_str)
                if range_match:
                    low = int(range_match.group(1))
                    high = int(range_match.group(2))
                    if low > high:
                        low, high = high, low
                    low = max(20, low)
                    high = min(120, high)
                    if low <= high:
                        count = high - low + 1
                        per_age = val / count
                        for a in range(low, high + 1):
                            age_map[a] = age_map.get(a, 0) + per_age
                else:
                    single_match = re.search(r"(\d+)", age_str)
                    if single_match:
                        age_num = int(single_match.group(1))
                        if 20 <= age_num <= 120:
                            age_map[age_num] = age_map.get(age_num, 0) + val
            for age_num in sorted(age_map.keys()):
                labels.append(age_num)
                values.append(age_map[age_num])

        elif axis_key == "econ":
            econ_map = {}
            marriage_map = {}
            for row in kosis_data:
                if isinstance(row, dict):
                    label = (row.get("C2_NM") or row.get("C1_NM") or "").strip()
                    val = row.get("DT", "0")
                    if val in ("-", "", None) or not isinstance(val, str):
                        val = str(val or "0")
                    val = val.strip()
                    if val in ("-", ""):
                        continue
                    try:
                        val_float = float(val)
                    except (ValueError, TypeError):
                        continue
                    if "미혼" in label or label == "미혼":
                        marriage_map["미혼"] = marriage_map.get("미혼", 0) + val_float
                    elif "기혼" in label or label == "기혼":
                        marriage_map["기혼"] = marriage_map.get("기혼", 0) + val_float
                    elif "이혼" in label or label == "이혼":
                        marriage_map["이혼"] = marriage_map.get("이혼", 0) + val_float
                    elif "사별" in label or label == "사별":
                        marriage_map["사별"] = marriage_map.get("사별", 0) + val_float
                    elif "하였다" in label or "일하였음" in label or "취업" in label or "경제활동" in label or "일했음" in label:
                        econ_map["경제활동"] = econ_map.get("경제활동", 0) + val_float
                    elif "하지 않았다" in label or "일하지 않았음" in label or "구직" in label or "실업" in label or "비경제" in label:
                        econ_map["비경제활동"] = econ_map.get("비경제활동", 0) + val_float
                    else:
                        econ_map["비경제활동"] = econ_map.get("비경제활동", 0) + val_float
            if marriage_map:
                for k, v in marriage_map.items():
                    labels.append(k)
                    values.append(v)
            else:
                for econ_type, total_val in econ_map.items():
                    labels.append(econ_type)
                    values.append(total_val)

        elif axis_key == "edu":
            edu_map = {"중졸이하": 0, "고졸": 0, "대졸이상": 0}
            for row in kosis_data:
                if isinstance(row, dict):
                    label = ""
                    for field in ["C2_NM", "C3_NM", "C4_NM", "C5_NM"]:
                        val_field = str(row.get(field, "")).strip()
                        if val_field and val_field not in ("계", "전체", "소계"):
                            if any(k in val_field for k in ["초졸", "중졸", "고졸", "대졸", "대학", "무학", "초등", "전문대", "석사", "박사"]):
                                label = val_field
                                break
                    if not label:
                        for field in ["C3_NM", "C4_NM", "C5_NM"]:
                            val_field = str(row.get(field, "")).strip()
                            if val_field and val_field not in ("계", "전체", "소계"):
                                label = val_field
                                break
                    if not label:
                        continue
                    dt_val = str(row.get("DT", "0")).strip()
                    if dt_val in ("-", "", None):
                        continue
                    try:
                        val_float = float(dt_val)
                    except (ValueError, TypeError):
                        continue
                    if "초졸" in label or "무학" in label or "초등" in label or "중졸" in label:
                        edu_map["중졸이하"] += val_float
                    elif "고졸" in label or "고등" in label:
                        edu_map["고졸"] += val_float
                    elif "대학" in label or "대졸" in label or "전문대" in label or "석사" in label or "박사" in label:
                        edu_map["대졸이상"] += val_float
                    elif val_float > 0:
                        edu_map["중졸이하"] += val_float
            if sum(edu_map.values()) == 0:
                edu_map = {"중졸이하": 25.0, "고졸": 40.0, "대졸이상": 35.0}
            for edu_level, total_val in edu_map.items():
                if total_val > 0:
                    labels.append(edu_level)
                    values.append(total_val)

        elif axis_key == "income":
            income_map = {
                "50만원미만": 0, "50-100만원": 0, "100-200만원": 0, "200-300만원": 0,
                "300-400만원": 0, "400-500만원": 0, "500-600만원": 0, "600-700만원": 0,
                "700-800만원": 0, "800만원이상": 0,
            }
            for row in kosis_data:
                if not isinstance(row, dict):
                    continue
                label = (
                    row.get("C2_NM") or row.get("C1_NM") or row.get("C3_NM") or row.get("C4_NM") or row.get("C5_NM") or row.get("ITM_NM") or ""
                ).strip()
                if not label:
                    skip_k = {"DT", "PRD_DE", "LST_CHN_DE", "ITM_ID", "TBL_ID", "ORG_ID", "PRD_SE"}
                    label = " ".join(str(row.get(k) or "").strip() for k in row if k not in skip_k and row.get(k))
                val = row.get("DT", "0")
                try:
                    val_float = float(str(val).replace(",", "").strip() or 0)
                except (ValueError, TypeError):
                    continue
                # 라벨 정규화: "X ~ Y만원 미만" (공백+틸드+공백) → "X~Y만원미만"
                label_n = re.sub(r'\s*~\s*', '~', label)
                label_n = re.sub(r'\s+', '', label_n)
                # ★ "50" 단순 포함 검사 제거 — "400~500"처럼 '50'이 포함된 다른 구간 오매칭 방지
                if "50만원미만" in label_n or re.fullmatch(r'50만원미만.*', label_n):
                    income_map["50만원미만"] += val_float
                elif "50~100" in label_n or "50-100" in label_n:
                    income_map["50-100만원"] += val_float
                elif "100~200" in label_n or "100-200" in label_n:
                    income_map["100-200만원"] += val_float
                elif "200~300" in label_n or "200-300" in label_n:
                    income_map["200-300만원"] += val_float
                elif "300~400" in label_n or "300-400" in label_n:
                    income_map["300-400만원"] += val_float
                elif "400~500" in label_n or "400-500" in label_n:
                    income_map["400-500만원"] += val_float
                elif "500~600" in label_n or "500-600" in label_n:
                    income_map["500-600만원"] += val_float
                elif "600~700" in label_n or "600-700" in label_n:
                    income_map["600-700만원"] += val_float
                elif "700~800" in label_n or "700-800" in label_n:
                    income_map["700-800만원"] += val_float
                elif "800만원" in label_n and ("이상" in label_n or "초과" in label_n):
                    income_map["800만원이상"] += val_float
            for k, v in income_map.items():
                if v > 0:
                    labels.append(k)
                    values.append(v)

        elif axis_key == "job":
            job_map = {"관리전문직": 0.0, "화이트칼라": 0.0, "블루칼라": 0.0, "기타": 0.0}
            for row in kosis_data:
                if not isinstance(row, dict):
                    continue
                label = (row.get("C1_NM") or row.get("C1_NM_ENG") or "").strip()
                if not label or label in ("계", "Total", "소계", "합계"):
                    continue
                try:
                    val_float = float(str(row.get("DT", "0")).replace(",", "").strip() or 0)
                except (ValueError, TypeError):
                    continue
                if "관리자" in label or "전문가" in label or "관리자·전문가" in label:
                    job_map["관리전문직"] += val_float
                elif "사무" in label or "서비스" in label or "판매" in label:
                    job_map["화이트칼라"] += val_float
                elif "기능" in label or "기계" in label or "조립" in label or "단순노무" in label:
                    job_map["블루칼라"] += val_float
                else:
                    job_map["기타"] += val_float
            for job_type, total_val in job_map.items():
                if total_val > 0:
                    labels.append(job_type)
                    values.append(total_val)

        return labels, values


def apply_default_step2_row_consistency(df: pd.DataFrame) -> pd.DataFrame:
    """2단계 통계 대입 후 행 방향 논리 일관성 (등록되지 않은 시도·fallback 전용)."""
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
