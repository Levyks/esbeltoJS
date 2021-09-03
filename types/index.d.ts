export declare function config(settings: Settings): void

export declare function express(path: string, options: object, callback: (e: any, rendered?: string) => void): void

export declare class Renderer {
  constructor(path: string, data: any, settings: Settings)
  createCompilerIfNeeded(): Compiler
  render(): string
  escapeHTML(html: string): string
  include(relpath: string, data: any): string
  includeScript(script: string | Object): string
}

declare class Compiler {
  constructor(path: string, renderer: Renderer)
  getCompiledFunc(renderer?: Renderer): (data: any) => string
}

type Settings = {
  htmlStartTag?: string,
  htmlEndTag?: string,
  cacheCompileds?: boolean,
  cacheSettings?: {
    storeOnDisk?: boolean,
    recompileOnChange?: boolean
  }
}