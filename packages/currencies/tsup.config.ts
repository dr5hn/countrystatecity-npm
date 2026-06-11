import { defineConfig } from 'tsup'
import { baseConfig } from '../../tsup.config.base'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  ...baseConfig,
  entry: ['src/index.ts'],
  esbuildOptions(options) {
    options.external = ['./data/*']
  },
  onSuccess: async () => {
    const srcDir = join(__dirname, 'src/data')
    const distDir = join(__dirname, 'dist/data')
    mkdirSync(distDir, { recursive: true })
    for (const file of readdirSync(srcDir)) {
      copyFileSync(join(srcDir, file), join(distDir, file))
    }
    console.log('✓ Copied data files to dist/data/')
  },
})
