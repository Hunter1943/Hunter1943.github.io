# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static GitHub Pages personal website hosted at `Hunter1943.github.io`. No build tools, package managers, or frameworks — pure HTML/CSS/JavaScript served directly. Deployed automatically on push to `master`.

## Development

No build or install step. Open HTML files directly in a browser or use any local static server:

```
python3 -m http.server 8000
```

There are no tests, linters, or CI pipelines.

## Architecture

Each top-level directory is a self-contained mini-project with its own `index.html`, `static/` assets, and no shared dependencies between projects.

- **`/index.html`** — Professional resume/CV (Chinese). Inline CSS with glassmorphic design, CSS variables, responsive grid layout. Uses Google Fonts (Inter).
- **`birth/`** — 3D scene built with Three.js and FirstPersonControls. The Three.js library is vendored in `static/js/`.
- **`leah2024/`** — Grid-based puzzle game (Genshin Impact themed). Scoring logic in `score.js` with increasing difficulty across 7 levels. Fireworks animation via Canvas on completion.
- **`leah2026/`** — Multi-page birthday experience: narrative story (`index.html`), puzzle game (`puzzle.html`), and 3D anamorphic Canvas visualization (`anamorphic/index.html`) with custom pixel font rendering and WASD/mouse controls.
- **`testCodeGen/`** — AI-generated UI component demo.

## Conventions

- All styling is done via inline `<style>` tags in HTML files — no external CSS frameworks.
- JavaScript is vanilla with simple object-based modules (e.g., `Step0 = { data: {...}, init: function() {...} }`). No transpilation.
- Content is primarily in Chinese.
- No shared asset pipeline between projects; each directory is fully independent.
