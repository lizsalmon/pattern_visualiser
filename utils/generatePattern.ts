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
  | 'standing-wave'
  | 'progressive-sine-wave'
  | 'corner-scatter'
  | 'duck-swim-small'
  | 'duck-swim-small-solo'
  | 'duck-swim-big'
  | 'duck-swim-big-solo'
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
  { id: 'standing-wave', label: 'Standing Wave' },
  { id: 'progressive-sine-wave', label: 'Progressive Sine Wave' },
  { id: 'corner-scatter', label: 'Corner Scatter' },
  { id: 'duck-swim-small', label: 'Duck Swim: Small' },
  { id: 'duck-swim-small-solo', label: 'Duck Swim: Small (Solo)' },
  { id: 'duck-swim-big', label: 'Duck Swim: Big' },
  { id: 'duck-swim-big-solo', label: 'Duck Swim: Big (Solo)' },
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
    case 'standing-wave':
      return standingWave(rows, cols)
    case 'progressive-sine-wave':
      return progressiveSineWave(rows, cols)
    case 'corner-scatter':
      return cornerScatter(rows, cols)
    case 'duck-swim-small':
      return duckSwim(rows, cols, SMALL_DUCK_SPRITE)
    case 'duck-swim-small-solo':
      return spriteSwim(rows, cols, SMALL_DUCK_SPRITE)
    case 'duck-swim-big':
      return duckSwim(rows, cols, BIG_DUCK_SPRITE)
    case 'duck-swim-big-solo':
      return spriteSwim(rows, cols, BIG_DUCK_SPRITE)
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

// Full sine curve held in place (not travelling sideways), with its amplitude breathing
// from flat (a straight line) up to a full sine wave and back down again, then repeating the
// same breath inverted (bulging the other way), before looping.
function standingWave(rows: number, cols: number): LitPredicate[] {
  return [...standingWaveHalf(rows, cols, 1), ...standingWaveHalf(rows, cols, -1)]
}

// One breath of the standing wave: straight line -> full sine wave (scaled by `direction`) ->
// straight line again.
function standingWaveHalf(rows: number, cols: number, direction: 1 | -1): LitPredicate[] {
  const amplitude = (rows - 1) / 2
  const centreRow = (rows - 1) / 2
  const numFrames = Math.max(cols * 2, 2)
  return sequence(numFrames, (f) => (row, col) => {
    const angle = (col / Math.max(cols - 1, 1)) * 2 * Math.PI
    const ampFactor = direction * Math.sin((Math.PI * f) / (numFrames - 1))
    const targetRow = centreRow - amplitude * ampFactor * Math.sin(angle)
    return row === Math.round(targetRow)
  })
}

// Full sine curve held in place, built up one column at a time left-to-right (none lit, then
// one cell, then two, etc.) until the whole wave is lit, then loops back to empty.
function progressiveSineWave(rows: number, cols: number): LitPredicate[] {
  const amplitude = (rows - 1) / 2
  const centreRow = (rows - 1) / 2
  const rowForCol = (col: number) => {
    // Sample at the centre of each column's phase slot (rather than its leading edge) so the
    // curve's steepest point doesn't land exactly on a row-rounding boundary and skip a row.
    const angle = ((col + 0.5) / cols) * 2 * Math.PI
    return Math.round(centreRow - amplitude * Math.sin(angle))
  }
  return sequence(cols + 1, (f) => (row, col) => {
    if (col >= f) return false
    return row === rowForCol(col)
  })
}

// BBC micro:bit "duck" icon, in two sizes.
const SMALL_DUCK_SPRITE: readonly (readonly number[])[] = [
  [0, 0, 1, 1, 0],
  [0, 0, 1, 1, 1],
  [1, 1, 1, 1, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
]

const BIG_DUCK_SPRITE: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
]

const DUCKLING_SPRITE: readonly (readonly number[])[] = [
  [0, 1],
  [1, 1],
]

const DUCK_FAMILY_GAP = -1 // columns between mother and first duckling
const DUCKLING_GAP = 2 // columns between each duckling

