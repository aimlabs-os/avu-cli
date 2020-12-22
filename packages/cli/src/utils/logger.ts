export class Logger {
  static verbose?: boolean

  static log(...args: any[]) {
    if (!Logger.verbose) return
    console.log(...args)
  }
}