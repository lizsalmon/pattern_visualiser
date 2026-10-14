# LED Grid Animator

A small Nuxt 3 + Vue + Tailwind app for previewing frame-based LED grid
animations.

- Enter **Rows** and **Columns** to define an `rows x cols` grid.
- Paste a JSON array of cells: the **outer array has one entry per cell**
  (length `rows*cols`, in row-major order), and **each inner array is that
  cell's value over time** (one `0`/`1` per frame, same length for every
  cell), e.g.

  ```json
  [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
  ```

  This represents a 2x2 grid (4 cells) animated over 4 frames, where cell 1
  is on in frame 1, cell 2 is on in frame 2, and so on — a single cell
  lights up in turn.
- The input is validated live: JSON errors, a cell count that doesn't match
  `rows*cols`, inconsistent frame counts across cells, and non-0/1 values
  are all reported inline. The grid and playback controls only appear once
  the input is valid.
- Rather than hand-writing JSON, pick a **Pattern** from the dropdown and
  click **Generate** to fill the cells field for the current rows/cols.
  Available patterns:
  - Wave: Left → Right / Right → Left
  - Wave: Top → Down / Bottom → Up
  - Wave: Diagonal (Top-Left → Bottom-Right) / Diagonal (Top-Right → Bottom-Left)
  - Bounce: Horizontal / Vertical (sweeps forward then back, looping smoothly)
- Use **Play/Pause**, **Prev/Next**, and the **speed (frames per second)**
  field to control the animation. Editing the speed while playing
  automatically pauses playback.

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the dev server on `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build for production:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```

## Deployment

This app is deployed to [GitHub Pages](https://pages.github.com/) as a static
site generated via `npm run generate`.

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it automatically. The site is served from a subpath
(`app.baseURL` in `nuxt.config.ts`), matching the GitHub Pages project-page
URL: `https://<owner>.github.io/pattern-visualiser/`.

To preview the generated static output locally:

```bash
npm run generate
npx serve .output/public
```
