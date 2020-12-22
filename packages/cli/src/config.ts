import { Page } from 'puppeteer-core'
import JoyCon from 'joycon'
import path from 'path'
import chalk from 'chalk'

export interface GenerateOptions {
  wait?: string | number
  routes: string[] | (() => Promise<string[]>)
  onBrowserPage?: (page: Page) => void | Promise<void>
  manual?: boolean | string
}

export interface AvuOptions {
  baseDir: string
  dir?: string
  srcDir?: string
  outDir: string
  dev?: boolean
  cache?: boolean
  minify?: boolean
  quiet?: boolean
  generate: GenerateOptions
}

export async function mergeConfig(dir: any, flags: any) {
  let configData = await readConfig()
  let config: Required<AvuOptions>

  config = Object.assign(
    {
      baseDir: '.',
      outDir: '.avu',
      generate: {
        routes: ['/']
      }
    },
    configData,
    flags.quiet && { quiet: flags.quiet },
    flags.minify && { minify: flags.minify },
    dir && { baseDir: dir },
    flags.manual && { generate: { manual: flags.manual}},
    flags.wait && { generate: { wait: flags.wait}}
  )

  return config
}

export async function readConfig () {
  const joycon = new JoyCon({
    packageKey: 'avu',
    files: ['package.json', 'avu.config.json', 'avu.config.js'],
  })
  
  const { data: configData, path: configPath } = await joycon.load()
  
  if (configPath) {
    console.log(
      `Using config from ${chalk.green(
        path.relative(process.cwd(), configPath)
      )}`
    )
  }
  
  return configData
}