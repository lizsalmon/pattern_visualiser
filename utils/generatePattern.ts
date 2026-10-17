// Row-major cells; each cell holds its 0/1 value per frame (shape expected by validateGrid / the animator).

export type PatternType =
  | 'straight-left-right'
  | 'straight-right-left'
  | 'straight-top-bottom'
  | 'straight-bottom-top'
  | 'straight-diagonal-tl-br'
  | 'straight-alternating-rows'
  | 'straight-clap-centre'
  | 'straight-clap-left'
  | 'straight-clap-right'
  | 'straight-clap-sequence'
  | 'corner-curve'
  | 'corner-curve-ripple'
  | 'sine-wave'
  | 'corner-scatter'
  | 'duck-swim'
  | 'duck-swim-solo'
  | 'ball-bounce'
  | 'firework-bursts'
  | 'microbit-logo'

export interface PatternOption {
  id: PatternType
  label: string
}

export const PATTERN_OPTIONS: PatternOption[] = [
  { id: 'straight-left-right', label: 'Straight: Left → Right' },
  { id: 'straight-right-left', label: 'Straight: Right → Left' },
  { id: 'straight-top-bottom', label: 'Straight: Top → Bottom' },
  { id: 'straight-bottom-top', label: 'Straight: Bottom → Top' },
  { id: 'straight-diagonal-tl-br', label: 'Straight: Diagonal (Top-Left → Bottom-Right)' },
  { id: 'straight-alternating-rows', label: 'Straight: Alternating Rows' },
  { id: 'straight-clap-centre', label: 'Straight: Centre Clap' },
  { id: 'straight-clap-left', label: 'Straight: Left Clap' },
  { id: 'straight-clap-right', label: 'Straight: Right Clap' },
  { id: 'straight-clap-sequence', label: 'Straight: Clap Sequence (Centre → Left → Right)' },
  { id: 'corner-curve', label: 'Corner Curve' },
  { id: 'corner-curve-ripple', label: 'Corner Curve Ripple' },
  { id: 'sine-wave', label: 'Sine Wave' },
  { id: 'corner-scatter', label: 'Corner Scatter' },
  { id: 'duck-swim', label: 'Duck Swim' },
  { id: 'duck-swim-solo', label: 'Duck Swim (Solo)' },
  { id: 'ball-bounce', label: 'Ball Bounce' },
  { id: 'firework-bursts', label: 'Firework Bursts' },
  { id: 'microbit-logo', label: 'micro:bit Logo' },
]

type LitPredicate = (row: number, col: number) => boolean

/** Generates frame-based cell data for a pattern type and grid size. */
export function generatePattern(type: PatternType, rows: number, cols: number): number[][] {
  const frames = buildFrameSequence(type, rows, cols)
  const cells: number[][] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push(frames.map((frame) => (frame(row, col) ? 1 : 0)))
    }
  }
  return cells
}

