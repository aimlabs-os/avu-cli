#!/usr/bin/env node
import { cac } from 'cac'
import update from 'update-notifier'
import appPackageJson from '../package.json'
import { mergeConfig } from './config'
const pkg: any = appPackageJson

update({ pkg }).notify()


const cli = cac('avu')

cli
  .command('generate [dir]', `Prerender your website/app`)
  .option(
    '--wait <time_or_selector>',
    'Wait for specific ms or dom element to appear'
  )
  .option(
    '--manual [optional_variable_name]',
    'Manually set ready state in your app'
  )
  .option('--minify', 'Minify HTML')
  .option('--routes <routes>', 'Addtional routes to crawl contents from')
  .option('--out-dir <dir>', 'The directory to output files')
  .option('--quiet', 'Output nothing in console')
  .action(async (dir, flags) => {

    const { Avu } = await import('./avu')
    let config = await mergeConfig(dir, flags)
    const app = new Avu(config)
    //Generate static site
    await app.generate().catch(handleError)

  })

cli.version(require('../package').version)
cli.help()
cli.parse()  

function handleError(error: Error) {
  require('consola').error(error)
  process.exit(1)
}  