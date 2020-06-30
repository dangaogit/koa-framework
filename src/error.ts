import Koa from 'koa';

export function KoaFrameworkError(e: string, ctx: Koa.Context) {
  return {
    code: ctx.status,
    path: ctx.path,
    error: e
  }
}