#!/usr/bin/env node
import {
  SCAFFOLD_SCENARIOS,
  runScaffoldScenario,
  formatScaffoldFailures,
} from '../tests/helpers/scaffold-matrix.ts'

const filter = process.argv[2]
const scenarios = filter
  ? SCAFFOLD_SCENARIOS.filter((item) => item.id.includes(filter))
  : SCAFFOLD_SCENARIOS

const results = []

for (const scenario of scenarios) {
  console.log(`\n=== Running ${scenario.id} ===`)
  const result = await runScaffoldScenario(scenario, { keepDir: !result?.passed })
  results.push(result)
  const status = result.passed ? 'PASS' : 'FAIL'
  console.log(`${scenario.id}: ${status}`)
  if (!result.passed) {
    for (const step of result.steps.filter((item) => !item.ok)) {
      console.log(`  ✗ ${step.step}`)
      console.log(step.output?.slice(-1200) ?? '')
    }
  }
}

console.log('\n=== Summary ===')
console.log(`Passed: ${results.filter((item) => item.passed).length}/${results.length}`)
const failures = formatScaffoldFailures(results)
if (failures) {
  console.log('\n' + failures)
  process.exit(1)
}
