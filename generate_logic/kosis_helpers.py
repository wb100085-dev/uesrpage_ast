"""
KOSIS API 캐시·요청·응답 파싱 및 확률 분포 변환.
"""
from __future__ import annotations

import json
import os
import re
import time
import random
from datetime import datetime
from typing import Tuple

import streamlit as st
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from core.constants import CACHE_TTL_SECONDS


# KOSIS 타임아웃·재시도
_KOSIS_TIMEOUT = int(os.environ.get("KOSIS_TIMEOUT", "60"))
_KOSIS_RETRY = int(os.environ.get("KOSIS_RETRY_COUNT", "3"))
_KOSIS_BACKOFF = float(os.environ.get("KOSIS_RETRY_BACKOFF", "2.0"))

_KOSIS_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://kosis.kr/",
    "Origin": "https://kosis.kr",
    "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}


def _build_kosis_session() -> requests.Session:
    """
    KOSIS 요청용 Session.
    - 연결 끊김(Connection reset)·일시 장애(429/5xx)에서 자동 재시도
    - Cloud 환경의 keep-alive 이슈 완화를 위해 Connection: close 지정
    """
    session = requests.Session()
    session.headers.update(_KOSIS_HEADERS)
    session.headers.update({"Connection": "close"})
    retry = Retry(
        total=max(1, _KOSIS_RETRY),
        connect=max(1, _KOSIS_RETRY),
        read=max(1, _KOSIS_RETRY),
        status=max(1, _KOSIS_RETRY),
        allowed_methods=frozenset(["GET"]),
        status_forcelist=(429, 500, 502, 503, 504),
        backoff_factor=max(0.1, float(_KOSIS_BACKOFF) / 3.0),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=8)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


@st.cache_data(ttl=CACHE_TTL_SECONDS, max_entries=2)
def _find_first_nonempty_list(obj, depth: int = 0, max_depth: int = 5) -> list:
    """dict/list 중첩에서 첫 번째 비지 않은 list를 찾음. KOSIS 응답 형식 다양성 대응."""
    if depth > max_depth:
        return []
    if isinstance(obj, list):
        return obj if len(obj) > 0 else []
    if isinstance(obj, dict):
        for k in ("data", "RESULT", "Result", "Grid", "items", "item", "row", "rows", "list", "result", "response", "json"):
            v = obj.get(k)
            found = _find_first_nonempty_list(v, depth + 1, max_depth)
            if found:
                return found
        for v in obj.values():
            found = _find_first_nonempty_list(v, depth + 1, max_depth)
            if found:
                return found
    return []


def fetch_kosis_raw_structure(url: str) -> dict:
    """캐시 없이 1회 요청해 API 원본 응답 구조만 반환 (edu 빈값 진단용)."""
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    try:
        with _build_kosis_session() as session:
            resp = session.get(url, timeout=min(30, _KOSIS_TIMEOUT), verify=False)
            resp.raise_for_status()
            raw = resp.json()
    except Exception as e:
        return {"error": str(e), "type": "exception"}
    if isinstance(raw, list):
        return {"type": "list", "len": len(raw), "note": "빈 배열이면 시점/파라미터(newEstPrdCnt 등) 확인"}
    if isinstance(raw, dict):
        top = list(raw.keys())[:20]
        out = {"type": "dict", "top_keys": top}
        if raw.get("err"):
            out["err"] = raw.get("err")
        found = _find_first_nonempty_list(raw)
        if found:
            out["found_list_len"] = len(found)
            if found and isinstance(found[0], dict):
                out["first_row_keys"] = list(found[0].keys())[:15]
        else:
            out["found_list_len"] = 0
            out["note"] = "중첩 구조에서 비지 않은 list 없음"
        return out
    return {"type": type(raw).__name__, "value": str(raw)[:200]}


