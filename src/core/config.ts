import { loadConfig } from 'c12'
import type { CliConfig } from '../types.js'

const DEFAULT_CONFIG: CliConfig = {
  defaultPackageManager: 'pnpm',
  defaultEngineeringPreset: 'standard',
}

export async function loadCliConfig(cwd: string = process.cwd()): Promise<CliConfig> {
  const { config } = await loadConfig<CliConfig>({
    name: 'cli',
    cwd,
    defaults: DEFAULT_CONFIG,
    rcFile: '.clirc',
    configFile: '.clirc',
    packageJson: false,
  })

  return { ...DEFAULT_CONFIG, ...config }
}