function buildFrameSequence(type: PatternType, rows: number, cols: number): LitPredicate[] {
  switch (type) {
    case 'straight-left-right':
      return sequence(cols, (f) => (_row, col) => col === f)
    case 'straight-right-left':
      return sequence(cols, (f) => (_row, col) => col === cols - 1 - f)
    case 'straight-top-bottom':
      return sequence(rows, (f) => (row) => row === f)
    case 'straight-bottom-top':
      return sequence(rows, (f) => (row) => row === rows - 1 - f)
    case 'straight-diagonal-tl-br':
      return sequence(rows + cols - 1, (f) => (row, col) => row + col === f)
    case 'straight-alternating-rows':
      return sequence(cols, (f) => (row, col) => col === (row % 2 === 0 ? f : cols - 1 - f))
    case 'straight-clap-centre':
      return clapCentre(cols)
    case 'straight-clap-left':
      return asymmetricClap(cols, 'left')
    case 'straight-clap-right':
      return asymmetricClap(cols, 'right')
    case 'straight-clap-sequence':
      return [...clapCentre(cols), ...asymmetricClap(cols, 'left'), ...asymmetricClap(cols, 'right')]
    case 'corner-curve':
      return cornerCurve(rows, cols)
    case 'corner-curve-ripple':
      return cornerCurveRipple(rows, cols)
    case 'sine-wave':
      return sineWave(rows, cols)
    case 'corner-scatter':
      return cornerScatter(rows, cols)
    case 'duck-swim':
      return duckSwim(rows, cols)
    case 'duck-swim-solo':
      return spriteSwim(rows, cols, DUCK_SPRITE)
    case 'ball-bounce':
      return ballBounce(rows, cols)
    case 'firework-bursts':
      return fireworkBursts(rows, cols)
    case 'microbit-logo':
      return microbitLogo(rows, cols)
    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unknown pattern type: ${exhaustiveCheck as string}`)
    }
  }
}

// At least one frame even if count <= 0.
function sequence(count: number, factory: (frameIndex: number) => LitPredicate): LitPredicate[] {
  return Array.from({ length: Math.max(count, 1) }, (_, f) => factory(f))
}

function clamp(value: number, max: number, min = 0): number {
  return Math.min(Math.max(value, min), max)
}

// Two hands start at the outer edges and converge, bouncing back out (ping-pong).
function clapCentre(cols: number): LitPredicate[] {
  const half = Math.ceil(cols / 2)
  return pingPong(half).map((s) => (_row: number, col: number) => col === s || col === cols - 1 - s)
}

// One hand moves at normal speed; the other covers half the distance in the same
// time (holding each column for 2 frames), so the meeting point sits twice as
// close to the slow hand's edge. `slowSide` is which edge the slow hand starts from.
function asymmetricClap(cols: number, slowSide: 'left' | 'right'): LitPredicate[] {
  // Slow hand covers d, fast hand covers 2d, together spanning the full width: d = (cols - 1) / 3.
  const d = Math.max(1, Math.round((cols - 1) / 3))
  const fastPositions = pingPong(2 * d + 1)
  const slowPositions = repeatEach(pingPong(d + 1), 2)

  return fastPositions.map((fastStep, i) => {
    const slowStep = slowPositions[i]
    return (_row: number, col: number) => {
      const slowHand = clamp(slowSide === 'left' ? slowStep : cols - 1 - slowStep, cols - 1)
      const fastHand = clamp(slowSide === 'left' ? cols - 1 - fastStep : fastStep, cols - 1)
      return col === slowHand || col === fastHand
    }
  })
}

// e.g. repeatEach([0, 1, 2], 2) -> [0, 0, 1, 1, 2, 2].
function repeatEach(arr: number[], times: number): number[] {
  return arr.flatMap((value) => Array(times).fill(value))
}

// A single rounded wavefront expanding from the top-left corner; loops once it reaches the far edge.
function cornerCurve(rows: number, cols: number): LitPredicate[] {
  const maxRadius = Math.round(Math.hypot(rows - 1, cols - 1))
  return sequence(maxRadius + 1, (f) => (row, col) => Math.round(Math.hypot(row, col)) === f)
}

// Like cornerCurve, but spawns a new concentric wave every `spacing` frames and
// stops once the ripple has filled the canvas instead of looping.
function cornerCurveRipple(rows: number, cols: number): LitPredicate[] {
  const maxRadius = Math.round(Math.hypot(rows - 1, cols - 1))
  const spacing = 4
  return sequence(maxRadius + 2, (f) => (row, col) => {
    if (f === 0) return false
    const t = f - 1
    const dist = Math.round(Math.hypot(row, col))
    const framesSinceNearestWave = t - dist
    return framesSinceNearestWave >= 0 && framesSinceNearestWave % spacing === 0
  })
}

// Single-pixel sine curve scrolling sideways; one full cycle across the width, looping after `cols` frames.
function sineWave(rows: number, cols: number): LitPredicate[] {
  const amplitude = (rows - 1) / 2
  const centreRow = (rows - 1) / 2
  return sequence(cols, (f) => (row, col) => {
    const angle = ((col - f) / cols) * 2 * Math.PI
    return row === Math.round(centreRow - amplitude * Math.sin(angle))
  })
}

// BBC micro:bit "duck" icon
const DUCK_SPRITE: readonly (readonly number[])[] = [
  [0, 0, 1, 1, 0],
  [0, 0, 1, 1, 1],
  [1, 1, 1, 1, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
]

const DUCKLING_SPRITE: readonly (readonly number[])[] = [
  [0, 1],
  [1, 1],
]

const DUCK_FAMILY_GAP = -1 // columns between mother and first duckling
const DUCKLING_GAP = 2 // columns between each duckling

// Moves a sprite across the grid, fully off-screen to fully off-screen, vertically centred.
function spriteSwim(rows: number, cols: number, sprite: readonly (readonly number[])[]): LitPredicate[] {
  const spriteSize = sprite.length
  const rowOffset = Math.floor((rows - spriteSize) / 2)
  return sequence(cols + spriteSize + 1, (f) => (row, col) => {
    const colOffset = f - spriteSize
    const r = row - rowOffset
    const c = col - colOffset
    if (r < 0 || r >= spriteSize || c < 0 || c >= spriteSize) return false
    return sprite[r][c] === 1
  })
}

// Mother duck swims across with 3 ducklings trailing in a line.
function duckSwim(rows: number, cols: number): LitPredicate[] {
  const motherSize = DUCK_SPRITE.length
  const babySize = DUCKLING_SPRITE.length
  const motherRowOffset = Math.floor((rows - motherSize) / 2)
  const babyRowOffset = Math.floor((rows - babySize) / 2) + 1

  const lags = [1, 2, 3].map((i) => motherSize + DUCK_FAMILY_GAP + (i - 1) * (babySize + DUCKLING_GAP))
  const maxLag = lags[lags.length - 1]

  return sequence(cols + motherSize + 1 + maxLag, (f) => (row, col) => {
    const motherColOffset = f - motherSize
    const mRow = row - motherRowOffset
    const mCol = col - motherColOffset
    if (mRow >= 0 && mRow < motherSize && mCol >= 0 && mCol < motherSize && DUCK_SPRITE[mRow][mCol] === 1) {
      return true
    }
    const bRow = row - babyRowOffset
    for (const lag of lags) {
      const bCol = col - (motherColOffset - lag)
      if (bRow >= 0 && bRow < babySize && bCol >= 0 && bCol < babySize && DUCKLING_SPRITE[bRow][bCol] === 1) {
        return true
      }
    }
    return false
  })
}

// micro:bit v2 touch logo: a hollow oval shape with two eye dots.
const LOGO_WIDTH = 17
const LOGO_HEIGHT = 9

// Traces the oval outline clockwise from the top-left, deduplicating repeated points.
function buildLogoOutline(width: number, height: number): (readonly [number, number])[] {
  const r = (height - 1) / 2
  const centreRow = r
  const leftCapCol = r
  const rightCapCol = width - 1 - r
  const points: (readonly [number, number])[] = []
  const push = (row: number, col: number) => {
    const last = points[points.length - 1]
    if (!last || last[0] !== row || last[1] !== col) points.push([row, col])
  }

  for (let col = leftCapCol; col <= rightCapCol; col++) push(0, col)

  const capSteps = Math.max(1, Math.round(r * 8))
  for (let i = 0; i <= capSteps; i++) {
    const angle = (i / capSteps) * Math.PI
    push(Math.round(centreRow - r * Math.cos(angle)), Math.round(rightCapCol + r * Math.sin(angle)))
  }

  for (let col = rightCapCol; col >= leftCapCol; col--) push(height - 1, col)

  for (let i = 0; i <= capSteps; i++) {
    const angle = Math.PI - (i / capSteps) * Math.PI
    push(Math.round(centreRow - r * Math.cos(angle)), Math.round(leftCapCol - r * Math.sin(angle)))
  }

  const first = points[0]
  const last = points[points.length - 1]
  if (points.length > 1 && first[0] === last[0] && first[1] === last[1]) points.pop()
  return points
}

const LOGO_OUTLINE: readonly (readonly [number, number])[] = buildLogoOutline(LOGO_WIDTH, LOGO_HEIGHT)

const LOGO_EYES: readonly (readonly [number, number])[] = [
  [(LOGO_HEIGHT - 1) / 2, (LOGO_HEIGHT - 1) / 2],
  [(LOGO_HEIGHT - 1) / 2, LOGO_WIDTH - 1 - (LOGO_HEIGHT - 1) / 2],
]

const LOGO_FLASH_COUNT = 1

// A single cell races around the outline, then the whole logo flashes once before looping.
function microbitLogo(rows: number, cols: number): LitPredicate[] {
  const rowOffset = Math.floor((rows - LOGO_HEIGHT) / 2)
  const colOffset = Math.floor((cols - LOGO_WIDTH) / 2)
  const numOutlineFrames = LOGO_OUTLINE.length
  const numFrames = numOutlineFrames + LOGO_FLASH_COUNT * 2
  return sequence(numFrames, (f) => (row, col) => {
    const r = row - rowOffset
    const c = col - colOffset
    if (r < 0 || r >= LOGO_HEIGHT || c < 0 || c >= LOGO_WIDTH) return false
    if (f < numOutlineFrames) {
      const [br, bc] = LOGO_OUTLINE[f]
      return br === r && bc === c
    }
    if ((f - numOutlineFrames) % 2 !== 0) return false // flash off on odd steps
    for (const [lr, lc] of LOGO_OUTLINE) if (lr === r && lc === c) return true
    for (const [er, ec] of LOGO_EYES) if (er === r && ec === c) return true
    return false
  })
}

// Fills outward from the corner like cornerCurve, but each cell's activation time
// is jittered by a deterministic hash so the edge looks ragged rather than a clean curve.
function cornerScatter(rows: number, cols: number): LitPredicate[] {
  const maxRadius = Math.round(Math.hypot(rows - 1, cols - 1))
  const jitterAmplitude = Math.max(1, Math.round(maxRadius / 4))
  const numFrames = maxRadius + jitterAmplitude + 1
  return sequence(numFrames + 1, (f) => {
    if (f === 0) return () => false
    const t = f - 1
    return (row, col) => {
      const jitter = (pseudoRandom(row, col) * 2 - 1) * jitterAmplitude
      const activationFrame = clamp(Math.round(Math.hypot(row, col) + jitter), numFrames - 1)
      return activationFrame <= t
    }
  })
}

// Deterministic hash producing a pseudo-random value in [0, 1) for a given (row, col).
function pseudoRandom(row: number, col: number): number {
  const seed = Math.sin(row * 374761393 + col * 668265263) * 43758.5453
  return seed - Math.floor(seed)
}

const FIREWORK_COUNT = 5
const FIREWORK_RADIUS = 2 // rings per burst, kept small so each firework stays tiny
const FIREWORK_INTERVAL = FIREWORK_RADIUS + 2 // frames between each firework's start

// Small bursts (expanding rings, like cornerCurve centred on a random cell) pop off
// one at a time at deterministic random positions, then disappear.
function fireworkBursts(rows: number, cols: number): LitPredicate[] {
  const totalFrames = FIREWORK_COUNT * FIREWORK_INTERVAL
  const bursts = Array.from({ length: FIREWORK_COUNT }, (_, i) => ({
    startFrame: i * FIREWORK_INTERVAL,
    originRow: Math.floor(pseudoRandom(i, 0) * rows),
    originCol: Math.floor(pseudoRandom(i, 1) * cols),
  }))
  return sequence(totalFrames, (f) => (row, col) => {
    for (const burst of bursts) {
      const t = (((f - burst.startFrame) % totalFrames) + totalFrames) % totalFrames
      if (t > FIREWORK_RADIUS) continue
      if (Math.round(Math.hypot(row - burst.originRow, col - burst.originCol)) === t) return true
    }
    return false
  })
}

const BALL_SIZE = 2

// A 2x2 ball bounces diagonally off each wall independently (DVD-logo style).
// Loops after the lowest common multiple of both axes' bounce cycle lengths.
function ballBounce(rows: number, cols: number): LitPredicate[] {
  const rowPath = pingPong(Math.max(1, rows - BALL_SIZE + 1))
  const colPath = pingPong(Math.max(1, cols - BALL_SIZE + 1))
  const numFrames = lcm(rowPath.length, colPath.length)
  return sequence(numFrames, (f) => (row, col) => {
    const ballRow = rowPath[f % rowPath.length]
    const ballCol = colPath[f % colPath.length]
    return row >= ballRow && row < ballRow + BALL_SIZE && col >= ballCol && col < ballCol + BALL_SIZE
  })
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b
}

// Forward-then-backward index sequence for a smooth bounce loop, e.g. n=4 -> [0,1,2,3,2,1].
function pingPong(n: number): number[] {
  if (n <= 1) return [0]
  const forward = Array.from({ length: n }, (_, i) => i)
  const backward = Array.from({ length: n - 2 }, (_, i) => n - 2 - i)
  return [...forward, ...backward]
}
