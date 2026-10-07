#!/usr/bin/env python3
"""motdang_net.py — writes the "jay" net into Mot Dang's data/curated/nets.json from docs/places.json,
so every hall and kitchen on this site shows the others, and this site, on its own Mot Dang page.

Run after places.py:  python3 tools/motdang_net.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
NETS = os.path.join(HERE, "..", "..", "mot-dang", "data", "curated", "nets.json")
STRANDS = [
    ("cm", "hall", "cm-halls", "เชียงใหม่: ศาลเจ้าและโรงเจ", "Chiang Mai: shrines and jay halls", "san chao lae rong je"),
    ("cm", "kitchen", "cm-kitchens", "เชียงใหม่: ร้านเจ", "Chiang Mai: jay kitchens", "ran je"),
    ("cm", "other", "cm-also", "เชียงใหม่: ตลาด ห้าง คุรุดวารา เทวสถาน", "Chiang Mai: market, malls, gurdwara, temples", "talat, hang"),
    ("cr", "hall", "cr-halls", "เชียงราย: ศาลเจ้าและโรงเจ", "Chiang Rai: shrines and jay halls", "san chao lae rong je"),
    ("cr", "kitchen", "cr-kitchens", "เชียงราย: ร้านเจ", "Chiang Rai: jay kitchens", "ran je"),
    ("cr", "other", "cr-also", "เชียงราย: คุรุดวารา", "Chiang Rai: gurdwara", "khuruthawara"),
]


def main():
    places = json.load(open(os.path.join(HERE, "..", "docs", "places.json")))
    net = {
        "th": "ตาข่ายเจ — เทศกาลกินเจ 2569 ในเชียงใหม่และเชียงราย",
        "en": "The jay net — the Vegetarian Festival 2026 in Chiang Mai and Chiang Rai",
        "roman": "ta-khai je",
        "lede_th": "เทศกาลกินเจปี 2569 ตรงกับ 10–18 ตุลาคม คือขึ้น 1–9 ค่ำ เดือน 9 จีน ร้านที่แขวนธงเหลืองตัว 齋 ขายอาหารที่ไม่มีของจากสัตว์และไม่มีผักฉุน ข้างล่างนี้คือศาลเจ้า โรงเจ และร้านเจในเชียงใหม่และเชียงราย มินิไซต์ กินเจ มีเมนู ข้อห้าม และตำนาน เปิดหน้าไหนข้างล่างนี้ ก็เห็นที่อื่นทั้งหมด",
        "lede_en": "The Vegetarian Festival runs 10–18 October 2026, the 1st to 9th of the ninth Chinese month. A shop that hangs the yellow 齋 flag sells food with nothing from an animal in it and none of the pungent plants. These are the shrines, jay halls and jay kitchens of Chiang Mai and Chiang Rai; the minisite Kin Jay has the menu, the rules and the legends. Open any page below and it shows all the others.",
        "sources": [
            {"url": "https://www.thansettakij.com/lifestyle/travel-shopping/670317", "label": "ฐานเศรษฐกิจ: กินเจ 2569 · Thansettakij: Kin Jay 2026"},
            {"url": "https://www.thaipbs.or.th/now/content/426", "label": "ไทยพีบีเอส: ธงเจ ผักฉุน · Thai PBS: the jay flag, the pungent plants"},
            {"url": "https://so05.tci-thaijo.org/index.php/panidhana/article/view/265529", "label": "วารสารปณิธาน 19(2): ศาลเจ้าและโรงเจในเมืองเชียงใหม่ · Panidhana 19(2): Chinese shrines of Mueang Chiang Mai"},
            {"url": "https://motdang.net/sites/kin-jay/", "label": "กินเจ · Kin Jay"},
        ],
        "strands": [],
    }
    for prov, k, key, th, en, roman in STRANDS:
        jewels = [{"id": p["id"], "th": p["note_th"], "en": p["note_en"]} for p in places if p["prov"] == prov and p["k"] == k]
        if jewels:
            net["strands"].append({"key": key, "th": th, "en": en, "roman": roman, "jewels": jewels})
    d = json.load(open(NETS))
    d["nets"]["jay"] = net
    with open(NETS, "w") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"nets.json: jay net, {sum(len(s['jewels']) for s in net['strands'])} jewels in {len(net['strands'])} strands")


if __name__ == "__main__":
    main()
