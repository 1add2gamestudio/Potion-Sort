#!/usr/bin/env python3
"""
Potion Sort — Automated Promo Video Synthesizer (5 Videos)
------------------------------------------------------------
Synthesizes 5 ready-to-publish vertical 9:16 promo videos (720x1280, 25fps, H.264 + AAC)
into ./output/ using real artwork & audio from ../raw_assets/, pre-installed ImageMagick
(`convert`) for crisp transparent typography/mascot overlays, and FFmpeg (`ffmpeg`) for
smooth Ken Burns zoom/pan motion, fade transitions, and multi-track audio mixing.

Zero external Python packages required (stdlib Python 3 + ImageMagick + FFmpeg).

Usage:
    python3 _marketing_assets/videos/generate_videos.py
"""

from dataclasses import dataclass
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

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

VW, VH, FPS = 720, 1280, 25


@dataclass
class Shot:
    bg_rel: str
    duration: float
    motion: str  # "zoom_in" | "zoom_out" | "pan_right" | "pan_left"
    kicker: str
    title: str
    subtitle: str
    badge_rels: list[str]
    mascot_rel: str | None = None
    mascot_side: str = "right"  # "left" | "right" | "both"


@dataclass
class VideoSpec:
    filename: str
    chord_hz: tuple[float, float, float]
    sfx_times: list[float]
    shots: list[Shot]


def asset(rel: str) -> str:
    p = RAW_DIR / rel
    if not p.exists():
        raise FileNotFoundError(f"Missing real asset: {p}")
    return str(p)


def run_cmd(cmd: list[str], label: str) -> None:
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[ERROR] {label} failed:\n{res.stderr}", file=sys.stderr)
        sys.exit(1)


def render_shot_overlay(shot: Shot, out_png: Path) -> None:
    """Create a transparent 720x1280 PNG overlay with scrims, crisp typography, badges & mascots."""
    args: list[str] = [
        "-size", f"{VW}x{VH}", "xc:none",
        # Top gradient scrim for title readability
        "(", "-size", f"{VW}x420", "gradient:rgba(12,10,32,0.88)-rgba(12,10,32,0.0)", ")",
        "-gravity", "north", "-composite",
        # Bottom gradient scrim for brand & icons
        "(", "-size", f"{VW}x380", "gradient:rgba(12,10,32,0.0)-rgba(12,10,32,0.92)", ")",
        "-gravity", "south", "-composite",
        # Thin gold editorial border
        "-fill", "none", "-stroke", "rgba(246,201,94,0.45)", "-strokewidth", "2",
        "-draw", f"roundrectangle 18,18 {VW - 18},{VH - 18} 18,18",
        "-stroke", "none",
        # Kicker
        "-gravity", "north",
        "-font", FONT_BOLD, "-pointsize", "22", "-fill", "#F6C95E",
        "-annotate", "+0+62", shot.kicker,
        # Title shadow + main
        "-font", FONT_BOLD, "-pointsize", "50", "-fill", "rgba(10,8,24,0.75)",
        "-annotate", "+2+102", shot.title,
        "-fill", "#FFF9EC",
        "-annotate", "+0+100", shot.title,
        # Subtitle
        "-font", FONT_REG, "-pointsize", "23", "-fill", "#E7DDF5",
        "-annotate", "+0+168", shot.subtitle,
    ]

    # Optional mascots near bottom
    if shot.mascot_side == "both":
        args += [
            "(", asset("mascots/fox_clap.png"), "-resize", "235x290", ")",
            "-gravity", "south", "-geometry", "-155+95", "-composite",
            "(", asset("mascots/dragon_clap.png"), "-resize", "235x290", ")",
            "-gravity", "south", "-geometry", "+155+98", "-composite",
        ]
    elif shot.mascot_rel:
        gx = "+155+95" if shot.mascot_side == "right" else "-155+95"
        args += [
            "(", asset(shot.mascot_rel), "-resize", "230x290", ")",
            "-gravity", "south", "-geometry", gx, "-composite",
        ]

    # Badges row near bottom
    if shot.badge_rels:
        icon_sz = 92
        gap = 28
        n = len(shot.badge_rels)
        total = n * icon_sz + (n - 1) * gap
        start_x = -total // 2 + icon_sz // 2
        if shot.mascot_rel and shot.mascot_side == "right":
            start_x -= 95
        elif shot.mascot_rel and shot.mascot_side == "left":
            start_x += 95
        for idx, rel in enumerate(shot.badge_rels):
            x_off = start_x + idx * (icon_sz + gap)
            sign = f"+{x_off}" if x_off >= 0 else str(x_off)
            args += [
                "(", asset(rel), "-resize", f"{icon_sz}x{icon_sz}", ")",
                "-gravity", "south", "-geometry", f"{sign}+110", "-composite",
            ]

    # Footer watermark
    args += [
        "-gravity", "south",
        "-font", FONT_BOLD, "-pointsize", "18", "-fill", "rgba(246,201,94,0.85)",
        "-annotate", "+0+32", "POTION SORT  |  SUNLIT ALCHEMY PUZZLE",
    ]

    run_cmd(["convert"] + args + [str(out_png)], f"overlay {out_png.name}")


