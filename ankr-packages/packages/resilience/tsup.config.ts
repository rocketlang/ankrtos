import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'circuit-breaker': 'src/circuit-breaker.ts',
    'retry': 'src/retry.ts',
    'graceful-shutdown': 'src/graceful-shutdown.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
});
