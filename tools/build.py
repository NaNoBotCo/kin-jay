#!/usr/bin/env python3
"""build.py — writes docs/index.html (English) and docs/th/index.html (Thai), sitemap.xml,
robots.txt and llms.txt. Every word, both languages, is in copy_text.py; the places
are in docs/places.json, written by places.py from Mot Dang's records.

Run:  python3 tools/build.py [--motdang]
"""
import html
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from copy_text import UI, PHOTOS, SOURCES  # noqa: E402

SLUG = "kin-jay"
DOCS = os.path.join(HERE, "..", "docs")
GH = f"https://nanobotco.github.io/{SLUG}/"
CANON = f"https://motdang.net/sites/{SLUG}/"
MD_ROOT = f"/sites/{SLUG}/"
E = html.escape
CSS = open(os.path.join(HERE, "site.css")).read()
GOOGLE_ESCAPE = '<script>if(/[.]translate[.]goog$/.test(location.hostname))location.replace("https://"+location.hostname.slice(0,-15).replace(/--/g,"~").replace(/-/g,".").replace(/~/g,"-")+location.pathname+location.search.replace(/([?&])_x_tr_[^&]*/g,"$1").replace(/[?]&+/,"?").replace(/[?&]+$/,"")+location.hash)</script>'
FONTS = ("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700"
         "&family=Noto+Sans+Thai:wght@400;600;700&family=Noto+Serif+Thai:wght@600;700&display=swap")
GLYPHS = "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@900&display=swap&text="


def places():
    return json.load(open(os.path.join(DOCS, "places.json")))


def paras(ps):
    return "".join(f"<p>{p}</p>" for p in ps)


def cards(rows, cls):
    return f'<div class="{cls}">' + "".join(rows) + "</div>"


def zh_text():
    """every CJK character the page prints, so the font request carries only those"""
    s = json.dumps(UI, ensure_ascii=False) + "齊示齋"
    return "".join(sorted({ch for ch in s if "㐀" <= ch <= "鿿"}))


