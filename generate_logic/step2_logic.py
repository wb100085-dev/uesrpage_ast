"""
================================================================================
generate_logic/step2_logic.py — 가상인구 「2단계: 추가 KOSIS 통계 대입」 공통 로직
================================================================================

[역할 요약]
  1) KOSIS JSON(통계 원천)에서 「컬럼별 목표 확률 분포」를 뽑아낸다.
     → IPF(반복 비례 맞춤)나 검증 UI가 「목표 vs 실제」를 비교할 때 쓴다.
  2) 대입이 끝난 DataFrame과 위 목표를 비교해, 1단계(6축)와 같은 형태의
     error_report 딕셔너리를 만든다 (검증 탭·리포트용).
  3) 2단계 처리용 임시 컬럼명(kosis_99__…)을 제거한다.

[호출 관계(개략)]
  • app.py 2단계 통계 대입 / 검증 흐름에서 `get_step2_target_distributions`,
    `build_step2_error_report`, `drop_step2_kosis_slug_columns` 사용.
  • 통계 종류별 실제 파싱·대입 세부 구현의 대부분은 `utils/kosis_client.py`.
  • 행 단위 논리 일관성(예: 자녀 수와 유무 맞추기)은 시도별
    `regions/*.py` 의 `apply_step2_row_consistency_for_sido` 쪽.

[반환 튜플 (컬럼명, labels, target_p, condition) 에서 condition]
  • None : 해당 컬럼 전체 인구에 대해 labels / target_p 분포 적용.
  • (선행컬럼명, 값문자열) : 먼저 선행 컬럼이 그 값인 행만 보고 분포 비교
    (예: 자녀 「명수」 분포는 「자녀 유무=있다」인 행에만).
  • {"type": "numeric_mean", "target_mean": float} : 범주 분포가 아니라
    평균값 일치 검증용 (build_step2_error_report 에서만 처리).

[주의] is_pet_cost / is_education_cost / is_other_region_consumption 분기는
  현재 목표 분포 추출 본문이 비어 있음(pass). 필요 시 kosis_client 연동을 확장.
================================================================================
"""
from __future__ import annotations

from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Tuple

import numpy as np
import pandas as pd

from generate_logic.kosis_helpers import get_cached_kosis_json

# =============================================================================
# 1) get_step2_target_distributions — KOSIS → 컬럼별 (라벨, 목표확률, 조건)
# =============================================================================


