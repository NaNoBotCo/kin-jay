#!/usr/bin/env python3
"""mapdata.py — the ground under the two province maps and the old-city inset. Writes docs/map.json.

Amphoe outlines: Mot Dang's data/admin_boundaries.json (OCHA COD-AB Thailand, Royal Thai
Survey Department, CC BY-IGO). Water in the old city: khom-loi's map.json, cut from Mot
Dang's land.json (OpenStreetMap contributors, ODbL, via Protomaps).

Run:  python3 tools/mapdata.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.join(HERE, "..", "..", "mot-dang")
KL = os.path.join(HERE, "..", "..", "khom-loi", "docs", "map.json")
CITY = (18.755, 98.955, 18.815, 99.025)   # S W N E: the old city and Warorot


def dp(pts, eps):
    """Douglas-Peucker in degrees."""
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    L = (dx * dx + dy * dy) ** .5 or 1e-12
    i, m = 0, -1
    for j in range(1, len(pts) - 1):
        x, y = pts[j]
        d = abs(dy * (x - ax) - dx * (y - ay)) / L
        if d > m:
            i, m = j, d
    if m < eps:
        return [pts[0], pts[-1]]
    return dp(pts[:i + 1], eps)[:-1] + dp(pts[i:], eps)


def main():
    ab = json.load(open(os.path.join(MD, "data", "admin_boundaries.json")))
    out = {"source": "Amphoe: OCHA COD-AB Thailand, Royal Thai Survey Department, CC BY-IGO. Water: OpenStreetMap contributors, ODbL, via Protomaps.",
           "amphoe": {"cm": [], "cr": []}, "city": {"bbox": list(CITY), "water": []}}
    for f in ab["levels"]["amphoe"]["features"]:
        p = f["properties"]
        g = f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        rings = []
        for poly in polys:
            r = [(round(la, 4), round(ln, 4)) for ln, la in poly[0]]
            h = len(r) // 2
            r = dp(r[:h + 1], 0.004)[:-1] + dp(r[h:], 0.004)
            if len(r) >= 4:
                rings.append(r)
        out["amphoe"][p["province"]].append({"th": p["name"], "en": p["nameEn"], "rings": rings})
    S, W, N, E = CITY
    for poly in json.load(open(KL))["water"]:
        rings = []
        for r in poly:
            if any(S - .01 < la < N + .01 and W - .01 < ln < E + .01 for la, ln in r):
                rings.append([(round(la, 4), round(ln, 4)) for la, ln in r])
        if rings:
            out["city"]["water"].append(rings)
    with open(os.path.join(HERE, "..", "docs", "map.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    n = sum(len(a["rings"]) for v in out["amphoe"].values() for a in v)
    print(f"map.json: {n} amphoe rings, {len(out['city']['water'])} water shapes")


if __name__ == "__main__":
    main()
