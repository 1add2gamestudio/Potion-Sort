#!/usr/bin/env python3
"""
Solstice Sort — Batch Social & App Store Graphics Generator (20 Sets)
---------------------------------------------------------------------
Generates 20 production-ready base marketing posters into ./output/post_01.png .. post_20.png
using real project artwork from ../raw_assets/ and system ImageMagick (`convert`).
Zero external Python packages required (stdlib Python 3 + ImageMagick).

Usage:
    python3 _marketing_assets/social_graphics/generate_graphics.py
"""

from pathlib import Path
import shutil
import subprocess
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
RAW_DIR = SCRIPT_DIR.parent / "raw_assets"
OUT_DIR = SCRIPT_DIR / "output"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"

if not Path(FONT_BOLD).exists():
    FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not Path(FONT_REG).exists():
    FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def asset(rel: str) -> str:
    p = RAW_DIR / rel
    if not p.exists():
        raise FileNotFoundError(f"Missing real asset: {p}")
    return str(p)


def run_convert(args: list[str], out_path: Path) -> None:
    cmd = ["convert"] + args + ["-strip", "-colorspace", "sRGB", str(out_path)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[ERROR] Failed generating {out_path.name}:\n{res.stderr}", file=sys.stderr)
        sys.exit(1)


def make_framed_card(src_path: str, w: int, h: int, border: int = 8) -> list[str]:
    """Return ImageMagick sub-stack for a crisp gold-bordered rounded image panel."""
    return [
        "(",
        src_path,
        "-resize", f"{w}x{h}^",
        "-gravity", "center",
        "-extent", f"{w}x{h}",
        "-bordercolor", "#F6C95E",
        "-border", str(border),
        ")",
    ]


def build_base_bg(bg_rel: str, w: int, h: int, top_scrim_h: int, bot_scrim_h: int) -> list[str]:
    """Full-bleed art canvas + dark royal-indigo top/bottom readability scrims + gold frame line."""
    pad = max(24, int(w * 0.025))
    return [
        # Full bleed scaled background
        asset(bg_rel),
        "-resize", f"{w}x{h}^",
        "-gravity", "center",
        "-extent", f"{w}x{h}",
        # Subtle warm-indigo glaze for cohesion
        "(", "-size", f"{w}x{h}", "xc:rgba(15,12,38,0.22)", ")",
        "-composite",
        # Top readability gradient scrim
        "(", "-size", f"{w}x{top_scrim_h}", "gradient:rgba(12,10,32,0.92)-rgba(12,10,32,0.0)", ")",
        "-gravity", "north", "-composite",
        # Bottom readability gradient scrim
        "(", "-size", f"{w}x{bot_scrim_h}", "gradient:rgba(12,10,32,0.0)-rgba(12,10,32,0.94)", ")",
        "-gravity", "south", "-composite",
        # Outer thin hairline gold border
        "-fill", "none",
        "-stroke", "rgba(246,201,94,0.45)",
        "-strokewidth", "3",
        "-draw", f"roundrectangle {pad},{pad} {w - pad},{h - pad} 24,24",
        "-stroke", "none",
    ]


def add_header_text(
    w: int,
    kicker: str,
    title: str,
    subtitle: str,
    y_kicker: int,
    y_title: int,
    y_sub: int,
    title_size: int,
    sub_size: int,
    kicker_size: int = 30,
) -> list[str]:
    """Crisp editorial typography stack with subtle drop shadow (no pill clutter)."""
    args: list[str] = [
        "-gravity", "north",
        # Kicker (uppercase tracked label)
        "-font", FONT_BOLD,
        "-pointsize", str(kicker_size),
        "-fill", "#F6C95E",
        "-annotate", f"+0+{y_kicker}", kicker,
    ]
    # Title shadow + main
    args += [
        "-font", FONT_BOLD,
        "-pointsize", str(title_size),
        "-fill", "rgba(10,8,24,0.75)",
        "-annotate", f"+3+{y_title + 4}", title,
        "-fill", "#FFF9EC",
        "-annotate", f"+0+{y_title}", title,
    ]
    # Subtitle
    args += [
        "-font", FONT_REG,
        "-pointsize", str(sub_size),
        "-fill", "#E7DDF5",
        "-annotate", f"+0+{y_sub}", subtitle,
    ]
    return args


def add_footer_brand(w: int, h: int, label: str = "SOLSTICE SORT  |  SUNLIT ALCHEMY PUZZLE") -> list[str]:
    fs = 26 if w >= 1200 else 22
    y_off = 48 if w >= 1200 else 38
    return [
        "-gravity", "south",
        "-font", FONT_BOLD,
        "-pointsize", str(fs),
        "-fill", "rgba(246,201,94,0.88)",
        "-annotate", f"+0+{y_off}", label,
    ]


def add_icon_row(icon_rels: list[str], icon_size: int, y_from_bottom: int, spacing: int) -> list[str]:
    """Composite a centered horizontal row of 3D UI icons near the bottom."""
    args: list[str] = []
    n = len(icon_rels)
    total_w = n * icon_size + (n - 1) * spacing
    start_x = -total_w // 2 + icon_size // 2
    for idx, rel in enumerate(icon_rels):
        x_off = start_x + idx * (icon_size + spacing)
        sign = f"+{x_off}" if x_off >= 0 else str(x_off)
        args += [
            "(",
            asset(rel),
            "-resize", f"{icon_size}x{icon_size}",
            ")",
            "-gravity", "south",
            "-geometry", f"{sign}+{y_from_bottom}",
            "-composite",
        ]
    return args


def generate_all() -> None:
    if shutil.which("convert") is None:
        print("Error: ImageMagick `convert` is required.", file=sys.stderr)
        sys.exit(1)

    jobs: list[tuple[str, list[str]]] = []

    # =========================================================================
    # GROUP 1: APP STORE CORE SCREENSHOTS (1290 x 2796) — Posts 01 to 05
    # =========================================================================
    W1, H1 = 1290, 2796

    # Post 01: Hero Key Art
    p01 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W1, H1, 960, 880)
    p01 += add_header_text(
        W1,
        "SUNLIT ALCHEMY PUZZLE",
        "SOLSTICE SORT",
        "Pour, Match & Brew in a Cozy 3D Workshop",
        y_kicker=140, y_title=205, y_sub=355, title_size=112, sub_size=40, kicker_size=34,
    )
    # Bottom crisp 3D icon trio so the 3D scene's Fox & Dragon remain the sole focal heroes
    p01 += add_icon_row(["ui/icon-flask.png", "ui/icon-cauldron.png", "ui/icon-trophy.png"], 175, 200, 80)
    p01 += add_footer_brand(W1, H1, "APP STORE  |  COZY 3D WATER SORT")
    jobs.append(("post_01.png", p01))

    # Post 02: Feature 1 — Silky ASMR Pours
    p02 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W1, H1, 960, 900)
    p02 += add_header_text(
        W1,
        "01  |  TACTILE RELAXATION",
        "SILKY ASMR POURS",
        "Crisp Glass Clinks & Soothing Liquid Flow",
        y_kicker=140, y_title=210, y_sub=350, title_size=96, sub_size=40, kicker_size=34,
    )
    p02 += make_framed_card(asset("cg/victory-tier-1.jpg"), 1020, 765, border=10)
    p02 += ["-gravity", "center", "-geometry", "+0+60", "-composite"]
    p02 += add_icon_row(["ui/icon-sound-on.png", "ui/icon-flask.png", "ui/icon-check.png"], 175, 220, 70)
    p02 += add_footer_brand(W1, H1)
    jobs.append(("post_02.png", p02))

    # Post 03: Feature 2 — 4 Clever Obstacles
    p03 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W1, H1, 960, 900)
    p03 += add_header_text(
        W1,
        "02  |  SMART STRATEGY",
        "4 CLEVER OBSTACLES",
        "Mystery Layers, Corks, Crates & Alchemy Veils",
        y_kicker=140, y_title=210, y_sub=350, title_size=92, sub_size=39, kicker_size=34,
    )
    p03 += make_framed_card(asset("cg/defeat-tier-2.jpg"), 1020, 765, border=10)
    p03 += ["-gravity", "center", "-geometry", "+0+60", "-composite"]
    p03 += add_icon_row(["ui/icon-undo.png", "ui/icon-shuffle.png", "ui/icon-flask.png"], 175, 220, 70)
    p03 += add_footer_brand(W1, H1, "100% SOLVABLE DEALS  |  3 TACTICAL BOOSTERS")
    jobs.append(("post_03.png", p03))

    # Post 04: Feature 3 — Companions & 6 CGs
    p04 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W1, H1, 960, 920)
    p04 += add_header_text(
        W1,
        "03  |  ACHIEVEMENT CODEX",
        "COLLECT 6 CG CARDS",
        "Unlock Victory & Comedy Mishap Art + Coins",
        y_kicker=140, y_title=210, y_sub=350, title_size=94, sub_size=40, kicker_size=34,
    )
    p04 += make_framed_card(asset("cg/victory-tier-3.jpg"), 1020, 765, border=10)
    p04 += ["-gravity", "center", "-geometry", "+0+20", "-composite"]
    p04 += [
        "(", asset("mascots/fox_idle.png"), "-resize", "360x450", ")",
        "-gravity", "south", "-geometry", "-310+160", "-composite",
        "(", asset("mascots/dragon_clap.png"), "-resize", "360x450", ")",
        "-gravity", "south", "-geometry", "+310+165", "-composite",
        "(", asset("ui/icon-trophy.png"), "-resize", "185x185", ")",
        "-gravity", "south", "-geometry", "+0+210", "-composite",
    ]
    p04 += add_footer_brand(W1, H1)
    jobs.append(("post_04.png", p04))

    # Post 05: Feature 4 — Sun Alembic, Streaks & Pure Ad-Free
    p05 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W1, H1, 960, 900)
    p05 += add_header_text(
        W1,
        "04  |  COZY DAILY RITUALS",
        "BREW & STREAK ON",
        "Sun Alembic, 7-Day Calendar & Ad-Free Option",
        y_kicker=140, y_title=210, y_sub=350, title_size=94, sub_size=39, kicker_size=34,
    )
    p05 += make_framed_card(asset("cg/victory-tier-2.jpg"), 1020, 765, border=10)
    p05 += ["-gravity", "center", "-geometry", "+0+60", "-composite"]
    p05 += add_icon_row(
        ["ui/icon-cauldron.png", "ui/icon-streak-flame.png", "ui/icon-shield.png", "ui/icon-coin.png"],
        160, 220, 48,
    )
    p05 += add_footer_brand(W1, H1, "CRAFT BOOSTERS  |  7-DAY JACKPOT  |  REMOVE ADS")
    jobs.append(("post_05.png", p05))

    # =========================================================================
    # GROUP 2: WORLDVIEW / CHARACTERS / CG CODEX (1080 x 1440, 3:4) — Posts 06 to 10
    # =========================================================================
    W2, H2 = 1080, 1440

    # Post 06: Fox Alchemist Profile
    p06 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W2, H2, 460, 520)
    p06 += add_header_text(
        W2,
        "WORKSHOP ARCHIVE  #01",
        "FOX ALCHEMIST",
        "Keeper of the Conservatory & Master Brewer",
        y_kicker=74, y_title=126, y_sub=228, title_size=78, sub_size=32, kicker_size=26,
    )
    p06 += make_framed_card(asset("images/solstice_mascot_avatar_1794980022747.jpg"), 690, 690, border=9)
    p06 += ["-gravity", "center", "-geometry", "+0+20", "-composite"]
    p06 += [
        "(", asset("mascots/fox_clap.png"), "-resize", "250x310", ")",
        "-gravity", "southeast", "-geometry", "+60+100", "-composite",
        "(", asset("ui/icon-flask.png"), "-resize", "130x130", ")",
        "-gravity", "southwest", "-geometry", "+80+120", "-composite",
    ]
    p06 += add_footer_brand(W2, H2, "SOLSTICE SORT  |  CHARACTER CODEX")
    jobs.append(("post_06.png", p06))

    # Post 07: Sky Dragon Profile
    p07 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W2, H2, 460, 520)
    p07 += add_header_text(
        W2,
        "WORKSHOP ARCHIVE  #02",
        "SKY DRAGON",
        "Goggled Apprentice & Loyal Cauldron Keeper",
        y_kicker=74, y_title=126, y_sub=228, title_size=78, sub_size=32, kicker_size=26,
    )
    p07 += make_framed_card(asset("images/solstice_dragon_avatar_1794985798351.jpg"), 690, 690, border=9)
    p07 += ["-gravity", "center", "-geometry", "+0+20", "-composite"]
    p07 += [
        "(", asset("mascots/dragon_idle.png"), "-resize", "250x310", ")",
        "-gravity", "southeast", "-geometry", "+60+100", "-composite",
        "(", asset("ui/icon-streak-flame.png"), "-resize", "130x130", ")",
        "-gravity", "southwest", "-geometry", "+80+120", "-composite",
    ]
    p07 += add_footer_brand(W2, H2, "SOLSTICE SORT  |  CHARACTER CODEX")
    jobs.append(("post_07.png", p07))

    # Post 08: Victory CG Tiers 1-3 Strip
    p08 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W2, H2, 520, 460)
    p08 += add_header_text(
        W2,
        "ACHIEVEMENT GALLERY",
        "VICTORY CG TIERS",
        "First Shimmer  ·  Prismatic Glow  ·  Starlight Elixir",
        y_kicker=68, y_title=118, y_sub=218, title_size=74, sub_size=30, kicker_size=26,
    )
    p08 += make_framed_card(asset("cg/victory-tier-1.jpg"), 430, 322, border=6)
    p08 += ["-gravity", "north", "-geometry", "-235+315", "-composite"]
    p08 += make_framed_card(asset("cg/victory-tier-2.jpg"), 430, 322, border=6)
    p08 += ["-gravity", "north", "-geometry", "+235+315", "-composite"]
    p08 += make_framed_card(asset("cg/victory-tier-3.jpg"), 840, 560, border=8)
    p08 += ["-gravity", "south", "-geometry", "+0+140", "-composite"]
    p08 += [
        "(", asset("ui/icon-trophy.png"), "-resize", "125x125", ")",
        "-gravity", "southeast", "-geometry", "+68+105", "-composite",
    ]
    p08 += add_footer_brand(W2, H2, "UNLOCK ALL 3 VICTORY CGS & CLAIM BONUS COINS")
    jobs.append(("post_08.png", p08))

    # Post 09: Comedic Defeat CG Tiers 1-3 Strip
    p09 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W2, H2, 520, 460)
    p09 += add_header_text(
        W2,
        "COMEDY COLLECTION",
        "MISHAP CG TIERS",
        "Even a Wild Boil-Over Unlocks Art & Rewards!",
        y_kicker=68, y_title=118, y_sub=218, title_size=74, sub_size=30, kicker_size=26,
    )
    p09 += make_framed_card(asset("cg/defeat-tier-1.jpg"), 430, 322, border=6)
    p09 += ["-gravity", "north", "-geometry", "-235+315", "-composite"]
    p09 += make_framed_card(asset("cg/defeat-tier-2.jpg"), 430, 322, border=6)
    p09 += ["-gravity", "north", "-geometry", "+235+315", "-composite"]
    p09 += make_framed_card(asset("cg/defeat-tier-3.jpg"), 840, 560, border=8)
    p09 += ["-gravity", "south", "-geometry", "+0+140", "-composite"]
    p09 += [
        "(", asset("ui/icon-cauldron.png"), "-resize", "125x125", ")",
        "-gravity", "southeast", "-geometry", "+68+105", "-composite",
    ]
    p09 += add_footer_brand(W2, H2, "SMOKE  ·  BUBBLE OVERFLOW  ·  CAULDRON BOOM")
    jobs.append(("post_09.png", p09))

    # Post 10: Conservatory Worldview Diorama
    p10 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W2, H2, 480, 500)
    p10 += add_header_text(
        W2,
        "WORLDVIEW SPOTLIGHT",
        "SUNLIT TOWER",
        "Warm Sunlight, Oak Shelves & Hand-Crafted 3D Art",
        y_kicker=74, y_title=126, y_sub=228, title_size=76, sub_size=30, kicker_size=26,
    )
    p10 += make_framed_card(asset("images/stage_c_fullwidth_1794988696753.jpg"), 440, 680, border=8)
    p10 += ["-gravity", "center", "-geometry", "+235+75", "-composite"]
    p10 += make_framed_card(asset("images/solstice_home_3d_scene_1794980022597.jpg"), 440, 680, border=8)
    p10 += ["-gravity", "center", "-geometry", "-235+75", "-composite"]
    p10 += add_icon_row(["ui/icon-castle.png", "ui/icon-map.png"], 120, 105, 50)
    p10 += add_footer_brand(W2, H2)
    jobs.append(("post_10.png", p10))

    # =========================================================================
    # GROUP 3: CORE GAMEPLAY & MECHANICS BREAKDOWN (1080 x 1440, 3:4) — Posts 11 to 15
    # =========================================================================

    # Post 11: Golden Wave Pacing
    p11 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W2, H2, 520, 540)
    p11 += add_header_text(
        W2,
        "GAMEPLAY DEEP DIVE  #01",
        "GOLDEN WAVE CURVE",
        "10-Level Rhythmic Flow  ·  Zero Unsolvable Deals",
        y_kicker=72, y_title=124, y_sub=222, title_size=72, sub_size=30, kicker_size=26,
    )
    # 3 clean tier cards
    p11 += [
        "-fill", "rgba(18,14,44,0.86)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 90,340 990,545 24,24",
        "-draw", "roundrectangle 90,585 990,790 24,24",
        "-draw", "roundrectangle 90,830 990,1035 24,24",
        "-stroke", "none",
        "-gravity", "northwest",
        "-font", FONT_BOLD, "-pointsize", "40", "-fill", "#7CE5A8",
        "-annotate", "+145+380", "STAGE A  |  BREEZY RELAXATION",
        "-font", FONT_REG, "-pointsize", "29", "-fill", "#EAE2F8",
        "-annotate", "+145+445", "Smooth 4-6 color pours designed to enter pure flow state.",
        "-font", FONT_BOLD, "-pointsize", "40", "-fill", "#F6C95E",
        "-annotate", "+145+625", "STAGE B  |  TACTICAL HARD PEAKS",
        "-font", FONT_REG, "-pointsize", "29", "-fill", "#EAE2F8",
        "-annotate", "+145+690", "Mystery layers & cork seals arrive on Lv 5, 9, 14 & beyond.",
        "-font", FONT_BOLD, "-pointsize", "40", "-fill", "#C89BFF",
        "-annotate", "+145+870", "STAGE C  |  GRAND ALCHEMY TRIALS",
        "-font", FONT_REG, "-pointsize", "29", "-fill", "#EAE2F8",
        "-annotate", "+145+935", "Every 10th level tests mastery with extra coin jackpots.",
    ]
    p11 += add_icon_row(["ui/icon-map.png", "ui/icon-trophy.png", "ui/icon-heart.png"], 130, 150, 75)
    p11 += add_footer_brand(W2, H2)
    jobs.append(("post_11.png", p11))

    # Post 12: 4 Obstacles Field Guide
    p12 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W2, H2, 520, 500)
    p12 += add_header_text(
        W2,
        "GAMEPLAY DEEP DIVE  #02",
        "4 ALCHEMY OBSTACLES",
        "Learn Every Workshop Mechanic at a Glance",
        y_kicker=72, y_title=124, y_sub=222, title_size=70, sub_size=30, kicker_size=26,
    )
    p12 += [
        "-fill", "rgba(18,14,44,0.88)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 75,335 520,665 24,24",
        "-draw", "roundrectangle 560,335 1005,665 24,24",
        "-draw", "roundrectangle 75,705 520,1035 24,24",
        "-draw", "roundrectangle 560,705 1005,1035 24,24",
        "-stroke", "none",
        "-gravity", "northwest",
        # Box 1
        "-font", FONT_BOLD, "-pointsize", "34", "-fill", "#F6C95E",
        "-annotate", "+115+385", "MYSTERY  (?)",
        "-font", FONT_BOLD, "-pointsize", "24", "-fill", "#A5B4FC",
        "-annotate", "+115+435", "UNLOCKS AT LEVEL 6",
        "-font", FONT_REG, "-pointsize", "26", "-fill", "#F4EEFF",
        "-annotate", "+115+490", "Hidden bottom liquid.\nPour top layer away\nto reveal its true hue.",
        # Box 2
        "-font", FONT_BOLD, "-pointsize", "34", "-fill", "#F6C95E",
        "-annotate", "+600+385", "CORK SEAL",
        "-font", FONT_BOLD, "-pointsize", "24", "-fill", "#A5B4FC",
        "-annotate", "+600+435", "UNLOCKS AT LEVEL 10",
        "-font", FONT_REG, "-pointsize", "26", "-fill", "#F4EEFF",
        "-annotate", "+600+490", "Sealed bottle neck.\nComplete target bottles\nto pop the cork free.",
        # Box 3
        "-font", FONT_BOLD, "-pointsize", "34", "-fill", "#F6C95E",
        "-annotate", "+115+755", "WOODEN CRATE",
        "-font", FONT_BOLD, "-pointsize", "24", "-fill", "#A5B4FC",
        "-annotate", "+115+805", "UNLOCKS AT LEVEL 16",
        "-font", FONT_REG, "-pointsize", "26", "-fill", "#F4EEFF",
        "-annotate", "+115+860", "Boxed glass flask.\nFinish a neighboring\nbottle to crack it open.",
        # Box 4
        "-font", FONT_BOLD, "-pointsize", "34", "-fill", "#F6C95E",
        "-annotate", "+600+755", "ALCHEMY VEIL",
        "-font", FONT_BOLD, "-pointsize", "24", "-fill", "#A5B4FC",
        "-annotate", "+600+805", "UNLOCKS AT LEVEL 22",
        "-font", FONT_REG, "-pointsize", "26", "-fill", "#F4EEFF",
        "-annotate", "+600+860", "Rhythmic velvet curtain.\nOpens & closes on\ncounted pour cycles.",
    ]
    p12 += add_icon_row(["ui/icon-lock.png", "ui/icon-flask.png", "ui/icon-shuffle.png"], 125, 145, 70)
    p12 += add_footer_brand(W2, H2)
    jobs.append(("post_12.png", p12))

    # Post 13: Speed Bonus & 3 Boosters
    p13 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W2, H2, 520, 520)
    p13 += add_header_text(
        W2,
        "GAMEPLAY DEEP DIVE  #03",
        "SPEED & BOOSTERS",
        "Beat the Clock for Bonus Coins  ·  Turn Any Tide",
        y_kicker=72, y_title=124, y_sub=222, title_size=72, sub_size=30, kicker_size=26,
    )
    p13 += [
        "-fill", "rgba(18,14,44,0.88)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 90,335 990,560 24,24",
        "-draw", "roundrectangle 90,615 990,1045 24,24",
        "-stroke", "none",
        "-gravity", "northwest",
        "-font", FONT_BOLD, "-pointsize", "38", "-fill", "#F6C95E",
        "-annotate", "+140+380", "SPEED BONUS TIMER",
        "-font", FONT_REG, "-pointsize", "30", "-fill", "#FFF9EC",
        "-annotate", "+140+445", "Clear under 60s  ->  +25 Bonus Coins\nClear under 120s ->  +12 Bonus Coins",
        "-font", FONT_BOLD, "-pointsize", "38", "-fill", "#7CE5A8",
        "-annotate", "+140+660", "3 WORKSHOP BOOSTERS",
        "-font", FONT_REG, "-pointsize", "29", "-fill", "#EAE2F8",
        "-annotate", "+140+735", "1. UNDO       Rewind your last pour cleanly\n2. SHUFFLE    Remix top layers to break deadlocks\n3. +BOTTLE    Summon an extra temporary glass flask",
    ]
    p13 += add_icon_row(["ui/icon-undo.png", "ui/icon-shuffle.png", "ui/icon-flask.png", "ui/icon-coin.png"], 125, 145, 52)
    p13 += add_footer_brand(W2, H2)
    jobs.append(("post_13.png", p13))

    # Post 14: Sun Alembic Crafting
    p14 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W2, H2, 480, 540)
    p14 += add_header_text(
        W2,
        "GAMEPLAY DEEP DIVE  #04",
        "THE SUN ALEMBIC",
        "Distill Level Essence into Coins, Hearts & Boosters",
        y_kicker=72, y_title=124, y_sub=222, title_size=72, sub_size=30, kicker_size=26,
    )
    p14 += make_framed_card(asset("cg/victory-tier-2.jpg"), 860, 580, border=8)
    p14 += ["-gravity", "center", "-geometry", "+0-10", "-composite"]
    p14 += [
        "-fill", "rgba(18,14,44,0.90)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 110,1040 970,1175 20,20",
        "-stroke", "none",
        "-gravity", "north",
        "-font", FONT_BOLD, "-pointsize", "30", "-fill", "#FFF9EC",
        "-annotate", "+0+1070", "CLEAR LEVELS  ->  FILL ESSENCE  ->  CLAIM REWARDS",
        "-font", FONT_REG, "-pointsize", "25", "-fill", "#E7DDF5",
        "-annotate", "+0+1118", "Brew free Coin Pouches, Energy Hearts & Extra Bottles anytime",
    ]
    p14 += add_icon_row(["ui/icon-cauldron.png", "ui/icon-coin.png", "ui/icon-heart.png"], 115, 110, 75)
    p14 += add_footer_brand(W2, H2)
    jobs.append(("post_14.png", p14))

    # Post 15: Solstice Streak & Azure Gala
    p15 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W2, H2, 500, 540)
    p15 += add_header_text(
        W2,
        "GAMEPLAY DEEP DIVE  #05",
        "IGNITE YOUR STREAK",
        "Win Streaks Grant Free Starting Boosters & Gala Chests",
        y_kicker=72, y_title=124, y_sub=222, title_size=70, sub_size=29, kicker_size=26,
    )
    p15 += [
        "-fill", "rgba(18,14,44,0.88)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 90,345 990,820 24,24",
        "-stroke", "none",
        "-gravity", "northwest",
        "-font", FONT_BOLD, "-pointsize", "36", "-fill", "#F6C95E",
        "-annotate", "+145+400", "3-WIN STREAK   ->  +1 FREE UNDO ON START",
        "-font", FONT_BOLD, "-pointsize", "36", "-fill", "#7CE5A8",
        "-annotate", "+145+510", "5-WIN STREAK   ->  +1 UNDO + 1 SHUFFLE",
        "-font", FONT_BOLD, "-pointsize", "36", "-fill", "#C89BFF",
        "-annotate", "+145+620", "8-WIN STREAK   ->  FULL TRIO + GALA BONUS",
        "-font", FONT_REG, "-pointsize", "27", "-fill", "#EAE2F8",
        "-annotate", "+145+705", "Protect your hot streak with Streak Shields\n& unlock Azure Gala milestone chests!",
        "(", asset("mascots/dragon_clap.png"), "-resize", "300x370", ")",
        "-gravity", "south", "-geometry", "+260+125", "-composite",
        "(", asset("ui/icon-streak-flame.png"), "-resize", "165x165", ")",
        "-gravity", "south", "-geometry", "-250+205", "-composite",
        "(", asset("ui/icon-shield.png"), "-resize", "165x165", ")",
        "-gravity", "south", "-geometry", "-30+205", "-composite",
    ]
    p15 += add_footer_brand(W2, H2)
    jobs.append(("post_15.png", p15))

    # =========================================================================
    # GROUP 4: SOCIAL INTERACTIVE / DEVLOG / LAUNCH (1080 x 1080, 1:1) — Posts 16 to 20
    # =========================================================================
    W3, H3 = 1080, 1080

    # Post 16: 7-Day Login Calendar
    p16 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W3, H3, 420, 440)
    p16 += add_header_text(
        W3,
        "DAILY RETENTION REWARDS",
        "7-DAY CALENDAR",
        "Check In Daily  ·  Claim the Day 7 Grand Jackpot!",
        y_kicker=58, y_title=106, y_sub=198, title_size=72, sub_size=29, kicker_size=24,
    )
    # 7-day visual grid
    p16 += [
        "-fill", "rgba(18,14,44,0.88)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 90,285 370,455 18,18",
        "-draw", "roundrectangle 400,285 680,455 18,18",
        "-draw", "roundrectangle 710,285 990,455 18,18",
        "-draw", "roundrectangle 90,485 370,655 18,18",
        "-draw", "roundrectangle 400,485 680,655 18,18",
        "-draw", "roundrectangle 710,485 990,655 18,18",
        "-fill", "rgba(74,40,12,0.92)", "-stroke", "#FFD966", "-strokewidth", "5",
        "-draw", "roundrectangle 90,690 990,875 22,22",
        "-stroke", "none",
        "-gravity", "northwest",
        "-font", FONT_BOLD, "-pointsize", "28", "-fill", "#F6C95E",
        "-annotate", "+130+320", "DAY 1",
        "-annotate", "+440+320", "DAY 2",
        "-annotate", "+750+320", "DAY 3",
        "-annotate", "+130+520", "DAY 4",
        "-annotate", "+440+520", "DAY 5",
        "-annotate", "+750+520", "DAY 6",
        "-font", FONT_BOLD, "-pointsize", "30", "-fill", "#FFF9EC",
        "-annotate", "+130+378", "+50 COINS",
        "-annotate", "+440+378", "+2 UNDO",
        "-annotate", "+750+378", "+100 COINS",
        "-annotate", "+130+578", "+1 SHUFFLE",
        "-annotate", "+440+578", "+150 COINS",
        "-annotate", "+750+578", "+1 BOTTLE",
        "-font", FONT_BOLD, "-pointsize", "36", "-fill", "#FFE694",
        "-annotate", "+140+735", "DAY 7 GRAND JACKPOT",
        "-font", FONT_REG, "-pointsize", "28", "-fill", "#FFF9EC",
        "-annotate", "+140+795", "+250 Coins  +  Extra Bottle  +  Shuffle Booster!",
        "(", asset("mascots/fox_clap.png"), "-resize", "190x240", ")",
        "-gravity", "southeast", "-geometry", "+95+165", "-composite",
    ]
    p16 += add_footer_brand(W3, H3)
    jobs.append(("post_16.png", p16))

    # Post 17: ASMR Sound Check
    p17 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W3, H3, 400, 420)
    p17 += add_header_text(
        W3,
        "AUDIO SPOTLIGHT",
        "SOUND ON FOR ASMR",
        "Real Liquid Glugs & Cozy Glass Chimes",
        y_kicker=60, y_title=108, y_sub=200, title_size=68, sub_size=30, kicker_size=24,
    )
    p17 += make_framed_card(asset("cg/victory-tier-1.jpg"), 740, 500, border=8)
    p17 += ["-gravity", "center", "-geometry", "+0+60", "-composite"]
    p17 += [
        "(", asset("ui/icon-sound-on.png"), "-resize", "150x150", ")",
        "-gravity", "south", "-geometry", "+0+120", "-composite",
    ]
    p17 += add_footer_brand(W3, H3, "HEADPHONES RECOMMENDED  |  SOLSTICE SORT")
    jobs.append(("post_17.png", p17))

    # Post 18: Devlog Color-Blind Accessibility
    p18 = build_base_bg("images/stage_c_fullwidth_1794988696753.jpg", W3, H3, 420, 420)
    p18 += add_header_text(
        W3,
        "DEVLOG  #04  |  ACCESSIBILITY",
        "PLAY WITH RUNES",
        "Built-In Color-Blind Symbols in Settings",
        y_kicker=60, y_title=108, y_sub=200, title_size=72, sub_size=30, kicker_size=24,
    )
    p18 += [
        "-fill", "rgba(18,14,44,0.88)", "-stroke", "#F6C95E", "-strokewidth", "3",
        "-draw", "roundrectangle 90,295 990,775 24,24",
        "-stroke", "none",
        "-gravity", "north",
        "-font", FONT_BOLD, "-pointsize", "36", "-fill", "#F6C95E",
        "-annotate", "+0+355", "ONE-TAP COLOR-BLIND OVERLAY",
        "-font", FONT_REG, "-pointsize", "28", "-fill", "#EAE2F8",
        "-annotate", "+0+425", "Every potion color gains a distinct geometric rune\nso every player enjoys effortless clarity in any light.",
        "-font", FONT_BOLD, "-pointsize", "52", "-fill", "#FFF9EC",
        "-annotate", "+0+560", "A   B   C   D   E   F   G   H",
        "-font", FONT_REG, "-pointsize", "26", "-fill", "#7CE5A8",
        "-annotate", "+0+655", "Toggle anytime inside Settings -> Color-Blind Symbols",
        "(", asset("mascots/fox_idle.png"), "-resize", "200x260", ")",
        "-gravity", "southwest", "-geometry", "+105+100", "-composite",
        "(", asset("ui/icon-gear.png"), "-resize", "130x130", ")",
        "-gravity", "southeast", "-geometry", "+120+130", "-composite",
    ]
    p18 += add_footer_brand(W3, H3)
    jobs.append(("post_18.png", p18))

    # Post 19: Community Poll — Which Mishap Are You?
    p19 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W3, H3, 380, 380)
    p19 += add_header_text(
        W3,
        "COMMUNITY POLL",
        "WHICH MOOD TODAY?",
        "A: Mild Smoke   ·   B: Bubble Panic   ·   C: Full Boom!",
        y_kicker=55, y_title=102, y_sub=192, title_size=68, sub_size=28, kicker_size=24,
    )
    p19 += make_framed_card(asset("cg/defeat-tier-1.jpg"), 295, 420, border=6)
    p19 += ["-gravity", "center", "-geometry", "-325+65", "-composite"]
    p19 += make_framed_card(asset("cg/defeat-tier-2.jpg"), 295, 420, border=6)
    p19 += ["-gravity", "center", "-geometry", "+0+65", "-composite"]
    p19 += make_framed_card(asset("cg/defeat-tier-3.jpg"), 295, 420, border=6)
    p19 += ["-gravity", "center", "-geometry", "+325+65", "-composite"]
    p19 += [
        "-gravity", "south",
        "-font", FONT_BOLD, "-pointsize", "34", "-fill", "#FFE694",
        "-annotate", "-325+150", "A",
        "-annotate", "+0+150", "B",
        "-annotate", "+325+150", "C",
    ]
    p19 += add_footer_brand(W3, H3, "DROP YOUR ANSWER BELOW  |  SOLSTICE SORT")
    jobs.append(("post_19.png", p19))

    # Post 20: Pure Ad-Free & App Store Launch Teaser
    p20 = build_base_bg("images/solstice_home_3d_scene_1794980022597.jpg", W3, H3, 420, 440)
    p20 += add_header_text(
        W3,
        "COMING SOON TO APP STORE",
        "PURE PUZZLE BLISS",
        "No Forced Popups  ·  Optional One-Tap Ad-Free Upgrade",
        y_kicker=60, y_title=110, y_sub=204, title_size=70, sub_size=28, kicker_size=24,
    )
    p20 += [
        "(", asset("mascots/fox_clap.png"), "-resize", "330x420", ")",
        "-gravity", "center", "-geometry", "-260+115", "-composite",
        "(", asset("mascots/dragon_clap.png"), "-resize", "330x420", ")",
        "-gravity", "center", "-geometry", "+260+120", "-composite",
        "(", asset("ui/icon-shield.png"), "-resize", "200x200", ")",
        "-gravity", "center", "-geometry", "+0+70", "-composite",
    ]
    p20 += add_footer_brand(W3, H3, "SOLSTICE SORT  |  PRE-ORDER & FOLLOW")
    jobs.append(("post_20.png", p20))

    print(f"Generating {len(jobs)} marketing graphics into {OUT_DIR} ...")
    for filename, cmd_args in jobs:
        out_path = OUT_DIR / filename
        run_convert(cmd_args, out_path)
        print(f"  [OK] {filename}")

    print("All 20 marketing posters generated successfully!")


if __name__ == "__main__":
    generate_all()
