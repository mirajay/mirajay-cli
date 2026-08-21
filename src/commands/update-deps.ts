import { defineCommand } from 'citty'
import pc from 'picocolors'
import { banner, step, success, info, warn, error } from '../core/logger.js'
import {
  applyDepUpdates,
  formatRelativePath,
  planDepUpdates,
  resolveScaffoldRoot,
  summarizeUpdates,
} from '../core/deps-registry.js'

export default defineCommand({
  meta: {
    name: 'update-deps',
    description: '扫描并更新脚手架模板中的 npm 依赖版本',
  },
  args: {
    dryRun: {
      type: 'boolean',
      description: '仅预览变更，不写入文件',
      alias: 'n',
      default: false,
    },
    check: {
      type: 'boolean',
      description: '检查是否有可更新依赖（有则退出码 1，供 CI 使用）',
      default: false,
    },
    includeCli: {
      type: 'boolean',
      description: '同时更新 mirajay-cli 自身的 package.json 依赖',
      default: false,
    },
    package: {
      type: 'string',
      description: '仅更新指定包（可多次使用）',
      alias: 'p',
      array: true,
    },
    cwd: {
      type: 'string',
      description: '脚手架仓库根目录',
      alias: 'C',
    },
  },
  async run({ args }) {
    banner()

    const scaffoldRoot = (args.cwd as string | undefined) || resolveScaffoldRoot()
    const packageArg = args.package as string | string[] | undefined
    const onlyPackages = packageArg
      ? (Array.isArray(packageArg) ? packageArg : [packageArg]).flatMap((item) =>
          item.split(','),
        )
      : undefined

    step(`扫描模板依赖: ${scaffoldRoot}`)

    const result = await planDepUpdates({
      scaffoldRoot,
      includeCli: Boolean(args.includeCli),
      onlyPackages,
    })

    info(`已扫描 ${result.scannedFiles} 个文件，共 ${result.uniquePackages} 个依赖包`)

    if (result.failedPackages.length > 0) {
      warn(`无法查询以下包的最新版本: ${result.failedPackages.join(', ')}`)
    }

    if (result.updates.length === 0) {
      success('所有模板依赖已是最新版本')
      return
    }

    const summary = summarizeUpdates(result.updates)
    console.log()
    info(`发现 ${summary.size} 个包可更新:`)
    console.log()

    const nameWidth = Math.max(...[...summary.keys()].map((name) => name.length), 7)
    console.log(
      `${pc.dim('Package'.padEnd(nameWidth))}  ${pc.dim('Current'.padEnd(14))}  ${pc.dim('Latest')}`,
    )
    console.log(pc.dim('-'.repeat(nameWidth + 30)))

    for (const [packageName, update] of [...summary.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      console.log(
        `${packageName.padEnd(nameWidth)}  ${update.fromRange.padEnd(14)}  ${pc.green(update.toRange)}`,
      )
    }

    console.log()
    info('涉及文件:')
    const touchedFiles = new Set<string>()
    for (const update of result.updates) {
      for (const file of update.files) {
        touchedFiles.add(formatRelativePath(scaffoldRoot, file))
      }
    }
    for (const file of [...touchedFiles].sort()) {
      console.log(`  ${pc.dim('•')} ${file}`)
    }

    if (args.check) {
      error(`发现 ${summary.size} 个可更新依赖，请运行 mirajay-cli update-deps`)
      process.exit(1)
    }

    if (args.dryRun) {
      console.log()
      info('dry-run 模式，未写入任何文件')
      info('去掉 --dry-run 后执行写入')
      return
    }

    step('写入更新...')
    const changedFiles = await applyDepUpdates({
      scaffoldRoot,
      updates: result.updates,
    })

    success(`已更新 ${summary.size} 个依赖，修改 ${changedFiles} 个文件`)
    info('建议运行 pnpm test 验证模板生成是否正常')
  },
})
