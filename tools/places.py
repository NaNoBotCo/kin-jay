#!/usr/bin/env python3
"""places.py — resolves the halls and kitchens in venues.json against Mot Dang's own records
and writes docs/places.json: both names, the pin, and the link to the Mot Dang page.

A venue is named here by its Mot Dang record id, so the page and the directory never
disagree about where a place is. The line under each name (note_th / note_en) is written
in venues.json from the record or from a named source.

Run:  python3.13 tools/places.py      (imports Mot Dang's build.py for place_slug and name_pair)
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.abspath(os.path.join(HERE, "..", "..", "mot-dang"))
sys.path.insert(0, MD)
os.chdir(MD)
import build  # noqa: E402


def main():
    want = json.load(open(os.path.join(HERE, "venues.json")))
    recs = {}
    for p in ("cm", "cr"):
        for r in json.load(open(os.path.join(MD, "data", "canonical", f"{p}.json"))):
            recs[r["id"]] = r
    out, miss = [], []
    for v in want:
        r = recs.get(v["id"])
        if not r or r.get("lat") is None:
            miss.append(v["id"])
            continue
        th, en = build.name_pair(r)
        th = v.get("th") or th or en
        en = v.get("en") or en
        prov = r["province"]
        out.append({"id": r["id"], "th": th, "en": en, "lat": round(r["lat"], 5), "lng": round(r["lng"], 5), "roman": "" if en else build.name_roman(r),
                    "prov": prov, "k": v["k"], "url": f"https://motdang.net/{prov}/p/{build.place_slug(r)}.html",
                    "note_th": v["note_th"], "note_en": v["note_en"]})
    with open(os.path.join(HERE, "..", "docs", "places.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"places.json: {len(out)} places" + (f"; not found or unpinned: {', '.join(miss)}" if miss else ""))


if __name__ == "__main__":
    main()