def _try_local_json_fallback(url: str) -> list:
    """KOSIS API가 빈 배열·접속 불가 반환 시 가상인구DB/통계목록 폴더에서 TBL_ID 매칭 JSON으로 폴백.

    URL에서 tblId 파라미터를 추출해 가상인구DB/통계목록/** 아래 JSON 파일들을 순회하며
    첫 번째 레코드의 TBL_ID가 일치하는 파일을 반환한다.
    """
    import os
    tbl_match = re.search(r"[?&]tblId=([^&\s]+)", url)
    if not tbl_match:
        return []
    tbl_id = tbl_match.group(1).strip()
    if not tbl_id:
        return []

    here = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.normpath(os.path.join(here, "..", "가상인구DB", "통계목록"))
    if not os.path.isdir(base_dir):
        return []

    for root, _, files in os.walk(base_dir):
        for fname in sorted(files):  # 재현성을 위해 정렬
            if not fname.endswith(".json"):
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list) and data and isinstance(data[0], dict):
                    if data[0].get("TBL_ID") == tbl_id:
                        return data
            except Exception:
                continue
    return []


def get_cached_kosis_json(url: str) -> list:
    """KOSIS API JSON 결과를 Supabase에 캐싱. kosis.kr 접속 불가·빈 응답 시 로컬 JSON → Supabase 만료 캐시 순으로 폴백."""
    import hashlib
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    url_hash = hashlib.sha256(url.encode()).hexdigest()

    # 1단계: Supabase 캐시 확인 (TTL 이내)
    try:
        from core.db import kosis_cache_get
        cached_str = kosis_cache_get(url_hash, ignore_ttl=False)
        if cached_str:
            try:
                cached_data = json.loads(cached_str)
                if isinstance(cached_data, list) and len(cached_data) > 0:
                    return cached_data
            except Exception:
                pass
    except Exception:
        pass

    last_error = None
    for attempt in range(max(1, _KOSIS_RETRY)):
        try:
            with _build_kosis_session() as session:
                resp = session.get(url, timeout=_KOSIS_TIMEOUT, verify=False)
                resp.raise_for_status()
                data = resp.json()
            if not isinstance(data, list):
                if isinstance(data, dict) and data.get("err") == "31":
                    fallback_url = re.sub(r"newEstPrdCnt=\d+", "newEstPrdCnt=1", url)
                    if fallback_url != url:
                        try:
                            with _build_kosis_session() as session:
                                resp2 = session.get(fallback_url, timeout=_KOSIS_TIMEOUT, verify=False)
                                resp2.raise_for_status()
                                data2 = resp2.json()
                            if isinstance(data2, list):
                                return data2
                            if isinstance(data2, dict) and not data2.get("err"):
                                data2 = _find_first_nonempty_list(data2) or data2.get("data", []) or []
                                if isinstance(data2, list):
                                    return data2
                        except Exception:
                            pass
                    # 로컬 파일 폴백 (err=31 후 API도 실패)
                    local_data = _try_local_json_fallback(url)
                    if local_data:
                        try:
                            from core.db import kosis_cache_set
                            kosis_cache_set(url_hash, url, json.dumps(local_data, ensure_ascii=False))
                        except Exception:
                            pass
                        return local_data
                    return []
                if isinstance(data, dict) and data.get("err"):
                    # err=30 등 API 오류 코드 → 로컬 JSON 파일 폴백
                    local_data = _try_local_json_fallback(url)
                    if local_data:
                        try:
                            from core.db import kosis_cache_set
                            kosis_cache_set(url_hash, url, json.dumps(local_data, ensure_ascii=False))
                        except Exception:
                            pass
                        return local_data
                    return []
                if isinstance(data, dict):
                    _struct = {"top_keys": list(data.keys())}
                    for _kk in ("data", "RESULT", "Result", "Grid", "items"):
                        vv = data.get(_kk)
                        if vv is not None:
                            _struct[_kk] = f"{type(vv).__name__}(len={len(vv)})" if isinstance(vv, (list, dict)) else type(vv).__name__
                            if isinstance(vv, dict):
                                _struct[f"{_kk}_keys"] = list(vv.keys())[:20]
                    found = _find_first_nonempty_list(data)
                    if found:
                        data = found
                    else:
                        out = data.get("data")
                        if isinstance(out, list) and len(out) > 0:
                            data = out
                        else:
                            out = data.get("RESULT") or data.get("Result") or data.get("Grid") or data.get("items")
                            if isinstance(out, dict):
                                out = out.get("data") or out.get("Grid") or out.get("items") or out.get("row") or []
                            data = out if isinstance(out, list) else []
                        if not (isinstance(data, list) and len(data) > 0):
                            try:
                                st.session_state["_kosis_last_empty_structure"] = _struct
                            except Exception:
                                pass
            if isinstance(data, list):
                # 2단계 성공: Supabase에 저장 (비어있지 않은 경우만)
                if len(data) > 0:
                    try:
                        from core.db import kosis_cache_set
                        kosis_cache_set(url_hash, url, json.dumps(data, ensure_ascii=False))
                    except Exception:
                        pass
                    return data
                # API 빈 배열 → 로컬 JSON 폴백 (가상인구DB/통계목록/)
                local_data = _try_local_json_fallback(url)
                if local_data:
                    try:
                        from core.db import kosis_cache_set
                        kosis_cache_set(url_hash, url, json.dumps(local_data, ensure_ascii=False))
                    except Exception:
                        pass
                    return local_data
                # 로컬에도 없으면 Supabase 만료 캐시라도 사용
                try:
                    from core.db import kosis_cache_get as _cg
                    stale_str = _cg(url_hash, ignore_ttl=True)
                    if stale_str:
                        stale_data = json.loads(stale_str)
                        if isinstance(stale_data, list) and len(stale_data) > 0:
                            return stale_data
                except Exception:
                    pass
                return []
            return []
        except (requests.exceptions.Timeout, requests.exceptions.ConnectTimeout, requests.exceptions.RequestException, ValueError) as e:
            last_error = e
            # SSL/intermediate proxy 환경에서 verify=False가 불안정할 수 있어 verify=True로 1회 보강
            if attempt < _KOSIS_RETRY - 1:
                try:
                    with _build_kosis_session() as session:
                        resp3 = session.get(url, timeout=_KOSIS_TIMEOUT, verify=True)
                        resp3.raise_for_status()
                        data3 = resp3.json()
                    if isinstance(data3, dict):
                        data3 = _find_first_nonempty_list(data3) or data3.get("data", []) or []
                    if isinstance(data3, list):
                        if len(data3) > 0:
                            try:
                                from core.db import kosis_cache_set
                                kosis_cache_set(url_hash, url, json.dumps(data3, ensure_ascii=False))
                            except Exception:
                                pass
                        return data3
                except Exception:
                    pass
            if attempt < _KOSIS_RETRY - 1:
                delay = (_KOSIS_BACKOFF ** attempt) + random.uniform(0.2, 1.0)
                time.sleep(delay)

    # 3단계: kosis.kr 모두 실패 → Supabase 만료 캐시라도 폴백
    try:
        from core.db import kosis_cache_get
        stale_str = kosis_cache_get(url_hash, ignore_ttl=True)
        if stale_str:
            stale_data = json.loads(stale_str)
            if isinstance(stale_data, list) and len(stale_data) > 0:
                try:
                    st.warning("⚠️ kosis.kr 접속 불가 — Supabase 캐시 데이터를 사용합니다. (결과가 최신이 아닐 수 있습니다)")
                except Exception:
                    pass
                return stale_data
    except Exception:
        pass

    if last_error is not None:
        raise last_error
    raise RuntimeError("KOSIS 데이터 가져오기 실패 (재시도 소진)")


