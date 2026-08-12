#!/usr/bin/env python3
"""Build a colour-matched photo mosaic from cached Bilibili preview sprites."""

import argparse
import collections
import json
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

try:
    import numpy as np
    from PIL import Image, ImageEnhance, ImageOps
except ImportError as exc:
    raise SystemExit(
        "Pillow and NumPy are required. Run with the Codex workspace Python runtime."
    ) from exc


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Convert sRGB values in [0, 255] to CIE Lab (D65)."""
    values = np.asarray(rgb, dtype=np.float32) / 255.0
    linear = np.where(
        values <= 0.04045,
        values / 12.92,
        ((values + 0.055) / 1.055) ** 2.4,
    )
    matrix = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ],
        dtype=np.float32,
    )
    xyz = linear @ matrix.T
    xyz /= np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    delta = 6.0 / 29.0
    f = np.where(
        xyz > delta**3,
        np.cbrt(xyz),
        xyz / (3 * delta**2) + 4.0 / 29.0,
    )
    result = np.empty_like(f)
    result[..., 0] = 116.0 * f[..., 1] - 16.0
    result[..., 1] = 500.0 * (f[..., 0] - f[..., 1])
    result[..., 2] = 200.0 * (f[..., 1] - f[..., 2])
    return result


def difference_hash(image: Image.Image) -> int:
    gray = np.asarray(image.convert("L").resize((9, 8), Image.Resampling.BILINEAR))
    differences = gray[:, 1:] > gray[:, :-1]
    result = 0
    for value in differences.ravel():
        result = (result << 1) | int(value)
    return result


def frame_metrics(image: Image.Image) -> Tuple[np.ndarray, float, float, float, float]:
    sample = np.asarray(
        image.convert("RGB").resize((64, 36), Image.Resampling.BILINEAR),
        dtype=np.float32,
    )
    gray = sample @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    contrast = float(np.std(gray))
    sharpness = float(
        (np.mean(np.abs(np.diff(gray, axis=0))) + np.mean(np.abs(np.diff(gray, axis=1))))
        / 2.0
    )
    black_fraction = float(np.mean(gray < 12.0))
    white_fraction = float(np.mean(gray > 244.0))
    mean_rgb = np.mean(sample, axis=(0, 1))
    return mean_rgb, contrast, sharpness, black_fraction, white_fraction


def quality_score(
    contrast: float, sharpness: float, black_fraction: float, white_fraction: float
) -> float:
    if black_fraction > 0.82 or white_fraction > 0.82 or contrast < 8.0:
        return 0.0
    contrast_score = np.clip((contrast - 8.0) / 42.0, 0.0, 1.0)
    sharpness_score = np.clip((sharpness - 1.5) / 12.0, 0.0, 1.0)
    exposure_score = 1.0 - max(black_fraction, white_fraction)
    return float(0.42 * contrast_score + 0.42 * sharpness_score + 0.16 * exposure_score)


def resolve_sprite_path(review_data: Path, sprite_url: str) -> Path:
    sprite = Path(sprite_url)
    if sprite.is_absolute():
        return sprite
    if sprite.parts and sprite.parts[0] == "data":
        if review_data.parent.name == "data":
            return review_data.parent.parent / sprite
        return review_data.parent.joinpath(*sprite.parts[1:])
    return review_data.parent / sprite


def extract_features(review_data: Path, cache_dir: Path) -> Tuple[List[Dict], np.ndarray, np.ndarray]:
    metadata_path = cache_dir / "frames.json"
    feature_path = cache_dir / "features.npz"
    if metadata_path.exists() and feature_path.exists():
        frames = json.loads(metadata_path.read_text(encoding="utf-8"))
        arrays = np.load(feature_path)
        return frames, arrays["lab"], arrays["quality"]

    data = json.loads(review_data.read_text(encoding="utf-8"))
    frames: List[Dict] = []
    labs: List[np.ndarray] = []
    qualities: List[float] = []
    seen_hashes: Dict[str, set] = collections.defaultdict(set)

    for video_position, video in enumerate(data["videos"], start=1):
        columns = int(video["spriteGrid"]["columns"])
        rows = int(video["spriteGrid"]["rows"])
        capacity = columns * rows
        frame_times = video["frameTimes"]
        print(
            f"features {video_position}/{len(data['videos'])}: {video['bvid']} "
            f"({len(frame_times)} frames)",
            flush=True,
        )
        for sprite_index, sprite_url in enumerate(video["sprites"]):
            sprite_path = resolve_sprite_path(review_data, sprite_url)
            with Image.open(sprite_path) as sheet:
                sheet = ImageOps.exif_transpose(sheet).convert("RGB")
                cell_width = sheet.width // columns
                cell_height = sheet.height // rows
                start = sprite_index * capacity
                end = min(len(frame_times), start + capacity)
                for frame_index in range(start, end):
                    cell_index = frame_index - start
                    column = cell_index % columns
                    row = cell_index // columns
                    box = (
                        column * cell_width,
                        row * cell_height,
                        (column + 1) * cell_width,
                        (row + 1) * cell_height,
                    )
                    tile = sheet.crop(box)
                    mean_rgb, contrast, sharpness, black_fraction, white_fraction = frame_metrics(tile)
                    quality = quality_score(
                        contrast, sharpness, black_fraction, white_fraction
                    )
                    if quality <= 0:
                        continue
                    fingerprint = difference_hash(tile)
                    if fingerprint in seen_hashes[video["bvid"]]:
                        continue
                    seen_hashes[video["bvid"]].add(fingerprint)
                    frames.append(
                        {
                            "bvid": video["bvid"],
                            "cid": video["cid"],
                            "title": video["title"],
                            "time": frame_times[frame_index],
                            "frameIndex": frame_index,
                            "sprite": str(sprite_path),
                            "column": column,
                            "row": row,
                            "columns": columns,
                            "rows": rows,
                        }
                    )
                    labs.append(rgb_to_lab(mean_rgb))
                    qualities.append(quality)

    if not frames:
        raise RuntimeError("no usable frames found")
    cache_dir.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(
        json.dumps(frames, ensure_ascii=False), encoding="utf-8"
    )
    lab_array = np.asarray(labs, dtype=np.float32)
    quality_array = np.asarray(qualities, dtype=np.float32)
    np.savez_compressed(feature_path, lab=lab_array, quality=quality_array)
    print(f"usable frames: {len(frames)}", flush=True)
    return frames, lab_array, quality_array


def candidate_matches(
    targets: np.ndarray,
    sources: np.ndarray,
    quality: np.ndarray,
    candidate_count: int,
    chunk_size: int = 96,
) -> Tuple[np.ndarray, np.ndarray]:
    candidate_count = min(candidate_count, len(sources))
    all_indices = np.empty((len(targets), candidate_count), dtype=np.int32)
    all_costs = np.empty((len(targets), candidate_count), dtype=np.float32)
    quality_penalty = (1.0 - quality) * 18.0

    for start in range(0, len(targets), chunk_size):
        end = min(len(targets), start + chunk_size)
        delta = targets[start:end, None, :] - sources[None, :, :]
        costs = np.sqrt(np.sum(delta * delta, axis=2)) + quality_penalty[None, :]
        indices = np.argpartition(costs, candidate_count - 1, axis=1)[:, :candidate_count]
        selected_costs = np.take_along_axis(costs, indices, axis=1)
        order = np.argsort(selected_costs, axis=1)
        all_indices[start:end] = np.take_along_axis(indices, order, axis=1)
        all_costs[start:end] = np.take_along_axis(selected_costs, order, axis=1)
        print(f"matching colours: {end}/{len(targets)}", end="\r", flush=True)
    print()
    return all_indices, all_costs


def assign_frames(
    candidates: np.ndarray,
    costs: np.ndarray,
    frames: Sequence[Dict],
    target_lab: np.ndarray,
    source_lab: np.ndarray,
    quality: np.ndarray,
    columns: int,
    rows: int,
    max_reuse: int,
) -> np.ndarray:
    assignments = np.full(columns * rows, -1, dtype=np.int32)
    usage = np.zeros(len(frames), dtype=np.int16)
    video_ids: Dict[str, int] = {}
    frame_video = np.empty(len(frames), dtype=np.int16)
    for index, frame in enumerate(frames):
        if frame["bvid"] not in video_ids:
            video_ids[frame["bvid"]] = len(video_ids)
        frame_video[index] = video_ids[frame["bvid"]]
    video_source_count = np.bincount(frame_video, minlength=len(video_ids))
    video_usage = np.zeros(len(video_ids), dtype=np.int32)

    # Start with hard-to-match cells so rare colours get first choice.
    cell_order = np.argsort(costs[:, 0])[::-1]
    for processed, cell in enumerate(cell_order, start=1):
        row = int(cell // columns)
        column = int(cell % columns)
        neighbours = []
        if column > 0 and assignments[cell - 1] >= 0:
            neighbours.append(assignments[cell - 1])
        if row > 0 and assignments[cell - columns] >= 0:
            neighbours.append(assignments[cell - columns])

        best_source = -1
        best_score = float("inf")
        for rank, source in enumerate(candidates[cell]):
            source = int(source)
            if usage[source] >= max_reuse:
                continue
            score = float(costs[cell, rank]) + float(usage[source]) * 14.0
            source_video = frame_video[source]
            score += (
                float(video_usage[source_video])
                / max(1.0, float(video_source_count[source_video]))
                * 1.5
            )
            for neighbour in neighbours:
                if source == neighbour:
                    score += 1000.0
                elif frame_video[source] == frame_video[neighbour]:
                    score += 4.0
            if score < best_score:
                best_score = score
                best_source = source
        if best_source < 0:
            available = np.flatnonzero(usage < max_reuse)
            if len(available) == 0:
                available = np.flatnonzero(usage == np.min(usage))
            delta = source_lab[available] - target_lab[cell]
            fallback_cost = np.sqrt(np.sum(delta * delta, axis=1))
            fallback_cost += (1.0 - quality[available]) * 18.0
            fallback_cost += usage[available] * 14.0
            best_source = int(available[int(np.argmin(fallback_cost))])
        assignments[cell] = best_source
        usage[best_source] += 1
        video_usage[frame_video[best_source]] += 1
        if processed % 1000 == 0:
            print(f"assigning frames: {processed}/{len(cell_order)}", end="\r", flush=True)
    print()
    return assignments


def render_mosaic(
    output_dir: Path,
    frames: Sequence[Dict],
    assignments: np.ndarray,
    target_rgb: np.ndarray,
    target_lab: np.ndarray,
    source_lab: np.ndarray,
    columns: int,
    rows: int,
    tile_width: int,
) -> List[Dict]:
    tile_height = round(tile_width * 9 / 16)
    canvas = Image.new("RGB", (columns * tile_width, rows * tile_height))
    grouped: Dict[str, List[int]] = collections.defaultdict(list)
    for cell, source in enumerate(assignments):
        grouped[frames[int(source)]["sprite"]].append(cell)

    layout: List[Optional[Dict]] = [None] * len(assignments)
    rendered = 0
    for sprite_path, cells in grouped.items():
        with Image.open(sprite_path) as sheet:
            sheet = ImageOps.exif_transpose(sheet).convert("RGB")
            base_tiles: Dict[int, Image.Image] = {}
            for cell in cells:
                source = int(assignments[cell])
                frame = frames[source]
                if source not in base_tiles:
                    cell_width = sheet.width // frame["columns"]
                    cell_height = sheet.height // frame["rows"]
                    box = (
                        frame["column"] * cell_width,
                        frame["row"] * cell_height,
                        (frame["column"] + 1) * cell_width,
                        (frame["row"] + 1) * cell_height,
                    )
                    base_tiles[source] = sheet.crop(box).resize(
                        (tile_width, tile_height), Image.Resampling.LANCZOS
                    )
                delta = float(np.linalg.norm(target_lab[cell] - source_lab[source]))
                alpha = float(np.clip(0.10 + delta / 190.0, 0.12, 0.34))
                colour = tuple(int(value) for value in target_rgb[cell])
                overlay = Image.new("RGB", (tile_width, tile_height), colour)
                tile = Image.blend(base_tiles[source], overlay, alpha)
                x = (cell % columns) * tile_width
                y = (cell // columns) * tile_height
                canvas.paste(tile, (x, y))
                layout[cell] = {
                    "source": source,
                    "bvid": frame["bvid"],
                    "time": frame["time"],
                    "frameIndex": frame["frameIndex"],
                    "sheet": f"frames/{frame['bvid']}/{Path(frame['sprite']).name}",
                    "sheetColumn": frame["column"],
                    "sheetRow": frame["row"],
                    "sheetColumns": frame["columns"],
                    "sheetRows": frame["rows"],
                    "tint": round(alpha, 3),
                }
                rendered += 1
        print(f"rendering mosaic: {rendered}/{len(assignments)}", end="\r", flush=True)
    print()

    output_dir.mkdir(parents=True, exist_ok=True)
    canvas.save(output_dir / "mosaic.webp", "WEBP", quality=88, method=6)
    preview = canvas.copy()
    preview.thumbnail((1200, 1800), Image.Resampling.LANCZOS)
    preview = ImageEnhance.Sharpness(preview).enhance(1.08)
    preview.save(output_dir / "mosaic-preview.webp", "WEBP", quality=88, method=6)

    # The page loads just the native-resolution sprite sheet needed by a click.
    for sprite_path in grouped:
        source = Path(sprite_path)
        destination = output_dir / "frames" / source.parent.name / source.name
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists() or destination.stat().st_size != source.stat().st_size:
            shutil.copy2(source, destination)
    return [item for item in layout if item is not None]


def parse_args() -> argparse.Namespace:
    project_dir = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Build the Leah photo mosaic.")
    parser.add_argument("--review-data", type=Path, required=True)
    parser.add_argument("--target", type=Path, default=project_dir / "raw.webp")
    parser.add_argument("--output", type=Path, default=project_dir / "work" / "mosaic")
    parser.add_argument("--columns", type=int, default=60)
    parser.add_argument("--rows", type=int)
    parser.add_argument("--tile-width", type=int, default=64)
    parser.add_argument("--candidates", type=int, default=256)
    parser.add_argument("--max-reuse", type=int, default=2)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    review_data = args.review_data.resolve()
    target_path = args.target.resolve()
    output_dir = args.output.resolve()
    columns = max(4, args.columns)

    with Image.open(target_path) as target_image:
        target_image = ImageOps.exif_transpose(target_image).convert("RGB")
        rows = args.rows or round(
            target_image.height / target_image.width * columns * 16 / 9
        )
        target_grid = target_image.resize((columns, rows), Image.Resampling.LANCZOS)
        target_rgb = np.asarray(target_grid, dtype=np.float32).reshape(-1, 3)
        target_lab = rgb_to_lab(target_rgb)

    try:
        frames, source_lab, quality = extract_features(
            review_data, output_dir / "cache"
        )
        candidates, costs = candidate_matches(
            target_lab, source_lab, quality, max(2, args.candidates)
        )
        assignments = assign_frames(
            candidates,
            costs,
            frames,
            target_lab,
            source_lab,
            quality,
            columns,
            rows,
            max(1, args.max_reuse),
        )
        layout = render_mosaic(
            output_dir,
            frames,
            assignments,
            target_rgb,
            target_lab,
            source_lab,
            columns,
            rows,
            max(16, args.tile_width),
        )
    except (OSError, RuntimeError, KeyError, ValueError) as exc:
        print(f"mosaic build failed: {exc}", file=sys.stderr)
        return 1

    payload = {
        "version": 1,
        "target": str(target_path),
        "columns": columns,
        "rows": rows,
        "tileWidth": max(16, args.tile_width),
        "tileHeight": round(max(16, args.tile_width) * 9 / 16),
        "sourceFrameCount": len(frames),
        "layout": layout,
    }
    (output_dir / "layout.json").write_text(
        json.dumps(payload, ensure_ascii=False), encoding="utf-8"
    )
    print(
        f"done: {columns}x{rows} cells from {len(frames)} usable frames\n"
        f"preview: {output_dir / 'mosaic-preview.webp'}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