def render_bg_prepared(bg_rel: str, out_jpg: Path) -> None:
    """Prepare a slightly oversized 900x1600 background image for buttery-smooth Ken Burns motion."""
    run_cmd(
        [
            "convert",
            asset(bg_rel),
            "-resize", "900x1600^",
            "-gravity", "center",
            "-extent", "900x1600",
            "-quality", "92",
            str(out_jpg),
        ],
        f"prep_bg {out_jpg.name}",
    )


def render_shot_clip(shot: Shot, idx: int, tmp_dir: Path) -> Path:
    bg_jpg = tmp_dir / f"bg_{idx:02d}.jpg"
    ov_png = tmp_dir / f"ov_{idx:02d}.png"
    clip_mp4 = tmp_dir / f"clip_{idx:02d}.mp4"

    render_bg_prepared(shot.bg_rel, bg_jpg)
    render_shot_overlay(shot, ov_png)

    frames = max(1, int(round(shot.duration * FPS)))
    fade_out_st = max(0.0, shot.duration - 0.35)

    # Ken Burns zoompan expressions on 900x1600 input -> 720x1280 output
    if shot.motion == "zoom_in":
        zp = f"zoompan=z='1.0+0.10*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={VW}x{VH}:fps={FPS}"
    elif shot.motion == "zoom_out":
        zp = f"zoompan=z='1.12-0.10*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={VW}x{VH}:fps={FPS}"
    elif shot.motion == "pan_right":
        zp = f"zoompan=z='1.12':x='(iw-iw/zoom)*on/{frames}':y='ih/2-(ih/zoom/2)':d={frames}:s={VW}x{VH}:fps={FPS}"
    else:  # pan_left
        zp = f"zoompan=z='1.12':x='(iw-iw/zoom)*(1-on/{frames})':y='ih/2-(ih/zoom/2)':d={frames}:s={VW}x{VH}:fps={FPS}"

    filter_complex = (
        f"[0:v]{zp},format=yuv420p[bg];"
        f"[bg][1:v]overlay=0:0:shortest=1,"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out_st:.2f}:d=0.35[v]"
    )

    run_cmd(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(bg_jpg),
            "-loop", "1", "-t", f"{shot.duration:.2f}", "-i", str(ov_png),
            "-filter_complex", filter_complex,
            "-map", "[v]",
            "-t", f"{shot.duration:.2f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "24",
            "-pix_fmt", "yuv420p",
            str(clip_mp4),
        ],
        f"clip {idx}",
    )
    return clip_mp4


