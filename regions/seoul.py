"""
서울(시도코드 11) 전용: KOSIS 변환 + 2단계 프리셋·컬럼·UI 제목 등.
1·2단계에서 서울만 다른 로직은 이 파일에서 관리.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from regions.default import DefaultRegionHandler, DEFAULT_DATA_MANAGEMENT_AXES
from regions.base import AxisItem

# 2단계 통계명 키 -> 대입할 컬럼명 튜플 (서울 전용)
SEOUL_STAT_COLUMNS: Dict[str, Tuple[str, ...]] = {
    "교육환경 만족도": ("교육환경 만족도 종합(10점 만접)", "공교육 환경 만족도(10점 만점)", "사교육 환경 만족도(10점 만점)"),
    "녹지환경 만족도": ("녹지환경 만족도",),
    "반려동물 유무 및 취득 경로": ("반려동물 유무", "반려동물 취득경로"),
    "시민행복지수": (
        "행복지수 종합(10점 만점)",
        "자신의 건강상태 행복지수(10점 만점)",
        "자신의 재정상태 행복지수(10점 만점)",
        "주위 친지 친구와의 관계 행복지수(10점 만점)",
        "가정생활 행복지수(10점 만점)",
        "사회생활 행복지수(10점 만점)",
    ),
    "생활환경 만족도": (
        "생활환경 만족도 종합(10점 만점)",
        "주거환경 만족도(10점 만점)",
        "경제환경 만족도(10점 만점)",
        "사회환경 만족도(10점 만점)",
        "교육환경 만족도(10점 만점)",
    ),
    "가사노동 분담정도": ("가사노동 분담정도",),
    "사회적 지원망": ("몸이 아플 때 보살펴 줄 수 있는 사람", "갑자기 금전적인 도움이 필요할 때 돈을 빌려 줄 사람", "낙심하거나 우울해서 이야기할 사람", "어린 자녀 또는 돌봄이 필요한 가족을 맡겨야 할 때 돌봐줄 사람"),
    "사회적 신뢰": (
        "사회적 신뢰종합(10점 만점)",
        "사회적신뢰_가족(10점 만점)",
        "사회적신뢰_이웃(10점 만점)",
        "사회적신뢰_친구(10점 만점)",
        "사회적신뢰_공공 기관(10점 만점)",
        "사회적신뢰_처음 만난 낯선 사람(10점 만점)",
        "사회적신뢰_국내 거주 외국인(10점 만점)",
    ),
    "직업 만족도": ("직업 만족도",),
    "사회적 차별": ("사회적 차별",),
    "환경을 위한 실천": (
        "환경을 위한 실천_종합(10점 만점)",
        "환경을 위한 실천_승용차 대신 도보 자전거 또는 대중교통 이용(10점 만점)",
        "환경을 위한 실천_제로웨이스트가게 이용이나 녹색/친환경제품 구매 노력(10점 만점)",
        "환경을 위한 실천_1회용 플라스틱 사용하지 않기(10점 만점)",
        "환경을 위한 실천_페트병, 종이팩 등 주민센터, 회수기에 배출하기(10점 만점)",
    ),
    "계층이동 가능성": ("나의 계층이동 가능성", "자녀의 계층이동 가능성"),
    "시민자부심": ("시민자부심(10점 만점)",),
    "사회공정": (
        "사회공정성_종합(10점 만점)",
        "사회공정성_교육기회(10점 만점)",
        "사회공정성_취업기회(10점 만점)",
        "사회공정성_과세 및 납세(10점 만점)",
        "사회공정성_복지혜택을 받을 수 있는 기회(10점 만점)",
        "사회공정성_지역균형발전(10점 만점)",
        "사회공정성_법 집행(10점 만점)",
        "사회공정성_정치활동(10점 만점)",
        "사회공정성_성별에 따른 대우(10점 만점)",
        "사회공정성_경제·사회적인 분배 구조(10점 만점)",
        "사회공정성_병역의무 이행(10점 만점)",
    ),
    "일과 소비에 대한 가치관": ("일에 대한 가치관", "소비에 대한 가치관"),
    "부채여부": ("부채 여부",),
    "부채 주된 이유": ("부채 주된 이유",),
    "은퇴후 선호 동거형태": ("은퇴후 선호 동거형태",),
    "사회적 약자에 대한 시민의 주관적 태도": (
        "사회적 약자에 대한 태도_장애아들(10점 만점)",
        "사회적 약자에 대한 태도_가난(10점 만점)",
        "사회적 약자에 대한 태도_어르신(10점 만점)",
        "사회적 약자에 대한 태도_여성(10점 만점)",
        "사회적 약자에 대한 태도_노키즈존(10점 만점)",
    ),
    "노후 생활비 준비 여부 및 방법": ("노후준비여부", "노후 준비방법"),
    "은퇴 후 적정 생활비": ("은퇴 후 적정 생활비",),
    "문화활동 연간 방문횟수": ("년간 전시회 관람", "년간 박물관 관람", "년간 음악 및 무용발표회 관람", "년간 전통예술공연 관람", "년간 연극공연 관람", "년간 영화관람", "년간 대중공연 관람", "년간 운동경기 관람", "년간 문학행사 관람"),
    "문화활동 연간 평균비용": ("년간 전시회 관람 평균 비용(원)", "년간 박물관 관람 평균 비용(원)", "년간 음악 및 무용발표회 관람 평균 비용(원)", "년간 전통예술공연 관람 평균 비용(원)", "년간 연극공연 관람 평균 비용(원)", "년간 영화관람 평균 비용(원)", "년간 대중공연 관람 평균 비용(원)", "년간 운동경기 관람 평균 비용(원)", "년간 문학행사 관람 평균 비용(원)"),
    "서울의 랜드마크": ("서울의 랜드마크 인식",),
    "함께 여가활동하는 사람": ("함께 여가활동하는 사람",),
    "희망 여가 활동 유형": ("희망 여가 활동 유형",),
    "통근/통학(2005년 이후)": ("통근ㆍ통학 여부", "통근ㆍ통학 지역"),
    "통근/통학시 주로 이용하는 교통수단": ("통근/통학시 주로 이용하는 교통수단",),
    "교통수단 이용 만족도(2005년 이후)": ("교통수단 이용 만족도_버스(10점 만점)", "교통수단 이용 만족도_지하철(10점 만점)", "교통수단 이용 만족도_택시(10점 만점)", "교통수단 이용 만족도_시외버스/고속버스(10점 만점)"),
    "통근/통학 소요시간(2009년 이후)": ("통근/통학 소요시간",),
    "보행환경 만족도": ("보행환경 만족도_주거지역(10점 만점)", "보행환경 만족도_서울도심(시내)(10점 만점)"),
    "향후 10년 후 서울시 거주 의향": ("향후 10년 후 서울시 거주 의향",),
    "자원봉사 참여 여부 및 횟수(2011년 이후)": ("자원봉사 참여 여부",),
    "지난 1년간 기부 여부 및 기부 형태": ("기부여부", "기부형태"),
}


class SeoulRegionHandler:
    """서울: ITM_NM·다중 컬럼 검색 등 확장 파싱. 2단계 프리셋·대시보드 제목·edu fallback."""

    def __init__(self) -> None:
        self._default = DefaultRegionHandler()

    def get_data_management_axes(self) -> List[AxisItem]:
        """서울은 직업분류 포함 7축 유지."""
        return list(DEFAULT_DATA_MANAGEMENT_AXES)

    def get_generation_axis_keys(self) -> List[str]:
        return list(DefaultRegionHandler().get_generation_axis_keys())

    def get_dashboard_title(self, sido_name: str) -> str:
        return "서울 가상인구 요약 지표"

    def get_step2_preset_config(self) -> Optional[Dict[str, Any]]:
        from utils.kosis_client import SEOUL_PRESET_STAT_CONFIG
        return SEOUL_PRESET_STAT_CONFIG

    def get_step2_stat_columns(self) -> Optional[Dict[str, Tuple[str, ...]]]:
        return dict(SEOUL_STAT_COLUMNS)

    def use_slug_fallback_for_unknown_stat(self) -> bool:
        """서울: 프리셋에 없는 통계는 kosis_99__ 슬러그로 추가하지 않음."""
        return False

    def get_edu_fallback_handler(self) -> Optional[DefaultRegionHandler]:
        """교육(edu) 변환 실패 시 경북 등 기본 로직 시도."""
        return self._default

    def convert(self, kosis_data: Any, axis_key: str) -> Tuple[List[Any], List[float]]:
        if axis_key == "job":
            return self._default.convert(kosis_data, axis_key)

        labels: List[Any] = []
        values: List[float] = []

        if axis_key == "sigungu":
            exclude_sigungu = ["소계", "합계", "Total", "서울특별시"]
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
                if not isinstance(row, dict):
                    continue
                try:
                    val_float = float(str(row.get("DT", "0")).replace(",", "").strip() or 0)
                except (ValueError, TypeError):
                    continue
                matched = False
                itm_nm = (row.get("ITM_NM") or "").strip()
                if itm_nm and itm_nm not in ("계", "총인구(명)"):
                    if "남자" in itm_nm or "총인구_남자" in itm_nm:
                        gender_map["남자"] += val_float
                        matched = True
                    elif "여자" in itm_nm or "총인구_여자" in itm_nm:
                        gender_map["여자"] += val_float
                        matched = True
                if matched:
                    continue
                for col in ["C2_NM", "C3_NM", "C4_NM", "C1_NM", "C5_NM"]:
                    cell = (row.get(col) or "").strip()
                    if not cell or cell in ("계", "소계", "합계", "Total"):
                        continue
                    if cell in ("남자", "남성", "남"):
                        gender_map["남자"] += val_float
                        matched = True
                        break
                    if cell in ("여자", "여성", "여"):
                        gender_map["여자"] += val_float
                        matched = True
                        break
                if matched:
                    continue
                row_text = " ".join(
                    (str(row.get(f) or "").strip() for f in ["C1_NM", "C2_NM", "C3_NM", "C4_NM", "C5_NM"])
                ).strip()
                row_text_upper = (row_text or "").upper()
                if "남자" in row_text or "남성" in row_text or "MALE" in row_text_upper or re.search(r"\b남\b", row_text):
                    gender_map["남자"] += val_float
                elif "여자" in row_text or "여성" in row_text or "FEMALE" in row_text_upper or re.search(r"\b여\b", row_text):
                    gender_map["여자"] += val_float
                else:
                    for code_field in ["C2_NM", "C3_NM", "C4_NM", "C2", "C3", "C4"]:
                        c = row.get(code_field)
                        if c is None:
                            continue
                        s = str(c).strip()
                        if s in ("1", "1.0") or c == 1:
                            gender_map["남자"] += val_float
                            break
                        if s in ("2", "2.0") or c == 2:
                            gender_map["여자"] += val_float
                            break
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
                age_str = None
                for field in ["C1_NM", "C2_NM", "C3_NM", "C4_NM", "C5_NM"]:
                    cell = (row.get(field) or "").strip()
                    if not cell or cell in ("계", "소계", "합계", "Total"):
                        continue
                    if re.search(r"\d+\s*[-~]\s*\d+", cell) or (re.search(r"^\d+$", cell) and 0 <= int(cell) <= 120):
                        age_str = cell
                        break
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
                    # 1차 시도: 텍스트가 정상일 때(인코딩 문제 없는 경우)
                    if "미혼" in label or label == "미혼":
                        marriage_map["미혼"] = marriage_map.get("미혼", 0) + val_float
                    elif "기혼" in label or label == "기혼":
                        # 출력 라벨은 '배우자 있음'으로 통일
                        marriage_map["배우자 있음"] = marriage_map.get("배우자 있음", 0) + val_float
                    elif "이혼" in label or label == "이혼":
                        marriage_map["이혼"] = marriage_map.get("이혼", 0) + val_float
                    elif "사별" in label or label == "사별":
                        marriage_map["사별"] = marriage_map.get("사별", 0) + val_float
                    elif "하였다" in label or "일하였음" in label or "취업" in label or "경제활동" in label or "일했음" in label:
                        econ_map["경제활동"] = econ_map.get("경제활동", 0) + val_float
                    elif "하지 않았다" in label or "일하지 않았음" in label or "구직" in label or "실업" in label or "비경제" in label:
                        econ_map["비경제활동"] = econ_map.get("비경제활동", 0) + val_float
                    else:
                        job_keywords = ("관리자", "전문가", "사무", "서비스", "판매", "기능", "기계", "조립", "단순노무", "농림", "어업")
                        if any(k in label for k in job_keywords) or (label and label not in ("계", "소계", "합계", "Total")):
                            econ_map["경제활동"] = econ_map.get("경제활동", 0) + val_float
                        else:
                            econ_map["비경제활동"] = econ_map.get("비경제활동", 0) + val_float
            if marriage_map:
                for k, v in marriage_map.items():
                    labels.append(k)
                    values.append(v)
            else:
                # 2차 시도: 인코딩 문제로 '미혼/기혼/사별/이혼' 문자열이 깨지는 경우
                # ITM_NM에 '-' 뒤 혼인 구분 토큰이 들어있어, 빈 토큰을 4분류로 다시 매핑
                marriage_suffix_map: Dict[str, float] = {}
                for row in kosis_data:
                    if not isinstance(row, dict):
                        continue
                    raw_dt = row.get("DT", "0")
                    if raw_dt in ("-", "", None) or not isinstance(raw_dt, str):
                        raw_dt = str(raw_dt or "0")
                    raw_dt = raw_dt.strip()
                    if raw_dt in ("-", ""):
                        continue
                    try:
                        val_float = float(raw_dt)
                    except (ValueError, TypeError):
                        continue
                    itm_nm = str(row.get("ITM_NM") or "").strip()
                    if not itm_nm or "-" not in itm_nm:
                        continue
                    suffix = itm_nm.split("-")[-1].strip()
                    if not suffix:
                        continue
                    marriage_suffix_map[suffix] = marriage_suffix_map.get(suffix, 0.0) + val_float

                marriage_added = False
                if len(marriage_suffix_map) >= 4:
                    ordered = sorted(marriage_suffix_map.items(), key=lambda kv: kv[1], reverse=True)
                    # 빈도 순으로 (배우자 있음 > 미혼 > 사별 > 이혼) 가정
                    target_labels = ["배우자 있음", "미혼", "사별", "이혼"]
                    for lab, (suffix, val) in zip(target_labels, ordered[:4]):
                        labels.append(lab)
                        values.append(val)
                    marriage_added = True
                else:
                    # 그래도 안 되면 기존 fallback(경제활동/비경제활동)
                    marriage_added = False

                if not marriage_added:
                    for econ_type, total_val in econ_map.items():
                        labels.append(econ_type)
                        values.append(total_val)
                if len(labels) == 1 and "경제활동" in econ_map and econ_map["경제활동"] > 0:
                    total_econ = econ_map["경제활동"]
                    labels = ["경제활동", "비경제활동"]
                    values = [total_econ * 0.80, total_econ * 0.20]

        elif axis_key == "edu":
            edu_map = {"중졸이하": 0, "고졸": 0, "대졸이상": 0}
            edu_keywords_low = ["초졸", "무학", "초등", "중졸", "초등학교", "중학교", "미취학", "초등학교졸업", "중학교졸업"]
            edu_keywords_mid = ["고졸", "고등", "고등학교", "고등학교졸업"]
            edu_keywords_high = ["대학", "대졸", "전문대", "석사", "박사", "대학교", "대학원", "졸업", "재학", "수료", "대학교졸업"]

            def _get_edu_label_from_row(r: dict) -> str:
                """성별/경제활동과 동일하게 ITM_NM, C1_NM, C2_NM 우선 사용 (KOSIS 표준 컬럼)."""
                for field in ("ITM_NM", "C1_NM", "C2_NM", "C3_NM", "C4_NM", "C5_NM"):
                    cell = (r.get(field) or "").strip()
                    if not cell or cell in ("계", "전체", "소계", "합계", "Total"):
                        continue
                    if any(k in cell for k in edu_keywords_low + edu_keywords_mid + edu_keywords_high):
                        return cell
                    if "학교" in cell or "졸업" in cell or "재학" in cell:
                        return cell
                return ""

            def _find_edu_cell(r: dict) -> str:
                cells = []
                skip_vals = ("계", "전체", "소계", "합계", "Total", "DT", "PRD_DE", "LST_CHN_DE")
                skip_keys = ("DT", "PRD_DE", "LST_CHN_DE", "ITM_ID", "TBL_ID", "ORG_ID", "PRD_SE")
                for k, v in (r or {}).items():
                    if v is None:
                        continue
                    s = str(v).strip()
                    if not s or s in skip_vals or k.upper() in skip_keys:
                        continue
                    if s.isdigit() or (len(s) >= 6 and s[:4].isdigit()):
                        continue
                    cells.append(s)
                for c in cells:
                    for kw in edu_keywords_low + edu_keywords_mid + edu_keywords_high:
                        if kw in c or kw in c.replace(" ", ""):
                            return c
                for c in cells:
                    if "학교" in c or "졸업" in c or "재학" in c:
                        return c
                for c in cells:
                    c_nospace = c.replace(" ", "")
                    if "학교" in c_nospace or "졸업" in c_nospace:
                        return c
                for c in cells:
                    if any(x in c for x in ["Primary", "Middle", "High", "College", "University", "Univ"]):
                        return c
                return cells[0] if cells else ""

            def _edu_value_from_row(r: dict) -> Optional[float]:
                """KOSIS 행에서 수치 추출 (DT 외 VAL, PRD_DE 등 다양한 키 지원)."""
                for key in ("DT", "VAL", "VALUE", "값", "PRD_DE", "DATA"):
                    v = r.get(key)
                    if v is None:
                        continue
                    s = str(v).replace(",", "").strip()
                    if s and s not in ("-", ""):
                        try:
                            return float(s)
                        except (ValueError, TypeError):
                            pass
                for k, v in (r or {}).items():
                    if k and v is not None and str(k).upper() not in ("DT", "PRD_DE", "LST_CHN_DE", "ITM_ID", "TBL_ID", "ORG_ID", "C1_NM", "C2_NM", "ITM_NM"):
                        try:
                            return float(str(v).replace(",", "").strip())
                        except (ValueError, TypeError):
                            pass
                return None

            for row in kosis_data:
                if not isinstance(row, dict):
                    continue
                label = _get_edu_label_from_row(row) or _find_edu_cell(row)
                if not label:
                    continue
                val_float = _edu_value_from_row(row)
                if val_float is None:
                    continue
                if any(k in label for k in edu_keywords_low):
                    edu_map["중졸이하"] += val_float
                elif any(k in label for k in edu_keywords_mid):
                    edu_map["고졸"] += val_float
                elif any(k in label for k in edu_keywords_high):
                    edu_map["대졸이상"] += val_float
                elif "학교" in label:
                    if "고등" in label:
                        edu_map["고졸"] += val_float
                    elif "대학" in label or "대학교" in label:
                        edu_map["대졸이상"] += val_float
                    else:
                        edu_map["중졸이하"] += val_float
                elif "College" in label or "University" in label or "Univ" in label:
                    edu_map["대졸이상"] += val_float
                elif "High" in label:
                    edu_map["고졸"] += val_float
                elif val_float > 0:
                    edu_map["중졸이하"] += val_float
            if sum(edu_map.values()) == 0:
                edu_map = {"중졸이하": 25.0, "고졸": 40.0, "대졸이상": 35.0}
            for edu_level, total_val in edu_map.items():
                if total_val > 0:
                    labels.append(edu_level)
                    values.append(total_val)

        elif axis_key == "income":
            subjective_map = {"매우 여유있음": 0.0, "약간 여유있음": 0.0, "적정함": 0.0, "약간 부족함": 0.0, "매우 부족함": 0.0}
            for row in kosis_data:
                if not isinstance(row, dict):
                    continue
                itm = (row.get("ITM_NM") or "").strip()
                if itm in ("계", "Total", "소계", ""):
                    continue
                try:
                    val_float = float(str(row.get("DT", "0")).replace(",", "").strip() or 0)
                except (ValueError, TypeError):
                    continue
                if "매우 여유" in itm or itm == "매우 여유있음":
                    subjective_map["매우 여유있음"] += val_float
                elif "약간 여유" in itm or itm == "약간 여유있음":
                    subjective_map["약간 여유있음"] += val_float
                elif "적정" in itm or itm == "적정함":
                    subjective_map["적정함"] += val_float
                elif "약간 부족" in itm or itm == "약간 부족함":
                    subjective_map["약간 부족함"] += val_float
                elif "매우 부족" in itm or itm == "매우 부족함":
                    subjective_map["매우 부족함"] += val_float
            if sum(subjective_map.values()) > 0:
                for k, v in subjective_map.items():
                    if v > 0:
                        labels.append(k)
                        values.append(v)
            if not labels or not values:
                labels, values = self._default.convert(kosis_data, axis_key)

        return labels, values


def _age_to_num_seoul(a: Any) -> Optional[int]:
    if a is None or (isinstance(a, float) and pd.isna(a)):
        return None
    s = str(a).strip()
    for part in re.findall(r"\d+", s):
        return int(part)
    return None


def _is_non_economic_activity(val: Any) -> bool:
    """경제활동 컬럼 값이 '비경제활동' 계열인지 (표기·전각 공백 허용)."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return False
    s = str(val).strip().replace("\u3000", " ").strip()
    if not s or s.lower() in ("nan", "none"):
        return False
    if s in ("비경제활동", "비경제 활동"):
        return True
    if "비경제활동" in s.replace(" ", ""):
        return True
    return False


