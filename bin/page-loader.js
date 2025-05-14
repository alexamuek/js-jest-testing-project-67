#!/usr/bin/env node
import { program } from 'commander'
import process from 'node:process'
import loadHTML from '../src/index.js'

const defaultPath = './' // path.join(process.cwd(), 'src');
// console.log('defaultPath = ', defaultPath);

const main = async (url, output = defaultPath) => {
  // console.log('output =====', output);
  const pathObj = await loadHTML(url, output)
  console.log(`Page was successfully downloaded into ${pathObj.filepath}`)
}

program
  .description('Load page')
  .argument('<url>')
  .version('1.0.0')
  .option('-o, --output <path>', `output dir (default: "${defaultPath}")`)
  .action((url, options) => {
    main(url, options.output, () => process.exit(0))
  })
program.parse()

export default main
