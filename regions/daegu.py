"""
대구(시도코드 22) 전용 설정.
인구통계 기본 소스에 경제활동(econ) 대신 혼인상태(marital) 사용 — 대구 7축.
KOSIS 변환 로직은 gender/age/edu/marital 모두 대구 전용 파서 사용.

대구 KOSIS 데이터 필드 구조:
  동·읍·면_연령별 주민등록인구(내국인):
    C1_NM=동읍면명, C2_NM="X 세"(연령), ITM_NM="계"/"남자"/"여자", DT=인구수
  성, 연령 및 혼인상태별 인구 - 시군구:
    C1_NM=지역명, C2_NM=연령대("20세미만" 등), ITM_NM="여자_미혼"/"남자_유배우" 등, DT=인구수
  성, 연령 및 교육정도, 교육상태별 인구(6세이상, 내국인)-시군구:
    C1_NM=구명, C2_NM="계", ITM_NM="초등학교-계"/"고등학교-계" 등, DT=인구수
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, List, Optional, Tuple

import pandas as pd

# 로컬 인구 JSON 경로 (프로젝트 루트 기준)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DAEGU_LOCAL_JSON_PATH = os.path.join(
    _PROJECT_ROOT,
    "가상인구DB", "통계목록", "22. 대구광역시", "통계JSON",
    "동·읍·면_연령별 주민등록인구(내국인).json",
)

_DAEGU_LOCAL_POP_CACHE: Optional[list] = None


def _load_daegu_local_pop_json() -> list:
    """대구 로컬 인구 JSON 로드 (모듈 단위 캐시). 파일 없으면 빈 리스트."""
    global _DAEGU_LOCAL_POP_CACHE
    if _DAEGU_LOCAL_POP_CACHE is not None:
        return _DAEGU_LOCAL_POP_CACHE
    try:
        with open(_DAEGU_LOCAL_JSON_PATH, encoding="utf-8") as f:
            _DAEGU_LOCAL_POP_CACHE = json.load(f)
    except Exception:
        _DAEGU_LOCAL_POP_CACHE = []
    return _DAEGU_LOCAL_POP_CACHE

from regions.base import AxisItem
from regions.default import DefaultRegionHandler

# 데이터 관리: 대구 7축 (거주지역·성별·연령·교육정도·직업별·혼인상태·월평균 가구 소득)
DAEGU_DATA_MANAGEMENT_AXES: List[AxisItem] = [
    ("sigungu", "거주지역"),
    ("gender", "성별"),
    ("age", "연령"),
    ("edu", "교육정도"),
    ("job", "직업별"),
    ("marital", "혼인상태"),
    ("income", "월평균 가구 소득"),
]


# 1단계 생성 축: 대구 7축 (econ 대신 marital)
DAEGU_GENERATION_AXIS_KEYS = ["sigungu", "gender", "age", "edu", "job", "marital", "income"]

# 혼인상태 라벨 우선순위 (KOSIS 정규화용)
_MARITAL_ORDER = ["기혼", "미혼", "이혼", "사별"]

# 대구 동→구 매핑 (KOSIS 동 단위 데이터를 구 단위로 집계)
_DAEGU_DONG_TO_GU: dict = {
    # 중구
    "성내1동": "중구", "성내2동": "중구", "성내3동": "중구",
    "삼덕동": "중구", "동인동": "중구", "동인1가동": "중구", "동인2가동": "중구",
    "대신동": "중구", "대봉1동": "중구", "대봉2동": "중구",
    "남산1동": "중구", "남산2동": "중구", "남산3동": "중구", "남산4동": "중구",
    "봉산동": "중구", "수창동": "중구", "달성동": "중구", "향촌동": "중구",
    "도원동": "중구",
    # 동구
    "동촌동": "동구", "불로봉무동": "동구", "봉무동": "동구",
    "안심1동": "동구", "안심2동": "동구", "안심3동": "동구", "안심4동": "동구",
    "용계동": "동구", "고산1동": "동구", "고산2동": "동구",
    "해안동": "동구", "방촌동": "동구", "도평동": "동구", "지저동": "동구",
    "신암1동": "동구", "신암2동": "동구", "신암3동": "동구", "신암4동": "동구", "신암5동": "동구",
    "효목1동": "동구", "효목2동": "동구",
    "신천1·2동": "동구", "신천3동": "동구", "신천4동": "동구",
    "동호동": "동구", "혁신동": "동구",
    # 서구
    "비산1동": "서구", "비산2동": "서구", "비산3동": "서구", "비산4동": "서구",
    "비산5동": "서구", "비산6동": "서구", "비산7동": "서구",
    "내당1동": "서구", "내당2동": "서구", "내당3동": "서구", "내당4동": "서구",
    "평리1동": "서구", "평리2동": "서구", "평리3동": "서구",
    "평리4동": "서구", "평리5동": "서구", "평리6동": "서구",
    # 남구
    "봉덕1동": "남구", "봉덕2동": "남구", "봉덕3동": "남구",
    "이천동": "남구",
    "대명1동": "남구", "대명2동": "남구", "대명3동": "남구", "대명4동": "남구",
    "대명5동": "남구", "대명6동": "남구", "대명9동": "남구", "대명10동": "남구", "대명11동": "남구",
    # 북구
    "고성동": "북구", "칠성동": "북구",
    "침산1동": "북구", "침산2동": "북구", "침산3동": "북구",
    "산격1동": "북구", "산격2동": "북구", "산격3동": "북구", "산격4동": "북구",
    "대현동": "북구", "동변동": "북구", "읍내동": "북구",
    "국우동": "북구", "관음동": "북구",
    "태전1동": "북구", "태전2동": "북구",
    "구암동": "북구", "조야동": "북구",
    "복현1동": "북구", "복현2동": "북구",
    "검단동": "북구", "학정동": "북구",
    # 수성구
    "범물1동": "수성구", "범물2동": "수성구",
    "황금1동": "수성구", "황금2동": "수성구",
    "수성1가동": "수성구", "수성2·3가동": "수성구", "수성4가동": "수성구",
    "만촌1동": "수성구", "만촌2동": "수성구", "만촌3동": "수성구",
    "두산동": "수성구",
    "지산1동": "수성구", "지산2동": "수성구",
    "범어1동": "수성구", "범어2동": "수성구", "범어3동": "수성구", "범어4동": "수성구",
    "고모동": "수성구", "파동": "수성구", "대흥동": "수성구", "시지동": "수성구",
    # 달서구
    "성당동": "달서구", "두류1·2동": "달서구", "두류3동": "달서구",
    "달서1동": "달서구", "내당동": "달서구", "감삼동": "달서구",
    "본동": "달서구", "죽전동": "달서구", "장기동": "달서구",
    "용산1동": "달서구", "용산2동": "달서구",
    "이곡1동": "달서구", "이곡2동": "달서구",
    "신당동": "달서구",
    "월성1동": "달서구", "월성2동": "달서구",
    "진천동": "달서구",
    "상인1동": "달서구", "상인2동": "달서구", "상인3동": "달서구",
    "송현1동": "달서구", "송현2동": "달서구",
    "갈산동": "달서구",
    "유천1동": "달서구", "유천2동": "달서구",
    "본리동": "달서구",
    # 달성군
    "화원읍": "달성군", "논공읍": "달성군", "다사읍": "달성군",
    "옥포읍": "달성군", "현풍읍": "달성군", "유가읍": "달성군",
    "구지면": "달성군", "하빈면": "달성군", "가창면": "달성군", "설화면": "달성군",
}

_GU_ORDER = ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군"]


_DAEGU_STAT_JSON_DIR = os.path.join(
    _PROJECT_ROOT,
    "가상인구DB", "통계목록", "22. 대구광역시", "통계JSON",
)

# 모듈 단위 step2 로컬 JSON 캐시
_DAEGU_STEP2_LOCAL_CACHE: dict = {}

# 스마트기기 사용시간: JSON에서 읽은 1일 평균 사용시간 (시간) — apply 단계에서 사용
_DAEGU_SMART_DEVICE_MEAN: float = 3.0

# ── 소득의 소비지출 비중: C1/C2 numeric-only JSON → C1_NM/C2_NM 주입 테이블 ──
_INCOME_C1_LABELS: dict = {"1004": "대구광역시"}
_INCOME_C2_LABELS: dict = {
    "1052": "소비지출",
    "1053": "저축",
    "1055": "식비",
    "2056": "주거·수도·광열",
    "3057": "보건",
    "4058": "교육",
    "5059": "교통",
}

# ── 여가활동 시간 및 비용: C1/C2 numeric-only JSON → C1_NM/C2_NM 주입 테이블 ──
_LEISURE_C1_LABELS: dict = {"1004": "대구광역시"}
_LEISURE_C2_LABELS: dict = {
    "10052": "평일 여가시간(시간/일)",
    "10056": "월평균 여가비용(만원)",
    "20053": "주말 여가시간(시간/일)",
}

# 2단계 컬럼 표시 순서 (주제별 그룹화)
_DAEGU_STEP2_COLUMN_ORDER = [
    # ── 주거·부동산 ──────────────────────────────────────────────────────────
    "주거유형",
    "주거환경 만족도",
    "자가 소유 희망",
    "집을 소유해야 하는 이유",
    # ── 경제·소득 ────────────────────────────────────────────────────────────
    "월평균 가구소득(가구주)",
    "가구소득 만족도(가구주)",
    "소비생활 만족도",
    "소비지출 비중(%)",
    "저축 비중(%)",
    "식비 비중(%)",
    "주거비 비중(%)",
    "보건비 비중(%)",
    "교육비 비중(%)",
    "교통비 비중(%)",
    "자산관리 방법(가구주)",
    "생계유지 어려움 경험 정도",
    # ── 경제활동·직업 ────────────────────────────────────────────────────────
    "일자리 만족도",
    "현 직장에서의 근속연수",
    "경제활동 은퇴시기",
    "노후에 가장 심각하게 느끼는 문제",
    # ── 교통·이동 ────────────────────────────────────────────────────────────
    "주된 교통수단",
    "교통수단 만족도",
    "대중교통 이용 시 문제점",
    "보행 만족도",
    "통근·통학 목적지",
    "통근·통학 소요시간",
    # ── 가족·가구 ────────────────────────────────────────────────────────────
    "가족관계 만족도",
    "부모 생존 및 동거여부",
    "비혼동거에 대한 견해",
    "미취학자녀 유무",
    "취학자녀 유무",
    "남편 하루 평균 여유시간(시간)",
    "부인 하루 평균 여유시간(시간)",
    "5년이내 타 시도 이주의향",
    # ── 여가·문화 ────────────────────────────────────────────────────────────
    "주말이나 휴일의 여가활동",
    "거주지역 여가활동 만족도",
    "규칙적 체육활동 참여 빈도",
    "체육동호회 가입여부",
    "평일 여가시간(시간/일)",
    "주말 여가시간(시간/일)",
    "월평균 여가비용(만원)",
    "스마트기기 주 사용",
    "1일 평균 사용시간(시간)",
    "시간 사용에 대한 만족도",
    # ── 의료·건강 ────────────────────────────────────────────────────────────
    "주관적 건강수준",
    "건강유지 노력도",
    "평소 건강관리 방법",
    "식습관(아침식사 여부)",
    "주 이용 의료서비스",
    "의료서비스 만족도",
    # ── 교육 ─────────────────────────────────────────────────────────────────
    "학생의 학교교육 만족도",
    "학부모의 자녀 학교교육 만족도",
    # ── 소비·구매경로 ────────────────────────────────────────────────────────
    "구매경로_식료품",
    "구매경로_배달음식",
    "구매경로_의류",
    "구매경로_이미용품",
    "구매경로_주거가구",
    "구매경로_서적문구",
    "구매경로_기타잡화",
    # ── 사회의식·가치관 ──────────────────────────────────────────────────────
    "공동체 의식",
    "시민의식",
    "준법수준 인식(나를 제외한 사회구성원)",
    "부패에 대한 인식",
    "사회계층 이동 가능성",
    "주관적 사회계층 의식",
    "성별 차별 인식",
    "학력 차별 인식",
    "연령 차별 인식",
    "장애 차별 인식",
    "소득 차별 인식",
    "출신지역 차별 인식",
    "외모 차별 인식",
    "외국인과의 관계",
    "일반인에 대한 신뢰",
    "기관 신뢰",
    "인터넷 커뮤니티 활동 여부",
    "사회적 지원(사회적관계별 소통정도)",
    # ── 자원봉사·기부 ────────────────────────────────────────────────────────
    "기부경험 및 기부방법",
    "기부하지 않은 이유",
    "자원봉사활동 참여율과 평균시간",
    "자원봉사활동 참여 의향 및 희망분야",
    "자원봉사활동 미참여 이유",
    # ── 생활 만족도·정서 ─────────────────────────────────────────────────────
    "삶에 대한 만족감",
    "지역의 전반적인 생활 만족도",
    "하는 일(주요 활동)의 가치 인식",
    "최근(어제) 정서경험(걱정)",
    "최근(어제) 정서경험(행복)",
    "민원서비스 만족도",
    "민원서비스 개선사항",
    "대구시민 자부심",
    # ── 안전·환경 ────────────────────────────────────────────────────────────
    "범죄피해에 대한 두려움",
    "일상생활속 위험요소 대처방법 인지도",
    "안전환경에 대한 평가",
    "환경문제 인식",
    "환경보존 노력",
    "환경체감도",
    # ── 복지·지역 정책 ───────────────────────────────────────────────────────
    "복지정책 개선분야",
    "지역의 사회복지서비스 만족도",
    "청년층 육성을 위한 우선 지원정책",
    "인구정책 우선순위",
]

# 대구 2단계 프리셋 — C1_NM="대구광역시" 행의 C2_NM 분포를 단일 컬럼에 대입
_D = {"mode": "single_c2", "c1_all_only": True, "c1_allow": ["대구광역시"]}

# 만족도 / 점수 혼합형: "평균 점수(10점 만점)" 행을 제거하고 범주만 사용
def _score_cat(vals: list) -> dict:
    return {
        "mode": "single_c2",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        "value_normalize": {v: v for v in vals},
        "restrict_to_mapped_values": True,
    }

# yes/no + 세부항목 혼합형: "있다"/"없다"만 사용
_YN = {
    "mode": "single_c2",
    "c1_all_only": True,
    "c1_allow": ["대구광역시"],
    "value_normalize": {"있다": "있다", "없다": "없다"},
    "restrict_to_mapped_values": True,
}

# 구매경로: "있다"/"없다"/"오프라인"/"온라인" 집계행을 제외하고 실제 채널만 추출
_PURCHASE_CHANNELS = {
    "mode": "single_c2",
    "c1_all_only": True,
    "c1_allow": ["대구광역시"],
    "value_normalize": {
        "전통시장": "전통시장",
        "대형할인마트": "대형할인마트",
        "슈퍼(편의점)": "슈퍼(편의점)",
        "백화점": "백화점",
        "전문점": "전문점",
        "TV 홈쇼핑": "TV 홈쇼핑",
        "인터넷 쇼핑몰": "인터넷 쇼핑몰",
        "소셜 커머스(쿠팡 티몬 등)": "소셜 커머스(쿠팡 티몬 등)",
        "배달앱(배달의 민족 요기요 등)": "배달앱(배달의 민족 요기요 등)",
    },
    "restrict_to_mapped_values": True,
}

DAEGU_PRESET_STAT_CONFIG: dict = {
    # ── 간단 범주형 ──────────────────────────────────────────────
    "가구소득 만족도": _D,
    "가족관계 만족도": _D,
    "거주지역 여가활동 만족도": _D,
    "건강유지 노력도": _score_cat([
        "매우 노력하고 있음", "비교적 노력하고 있음", "보통", "별로 노력하지 않음", "전혀 노력하지 않음",
    ]),
    "경제활동 은퇴시기": _D,
    "공동체 의식": _D,
    "교통수단 만족도": _D,
    "규칙적 체육활동 참여 빈도": _D,
    "기관 신뢰": _D,
    "기부경험 및 기부방법": _D,
    "기부하지 않은 이유": _D,
    "노후에 가장 심각하게 느끼는 문제": _D,
    "대구시민 자부심": _D,
    "대중교통 이용 시 문제점": _D,
    "민원서비스 개선사항": _D,
    "민원서비스 만족도": _D,
    "범죄피해에 대한 두려움": _D,
    "보행 만족도": _D,
    "복지정책 개선분야": _D,
    "부모 생존 및 동거여부": _D,   # "부모 생존 및 동거여부, 부양책임자" 포함
    "부패에 대한 인식": _D,
    "비혼동거에 대한 견해": _D,
    "사회계층 이동 가능성": _D,
    "사회적 약자에 대한 태도": {
        # 7개 차별 유형별 "그렇다/보통이다/그렇지 않다" 분포를 각 컬럼에 배정
        # C2 코드 패턴: 1xxx=그렇지 않다, 2xxx=보통이다, 3xxx=그렇다; 끝 두 자리로 항목 구분
        "mode": "c2_c3",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        "c2_code_to_col": {
            "1052": "성별 차별 인식", "2053": "성별 차별 인식", "3054": "성별 차별 인식",
            "1056": "학력 차별 인식", "2057": "학력 차별 인식", "3058": "학력 차별 인식",
            "1060": "연령 차별 인식", "2061": "연령 차별 인식", "3062": "연령 차별 인식",
            "1064": "장애 차별 인식", "2065": "장애 차별 인식", "3066": "장애 차별 인식",
            "1069": "소득 차별 인식", "2070": "소득 차별 인식", "3071": "소득 차별 인식",
            "1073": "출신지역 차별 인식", "2074": "출신지역 차별 인식", "3075": "출신지역 차별 인식",
            "1077": "외모 차별 인식", "2078": "외모 차별 인식", "3079": "외모 차별 인식",
        },
    },
    "사회적 지원(사회적관계별 소통정도)": _D,
    "생계유지 어려움 경험 정도": _D,
    "소비생활 만족도": _D,
    "시간 사용에 대한 만족도": _D,
    "시민의식": _D,
    "식습관(아침식사 여부)": _D,
    "안전환경에 대한 평가": _D,
    "외국인과의 관계": _D,
    "월평균 가구소득(가구주)": _D,
    "의료서비스 만족도": _D,
    "의료서비스 이용률": _score_cat([
        "의원(외래중심)", "병원(입원시설 30개 이상)", "치과 병·의원",
        "약국(한약국)", "한방병·의원", "보건소",
    ]),
    "인구정책 우선순위": _D,
    "인터넷 커뮤니티 활동 여부": _D,
    "일반인에 대한 신뢰": _D,
    "일상생활속 위험요소 대처방법 인지도": _D,
    "일자리 만족도": _D,
    "자산관리 방법(가구주)": _D,
    "자원봉사활동 미참여 이유": _D,
    "자원봉사활동 참여 의향 및 희망분야": _D,
    "자원봉사활동 참여율과 평균시간": _D,
    "주거의식": _score_cat(["그렇다", "그렇지 않다"]),  # 자가 소유 희망 여부만 추출; 이유는 일관성 단계에서 배정
    "주거환경 만족도": _D,
    "주관적 사회계층 의식": _D,
    "주된 교통수단": _D,
    "주말이나 휴일의 여가활동": _D,
    "준법수준 인식": _D,
    "지역의 사회복지서비스 만족도": _D,
    "청년층 육성을 위한 우선 지원정책": _D,
    "체육동호회 가입여부": _D,
    "평소 건강관리 방법": _D,
    "학부모의 자녀 학교교육 만족도": _D,
    "학생의 학교교육 만족도": _D,
    "현 직장에서의 근속연수": _D,
    "환경문제 인식": _D,
    "환경보존 노력": _D,
    "환경체감도": _D,
    "통근·통학 소요시간": {
        "mode": "c2_c3",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        # C2 코드로 목적지/소요시간 두 컬럼으로 분기 (C2='2054' 집계행은 get_step2_local_data에서 제거)
        "c2_code_to_col": {
            "10052": "통근·통학 목적지", "20053": "통근·통학 목적지",
            "10056": "통근·통학 소요시간", "20057": "통근·통학 소요시간",
            "30058": "통근·통학 소요시간", "40059": "통근·통학 소요시간",
            "50060": "통근·통학 소요시간",
        },
    },
    # ── 범주 + 점수 혼합형 (평균 점수 행 제거) ─────────────────
    "삶에 대한 만족감": _score_cat(["불만족", "보통", "만족"]),
    "지역의 전반적인 생활 만족도": _score_cat(["불만족", "보통", "만족"]),
    "하는 일(주요 활동)의 가치 인식": _score_cat(["가치없음", "보통", "가치있음"]),
    "최근(어제) 정서경험(걱정)": _score_cat(["별로없음", "가끔있음", "자주있음"]),
    "최근(어제) 정서경험(행복)": _score_cat(["별로없음", "가끔있음", "자주있음"]),
    "주관적 건강수준": _score_cat(["나쁨", "보통", "좋음"]),
    # ── 있다/없다 + 세부 혼합형 (있다/없다만 추출) ────────────
    "미취학자녀 돌봄 유형": _YN,
    "취학자녀 돌봄 유형": _YN,
    "5년이내 타 시도 이주의향 및 이유": _YN,
    # ── 구매경로: 실제 구매 채널만 추출 (있다/없다/오프라인/온라인 집계행 제외) ──
    "물품 주된 구매경로(복수응답)_기타 잡화": _PURCHASE_CHANNELS,
    "물품 주된 구매경로(복수응답)_배달·포장 음식": _PURCHASE_CHANNELS,
    "물품 주된 구매경로(복수응답)_서적·문구류": _PURCHASE_CHANNELS,
    "물품 주된 구매경로(복수응답)_식료품": _PURCHASE_CHANNELS,
    "물품 주된 구매경로(복수응답)_의류(옷, 신발, 가방)": _PURCHASE_CHANNELS,
    "물품 주된 구매경로(복수응답)_이미용품·장신구": _PURCHASE_CHANNELS,
    "물품 주된 구매경로(복수응답)_주거가구(가전, 가구, 부엌용품)": _PURCHASE_CHANNELS,
    # ── 스마트기기 사용시간: 주 사용 목적(범주) — 수치(1일 평균)는 get_step2_local_data에서 추출 후 apply 단계 배정 ──
    "스마트기기 사용시간": {
        "mode": "c2_c3",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        # C2=2054(평균 시간수치)·10052/20053(보유 여부)는 제외, 주 사용 목적 6개만 매핑
        "c2_code_to_col": {
            "10056": "스마트기기 주 사용",
            "20057": "스마트기기 주 사용",
            "30058": "스마트기기 주 사용",
            "40059": "스마트기기 주 사용",
            "50060": "스마트기기 주 사용",
            "60061": "스마트기기 주 사용",
        },
    },
    # ── 인구·가구·주택: ITM_NM=주거유형, c1_all_only=False(구 단위 집계) ──
    "인구, 가구 및 주택": {
        "mode": "single_c2",
        "c1_all_only": False,
        "value_normalize": {
            "주택_단독주택": "단독주택",
            "주택_아파트": "아파트",
            "주택_연립주택": "연립주택",
            "주택_다세대주택": "다세대주택",
            "주택_비주거용 건물 내 주택": "비주거용건물",
            "주택 이외의 거처_계": "기타거처",
        },
        "restrict_to_mapped_values": True,
    },
    # ── 소득의 소비지출 비중: numeric JSON 전처리 후 numeric_c2 ──
    "소득의 소비지출 비중": {
        "mode": "numeric_c2",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        "c2_to_col": {
            "소비지출": "소비지출 비중(%)",
            "저축": "저축 비중(%)",
            "식비": "식비 비중(%)",
            "주거·수도·광열": "주거비 비중(%)",
            "보건": "보건비 비중(%)",
            "교육": "교육비 비중(%)",
            "교통": "교통비 비중(%)",
        },
        "numeric_noise_std": 3.0,
        "numeric_clip_min": 0.0,
        "numeric_clip_max": 100.0,
        "numeric_fallback": 0.0,
    },
    # ── 여가활동 시간 및 비용: numeric JSON 전처리 후 numeric_c2 ──
    # clip_max=None: 시간(최대 24h)과 비용(최대 ~100만원)이 혼재하므로 상한 없음
    "여가활동 시간 및 비용": {
        "mode": "numeric_c2",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        "c2_to_col": {
            "평일 여가시간(시간/일)": "평일 여가시간(시간/일)",
            "주말 여가시간(시간/일)": "주말 여가시간(시간/일)",
            "월평균 여가비용(만원)": "월평균 여가비용(만원)",
        },
        "numeric_noise_std": 2.5,
        "numeric_clip_min": 0.0,
        "numeric_clip_max": None,
        "numeric_fallback": 3.0,
    },
    # ── 수치형 (하루 평균 시간 등) ──────────────────────────────
    "부부 각자의 하루 평균 여유시간": {
        "mode": "numeric_c2",
        "c1_all_only": True,
        "c1_allow": ["대구광역시"],
        "c2_to_col": {
            "남편": "남편 하루 평균 여유시간(시간)",
            "부인": "부인 하루 평균 여유시간(시간)",
        },
        "numeric_noise_std": 0.8,
        "numeric_clip_min": 0.0,
        "numeric_clip_max": 16.0,
        "numeric_fallback": 4.0,
    },
}

# 통계명(부분 문자열) → 대입할 컬럼명 튜플
DAEGU_STAT_COLUMNS: dict = {
    "가구소득 만족도": ("가구소득 만족도(가구주)",),
    "가족관계 만족도": ("가족관계 만족도",),
    "거주지역 여가활동 만족도": ("거주지역 여가활동 만족도",),
    "건강유지 노력도": ("건강유지 노력도",),
    "경제활동 은퇴시기": ("경제활동 은퇴시기",),
    "공동체 의식": ("공동체 의식",),
    "교통수단 만족도": ("교통수단 만족도",),
    "규칙적 체육활동 참여 빈도": ("규칙적 체육활동 참여 빈도",),
    "기관 신뢰": ("기관 신뢰",),
    "기부경험 및 기부방법": ("기부경험 및 기부방법",),
    "기부하지 않은 이유": ("기부하지 않은 이유",),
    "노후에 가장 심각하게 느끼는 문제": ("노후에 가장 심각하게 느끼는 문제",),
    "대구시민 자부심": ("대구시민 자부심",),
    "대중교통 이용 시 문제점": ("대중교통 이용 시 문제점",),
    "민원서비스 개선사항": ("민원서비스 개선사항",),
    "민원서비스 만족도": ("민원서비스 만족도",),
    "범죄피해에 대한 두려움": ("범죄피해에 대한 두려움",),
    "보행 만족도": ("보행 만족도",),
    "복지정책 개선분야": ("복지정책 개선분야",),
    "부모 생존 및 동거여부": ("부모 생존 및 동거여부",),
    "부패에 대한 인식": ("부패에 대한 인식",),
    "비혼동거에 대한 견해": ("비혼동거에 대한 견해",),
    "사회계층 이동 가능성": ("사회계층 이동 가능성",),
    "사회적 약자에 대한 태도": (
        "성별 차별 인식", "학력 차별 인식", "연령 차별 인식", "장애 차별 인식",
        "소득 차별 인식", "출신지역 차별 인식", "외모 차별 인식",
    ),
    "사회적 지원(사회적관계별 소통정도)": ("사회적 지원(사회적관계별 소통정도)",),
    "생계유지 어려움 경험 정도": ("생계유지 어려움 경험 정도",),
    "소비생활 만족도": ("소비생활 만족도",),
    "시간 사용에 대한 만족도": ("시간 사용에 대한 만족도",),
    "시민의식": ("시민의식",),
    "식습관(아침식사 여부)": ("식습관(아침식사 여부)",),
    "안전환경에 대한 평가": ("안전환경에 대한 평가",),
    "외국인과의 관계": ("외국인과의 관계",),
    "월평균 가구소득(가구주)": ("월평균 가구소득(가구주)",),
    "의료서비스 만족도": ("의료서비스 만족도",),
    "의료서비스 이용률": ("주 이용 의료서비스",),
    "인구정책 우선순위": ("인구정책 우선순위",),
    "인터넷 커뮤니티 활동 여부": ("인터넷 커뮤니티 활동 여부",),
    "일반인에 대한 신뢰": ("일반인에 대한 신뢰",),
    "일상생활속 위험요소 대처방법 인지도": ("일상생활속 위험요소 대처방법 인지도",),
    "일자리 만족도": ("일자리 만족도",),
    "자산관리 방법(가구주)": ("자산관리 방법(가구주)",),
    "자원봉사활동 미참여 이유": ("자원봉사활동 미참여 이유",),
    "자원봉사활동 참여 의향 및 희망분야": ("자원봉사활동 참여 의향 및 희망분야",),
    "자원봉사활동 참여율과 평균시간": ("자원봉사활동 참여율과 평균시간",),
    "주거의식": ("자가 소유 희망",),  # 이유는 apply_daegu_step2_row_consistency에서 "집을 소유해야 하는 이유" 컬럼으로 별도 배정
    "주거환경 만족도": ("주거환경 만족도",),
    "주관적 사회계층 의식": ("주관적 사회계층 의식",),
    "주된 교통수단": ("주된 교통수단",),
    "주말이나 휴일의 여가활동": ("주말이나 휴일의 여가활동",),
    "준법수준 인식": ("준법수준 인식(나를 제외한 사회구성원)",),
    "지역의 사회복지서비스 만족도": ("지역의 사회복지서비스 만족도",),
    "청년층 육성을 위한 우선 지원정책": ("청년층 육성을 위한 우선 지원정책",),
    "체육동호회 가입여부": ("체육동호회 가입여부",),
    "평소 건강관리 방법": ("평소 건강관리 방법",),
    "학부모의 자녀 학교교육 만족도": ("학부모의 자녀 학교교육 만족도",),
    "학생의 학교교육 만족도": ("학생의 학교교육 만족도",),
    "현 직장에서의 근속연수": ("현 직장에서의 근속연수",),
    "환경문제 인식": ("환경문제 인식",),
    "환경보존 노력": ("환경보존 노력",),
    "환경체감도": ("환경체감도",),
    "통근·통학 소요시간": ("통근·통학 목적지", "통근·통학 소요시간"),
    "삶에 대한 만족감": ("삶에 대한 만족감",),
    "지역의 전반적인 생활 만족도": ("지역의 전반적인 생활 만족도",),
    "하는 일(주요 활동)의 가치 인식": ("하는 일(주요 활동)의 가치 인식",),
    "최근(어제) 정서경험(걱정)": ("최근(어제) 정서경험(걱정)",),
    "최근(어제) 정서경험(행복)": ("최근(어제) 정서경험(행복)",),
    "주관적 건강수준": ("주관적 건강수준",),
    "미취학자녀 돌봄 유형": ("미취학자녀 유무",),
    "취학자녀 돌봄 유형": ("취학자녀 유무",),
    "5년이내 타 시도 이주의향 및 이유": ("5년이내 타 시도 이주의향",),
    "물품 주된 구매경로(복수응답)_기타 잡화": ("구매경로_기타잡화",),
    "물품 주된 구매경로(복수응답)_배달·포장 음식": ("구매경로_배달음식",),
    "물품 주된 구매경로(복수응답)_서적·문구류": ("구매경로_서적문구",),
    "물품 주된 구매경로(복수응답)_식료품": ("구매경로_식료품",),
    "물품 주된 구매경로(복수응답)_의류(옷, 신발, 가방)": ("구매경로_의류",),
    "물품 주된 구매경로(복수응답)_이미용품·장신구": ("구매경로_이미용품",),
    "물품 주된 구매경로(복수응답)_주거가구(가전, 가구, 부엌용품)": ("구매경로_주거가구",),
    "부부 각자의 하루 평균 여유시간": (
        "남편 하루 평균 여유시간(시간)",
        "부인 하루 평균 여유시간(시간)",
    ),
    "인구, 가구 및 주택": ("주거유형",),
    "소득의 소비지출 비중": (
        "소비지출 비중(%)", "저축 비중(%)",
        "식비 비중(%)", "주거비 비중(%)", "보건비 비중(%)", "교육비 비중(%)", "교통비 비중(%)",
    ),
    "여가활동 시간 및 비용": (
        "평일 여가시간(시간/일)", "주말 여가시간(시간/일)", "월평균 여가비용(만원)",
    ),
    # "스마트기기 주 사용": c2_c3 모드로 배정 / "1일 평균 사용시간(시간)": apply 단계에서 배정
    "스마트기기 사용시간": ("스마트기기 주 사용", "1일 평균 사용시간(시간)"),
}


def _inject_text_labels(data: list, stat_name: str) -> list:
    """소득의 소비지출 비중 / 여가활동 시간 및 비용 JSON에 C1_NM·C2_NM 텍스트 주입.

    해당 JSON은 C1_NM·C2_NM 없이 숫자 코드(C1, C2)만 포함하므로
    파서(C1_NM 필터 + C2_NM 레이블)가 동작하도록 텍스트 레이블을 보강한다.

    주의: C1 맵에 없는 행(타 시군구)은 C1_NM="_other_" 를 부여해 필터에서 제외한다.
    빈 C1_NM은 파서의 "" 허용값과 겹쳐 전 지역 데이터가 통과되는 문제가 생기므로.
    """
    if "소득의 소비지출 비중" in stat_name:
        c1_map, c2_map = _INCOME_C1_LABELS, _INCOME_C2_LABELS
    elif "여가활동 시간 및 비용" in stat_name:
        c1_map, c2_map = _LEISURE_C1_LABELS, _LEISURE_C2_LABELS
    else:
        return data
    out = []
    for r in data:
        if not isinstance(r, dict):
            out.append(r)
            continue
        row = dict(r)
        c1_code = str(row.get("C1", "")).strip()
        c2_code = str(row.get("C2", "")).strip()
        if not row.get("C1_NM"):
            row["C1_NM"] = c1_map.get(c1_code, "_other_")
        if not row.get("C2_NM") and c2_code in c2_map:
            row["C2_NM"] = c2_map[c2_code]
        out.append(row)
    return out


_HOUSING_YES_REASONS = {
    "자산증식 및 보전을 위해서": 22.4,
    "내집이 있어야 인정받는 사회적 분위기 때문에": 20.3,
    "임대료 상승의 압박이 없으므로": 17.2,
    "집을 자유롭게 사용할 수 있어서(인테리어 구조변경 등)": 9.5,
    "세금부담 때문에": 5.5,
}

def _assign_housing_reason(df: pd.DataFrame) -> None:
    """자가 소유 희망 == "그렇다"인 행에만 집을 소유해야 하는 이유 배정 (inplace)."""
    wish_col = "자가 소유 희망"
    reason_col = "집을 소유해야 하는 이유"
    if wish_col not in df.columns:
        return
    if reason_col not in df.columns:
        df[reason_col] = None

    mask = df[wish_col].astype(str).str.strip() == "그렇다"
    if not mask.any():
        return
    labels = list(_HOUSING_YES_REASONS.keys())
    total = sum(_HOUSING_YES_REASONS.values())
    probs = [_HOUSING_YES_REASONS[l] / total for l in labels]
    df.loc[mask, reason_col] = _np_rng().choice(labels, size=int(mask.sum()), p=probs)


def _np_rng():
    import numpy as np
    return np.random.default_rng()


class DaeguRegionHandler:
    """대구: gender/age/edu/marital 축은 대구 전용 파서 사용. 나머지는 기본 로직."""

    def __init__(self) -> None:
        self._default = DefaultRegionHandler()

    def get_data_management_axes(self) -> List[AxisItem]:
        """대구 7축: 거주지역·성별·연령·교육정도·직업별·혼인상태·월평균 가구 소득."""
        return list(DAEGU_DATA_MANAGEMENT_AXES)

    def get_generation_axis_keys(self) -> List[str]:
        """1단계에서 사용할 7축 (econ 대신 marital)."""
        return list(DAEGU_GENERATION_AXIS_KEYS)

    def get_dashboard_title(self, sido_name: str) -> str:
        return "요약 지표"

    def get_step2_preset_config(self) -> dict:
        return dict(DAEGU_PRESET_STAT_CONFIG)

    def get_step2_stat_columns(self) -> dict:
        return dict(DAEGU_STAT_COLUMNS)

    def use_slug_fallback_for_unknown_stat(self) -> bool:
        """대구: 프리셋에 없는 통계는 Gemini 슬러그 대신 건너뜀 (속도 개선)."""
        return False

    def get_edu_fallback_handler(self) -> None:
        return None

    def preprocess_validation_data(self, stat_name: str, data: list) -> list:
        """검증용 KOSIS API 데이터 전처리: 숫자 코드만 있는 통계에 C1_NM·C2_NM 텍스트 주입."""
        return _inject_text_labels(data, stat_name)

    def get_step2_local_data(self, stat_name: str) -> Optional[list]:
        """대구 2단계 통계의 로컬 JSON 파일을 반환. 없으면 None.

        소득의 소비지출 비중 / 여가활동 시간 및 비용: JSON이 C1_NM·C2_NM 없이 숫자
        코드만 사용하므로 로드 후 C1_NM·C2_NM 텍스트 레이블을 주입한다.
        """
        name = (stat_name or "").strip()
        if not name:
            return None
        # 파일명은 통계명과 동일 (일부 ITM_NM은 쉼표 없이 저장됨)
        candidates = [
            name,
            name.replace(",", ""),
            name.replace(", ", " "),
        ]
        for candidate in candidates:
            path = os.path.join(_DAEGU_STAT_JSON_DIR, candidate + ".json")
            if os.path.exists(path):
                if path in _DAEGU_STEP2_LOCAL_CACHE:
                    return _DAEGU_STEP2_LOCAL_CACHE[path]
                try:
                    with open(path, encoding="utf-8") as f:
                        data = json.load(f)
                except Exception:
                    return None
                # 숫자 코드만 있는 통계: C1_NM·C2_NM 텍스트 주입
                data = _inject_text_labels(data, name)
                # 통근·통학 소요시간: C2='2054' 집계행(C2_NM이 컬럼명 자체)을 제거
                if "통근·통학 소요시간" in name:
                    data = [r for r in data if not (isinstance(r, dict) and str(r.get("C2", "")).strip() == "2054")]
                # 스마트기기 사용시간: 1일 평균 사용시간 수치(C2='2054') 추출 후 보유 여부·수치 행 제거
                if "스마트기기 사용시간" in name:
                    global _DAEGU_SMART_DEVICE_MEAN
                    _C2_USAGE = {"10056", "20057", "30058", "40059", "50060", "60061"}
                    for r in data:
                        if isinstance(r, dict) and str(r.get("C2", "")).strip() == "2054":
                            try:
                                _DAEGU_SMART_DEVICE_MEAN = float(str(r.get("DT", "3")).replace(",", ""))
                            except Exception:
                                pass
                            break
                    # 범주형 파서에는 주 사용 목적 행(6개 C2 코드)만 전달
                    data = [r for r in data if isinstance(r, dict) and str(r.get("C2", "")).strip() in _C2_USAGE]
                _DAEGU_STEP2_LOCAL_CACHE[path] = data
                return data
        return None

    def get_local_kosis_data(self, axis_key: str) -> Optional[list]:
        """로컬 JSON에서 축별 pre-filtered 데이터 반환 (sigungu/gender/age 전용).

        JSON에는 구/군 단위와 동 단위가 혼재하므로 축별로 필터링:
        - sigungu: 구/군 행 중 C2_NM="계"(연령합계) & ITM_NM="계"(성별합계)
        - gender:  구/군 행 중 C2_NM="계" & ITM_NM="남자"|"여자"
        - age:     구/군 행 중 ITM_NM="계" & C2_NM=단일연령("X 세"), 구간("X~Y세") 제외
        """
        if axis_key not in ("sigungu", "gender", "age"):
            return None
        raw = _load_daegu_local_pop_json()
        if not raw:
            return None

        _GU_SUFFIX = ("구", "군")
        _SKIP_C1 = {"소계", "합계", "합 계", "전체", "Total", "대구광역시", "대구"}

        def _is_gu(r: dict) -> bool:
            c1 = str(r.get("C1_NM", "")).strip()
            return c1.endswith(_GU_SUFFIX) and c1 not in _SKIP_C1

        if axis_key == "sigungu":
            return [
                r for r in raw
                if isinstance(r, dict)
                and _is_gu(r)
                and str(r.get("C2_NM", "")).strip() == "계"
                and str(r.get("ITM_NM", "")).strip() == "계"
            ]

        if axis_key == "gender":
            return [
                r for r in raw
                if isinstance(r, dict)
                and _is_gu(r)
                and str(r.get("C2_NM", "")).strip() == "계"
                and str(r.get("ITM_NM", "")).strip() in ("남자", "여자")
            ]

        if axis_key == "age":
            return [
                r for r in raw
                if isinstance(r, dict)
                and _is_gu(r)
                and str(r.get("ITM_NM", "")).strip() == "계"
                and "~" not in str(r.get("C2_NM", ""))   # 구간(0~4세 등) 제외
                and str(r.get("C2_NM", "")).strip() not in ("계", "합계", "합 계", "")
            ]

        return None

    def convert(self, kosis_data: Any, axis_key: str) -> Tuple[List[Any], List[float]]:
        """대구 전용 파서: gender/age/edu/marital/sigungu는 대구 전용, 나머지는 기본 로직."""
        if axis_key == "sigungu":
            return _parse_daegu_sigungu(kosis_data)
        if axis_key == "gender":
            return _parse_daegu_gender(kosis_data)
        if axis_key == "age":
            return _parse_daegu_age(kosis_data)
        if axis_key == "edu":
            labels, values = _parse_daegu_edu(kosis_data)
            if labels and values:
                return labels, values
            # fallback: DefaultRegionHandler의 edu 파서 시도
            return self._default.convert(kosis_data, axis_key)
        if axis_key == "marital":
            return _parse_daegu_marital(kosis_data)
        return self._default.convert(kosis_data, axis_key)


# ---------------------------------------------------------------------------
# 대구 전용 파서 함수
# ---------------------------------------------------------------------------

def _parse_daegu_sigungu(kosis_data: Any) -> Tuple[List[Any], List[float]]:
    """거주지역 파싱: 동 단위 C1_NM을 구 단위로 집계.

    동·읍·면_연령별 주민등록인구(내국인) 구조:
      C1_NM=동읍면명, ITM_NM="계"|"남자"|"여자"
    "계" 행만 사용해 이중 합산 방지, 동 이름을 _DAEGU_DONG_TO_GU로 구 단위 집계.
    C1_NM이 이미 구(군) 이름이면 그대로 사용.
    """
    _SKIP = {"소계", "합계", "합 계", "전체", "Total", "대구광역시", "대구"}
    _GU_SUFFIX = ("구", "군")

    has_kei_rows = any(
        isinstance(r, dict) and (r.get("ITM_NM") or "").strip() == "계"
        for r in kosis_data
    )

    gu_map: dict = {}
    for row in kosis_data:
        if not isinstance(row, dict):
            continue
        itm = (row.get("ITM_NM") or "").strip()
        if has_kei_rows and itm != "계":
            continue
        label = (row.get("C1_NM") or "").strip()
        if not label or label in _SKIP:
            continue
        val = _safe_float(row.get("DT", "0"))
        if val <= 0:
            continue
        # 이미 구/군 단위면 그대로
        if label.endswith(_GU_SUFFIX) and label not in _SKIP:
            gu_map[label] = gu_map.get(label, 0.0) + val
        else:
            gu = _DAEGU_DONG_TO_GU.get(label)
            if gu:
                gu_map[gu] = gu_map.get(gu, 0.0) + val
            # 미등록 동은 무시 (집계 오류 방지)

    if not gu_map:
        # fallback: 동 이름 그대로 반환
        from regions.default import DefaultRegionHandler
        return DefaultRegionHandler().convert(kosis_data, "sigungu")

    labels: List[Any] = [g for g in _GU_ORDER if g in gu_map]
    for g in gu_map:
        if g not in labels:
            labels.append(g)
    values: List[float] = [gu_map[g] for g in labels]
    return labels, values


def _safe_float(val_raw: Any) -> float:
    """DT 값을 float으로 안전하게 변환. 변환 불가 시 0.0 반환."""
    if val_raw in ("-", "X", "", None):
        return 0.0
    try:
        return float(str(val_raw).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


def _parse_daegu_gender(kosis_data: Any) -> Tuple[List[Any], List[float]]:
    """성별 파싱: ITM_NM에 "남자"/"여자" 포함 여부로 집계.

    두 가지 데이터 구조 지원:
    - 동·읍·면_연령별 주민등록인구: ITM_NM = "계" | "남자" | "여자"
    - 성·연령·혼인상태별 인구: ITM_NM = "남자_미혼" | "여자_유배우" 등 (접두어 방식)
    "계" 행이 있으면 그것만 사용해 이중 집계 방지.
    "계" 행이 없으면(혼인상태 테이블 등) 남자_/여자_ 접두어로 분류해 합산.
    """
    has_kei_rows = any(
        isinstance(r, dict) and (r.get("ITM_NM") or "").strip() == "계"
        for r in kosis_data
    )

    gender_map = {"남자": 0.0, "여자": 0.0}
    for row in kosis_data:
        if not isinstance(row, dict):
            continue
        itm = (row.get("ITM_NM") or "").strip()
        # "계" 행이 있으면 그것만 처리 (이중 합산 방지)
        if has_kei_rows and itm != "계":
            continue
        val = _safe_float(row.get("DT", "0"))
        if val <= 0:
            continue
        if itm == "남자" or itm.endswith("_남자") or itm.startswith("남자_"):
            gender_map["남자"] += val
        elif itm == "여자" or itm.endswith("_여자") or itm.startswith("여자_"):
            gender_map["여자"] += val

    labels: List[Any] = []
    values: List[float] = []
    for g in ["남자", "여자"]:
        if gender_map[g] > 0:
            labels.append(g)
            values.append(gender_map[g])

    # fallback: ITM_NM 방식 실패 시 C2_NM·C1_NM 등 기존 필드 시도
    if not labels:
        for row in kosis_data:
            if not isinstance(row, dict):
                continue
            for field in ("C2_NM", "C3_NM", "C1_NM", "ITM_NM_ENG"):
                label = (row.get(field) or "").strip()
                val = _safe_float(row.get("DT", "0"))
                if val <= 0:
                    continue
                if "남자" in label or label.lower() in ("male", "m"):
                    gender_map["남자"] += val
                elif "여자" in label or label.lower() in ("female", "f"):
                    gender_map["여자"] += val
        for g in ["남자", "여자"]:
            if gender_map[g] > 0:
                labels.append(g)
                values.append(gender_map[g])

    return labels, values


def _parse_daegu_age(kosis_data: Any) -> Tuple[List[Any], List[float]]:
    """연령별 파싱: C2_NM에서 단일 나이 또는 구간을 추출해 집계.

    두 가지 데이터 구조 지원:
    - 동·읍·면_연령별 주민등록인구: C2_NM="X 세"(단일), ITM_NM="계"|"남자"|"여자"
      → "계" 행만 사용해 이중 집계 방지
    - 성·연령·혼인상태별 인구: C2_NM="20-24세"(구간), ITM_NM="남자_미혼"|"여자_유배우" 등
      → "계" 행 없음, 모든 행의 DT를 C2_NM별로 합산(미혼+유배우+이혼+사별 = 합계)
      → 구간은 균등 분배(20-24세 → 20~24세 각 1/5)
    """
    has_kei_rows = any(
        isinstance(r, dict) and (r.get("ITM_NM") or "").strip() == "계"
        for r in kosis_data
    )

    age_map: dict = {}

    for row in kosis_data:
        if not isinstance(row, dict):
            continue
        itm = (row.get("ITM_NM") or "").strip()
        # "계" 행이 있으면 그것만 사용해 이중 집계 방지
        if has_kei_rows and itm != "계":
            continue

        age_str = (row.get("C2_NM") or "").strip()
        if not age_str or age_str in ("계", "합계", "소계", "전체", "합 계"):
            continue
        if "미만" in age_str:
            continue

        val = _safe_float(row.get("DT", "0"))
        if val <= 0:
            continue

        # ── 구간 형태: "20-24세", "20~24세" 등 ──
        # 구간 테이블에서는 모든 ITM_NM(미혼+유배우+이혼+사별)을 합산하면 해당 구간 합계
        range_match = re.search(r"(\d+)\s*[-~]\s*(\d+)", age_str)
        if range_match:
            low = max(20, int(range_match.group(1)))
            high = min(120, int(range_match.group(2)))
            if low <= high:
                per_age = val / (high - low + 1)
                for a in range(low, high + 1):
                    age_map[a] = age_map.get(a, 0) + per_age
            continue

        # ── "X세이상" 형태: 80세이상 → 80~120 균등 분배 ──
        if "이상" in age_str:
            m = re.search(r"(\d+)", age_str)
            if m:
                low = max(20, int(m.group(1)))
                per_age = val / (120 - low + 1)
                for a in range(low, 121):
                    age_map[a] = age_map.get(a, 0) + per_age
            continue

        # ── 단일 나이: "20 세", "20세" 등 ──
        match = re.search(r"(\d+)", age_str)
        if not match:
            continue
        age_num = int(match.group(1))
        if 20 <= age_num <= 120:
            age_map[age_num] = age_map.get(age_num, 0) + val

    # fallback: C2_NM에서 연령을 찾지 못한 경우 DefaultRegionHandler 시도
    if not age_map:
        from regions.default import DefaultRegionHandler
        return DefaultRegionHandler().convert(kosis_data, "age")

    labels: List[Any] = sorted(age_map.keys())
    values: List[float] = [age_map[a] for a in labels]
    return labels, values


def _parse_daegu_marital(kosis_data: Any) -> Tuple[List[Any], List[float]]:
    """혼인상태 파싱: ITM_NM 우선 탐색 → C-series 필드 순서로 fallback.

    성, 연령 및 혼인상태별 인구 - 시군구 구조:
      C2_NM = 연령대("20세미만"), ITM_NM = "여자_미혼" | "남자_유배우" | "여자_사별·이혼" 등
    """
    marriage_map: dict = {}
    for row in kosis_data:
        if not isinstance(row, dict):
            continue

        # ITM_NM 우선, 없으면 C-series 순서로 탐색
        label = (
            row.get("ITM_NM")
            or row.get("C2_NM")
            or row.get("C1_NM")
            or row.get("C3_NM")
            or ""
        ).strip()

        val = _safe_float(row.get("DT", "0"))
        if val <= 0:
            continue

        if "미혼" in label:
            marriage_map["미혼"] = marriage_map.get("미혼", 0) + val
        elif "유배우" in label or "배우자 있음" in label or label == "기혼":
            marriage_map["기혼"] = marriage_map.get("기혼", 0) + val
        elif "기혼" in label:
            marriage_map["기혼"] = marriage_map.get("기혼", 0) + val
        elif "사별" in label and "이혼" in label:
            # "사별·이혼" 복합 라벨: 절반씩 분배
            half = val / 2.0
            marriage_map["사별"] = marriage_map.get("사별", 0) + half
            marriage_map["이혼"] = marriage_map.get("이혼", 0) + half
        elif "이혼" in label:
            marriage_map["이혼"] = marriage_map.get("이혼", 0) + val
        elif "사별" in label:
            marriage_map["사별"] = marriage_map.get("사별", 0) + val
        elif "배우자 없음" in label:
            marriage_map["미혼"] = marriage_map.get("미혼", 0) + val

    labels: List[Any] = []
    values: List[float] = []
    for k in _MARITAL_ORDER:
        if k in marriage_map and marriage_map[k] > 0:
            labels.append(k)
            values.append(marriage_map[k])
    for k, v in marriage_map.items():
        if k not in labels and v > 0:
            labels.append(k)
            values.append(v)
    return labels, values


def _parse_daegu_edu(kosis_data: Any) -> Tuple[List[Any], List[float]]:
    """교육정도 파싱: ITM_NM 우선, C4_NM→C3_NM→C2_NM 순으로 교육 키워드 탐색.

    성, 연령 및 교육정도, 교육상태별 인구(6세이상, 내국인)-시군구 구조:
      C2_NM = "계", C3_NM = "합 계", ITM_NM = "초등학교-계" | "고등학교-계" | "대학교(4년제 이상)-계"
    "계" 접미사가 붙은 행(성별 합계)을 우선 사용해 이중 집계를 방지.
    """
    _EDU_LOW = ["초졸", "무학", "초등학교", "초등", "중졸", "중학교", "미취학", "중졸이하"]
    _EDU_MID = ["고졸", "고등학교", "고등"]
    _EDU_HIGH = ["대학교", "대학원", "전문대", "석사", "박사", "대졸이상", "대졸", "대학"]

    edu_map = {"중졸이하": 0.0, "고졸": 0.0, "대졸이상": 0.0}

    # "계" 접미사 행(성별 합계) 존재 여부 먼저 확인 → 있으면 해당 행만 사용
    has_total_rows = any(
        isinstance(r, dict) and str(r.get("ITM_NM") or "").strip().endswith("-계")
        for r in kosis_data
    )

    for row in kosis_data:
        if not isinstance(row, dict):
            continue

        itm = str(row.get("ITM_NM") or "").strip()
        # "계" 접미사가 있는 행이 존재하면, 그렇지 않은 행(성별 세분) 건너뜀
        if has_total_rows and not itm.endswith("-계") and itm not in ("", "계"):
            # 단, ITM_NM 자체가 교육 라벨일 수 있는 경우(접미사 없는 형태) 허용
            if not any(k in itm for k in _EDU_LOW + _EDU_MID + _EDU_HIGH):
                continue

        val = _safe_float(row.get("DT", "0"))
        if val <= 0:
            continue

        # 교육 라벨 탐색 순서: ITM_NM → C4_NM → C3_NM → C2_NM
        label = ""
        for field in ("ITM_NM", "C4_NM", "C3_NM", "C2_NM"):
            candidate = str(row.get(field) or "").strip()
            if candidate and candidate not in ("계", "전체", "소계", "합계", "합 계", "Total", ""):
                if any(k in candidate for k in _EDU_LOW + _EDU_MID + _EDU_HIGH):
                    label = candidate
                    break

        if not label:
            continue

        if any(k in label for k in _EDU_LOW):
            edu_map["중졸이하"] += val
        elif any(k in label for k in _EDU_MID):
            edu_map["고졸"] += val
        elif any(k in label for k in _EDU_HIGH):
            edu_map["대졸이상"] += val

    if sum(edu_map.values()) == 0:
        return [], []

    labels: List[Any] = []
    values: List[float] = []
    for lev in ["중졸이하", "고졸", "대졸이상"]:
        if edu_map[lev] > 0:
            labels.append(lev)
            values.append(edu_map[lev])
    return labels, values


def apply_daegu_step2_row_consistency(df: pd.DataFrame) -> pd.DataFrame:
    """2단계 통계 대입 후 행 방향 논리 일관성 (대구 전용)."""
    from regions.common import (
        age_to_num, clear_where,
        apply_non_econ_employment_consistency,
        apply_pet_consistency, apply_debt_consistency,
        apply_donation_consistency, apply_retirement_consistency,
    )
    out = df.copy()
    apply_non_econ_employment_consistency(out)

    age_col = "연령"
    ages = out[age_col].map(age_to_num) if age_col in out.columns else None

    spouse_econ_col = "배우자의 경제활동 상태"
    if ages is not None and spouse_econ_col in out.columns:
        out.loc[ages.notna() & (ages < 20), spouse_econ_col] = "무"

    # ── 혼인상태·연령 기반 자녀 관련 컬럼 정합 ───────────────────────────
    marital_col = "혼인상태"
    is_single = (
        out[marital_col].astype(str).str.strip() == "미혼"
        if marital_col in out.columns
        else pd.Series(False, index=out.index)
    )

    # 미취학자녀 유무: 미혼 또는 53세 초과이면 없다
    # (한국 평균 출산연령 고려: 만 52세를 넘으면 미취학자녀 확률 극히 낮음)
    if "미취학자녀 유무" in out.columns:
        preschool_no = is_single.copy()
        if ages is not None:
            preschool_no |= ages.notna() & (ages > 52)
        out.loc[preschool_no, "미취학자녀 유무"] = "없다"

    # 취학자녀 유무: 미혼 또는 66세 초과이면 없다
    # (자녀 최대 고등학생 19세 기준, 부모 최대 66세 정도까지 현실적)
    if "취학자녀 유무" in out.columns:
        school_no = is_single.copy()
        if ages is not None:
            school_no |= ages.notna() & (ages > 65)
        out.loc[school_no, "취학자녀 유무"] = "없다"

    # 남편/부인 하루 평균 여유시간: 기혼자에게만 (이혼·사별·미혼은 배우자 없음)
    if marital_col in out.columns:
        not_married = out[marital_col].astype(str).str.strip() != "기혼"
        clear_where(out, not_married, ["남편 하루 평균 여유시간(시간)", "부인 하루 평균 여유시간(시간)"])

    # 기부하지 않은 이유: 기부 경험이 있으면 불필요
    if "기부경험 및 기부방법" in out.columns and "기부하지 않은 이유" in out.columns:
        donated = out["기부경험 및 기부방법"].astype(str).str.strip() == "기부한 적 있다"
        clear_where(out, donated, ["기부하지 않은 이유"])

    # 자원봉사활동 미참여 이유: 참여한 사람에게는 불필요
    if "자원봉사활동 참여율과 평균시간" in out.columns and "자원봉사활동 미참여 이유" in out.columns:
        volunteered = out["자원봉사활동 참여율과 평균시간"].astype(str).str.strip() == "참여한 적 있다"
        clear_where(out, volunteered, ["자원봉사활동 미참여 이유"])

    # 학부모의 자녀 학교교육 만족도: 취학자녀 유무 업데이트 반영 후 클리어
    if "취학자녀 유무" in out.columns and "학부모의 자녀 학교교육 만족도" in out.columns:
        no_child = out["취학자녀 유무"].astype(str).str.strip() == "없다"
        clear_where(out, no_child, ["학부모의 자녀 학교교육 만족도"])

    # 학생의 학교교육 만족도: 대학(원)생 연령(20–25세)을 넘으면 불필요
    if ages is not None and "학생의 학교교육 만족도" in out.columns:
        not_student = ages.isna() | (ages > 25)
        clear_where(out, not_student, ["학생의 학교교육 만족도"])

    # 일자리 만족도·근속연수: 취업 가능 연령대(20–70세)가 아니면 불필요
    if ages is not None:
        not_working = ages.isna() | (ages > 70)
        clear_where(out, not_working, ["일자리 만족도", "현 직장에서의 근속연수"])

    # 근속연수 ↔ 연령 상관관계: 연령별 현실적 최대 근속연수 초과 시 재배정
    if ages is not None and "현 직장에서의 근속연수" in out.columns:
        _rng = _np_rng()
        tc = "현 직장에서의 근속연수"
        # 25세 미만: 3년 미만만 가능 (고졸 기준 최대 8년이지만 재직자 통계 기준 3년으로 제한)
        mask = ages.notna() & (ages < 25) & ~out[tc].isin(["1년 미만", "1년 이상 3년 미만"])
        if mask.any():
            out.loc[mask, tc] = _rng.choice(["1년 미만", "1년 이상 3년 미만"], size=int(mask.sum()), p=[0.43, 0.57])
        # 30세 미만: 10년 미만만 가능
        mask = ages.notna() & (ages < 30) & out[tc].isin(["10년 이상 15년 미만", "15년 이상 20년 미만", "20년 이상"])
        if mask.any():
            out.loc[mask, tc] = _rng.choice(
                ["1년 미만", "1년 이상 3년 미만", "3년 이상 5년 미만", "5년 이상 10년 미만"],
                size=int(mask.sum()), p=[0.15, 0.27, 0.22, 0.36],
            )
        # 35세 미만: 15년 미만만 가능
        mask = ages.notna() & (ages < 35) & out[tc].isin(["15년 이상 20년 미만", "20년 이상"])
        if mask.any():
            out.loc[mask, tc] = _rng.choice(
                ["3년 이상 5년 미만", "5년 이상 10년 미만", "10년 이상 15년 미만"],
                size=int(mask.sum()), p=[0.20, 0.42, 0.38],
            )
        # 40세 미만: 20년 미만만 가능
        mask = ages.notna() & (ages < 40) & (out[tc] == "20년 이상")
        if mask.any():
            out.loc[mask, tc] = _rng.choice(
                ["5년 이상 10년 미만", "10년 이상 15년 미만", "15년 이상 20년 미만"],
                size=int(mask.sum()), p=[0.25, 0.40, 0.35],
            )

    # 대중교통 이용자인데 "이용안함" → 유효 문제점으로 재배정
    if "주된 교통수단" in out.columns and "대중교통 이용 시 문제점" in out.columns:
        _PUBLIC_MEANS = {"시내버스", "도시철도(지하철 모노레일)", "통근 통학용 버스", "철도", "고속버스 시외버스", "택시"}
        uses_pt = out["주된 교통수단"].isin(_PUBLIC_MEANS)
        bad = uses_pt & (out["대중교통 이용 시 문제점"].astype(str).str.strip() == "이용안함")
        if bad.any():
            _problems = [
                "교통 체증(통행시간 증가 및 정시성 저하)", "접근성(노선) 부족", "환승이 힘듦",
                "긴 대기시간", "운행 회수 부족 및 배차간격 불안정", "탑승환경(혼잡 좌석부족 등) 불편",
                "종사자의 불친절", "비싼 요금", "기타",
            ]
            _prob_weights = [20.6, 22.8, 5.5, 7.2, 9.7, 13.3, 1.5, 7.5, 3.1]
            _total = sum(_prob_weights)
            out.loc[bad, "대중교통 이용 시 문제점"] = _np_rng().choice(
                _problems, size=int(bad.sum()), p=[w / _total for w in _prob_weights]
            )

    # 건강유지 노력 낮으면 평소 건강관리 방법 불필요
    if "건강유지 노력도" in out.columns and "평소 건강관리 방법" in out.columns:
        low_effort = out["건강유지 노력도"].isin(["별로 노력하지 않음", "전혀 노력하지 않음"])
        clear_where(out, low_effort, ["평소 건강관리 방법"])

    # 스마트기기 1일 평균 사용시간: c2_c3 모드가 빈값으로 남긴 컬럼을 JSON 추출 평균 기반 배정
    if "1일 평균 사용시간(시간)" in out.columns:
        import numpy as _np
        empty_mask = out["1일 평균 사용시간(시간)"].astype(str).str.strip().isin(["", "nan", "None"])
        if empty_mask.any():
            mean_val = _DAEGU_SMART_DEVICE_MEAN if _DAEGU_SMART_DEVICE_MEAN and _DAEGU_SMART_DEVICE_MEAN > 0 else 3.0
            vals = _np.clip(_np_rng().normal(loc=mean_val, scale=1.0, size=int(empty_mask.sum())), 0.5, 12.0)
            out.loc[empty_mask, "1일 평균 사용시간(시간)"] = _np.round(vals, 1)

    # 통근·통학: 70세 초과 클리어
    commute_cols = [c for c in ["통근·통학 목적지", "통근·통학 소요시간"] if c in out.columns]
    if commute_cols and ages is not None:
        clear_where(out, ages.notna() & (ages > 70), commute_cols)

    # 자가 소유 희망 == "그렇다"인 행에만 집을 소유해야 하는 이유 배정
    _assign_housing_reason(out)

    apply_pet_consistency(out)
    apply_debt_consistency(out)
    apply_donation_consistency(out)
    apply_retirement_consistency(out)

    # 컬럼 순서 정렬: 주제별 그룹화 (_DAEGU_STEP2_COLUMN_ORDER 기준)
    ordered = [c for c in _DAEGU_STEP2_COLUMN_ORDER if c in out.columns]
    others = [c for c in out.columns if c not in set(ordered)]
    out = out[others + ordered]
    return out
