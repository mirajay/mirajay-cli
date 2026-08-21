import { createConsola } from 'consola'
import pc from 'picocolors'

export const logger = createConsola()

export function success(message: string) {
  logger.success(pc.green(message))
}

export function info(message: string) {
  logger.info(pc.cyan(message))
}

export function warn(message: string) {
  logger.warn(pc.yellow(message))
}

export function error(message: string) {
  logger.error(pc.red(message))
}

export function step(message: string) {
  logger.log(`${pc.bold(pc.blue('→'))} ${message}`)
}

export function banner() {
  console.log()
  console.log(pc.bold(pc.cyan('  mirajay-cli')) + pc.dim(' - 企业级前端脚手架'))
  console.log(pc.dim('  桌面 Web · 移动端 · 微前端'))
  console.log()
}
