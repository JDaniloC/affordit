import { describe, expect, it } from 'vitest'
import config from '../vite.config'

describe('vite config', () => {
  it('uses repository base path for GitHub Pages', () => {
    expect(config.base).toBe('/affordit/')
  })
})
