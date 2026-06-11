import { defineConfig } from 'tsup';
import { readFileSync, copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  bundle: true,
  define: {
    '__VERSION__': JSON.stringify(pkg.version),
  },
  onSuccess: async () => {
    const copyDir = (src: string, dest: string) => {
      mkdirSync(dest, { recursive: true });
      const entries = readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          copyFileSync(srcPath, destPath);
        }
      }
    };
    try {
      copyDir('src/data', 'dist/data');
      console.log('✓ Data files copied to dist/data');
    } catch {
      console.log('⚠ No src/data directory found (data not yet generated)');
    }
  },
});
