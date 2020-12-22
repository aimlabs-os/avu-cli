import chalk from "chalk"
import { AvuOptions } from "./config"
import { Crawler } from "./generate/crawler"
import { CrawlerServer } from "./generate/crawler-server"
import { Logger } from "./utils/logger"
import { Writer } from "./utils/writer"

export class Avu {
  options: AvuOptions
  
  constructor (options: AvuOptions) {
    this.options = options
    Logger.verbose =  !options.quiet
  }

  /**
   * Generate pre-rendered site
   */
  async generate () {
    const server = new CrawlerServer(this.options)
    const writer = new Writer(this.options)
    Logger.log(`Copy static assets`)
    await Promise.all([server.start(), writer.copyFrom(this.options.baseDir)])
    const crawler = new Crawler(this.options, writer, server)
    await crawler.crawl()
    server.stop()
    Logger.log(`Done, check out ${chalk.green(this.options.outDir)} folder`)
  }
}