@st.cache_data(ttl=CACHE_TTL_SECONDS, max_entries=5)
def convert_kosis_to_distribution_cached(kosis_data_json: str, axis_key: str, sido_code: str = "") -> Tuple[list, list]:
    """KOSIS 데이터 변환 결과를 캐시. 동일 (데이터, 축, 시도)이면 재계산 생략. 지역별 로직 분리(서울 11 vs 그 외)."""
    kosis_data = json.loads(kosis_data_json) if kosis_data_json else []
    return convert_kosis_to_distribution_impl(kosis_data, axis_key, sido_code=sido_code)


def _edu_fallback_parse_any_columns(kosis_data: list) -> Tuple[list, list]:
    """교육(edu) 전용: 컬럼명·행 형식 무관. dict/list 행 모두 처리, 키워드 없으면 행 순서로 중/고/대 배정."""
    edu_low = ["초졸", "무학", "초등", "중졸", "초등학교", "중학교", "미취학", "중졸이하"]
    edu_mid = ["고졸", "고등", "고등학교"]
    edu_high = ["대학", "대졸", "전문대", "석사", "박사", "대학교", "대학원", "대졸이상"]
    skip_vals = ("계", "전체", "소계", "합계", "Total", "-", "")

    rows = []
    if kosis_data and isinstance(kosis_data[0], (list, tuple)):
        header = kosis_data[0]
        if header and isinstance(header[0], str) and not header[0].replace(".", "").isdigit():
            keys = [str(h).strip() or f"C{i}" for i, h in enumerate(header)]
            for r in kosis_data[1:]:
                if isinstance(r, (list, tuple)) and len(r) >= 1:
                    rows.append(dict(zip(keys, r)))
        else:
            for r in kosis_data:
                if isinstance(r, (list, tuple)) and len(r) >= 2:
                    rows.append(dict(zip([f"C{i}" for i in range(len(r))], r)))
    else:
        rows = [r for r in kosis_data if isinstance(r, dict)]

    edu_map = {"중졸이하": 0.0, "고졸": 0.0, "대졸이상": 0.0}
    fallback_rows_with_numbers = []

    for row in rows:
        label_candidates = []
        num_candidates = []
        for k, v in (row.items() if isinstance(row, dict) else enumerate(row)):
            if v is None:
                continue
            vs = str(v).strip()
            if not vs or vs in skip_vals:
                continue
            n = None
            try:
                n = float(vs.replace(",", ""))
            except (ValueError, TypeError):
                m = re.search(r"[\d,]+(?:\.\d+)?", vs)
                if m:
                    try:
                        n = float(m.group().replace(",", ""))
                    except (ValueError, TypeError):
                        pass
            if n is not None and 0 <= n <= 1e9:
                num_candidates.append(n)
            if n is None:
                if len(vs) < 2 or vs.isdigit() or (len(vs) >= 6 and vs[:4].isdigit()):
                    continue
                if any(x in vs for x in edu_low + edu_mid + edu_high + ["학교", "졸업", "재학"]):
                    label_candidates.append(vs)
                elif "학교" in vs or "졸업" in vs:
                    label_candidates.append(vs)
                elif vs in ("1", "2", "3") or vs.lower() in ("low", "mid", "high", "e1", "e2", "e3"):
                    label_candidates.append(vs)

        val_float = 0
        for n in num_candidates:
            if 1 <= n <= 1e8 and not (199000 <= n <= 210000):
                val_float = n
                break
        if val_float == 0 and num_candidates:
            val_float = num_candidates[0]

        if val_float <= 0:
            continue

        label_text = " ".join(label_candidates)
        if label_candidates:
            if any(x in label_text for x in edu_low):
                edu_map["중졸이하"] += val_float
            elif any(x in label_text for x in edu_mid) or "고등" in label_text:
                edu_map["고졸"] += val_float
            elif any(x in label_text for x in edu_high) or "대학" in label_text or "대학교" in label_text:
                edu_map["대졸이상"] += val_float
            elif "1" in label_text or "low" in label_text.lower() or "e1" in label_text.lower():
                edu_map["중졸이하"] += val_float
            elif "2" in label_text or "mid" in label_text.lower() or "e2" in label_text.lower():
                edu_map["고졸"] += val_float
            elif "3" in label_text or "high" in label_text.lower() or "e3" in label_text.lower():
                edu_map["대졸이상"] += val_float
            else:
                edu_map["중졸이하"] += val_float
        else:
            fallback_rows_with_numbers.append(val_float)

    if sum(edu_map.values()) == 0 and fallback_rows_with_numbers:
        n = len(fallback_rows_with_numbers)
        if n >= 3:
            step = max(1, n // 3)
            edu_map["중졸이하"] = sum(fallback_rows_with_numbers[:step])
            edu_map["고졸"] = sum(fallback_rows_with_numbers[step:step * 2])
            edu_map["대졸이상"] = sum(fallback_rows_with_numbers[step * 2:])
        else:
            for i, v in enumerate(fallback_rows_with_numbers):
                if i % 3 == 0:
                    edu_map["중졸이하"] += v
                elif i % 3 == 1:
                    edu_map["고졸"] += v
                else:
                    edu_map["대졸이상"] += v

    labels_out = []
    values_out = []
    for lev in ["중졸이하", "고졸", "대졸이상"]:
        if edu_map[lev] > 0:
            labels_out.append(lev)
            values_out.append(edu_map[lev])
    return labels_out, values_out


def convert_kosis_to_distribution_impl(kosis_data, axis_key: str, sido_code: str = "") -> Tuple[list, list]:
    """KOSIS 데이터를 확률 분포로 변환. 지역별 로직은 regions 패키지에서 시도코드별로 분리."""
    if not kosis_data:
        return [], []
    for _ in range(6):
        if not isinstance(kosis_data, dict):
            break
        for key in ("data", "RESULT", "Result", "Grid", "json", "items", "item", "body", "response", "results"):
            v = kosis_data.get(key)
            if isinstance(v, list):
                kosis_data = v
                break
            if isinstance(v, dict):
                kosis_data = v
                break
        else:
            kosis_data = [kosis_data]
            break
    if not isinstance(kosis_data, list):
        return [], []
    from regions import get_region_handler, get_edu_fallback_handler
    handler = get_region_handler(sido_code)
    labels, values = handler.convert(kosis_data, axis_key)
    if not (labels and values) and axis_key == "edu":
        fallback = get_edu_fallback_handler(sido_code)
        if fallback:
            labels, values = fallback.convert(kosis_data, axis_key)
    if not (labels and values) and axis_key == "edu" and isinstance(kosis_data, list) and len(kosis_data) > 0:
        labels, values = _edu_fallback_parse_any_columns(kosis_data)
        if not (labels and values):
            first = kosis_data[0]
            if isinstance(first, dict):
                sample = f"키: {list(first.keys())[:15]}, 값샘플: {dict(list(first.items())[:6])}"
            else:
                sample = f"타입: {type(first).__name__}, 값: {str(first)[:150]}"
            st.session_state["_edu_fallback_fail_sample"] = f"범용 파서도 실패 — 첫 행: {sample}"
    if labels and values:
        total = sum(values)
        probabilities = [v / total for v in values] if total > 0 else [1.0 / len(values)] * len(values)
        return labels, probabilities
    return [], []


def convert_kosis_to_distribution(kosis_data, axis_key: str, sido_code: str = ""):
    """
    KOSIS 데이터를 확률 분포로 변환 (labels, probabilities)
    axis_key: "sigungu", "gender", "age", "econ", "income", "edu", "job"
    sido_code: 지역별 로직 분리용 (11=서울 확장 로직, 그 외=경상북도 등 기존 로직)
    """
    try:
        labels, probabilities = convert_kosis_to_distribution_impl(kosis_data, axis_key, sido_code=sido_code)
        log_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "stage": f"convert_kosis_to_distribution({axis_key})",
            "axis_key": axis_key,
            "status": "success" if labels else "error",
            "label_count": len(labels),
        }
        if not labels:
            log_entry["error"] = "No valid labels/values extracted"
        if "work_logs" not in st.session_state:
            st.session_state.work_logs = []
        st.session_state.work_logs.append(log_entry)
        return labels, probabilities
    except Exception as e:
        log_entry = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "stage": f"convert_kosis_to_distribution({axis_key})", "axis_key": axis_key, "status": "exception", "error": str(e)}
        if "work_logs" not in st.session_state:
            st.session_state.work_logs = []
        st.session_state.work_logs.append(log_entry)
        return [], []
