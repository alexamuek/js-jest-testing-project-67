#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import process from 'node:process';
import loadHTML from '../src/index.js';

const main = async (url, output) => {
  const outputPath = await loadHTML(url, output);
  console.log({ filepath: outputPath });
  process.exit(0);
};

const defaultPath = path.join(process.cwd(), 'output');

program
  .description('Load page')
  .argument('<url>')
  .version('1.0.0')
  .option('-o, --output <path>', `output dir (default: "${defaultPath}")`)
  .action((url, options) => {
    main(url, options.output);
  });
program.parse();

export default main;
