import { describe, expect, it } from 'vitest'
import { generatePattern, PATTERN_OPTIONS } from './generatePattern'

// Extracts the lit (===1) cell for each frame of a single-bar pattern,
// returning them as [row, col] pairs for easy assertions.
function litCellsPerFrame(cells: number[][], rows: number, cols: number): Array<[number, number][]> {
  const numFrames = cells[0]?.length ?? 0
  const frames: Array<[number, number][]> = Array.from({ length: numFrames }, () => [])
  cells.forEach((frameValues, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    frameValues.forEach((value, f) => {
      if (value === 1) frames[f].push([row, col])
    })
  })
  return frames
}

describe('PATTERN_OPTIONS', () => {
  it('has a unique id for every option', () => {
    const ids = PATTERN_OPTIONS.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('generatePattern shape', () => {
  it('returns rows*cols cells with a consistent frame length for every pattern type', () => {
    const rows = 3
    const cols = 4
    for (const { id } of PATTERN_OPTIONS) {
      const cells = generatePattern(id, rows, cols)
      expect(cells).toHaveLength(rows * cols)
      const frameLength = cells[0].length
      expect(frameLength).toBeGreaterThan(0)
      for (const cellFrames of cells) {
        expect(cellFrames).toHaveLength(frameLength)
        for (const value of cellFrames) {
          expect(value === 0 || value === 1).toBe(true)
        }
      }
    }
  })
})

describe('wave-left-right', () => {
  it('lights one column at a time, left to right', () => {
    const rows = 2
    const cols = 3
    const cells = generatePattern('wave-left-right', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    expect(frames).toHaveLength(cols)
    expect(frames[0].sort()).toEqual([[0, 0], [1, 0]])
    expect(frames[1].sort()).toEqual([[0, 1], [1, 1]])
    expect(frames[2].sort()).toEqual([[0, 2], [1, 2]])
  })
})

describe('wave-right-left', () => {
  it('lights one column at a time, right to left', () => {
    const rows = 2
    const cols = 3
    const cells = generatePattern('wave-right-left', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    expect(frames).toHaveLength(cols)
    expect(frames[0].sort()).toEqual([[0, 2], [1, 2]])
    expect(frames[1].sort()).toEqual([[0, 1], [1, 1]])
    expect(frames[2].sort()).toEqual([[0, 0], [1, 0]])
  })
})

describe('wave-top-down', () => {
  it('lights one row at a time, top to bottom', () => {
    const rows = 3
    const cols = 2
    const cells = generatePattern('wave-top-down', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    expect(frames).toHaveLength(rows)
    expect(frames[0].sort()).toEqual([[0, 0], [0, 1]])
    expect(frames[1].sort()).toEqual([[1, 0], [1, 1]])
    expect(frames[2].sort()).toEqual([[2, 0], [2, 1]])
  })
})

describe('wave-bottom-up', () => {
  it('lights one row at a time, bottom to top', () => {
    const rows = 3
    const cols = 2
    const cells = generatePattern('wave-bottom-up', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    expect(frames).toHaveLength(rows)
    expect(frames[0].sort()).toEqual([[2, 0], [2, 1]])
    expect(frames[1].sort()).toEqual([[1, 0], [1, 1]])
    expect(frames[2].sort()).toEqual([[0, 0], [0, 1]])
  })
})

describe('wave-diagonal-tl-br', () => {
  it('sweeps a diagonal line from the top-left to the bottom-right', () => {
    const rows = 2
    const cols = 3
    const cells = generatePattern('wave-diagonal-tl-br', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    expect(frames).toHaveLength(rows + cols - 1)
    expect(frames[0].sort()).toEqual([[0, 0]])
    expect(frames[1].sort()).toEqual([[0, 1], [1, 0]])
    expect(frames[2].sort()).toEqual([[0, 2], [1, 1]])
    expect(frames[3].sort()).toEqual([[1, 2]])
  })
})

describe('wave-diagonal-tr-bl', () => {
  it('sweeps a diagonal line from the top-right to the bottom-left', () => {
    const rows = 2
    const cols = 3
    const cells = generatePattern('wave-diagonal-tr-bl', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    expect(frames).toHaveLength(rows + cols - 1)
    expect(frames[0].sort()).toEqual([[0, 2]])
    expect(frames[1].sort()).toEqual([[0, 1], [1, 2]])
    expect(frames[2].sort()).toEqual([[0, 0], [1, 1]])
    expect(frames[3].sort()).toEqual([[1, 0]])
  })
})

describe('bounce-horizontal', () => {
  it('sweeps left to right then back, without repeating the endpoint frames', () => {
    const rows = 1
    const cols = 4
    const cells = generatePattern('bounce-horizontal', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    // 0,1,2,3,2,1
    expect(frames).toHaveLength(2 * (cols - 1))
    expect(frames.map((f) => f[0][1])).toEqual([0, 1, 2, 3, 2, 1])
  })

  it('collapses to a single frame for a single column', () => {
    const cells = generatePattern('bounce-horizontal', 1, 1)
    expect(cells).toEqual([[1]])
  })
})

describe('bounce-vertical', () => {
  it('sweeps top to bottom then back, without repeating the endpoint frames', () => {
    const rows = 4
    const cols = 1
    const cells = generatePattern('bounce-vertical', rows, cols)
    const frames = litCellsPerFrame(cells, rows, cols)
    // 0,1,2,3,2,1
    expect(frames).toHaveLength(2 * (rows - 1))
    expect(frames.map((f) => f[0][0])).toEqual([0, 1, 2, 3, 2, 1])
  })

  it('collapses to a single frame for a single row', () => {
    const cells = generatePattern('bounce-vertical', 1, 1)
    expect(cells).toEqual([[1]])
  })
})