def page(lang, md=False):
    u = UI[lang]
    P = places()
    root = MD_ROOT if md else ("" if lang == "en" else "../")
    url = CANON if lang == "en" else CANON + "th/"
    other = (MD_ROOT + ("th/" if lang == "en" else "")) if md else ("th/" if lang == "en" else "../")
    js = {k: u[k] for k in u if k.startswith(("now_", "day_", "g_l", "wok_", "map_", "dip_", "tofu_"))}
    js.update(lang=lang, days=u["days"], foods=[[f[0], f[1], f[2], f[3]] for f in u["foods"]])
    js["places"] = [{"th": p["th"], "en": p["en"] or p["th"], "ro": p["roman"], "lat": p["lat"], "lng": p["lng"], "prov": p["prov"], "k": p["k"],
                     "url": p["url"], "note_th": p["note_th"], "note_en": p["note_en"]} for p in P]
    def figs(sec):
        out = []
        for p in PHOTOS:
            if p["sec"] != sec:
                continue
            licl = f'<a href="{p["license_url"]}">{E(p["license"])}</a>' if p.get("license_url") else E(p["license"])
            cap = p["caption_" + lang]
            svg = ' class="glyphpic"' if p["file"].endswith(".svg") else ""
            out.append(f'<figure{svg}><img loading="lazy" src="{root}img/{p["file"]}" width="{p["width"]}" height="{p["height"]}" alt="{E(cap)}">'
                       f'<figcaption>{E(cap)} · <a href="{p["commons_page"]}">{E(p["author"])}</a> · {licl}</figcaption></figure>')
        return f'<div class="ph ph-{sec}">' + "".join(out) + "</div>" if out else ""
    nav = "".join(f'<a href="#{a}">{E(b)}</a>' for a, b in u["nav"])
    zh = E(zh_text())
    head = f'''<!doctype html><html lang="{lang}" translate="no" class="notranslate"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
{GOOGLE_ESCAPE}
<title>{E(u["title"])} · {E(u["other_title"])}</title>
<meta name="description" content="{E(u["desc"])}">
<meta name="theme-color" content="#5c0a14">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{CANON}"><link rel="alternate" hreflang="th" href="{CANON}th/"><link rel="alternate" hreflang="x-default" href="{CANON}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Kin Jay · กินเจ">
<meta property="og:title" content="{E(u["title"])}"><meta property="og:description" content="{E(u["desc"])}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{CANON}card.jpg"><meta property="og:image:secure_url" content="{CANON}card.jpg"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{E(u["card_alt"])}">
<meta property="og:locale" content="{"en_US" if lang == "en" else "th_TH"}"><meta property="og:locale:alternate" content="{"th_TH" if lang == "en" else "en_US"}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{CANON}card.jpg">
<link rel="icon" href="{root}icon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="{CANON}llms.txt" title="llms.txt">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet"><link href="{GLYPHS}{zh}" rel="stylesheet">
<script>if(/[?&]card/.test(location.search))document.documentElement.classList.add("card")</script>
<style>{CSS}</style>
</head><body>
<header class="top"><div class="in"><a class="brand" href="#top"><img src="{root}icon.svg" width="28" height="28" alt=""><span>{E(u["title"])}</span></a>
<nav aria-label="{E(u["nav_label"])}">{nav}</nav>
<span class="lang"><b>{E(u["lang_this"])}</b> | <a href="{other}" hreflang="{"th" if lang == "en" else "en"}">{E(u["lang_other"])}</a></span></div></header>
'''
    hero = f'''<section id="top" class="hero"><canvas id="scene" role="img" aria-label="{E(u["hero_alt"])}"></canvas>
<div class="hero-t"><p class="kick">{E(u["kicker"])}</p><h1><span class="zh" lang="zh-Hant">齋</span>{E(u["title"])}</h1><p class="lede">{E(u["lede"])}</p><p class="hint">{E(u["hint"])}</p><p class="cardline">{E(u["cardline"])}<br><span>motdang.net/sites/{SLUG}</span></p></div></section>
<div class="nowbar"><div class="in"><b>{E(u["dates_short"])}</b><span id="nowline" aria-live="polite"></span></div></div>
'''
    btns = "".join(f'<button class="pill" type="button">{i + 1}</button>' for i in range(9))
    dates = "".join(f'<div><b>{E(a)}</b><span>{b}</span></div>' for a, b in u["dates"])
    days = f'''<section id="days" class="sec dark"><div class="in"><p class="kick">{E(u["days_kick"])}</p><h2>{E(u["days_h"])}</h2>{paras(u["days_p"])}
<canvas id="lampcv" role="img" aria-label="{E(u["lamps_alt"])}"></canvas>
<div id="lampbtns" class="btns" role="group" aria-label="{E(u["days_h"])}">{btns}</div>
<div class="lampbox" aria-live="polite"><b id="lampday"></b><p id="lamptext"></p></div>
<div class="dates">{dates}</div></div></section>
'''
    ff = "".join(f'<div><b>{E(a)}</b>{b}</div>' for a, b in u["flag_facts"])
    flag = f'''<section id="flag" class="sec"><div class="in"><p class="kick">{E(u["flag_kick"])}</p><h2>{u["flag_h"]}</h2>{paras(u["flag_p"])}{figs("flag")}
<canvas id="glyphcv" role="img" aria-label="{E(u["glyph_alt"])}"></canvas><p class="note">{E(u["glyph_hint"])}</p>
<div class="flagfacts">{ff}</div></div></section>
'''
    chips = "".join(f'<button class="chip" type="button" data-i="{i}" aria-pressed="false"><i style="background:{f[1]}"></i>{E(f[0])}</button>' for i, f in enumerate(u["foods"]))
    rules = "".join(f'<div><b>{E(a)}</b>{b}</div>' for a, b in u["rules"])
    plate = f'''<section id="rules" class="sec gold"><div class="in"><p class="kick">{E(u["rules_kick"])}</p><h2>{E(u["rules_h"])}</h2>{paras(u["rules_p"])}
<div class="two"><div><canvas id="wokcv" role="img" aria-label="{E(u["wok_alt"])}"></canvas></div>
<div><p><b>{E(u["wok_h"])}</b></p><div id="chips">{chips}</div><div class="btns"><button id="wokclear" class="pill" type="button">{E(u["wok_clear"])}</button></div>
<div id="wokout" class="wokout" aria-live="polite"></div></div></div>
<div class="rules">{rules}</div></div></section>
'''
    seg = f'<button class="pill" type="button" data-k="all" aria-pressed="true">{E(u["menu_all"])}</button>' + "".join(
        f'<button class="pill" type="button" data-k="{k}" aria-pressed="false">{E(v)}</button>' for k, v in u["menu_kinds"])
    dishes = "".join(
        f'<div class="dish" data-k="{d["k"]}"><span class="steam" aria-hidden="true"><span></span><span></span><span></span></span>'
        f'<b>{E(d["name"])}{(" <span class=zh lang=zh-Hant>" + E(d["zh"]) + "</span>") if d.get("zh") else ""}</b><i>{E(d["gloss"])}</i><p>{E(d["what"])}</p></div>'
        for d in u["dishes"])
    menu = f'''<section id="menu" class="sec"><div class="in"><p class="kick">{E(u["menu_kick"])}</p><h2>{E(u["menu_h"])}</h2>{paras(u["menu_p"])}{figs("menu")}
<div id="menuseg" class="seg" role="group" aria-label="{E(u["menu_h"])}">{seg}</div><div id="dishes" class="dishes">{dishes}</div><p class="note">{u["menu_note"]}</p></div></section>
'''

    def pname(p):
        """the name in the page's language first; a Thai-only name in English carries its RTGS reading"""
        if lang == "th" or not p["en"]:
            first, second = p["th"], (p["en"] or p["roman"])
            fl, sl = ' lang="th"' if lang == "en" else "", ""
        else:
            first, second, fl, sl = p["en"], p["th"], "", ' lang="th"'
        tail = f' <span class="roman"{sl}>{E(second)}</span>' if second and second != first else ""
        return f'<a href="{E(p["url"])}"{fl}>{E(first)}</a>{tail}'

    def plist(prov, k):
        rows = [p for p in P if p["prov"] == prov and p["k"] == k]
        return "".join(f'<li>{pname(p)}<small>{E(p["note_" + lang])}</small></li>' for p in rows)
    mseg = "".join(f'<button class="pill" type="button" data-v="{v}" aria-pressed="{"true" if v == "city" else "false"}">{E(t)}</button>' for v, t in u["map_views"])
    evn = "".join(f'<div><b>{E(e["name"])}</b><span>{E(e["when"])} · {E(e["where"])}</span><p>{E(e["what"])}</p><a class="src" href="{E(e["src"])}">{E(u["src_word"])}</a></div>' for e in u["north_events"])
    north = f'''<section id="north" class="sec"><div class="in"><p class="kick">{E(u["north_kick"])}</p><h2>{E(u["north_h"])}</h2>{paras(u["north_p"])}
<div class="ev">{evn}</div>
<h3 style="margin-top:32px">{E(u["map_h"])}</h3>
<div id="mapseg" class="seg" role="group" aria-label="{E(u["map_h"])}">{mseg}</div>
<canvas id="mapcv" data-map="{root}map.json" role="img" aria-label="{E(u["map_alt"])}"></canvas>
<p class="legend"><span><i style="background:#c8102e"></i>{E(u["map_hall"])}</span><span><i style="background:#e08a00"></i>{E(u["map_kitchen"])}</span><span><i style="background:#2f6f8f"></i>{E(u["map_other"])}</span></p>
<div id="mapinfo" class="mapinfo" aria-live="polite">{E(u["map_hint"])}</div>
<div class="cols"><div><h3>{E(u["cm_halls"])}</h3><ul class="plist">{plist("cm", "hall")}</ul><h3 style="margin-top:20px">{E(u["cm_other"])}</h3><ul class="plist">{plist("cm", "other")}</ul></div>
<div><h3>{E(u["cm_kitchens"])}</h3><ul class="plist">{plist("cm", "kitchen")}</ul></div>
<div><h3>{E(u["cr_halls"])}</h3><ul class="plist">{plist("cr", "hall")}</ul><h3 style="margin-top:20px">{E(u["cr_kitchens"])}</h3><ul class="plist">{plist("cr", "kitchen")}</ul><h3 style="margin-top:20px">{E(u["cr_other"])}</h3><ul class="plist">{plist("cr", "other")}</ul></div></div>
<p class="note">{u["north_note"]}</p></div></section>
'''
    evt = "".join(f'<div><b>{E(e["name"])}</b><span>{E(e["when"])}</span><p>{E(e["what"])}</p><a class="src" href="{E(e["src"])}">{E(u["src_word"])}</a></div>' for e in u["thai_events"])
    thai = f'''<section id="thailand" class="sec dark"><div class="in"><p class="kick">{E(u["thai_kick"])}</p><h2>{E(u["thai_h"])}</h2>{paras(u["thai_p"])}{figs("thailand")}<div class="ev">{evt}</div></div></section>
'''
    grp = "".join(f'<div><b>{E(g["name"])}</b><i>{E(g["who"])}</i><p>{E(g["what"])}</p><a class="src" href="{E(g["src"])}">{E(u["src_word"])}</a></div>' for g in u["groups"])
    groups = f'''<section id="groups" class="sec"><div class="in"><p class="kick">{E(u["groups_kick"])}</p><h2>{E(u["groups_h"])}</h2>{paras(u["groups_p"])}<div class="groups">{grp}</div></div></section>
'''
    tales = "".join(f'<div class="tale"><b>{E(t["name"])}</b><small>{E(t["kind"])}</small>{paras(t["p"])}<a class="src" href="{E(t["src"])}">{E(u["src_word"])}</a></div>' for t in u["tales"])
    tbtn = "".join(f'<button class="pill" type="button">{E(s)}</button>' for s in u["tofu_names"])
    legends = f'''<section id="legends" class="sec dark"><div class="in"><p class="kick">{E(u["leg_kick"])}</p><h2>{E(u["leg_h"])}</h2>{paras(u["leg_p"])}
<div class="two" style="margin-top:20px"><div><canvas id="dipcv" role="img" aria-label="{E(u["dip_alt"])}"></canvas></div>
<div><h3>{E(u["dip_h"])}</h3>{paras(u["dip_p"])}<p id="diptext" class="diptext" aria-live="polite"></p><div class="btns"><button id="dipgo" class="pill" type="button">{E(u["dip_go"])}</button></div></div></div>
<div class="tales">{tales}</div>
<div class="two" style="margin-top:28px"><div><canvas id="tofucv" role="img" aria-label="{E(u["tofu_alt"])}"></canvas></div>
<div><h3>{E(u["tofu_h"])}</h3>{paras(u["tofu_p"])}<div id="tofubtns" class="btns" role="group" aria-label="{E(u["tofu_h"])}">{tbtn}</div><p id="tofutext" class="tofutext" aria-live="polite"></p></div></div>
</div></section>
'''
    words = "".join(f'<div><b>{E(a)}</b><i>{E(b)}</i><p>{E(c)}</p></div>' for a, b, c in u["words"])
    wd = f'''<section id="words" class="sec"><div class="in"><h2>{E(u["words_h"])}</h2><div class="glos">{words}</div></div></section>
'''
    src = "".join(f'<li><a href="{E(h)}">{E(t)}</a></li>' for t, h in SOURCES)
    md_link = "/" if md else "https://motdang.net/"
    so = f'''<section id="sources" class="sec"><div class="in"><h2>{E(u["src_h"])}</h2><ul class="src">{src}</ul>
<p class="note">{E(u["map_credit"])}</p></div></section>
'''
    tail = f'''<footer class="bot"><div class="in">{E(u["foot"])} · <a href="https://github.com/NaNoBotCo/{SLUG}">GitHub</a> · <a href="{md_link}">motdang.net</a> · <a href="https://nanobotco.github.io/">nanobotco</a></div></footer>
<script>window.UI={json.dumps(js, ensure_ascii=False)};</script>
<script src="{root}app.js"></script><script src="{root}top.js"></script>
</body></html>
'''
    return head + "<main>" + hero + days + flag + plate + menu + north + thai + groups + legends + wd + so + "</main>" + tail


