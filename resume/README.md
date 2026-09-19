# 简历维护

## 0812 历史版本

`0812.html` 按用户提供的 `【简历】Hunter-0812.pdf` 恢复，保留该版本的姓名、内容和样式。

导出命令（需要 Node.js、Playwright/Chromium 和 Poppler 的 `pdfinfo`）：

```bash
node resume/export-single-page-pdf.mjs resume/0812.html /tmp/resume-0812-restored.pdf
```

2026-09-20 验证：导出 PDF 为 1 页，900 × 1733 CSS 像素；与参考 PDF 的文本及 1800 像素渲染图完全一致。原版采用自适应高度的单页长版式。

## 0920 当前版本

源文件：`0920.html`；导出文件：`output/pdf/【简历】华嘉炜-0920.pdf`。

```bash
node resume/export-single-page-pdf.mjs resume/0920.html 'output/pdf/【简历】华嘉炜-0920.pdf'
```

2026-09-20 修正：消除重复用词和动宾搭配问题，统一日期与中英文间距；将“目标 L8”保留为晋升发展目标，避免表述为已完成晋升；教育信息在窄屏允许换行，响应式规则仅作用于屏幕，打印时避免标题孤行和整个工作经历区域被强制挪页。

验证：PDF 为单页长版式（900 × 1787 CSS 像素，非 A4），已检查整页渲染，无截断和重叠；PDF 全文与 HTML 正文在忽略空白及列表符号后完全一致；320、375、640、900 像素视口均无横向溢出，邮箱和电话链接正确，浏览器无脚本错误，文案标点检查通过。

内部业绩、横评口径和晋升状态无法仅凭这些文件独立验证，沿用用户提供的数据；待用户补充的事项记入 `docs/todo.txt`。
