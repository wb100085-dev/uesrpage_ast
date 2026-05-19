"""
가상인구 생성 파이프라인·캐시·KOSIS 변환 등 공통 로직.
app.py 및 pages/generate 등에서 import하여 사용.
"""
from generate_logic.kosis_helpers import (
    get_cached_kosis_json,
    fetch_kosis_raw_structure,
    convert_kosis_to_distribution,
    convert_kosis_to_distribution_cached,
    convert_kosis_to_distribution_impl,
)
from generate_logic.ipf_cache import (
    CACHE_TTL_SECONDS,
    hash_dataframe,
    cached_generate_base_population,
)
from generate_logic.excel_export import (
    apply_step2_column_rename,
    blank_unapplied_axis_columns,
    build_excel_bytes_for_download,
)

__all__ = [
    "get_cached_kosis_json",
    "fetch_kosis_raw_structure",
    "convert_kosis_to_distribution",
    "convert_kosis_to_distribution_cached",
    "convert_kosis_to_distribution_impl",
    "CACHE_TTL_SECONDS",
    "hash_dataframe",
    "cached_generate_base_population",
    "apply_step2_column_rename",
    "blank_unapplied_axis_columns",
    "build_excel_bytes_for_download",
]
