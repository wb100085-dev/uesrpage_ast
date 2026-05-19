"""
지역별 KOSIS 변환 로직 패키지.
- 새 지역 추가: regions/{시도코드}_{이름}.py 에 핸들러 클래스 추가 후 아래 REGISTRY 에 등록.
- 기존 지역 파일은 수정하지 않음.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

import pandas as pd

from regions.base import AxisItem, DEFAULT_GENERATION_AXIS_KEYS, RegionHandler
from regions.default import DefaultRegionHandler
from regions.seoul import SeoulRegionHandler
from regions.daegu import DaeguRegionHandler
from regions.gyeongbuk import GyeongbukRegionHandler

if TYPE_CHECKING:
    from typing import Any, Dict, Optional

# 시도코드 -> 해당 지역 핸들러 인스턴스
# 새 지역 추가: regions/{지역명}.py 에 클래스 추가 후 여기에 등록 (기존 지역 파일 수정 불필요)
_REGION_HANDLERS: dict[str, RegionHandler] = {
    "11": SeoulRegionHandler(),
    "22": DaeguRegionHandler(),
    "37": GyeongbukRegionHandler(),
}
_DEFAULT_HANDLER = DefaultRegionHandler()


def get_region_handler(sido_code: str) -> RegionHandler:
    """시도코드에 해당하는 지역 핸들러 반환. 등록되지 않은 시도는 기본(경상북도 등) 로직 사용."""
    code = str(sido_code or "").strip()
    return _REGION_HANDLERS.get(code, _DEFAULT_HANDLER)


def get_data_management_axes(sido_code: str) -> list[AxisItem]:
    """데이터 관리 > 인구통계 기본 소스에 노출할 축 목록. 지역별로 다를 수 있음."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "get_data_management_axes") and callable(getattr(handler, "get_data_management_axes")):
        return list(handler.get_data_management_axes())
    from regions.default import DEFAULT_DATA_MANAGEMENT_AXES
    return list(DEFAULT_DATA_MANAGEMENT_AXES)


def get_generation_axis_keys(sido_code: str) -> list[str]:
    """1단계에서 마진 수집·반영할 축 키 목록. 지역별로 다름 (예: 대구는 job 제외)."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "get_generation_axis_keys") and callable(getattr(handler, "get_generation_axis_keys")):
        return list(handler.get_generation_axis_keys())
    return list(DEFAULT_GENERATION_AXIS_KEYS)


def get_dashboard_title(sido_code: str, sido_name: str) -> str:
    """생성 결과 대시보드 상단 제목. 지역별로 다름 (예: 서울은 '서울 가상인구 요약 지표')."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "get_dashboard_title") and callable(getattr(handler, "get_dashboard_title")):
        return handler.get_dashboard_title(sido_name)
    return "요약 지표"


def get_step2_preset_config(sido_code: str) -> "Optional[Dict[str, Any]]":
    """2단계 통계 대입 시 사용할 프리셋 설정. 서울만 반환, 그 외 None."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "get_step2_preset_config") and callable(getattr(handler, "get_step2_preset_config")):
        return handler.get_step2_preset_config()
    return None


def get_step2_stat_columns(sido_code: str) -> "Optional[Dict[str, tuple]]":
    """2단계 프리셋 통계명 → 대입 컬럼명 튜플. get_step2_preset_config와 쌍으로 사용."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "get_step2_stat_columns") and callable(getattr(handler, "get_step2_stat_columns")):
        return handler.get_step2_stat_columns()
    return None


def use_slug_fallback_for_unknown_stat(sido_code: str) -> bool:
    """프리셋에 없는 통계를 kosis_99__ 슬러그로 추가할지. 서울: False, 그 외: True."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "use_slug_fallback_for_unknown_stat") and callable(getattr(handler, "use_slug_fallback_for_unknown_stat")):
        return handler.use_slug_fallback_for_unknown_stat()
    return True


def get_edu_fallback_handler(sido_code: str) -> "Optional[RegionHandler]":
    """교육(edu) 변환 실패 시 시도할 대체 핸들러. 서울: 경북 등, 그 외: None."""
    handler = get_region_handler(sido_code)
    if hasattr(handler, "get_edu_fallback_handler") and callable(getattr(handler, "get_edu_fallback_handler")):
        return handler.get_edu_fallback_handler()
    return None


def apply_step2_row_consistency_for_sido(sido_code: str, df: pd.DataFrame) -> pd.DataFrame:
    """2단계 행 방향 일관성 — 시도별 구현(`apply_*_step2_row_consistency`)로 분기."""
    code = str(sido_code or "").strip()
    if code == "11":
        from regions.seoul import apply_seoul_step2_row_consistency
        return apply_seoul_step2_row_consistency(df)
    if code == "22":
        from regions.daegu import apply_daegu_step2_row_consistency
        return apply_daegu_step2_row_consistency(df)
    if code == "37":
        from regions.gyeongbuk import apply_gyeongbuk_step2_row_consistency
        return apply_gyeongbuk_step2_row_consistency(df)
    from regions.default import apply_default_step2_row_consistency
    return apply_default_step2_row_consistency(df)


def register_region(sido_code: str, handler: RegionHandler) -> None:
    """런타임에 지역 핸들러 추가 (테스트·플러그인용)."""
    _REGION_HANDLERS[str(sido_code).strip()] = handler
