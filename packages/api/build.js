import {rm} from 'fs/promises';
import {createLogger} from '@alwatr/logger';
import {context, analyzeMetafile} from 'esbuild';

const logger = createLogger('@alwatr/storage-api-build', true);

const srcDir = 'src';
const outDir = 'dist';
const srcFilename = 'index';

async function build(cleanMode, watchMode, debugMode, prettyMode) {
  logger.logMethodArgs?.('build', {cleanMode, watchMode, debugMode, prettyMode});

  const esbuildContext = await context({
    entryPoints: [`${srcDir}/${srcFilename}.ts`],
    logLevel: 'info',
    platform: 'node',
    target: 'es2018',
    format: 'esm',
    conditions: debugMode ? ['development'] : undefined,
    minify: !prettyMode,
    treeShaking: true,
    sourcemap: true,
    sourcesContent: debugMode,
    bundle: true,
    splitting: false,
    charset: 'utf8',
    legalComments: 'none',
    metafile: true,
    outbase: srcDir,
    outdir: outDir,
    // entryNames: watchMode ? '[name]' : '[dir]/[name]'
  });

  if (cleanMode) {
    logger.logOther?.('🧹 Cleaning...');
    await rm(outDir, {recursive: true, force: true});
  }

  if (watchMode) {
    logger.logOther?.('👀 Watching...');
    esbuildContext.watch();
  } else {
    logger.logOther?.('🚀 Building...');
    const buildInfo = await esbuildContext.rebuild();
    await esbuildContext.dispose();

    if (debugMode) {
      for (const [outFile, outInfo] of Object.entries(buildInfo.metafile?.outputs ?? {})) {
        const size = Math.round(outInfo.bytes / 1024);
        logger.logOther?.(`📦 ${outFile} ${size}kb`);
      }
    }

    logger.logOther?.('✅ Done.');
  }
}

const cleanMode = process.argv.includes('--clean');
const watchMode = process.argv.includes('--watch');
const debugMode = process.argv.includes('--debug');
const prettyMode = process.argv.includes('--pretty');

build(cleanMode, watchMode, debugMode, prettyMode);