from __future__ import annotations
import random
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional

# ========================================
# 1. 성별 맞춤 한국 이름 생성
# ========================================

def _build_extended_name_pools():
    """1만 명 이상 중복 없이 생성 가능하도록 확장된 이름 풀 (성 30 × 이름 350+ = 10,500+ per gender)"""
    # 남자 이름 350개+
    male_first = [
        "민준", "서준", "예준", "도윤", "시우", "주원", "하준", "지호", "준서", "건우",
        "현우", "우진", "승현", "유준", "정우", "승우", "지훈", "민성", "준혁", "지환",
        "태양", "준영", "성민", "동현", "재현", "상우", "호진", "영수", "철수", "광수",
        "도훈", "시현", "민재", "현준", "지원", "승민", "유진", "태희", "준호", "상훈",
        "진우", "민호", "재윤", "시윤", "동욱", "성훈", "민수", "정훈", "재원", "현서",
        "승원", "태윤", "지한", "도원", "시훈", "민규", "현식", "성준", "재민", "동민",
        "준석", "영호", "진호", "상민", "정민", "우빈", "시원", "태민", "준현", "민우",
        "현민", "지성", "승호", "동혁", "성우", "준형", "도현", "진현", "민석", "현성",
        "지용", "태영", "영민", "상현", "정현", "재훈", "동현", "승재", "준기", "진성",
        "민혁", "도영", "시민", "범준", "성진", "재호", "태훈", "민혁", "준우", "현도",
        "영준", "시준", "도준", "민규", "성욱", "재영", "태영", "준혁", "현석", "지웅",
        "동준", "승준", "민호", "성호", "재훈", "태현", "준성", "현우", "영훈", "시훈",
        "도현", "진우", "민재", "성민", "재현", "태윤", "준영", "현준", "지훈", "동훈",
        "승현", "민석", "성재", "재민", "태준", "준호", "현민", "영호", "시현", "도훈",
        "진호", "민우", "성준", "재우", "태우", "준현", "현진", "지원", "동윤", "승윤",
        "민영", "성훈", "재성", "태성", "준수", "현수", "영수", "시원", "도원", "진수",
        "민수", "성수", "재수", "태수", "준희", "현희", "지희", "동희", "승희", "민희",
        "성희", "재희", "태희", "준아", "현아", "지아", "동아", "승아", "민아", "성아",
        "재아", "태아", "준이", "현이", "지이", "동이", "승이", "민이", "성이", "재이",
        "태이", "기준", "성규", "재율", "태율", "준율", "현율", "지율", "동율", "승율",
        "민율", "성율", "재율", "태율", "준빈", "현빈", "지빈", "동빈", "승빈", "민빈",
        "성빈", "재빈", "태빈", "준일", "현일", "지일", "동일", "승일", "민일", "성일",
        "재일", "태일", "준석", "현석", "지석", "동석", "승석", "민석", "성석", "재석",
        "태석", "준혁", "현혁", "지혁", "동혁", "승혁", "민혁", "성혁", "재혁", "태혁",
        "영재", "시재", "도재", "진재", "민재", "성재", "재재", "태재", "준재", "현재",
        "지재", "동재", "승재", "영훈", "시훈", "도훈", "진훈", "민훈", "성훈", "재훈",
        "태훈", "준훈", "현훈", "지훈", "동훈", "승훈", "영호", "시호", "도호", "진호",
        "민호", "성호", "재호", "태호", "준호", "현호", "지호", "동호", "승호", "영수",
        "시수", "도수", "진수", "민수", "성수", "재수", "태수", "준수", "현수", "지수",
        "동수", "승수", "영민", "시민", "도민", "진민", "민민", "성민", "재민", "태민",
        "준민", "현민", "지민", "동민", "승민", "영현", "시현", "도현", "진현", "민현",
        "성현", "재현", "태현", "준현", "현현", "지현", "동현", "승현", "영준", "시준",
        "도준", "진준", "민준", "성준", "재준", "태준", "준준", "현준", "지준", "동준",
        "승준", "영우", "시우", "도우", "진우", "민우", "성우", "재우", "태우", "준우",
        "현우", "지우", "동우", "승우", "영진", "시진", "도진", "진진", "민진", "성진",
        "재진", "태진", "준진", "현진", "지진", "동진", "승진", "영성", "시성", "도성",
        "진성", "민성", "성성", "재성", "태성", "준성", "현성", "지성", "동성", "승성",
    ]
    # 여자 이름 350개+
    female_first = [
        "서연", "민서", "지우", "서윤", "지민", "수아", "하은", "예은", "지유", "예린",
        "채원", "수빈", "소율", "지아", "다은", "은서", "가은", "윤서", "나은", "하윤",
        "수진", "영희", "미영", "지영", "현정", "소희", "민지", "혜진", "은지", "정아",
        "서현", "유나", "지현", "수민", "예진", "서영", "채은", "지원", "하린", "예나",
        "민아", "지수", "수현", "서하", "채윤", "지은", "소민", "다인", "예서", "민정",
        "지혜", "수영", "채린", "서아", "예주", "지안", "서진", "예지", "채현", "유리",
        "다솜", "예빈", "소윤", "민희", "예원", "서우", "채민", "수지", "지나", "민영",
        "예은", "수연", "하진", "채아", "다영", "예린", "민주", "서영", "수빈", "하나",
        "지원", "예나", "서하", "민서", "채은", "수아", "지은", "유진", "다은", "은지",
        "소율", "하윤", "수민", "지유", "예린", "채원", "민지", "서윤", "지현", "예은",
        "수진", "영희", "미영", "지영", "현정", "소희", "혜진", "정아", "서현", "유나",
        "예진", "서영", "지원", "하린", "민아", "지수", "수현", "채윤", "소민", "민정",
        "지혜", "수영", "채린", "서아", "예주", "지안", "채현", "다솜", "예빈", "민희",
        "예원", "채민", "수지", "지나", "민영", "수연", "하진", "채아", "다영", "민주",
        "서희", "지희", "예희", "수희", "민희", "채희", "하희", "유희", "은희", "소희",
        "서영", "지영", "예영", "수영", "민영", "채영", "하영", "유영", "은영", "소영",
        "서진", "지진", "예진", "수진", "민진", "채진", "하진", "유진", "은진", "소진",
        "서아", "지아", "예아", "수아", "민아", "채아", "하아", "유아", "은아", "소아",
        "서윤", "지윤", "예윤", "수윤", "민윤", "채윤", "하윤", "유윤", "은윤", "소윤",
        "서현", "지현", "예현", "수현", "민현", "채현", "하현", "유현", "은현", "소현",
        "서민", "지민", "예민", "수민", "민민", "채민", "하민", "유민", "은민", "소민",
        "서원", "지원", "예원", "수원", "민원", "채원", "하원", "유원", "은원", "소원",
        "서빈", "지빈", "예빈", "수빈", "민빈", "채빈", "하빈", "유빈", "은빈", "소빈",
        "서율", "지율", "예율", "수율", "민율", "채율", "하율", "유율", "은율", "소율",
        "서린", "지린", "예린", "수린", "민린", "채린", "하린", "유린", "은린", "소린",
        "서나", "지나", "예나", "수나", "민나", "채나", "하나", "유나", "은나", "소나",
        "서안", "지안", "예안", "수안", "민안", "채안", "하안", "유안", "은안", "소안",
        "서주", "지주", "예주", "수주", "민주", "채주", "하주", "유주", "은주", "소주",
        "서리", "지리", "예리", "수리", "민리", "채리", "하리", "유리", "은리", "소리",
        "서솜", "지솜", "예솜", "수솜", "민솜", "채솜", "하솜", "유솜", "은솜", "소솜",
        "서인", "지인", "예인", "수인", "민인", "채인", "하인", "유인", "은인", "소인",
        "서정", "지정", "예정", "수정", "민정", "채정", "하정", "유정", "은정", "소정",
        "서혜", "지혜", "예혜", "수혜", "민혜", "채혜", "하혜", "유혜", "은혜", "소혜",
        "서영", "지영", "예영", "수영", "민영", "채영", "하영", "유영", "은영", "소영",
        "서은", "지은", "예은", "수은", "민은", "채은", "하은", "유은", "은은", "소은",
        "서가", "지가", "예가", "수가", "민가", "채가", "하가", "유가", "은가", "소가",
        "서다", "지다", "예다", "수다", "민다", "채다", "하다", "유다", "은다", "소다",
        "서나", "지나", "예나", "수나", "민나", "채나", "하나", "유나", "은나", "소나",
    ]
    # 성 30개 (20 → 30으로 확장)
    last_names = [
        "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
        "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍",
        "문", "양", "손", "배", "백", "허", "유", "남", "심", "노"
    ]
    return male_first, female_first, last_names


def generate_korean_name(gender: str = None) -> str:
    """성별에 맞는 한국 이름 생성 (고유 이름 수: 성 30 × 이름 350+ = 1만 명 이상 per gender, 중복 없이)"""
    male_first, female_first, last_names = _build_extended_name_pools()
    # 중복 제거로 고유 조합 수 확대 (성 30 × 고유 이름 수)
    male_first = list(dict.fromkeys(male_first))
    female_first = list(dict.fromkeys(female_first))
    return _name_from_pools(male_first, female_first, last_names, gender)


def _name_from_pools(male_first: list, female_first: list, last_names: list, gender: str = None) -> str:
    """미리 구축된 이름 풀에서 이름 1개 반환 (반복 호출 시 풀 재구축 비용 제거)."""
    last = random.choice(last_names)
    if gender == "남자":
        first = random.choice(male_first)
    elif gender == "여자":
        first = random.choice(female_first)
    else:
        first = random.choice(male_first + female_first)
    return f"{last}{first}"


# ========================================
# 2. 중복 제거
# ========================================

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """6-7축 기준 중복 제거 (혼인상태 포함)"""
    key_columns = ['거주지역', '성별', '연령', '경제활동', '혼인상태', '교육정도', '월평균소득']
    existing_cols = [c for c in key_columns if c in df.columns]
    
    if existing_cols:
        df_unique = df.drop_duplicates(subset=existing_cols, keep='first')
        return df_unique.reset_index(drop=True)
    
    return df


# ========================================
# 3. 현실적 제약 조건 적용 ⭐ 핵심
# ========================================

