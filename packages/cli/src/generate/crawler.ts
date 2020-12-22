import { request, cleanup } from 'taki'
import chalk from 'chalk'
import PromiseQueue from '../utils/promise-queue'
import { Page } from 'puppeteer-core'
import  { SPECIAL_EXTENSIONS_RE } from '../constants'
import { AvuOptions } from '../config'
import { CrawlerServer } from './crawler-server'
import { Writer } from '../utils/writer'
import { Logger } from '../utils/logger'

const routeToFile = (route: string) => {
  if (/\.html$/.test(route) || SPECIAL_EXTENSIONS_RE.test(route)) {
    return route
  }
  return route.replace(/\/?$/, '/index.html')
}

export type CrawlerOptions = {
  hostname: string
  port: number
  options: {
    routes: string[] | (() => Promise<string[]>)
    onBrowserPage?: (page: Page) => void | Promise<void>
    manually?: string | boolean
    wait?: string | number
  }
  writer: Writer
}

export class Crawler {
  opts: AvuOptions
  writer: Writer
  server: CrawlerServer

  constructor(opts: AvuOptions, writer: Writer, server: CrawlerServer) {
    this.opts = opts
    this.writer = writer
    this.server = server
  }

  async crawl() {
    const { generate } = this.opts

    const routes =
      typeof generate.routes === 'function'
        ? await generate.routes()
        : generate.routes

    const crawlRoute = async (routes: string[]) => {
      const { hostname, port } = this.server
      const queue = new PromiseQueue(
        async (route: string) => {
          const file = routeToFile(route)
          let links: Set<string> | undefined
          const html = await request({
            url: `http://${hostname}:${port}${route}`,
            onBeforeRequest(url) {
              Logger.log(`Crawling contents from ${chalk.cyan(url)}`)
            },
            async onBeforeClosingPage(page) {
              links = new Set(
                await page.evaluate(
                  ({ hostname, port }: { hostname: string; port: string }) => {
                    return Array.from(document.querySelectorAll('a'))
                      .filter((a) => {
                        return a.hostname === hostname && a.port === port
                      })
                      .map((a) => a.pathname)
                  },
                  { hostname, port: String(port) }
                )
              )
            },
            manually: SPECIAL_EXTENSIONS_RE.test(route)
              ? true
              : generate.manual,
            async onCreatedPage(page) {
              if (generate.onBrowserPage) {
                await generate.onBrowserPage(page)
              }
              page.on('console', (e) => {
                const type = e.type()
                // @ts-ignore
                const log = console[type] || console.log
                const location = e.location()
                log(
                  `Message from ${location.url}:${location.lineNumber}:${location.columnNumber}`,
                  e.text()
                )
              })
            },
            wait: generate.wait,
          })

          if (links && links.size > 0) {
            for (const link of links) {
              queue.add(link)
            }
          }

          Logger.log(`Writing ${chalk.cyan(file)} for ${chalk.cyan(route)}`)
          await this.writer.write({ html, file })
        },
        { maxConcurrent: 50 }
      )
      for (const route of routes) {
        queue.add(route)
      }
      await queue.run()
    }

    await crawlRoute(routes)
    await cleanup()
  }
}