def build_video(spec: VideoSpec) -> None:
    total_dur = sum(s.duration for s in spec.shots)
    out_mp4 = OUT_DIR / spec.filename
    glug_mp3 = asset("sounds/asmr_bottle_glug.mp3")

    with tempfile.TemporaryDirectory(prefix="solstice_vid_") as tmp:
        tmp_dir = Path(tmp)
        clips = [render_shot_clip(s, i, tmp_dir) for i, s in enumerate(spec.shots)]

        concat_txt = tmp_dir / "concat.txt"
        concat_txt.write_text(
            "\n".join(f"file '{c.as_posix()}'" for c in clips) + "\n",
            encoding="utf-8",
        )

        # Synthesize warm harmonic conservatory chord bed + layer real ASMR bottle glug SFX at cue times
        f1, f2, f3 = spec.chord_hz
        bgm_expr = (
            f"0.11*(sin(2*PI*{f1}*t)+0.65*sin(2*PI*{f2}*t)+0.5*sin(2*PI*{f3}*t))"
            f"*(0.65+0.35*sin(2*PI*0.25*t))"
        )

        ffmpeg_inputs = [
            "-f", "concat", "-safe", "0", "-i", str(concat_txt),
            "-f", "lavfi", "-t", f"{total_dur:.2f}",
            "-i", f"aevalsrc='{bgm_expr}|{bgm_expr}':s=44100:d={total_dur:.2f}",
        ]
        # Add one input per ASMR glug cue
        for _ in spec.sfx_times:
            ffmpeg_inputs += ["-i", glug_mp3]

        audio_chains = [
            f"[1:a]afade=t=in:st=0:d=0.8,afade=t=out:st={max(0.0, total_dur - 1.2):.2f}:d=1.2[bgm]"
        ]
        mix_labels = ["[bgm]"]
        for i, cue_sec in enumerate(spec.sfx_times):
            in_idx = 2 + i
            delay_ms = int(round(cue_sec * 1000))
            audio_chains.append(
                f"[{in_idx}:a]volume=0.85,adelay={delay_ms}|{delay_ms}[sfx{i}]"
            )
            mix_labels.append(f"[sfx{i}]")

        mix_str = "".join(mix_labels) + f"amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0,alimiter=limit=0.92[aout]"
        audio_filter = ";".join(audio_chains + [mix_str])

        run_cmd(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                *ffmpeg_inputs,
                "-filter_complex", audio_filter,
                "-map", "0:v",
                "-map", "[aout]",
                "-t", f"{total_dur:.2f}",
                "-c:v", "libx264", "-preset", "medium", "-crf", "26",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "128k", "-ac", "2",
                "-movflags", "+faststart",
                str(out_mp4),
            ],
            f"mux {spec.filename}",
        )

    size_kb = out_mp4.stat().st_size // 1024
    print(f"  [OK] {spec.filename} ({total_dur:.1f}s, {size_kb} KB)")