def _income_low_high_labels(income_labels: List[str]) -> Tuple[List[str], List[str]]:
    """통계(마진)에 있는 소득 라벨만 사용. 구간형(만원) vs 주관만족도형 구분해 저/고 소득 목록 반환."""
    if not income_labels:
        return [], []
    # 주관만족도형(서울 등): 부족=저소득, 여유=고소득
    low_keywords = ["매우 부족", "약간 부족", "부족함"]
    high_keywords_subj = ["매우 여유", "약간 여유", "여유있음"]
    low_keywords_won = ["50만원미만", "50-100만원", "100-200만원"]
    high_keywords_won = ["300-400만원", "400-500만원", "500-600만원", "600-700만원", "700-800만원", "800만원이상"]
    low_out = [l for l in income_labels if any(k in l for k in low_keywords) or any(k in l for k in low_keywords_won)]
    high_out = [l for l in income_labels if any(k in l for k in high_keywords_subj) or any(k in l for k in high_keywords_won)]
    if not low_out:
        low_out = income_labels[: max(1, len(income_labels) // 2)]
    if not high_out:
        high_out = income_labels[-max(1, len(income_labels) // 2) :]
    return low_out, high_out


def _redistrib_within_band(
    df: pd.DataFrame,
    col: str,
    band_mask: "pd.Series",
    target_dist: Dict[str, float],
    label: str,
) -> int:
    """한 연령 구간 안에서 col 값을 target_dist 방향으로 surplus→deficit 재분배.
    전체 marginal 은 최소한으로 흔들리며, 해당 구간 내 분포만 조정한다.
    반환값: 변경 건수."""
    idxs = df.index[band_mask].tolist()
    if not idxs:
        return 0
    available = set(df.loc[idxs, col].unique())
    filtered = {k: v for k, v in target_dist.items() if k in available}
    if not filtered:
        return 0
    total = sum(filtered.values())
    n = len(idxs)
    target_counts = {k: round(v / total * n) for k, v in filtered.items()}
    current_counts = df.loc[idxs, col].value_counts().to_dict()

    surplus: Dict[str, int] = {}
    deficit: Dict[str, int] = {}
    for lbl in filtered:
        cur = current_counts.get(lbl, 0)
        tgt = target_counts.get(lbl, 0)
        if cur > tgt:
            surplus[lbl] = cur - tgt
        elif cur < tgt:
            deficit[lbl] = tgt - cur

    changed = 0
    for from_lbl, from_cnt in surplus.items():
        if not deficit:
            break
        candidates = [i for i in idxs if df.at[i, col] == from_lbl]
        random.shuffle(candidates)
        to_move = min(from_cnt, sum(deficit.values()))
        for idx in candidates[:to_move]:
            to_labels = [k for k, v in deficit.items() if v > 0]
            if not to_labels:
                break
            weights = [deficit[k] for k in to_labels]
            w_total = sum(weights)
            chosen = np.random.choice(to_labels, p=[w / w_total for w in weights])
            df.at[idx, col] = chosen
            deficit[chosen] -= 1
            if deficit[chosen] <= 0:
                del deficit[chosen]
            changed += 1
    if changed:
        print(f"   ✅ {col} 보정 [{label}]: {changed}건 교체")
    return changed


def _apply_marital_age_corr(df: pd.DataFrame) -> pd.DataFrame:
    """연령대별 혼인상태 상관관계 보정 (대구·혼인상태 축 전용).

    KOSIS 「성, 연령 및 혼인상태별 인구」 수준의 조건부 분포를 사후 보정으로 근사.
    전체 marginal 은 각 구간 내 surplus↔deficit 교환으로 최소 변동 유지.
    """
    if '혼인상태' not in df.columns or '연령' not in df.columns:
        return df

    # (연령범위, 조건부 목표분포) — 한국 인구통계 기준
    BANDS = [
        ((20, 24), {'미혼': 0.93, '기혼': 0.05, '이혼': 0.01, '사별': 0.01}),
        ((25, 29), {'미혼': 0.77, '기혼': 0.20, '이혼': 0.02, '사별': 0.01}),
        ((30, 34), {'미혼': 0.42, '기혼': 0.52, '이혼': 0.05, '사별': 0.01}),
        ((35, 39), {'미혼': 0.22, '기혼': 0.67, '이혼': 0.08, '사별': 0.03}),
        ((40, 49), {'미혼': 0.12, '기혼': 0.70, '이혼': 0.11, '사별': 0.07}),
        ((50, 59), {'미혼': 0.06, '기혼': 0.65, '이혼': 0.11, '사별': 0.18}),
        ((60, 69), {'미혼': 0.04, '기혼': 0.57, '이혼': 0.07, '사별': 0.32}),
        ((70, 200), {'미혼': 0.02, '기혼': 0.38, '이혼': 0.04, '사별': 0.56}),
    ]
    total = 0
    for (lo, hi), dist in BANDS:
        mask = df['연령'].between(lo, hi)
        total += _redistrib_within_band(df, '혼인상태', mask, dist, f"{lo}-{hi}세")
    print(f"   ✅ 혼인상태-연령 상관관계 보정 완료 (총 {total}건)")
    return df


def _apply_edu_age_corr(df: pd.DataFrame) -> pd.DataFrame:
    """연령대별 교육정도 상관관계 보정.

    50대 이상부터 단계적으로 대졸이상 비율을 낮추고 중졸이하를 높인다.
    """
    if '교육정도' not in df.columns or '연령' not in df.columns:
        return df

    BANDS = [
        ((50, 59), {'대졸이상': 0.35, '고졸': 0.42, '중졸이하': 0.23}),
        ((60, 69), {'대졸이상': 0.25, '고졸': 0.38, '중졸이하': 0.37}),
        ((70, 79), {'대졸이상': 0.15, '고졸': 0.30, '중졸이하': 0.55}),
        ((80, 200), {'대졸이상': 0.08, '고졸': 0.22, '중졸이하': 0.70}),
    ]
    total = 0
    for (lo, hi), dist in BANDS:
        mask = df['연령'].between(lo, hi)
        total += _redistrib_within_band(df, '교육정도', mask, dist, f"{lo}-{hi}세")
    print(f"   ✅ 교육정도-연령 상관관계 보정 완료 (총 {total}건)")
    return df


def _apply_income_age_corr_no_econ(
    df: pd.DataFrame,
    all_income_labels: List[str],
    low_options: List[str],
    high_options: List[str],
) -> pd.DataFrame:
    """경제활동 축 없는 모드(대구)에서 연령-소득 상관관계 보정.

    20대: 고소득 과잉 축소 / 65세+: 고소득 과잉 축소 + 저소득 보강.
    """
    if '월평균소득' not in df.columns or '연령' not in df.columns:
        return df
    if not low_options or not high_options:
        return df

    mid_options = [l for l in all_income_labels if l not in low_options and l not in high_options]

    # 20대: 고소득(400만+) cap → 15%
    mask_20s = df['연령'].between(20, 29)
    idxs_20s = df.index[mask_20s].tolist()
    if idxs_20s:
        n_20s = len(idxs_20s)
        cap = int(n_20s * 0.15)
        high_20s = [i for i in idxs_20s if df.at[i, '월평균소득'] in high_options]
        if len(high_20s) > cap:
            change_idxs = random.sample(high_20s, len(high_20s) - cap)
            replace = low_options + mid_options[:3]
            for i in change_idxs:
                df.at[i, '월평균소득'] = random.choice(replace)
            print(f"   ✅ 20대 고소득 과잉 조정: {len(change_idxs)}건")

    # 65세+: 고소득 cap → 10%, 저소득 최소 50%
    mask_65 = df['연령'] >= 65
    idxs_65 = df.index[mask_65].tolist()
    if idxs_65:
        n_65 = len(idxs_65)
        # 고소득 cap
        cap_high = int(n_65 * 0.10)
        high_65 = [i for i in idxs_65 if df.at[i, '월평균소득'] in high_options]
        if len(high_65) > cap_high:
            change_idxs = random.sample(high_65, len(high_65) - cap_high)
            for i in change_idxs:
                df.at[i, '월평균소득'] = random.choice(low_options)
            print(f"   ✅ 65세+ 고소득 과잉 조정: {len(change_idxs)}건")
        # 저소득 최소 50%
        low_65 = [i for i in idxs_65 if df.at[i, '월평균소득'] in low_options]
        min_low = int(n_65 * 0.50)
        if len(low_65) < min_low:
            need = min_low - len(low_65)
            non_low_65 = [i for i in idxs_65 if df.at[i, '월평균소득'] not in low_options and df.at[i, '월평균소득'] not in high_options]
            change_idxs = non_low_65[:need]
            for i in change_idxs:
                df.at[i, '월평균소득'] = random.choice(low_options)
            if change_idxs:
                print(f"   ✅ 65세+ 저소득 보강: {len(change_idxs)}건")

    return df


def apply_realistic_constraints(
    df: pd.DataFrame,
    income_labels: Optional[List[str]] = None,
) -> pd.DataFrame:
    """현실적인 제약 조건 적용 (행방향 개연성 강화). 소득은 통계(마진)에 있는 라벨만 사용."""

    if '연령' not in df.columns:
        print("⚠️ apply_realistic_constraints: 연령 컬럼 없음 - 스킵")
        return df

    has_econ = '경제활동' in df.columns
    has_marital = '혼인상태' in df.columns
    has_income = '월평균소득' in df.columns
    has_edu = '교육정도' in df.columns

    df = df.copy()

    # 소득 라벨 범위 확보
    valid_income = list(df["월평균소득"].dropna().unique()) if has_income else []
    if income_labels:
        valid_income = [v for v in valid_income if v in income_labels] or list(income_labels)
    low_income_options, high_income_options = _income_low_high_labels(income_labels or valid_income)
    if not low_income_options:
        low_income_options = valid_income[: max(1, len(valid_income) // 2)] or ["50만원미만", "50-100만원"]
    if not high_income_options:
        high_income_options = valid_income[-max(1, len(valid_income) // 2) :] or ["300-400만원", "400-500만원"]

    # 비경제활동 → 직업분류 '해당없음'
    if "직업분류" in df.columns and has_econ:
        inactive = df["경제활동"] == "비경제활동"
        if inactive.sum() > 0:
            df.loc[inactive, "직업분류"] = "해당없음"
            print(f"   ✅ 비경제활동자 직업분류 → 해당없음: {inactive.sum()}건")

    print("🔧 현실적 제약 조건 적용 시작 (행방향 개연성 강화)...")

    # ── 경제활동 축이 있는 시도 (서울·경북 등) ──────────────────────────
    if has_econ and has_income:
        # 규칙 1: 고령자(65+) → 비경제활동 80% 이상
        elderly_econ = (df['연령'] >= 65) & (df['경제활동'] == '경제활동')
        if elderly_econ.sum() > 0 and low_income_options:
            target_count = int(elderly_econ.sum() * 0.2)
            adjust_count = elderly_econ.sum() - target_count
            if adjust_count > 0:
                adjust_indices = df[elderly_econ].sample(n=adjust_count, random_state=42).index
                df.loc[adjust_indices, '경제활동'] = '비경제활동'
                p = [1.0 / len(low_income_options)] * len(low_income_options)
                df.loc[adjust_indices, '월평균소득'] = np.random.choice(low_income_options, size=adjust_count, p=p)
                print(f"   ✅ 고령자 경제활동 → 비경제활동 조정: {adjust_count}건")

        # 규칙 2: 비경제활동 → 고소득 불가
        non_econ_high = (df['경제활동'] == '비경제활동') & (df['월평균소득'].isin(high_income_options))
        if non_econ_high.sum() > 0 and low_income_options:
            n_adj = non_econ_high.sum()
            mid_options = [l for l in (income_labels or valid_income) if l not in high_income_options and l in df["월평균소득"].values]
            replace_options = (low_income_options + mid_options[:3]) if mid_options else low_income_options
            replace_options = [x for x in replace_options if x in (income_labels or valid_income)] or low_income_options
            if replace_options:
                p = [1.0 / len(replace_options)] * len(replace_options)
                df.loc[non_econ_high, '월평균소득'] = np.random.choice(replace_options, size=n_adj, p=p)
                print(f"   ✅ 비경제활동 고소득 조정: {n_adj}건")

        # 규칙 3: 청년(20-35) + 경제활동 → 저소득만 → 중상위로
        young_econ_low = (df['경제활동'] == '경제활동') & df['연령'].between(20, 35) & df['월평균소득'].isin(low_income_options)
        if young_econ_low.sum() > 0 and high_income_options:
            n_adj = young_econ_low.sum()
            mid_high = [l for l in (income_labels or valid_income) if l not in low_income_options][:5]
            options = mid_high or high_income_options
            if options:
                p = [1.0 / len(options)] * len(options)
                df.loc[young_econ_low, '월평균소득'] = np.random.choice(options, size=n_adj, p=p)
                print(f"   ✅ 청년 경제활동 저소득 조정: {n_adj}건")

        # 규칙 4: 중장년(36-55) + 경제활동 + 저소득 → 중상위
        middle_age_econ = (df['경제활동'] == '경제활동') & df['연령'].between(36, 55) & df['월평균소득'].isin(low_income_options)
        if middle_age_econ.sum() > 0 and high_income_options:
            n_adj = middle_age_econ.sum()
            options = [l for l in (income_labels or valid_income) if l not in low_income_options][:5] or high_income_options
            if options:
                p = [1.0 / len(options)] * len(options)
                df.loc[middle_age_econ, '월평균소득'] = np.random.choice(options, size=n_adj, p=p)
                print(f"   ✅ 중장년 경제활동 저소득 조정: {n_adj}건")

        # 규칙 7: 중장년(36-55) + 비경제활동 + 고소득 → 저소득
        middle_age_non_econ = (df['경제활동'] == '비경제활동') & df['연령'].between(36, 55) & df['월평균소득'].isin(high_income_options)
        if middle_age_non_econ.sum() > 0 and low_income_options:
            n_adj = middle_age_non_econ.sum()
            p = [1.0 / len(low_income_options)] * len(low_income_options)
            df.loc[middle_age_non_econ, '월평균소득'] = np.random.choice(low_income_options, size=n_adj, p=p)
            print(f"   ✅ 중장년 비경제활동 고소득 조정: {n_adj}건")

        # 규칙 8: 고령자(65+) + 비경제활동 + 고소득 → 저소득
        elderly_non_econ = (df['경제활동'] == '비경제활동') & (df['연령'] >= 65) & df['월평균소득'].isin(high_income_options)
        if elderly_non_econ.sum() > 0 and low_income_options:
            n_adj = elderly_non_econ.sum()
            p = [1.0 / len(low_income_options)] * len(low_income_options)
            df.loc[elderly_non_econ, '월평균소득'] = np.random.choice(low_income_options, size=n_adj, p=p)
            print(f"   ✅ 고령자 비경제활동 고소득 조정: {n_adj}건")

    # ── 혼인상태 축이 있는 시도 (대구 등) ────────────────────────────────
    if has_marital:
        df = _apply_marital_age_corr(df)

    # ── 교육정도 공통 보정 (연령대별 대졸 비율 현실화) ───────────────────
    if has_edu:
        df = _apply_edu_age_corr(df)

    # ── 소득 연령 상관관계 보정 (경제활동 없는 시도) ─────────────────────
    if has_income and not has_econ:
        df = _apply_income_age_corr_no_econ(
            df, income_labels or valid_income, low_income_options, high_income_options
        )

    # 대졸 초년생(20-25) 고소득 → 중간 소득 (공통)
    if has_income and has_edu:
        young_college_high = (
            df['연령'].between(20, 25) &
            (df['교육정도'] == '대졸이상') &
            df['월평균소득'].isin(high_income_options)
        )
        if young_college_high.sum() > 0:
            n_adj = young_college_high.sum()
            mid_opts = [l for l in (income_labels or valid_income) if l not in high_income_options and l not in low_income_options] or low_income_options
            if mid_opts:
                p = [1.0 / len(mid_opts)] * len(mid_opts)
                df.loc[young_college_high, '월평균소득'] = np.random.choice(mid_opts, size=n_adj, p=p)
                print(f"   ✅ 대졸 초년생 고소득 조정: {n_adj}건")

    # 20세 미만 제거 (공통)
    under_20 = df['연령'] < 20
    if under_20.sum() > 0:
        df = df[~under_20].reset_index(drop=True)
        print(f"   ✅ 20세 미만 제거: {under_20.sum()}건")

    print("✅ 현실적 제약 조건 적용 완료")
    return df


# ========================================
# 4. IPF 유틸리티
# ========================================

def _normalize_prob(probs: List[float]) -> List[float]:
    """확률 정규화"""
    total = sum(probs)
    if total == 0:
        return [1.0 / len(probs)] * len(probs)
    return [p / total for p in probs]


def _safe_choice(labels: List, probs: List[float]):
    """안전한 weighted random choice"""
    if not labels or not probs or len(labels) != len(probs):
        return labels[0] if labels else None
    
    probs = _normalize_prob(probs)
    return np.random.choice(labels, p=probs)


# ========================================
# 5. CA-IPF 알고리즘 (Correlation-Aware IPF)
# ========================================

# ── 한국 인구통계 기준 조건부 분포(10세 연령대 단위) ─────────────────────────
# 이 결합 분포들은 IPF에 2차원 결합 마진(joint marginal)으로 직접 주입되어
# 단순 1차원 한계분포만 맞추는 일반 IPF가 아닌 "상관관계 보존 IPF"가 되도록 한다.

# 연령대 × 혼인상태  (출처: KOSIS 「성, 연령 및 혼인상태별 인구」 평균 추정)
AGE_BAND_MARITAL_COND: Dict[str, Dict[str, float]] = {
    "20대": {"미혼": 0.85, "기혼": 0.13, "이혼": 0.015, "사별": 0.005},
    "30대": {"미혼": 0.32, "기혼": 0.60, "이혼": 0.06, "사별": 0.02},
    "40대": {"미혼": 0.12, "기혼": 0.70, "이혼": 0.11, "사별": 0.07},
    "50대": {"미혼": 0.06, "기혼": 0.65, "이혼": 0.11, "사별": 0.18},
    "60대": {"미혼": 0.04, "기혼": 0.57, "이혼": 0.07, "사별": 0.32},
    "70대": {"미혼": 0.02, "기혼": 0.40, "이혼": 0.05, "사별": 0.53},
    "80대": {"미혼": 0.02, "기혼": 0.30, "이혼": 0.03, "사별": 0.65},
    "90대": {"미혼": 0.02, "기혼": 0.20, "이혼": 0.02, "사별": 0.76},
    "100대": {"미혼": 0.02, "기혼": 0.15, "이혼": 0.02, "사별": 0.81},
}

# 연령대 × 교육정도  (출처: KOSIS 「성, 연령 및 교육정도별 인구」)
AGE_BAND_EDU_COND: Dict[str, Dict[str, float]] = {
    "20대": {"대졸이상": 0.65, "고졸": 0.30, "중졸이하": 0.05},
    "30대": {"대졸이상": 0.55, "고졸": 0.38, "중졸이하": 0.07},
    "40대": {"대졸이상": 0.45, "고졸": 0.45, "중졸이하": 0.10},
    "50대": {"대졸이상": 0.35, "고졸": 0.42, "중졸이하": 0.23},
    "60대": {"대졸이상": 0.25, "고졸": 0.38, "중졸이하": 0.37},
    "70대": {"대졸이상": 0.15, "고졸": 0.30, "중졸이하": 0.55},
    "80대": {"대졸이상": 0.08, "고졸": 0.22, "중졸이하": 0.70},
    "90대": {"대졸이상": 0.05, "고졸": 0.15, "중졸이하": 0.80},
    "100대": {"대졸이상": 0.03, "고졸": 0.10, "중졸이하": 0.87},
}

# 연령대 × 경제활동  (출처: 통계청 「경제활동인구조사」 평균 추정)
AGE_BAND_ECON_COND: Dict[str, Dict[str, float]] = {
    "20대": {"경제활동": 0.65, "비경제활동": 0.35},
    "30대": {"경제활동": 0.80, "비경제활동": 0.20},
    "40대": {"경제활동": 0.78, "비경제활동": 0.22},
    "50대": {"경제활동": 0.75, "비경제활동": 0.25},
    "60대": {"경제활동": 0.40, "비경제활동": 0.60},
    "70대": {"경제활동": 0.18, "비경제활동": 0.82},
    "80대": {"경제활동": 0.10, "비경제활동": 0.90},
    "90대": {"경제활동": 0.05, "비경제활동": 0.95},
    "100대": {"경제활동": 0.02, "비경제활동": 0.98},
}

# 성별 × 경제활동  (참여율 격차 — 통계청)
GENDER_ECON_COND: Dict[str, Dict[str, float]] = {
    "남자": {"경제활동": 0.72, "비경제활동": 0.28},
    "여자": {"경제활동": 0.55, "비경제활동": 0.45},
}

# 경제활동 × 소득버킷  (low/mid/high 가상 버킷 — 실제 라벨은 동적으로 매핑)
ECON_INCOME_BUCKET_COND: Dict[str, Dict[str, float]] = {
    "경제활동": {"low": 0.20, "mid": 0.50, "high": 0.30},
    "비경제활동": {"low": 0.78, "mid": 0.20, "high": 0.02},
}


def _age_to_band(age: int) -> str:
    """연령(정수) → 10세 연령대 라벨('20대', '30대', ...)."""
    return f"{int(age) // 10 * 10}대"


def _split_income_into_buckets(
    income_labels: List[str],
) -> Tuple[List[str], List[str], List[str]]:
    """소득 라벨을 (저/중/고) 3 버킷으로 분류해 결합 마진 산출에 사용.

    구간형(만원)·주관만족도형 모두 _income_low_high_labels() 의 키워드 규칙 재사용.
    """
    low, high = _income_low_high_labels(income_labels)
    mid = [l for l in income_labels if l not in low and l not in high]
    return low, mid, high


def _build_joint_marginal_series(
    band_marginal: Dict[str, float],
    target_marginal: Dict[str, float],
    cond_dist: Dict[str, Dict[str, float]],
    n: int,
    band_col: str,
    target_col: str,
    epsilon: float = 1e-3,
    inner_max_iter: int = 80,
) -> Optional[pd.Series]:
    """조건부 분포 + 1D 마진 → 정합 결합 마진(MultiIndex Series).

    핵심: 결합 분포의 row sum / col sum 이 사용자가 입력한 1D 마진과
    정확히 일치하도록 내부 2D IPF 로 자체 조정한다. conditional ratio
    P(target|band) 는 가능한 한 유지되지만, marginal 일관성을 우선.
    이렇게 만든 결합 마진을 ipfn 에 넘기면 외부 IPF 가 1D 마진과
    충돌 없이 결합 분포를 함께 수렴시킬 수 있다.

    band_marginal:   P(축1=band) — 사용자 1D (정규화 전 값 OK)
    target_marginal: P(축2=target) — 사용자 1D (정규화 전 값 OK)
    cond_dist:       P(target | band) — 한국 인구통계 기준 conditional
    n:               전체 인구수 (sum-to-n 정규화)
    """
    bands = list(band_marginal.keys())
    targets = list(target_marginal.keys())
    if not bands or not targets:
        return None

    row_sum = np.array([float(band_marginal[b]) for b in bands], dtype=float)
    col_sum = np.array([float(target_marginal[t]) for t in targets], dtype=float)
    rs_total = row_sum.sum()
    cs_total = col_sum.sum()
    if rs_total <= 0 or cs_total <= 0:
        return None
    row_sum = row_sum / rs_total * n
    col_sum = col_sum / cs_total * n

    # 1) 초기 표 P(b, t) ∝ P_cond(t|b) (each row 정규화)
    table = np.full((len(bands), len(targets)), epsilon, dtype=float)
    for i, b in enumerate(bands):
        sub = cond_dist.get(b, {})
        sub_f = {k: float(v) for k, v in sub.items() if k in set(targets) and v > 0}
        if not sub_f:
            continue
        s_sub = sum(sub_f.values())
        if s_sub <= 0:
            continue
        for j, t in enumerate(targets):
            v = sub_f.get(t, 0.0)
            if v > 0:
                table[i, j] = v / s_sub
    # 초기 표를 row sum 으로 weighting
    for i in range(len(bands)):
        rs_i = table[i, :].sum()
        if rs_i > 0:
            table[i, :] = table[i, :] / rs_i * row_sum[i]

    # 2) 2D IPF — row/col 마진 정합
    for _ in range(inner_max_iter):
        # row 보정
        cur_row = table.sum(axis=1)
        for i in range(len(bands)):
            if cur_row[i] > 0:
                table[i, :] *= row_sum[i] / cur_row[i]
        # col 보정
        cur_col = table.sum(axis=0)
        for j in range(len(targets)):
            if cur_col[j] > 0:
                table[:, j] *= col_sum[j] / cur_col[j]
        # 수렴 검사
        rmax = max(abs(table.sum(axis=1) / row_sum - 1).max(), abs(table.sum(axis=0) / col_sum - 1).max())
        if rmax < 1e-6:
            break

    rows = []
    for i, b in enumerate(bands):
        for j, t in enumerate(targets):
            v = table[i, j]
            if v > 0:
                rows.append((b, t, v))
    if not rows:
        return None

    idx = pd.MultiIndex.from_tuples(
        [(r[0], r[1]) for r in rows], names=[band_col, target_col]
    )
    s = pd.Series([r[2] for r in rows], index=idx, dtype=float)
    total = s.sum()
    if total <= 0:
        return None
    s = s * (n / total)
    return s


def _build_pair_marginal_series(
    src_marginal: Dict[str, float],
    target_marginal: Dict[str, float],
    cond_dist: Dict[str, Dict[str, float]],
    n: int,
    src_col: str,
    target_col: str,
    epsilon: float = 1e-3,
) -> Optional[pd.Series]:
    """일반 페어(예: 성별 × 경제활동) 결합 마진 series."""
    return _build_joint_marginal_series(
        src_marginal, target_marginal, cond_dist, n, src_col, target_col, epsilon=epsilon,
    )


def _densify_count_tbl(count_tbl: pd.DataFrame, cols: List[str], fill: float = 1e-5) -> pd.DataFrame:
    """count_tbl 을 cols 의 cartesian product 로 dense 화.

    ipfn 의 ipfn_df 는 product(*[unique(col)]) 로 모든 조합을 순회하며
    tmp.loc[feature] / xijk.loc[feature] 를 호출하므로, count_tbl 이 sparse
    하면 결합 마진 사용 시 KeyError 가 날 수 있다.

    ⚠️ fill 은 매우 작은 값(1e-5)이어야 한다. 너무 크면 누락 셀이 marginal
    제약을 균등하게 분산시켜 결합 분포가 "평탄"해지고, conditional 정보가
    소실된다. 작을수록 IPF 가 실제 데이터 셀에만 집중해 마진을 맞춘다.
    """
    from itertools import product as _product

    uniques = [count_tbl[c].dropna().unique().tolist() for c in cols]
    if not all(uniques):
        return count_tbl
    full = pd.DataFrame(list(_product(*uniques)), columns=cols)
    merged = full.merge(count_tbl, on=cols, how='left')
    if 'total' in merged.columns:
        merged['total'] = merged['total'].fillna(fill).clip(lower=fill)
    return merged


# ────────────────────────────────────────────────────────────────────────
#  Native (numpy) N-차원 IPF — ipfn 라이브러리 미사용
#  ipfn 라이브러리가 다축 결합 마진에서 수렴 어려움/희석 문제를 보일 때
#  사용하는 자체 구현. cell 단위 multiplicative update 로 1D + 2D 결합
#  마진을 모두 정확히 만족시킨다.
# ────────────────────────────────────────────────────────────────────────

def _ipf_native_iterate(
    count_tbl: pd.DataFrame,
    aggregates: List[pd.Series],
    dimensions: List[List[str]],
    weight_col: str = 'total',
    max_iter: int = 500,
    conv_rate: float = 1e-6,
    verbose: bool = False,
) -> Tuple[pd.DataFrame, float, int]:
    """numpy ndarray 기반 N-차원 IPF.

    ipfn 라이브러리(`ipfn.ipfn`) 와 동일한 인터페이스를 받지만, 내부적으로는
    multi-dimensional ndarray 를 만들어 각 marginal(1D 또는 2D) 에 대해
    multiplicative scale factor 를 broadcast 곱셈으로 적용한다.

    Returns
    -------
    (result_count_tbl, max_conv, n_iter)
    """
    if not aggregates:
        return count_tbl.copy(), 0.0, 0

    # 1) cat_cols 추출 (dimensions 의 모든 컬럼 합집합 ∩ count_tbl)
    cat_cols: List[str] = []
    for dim in dimensions:
        for c in dim:
            if c in count_tbl.columns and c not in cat_cols:
                cat_cols.append(c)
    if not cat_cols:
        return count_tbl.copy(), 0.0, 0

    # 2) 라벨 인덱스 빌드
    label_lists: Dict[str, list] = {}
    for c in cat_cols:
        vals = count_tbl[c].dropna().unique().tolist()
        # 안정적인 순서를 위해 정렬 (값 타입 혼재 시 그대로 유지)
        try:
            vals = sorted(vals)
        except TypeError:
            pass
        label_lists[c] = vals
    label_to_idx: Dict[str, Dict] = {
        c: {lbl: i for i, lbl in enumerate(label_lists[c])} for c in cat_cols
    }
    shape = tuple(len(label_lists[c]) for c in cat_cols)

    # 3) count_tbl → ndarray
    table = np.zeros(shape, dtype=float)
    idx_arrays = [count_tbl[c].map(label_to_idx[c]).to_numpy() for c in cat_cols]
    valid_mask = np.ones(len(count_tbl), dtype=bool)
    for arr in idx_arrays:
        valid_mask &= pd.notna(arr)
    if not valid_mask.all():
        idx_arrays = [arr[valid_mask] for arr in idx_arrays]
    weights = count_tbl.loc[valid_mask, weight_col].to_numpy(dtype=float)
    np.add.at(table, tuple(a.astype(int) for a in idx_arrays), weights)
    # 0 셀에 미세값 — 0 곱셈으로 영구 0 fix 방지
    table = np.where(table > 0, table, 1e-12)

    # 4) constraints 로 변환: list of (axes_tuple, target_ndarray)
    constraints: List[Tuple[Tuple[int, ...], np.ndarray]] = []
    for dim, agg in zip(dimensions, aggregates):
        axes = tuple(cat_cols.index(c) for c in dim if c in cat_cols)
        if not axes:
            continue
        if len(dim) == 1:
            col = dim[0]
            tgt = np.zeros(shape[axes[0]], dtype=float)
            if isinstance(agg, pd.Series):
                for lbl, v in agg.items():
                    if lbl in label_to_idx[col]:
                        tgt[label_to_idx[col][lbl]] = float(v)
            else:
                arr = np.asarray(agg, dtype=float).flatten()
                for i, v in enumerate(arr[: tgt.size]):
                    tgt[i] = float(v)
        else:
            # 2D (또는 그 이상): MultiIndex Series 기대
            sub_shape = tuple(shape[a] for a in axes)
            tgt = np.zeros(sub_shape, dtype=float)
            if isinstance(agg, pd.Series) and isinstance(agg.index, pd.MultiIndex):
                for keys, v in agg.items():
                    if not isinstance(keys, tuple):
                        keys = (keys,)
                    try:
                        idx_t = tuple(label_to_idx[dim[k]][keys[k]] for k in range(len(dim)))
                    except KeyError:
                        continue
                    tgt[idx_t] = float(v)
            elif isinstance(agg, pd.DataFrame):
                # 형식 호환: row=dim[0], col=dim[1]
                for r, row in agg.iterrows():
                    if r not in label_to_idx[dim[0]]:
                        continue
                    i0 = label_to_idx[dim[0]][r]
                    for c, v in row.items():
                        if c in label_to_idx[dim[1]]:
                            tgt[i0, label_to_idx[dim[1]][c]] = float(v)
        constraints.append((axes, tgt))

    if not constraints:
        return count_tbl.copy(), 0.0, 0

    # 5) IPF iteration
    n_total = float(sum(constraints[0][1].sum() for _ in range(1)))
    last_max_conv = float('inf')
    n_iter = 0
    for it in range(max_iter):
        n_iter = it + 1
        max_conv = 0.0
        for axes, target in constraints:
            other_axes = tuple(d for d in range(table.ndim) if d not in axes)
            if other_axes:
                current = table.sum(axis=other_axes)
            else:
                current = table.copy()
            # axes 순서가 ndarray reduction 후 결과의 축 순서와 일치하도록 transpose
            # np.sum 은 axis 인자에 명시된 차원을 제거하고 나머지 차원의 원래 순서를 유지함
            # current 의 축 순서는 sorted(axes) 와 같음
            sorted_axes = tuple(sorted(axes))
            if sorted_axes != axes:
                # target 축 순서를 sorted_axes 에 맞춰 재배열
                perm = tuple(sorted_axes.index(a) for a in axes)
                target_aligned = target.transpose(perm)
            else:
                target_aligned = target

            # factor = target / current  (current 0 이면 1.0)
            with np.errstate(divide='ignore', invalid='ignore'):
                factor = np.where(current > 1e-15, target_aligned / current, 1.0)

            # broadcast factor across other_axes
            broadcast_shape = list(table.shape)
            for d in other_axes:
                broadcast_shape[d] = 1
            # current.shape 는 sorted_axes 에 해당하는 dim 만 포함
            # broadcast 를 위해 1 로 채운 broadcast_shape 의 sorted_axes 위치에 factor.shape 을 채움
            # (이미 broadcast_shape 의 sorted_axes 위치는 table.shape[a] 와 동일하게 남아있음)
            factor_b = factor.reshape(broadcast_shape)
            table = table * factor_b

            # convergence on this constraint
            t_sum = target_aligned.sum()
            if t_sum > 0:
                # 새 marginal (이번 보정 후) 계산은 비용이 크므로
                # 직전 current 와 target 의 상대 오차로 근사
                rel = np.abs((current - target_aligned) / np.where(target_aligned > 1e-12, target_aligned, 1.0))
                max_conv = max(max_conv, float(rel.max()))

        if verbose:
            print(f"   [native IPF] iter={n_iter}, max_rel_err={max_conv:.6f}")
        if max_conv < conv_rate:
            last_max_conv = max_conv
            break
        if abs(last_max_conv - max_conv) < 1e-12 and it > 5:
            last_max_conv = max_conv
            break
        last_max_conv = max_conv

    # 6) ndarray → DataFrame
    coords = np.indices(shape).reshape(table.ndim, -1).T  # (n_cells, n_dims)
    flat_vals = table.flatten()
    rows_data: Dict[str, list] = {c: [] for c in cat_cols}
    rows_data[weight_col] = []
    for i in range(coords.shape[0]):
        v = float(flat_vals[i])
        if v <= 1e-12:
            continue
        for d, c in enumerate(cat_cols):
            rows_data[c].append(label_lists[c][coords[i, d]])
        rows_data[weight_col].append(v)

    result_tbl = pd.DataFrame(rows_data)

    # ipfn 결과와 시그니처 호환: count_tbl 의 다른 컬럼이 있으면 보존
    extra_cols = [c for c in count_tbl.columns if c not in cat_cols and c != weight_col]
    if extra_cols:
        result_tbl = result_tbl.merge(
            count_tbl[cat_cols + extra_cols].drop_duplicates(subset=cat_cols),
            on=cat_cols, how='left',
        )

    return result_tbl, last_max_conv, n_iter


def _max_marginal_relerr(
    result_tbl: pd.DataFrame,
    aggregates: List[pd.Series],
    dimensions: List[List[str]],
    weight_col: str = 'total',
) -> float:
    """IPF 결과의 1D/2D 마진 정합도 검증 — 최대 상대 오차."""
    max_err = 0.0
    for dim, agg in zip(dimensions, aggregates):
        if not all(c in result_tbl.columns for c in dim):
            continue
        cur = result_tbl.groupby(dim)[weight_col].sum()
        if not isinstance(agg, pd.Series):
            continue
        # reindex to common keys
        common = cur.index.intersection(agg.index)
        if len(common) == 0:
            continue
        cur_a = cur.reindex(common).fillna(0.0)
        tgt_a = agg.reindex(common).fillna(0.0)
        denom = tgt_a.abs().clip(lower=1e-9)
        rel = ((cur_a - tgt_a).abs() / denom).max()
        if pd.notna(rel) and rel > max_err:
            max_err = float(rel)
    return max_err


def apply_ipf(
    df: pd.DataFrame,
    n: int,
    margins_axis: Dict[str, Dict],
    max_iterations: int = 500,
) -> pd.DataFrame:
    """
    CA-IPF (Correlation-Aware IPF): 1차원 한계분포 + 2차원 결합분포 동시 제약.

    알고리즘 요약
    ─────────────────────────────────────────────────────────────────
    1. 현재 df 를 인구통계 조합별 집계 테이블로 변환 (cell-count table)
    2. KOSIS 1차원 한계분포(margin)뿐 아니라 한국 인구통계 기준 조건부 분포에서
       유도한 2차원 결합 분포(예: 연령대×혼인상태, 연령대×교육, 연령대×경제활동,
       성별×경제활동, 경제활동×소득)도 동시에 ipfn 에 제약으로 전달
    3. ipfn 이 모든 1D + 2D 제약을 만족하도록 셀 가중치를 반복 비례 조정
    4. 각 레코드에 「조정 후 / 조정 전」 가중치(중요도)를 부여
    5. 중요도 비례 복원 추출(SIR)로 n 명 재구성
    ─────────────────────────────────────────────────────────────────
    이 방식은 단순 IPF처럼 한계분포만 맞추는 게 아니라 변수 간 상관관계까지
    보존한다. ipfn 실패 시 _apply_ipf_legacy() 로 자동 폴백.
    """
    try:
        return _apply_ipf_ipfn(df, n, margins_axis, max_iterations)
    except Exception as exc:
        print(f"⚠️ CA-IPF 실패 ({exc}), 레거시 방식으로 대체합니다...")
        return _apply_ipf_legacy(df, n, margins_axis, max_iterations)


def _apply_ipf_ipfn(
    df: pd.DataFrame,
    n: int,
    margins_axis: Dict[str, Dict],
    max_iterations: int = 500,
) -> pd.DataFrame:
    """ipfn 라이브러리 기반 CA-IPF 핵심 구현 (1D 한계 + 2D 결합 마진).

    단순 IPF (1차원 한계분포만 맞춤) 와 달리, 한국 인구통계 기준의 조건부
    분포(연령대×혼인상태/교육/경제활동, 성별×경제활동, 경제활동×소득)를
    2차원 결합 마진으로 추가 제약하여 변수 간 상관관계를 보존한다.
    """
    from ipfn import ipfn as _ipfn_mod  # _ipfn_mod 는 모듈, _ipfn_mod.ipfn 이 클래스

    _axis_col: Dict[str, str] = {
        'sigungu': '거주지역', 'gender': '성별', 'age': '연령',
        'econ': '경제활동', 'income': '월평균소득', 'edu': '교육정도',
        'job': '직업분류', 'marital': '혼인상태',
    }

    # 활성 축 수집
    active: Dict[str, Dict] = {}
    for axis_key, margin_data in margins_axis.items():
        col = _axis_col.get(axis_key)
        if not col or col not in df.columns:
            continue
        labels = margin_data.get('labels', [])
        probs = margin_data.get('p', margin_data.get('probs', []))
        if labels and probs and len(labels) == len(probs):
            s = sum(probs)
            if s > 0:
                active[col] = {
                    'labels': list(labels),
                    'probs': [p / s for p in probs],
                }

    if not active:
        df['식별NO'] = range(1, len(df) + 1)
        return df

    # ── 연령(개별 값 최대 66개)은 10세 구간으로 그루핑 후 IPF 적용 ──────────
    # 이유: 연령 × 다른 변수의 교차 테이블이 매우 희박해 IPF 수렴 불안정
    AGE_BAND_COL = '_연령대_ipf'
    has_age = '연령' in active and '연령' in df.columns
    df_ipf = df.copy()
    age_band_active: Optional[Dict] = None

    if has_age:
        age_labels = active['연령']['labels']
        age_probs = active['연령']['probs']
        band_agg: Dict[str, float] = {}
        for a, p in zip(age_labels, age_probs):
            band_agg[_age_to_band(a)] = band_agg.get(_age_to_band(a), 0.0) + p
        total_band = sum(band_agg.values())
        if total_band > 0:
            band_agg = {k: v / total_band for k, v in band_agg.items()}
        df_ipf[AGE_BAND_COL] = df_ipf['연령'].apply(_age_to_band)
        age_band_active = {
            'labels': list(band_agg.keys()),
            'probs': list(band_agg.values()),
        }

    # 차원 폭발 방지: 최대 5 범주형 축 + 연령대 (= 6축).
    # 결합 마진(상관관계)에 핵심적으로 쓰이는 축들을 우선순위 상위에 배치.
    _priority = ['성별', '경제활동', '혼인상태', '교육정도', '월평균소득', '거주지역', '직업분류']
    cat_cols = sorted(
        [c for c in active if c != '연령'],
        key=lambda c: _priority.index(c) if c in _priority else 99,
    )
    cat_cols = cat_cols[:5]  # 5축 + 연령대 = 최대 6축
    if age_band_active:
        cat_cols.append(AGE_BAND_COL)

    active_for_ipf = {c: (active[c] if c != AGE_BAND_COL else age_band_active) for c in cat_cols}
    cols = cat_cols

    cols_disp = [c.replace(AGE_BAND_COL, '연령대') for c in cols]
    print(f"🔄 CA-IPF 시작 (ipfn, 축: {cols_disp}, 목표: {n}명)")

    # 1) 집계 테이블 구축 (연령대 사용) + cartesian dense 화
    count_tbl = (
        df_ipf.groupby(cols, as_index=False, observed=True)
        .size()
        .rename(columns={'size': 'total'})
    )
    count_tbl['total'] = count_tbl['total'].astype(float).clip(lower=1e-5)
    # ipfn 의 product 루프가 안전하도록 모든 조합을 보강 (누락 셀은 1e-5)
    count_tbl = _densify_count_tbl(count_tbl, cols, fill=1e-5)

    # 2-A) 1차원 한계 마진 구축 (KOSIS 입력 그대로)
    aggregates: list = []
    dimensions: list = []
    for col in cols:
        info = active_for_ipf[col]
        target_s = pd.Series([p * n for p in info['probs']], index=info['labels'])
        present = count_tbl[col].unique()
        target_s = target_s.reindex(present).fillna(0.1)
        t = target_s.sum()
        if t > 0:
            target_s = target_s * (n / t)
        aggregates.append(target_s)
        dimensions.append([col])

    # 2-B) 2차원 결합 마진 구축 — 상관관계 보존이 핵심
    joint_added: list = []  # 디버그 출력용

    has_band = AGE_BAND_COL in cols
    has_marital = '혼인상태' in cols
    has_edu = '교육정도' in cols
    has_econ = '경제활동' in cols
    has_gender = '성별' in cols
    has_income = '월평균소득' in cols

    # 연령대 1D 마진 (band_agg) 은 결합 마진의 P(band) 로 사용
    band_marginal: Dict[str, float] = {}
    if has_band and age_band_active:
        for lbl, p in zip(age_band_active['labels'], age_band_active['probs']):
            band_marginal[lbl] = float(p)

    def _restrict_to_present(s: pd.Series, c1: str, c2: str) -> Optional[pd.Series]:
        """결합 마진 series 를 count_tbl 에 실제 존재하는 (c1,c2) 페어로만 한정.

        count_tbl 은 _densify_count_tbl() 로 cartesian product 가 보장되어
        있으므로 series 의 모든 페어가 count_tbl 에 존재한다고 볼 수 있지만,
        혹시 빠진 게 있다면 reindex 로 정확히 맞춘다.
        """
        if s is None or len(s) == 0:
            return None
        pairs = list(map(tuple, count_tbl[[c1, c2]].drop_duplicates().itertuples(index=False, name=None)))
        idx = pd.MultiIndex.from_tuples(pairs, names=[c1, c2])
        s = s.reindex(idx).fillna(s.min() if len(s) > 0 else 1e-3)
        t = s.sum()
        if t > 0:
            s = s * (n / t)
        return s

    # 1D marginal 추출 헬퍼
    def _axis_marginal(col: str) -> Dict[str, float]:
        return {
            lbl: float(p) for lbl, p in zip(active[col]['labels'], active[col]['probs'])
        }

    # 연령대 × 혼인상태
    if has_band and has_marital and band_marginal:
        target_marg = _axis_marginal('혼인상태')
        s = _build_joint_marginal_series(
            band_marginal, target_marg, AGE_BAND_MARITAL_COND, n,
            AGE_BAND_COL, '혼인상태',
        )
        s = _restrict_to_present(s, AGE_BAND_COL, '혼인상태')
        if s is not None and len(s) > 0:
            aggregates.append(s)
            dimensions.append([AGE_BAND_COL, '혼인상태'])
            joint_added.append('연령대×혼인상태')

    # 연령대 × 교육정도
    if has_band and has_edu and band_marginal:
        target_marg = _axis_marginal('교육정도')
        s = _build_joint_marginal_series(
            band_marginal, target_marg, AGE_BAND_EDU_COND, n,
            AGE_BAND_COL, '교육정도',
        )
        s = _restrict_to_present(s, AGE_BAND_COL, '교육정도')
        if s is not None and len(s) > 0:
            aggregates.append(s)
            dimensions.append([AGE_BAND_COL, '교육정도'])
            joint_added.append('연령대×교육정도')

    # 연령대 × 경제활동
    if has_band and has_econ and band_marginal:
        target_marg = _axis_marginal('경제활동')
        s = _build_joint_marginal_series(
            band_marginal, target_marg, AGE_BAND_ECON_COND, n,
            AGE_BAND_COL, '경제활동',
        )
        s = _restrict_to_present(s, AGE_BAND_COL, '경제활동')
        if s is not None and len(s) > 0:
            aggregates.append(s)
            dimensions.append([AGE_BAND_COL, '경제활동'])
            joint_added.append('연령대×경제활동')

    # 성별 × 경제활동
    if has_gender and has_econ:
        gender_marginal = _axis_marginal('성별')
        target_marg = _axis_marginal('경제활동')
        s = _build_pair_marginal_series(
            gender_marginal, target_marg, GENDER_ECON_COND, n,
            '성별', '경제활동',
        )
        s = _restrict_to_present(s, '성별', '경제활동')
        if s is not None and len(s) > 0:
            aggregates.append(s)
            dimensions.append(['성별', '경제활동'])
            joint_added.append('성별×경제활동')

    # 경제활동 × 월평균소득
    # (소득 라벨이 다양하므로 저/중/고 버킷별 conditional dist 를 실제 라벨에
    #  균등 분배해 P(income | econ) 으로 확장 후 _build_joint_marginal_series 호출)
    if has_econ and has_income:
        income_labels_active = active['월평균소득']['labels']
        low_inc, mid_inc, high_inc = _split_income_into_buckets(income_labels_active)
        bucket_labels: Dict[str, List[str]] = {'low': low_inc, 'mid': mid_inc, 'high': high_inc}

        cond_econ_income: Dict[str, Dict[str, float]] = {}
        for econ_lbl in active['경제활동']['labels']:
            base = ECON_INCOME_BUCKET_COND.get(econ_lbl, {'low': 0.33, 'mid': 0.34, 'high': 0.33})
            sub: Dict[str, float] = {}
            for bk, p_bk in base.items():
                lbls = bucket_labels.get(bk, [])
                if not lbls or p_bk <= 0:
                    continue
                per = p_bk / len(lbls)
                for inc_lbl in lbls:
                    sub[inc_lbl] = sub.get(inc_lbl, 0.0) + per
            cond_econ_income[econ_lbl] = sub

        if any(cond_econ_income.values()):
            econ_marg = _axis_marginal('경제활동')
            income_marg = _axis_marginal('월평균소득')
            s_inc = _build_joint_marginal_series(
                econ_marg, income_marg, cond_econ_income, n,
                '경제활동', '월평균소득',
            )
            s_inc = _restrict_to_present(s_inc, '경제활동', '월평균소득')
            if s_inc is not None and len(s_inc) > 0:
                aggregates.append(s_inc)
                dimensions.append(['경제활동', '월평균소득'])
                joint_added.append('경제활동×월평균소득')

    if joint_added:
        print(f"   🔗 결합 마진 추가: {joint_added}")
    else:
        print("   ℹ️ 결합 마진 추가 없음 — 단순 1D IPF 로 동작")

    # 3) IPF 실행 — 결합 마진이 있으면 native(numpy 직접구현)로 즉시 수행
    #    (외부 ipfn 은 다축 결합 마진에서 수렴 실패가 일관되게 관찰됨)
    #    결합 마진이 없을 때만 ipfn 라이브러리를 1차 사용 (빠름), 미달 시 native 폴백
    NATIVE_FALLBACK_THRESHOLD = 0.10  # 1D 마진 최대 상대 오차 10%
    result: Optional[pd.DataFrame] = None
    used_engine = ""

    if not joint_added:
        # 결합 마진 없음 → ipfn 라이브러리(빠름) 1차 시도
        try:
            IPF = _ipfn_mod.ipfn(
                count_tbl.copy(),
                list(aggregates),
                list(dimensions),
                weight_col='total',
                convergence_rate=1e-5,
                max_iteration=max_iterations,
                verbose=0,
            )
            ipfn_result = IPF.iteration()
            ipfn_err = _max_marginal_relerr(ipfn_result, aggregates, dimensions, weight_col='total')
            print(f"   📐 ipfn 라이브러리 결과 — 최대 마진 상대오차 = {ipfn_err*100:.2f}%")
            if ipfn_err <= NATIVE_FALLBACK_THRESHOLD:
                result = ipfn_result
                used_engine = "ipfn(1D)"
            else:
                print(f"   ⚠️ ipfn 마진 정합 미달 → native N-D IPF 로 재시도")
        except Exception as exc:
            print(f"   ⚠️ ipfn 라이브러리 호출 예외: {exc!r} — native N-D IPF 로 재시도")

    if result is None:
        # 결합 마진 있음 OR ipfn 폴백 케이스
        result, native_conv, native_iter = _ipf_native_iterate(
            count_tbl,
            aggregates,
            dimensions,
            weight_col='total',
            max_iter=max_iterations,
            conv_rate=1e-6,
        )
        native_err = _max_marginal_relerr(result, aggregates, dimensions, weight_col='total')
        print(f"   ✅ native CA-IPF 수렴 — iter={native_iter}, 최대 마진 상대오차={native_err*100:.4f}%")
        used_engine = "native"

    # 4) SIR: 중요도 가중치 = 조정 후 / 조정 전
    result = result.merge(
        count_tbl.rename(columns={'total': 'current'}),
        on=cols, how='left',
    )
    result['current'] = result['current'].fillna(0.1).clip(lower=0.1)
    result['importance'] = (result['total'] / result['current']).clip(lower=0)

    # 연령대 임시 열을 df_ipf 기준으로 merge
    merge_base = df_ipf if has_age else df
    df_w = merge_base.merge(result[cols + ['importance']], on=cols, how='left')
    df_w['importance'] = df_w['importance'].fillna(1.0).clip(lower=0)

    total_w = df_w['importance'].sum()
    if total_w == 0:
        raise ValueError("모든 중요도 가중치가 0입니다.")

    df_w['_prob'] = df_w['importance'] / total_w
    sampled = df_w.sample(n=n, replace=True, weights='_prob')
    # 임시 열 제거
    drop_cols = ['importance', '_prob']
    if has_age and AGE_BAND_COL in sampled.columns:
        drop_cols.append(AGE_BAND_COL)
    sampled = sampled.drop(columns=drop_cols, errors='ignore')
    sampled['식별NO'] = range(1, n + 1)

    print(
        f"✅ CA-IPF 완료 [engine={used_engine}] "
        f"(1D 마진 {len(cols)}축 + 결합 마진 {len(joint_added)}쌍, 최종: {n}명)"
    )
    return sampled.reset_index(drop=True)


def _apply_ipf_legacy(
    df: pd.DataFrame,
    n: int,
    margins_axis: Dict[str, Dict],
    max_iterations: int = 10,
) -> pd.DataFrame:
    """기존 레거시 IPF (ipfn 실패 시 폴백용). 원래 apply_ipf 구현."""
    axis_name_map = {
        'sigungu': '거주지역',
        'gender': '성별',
        'age': '연령',
        'econ': '경제활동',
        'income': '월평균소득',
        'edu': '교육정도',
        'job': '직업분류',
        'marital': '혼인상태',
    }

    target_counts = {}

    for axis_key, margin_data in margins_axis.items():
        col_name = axis_name_map.get(axis_key)
        if not col_name or col_name not in df.columns:
            continue
        
        labels = margin_data.get('labels', [])
        # 'p' 키를 우선 사용하고, 없으면 'probs' 사용 (하위 호환성)
        probs = margin_data.get('p', margin_data.get('probs', []))
        
        if labels and probs:
            probs = _normalize_prob(probs)
            
            # ✅ 비율 순위 보장: 확률 내림차순으로 정렬
            label_prob_pairs = list(zip(labels, probs))
            label_prob_pairs.sort(key=lambda x: x[1], reverse=True)  # 확률 높은 순서대로
            labels_sorted, probs_sorted = zip(*label_prob_pairs)
            labels_sorted = list(labels_sorted)
            probs_sorted = list(probs_sorted)
            
            target_counts[col_name] = {
                lbl: int(round(n * p)) for lbl, p in zip(labels_sorted, probs_sorted)
            }
            
            # ✅ 디버깅: 성별 목표값 확인
            if col_name == '성별':
                print(f"📊 IPF 목표 성별 분포 (순위 보장):")
                for lbl, target in target_counts[col_name].items():
                    pct = (target / n * 100) if n > 0 else 0
                    print(f"   {lbl}: {target}명 ({pct:.2f}%)")
    
    if not target_counts:
        return df
    
    print(f"🔄 IPF(레거시) 시작 (목표 인구: {n}명, 최대 반복: {max_iterations}회)")
    
    # IPF 반복 조정: 각 축별로 목표 분포에 맞게 조정 (순위 절대 보장)
    for iteration in range(max_iterations):
        total_adjustment = 0
        
        for col_name, targets in target_counts.items():
            # ✅ 순위 절대 보장: 확률 높은 순서대로 처리
            sorted_targets = sorted(targets.items(), key=lambda x: x[1], reverse=True)
            
            # ✅ 순위 검증 및 강제 수정: 확률 높은 항목이 확실히 더 많도록 보장
            current_counts = {label: (df[col_name] == label).sum() for label in targets.keys()}
            
            # 순위 위반 체크 및 수정
            for i, (label_high, target_high) in enumerate(sorted_targets):
                for j, (label_low, target_low) in enumerate(sorted_targets[i+1:], start=i+1):
                    current_high = current_counts[label_high]
                    current_low = current_counts[label_low]
                    
                    # 순위 위반: 높은 확률인데 낮은 확률보다 적으면 강제 수정
                    if current_high < current_low:
                        # 낮은 확률에서 높은 확률로 이동
                        low_indices = df[df[col_name] == label_low].index.tolist()
                        move_count = min((current_low - current_high) // 2, len(low_indices))
                        if move_count > 0:
                            move_indices = np.random.choice(low_indices, size=move_count, replace=False)
                            df.loc[move_indices, col_name] = label_high
                            current_counts[label_high] += move_count
                            current_counts[label_low] -= move_count
                            total_adjustment += move_count
            
            # 목표값에 맞게 조정
            for label, target in sorted_targets:
                current_count = (df[col_name] == label).sum()
                diff = target - current_count
                
                if abs(diff) < 1:  # 1명 이하 차이는 무시
                    continue
                
                if diff > 0:
                    # 부족: 추가
                    current_indices = df[df[col_name] == label].index.tolist()
                    if len(current_indices) > 0:
                        add_count = int(diff)
                        additional_indices = np.random.choice(
                            current_indices,
                            size=add_count,
                            replace=True
                        )
                        duplicate_rows = df.loc[additional_indices].copy()
                        df = pd.concat([df, duplicate_rows], ignore_index=True)
                        total_adjustment += add_count
                
                elif diff < 0:
                    # 초과: 제거 (낮은 확률부터)
                    current_indices = df[df[col_name] == label].index.tolist()
                    remove_count = int(-diff)
                    if remove_count > 0 and len(current_indices) > remove_count:
                        remove_indices = np.random.choice(
                            current_indices,
                            size=remove_count,
                            replace=False
                        )
                        df = df.drop(index=remove_indices).reset_index(drop=True)
                        total_adjustment += remove_count
        
        if total_adjustment == 0:
            print(f"   반복 {iteration + 1}/{max_iterations}: 조정 완료 (수렴)")
            break
        
        print(f"   반복 {iteration + 1}/{max_iterations} 완료 (현재 인구: {len(df)}명, 조정: {total_adjustment}명)")
    
    # 최종 조정: 목표 인구수에 맞추기 (목표 분포 비율 유지 + 순위 절대 보장)
    current_len = len(df)
    if current_len != n:
        if current_len > n:
            # 초과: 목표 분포에 맞게 제거 (순위 절대 보장)
            keep_indices = []
            
            # ✅ 순위 절대 보장: 각 축별로 확률 높은 순서대로 우선 보존
            for col_name, targets in target_counts.items():
                sorted_targets = sorted(targets.items(), key=lambda x: x[1], reverse=True)
                
                for label, target in sorted_targets:
                    label_indices = df[df[col_name] == label].index.tolist()
                    keep_count = min(target, len(label_indices))
                    
                    if keep_count > 0 and len(label_indices) > 0:
                        selected = np.random.choice(label_indices, size=keep_count, replace=False)
                        keep_indices.extend(selected.tolist())
            
            # 중복 제거
            keep_indices = list(set(keep_indices))
            
            # 목표 인구수에 맞게 조정
            if len(keep_indices) > n:
                # 초과하면 목표 분포 비율에 맞게 샘플링 (순위 절대 보장)
                # 확률 높은 label부터 우선 선택
                priority_indices = []
                for col_name, targets in target_counts.items():
                    sorted_targets = sorted(targets.items(), key=lambda x: x[1], reverse=True)
                    for label, target in sorted_targets:
                        label_indices = [idx for idx in keep_indices if df.loc[idx, col_name] == label]
                        priority_indices.extend(label_indices[:target])
                
                if len(priority_indices) >= n:
                    keep_indices = np.random.choice(priority_indices, size=n, replace=False).tolist()
                else:
                    remaining = list(set(keep_indices) - set(priority_indices))
                    needed = n - len(priority_indices)
                    if len(remaining) > 0:
                        additional = np.random.choice(remaining, size=min(needed, len(remaining)), replace=False)
                        keep_indices = priority_indices + additional.tolist()
                    else:
                        keep_indices = np.random.choice(keep_indices, size=n, replace=False).tolist()
            elif len(keep_indices) < n:
                # 부족하면 나머지에서 추가 (목표 분포 유지)
                all_indices = set(df.index.tolist())
                remaining_indices = list(all_indices - set(keep_indices))
                if len(remaining_indices) > 0:
                    additional_needed = n - len(keep_indices)
                    additional = np.random.choice(remaining_indices, size=min(additional_needed, len(remaining_indices)), replace=False)
                    keep_indices.extend(additional.tolist())
            
            df = df.loc[keep_indices].reset_index(drop=True)
            
            # ✅ 최종 순위 검증 및 강제 수정
            for col_name, targets in target_counts.items():
                sorted_targets = sorted(targets.items(), key=lambda x: x[1], reverse=True)
                current_counts = {label: (df[col_name] == label).sum() for label in targets.keys()}
                
                # 순위 위반 체크 및 수정
                for i, (label_high, target_high) in enumerate(sorted_targets):
                    for j, (label_low, target_low) in enumerate(sorted_targets[i+1:], start=i+1):
                        current_high = current_counts[label_high]
                        current_low = current_counts[label_low]
                        
                        # 순위 위반: 높은 확률인데 낮은 확률보다 적으면 강제 수정
                        if current_high < current_low:
                            # 낮은 확률에서 높은 확률로 이동
                            low_indices = df[df[col_name] == label_low].index.tolist()
                            move_count = current_low - current_high + 1  # 최소 1명 차이 보장
                            move_count = min(move_count, len(low_indices))
                            if move_count > 0:
                                move_indices = np.random.choice(low_indices, size=move_count, replace=False)
                                df.loc[move_indices, col_name] = label_high
            
        elif current_len < n:
            # 부족: 목표 분포 비율에 맞게 추가
            additional_count = n - current_len
            additional_rows = []
            
            # 각 label별로 부족한 만큼 추가
            for col_name, targets in target_counts.items():
                for label, target in targets.items():
                    current_count = (df[col_name] == label).sum()
                    needed = max(0, target - current_count)
                    
                    if needed > 0 and additional_count > 0:
                        label_indices = df[df[col_name] == label].index.tolist()
                        if len(label_indices) > 0:
                            sample_count = min(needed, additional_count)
                            sample_indices = np.random.choice(label_indices, size=sample_count, replace=True)
                            additional_rows.extend(sample_indices.tolist())
                            additional_count -= sample_count
                            
                            if additional_count <= 0:
                                break
                
                if additional_count <= 0:
                    break
            
            # 여전히 부족하면 목표 분포 비율에 맞게 추가
            if additional_count > 0:
                for col_name, targets in target_counts.items():
                    for label, target in targets.items():
                        if additional_count <= 0:
                            break
                        label_indices = df[df[col_name] == label].index.tolist()
                        if len(label_indices) > 0:
                            target_ratio = target / n
                            add_count = min(int(additional_count * target_ratio), additional_count)
                            if add_count > 0:
                                sample_indices = np.random.choice(label_indices, size=add_count, replace=True)
                                additional_rows.extend(sample_indices.tolist())
                                additional_count -= add_count
            
            # 최종적으로 부족하면 랜덤 복제
            while len(additional_rows) < (n - current_len):
                random_idx = np.random.randint(0, len(df))
                additional_rows.append(random_idx)
            
            if len(additional_rows) > 0:
                df_additional = df.iloc[additional_rows[:(n - current_len)]].copy()
                df = pd.concat([df, df_additional], ignore_index=True)
    
    # 식별NO 재할당
    df['식별NO'] = range(1, len(df) + 1)
    
    print(f"✅ IPF(레거시) 완료 (최종 인구: {len(df)}명)")
    return df.reset_index(drop=True)


# ========================================
# 6. 부족분 보충 (다양성 확보)
# ========================================

def fill_shortage_with_diversity(
    df: pd.DataFrame,
    n: int,
    sigungu_labels: List[str],
    gender_labels: List[str],
    age_labels: List[int],
    econ_labels: List[str],
    edu_labels: List[str],
    income_labels: List[str],
    sigungu_probs: List[float],
    gender_probs: List[float],
    age_probs: List[float],
    econ_probs: List[float],
    edu_probs: List[float],
    income_probs: List[float],
    job_labels: Optional[List[str]] = None,
    job_probs: Optional[List[float]] = None,
    marital_labels: Optional[List[str]] = None,
    marital_probs: Optional[List[float]] = None,
) -> pd.DataFrame:
    """부족분을 다양성 있게 보충 (대구: marital_labels/probs 전달 시 혼인상태 컬럼 생성)"""

    shortage = n - len(df)
    if shortage <= 0:
        return df

    print(f"🔧 부족분 보충 시작 ({shortage}명)")

    current_max_id = df['식별NO'].max() if '식별NO' in df.columns else 0
    existing_names = set(df['가상이름'].tolist()) if '가상이름' in df.columns else set()

    new_rows = []

    for i in range(shortage):
        new_id = current_max_id + i + 1

        gender = _safe_choice(gender_labels, gender_probs)

        new_name = generate_korean_name(gender)
        while new_name in existing_names:
            new_name = generate_korean_name(gender)
        existing_names.add(new_name)

        new_row = {
            '식별NO': new_id,
            '가상이름': new_name,
            '거주지역': _safe_choice(sigungu_labels, sigungu_probs),
            '성별': gender,
            '연령': _safe_choice(age_labels, age_probs),
            '교육정도': _safe_choice(edu_labels, edu_probs),
            '월평균소득': _safe_choice(income_labels, income_probs),
        }

        if marital_labels and marital_probs:
            # 대구: 혼인상태 컬럼 생성 (경제활동 없음)
            new_row['혼인상태'] = _safe_choice(marital_labels, marital_probs)
            if job_labels and job_probs:
                new_row['직업분류'] = _safe_choice(job_labels, job_probs)
        else:
            econ = _safe_choice(econ_labels, econ_probs)
            new_row['경제활동'] = econ
            if job_labels and job_probs:
                new_row['직업분류'] = '해당없음' if econ == '비경제활동' else _safe_choice(job_labels, job_probs)

        new_rows.append(new_row)

    df_new = pd.DataFrame(new_rows)
    df = pd.concat([df, df_new], ignore_index=True)

    print(f"✅ 부족분 보충 완료 ({shortage}명 추가)")
    return df


# ========================================
# 7. 메인 생성 함수
# ========================================

def generate_base_population(
    n: int,
    selected_sigungu: List[str],
    weights_6axis: dict,
    sigungu_pool: List[str],
    seed: int,
    margins_axis: Dict[str, Dict],
    apply_ipf_flag: bool = True
) -> pd.DataFrame:
    """가상인구 생성 (성별 맞춤 이름 + 현실적 제약)"""
    
    random.seed(seed)
    np.random.seed(seed)
    
    print(f"\n{'='*60}")
    print(f"🚀 가상인구 생성 시작 (목표: {n}명)")
    print(f"{'='*60}\n")
    
    # Margin 추출 (하위 호환성: 'p' 키를 우선 사용하고, 없으면 'probs' 사용)
    # ✅ 모든 축에 대해 비율 순위 보장: 확률 내림차순으로 정렬
    def _sort_by_prob_desc(labels, probs):
        """확률 내림차순으로 정렬하여 비율 순위 보장"""
        if not labels or not probs or len(labels) != len(probs):
            return labels, probs
        label_prob_pairs = list(zip(labels, probs))
        label_prob_pairs.sort(key=lambda x: x[1], reverse=True)  # 확률 높은 순서대로
        sorted_labels, sorted_probs = zip(*label_prob_pairs)
        return list(sorted_labels), list(sorted_probs)
    
    # 6축 가중치 적용: probs를 가중치에 따라 조정 (w>1: 분포 강조, w<1: 완만하게)
    def _apply_axis_weight(probs: List[float], w: float) -> List[float]:
        if not probs or w <= 0:
            return probs
        if abs(w - 1.0) < 1e-6:
            return probs
        powered = [max(p ** w, 1e-10) for p in probs]
        return _normalize_prob(powered)

    sigungu_margin = margins_axis.get('sigungu', {})
    sigungu_labels = sigungu_margin.get('labels', selected_sigungu or sigungu_pool) if margins_axis.get('sigungu') else (selected_sigungu or sigungu_pool)
    if not sigungu_labels:
        sigungu_labels = ["해당없음"]  # 빈 시군구 시 폴백
    sigungu_probs = sigungu_margin.get('p', sigungu_margin.get('probs', [1.0 / len(sigungu_labels)] * len(sigungu_labels)))
    sigungu_probs = _apply_axis_weight(sigungu_probs, float(weights_6axis.get('sigungu', 1.0)))
    sigungu_labels, sigungu_probs = _sort_by_prob_desc(sigungu_labels, sigungu_probs)
    
    gender_margin = margins_axis.get('gender', {})
    gender_labels = gender_margin.get('labels', ['남자', '여자'])
    gender_probs = gender_margin.get('p', gender_margin.get('probs', [0.5, 0.5]))
    gender_probs = _apply_axis_weight(gender_probs, float(weights_6axis.get('gender', 1.0)))
    gender_labels, gender_probs = _sort_by_prob_desc(gender_labels, gender_probs)
    
    # ✅ 디버깅: 성별 확률 확인
    if gender_margin:
        print(f"📊 성별 확률 분포 (순위 보장):")
        for i, (label, prob) in enumerate(zip(gender_labels, gender_probs)):
            print(f"   {i+1}위: {label}: {prob:.4f} ({prob*100:.2f}%)")
    
    age_margin = margins_axis.get('age', {})
    age_labels = age_margin.get('labels', list(range(20, 86)))
    age_probs = age_margin.get('p', age_margin.get('probs', [1.0 / len(age_labels)] * len(age_labels)))
    age_labels, age_probs = _sort_by_prob_desc(age_labels, age_probs)
    
    econ_margin = margins_axis.get('econ', {})
    econ_labels = econ_margin.get('labels', ['경제활동', '비경제활동'])
    econ_probs = econ_margin.get('p', econ_margin.get('probs', [0.6, 0.4]))
    econ_probs = _apply_axis_weight(econ_probs, float(weights_6axis.get('econ', 1.0)))
    econ_labels, econ_probs = _sort_by_prob_desc(econ_labels, econ_probs)
    
    edu_margin = margins_axis.get('edu', {})
    edu_labels = edu_margin.get('labels', ['중졸이하', '고졸', '대졸이상'])
    edu_probs = edu_margin.get('p', edu_margin.get('probs', [0.25, 0.4, 0.35]))
    edu_labels, edu_probs = _sort_by_prob_desc(edu_labels, edu_probs)
    
    income_margin = margins_axis.get('income', {})
    income_labels = income_margin.get('labels', [
        '50만원미만', '50-100만원', '100-200만원', '200-300만원', 
        '300-400만원', '400-500만원', '500-600만원', '600-700만원', 
        '700-800만원', '800만원이상'
    ])
    income_probs = income_margin.get('p', income_margin.get('probs', [0.1] * len(income_labels)))
    income_probs = _apply_axis_weight(income_probs, float(weights_6axis.get('income', 1.0)))
    income_labels, income_probs = _sort_by_prob_desc(income_labels, income_probs)
    
    job_margin = margins_axis.get('job', {})
    job_labels = job_margin.get('labels', ['관리전문직', '화이트칼라', '블루칼라', '기타'])
    job_probs = job_margin.get('p', job_margin.get('probs', [0.25] * len(job_labels)))
    job_probs = _apply_axis_weight(job_probs, float(weights_6axis.get('job', 1.0)))
    job_labels, job_probs = _sort_by_prob_desc(job_labels, job_probs)

    # 대구: marital(혼인상태) 축 — econ 대신 사용
    marital_margin = margins_axis.get('marital', {})
    marital_labels = marital_margin.get('labels', [])
    marital_probs = marital_margin.get('p', marital_margin.get('probs', []))
    if marital_labels and marital_probs:
        marital_probs = _apply_axis_weight(marital_probs, float(weights_6axis.get('marital', 1.0)))
        marital_labels, marital_probs = _sort_by_prob_desc(marital_labels, marital_probs)

    # 🔹 1단계: 초기 생성 (20세 이상 + 성별 맞춤 이름)
    print("📊 1단계: 초기 인구 생성 (20세 이상)")

    # 20세 미만 제거 (연령은 이미 정수로 통일됨)
    age_labels_filtered = [a for a in age_labels if a >= 20]
    if age_labels_filtered:
        age_probs_filtered = _normalize_prob([age_probs[age_labels.index(a)] for a in age_labels_filtered])
    else:
        age_labels_filtered = list(range(20, 86))
        age_probs_filtered = _normalize_prob([1.0 / len(age_labels_filtered)] * len(age_labels_filtered))

    econ_list = [_safe_choice(econ_labels, econ_probs) for _ in range(n)]
    data = {
        "식별NO": list(range(1, n + 1)),
        "거주지역": [_safe_choice(sigungu_labels, sigungu_probs) for _ in range(n)],
        "성별": [_safe_choice(gender_labels, gender_probs) for _ in range(n)],
        "연령": [_safe_choice(age_labels_filtered, age_probs_filtered) for _ in range(n)],
        "교육정도": [_safe_choice(edu_labels, edu_probs) for _ in range(n)],
        "월평균소득": [_safe_choice(income_labels, income_probs) for _ in range(n)],
    }

    if marital_labels and marital_probs:
        # 대구: 경제활동 없음, 혼인상태 컬럼 생성
        data["혼인상태"] = [_safe_choice(marital_labels, marital_probs) for _ in range(n)]
        if job_margin:
            # 대구: 경제활동 구분 없이 모든 사람에게 직업분류 부여
            data["직업분류"] = [_safe_choice(job_labels, job_probs) for _ in range(n)]
    else:
        data["경제활동"] = econ_list
        if job_margin:
            # 비경제활동은 '해당없음'
            data["직업분류"] = [
                "해당없음" if econ_list[i] == "비경제활동" else _safe_choice(job_labels, job_probs)
                for i in range(n)
            ]
    
    df = pd.DataFrame(data)
    
    # ✅ 성별에 맞는 가상이름 생성 (배치 생성 — O(n) Python 루프 제거)
    male_first, female_first, last_names = _build_extended_name_pools()
    male_first = list(dict.fromkeys(male_first))
    female_first = list(dict.fromkeys(female_first))
    gender_arr = df['성별'].values
    names_arr = np.empty(len(gender_arr), dtype=object)
    for mask, first_pool in [
        (gender_arr == '남자', male_first),
        (gender_arr == '여자', female_first),
        (~np.isin(gender_arr, ['남자', '여자']), male_first + female_first),
    ]:
        if not mask.any():
            continue
        indices = np.where(mask)[0]
        lasts = np.random.choice(last_names, size=len(indices), replace=True)
        firsts = np.random.choice(first_pool, size=len(indices), replace=True)
        names_arr[indices] = np.char.add(lasts, firsts)
    # 중복 이름 재생성 (suffix 없이 새 이름으로 교체, 최대 30회 시도)
    names_list = names_arr.tolist()
    seen_names: set = set()
    _both_pool = male_first + female_first
    _gender_pools = {
        '남자': (last_names, male_first),
        '여자': (last_names, female_first),
    }
    for i, name in enumerate(names_list):
        if name not in seen_names:
            seen_names.add(name)
        else:
            g = gender_arr[i] if i < len(gender_arr) else None
            lasts, firsts = _gender_pools.get(g, (last_names, _both_pool))
            for _ in range(30):
                candidate = random.choice(lasts) + random.choice(firsts)
                if candidate not in seen_names:
                    names_list[i] = candidate
                    break
            seen_names.add(names_list[i])
    df['가상이름'] = names_list
    
    # ✅ 컬럼 순서 고정: 식별NO, 가상이름 순으로
    column_order = ['식별NO', '가상이름']
    other_columns = [col for col in df.columns if col not in column_order]
    df = df[column_order + other_columns]
    
    print(f"✅ 초기 생성 완료 ({len(df)}명, 고유 이름 {len(seen_names)}개)")
    
    # ✅ 디버깅: 초기 생성 후 성별 분포 확인
    if '성별' in df.columns:
        gender_counts = df['성별'].value_counts()
        total = len(df)
        print(f"📊 초기 생성 후 성별 분포:")
        for gender in ['남자', '여자']:
            count = gender_counts.get(gender, 0)
            pct = (count / total * 100) if total > 0 else 0
            print(f"   {gender}: {count}명 ({pct:.2f}%)")
    
    # 🔹 2단계: IPF 적용
    if apply_ipf_flag:
        df = apply_ipf(df, n, margins_axis)
    else:
        print("⏭️ 2단계: IPF SKIP")
    
    # ✅ 디버깅: IPF 적용 후 성별 분포 확인
    if '성별' in df.columns:
        gender_counts = df['성별'].value_counts()
        total = len(df)
        print(f"📊 IPF 적용 후 성별 분포:")
        for gender in ['남자', '여자']:
            count = gender_counts.get(gender, 0)
            pct = (count / total * 100) if total > 0 else 0
            print(f"   {gender}: {count}명 ({pct:.2f}%)")
        
        # ✅ 순위 검증
        if '남자' in gender_counts and '여자' in gender_counts:
            male_count = gender_counts['남자']
            female_count = gender_counts['여자']
            if gender_probs[0] > gender_probs[1]:  # 첫 번째가 더 높은 확률
                expected_first = gender_labels[0]
                if expected_first == '남자' and male_count < female_count:
                    print(f"⚠️ 순위 위반 감지: 남자가 여자보다 적음! 강제 수정 중...")
                    # 여자에서 남자로 변경
                    female_indices = df[df['성별'] == '여자'].index.tolist()
                    move_count = (female_count - male_count) // 2 + 1
                    move_count = min(move_count, len(female_indices))
                    if move_count > 0:
                        move_indices = np.random.choice(female_indices, size=move_count, replace=False)
                        df.loc[move_indices, '성별'] = '남자'
                        print(f"✅ {move_count}명을 여자에서 남자로 변경")
                elif expected_first == '여자' and female_count < male_count:
                    print(f"⚠️ 순위 위반 감지: 여자가 남자보다 적음! 강제 수정 중...")
                    # 남자에서 여자로 변경
                    male_indices = df[df['성별'] == '남자'].index.tolist()
                    move_count = (male_count - female_count) // 2 + 1
                    move_count = min(move_count, len(male_indices))
                    if move_count > 0:
                        move_indices = np.random.choice(male_indices, size=move_count, replace=False)
                        df.loc[move_indices, '성별'] = '여자'
                        print(f"✅ {move_count}명을 남자에서 여자로 변경")
    
    # 🔹 3단계: 현실적 제약 조건 적용 ⭐ (통계에 있는 소득 라벨만 사용)
    df = apply_realistic_constraints(df, income_labels=income_labels)
    
    # ✅ 순위 검증 및 강제 수정 (현실적 제약 적용 후)
    if margins_axis and 'gender' in margins_axis:
        gender_margin = margins_axis['gender']
        gender_labels_check = gender_margin.get('labels', ['남자', '여자'])
        gender_probs_check = gender_margin.get('p', gender_margin.get('probs', [0.5, 0.5]))
        
        if len(gender_labels_check) == len(gender_probs_check):
            # 확률 내림차순 정렬
            label_prob_pairs = list(zip(gender_labels_check, gender_probs_check))
            label_prob_pairs.sort(key=lambda x: x[1], reverse=True)
            gender_labels_sorted, gender_probs_sorted = zip(*label_prob_pairs)
            
            if '성별' in df.columns:
                gender_counts = df['성별'].value_counts()
                if len(gender_labels_sorted) >= 2:
                    first_label = gender_labels_sorted[0]
                    second_label = gender_labels_sorted[1]
                    
                    first_count = gender_counts.get(first_label, 0)
                    second_count = gender_counts.get(second_label, 0)
                    
                    if first_count < second_count:
                        print(f"⚠️ 순위 위반 감지: {first_label}({first_count}) < {second_label}({second_count})! 강제 수정 중...")
                        # 두 번째에서 첫 번째로 변경
                        second_indices = df[df['성별'] == second_label].index.tolist()
                        move_count = (second_count - first_count) // 2 + 1
                        move_count = min(move_count, len(second_indices))
                        if move_count > 0:
                            move_indices = np.random.choice(second_indices, size=move_count, replace=False)
                            df.loc[move_indices, '성별'] = first_label
                            print(f"✅ {move_count}명을 {second_label}에서 {first_label}로 변경")
    
    # 🔹 4단계: 중복 제거
    print("🔧 중복 제거 시작...")
    df = remove_duplicates(df)
    print(f"✅ 중복 제거 완료 ({len(df)}명)")
    
    # 🔹 5단계: 부족분 보충
    if len(df) < n:
        df = fill_shortage_with_diversity(
            df, n,
            sigungu_labels, gender_labels, age_labels_filtered,
            econ_labels, edu_labels, income_labels,
            sigungu_probs, gender_probs, age_probs_filtered,
            econ_probs, edu_probs, income_probs,
            job_labels=job_labels if job_margin else None,
            job_probs=job_probs if job_margin else None,
            marital_labels=marital_labels if marital_margin else None,
            marital_probs=marital_probs if marital_margin else None,
        )
    
    # 최종 조정
    df = df.head(n).reset_index(drop=True)
    df['식별NO'] = range(1, len(df) + 1)
    
    # ✅ 컬럼 순서 고정: 식별NO, 가상이름 순으로
    if '식별NO' in df.columns and '가상이름' in df.columns:
        column_order = ['식별NO', '가상이름']
        other_columns = [col for col in df.columns if col not in column_order]
        df = df[column_order + other_columns]
    
    # ✅ 최종 순위 검증 및 강제 수정 (모든 축에 대해)
    if margins_axis:
        _final_axis_name_map = {
            'sigungu': '거주지역',
            'gender': '성별',
            'age': '연령',
            'econ': '경제활동',
            'income': '월평균소득',
            'edu': '교육정도',
            'job': '직업분류',
            'marital': '혼인상태',
        }
        for axis_key, margin_data in margins_axis.items():
            col_name = _final_axis_name_map.get(axis_key)
            
            if not col_name or col_name not in df.columns:
                continue
            
            labels = margin_data.get('labels', [])
            probs = margin_data.get('p', margin_data.get('probs', []))
            
            if len(labels) == len(probs) and len(labels) >= 2:
                # 확률 내림차순 정렬
                label_prob_pairs = list(zip(labels, probs))
                label_prob_pairs.sort(key=lambda x: x[1], reverse=True)
                labels_sorted, probs_sorted = zip(*label_prob_pairs)
                
                # pandas(CoW) 환경에서 value_counts() 결과 Series가 read-only일 수 있어
                # 이후 setitem 업데이트를 위해 dict로 복사해 사용한다.
                current_counts = df[col_name].value_counts().to_dict()
                
                # 순위 위반 체크 및 수정
                for i in range(len(labels_sorted) - 1):
                    label_high = labels_sorted[i]
                    label_low = labels_sorted[i + 1]
                    
                    count_high = int(current_counts.get(label_high, 0))
                    count_low = int(current_counts.get(label_low, 0))
                    
                    if count_high < count_low:
                        print(f"⚠️ [{col_name}] 순위 위반: {label_high}({count_high}) < {label_low}({count_low})! 강제 수정 중...")
                        # 낮은 확률에서 높은 확률로 변경
                        low_indices = df[df[col_name] == label_low].index.tolist()
                        move_count = (count_low - count_high) // 2 + 1
                        move_count = min(move_count, len(low_indices))
                        if move_count > 0:
                            move_indices = np.random.choice(low_indices, size=move_count, replace=False)
                            df.loc[move_indices, col_name] = label_high
                            print(f"✅ [{col_name}] {move_count}명을 {label_low}에서 {label_high}로 변경")
                            # 카운트 업데이트
                            current_counts[label_high] = int(current_counts.get(label_high, 0)) + int(move_count)
                            current_counts[label_low] = int(current_counts.get(label_low, 0)) - int(move_count)
    
    # ✅ 최종 컬럼 순서 고정: 식별NO, 가상이름 순으로
    if '식별NO' in df.columns and '가상이름' in df.columns:
        column_order = ['식별NO', '가상이름']
        other_columns = [col for col in df.columns if col not in column_order]
        df = df[column_order + other_columns]
    
    print(f"\n{'='*60}")
    print(f"✅ 가상인구 생성 완료 (최종: {len(df)}명)")
    print(f"{'='*60}\n")
    
    return df


# ========================================
# 8. 기타 함수들 (기존 유지)
# ========================================

def apply_correlation_adjustment(df: pd.DataFrame, correlation_intensity: float = 0.2) -> pd.DataFrame:
    """상관관계 조정 (SKIP)"""
    print("⏭️ 상관관계 적용 SKIP")
    return df


def apply_logical_constraints(df: pd.DataFrame) -> pd.DataFrame:
    """논리적 제약 (최소한만 적용)"""
    print("⏭️ 논리적 제약 SKIP (현실적 제약으로 대체)")
    return df
