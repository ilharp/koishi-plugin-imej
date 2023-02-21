import Handlebars from 'handlebars'
import { Context, Logger, Schema, Service } from 'koishi'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

declare module 'koishi' {
  interface Context {
    imej: ImejService
  }
}

export type Template = (slots: Record<string, unknown>) => string

export const name = 'imej'

export const using = ['puppeteer'] as const

export interface Config {
  layoutMap: Record<string, string>
}

export const Config: Schema<Config> = Schema.object({
  layoutMap: Schema.dict(Schema.string()).default({
    default: 'blank',
  }),
})

export async function apply(ctx: Context, config: Config) {
  ctx.plugin(ImejService, config)
}

export class ImejService extends Service {
  constructor(ctx: Context, config: Config) {
    super(ctx, 'imej')
    this.#config = config
    this.#templates = {}
    this.#logger = ctx.logger('imej')
  }

  #config: Config
  #templates: Record<string, Template>
  #logger: Logger

  #prelude = {
    resetCss:
      'file:///' + join(__dirname, '../styles/reset.css').replace(/\\/g, '/'),
    normalizeCss:
      'file:///' + require.resolve('normalize.css').replace(/\\/g, '/'),
  }

  static HandleBars = Handlebars

  async start() {
    this.define(
      'blank',
      Handlebars.compile(
        (await readFile(join(__dirname, '../templates/blank.hbs'))).toString()
      )
    )
  }

  define(template: string, htd: Template) {
    this.#templates[template] = htd
    this.#logger.info('load template ' + template)
  }

  render(layout: string, slots: Record<string, unknown>): string {
    const template = this.#config.layoutMap[layout] ?? layout
    const result = this.#templates[template]({ prelude: this.#prelude, slots })
    console.log(result)
    return result
  }
}
