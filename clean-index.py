#!/usr/bin/env python3
"""
Idempotent helper that strips the stray second-document block from
PREY-WEBSITE/public/index.html if it reappears.

The real page is the first <!DOCTYPE html> ... </html> in the file. Anything
after that first closing tag is treated as spurious and removed here.
"""
from pathlib import Path

PUBLIC = Path("public")
INDEX = PUBLIC / "index.html"

MARKERS = ["<!DOCTYPE html>", "</html>"]


def clean():
    txt = INDEX.read_text(encoding="utf-8")
    first_doctype = txt.find(MARKERS[0])
    first_close = txt.find(MARKERS[1], first_doctype)
    if first_close == -1:
        print("Nothing to clean: could not locate first </html>")
        return
    cleaned = txt[:first_close + len(MARKERS[1])]
    if cleaned == txt:
        print("index.html already clean; nothing removed.")
        return
    INDEX.write_text(cleaned, encoding="utf-8")
    print(f"Stripped {len(txt) - len(cleaned)} chars from index.html.")


if __name__ == "__main__":
    clean()
