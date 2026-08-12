# Leah 五周年照片马赛克

这一目录包含周年页面素材，以及一个本地直播选片工具。选片工具只读取 B 站公开的
视频元数据、播放器进度预览精灵图和弹幕时间，不下载完整直播回放。

## 生成最近三场小样

在仓库根目录运行：

```bash
python3 leah5years/tools/collect_review.py --limit 3
python3 -m http.server 8000 --bind 127.0.0.1
```

然后打开：

```text
http://localhost:8000/leah5years/review/
```

采集结果保存在 `leah5years/review/data/`，已被 `.gitignore` 忽略。脚本会缓存所有成功
请求；中断后重新执行即可续跑，不会重复下载已有文件。

## 挑选方式

- 首页每场展示约 36 个均匀时间点，并额外标记最多 12 个弹幕高峰。
- 点击画面可以展开它前后约三分钟的全部预览。
- 点击右上角心形收藏画面；选择结果自动保存在浏览器 `localStorage`。
- 点击“导出 selections.json”保存结果，供后续高清抽帧脚本使用。

## 扩展到最近一年

小样确认后，可以提高 `--limit`，也可以通过后续脚本按发布日期限制到最近一年：

```bash
python3 leah5years/tools/collect_review.py --limit 300
```

不要一开始就运行全年采集。先用三场确认页面操作和 B 站接口稳定，再分批扩大。

## 从“莉娅素材”收藏夹生成正式马赛克

收藏夹中的 9 个视频记录在 `sources/favorites.json`。采集全部低流量预览：
`excludedBvids` 记录永久排除的视频，后续合并其他来源时也不得加入。

```bash
python3 leah5years/tools/collect_review.py \
  --bvid-file leah5years/sources/favorites.json \
  --limit 9 \
  --output leah5years/work/favorites
```

使用 Codex 工作区自带的 Pillow/NumPy 运行自动选图和构图：

```bash
/Users/huajiawei/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  leah5years/tools/build_mosaic.py \
  --review-data leah5years/work/favorites/review-data.json \
  --target leah5years/raw.webp \
  --output leah5years/work/mosaic \
  --columns 60 \
  --tile-width 64
```

匹配器会剔除黑屏、纯色和低对比画面，用感知哈希合并重复帧，再按 Lab 色彩距离、
画面质量、相邻重复和视频多样性安排 `60 × 160` 个横版格子。同一画面最多使用两次。

正式页面使用以下生成产物：

- `static/img/mosaic-preview.webp`：首屏流畅预览。
- `static/img/mosaic.webp`：3840 × 5760 高清马赛克。
- `static/data/layout.json`：每一格到 B 站视频时间点的映射。
- `static/data/videos.json`：视频标题与发布时间。
- `static/data/memory-map.js`：支持 GitHub Pages 与直接双击 `index.html` 的浏览器映射数据。
- `static/frames/`：点击格子时按需加载的原始 480 × 270 截图图集。