// Moves a sprite across the grid, fully off-screen to fully off-screen, vertically centred.
// Sprites need not be square; height and width are measured independently.
function spriteSwim(rows: number, cols: number, sprite: readonly (readonly number[])[]): LitPredicate[] {
  const spriteHeight = sprite.length
  const spriteWidth = sprite[0]?.length ?? 0
  const rowOffset = Math.floor((rows - spriteHeight) / 2)
  return sequence(cols + spriteWidth + 1, (f) => (row, col) => {
    const colOffset = f - spriteWidth
    const r = row - rowOffset
    const c = col - colOffset
    if (r < 0 || r >= spriteHeight || c < 0 || c >= spriteWidth) return false
    return sprite[r][c] === 1
  })
}

// Mother duck swims across with 3 ducklings trailing in a line.
function duckSwim(rows: number, cols: number, motherSprite: readonly (readonly number[])[]): LitPredicate[] {
  const motherHeight = motherSprite.length
  const motherWidth = motherSprite[0]?.length ?? 0
  const babyHeight = DUCKLING_SPRITE.length
  const babyWidth = DUCKLING_SPRITE[0]?.length ?? 0
  const motherRowOffset = Math.floor((rows - motherHeight) / 2)
  const babyRowOffset = Math.floor((rows - babyHeight) / 2) + 1

  const lags = [1, 2, 3].map((i) => motherWidth + DUCK_FAMILY_GAP + (i - 1) * (babyWidth + DUCKLING_GAP))
  const maxLag = lags[lags.length - 1]

  return sequence(cols + motherWidth + 1 + maxLag, (f) => (row, col) => {
    const motherColOffset = f - motherWidth
    const mRow = row - motherRowOffset
    const mCol = col - motherColOffset
    if (mRow >= 0 && mRow < motherHeight && mCol >= 0 && mCol < motherWidth && motherSprite[mRow][mCol] === 1) {
      return true
    }
    const bRow = row - babyRowOffset
    for (const lag of lags) {
      const bCol = col - (motherColOffset - lag)
      if (bRow >= 0 && bRow < babyHeight && bCol >= 0 && bCol < babyWidth && DUCKLING_SPRITE[bRow][bCol] === 1) {
        return true
      }
    }
    return false
  })
}


// Traces the oval outline clockwise from the top-left, deduplicating repeated points.
function buildLogoOutline(width: number, height: number): (readonly [number, number])[] {
  const r = (height - 1) / 2
  const rightCapCol = width - 1 - r
  const points: (readonly [number, number])[] = []
  const push = (row: number, col: number) => {
    const last = points[points.length - 1]
    if (!last || last[0] !== row || last[1] !== col) points.push([row, col])
  }

  for (let col = r; col <= rightCapCol; col++) push(0, Math.round(col))

  const capSteps = Math.max(1, Math.round(r * 8))
  for (let i = 0; i <= capSteps; i++) {
    const angle = (i / capSteps) * Math.PI
    push(Math.round(r - r * Math.cos(angle)), Math.round(rightCapCol + r * Math.sin(angle)))
  }

  for (let col = rightCapCol; col >= r; col--) push(height - 1, Math.round(col))

  for (let i = 0; i <= capSteps; i++) {
    const angle = Math.PI - (i / capSteps) * Math.PI
    push(Math.round(r - r * Math.cos(angle)), Math.round(r - r * Math.sin(angle)))
  }

  const first = points[0]
  const last = points[points.length - 1]
  if (points.length > 1 && first[0] === last[0] && first[1] === last[1]) points.pop()
  return points
}

// A single cell races around the outline, then the two eyes light up before looping
// straight back into the next outline race.
function microbitLogo(rows: number, cols: number): LitPredicate[] {
  const width = cols - 2
  const height = rows - 2
  const outline: readonly (readonly [number, number])[] = buildLogoOutline(width, height)
  const eyeOffset = Math.round((height - 1) / 2)
  const eyes: readonly (readonly [number, number])[] = [
    [eyeOffset, eyeOffset],
    [eyeOffset, width - 1 - eyeOffset],
  ]
  const numOutlineFrames = outline.length
  const numFrames = numOutlineFrames + 1
  return sequence(numFrames, (f) => (row, col) => {
    const r = row - 1
    const c = col - 1
    if (r < 0 || r >= height || c < 0 || c >= width) return false
    if (f < numOutlineFrames) {
      const [br, bc] = outline[f]
      return br === r && bc === c
    }
    for (const [er, ec] of eyes) if (er === r && ec === c) return true
    return false
  })
}

// Each cell flashes on for a single frame, with the flash timing jittered outward from the
// corner by a deterministic hash so the sweep looks ragged rather than a clean curve.
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
      return activationFrame === t
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
