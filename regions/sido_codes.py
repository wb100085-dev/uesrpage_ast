"""시도코드 상수 및 판별 헬퍼 (`regions` 패키지 내 단독 모듈 — 순환 import 방지)."""

from __future__ import annotations

SIDO_SEOUL = "11"
SIDO_DAEGU = "22"
SIDO_GYEONGBUK = "37"


def is_seoul(sido_code: str | None) -> bool:
    return str(sido_code or "").strip() == SIDO_SEOUL


def is_daegu(sido_code: str | None) -> bool:
    return str(sido_code or "").strip() == SIDO_DAEGU


def is_gyeongbuk(sido_code: str | None) -> bool:
    return str(sido_code or "").strip() == SIDO_GYEONGBUK


__all__ = [
    "SIDO_SEOUL",
    "SIDO_DAEGU",
    "SIDO_GYEONGBUK",
    "is_seoul",
    "is_daegu",
    "is_gyeongbuk",
]
