import { describe, it, expect } from 'vitest'
import {
  SCAFFOLD_SCENARIOS,
  runScaffoldScenario,
  formatScaffoldFailures,
} from './helpers/scaffold-matrix.js'

const ENABLED = process.env.SCAFFOLD_MATRIX === '1'
const FILTER = process.env.SCAFFOLD_FILTER

const scenarios = FILTER
  ? SCAFFOLD_SCENARIOS.filter((item) =>
      FILTER.split(/[|,]/).some((token) => token && item.id.includes(token.trim())),
    )
  : SCAFFOLD_SCENARIOS

describe.skipIf(!ENABLED)('scaffold matrix (pnpm install/build/lint/test)', () => {
  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    '%s',
    async (_id, scenario) => {
      const result = await runScaffoldScenario(scenario)
      if (!result.passed) {
        console.error(formatScaffoldFailures([result]))
      }
      expect(result.passed, formatScaffoldFailures([result])).toBe(true)
    },
    300_000,
  )
})

describe('scaffold matrix smoke (generate only)', () => {
  it.concurrent.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    'generates %s',
    async (_id, scenario) => {
      const result = await runScaffoldScenario({
        ...scenario,
        skipInstall: true,
        skipDev: true,
        skipBuild: true,
        skipLint: true,
        skipTest: true,
      })
      expect(result.steps.find((step) => step.step === 'generate')?.ok).toBe(true)
    },
    60_000,
  )
})