def get_specs() -> list[VideoSpec]:
    return [
        # 1. Concept Trailer PV (24s) — embedded in website/index.html
        VideoSpec(
            filename="video_01_concept_pv.mp4",
            chord_hz=(261.63, 329.63, 392.00),  # C major warm chord
            sfx_times=[1.6, 7.2, 13.5, 19.0],
            shots=[
                Shot(
                    "images/solstice_home_3d_scene_1794980022597.jpg", 4.0, "zoom_in",
                    "WELCOME TO THE WORKSHOP", "POTION SORT",
                    "A Cozy 3D Sunlit Alchemy Puzzle",
                    ["ui/icon-flask.png"], "mascots/fox_idle.png", "right",
                ),
                Shot(
                    "images/stage_c_fullwidth_1794988696753.jpg", 4.0, "zoom_out",
                    "TACTILE ASMR POURS", "SILKY LIQUID FLOW",
                    "Crisp Glass Clinks & Smooth Physics",
                    ["ui/icon-sound-on.png", "ui/icon-flask.png"],
                ),
                Shot(
                    "cg/victory-tier-1.jpg", 4.0, "pan_right",
                    "LOYAL COMPANIONS", "FOX & SKY DRAGON",
                    "Cheering Every Golden Elixir You Brew",
                    ["ui/icon-heart.png"], "mascots/dragon_clap.png", "right",
                ),
                Shot(
                    "cg/victory-tier-2.jpg", 4.0, "zoom_in",
                    "CLEVER DEPTH", "4 ALCHEMY OBSTACLES",
                    "Mystery, Corks, Crates & Alchemy Veils",
                    ["ui/icon-undo.png", "ui/icon-shuffle.png", "ui/icon-cauldron.png"],
                ),
                Shot(
                    "cg/victory-tier-3.jpg", 4.0, "zoom_out",
                    "ACHIEVEMENT CODEX", "COLLECT 6 CG CARDS",
                    "Victory & Hilarious Mishap Art + Coins",
                    ["ui/icon-trophy.png", "ui/icon-coin.png"],
                ),
                Shot(
                    "images/solstice_home_3d_scene_1794980022597.jpg", 4.0, "zoom_in",
                    "COMING TO APP STORE", "PLAY POTION SORT",
                    "Pour, Relax & Brew Your Sunlit Story",
                    [], None, "both",
                ),
            ],
        ),
        # 2. Core Gameplay & 4 Obstacles (22s)
        VideoSpec(
            filename="video_02_gameplay_obstacles.mp4",
            chord_hz=(293.66, 369.99, 440.00),  # D major bright chord
            sfx_times=[1.2, 5.4, 9.6, 13.8, 18.0],
            shots=[
                Shot(
                    "images/stage_c_fullwidth_1794988696753.jpg", 4.0, "zoom_in",
                    "CORE GAMEPLAY", "TAP, POUR & SORT",
                    "Match Every Potion Layer with One Finger",
                    ["ui/icon-flask.png", "ui/icon-check.png"],
                ),
                Shot(
                    "cg/defeat-tier-1.jpg", 4.0, "pan_right",
                    "LEVEL 6 & LEVEL 10", "MYSTERY & CORKS",
                    "Uncover Hidden Hues & Pop Sealed Flasks",
                    ["ui/icon-lock.png"], "mascots/fox_idle.png", "right",
                ),
                Shot(
                    "cg/defeat-tier-2.jpg", 4.0, "pan_left",
                    "LEVEL 16 & LEVEL 22", "CRATES & VEILS",
                    "Crack Adjacent Crates & Time the Curtain",
                    ["ui/icon-shuffle.png"], "mascots/dragon_idle.png", "left",
                ),
                Shot(
                    "cg/victory-tier-2.jpg", 4.0, "zoom_out",
                    "SMART ASSISTANCE", "3 TACTICAL BOOSTERS",
                    "Undo, Shuffle & Extra Bottle Whenever Needed",
                    ["ui/icon-undo.png", "ui/icon-shuffle.png", "ui/icon-flask.png"],
                ),
                Shot(
                    "images/solstice_home_3d_scene_1794980022597.jpg", 6.0, "zoom_in",
                    "GOLDEN WAVE PACING", "100% SOLVABLE DEALS",
                    "Balanced Flow & Challenge on Every Stage",
                    ["ui/icon-map.png"], "mascots/fox_clap.png", "right",
                ),
            ],
        ),
        # 3. Companions & 6-Tier CG Codex (20s)
        VideoSpec(
            filename="video_03_companions_cgs.mp4",
            chord_hz=(329.63, 415.30, 493.88),  # E major luminous chord
            sfx_times=[1.2, 5.2, 9.2, 13.2],
            shots=[
                Shot(
                    "images/solstice_mascot_avatar_1794980022747.jpg", 4.0, "zoom_in",
                    "WORKSHOP KEEPER", "FOX ALCHEMIST",
                    "Master of Sunlit Recipes & Precision Pours",
                    ["ui/icon-flask.png"], "mascots/fox_clap.png", "right",
                ),
                Shot(
                    "images/solstice_dragon_avatar_1794985798351.jpg", 4.0, "zoom_out",
                    "FIRE APPRENTICE", "SKY DRAGON",
                    "Always Cheering — Until the Cauldron Boils!",
                    ["ui/icon-streak-flame.png"], "mascots/dragon_clap.png", "left",
                ),
                Shot(
                    "cg/victory-tier-3.jpg", 4.0, "pan_right",
                    "TRIUMPH GALLERY", "3 VICTORY CG TIERS",
                    "First Shimmer · Prismatic Glow · Starlight",
                    ["ui/icon-trophy.png", "ui/icon-coin.png"],
                ),
                Shot(
                    "cg/defeat-tier-3.jpg", 4.0, "zoom_in",
                    "COMEDY GALLERY", "3 MISHAP CG TIERS",
                    "Even a Wild Explosion Unlocks Art & Coins!",
                    ["ui/icon-cauldron.png"],
                ),
                Shot(
                    "cg/victory-tier-1.jpg", 4.0, "zoom_out",
                    "ACHIEVEMENT CODEX", "COLLECT ALL 6 CARDS",
                    "Unlock Every Memory in Potion Sort",
                    ["ui/icon-trophy.png"], "mascots/fox_idle.png", "right",
                ),
            ],
        ),
        # 4. Speed Bonus, Streak & Sun Alembic (18s)
        VideoSpec(
            filename="video_04_speed_streak_alembic.mp4",
            chord_hz=(349.23, 440.00, 523.25),  # F major heroic warm chord
            sfx_times=[1.0, 5.5, 10.0, 14.5],
            shots=[
                Shot(
                    "images/stage_c_fullwidth_1794988696753.jpg", 4.5, "zoom_in",
                    "SPEED BONUS TIMER", "BEAT 60 SECONDS",
                    "Earn +25 Extra Coins for Rapid Clears!",
                    ["ui/icon-coin.png", "ui/icon-flask.png"],
                ),
                Shot(
                    "cg/victory-tier-2.jpg", 4.5, "pan_left",
                    "SOLSTICE STREAK", "IGNITE YOUR STREAK",
                    "3/5/8 Win Chains Grant Free Starting Boosters",
                    ["ui/icon-streak-flame.png"], "mascots/dragon_clap.png", "right",
                ),
                Shot(
                    "cg/victory-tier-3.jpg", 4.5, "zoom_in",
                    "WORKSHOP CRAFTING", "THE SUN ALEMBIC",
                    "Turn Level Essence into Coins & Boosters",
                    ["ui/icon-cauldron.png", "ui/icon-heart.png"],
                ),
                Shot(
                    "images/solstice_home_3d_scene_1794980022597.jpg", 4.5, "zoom_out",
                    "PURE EXPERIENCE", "SHIELD & AD-FREE",
                    "Protect Streaks & Enjoy Optional Ad-Free Mode",
                    ["ui/icon-shield.png"], "mascots/fox_clap.png", "right",
                ),
            ],
        ),
        # 5. 7-Day Calendar & Launch Countdown Teaser (15s)
        VideoSpec(
            filename="video_05_launch_teaser.mp4",
            chord_hz=(392.00, 493.88, 587.33),  # G major sparkling chord
            sfx_times=[1.0, 6.0, 11.0],
            shots=[
                Shot(
                    "images/solstice_home_3d_scene_1794980022597.jpg", 5.0, "zoom_in",
                    "COMING SOON", "WORKSHOP AWAITS",
                    "Step Inside the Sunlit Alchemy Conservatory",
                    ["ui/icon-castle.png", "ui/icon-flask.png"],
                ),
                Shot(
                    "cg/victory-tier-1.jpg", 5.0, "zoom_out",
                    "7-DAY LOGIN CALENDAR", "DAY 7 JACKPOT",
                    "Claim +250 Coins, Extra Bottle & Shuffle!",
                    ["ui/icon-coin.png", "ui/icon-trophy.png"],
                ),
                Shot(
                    "images/solstice_home_3d_scene_1794980022597.jpg", 5.0, "zoom_in",
                    "APP STORE LAUNCH", "POTION SORT",
                    "Pour, Match & Unwind — Play Today!",
                    [], None, "both",
                ),
            ],
        ),
    ]


def main() -> None:
    for tool in ("convert", "ffmpeg"):
        if shutil.which(tool) is None:
            print(f"Error: `{tool}` is required on PATH.", file=sys.stderr)
            sys.exit(1)

    specs = get_specs()
    print(f"Synthesizing {len(specs)} promo videos into {OUT_DIR} ...")
    for spec in specs:
        build_video(spec)
    print("All 5 promo videos synthesized successfully!")


if __name__ == "__main__":
    main()
