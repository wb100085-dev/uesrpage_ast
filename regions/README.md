# 지역별 로직 (1·2단계 통합)

지역마다 **`regions/{지역}.py`** 한 파일에서 데이터 관리 축, 1단계 생성 축, 2단계 프리셋·후처리, `convert`, UI 제목 등을 관리합니다 (예: 서울 `seoul.py`, 경북 `gyeongbuk.py`).

앱 전역의 시도코드 상수·판별(`is_gyeongbuk` 등)은 **`regions/sido_codes.py`** 에 둡니다 (핸들러 등록과 분리).

새 지역 추가 시 `regions/{지역}.py` 추가·`regions/__init__.py` 등록만 하면 됩니다.

## 구조

| 파일 | 역할 |
|------|------|
| **sido_codes.py** | `SIDO_*` 상수, `is_seoul` / `is_gyeongbuk` 등 판별 헬퍼 |
| **base.py** | `RegionHandler` 프로토콜, `AxisItem` 타입, `DEFAULT_GENERATION_AXIS_KEYS` |
| **default.py** | **미등록 시도 fallback**: convert, 데이터관리 7축, 1단계 7축, 2단계 없음, 대시보드 "요약 지표" |
| **gyeongbuk.py** | 경상북도(37): 핸들러·6축·default 변환·2단계 개연성(`apply_gyeongbuk_step2_logical_consistency_*`)·DF 후처리(`apply_gyeongbuk_step2_postprocess`) |
| **seoul.py** | 서울(11): convert + 2단계 프리셋·컬럼, 대시보드 "서울 가상인구 요약 지표", edu fallback, 슬러그 미사용 |
| **daegu.py** | 대구(22): convert는 default와 동일, 데이터관리·1단계 **6축**(직업 제외) |
| **__init__.py** | 핸들러 등록·위 헬퍼 + `apply_step2_row_consistency_for_sido`(시도별 행 일관성 분기) |

## 지역별로 구현 가능한 항목

- **convert** (필수) – KOSIS 원본 → (라벨 목록, 값 목록)
- **get_data_management_axes** (필수) – 데이터 관리 > 인구통계 기본 소스에 노출할 축 (예: 대구는 job 제외)
- **get_generation_axis_keys** – 1단계에서 마진 수집할 축 (기본 7축, 대구는 6축)
- **get_dashboard_title(sido_name)** – 생성 결과 대시보드 제목 (서울: "서울 가상인구 요약 지표")
- **get_step2_preset_config** – 2단계 통계 대입 프리셋 (서울만 반환, 그 외 None)
- **get_step2_stat_columns** – 프리셋 통계명 → 대입 컬럼명 튜플 (서울만)
- **use_slug_fallback_for_unknown_stat** – 프리셋 없을 때 kosis_99__ 슬러그 추가 여부 (서울: False)
- **get_edu_fallback_handler** – edu 변환 실패 시 시도할 핸들러 (서울: 경북 등 기본)

## 새 지역 추가 방법

1. **새 파일 생성**  
   `regions/{지역명}.py` (예: `regions/busan.py`)

2. **핸들러 클래스 구현**  
   - `convert`, `get_data_management_axes` 필수.
   - 나머지는 필요할 때만 오버라이드. 구현 안 하면 `regions` 헬퍼에서 기본값 사용(예: 7축, "요약 지표", 2단계 None, 슬러그 사용).
   - 공통 로직은 `DefaultRegionHandler()` 에 위임.

   ```python
   from regions.default import DefaultRegionHandler, DEFAULT_DATA_MANAGEMENT_AXES

   class BusanRegionHandler:
       def __init__(self):
           self._default = DefaultRegionHandler()

       def get_data_management_axes(self):
           return list(DEFAULT_DATA_MANAGEMENT_AXES)  # 또는 부산 전용 축

       def convert(self, kosis_data, axis_key):
           return self._default.convert(kosis_data, axis_key)
   ```

3. **등록**  
   `regions/__init__.py` 에서:
   - `from regions.busan import BusanRegionHandler` 추가
   - `_REGION_HANDLERS["21"] = BusanRegionHandler()` 추가 (21 = 부산 시도코드)

이렇게 하면 1·2단계와 데이터 관리에서 지역별로 다른 부분을 각 지역 파일 한 곳에서 관리할 수 있습니다.
