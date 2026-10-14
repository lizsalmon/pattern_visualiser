import { describe, expect, it } from 'vitest'
import { validateGrid } from './validateGrid'

describe('validateGrid', () => {
  it('accepts a valid 2x2 grid', () => {
    const result = validateGrid(2, 2, JSON.stringify([[1, 0], [0, 1], [0, 0], [1, 1]]))
    expect(result.errors).toEqual([])
    expect(result.cells).toEqual([[1, 0], [0, 1], [0, 0], [1, 1]])
  })

  it('accepts a single cell with a single frame', () => {
    const result = validateGrid(1, 1, JSON.stringify([[1]]))
    expect(result.errors).toEqual([])
    expect(result.cells).toEqual([[1]])
  })

  it('rejects non-integer or non-positive rows/cols', () => {
    const notInteger = validateGrid(1.5, 2, '[]')
    expect(notInteger.errors).toContain('Rows must be a positive integer.')

    const zero = validateGrid(0, 2, '[]')
    expect(zero.errors).toContain('Rows must be a positive integer.')

    const negative = validateGrid(2, -1, '[]')
    expect(negative.errors).toContain('Columns must be a positive integer.')

    const nonNumeric = validateGrid('abc', 2, '[]')
    expect(nonNumeric.errors).toContain('Rows must be a positive integer.')
  })

  it('rejects invalid JSON', () => {
    const result = validateGrid(1, 1, '{not valid json')
    expect(result.errors).toEqual(['Input is not valid JSON.'])
    expect(result.cells).toEqual([])
  })

  it('rejects a non-array top-level value', () => {
    const result = validateGrid(1, 1, JSON.stringify({ foo: 'bar' }))
    expect(result.errors).toEqual(['Input must be a non-empty array of cells.'])
  })

  it('rejects an empty array', () => {
    const result = validateGrid(1, 1, '[]')
    expect(result.errors).toEqual(['Input must be a non-empty array of cells.'])
  })

  it('rejects a cell count that does not match rows*cols', () => {
    const result = validateGrid(2, 2, JSON.stringify([[1, 0], [0, 1]]))
    expect(result.errors).toContain('Expected 4 cell(s) (rows x cols), but the outer array has 2.')
  })

  it('skips the cell-count check when rows/cols are invalid', () => {
    const result = validateGrid(0, 2, JSON.stringify([[1, 0], [0, 1]]))
    expect(result.errors.some((e) => e.includes('Expected'))).toBe(false)
  })

  it('rejects a cell entry that is not an array', () => {
    const result = validateGrid(1, 2, JSON.stringify([[1, 0], 'nope']))
    expect(result.errors).toContain('Cell 2 is not an array.')
  })

  it('rejects inconsistent frame lengths across cells', () => {
    const result = validateGrid(1, 2, JSON.stringify([[1, 0, 1], [0, 1]]))
    expect(result.errors).toContain(
      'Cell 2 has 2 frame value(s), expected 3 (every cell must have the same number of frames).'
    )
  })

  it('rejects values other than 0 or 1', () => {
    const result = validateGrid(1, 1, JSON.stringify([[1, 2, 0]]))
    expect(result.errors).toContain('Cell 1 has an invalid value "2" at frame 2 (must be 0 or 1).')
  })

  it('rejects cells with zero frames', () => {
    const result = validateGrid(1, 1, JSON.stringify([[]]))
    expect(result.errors).toContain('Each cell must have at least one frame value.')
  })

  it('accumulates multiple independent errors at once', () => {
    const result = validateGrid(0, 0, JSON.stringify([[1, 0], [2, 1, 0]]))
    expect(result.errors).toContain('Rows must be a positive integer.')
    expect(result.errors).toContain('Columns must be a positive integer.')
    expect(result.errors.some((e) => e.includes('invalid value'))).toBe(true)
    expect(result.cells).toEqual([])
  })
})
