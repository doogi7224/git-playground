#!/usr/bin/env python3
"""화면에 나오는 한국어 문자열을 모아 locale/strings.csv 를 만든다.

한국어 원문을 그대로 번역 키로 쓴다. 그래서 .tres 는 계속 한국어로 읽히고,
번역이 없는 항목은 자동으로 한국어가 나온다 (Godot 의 tr() 기본 동작).

  python3 tools/extract_strings.py            # 새 문자열을 CSV 에 추가
  python3 tools/extract_strings.py --check    # 빠진 번역이 있으면 종료 코드 1
"""
from __future__ import annotations
import csv, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "locale" / "strings.csv"

# 화면에 나오는 것만 모은다. 경고/어서션/디버그는 번역하지 않는다.
GD_DIRS = ["ui"]
TRES_KEYS = ("display_name", "title", "description")

HANGUL = re.compile(r"[가-힣]")
# tr("...") 로 감싼 것과 아직 안 감싼 문자열 리터럴을 모두 잡는다.
GD_STRING = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"')
# 번역 대상이 아닌 것들
SKIP_PREFIX = ("res://", "user://")


def gd_strings() -> set[str]:
    out: set[str] = set()
    for d in GD_DIRS:
        for path in sorted((ROOT / d).rglob("*.gd")):
            for line in path.read_text(encoding="utf-8").splitlines():
                stripped = line.lstrip()
                if stripped.startswith("#") or stripped.startswith("##"):
                    continue
                for m in GD_STRING.finditer(line):
                    s = m.group(1)
                    if HANGUL.search(s) and not s.startswith(SKIP_PREFIX):
                        out.add(s)
    return out


def tres_strings() -> set[str]:
    out: set[str] = set()
    for path in sorted((ROOT / "data").rglob("*.tres")):
        text = path.read_text(encoding="utf-8")
        for key in TRES_KEYS:
            for m in re.finditer(r'^%s = "((?:[^"\\]|\\.)*)"' % key, text, re.M):
                s = m.group(1)
                if HANGUL.search(s):
                    out.add(s)
    return out


def load_csv() -> dict[str, dict[str, str]]:
    if not CSV_PATH.exists():
        return {}
    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        return {row["keys"]: row for row in csv.DictReader(f)}


def save_csv(rows: dict[str, dict[str, str]]) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["keys", "ko", "en"])
        w.writeheader()
        for key in sorted(rows):
            w.writerow(rows[key])


def main() -> int:
    check = "--check" in sys.argv
    found = gd_strings() | tres_strings()
    rows = load_csv()

    added = 0
    for s in found:
        if s not in rows:
            # 줄바꿈은 CSV 에서 \n 로 쓴다. Godot 이 그대로 읽는다.
            rows[s] = {"keys": s, "ko": s, "en": ""}
            added += 1

    stale = [k for k in rows if k not in found]
    missing = sorted(k for k in rows if k in found and not rows[k]["en"].strip())

    if check:
        ok = True
        if added:
            print("CSV 에 없는 문자열 %d개:" % added, file=sys.stderr)
            for s in sorted(found - set(load_csv())):
                print("  %s" % s, file=sys.stderr)
            ok = False
        if missing:
            print("영어 번역이 빈 항목 %d개:" % len(missing), file=sys.stderr)
            for s in missing[:20]:
                print("  %s" % s, file=sys.stderr)
            ok = False
        if ok:
            print("번역 %d개, 빠진 것 없음." % len(found))
        return 0 if ok else 1

    save_csv(rows)
    print("화면 문자열 %d개 (새로 추가 %d개, 영어 미번역 %d개)"
          % (len(found), added, len(missing)))
    if stale:
        print("더 이상 코드에 없는 항목 %d개 (지우지 않고 둔다):" % len(stale))
        for s in stale[:10]:
            print("  %s" % s)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