def write_site(out, md):
    os.makedirs(os.path.join(out, "th"), exist_ok=True)
    host = CANON if md else GH
    for lang, path in (("en", "index.html"), ("th", "th/index.html")):
        with open(os.path.join(out, path), "w") as f:
            f.write(page(lang, md))
    with open(os.path.join(out, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f'<url><loc>{host}</loc></url>\n<url><loc>{host}th/</loc></url>\n</urlset>\n')
    if not md:
        with open(os.path.join(out, "robots.txt"), "w") as f:
            f.write(f"User-agent: *\nAllow: /\nSitemap: {host}sitemap.xml\n")
    u = UI["en"]
    strip = lambda s: html.unescape(re.sub("<[^>]+>", "", s))
    L = ["# Kin Jay · กินเจ — the Vegetarian Festival", "", u["desc"], "", f"English: {CANON}", f"Thai: {CANON}th/", f"Also: {GH}", ""]
    L += ["## The nine days, 2026", ""] + [f"- {u['day_dates_long'][i]}: {strip(d[1])}" for i, d in enumerate(u["days"])] + [""]
    L += [f"- {a}: {strip(b)}" for a, b in u["dates"]] + [""]
    L += ["## " + strip(u["flag_h"]), ""] + [strip(p) for p in u["flag_p"]] + [f"- {a}: {strip(b)}" for a, b in u["flag_facts"]] + [""]
    L += ["## " + u["rules_h"], ""] + [strip(p) for p in u["rules_p"]] + [f"- {a}: {strip(b)}" for a, b in u["rules"]] + [""]
    L += ["## " + u["menu_h"], ""] + [f"- {d['name']} ({d['gloss']}): {d['what']}" for d in u["dishes"]] + [""]
    L += ["## " + u["north_h"], ""] + [strip(p) for p in u["north_p"]] + [f"- {e['name']}, {e['when']}, {e['where']}: {e['what']} ({e['src']})" for e in u["north_events"]] + [""]
    L += ["### Places on Mot Dang", ""] + [f"- {p['en']} / {p['th']} ({p['prov'].upper()}, {p['k']}): {p['note_en']} {p['url']}" for p in places()] + [""]
    L += ["## " + u["thai_h"], ""] + [f"- {e['name']}, {e['when']}: {e['what']} ({e['src']})" for e in u["thai_events"]] + [""]
    L += ["## " + u["groups_h"], ""] + [f"- {g['name']} ({g['who']}): {g['what']} ({g['src']})" for g in u["groups"]] + [""]
    L += ["## " + u["leg_h"], ""] + [f"### {t['name']} ({t['kind']})\n\n" + " ".join(strip(p) for p in t["p"]) + f" ({t['src']})\n" for t in u["tales"]]
    L += ["## Words", ""] + [f"- {a} ({b}): {c}" for a, b, c in u["words"]]
    L += ["", "## Sources", ""] + [f"- {t}: {h}" for t, h in SOURCES]
    L += ["", "## Licence", "", "Text CC BY 4.0, NaNoBotCo. Code MIT. Amphoe outlines: OCHA COD-AB Thailand, Royal Thai Survey Department, CC BY-IGO. Water: OpenStreetMap contributors, ODbL. Photographs keep their own licences, listed on the page.", ""]
    with open(os.path.join(out, "llms.txt"), "w") as f:
        f.write("\n".join(L))


def main():
    write_site(DOCS, False)
    print("built en + th -> docs/")
    if "--motdang" in sys.argv:
        md = os.path.join(HERE, "..", "..", "mot-dang")
        for sub in (f"assets/sites/{SLUG}",):
            out = os.path.join(md, sub)
            if sub.startswith("docs") and not os.path.isdir(os.path.dirname(out)):
                continue
            if os.path.isdir(out):
                shutil.rmtree(out)
            shutil.copytree(DOCS, out, ignore=shutil.ignore_patterns("robots.txt", ".DS_Store"))
            write_site(out, True)
            shutil.copy(os.path.join(HERE, "motdang_card.json"), os.path.join(out, "card.json"))
            print("built en + th ->", os.path.normpath(out))


if __name__ == "__main__":
    main()
