#!/usr/bin/env python3
"""Collect low-bandwidth Bilibili preview sprites for the Leah mosaic review UI.

The script only uses public metadata, video-shot sprite sheets and danmaku XML.
It does not download the actual replay video. All responses are cached locally so
an interrupted run can be resumed without repeating successful requests.
"""

import argparse
import datetime as dt
import http.client
import json
import math
import random
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


API_ROOT = "https://api.bilibili.com"
DEFAULT_MID = 31922771
DEFAULT_SERIES_ID = 210624
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


class CollectorError(RuntimeError):
    """Raised when a remote response cannot be collected or understood."""


class Collector:
    def __init__(self, output_dir: Path, delay: float, retries: int) -> None:
        self.output_dir = output_dir
        self.cache_dir = output_dir / "cache"
        self.sprite_dir = output_dir / "sprites"
        self.delay = max(0.0, delay)
        self.retries = max(1, retries)
        self._last_request_at = 0.0
        self._ssl_context = ssl.create_default_context()

    def _wait_for_rate_limit(self) -> None:
        elapsed = time.monotonic() - self._last_request_at
        remaining = self.delay - elapsed
        if remaining > 0:
            time.sleep(remaining)

    def _download(self, url: str, target: Path, binary: bool = True) -> bytes:
        if target.exists() and target.stat().st_size > 0:
            return target.read_bytes()

        target.parent.mkdir(parents=True, exist_ok=True)
        headers = {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.bilibili.com/",
            "Accept": "*/*",
        }
        request = urllib.request.Request(url, headers=headers)
        last_error: Optional[BaseException] = None

        for attempt in range(1, self.retries + 1):
            try:
                self._wait_for_rate_limit()
                with urllib.request.urlopen(
                    request, timeout=30, context=self._ssl_context
                ) as response:
                    payload = response.read()
                self._last_request_at = time.monotonic()
                if not payload:
                    raise CollectorError(f"empty response: {url}")
                target.write_bytes(payload)
                return payload
            except (
                urllib.error.URLError,
                http.client.IncompleteRead,
                TimeoutError,
                CollectorError,
            ) as exc:
                last_error = exc
                if attempt < self.retries:
                    time.sleep(min(8.0, 1.5 * attempt + random.random()))

        kind = "binary" if binary else "text"
        raise CollectorError(f"failed to download {kind} after retries: {url}") from last_error

    def fetch_json(self, url: str, cache_name: str) -> Dict:
        payload = self._download(url, self.cache_dir / cache_name, binary=False)
        try:
            response = json.loads(payload.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise CollectorError(f"invalid JSON response: {url}") from exc
        if response.get("code") != 0:
            raise CollectorError(
                f"Bilibili API error {response.get('code')}: {response.get('message')}"
            )
        return response["data"]

    def fetch_text(self, url: str, cache_name: str) -> str:
        payload = self._download(url, self.cache_dir / cache_name, binary=False)
        try:
            return payload.decode("utf-8")
        except UnicodeDecodeError:
            # Bilibili's legacy danmaku endpoint returns raw DEFLATE data even
            # when the client does not advertise compression support.
            try:
                return zlib.decompress(payload, -zlib.MAX_WBITS).decode("utf-8")
            except (zlib.error, UnicodeDecodeError) as exc:
                raise CollectorError(f"invalid UTF-8 response: {url}") from exc

    def fetch_series(self, mid: int, series_id: int, limit: int) -> List[Dict]:
        archives: List[Dict] = []
        page_size = min(100, max(1, limit))
        page = 1
        while len(archives) < limit:
            query = urllib.parse.urlencode(
                {
                    "mid": mid,
                    "series_id": series_id,
                    "only_normal": "true",
                    "sort": "desc",
                    "pn": page,
                    "ps": page_size,
                }
            )
            data = self.fetch_json(
                f"{API_ROOT}/x/series/archives?{query}",
                f"series-{mid}-{series_id}-page-{page}.json",
            )
            batch = data.get("archives", [])
            archives.extend(batch)
            if not batch or len(archives) >= data.get("page", {}).get("total", 0):
                break
            page += 1
        return archives[:limit]

    def fetch_bvids(self, bvids: Sequence[str]) -> List[Dict]:
        archives: List[Dict] = []
        for bvid in bvids:
            view = self.fetch_view(bvid)
            archives.append(
                {
                    "aid": view["aid"],
                    "bvid": bvid,
                    "title": view["title"],
                    "pubdate": view["pubdate"],
                    "duration": view["duration"],
                }
            )
        return archives

    def fetch_view(self, bvid: str) -> Dict:
        query = urllib.parse.urlencode({"bvid": bvid})
        return self.fetch_json(
            f"{API_ROOT}/x/web-interface/view?{query}", f"view-{bvid}.json"
        )

    def fetch_videoshot(self, bvid: str, cid: int) -> Dict:
        query = urllib.parse.urlencode({"bvid": bvid, "cid": cid, "index": 1})
        return self.fetch_json(
            f"{API_ROOT}/x/player/videoshot?{query}", f"videoshot-{bvid}-{cid}.json"
        )

    def fetch_danmaku_times(self, cid: int) -> List[float]:
        try:
            xml = self.fetch_text(
                f"{API_ROOT}/x/v1/dm/list.so?oid={cid}", f"danmaku-{cid}.xml"
            )
        except CollectorError as exc:
            print(f"  warning: danmaku unavailable ({exc})", file=sys.stderr, flush=True)
            return []

        times: List[float] = []
        for match in re.finditer(r'<d\s+p="([^,]+),', xml):
            try:
                times.append(float(match.group(1)))
            except ValueError:
                continue
        return times

    def fetch_sprites(self, bvid: str, urls: Sequence[str]) -> List[str]:
        local_urls: List[str] = []
        for position, remote_url in enumerate(urls, start=1):
            if remote_url.startswith("//"):
                remote_url = "https:" + remote_url
            suffix = Path(urllib.parse.urlparse(remote_url).path).suffix or ".jpg"
            relative = Path("sprites") / bvid / f"{position:04d}{suffix}"
            target = self.output_dir / relative
            print(f"  sprite {position}/{len(urls)}: {target.name}", flush=True)
            self._download(remote_url, target)
            local_urls.append("data/" + relative.as_posix())
        return local_urls


def nearest_frame(frame_times: Sequence[int], target: float) -> int:
    if not frame_times:
        return 0
    low = 0
    high = len(frame_times)
    while low < high:
        middle = (low + high) // 2
        if frame_times[middle] < target:
            low = middle + 1
        else:
            high = middle
    if low == 0:
        return 0
    if low == len(frame_times):
        return len(frame_times) - 1
    before = frame_times[low - 1]
    after = frame_times[low]
    return low - 1 if target - before <= after - target else low


def make_candidates(
    frame_times: Sequence[int],
    duration: int,
    danmaku_times: Sequence[float],
    uniform_count: int,
    hot_count: int,
) -> Tuple[List[Dict], List[Dict]]:
    reasons: Dict[int, set] = {}

    if frame_times:
        for step in range(uniform_count):
            target = duration * (step + 0.5) / uniform_count
            index = nearest_frame(frame_times, target)
            reasons.setdefault(index, set()).add("uniform")

    bin_size = 60
    bin_count = max(1, math.ceil(max(1, duration) / bin_size))
    bins = [0] * bin_count
    for timestamp in danmaku_times:
        position = min(bin_count - 1, max(0, int(timestamp // bin_size)))
        bins[position] += 1

    ranked_bins = sorted(range(bin_count), key=lambda item: bins[item], reverse=True)
    hot_spots: List[Dict] = []
    selected_bins: List[int] = []
    for bin_index in ranked_bins:
        if bins[bin_index] <= 0:
            break
        if any(abs(bin_index - selected) < 3 for selected in selected_bins):
            continue
        selected_bins.append(bin_index)
        timestamp = min(duration, bin_index * bin_size + bin_size / 2)
        frame_index = nearest_frame(frame_times, timestamp)
        reasons.setdefault(frame_index, set()).add("danmaku")
        hot_spots.append(
            {
                "time": round(timestamp),
                "count": bins[bin_index],
                "frameIndex": frame_index,
            }
        )
        if len(hot_spots) >= hot_count:
            break

    candidates = [
        {"frameIndex": index, "reasons": sorted(values)}
        for index, values in sorted(reasons.items())
    ]
    return candidates, hot_spots


def normalise_frame_times(raw_times: Iterable, capacity: int) -> List[int]:
    times: List[int] = []
    for value in raw_times:
        try:
            times.append(round(float(value)))
        except (TypeError, ValueError):
            continue
    if len(times) > capacity:
        # The videoshot endpoint usually prefixes the real frame list with a 0 sentinel.
        times = times[-capacity:]
    return times


def iso_datetime(timestamp: int) -> str:
    timezone = dt.timezone(dt.timedelta(hours=8))
    return dt.datetime.fromtimestamp(timestamp, timezone).isoformat()


def collect_video(
    collector: Collector,
    archive: Dict,
    uniform_count: int,
    hot_count: int,
) -> Dict:
    bvid = archive["bvid"]
    print(f"collecting {bvid}: {archive['title']}", flush=True)
    view = collector.fetch_view(bvid)
    page = view.get("pages", [{}])[0]
    cid = int(page.get("cid") or view["cid"])
    videoshot = collector.fetch_videoshot(bvid, cid)
    remote_sprites = videoshot.get("image", [])
    columns = int(videoshot.get("img_x_len") or 10)
    rows = int(videoshot.get("img_y_len") or 10)
    sprite_capacity = columns * rows
    duration = int(view.get("duration") or archive.get("duration") or 0)
    frame_times = normalise_frame_times(
        videoshot.get("index", []), len(remote_sprites) * sprite_capacity
    )
    if remote_sprites and not frame_times:
        # Some newer HD preview responses omit the timestamp array even though
        # their sprite sheets are complete. Their cells are uniformly spaced.
        frame_count = len(remote_sprites) * sprite_capacity
        frame_times = [round(duration * index / frame_count) for index in range(frame_count)]
    if not remote_sprites or not frame_times:
        raise CollectorError(f"no preview sprites returned for {bvid}")

    sprites = collector.fetch_sprites(bvid, remote_sprites)
    danmaku_times = collector.fetch_danmaku_times(cid)
    duration = duration or frame_times[-1]
    candidates, hot_spots = make_candidates(
        frame_times, duration, danmaku_times, uniform_count, hot_count
    )

    return {
        "aid": archive["aid"],
        "bvid": bvid,
        "cid": cid,
        "title": archive["title"],
        "publishedAt": iso_datetime(int(archive["pubdate"])),
        "duration": duration,
        "url": f"https://www.bilibili.com/video/{bvid}",
        "dimensions": view.get("dimension", {}),
        "danmakuCount": len(danmaku_times),
        "spriteGrid": {"columns": columns, "rows": rows},
        "sprites": sprites,
        "frameTimes": frame_times,
        "candidates": candidates,
        "hotSpots": hot_spots,
    }


def parse_args() -> argparse.Namespace:
    project_dir = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Collect Bilibili preview sprites for the local Leah review page."
    )
    parser.add_argument("--mid", type=int, default=DEFAULT_MID)
    parser.add_argument("--series-id", type=int, default=DEFAULT_SERIES_ID)
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--uniform", type=int, default=36)
    parser.add_argument("--hot", type=int, default=12)
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--retries", type=int, default=4)
    parser.add_argument(
        "--bvid-file",
        type=Path,
        help="JSON file containing a top-level bvids array; bypasses series lookup.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=project_dir / "review" / "data",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.limit <= 0:
        print("--limit must be positive", file=sys.stderr)
        return 2

    output_dir = args.output.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    collector = Collector(output_dir, args.delay, args.retries)

    try:
        source_url = (
            f"https://space.bilibili.com/{args.mid}/lists/"
            f"{args.series_id}?type=series"
        )
        source_name = "Bilibili series"
        if args.bvid_file:
            source = json.loads(args.bvid_file.resolve().read_text(encoding="utf-8"))
            excluded_bvids = set(source.get("excludedBvids", []))
            bvids = [
                bvid for bvid in source.get("bvids", []) if bvid not in excluded_bvids
            ]
            if not bvids or not all(isinstance(item, str) for item in bvids):
                raise CollectorError("--bvid-file must contain a non-empty bvids array")
            archives = collector.fetch_bvids(bvids[: args.limit])
            source_url = source.get("sourceUrl", source_url)
            source_name = source.get("name", args.bvid_file.stem)
        else:
            archives = collector.fetch_series(args.mid, args.series_id, args.limit)
        videos = [
            collect_video(collector, archive, args.uniform, args.hot)
            for archive in archives
        ]
    except (CollectorError, KeyError, ValueError) as exc:
        print(f"collector failed: {exc}", file=sys.stderr)
        return 1

    payload = {
        "version": 1,
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "series": {
            "name": source_name,
            "mid": args.mid,
            "seriesId": args.series_id,
            "sourceUrl": source_url,
        },
        "videos": videos,
    }
    destination = output_dir / "review-data.json"
    destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    total_bytes = sum(
        path.stat().st_size for path in (output_dir / "sprites").rglob("*") if path.is_file()
    )
    print(
        f"done: {len(videos)} videos, {total_bytes / 1024 / 1024:.1f} MiB sprites\n"
        f"data: {destination}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