def get_step2_target_distributions(
    kosis_client,
    kosis_data: List[Dict[str, Any]],
    is_residence: bool,
    columns: List[str],
    is_children_student: bool = False,
    is_pet: bool = False,
    is_dwelling: bool = False,
    is_parents_survival_cohabitation: bool = False,
    is_parents_expense_provider: bool = False,
    is_housing_satisfaction: bool = False,
    is_spouse_economic: bool = False,
    is_employment_status: bool = False,
    is_industry_major: bool = False,
    is_job_class: bool = False,
    is_work_satisfaction: bool = False,
    is_pet_cost: bool = False,
    is_income_consumption_satisfaction: bool = False,
    is_education_cost: bool = False,
    is_other_region_consumption: bool = False,
    is_preset: bool = False,
    stat_name: str = "",
    extra_preset_config: "Optional[Dict[str, Any]]" = None,
) -> List[Tuple[str, List[Any], List[float], Any]]:
    """
    2단계에서 선택한 통계(JSON 한 덩어리)로부터, IPF/검증에 쓸 「목표 분포」 목록을 만든다.

    Returns
    -------
    List[Tuple[str, List[Any], List[float], Any]]
        각 원소는 하나의 「검증 축」에 대응한다.
        - str : DataFrame 컬럼명 (이 이름으로 생성된 가상인구 열과 매칭).
        - List[Any] : 범주 라벨 (KOSIS·파서가 쓰는 문자열과 동일해야 함).
        - List[float] : 각 라벨의 목표 비율 (합이 1에 가깝게 정규화된 값).
        - Any : 조건. None 이면 전체 행 기준. (부모컬럼, 값) 튜플이면 조건부 부분집단.

    처리 순서 요약
    --------------
    1. 프리셋 통계면 kosis_client 에 위임 (시도별로 미리 정의된 통계명·열 매핑).
    2. 그 외는 플래그(is_children_student 등)로 통계 「유형」을 판별해,
       kosis_client 의 전용 parse_* 함수로 dict/list 형 목표를 얻는다.
    3. 아무 특수 유형에도 해당하지 않으면, 단순 표 형태로 가정하고
       C2_NM(또는 C1_NM) 라벨 + DT 값을 합산해 비율로 만든다 (일반 단일열 통계).
    """
    out: List[Tuple[str, List[Any], List[float], Any]] = []
    if not kosis_data or not columns:
        return out

    # --- 프리셋: regions.get_step2_preset_config 등과 짝을 이루는 고정 매핑 통계 ---
    if is_preset and stat_name:
        return kosis_client.get_preset_target_distributions(
            stat_name, kosis_data, list(columns),
            extra_preset_config=extra_preset_config,
        )

    # --- 자녀(학생): 보통 2열 — [0] 유무, [1] 명수. 명수 분포는 「있다」 조건부 ---
    if is_children_student and len(columns) >= 2:
        dist_has, dist_count = kosis_client.parse_children_student_kosis(kosis_data)
        if dist_has:
            labels_has = list(kosis_client.CHILDREN_HAS_LABELS)
            p_has = [dist_has.get(l, 0.0) for l in labels_has]
            out.append((columns[0], labels_has, p_has, None))
        if dist_count:
            labels_count = list(kosis_client.CHILDREN_COUNT_LABELS)
            p_count = [dist_count.get(l, 0.0) for l in labels_count]
            # 두 번째 열은 첫 열이 「있다」일 때만 의미 있음 → condition 으로 표시
            out.append((columns[1], labels_count, p_count, (columns[0], "있다")))

    # --- 반려동물: [0] 유무, [1] 종류 등. 종류 분포는 「예」(양육) 조건부 ---
    elif is_pet and len(columns) >= 2:
        dist_has, dist_type = kosis_client.parse_pet_kosis(kosis_data)
        if dist_has:
            labels_has = list(kosis_client.PET_HAS_LABELS)
            p_has = [dist_has.get(l, 0.0) for l in labels_has]
            out.append((columns[0], labels_has, p_has, None))
        if dist_type:
            labels_type = list(dist_type.keys())
            p_type = list(dist_type.values())
            out.append((columns[1], labels_type, p_type, (columns[0], "예")))

    # --- 주거: 주택 유형 + 전·월세 등 2축 ---
    elif is_dwelling and len(columns) >= 2:
        dist_dwelling, dist_occupancy = kosis_client.parse_dwelling_kosis(kosis_data)
        if dist_dwelling:
            labels_dw = list(dist_dwelling.keys())
            p_dw = list(dist_dwelling.values())
            out.append((columns[0], labels_dw, p_dw, None))
        if dist_occupancy:
            labels_occ = list(dist_occupancy.keys())
            p_occ = list(dist_occupancy.values())
            out.append((columns[1], labels_occ, p_occ, None))

    # --- 부모 생존 / 동거 ---
    elif is_parents_survival_cohabitation and len(columns) >= 2:
        dist_survival, dist_cohabitation = kosis_client.parse_parents_survival_cohabitation_kosis(kosis_data)
        if dist_survival:
            labels_survival = list(dist_survival.keys())
            p_survival = list(dist_survival.values())
            out.append((columns[0], labels_survival, p_survival, None))
        if dist_cohabitation:
            labels_cohabitation = list(dist_cohabitation.keys())
            p_cohabitation = list(dist_cohabitation.values())
            out.append((columns[1], labels_cohabitation, p_cohabitation, None))

    # --- 부모 경제 지원 ---
    elif is_parents_expense_provider and len(columns) >= 1:
        dist = kosis_client.parse_parents_expense_provider_kosis(kosis_data)
        if dist:
            labels = list(dist.keys())
            p = list(dist.values())
            out.append((columns[0], labels, p, None))

    # --- 주거 만족도 등 3열 ---
    elif is_housing_satisfaction and len(columns) >= 3:
        d0, d1, d2 = kosis_client.parse_housing_satisfaction_kosis(kosis_data)
        for col_name, dist in zip(columns[:3], [d0, d1, d2]):
            if dist:
                labels = list(dist.keys())
                p = list(dist.values())
                out.append((col_name, labels, p, None))

    # --- 배우자 경제활동 ---
    elif is_spouse_economic and len(columns) >= 1:
        dist = kosis_client.parse_spouse_economic_kosis(kosis_data)
        if dist:
            labels = list(dist.keys())
            p = list(dist.values())
            out.append((columns[0], labels, p, None))

    # --- 고용 상태 ---
    elif is_employment_status and len(columns) >= 1:
        dist = kosis_client.parse_employment_status_kosis(kosis_data)
        if dist:
            labels = list(dist.keys())
            p = list(dist.values())
            out.append((columns[0], labels, p, None))

    # --- 산업 대분류 ---
    elif is_industry_major and len(columns) >= 1:
        dist = kosis_client.parse_industry_major_kosis(kosis_data)
        if dist:
            labels = list(dist.keys())
            p = list(dist.values())
            out.append((columns[0], labels, p, None))

    # --- 직업 분류 ---
    elif is_job_class and len(columns) >= 1:
        dist = kosis_client.parse_job_class_kosis(kosis_data)
        if dist:
            labels = list(dist.keys())
            p = list(dist.values())
            out.append((columns[0], labels, p, None))

    # --- 직장 만족도 등 5개 하위 분포 ---
    elif is_work_satisfaction and len(columns) >= 5:
        d1, d2, d3, d4, d5 = kosis_client.parse_work_satisfaction_kosis(kosis_data)
        for col_name, dist in zip(columns[:5], [d1, d2, d3, d4, d5]):
            if dist:
                labels = list(dist.keys())
                p = list(dist.values())
                out.append((col_name, labels, p, None))

    # --- 반려비용: 목표 분포 추출 미구현 (대입은 kosis_client 다른 경로일 수 있음) ---
    elif is_pet_cost and len(columns) >= 1:
        pass

    # --- 소득·소비 만족 3열 ---
    elif is_income_consumption_satisfaction and len(columns) >= 3:
        d1, d2, d3 = kosis_client.parse_income_consumption_satisfaction_kosis(kosis_data)
        for col_name, dist in zip(columns[:3], [d1, d2, d3]):
            if dist:
                labels = list(dist.keys())
                p = list(dist.values())
                out.append((col_name, labels, p, None))

    # --- 교육비 등: 미구현 ---
    elif is_education_cost and len(columns) >= 2:
        pass

    # --- 타지역 소비 등: 미구현 ---
    elif is_other_region_consumption and len(columns) >= 4:
        pass

    # --- 거주 기간·정주 의사 3열 (시도·시군·이주 의도 등) ---
    elif is_residence and len(columns) >= 3:
        dist_sido, dist_sigungu, dist_intent = kosis_client.parse_residence_duration_kosis(kosis_data)
        for col_name, dist in zip(columns[:3], [dist_sido, dist_sigungu, dist_intent]):
            if dist:
                labels = list(dist.keys())
                p = list(dist.values())
                out.append((col_name, labels, p, None))

    # --- 기본: 단일 범주형 열 — 행 단위 JSON에서 C2_NM(또는 C1_NM) + DT 를 합산 후 비율화 ---
    else:
        agg: Dict[str, float] = defaultdict(float)
        for r in kosis_data:
            if not isinstance(r, dict):
                continue
            # KOSIS API JSON 에서 범주 이름이 들어오는 대표 필드
            lab = str(r.get("C2_NM") or r.get("C1_NM") or "").strip()
            if not lab or lab in ("계", "합계", "소계", "Total", "평균"):
                continue
            try:
                v = float(str(r.get("DT", "") or "").replace(",", "").strip() or 0)
            except Exception:
                continue
            agg[lab] += v
        total = sum(agg.values())
        if total > 0 and columns:
            labels = list(agg.keys())
            p = [agg[l] / total for l in labels]
            out.append((columns[0], labels, p, None))
    return out