def _strip_occupational_pension_fragments(text: Any) -> str:
    """재직 전제인 공무원·교원·군인 연금 등 문구만 제거. 남는 항목이 없으면 '국민연금'."""
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return ""
    s = re.sub(r"\s+", " ", str(text).strip())
    if not s:
        return s
    for pat in (
        r"사립\s*학교\s*교원\s*연금",
        r"사립\s*교원\s*연금",
        r"교원\s*연금",
        r"교원연금",
        r"공무원\s*/?\s*연금",
        r"공무원연금",
        r"군인\s*연금",
        r"군인연금",
    ):
        s = re.sub(pat, "", s, flags=re.IGNORECASE)
    s = re.sub(r"\b사립\b", "", s, flags=re.IGNORECASE)
    s = re.sub(r"[\s,、/]+", " ", s).strip(" ,、/")
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return "국민연금"
    return s


def apply_seoul_step2_row_consistency(df: pd.DataFrame) -> pd.DataFrame:
    """2단계 통계 대입 후 행 방향 논리 일관성 (서울 전용)."""
    out = df.copy()

    age_col = "연령"
    ages = out[age_col].map(_age_to_num_seoul) if age_col in out.columns else None

    econ_col = "경제활동"
    non_econ_mask: Optional[pd.Series] = None
    if econ_col in out.columns:
        non_econ_mask = out[econ_col].map(_is_non_economic_activity).fillna(False)
        employment_related_columns = [
            "종사상 지위", "직장명(산업 대분류)", "하는 일의 종류(직업 종분류)",
            "하는일 만족도", "임금/가구소득 만족도", "근로시간 만족도", "근무환경 만족도", "근무 여건 전반적인 만족도",
        ]
        for col in employment_related_columns:
            if col in out.columns:
                out.loc[non_econ_mask, col] = ""

        job_col_econ = "직업분류"
        if job_col_econ in out.columns:
            # 비경제활동이면 직업군·만족도는 항상 '일 없음'에 맞춤 (부분 일치·누락 방지)
            out.loc[non_econ_mask, job_col_econ] = "해당없음"
        job_sat_col = "직업 만족도"
        if job_sat_col in out.columns:
            out.loc[non_econ_mask, job_sat_col] = ""

    spouse_econ_col = "배우자의 경제활동 상태"
    if ages is not None and spouse_econ_col in out.columns:
        minor_mask = ages.notna() & (ages < 20)
        out.loc[minor_mask, spouse_econ_col] = "무"

    job_col = "직업분류"
    house_col = "가사노동 분담정도"
    gender_col = "성별"
    if ages is not None and job_col in out.columns:
        young_career = ages.notna() & (ages <= 25)
        mgmt = out[job_col].astype(str).str.strip().eq("관리전문직")
        out.loc[young_career & mgmt, job_col] = "화이트칼라"
    if ages is not None and house_col in out.columns and gender_col in out.columns:
        young = ages.notna() & (ages < 35)
        male = out[gender_col].astype(str).str.strip().isin(("남자", "남성"))
        female = out[gender_col].astype(str).str.strip().isin(("여자", "여성"))
        hc = out[house_col].astype(str).fillna("")
        wife_all = hc.str.contains("아내가 전적으로", na=False)
        out.loc[young & male & wife_all, house_col] = "아내와 남편이 공평하게 나눠하고 있다"
        husband_all = hc.str.contains("남편이 전적으로", na=False)
        out.loc[young & female & husband_all, house_col] = "아내와 남편이 공평하게 나눠하고 있다"

    from regions.common import apply_pet_consistency, apply_debt_consistency, apply_donation_consistency
    apply_pet_consistency(out)
    apply_debt_consistency(out)
    apply_donation_consistency(out)

    old_prep_col = None
    old_method_col = None
    for c in out.columns:
        s = str(c)
        if "노후" in s and "여부" in s:
            old_prep_col = c
        if "노후" in s and "방법" in s:
            old_method_col = c
    if old_prep_col and old_method_col and old_prep_col in out.columns and old_method_col in out.columns:
        # '노후 준비 방법'은 '노후 준비 여부'가 '준비하고 있다'일 때만 채움.
        has_old_prep = out[old_prep_col].astype(str).str.strip().eq("준비하고 있다")
        out.loc[~has_old_prep, old_method_col] = ""

        if econ_col in out.columns and ages is not None:
            ne = out[econ_col].map(_is_non_economic_activity).fillna(False)
            # 은퇴 연령대는 직역연금 응답이 현실적일 수 있어, 중장년 미만만 재직형 연금 문구 제거
            youngish = ages.notna() & (ages < 55)
            fix_pension = ne & youngish & has_old_prep
            if fix_pension.any():
                out.loc[fix_pension, old_method_col] = out.loc[fix_pension, old_method_col].map(
                    _strip_occupational_pension_fragments
                )

    # 녹지환경 만족도: KOSIS 평균 라벨(10점 평균)이 값으로 들어오는 케이스가 있어 제거
    green_col = "녹지환경 만족도"
    if green_col in out.columns:
        green_s = out[green_col].astype(str).str.strip()
        out.loc[green_s.str.startswith("10"), green_col] = ""

    # 통근/통학: '통근ㆍ통학 여부'가 아니면 상세 컬럼을 비워줌.
    commute_has_col = "통근ㆍ통학 여부"
    commute_time_col = "통근/통학 소요시간"
    commute_region_col = "통근ㆍ통학 지역"
    commute_transport_col = "통근/통학시 주로 이용하는 교통수단"
    if commute_has_col in out.columns:
        commute_s = out[commute_has_col].astype(str).fillna("").str.strip()
        commute_norm = commute_s.str.replace(" ", "", regex=False)
        # KOSIS/템플릿이 섞여 들어와도 '통근·통학 안함' 계열을 넓게 탐지
        commute_no_mask = (
            commute_norm.eq("")
            | commute_norm.isin(("없다", "없음", "아니오", "아니", "무", "해당없음", "비해당", "해당 없음"))
            | commute_norm.str.contains(r"(?:없다|없음|해당없음|비해당|아니오|아니|무)", case=False, na=False, regex=True)
            | commute_norm.str.contains(r"(?:통근.*않|통학.*않|하지않|안한다|안함|않는다|않음|못한다|않)", case=False, na=False, regex=True)
        )
        for col in (commute_time_col, commute_region_col, commute_transport_col):
            if col in out.columns:
                out.loc[commute_no_mask, col] = ""

    # 통근/통학: '통근ㆍ통학 지역'이 '다른 구'인데 '도보/자전거'인 경우는 비현실적이므로 보정
    # (요청 사항: 다른 구면 도보/자전거 불가)
    if commute_region_col in out.columns and commute_transport_col in out.columns:
        region_s = out[commute_region_col].astype(str).fillna("").str.strip()
        transport_s = out[commute_transport_col].astype(str).fillna("").str.strip()

        other_gu_mask = region_s.str.contains("다른 구", na=False)
        walk_bike_mask = transport_s.str.contains(r"(?:도보|자전거)", na=False, regex=True)
        fix_mask = other_gu_mask & walk_bike_mask

        if fix_mask.any():
            # 같은 데이터셋(현재 df) 내에서 다른 구일 때 도보/자전거를 제외한 교통수단의 최빈값을 대체값으로 사용
            allowed_s = transport_s.loc[other_gu_mask & ~walk_bike_mask]
            replacement = ""
            if not allowed_s.empty:
                replacement = str(allowed_s.mode(dropna=True).iloc[0])
            if not replacement:
                # 최빈값이 비는 극단 케이스 대비
                replacement = "버스(버스간 환승 포함)"

            out.loc[fix_mask, commute_transport_col] = replacement

            # 소요시간도 한 단계 길게 보정(있을 때만)
            if commute_time_col in out.columns:
                time_s = out[commute_time_col].astype(str).fillna("").str.strip()

                def _next_time_bucket(t: str) -> str:
                    t = t.strip()
                    if "30분 미만" in t:
                        return "30분-1시간 미만"
                    if "30분-1시간" in t:
                        return "1시간-1시간 30분 미만"
                    if "1시간-1시간 30분" in t:
                        return "1시간 30분 이상"
                    return t

                out.loc[fix_mask, commute_time_col] = time_s.loc[fix_mask].map(_next_time_bucket)

    return out
