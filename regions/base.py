"""
지역별 로직의 공통 인터페이스.
- 1단계: KOSIS 변환(convert), 생성에 쓸 축 목록(get_generation_axis_keys)
- 2단계: 프리셋/컬럼(get_step2_preset_config, get_step2_stat_columns), 미매칭 시 슬러그 여부(use_slug_fallback_for_unknown_stat)
- UI: 데이터 관리 축(get_data_management_axes), 대시보드 제목(get_dashboard_title)
새 지역 추가 시 regions/{지역}.py 에 핸들러 구현 후 __init__.py 에 등록.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple, Protocol

# 데이터 관리(인구통계 기본 소스)에서 쓰는 축: (axis_key, 표시 라벨)
AxisItem = Tuple[str, str]

# 2단계 프리셋: 통계명 키 -> preset 설정 딕셔너리 (kosis_client.assign_preset_stat_columns 인자)
Step2PresetConfig = Dict[str, Dict[str, Any]]
# 2단계: 통계명 키 -> 대입할 컬럼명 튜플
Step2StatColumns = Dict[str, Tuple[str, ...]]


# 1단계 기본 축 목록 (직업 포함). 지역에서 get_generation_axis_keys()로 오버라이드 가능.
DEFAULT_GENERATION_AXIS_KEYS = ["sigungu", "gender", "age", "econ", "income", "edu", "job"]


class RegionHandler(Protocol):
    """지역별 1·2단계 로직. 필수: convert, get_data_management_axes. 나머지는 선택(미구현 시 regions 헬퍼에서 기본값 반환)."""

    def convert(self, kosis_data: Any, axis_key: str) -> Tuple[List[Any], List[float]]:
        """KOSIS 원본 → (라벨 목록, 값 목록). 호출 측에서 확률 정규화."""
        ...

    def get_data_management_axes(self) -> List[AxisItem]:
        """데이터 관리 > 인구통계 기본 소스에 노출할 축 목록."""
        ...


# 선택 메서드(문서용). 구현 시: get_generation_axis_keys, get_dashboard_title,
# get_step2_preset_config, get_step2_stat_columns, use_slug_fallback_for_unknown_stat, get_edu_fallback_handler