# =============================================================================
# 2) build_step2_error_report — 목표 분포 vs 생성 DataFrame 오차 리포트
# =============================================================================


def build_step2_error_report(
    df: pd.DataFrame,
    step2_validation_info: List[Dict[str, Any]],
    kosis_client,
    sido_code: str = "",
) -> Dict[str, Dict]:
    """
    2단계 「검증」용: 각 통계 URL에서 KOSIS JSON 을 다시 받아 목표 분포를 만들고,
    현재 df 의 해당 컬럼 분포와 비교한다.

    Parameters
    ----------
    df : 대입이 반영된 가상인구 DataFrame (검증 시점 스냅샷).
    step2_validation_info : 통계별 메타 (url, columns, is_children_student 등 플래그).
        app 쪽에서 2단계에 사용한 설정과 동일한 항목이 들어와야 의미 있는 비교가 된다.

    Returns
    -------
    Dict[str, Dict]
        컬럼명(또는 축 키) → { axis_name, mae_pct, details, metric_type? }
        1단계 검증 UI와 맞춘 형식이라, 화면에서 표·게이지로 재사용 가능.

    구현 메모
    ---------
    • URL 이 여러 개면 순차 요청이 느리므로 ThreadPoolExecutor 로 JSON 만 병렬 fetch.
    • 자녀·반려 통계는 표시 문자열(유/무, 1명/2명…)과 KOSIS 라벨 매핑이 달라
      display_to_has / num_to_count 로 맞춘 뒤 value_counts 한다.
    """
    error_report: Dict[str, Dict] = {}
    items_to_process = [item for item in step2_validation_info if item.get("url") and item.get("columns")]

    # 시도별 프리셋 설정 및 핸들러 (검증 시 지역 전용 config/전처리 적용)
    _extra_preset_cfg = None
    _region_handler = None
    if sido_code:
        try:
            from regions import get_step2_preset_config, get_region_handler
            _extra_preset_cfg = get_step2_preset_config(sido_code)
            _region_handler = get_region_handler(sido_code)
        except Exception:
            pass

    def _fetch_one(item: Dict[str, Any]) -> Tuple[Dict[str, Any], Any]:
        try:
            data = get_cached_kosis_json(item.get("url", ""))
            return (item, data)
        except Exception:
            return (item, None)

    # 통계 건수만큼 네트워크 왕복이 생기므로, 캐시된 JSON 을 병렬로 가져온다 (최대 10 워커).
    with ThreadPoolExecutor(max_workers=min(10, max(1, len(items_to_process)))) as executor:
        results = list(executor.map(_fetch_one, items_to_process))

    # 생성 데이터프레임에 「유」「무」 등으로 들어온 값을 KOSIS 라벨(있다/없다)과 맞추기 위한 맵
    display_to_has = {"유": "있다", "무": "없다"}
    # 자녀 명수: 숫자/문자 혼재 가능 → KOSIS 쪽 라벨 문자열로 통일
    num_to_count = {1: "1명", 2: "2명", 3: "3명이상", "1": "1명", "2": "2명", "3": "3명이상"}

    for item, kosis_data in results:
        if kosis_data is None or not isinstance(kosis_data, list):
            continue
        # 지역 핸들러가 전처리 메서드를 가지면 KOSIS API 데이터도 동일하게 전처리
        if _region_handler is not None and hasattr(_region_handler, "preprocess_validation_data"):
            try:
                kosis_data = _region_handler.preprocess_validation_data(
                    item.get("stat_name", ""), kosis_data
                )
            except Exception:
                pass
        columns = item.get("columns", [])
        is_residence = item.get("is_residence", False)
        is_children_student = item.get("is_children_student", False)
        is_pet = item.get("is_pet", False)
        is_dwelling = item.get("is_dwelling", False)
        is_parents_survival_cohabitation = item.get("is_parents_survival_cohabitation", False)
        is_parents_expense_provider = item.get("is_parents_expense_provider", False)
        is_housing_satisfaction = item.get("is_housing_satisfaction", False)
        is_spouse_economic = item.get("is_spouse_economic", False)
        is_employment_status = item.get("is_employment_status", False)
        is_industry_major = item.get("is_industry_major", False)
        is_job_class = item.get("is_job_class", False)
        is_work_satisfaction = item.get("is_work_satisfaction", False)
        is_pet_cost = item.get("is_pet_cost", False)
        is_income_consumption_satisfaction = item.get("is_income_consumption_satisfaction", False)
        is_education_cost = item.get("is_education_cost", False)
        is_other_region_consumption = item.get("is_other_region_consumption", False)
        is_preset = item.get("is_preset", False)
        stat_name = item.get("stat_name", "")
        targets = get_step2_target_distributions(
            kosis_client, kosis_data, is_residence, columns,
            is_children_student=is_children_student, is_pet=is_pet, is_dwelling=is_dwelling,
            is_parents_survival_cohabitation=is_parents_survival_cohabitation,
            is_parents_expense_provider=is_parents_expense_provider,
            is_housing_satisfaction=is_housing_satisfaction,
            is_spouse_economic=is_spouse_economic,
            is_employment_status=is_employment_status,
            is_industry_major=is_industry_major,
            is_job_class=is_job_class,
            is_work_satisfaction=is_work_satisfaction,
            is_pet_cost=is_pet_cost,
            is_income_consumption_satisfaction=is_income_consumption_satisfaction,
            is_education_cost=is_education_cost,
            is_other_region_consumption=is_other_region_consumption,
            is_preset=is_preset,
            stat_name=stat_name,
            extra_preset_config=_extra_preset_cfg,
        )
        for target in targets:
            if len(target) >= 4:
                col_name, labels, target_p, condition = target[0], target[1], target[2], target[3]
            else:
                col_name, labels, target_p = target[0], target[1], target[2]
                condition = None
            if col_name not in df.columns or not labels or not target_p:
                continue

            # --- 수치형 평균 검증 (범주 분포가 아닌 경우). preset 등에서 확장 가능 ---
            if isinstance(condition, dict) and condition.get("type") == "numeric_mean":
                target_mean = float(condition.get("target_mean", 0.0) or 0.0)
                actual_series = pd.to_numeric(df[col_name], errors="coerce")
                actual_mean = float(actual_series.mean(skipna=True)) if actual_series.notna().any() else 0.0
                abs_error = abs(actual_mean - target_mean)
                mape = (abs_error / target_mean) * 100 if target_mean != 0 else (abs_error * 100 if abs_error > 0 else 0)

                axis_details = [
                    {
                        "label": "평균",
                        "target_value": target_mean,
                        "actual_value": actual_mean,
                        "abs_error_value": abs_error,
                        "mape": mape,
                    }
                ]
                error_report[col_name] = {
                    "axis_name": col_name,
                    "mae_pct": abs_error,  # UI: numeric 일 때는 「비율 오차」가 아니라 절대 오차로 해석
                    "details": axis_details,
                    "metric_type": "numeric",
                }
                continue

            # --- 조건부 부분집단: 예) 자녀 명수는 「자녀 유무=있다」 행만 ---
            if condition is not None and isinstance(condition, (list, tuple)) and len(condition) >= 2:
                cond_col, cond_val = condition[0], condition[1]
                # 자녀 통계: df 는 「유」로 두고 KOSIS 조건은 「있다」 → 매핑 필요
                filter_val = "유" if (is_children_student and str(cond_val).strip() == "있다") else str(cond_val).strip()
                sub = df[df[cond_col].astype(str).str.strip() == filter_val]
                if is_children_student:
                    mapped = sub[col_name].astype(object).map(num_to_count)
                    actual_counts = mapped.value_counts().reindex(list(labels), fill_value=0)
                elif is_pet:
                    actual_counts = sub[col_name].value_counts().reindex(list(labels), fill_value=0)
                else:
                    actual_counts = sub[col_name].value_counts()
                total = len(sub)
            else:
                # --- 전체 행 기준 범주 분포 ---
                if is_children_student:
                    mapped = df[col_name].astype(str).str.strip().map(display_to_has)
                    actual_counts = mapped.value_counts()
                else:
                    actual_counts = df[col_name].value_counts()
                total = len(df)
            axis_errors = []
            axis_details = []
            for label, target_prob in zip(labels, target_p):
                actual_count = actual_counts.get(label, 0)
                actual_prob = actual_count / total if total > 0 else 0
                abs_error = abs(actual_prob - target_prob)
                mape = (abs_error / target_prob) * 100 if target_prob > 0 else (abs_error * 100 if abs_error > 0 else 0)
                axis_errors.append(abs_error)
                axis_details.append({
                    "label": str(label),
                    "target_pct": target_prob * 100,
                    "actual_pct": actual_prob * 100,
                    "abs_error_pct": abs_error * 100,
                    "mape": mape,
                })
            axis_mae = np.mean(axis_errors) if axis_errors else 0
            key = col_name
            error_report[key] = {
                "axis_name": col_name,
                "mae_pct": axis_mae * 100,
                "details": axis_details,
            }
    return error_report


# =============================================================================
# 3) drop_step2_kosis_slug_columns — 임시 슬러그 열 제거
# =============================================================================


def drop_step2_kosis_slug_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    2단계 파이프라인에서 내부용으로 붙였던 컬럼명 `kosis_99__...` 를 제거한다.

    배경: 통계 대입 과정에서 열 이름 충돌을 피하거나, 중간 단계 식별자로 쓴 뒤
    최종 산출물에서는 빼고 싶을 때 접두사를 붙이는 패턴이 있다.
    전 시도 공통 후처리이므로 regions 가 아닌 이 모듈에 둔다.
    """
    out = df.copy()
    slug_cols = [c for c in out.columns if str(c).startswith("kosis_99__")]
    if slug_cols:
        out = out.drop(columns=[c for c in slug_cols if c in out.columns], errors='ignore')
    return out
