# 简历维护

## 0812 历史版本

`0812.html` 按用户提供的 `【简历】Hunter-0812.pdf` 恢复，保留该版本的姓名、内容和样式。

导出命令（需要 Node.js、Playwright/Chromium 和 Poppler 的 `pdfinfo`）：

```bash
node resume/export-single-page-pdf.mjs resume/0812.html /tmp/resume-0812-restored.pdf
```

2026-09-20 验证：导出 PDF 为 1 页，900 × 1733 CSS 像素；与参考 PDF 的文本及 1800 像素渲染图完全一致。原版采用自适应高度的单页长版式。
