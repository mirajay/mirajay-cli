import { execa } from 'execa'
import { step, success, warn } from './logger.js'
import { DEFAULT_SHADCN_COMPONENTS } from './shadcn.constants.js'
import { ensureShadcnTsconfig } from './shadcn-tsconfig.js'

export { DEFAULT_SHADCN_COMPONENTS } from './shadcn.constants.js'
export { ensureShadcnTsconfig } from './shadcn-tsconfig.js'

export async function installShadcnComponents(
  targetDir: string,
  components: readonly string[] = DEFAULT_SHADCN_COMPONENTS,
): Promise<boolean> {
  if (components.length === 0) return true

  await ensureShadcnTsconfig(targetDir)

  step(`安装 shadcn/ui 组件: ${components.join(', ')}...`)

  try {
    await execa('npx', ['shadcn@latest', 'add', ...components, '--yes'], {
      cwd: targetDir,
      stdio: 'inherit',
    })
    success('shadcn/ui 组件安装完成')
    return true
  } catch {
    warn(
      `shadcn 组件自动安装失败，请稍后手动运行: npx shadcn@latest add ${components.join(' ')}`,
    )
    return false
  }
}
