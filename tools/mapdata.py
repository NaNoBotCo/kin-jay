#!/usr/bin/env python3
"""mapdata.py — the ground under the doodle maps. Writes docs/map.json.

Thailand and its neighbours: Natural Earth 1:50m (public domain), tools/ne_countries.json.
Amphoe outlines: Mot Dang's data/admin_boundaries.json (OCHA COD-AB Thailand, Royal Thai
Survey Department, CC BY-IGO). Water, rivers and roads of the two old towns: Mot Dang's
city-live and doodle-chiang-rai data (OpenStreetMap contributors, ODbL, via Protomaps).

Run:  python3 tools/mapdata.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.join(HERE, "..", "..", "mot-dang")
SITES = os.path.join(MD, "assets", "sites")
CITY = (18.755, 98.955, 18.815, 99.025)     # S W N E: Chiang Mai's old city and Warorot
CRTOWN = (19.875, 99.795, 19.935, 99.865)   # Chiang Rai's old town and the Kok
TH = (5.4, 97.2, 20.6, 105.8)


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


def ring(r, eps):
    """a closed ring, simplified in two halves so its ends survive"""
    h = len(r) // 2
    return dp(r[:h + 1], eps)[:-1] + dp(r[h:], eps)


def dec(e, k):
    pts, a, b = [], e[0], e[1]
    pts.append((round(a / k, 5), round(b / k, 5)))
    for i in range(2, len(e), 2):
        a += e[i]; b += e[i + 1]
        pts.append((round(a / k, 5), round(b / k, 5)))
    return pts


def inside(pts, box, pad=0.004):
    S, W, N, E = box
    return any(S - pad < la < N + pad and W - pad < ln < E + pad for la, ln in pts)


def town(land_path, roads_path, box):
    land = json.load(open(land_path))
    roads = json.load(open(roads_path))
    k = land["scale"]
    out = {"bbox": list(box), "water": [], "rivers": [], "roads": {"major": []}}
    for poly in land["feats"].get("water", []):
        rings = [dec(r, k) for r in poly]
        if rings and inside(rings[0], box):
            out["water"].append([ring(r, 0.00004) for r in rings])
    for w, e in land.get("rivers", []):
        pts = dec(e, k)
        if inside(pts, box):
            out["rivers"].append([w, dp(pts, 0.00005)])
    for cls in ("major",):
        for e in roads[cls]:
            pts = dec(e, roads["scale"])
            if inside(pts, box, 0) and len(pts) > 2:
                out["roads"][cls].append(dp(pts, 0.0001))
    return out


def main():
    ab = json.load(open(os.path.join(MD, "data", "admin_boundaries.json")))
    out = {"source": "Thailand: Natural Earth (public domain). Amphoe: OCHA COD-AB Thailand, Royal Thai Survey Department, CC BY-IGO. Towns: OpenStreetMap contributors, ODbL, via Protomaps.",
           "amphoe": {"cm": [], "cr": []}, "thailand": {"bbox": list(TH), "land": {}}}
    for f in ab["levels"]["amphoe"]["features"]:
        p, g = f["properties"], f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        rings = [r for r in (ring([(round(la, 4), round(ln, 4)) for ln, la in poly[0]], 0.004) for poly in polys) if len(r) >= 4]
        out["amphoe"][p["province"]].append({"th": p["name"], "en": p["nameEn"], "rings": rings})
    ne = json.load(open(os.path.join(HERE, "ne_countries.json")))["countries"]
    for a3, g in ne.items():
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        rings = []
        for poly in polys:
            r = [(round(la, 3), round(ln, 3)) for ln, la in poly[0]]
            if inside(r, TH, 1.0) and len(r) >= 4:
                r = ring(r, 0.02 if a3 == "THA" else 0.05)
                if len(r) >= 4:
                    rings.append(r)
        out["thailand"]["land"][a3] = rings
    out["city"] = town(os.path.join(SITES, "city-live", "data", "land.json"), os.path.join(SITES, "city-live", "data", "roads.json"), CITY)
    out["crtown"] = town(os.path.join(SITES, "doodle-chiang-rai", "data", "land.json"), os.path.join(SITES, "doodle-chiang-rai", "data", "roads.json"), CRTOWN)
    with open(os.path.join(HERE, "..", "docs", "map.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    for k in ("city", "crtown"):
        t = out[k]
        print(k, len(t["water"]), "water,", len(t["rivers"]), "rivers,", len(t["roads"]["major"]), "roads")
    print("thailand rings:", {a: len(r) for a, r in out["thailand"]["land"].items()})
    print("bytes:", os.path.getsize(os.path.join(HERE, "..", "docs", "map.json")))


if __name__ == "__main__":
    main()
