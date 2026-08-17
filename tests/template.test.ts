import { describe, it, expect } from 'vitest'
import {
  resolveTemplateName,
  resolveMicroFrontendTemplateName,
} from '../src/core/template.js'
import type { ProjectAnswers } from '../src/types.js'

describe('resolveTemplateName', () => {
  it('resolves desktop vue template', () => {
    const answers: ProjectAnswers = {
      projectType: 'desktop',
      framework: 'vue',
    }
    expect(resolveTemplateName(answers)).toBe('desktop-vue')
  })

  it('resolves desktop react template', () => {
    const answers: ProjectAnswers = {
      projectType: 'desktop',
      framework: 'react',
    }
    expect(resolveTemplateName(answers)).toBe('desktop-react')
  })

  it('resolves mobile h5 vue template', () => {
    const answers: ProjectAnswers = {
      projectType: 'mobile',
      framework: 'vue',
      mobilePlatform: 'h5',
    }
    expect(resolveTemplateName(answers)).toBe('mobile-h5-vue')
  })

  it('resolves mobile flutter template', () => {
    const answers: ProjectAnswers = {
      projectType: 'mobile',
      mobilePlatform: 'flutter',
    }
    expect(resolveTemplateName(answers)).toBe('mobile-flutter')
  })
})

describe('resolveMicroFrontendTemplateName', () => {
  it('resolves react stack templates', () => {
    expect(
      resolveMicroFrontendTemplateName('qiankun', { framework: 'react' }),
    ).toBe('micro-qiankun-react')
    expect(resolveMicroFrontendTemplateName('wujie', { framework: 'react' })).toBe(
      'micro-wujie-react',
    )
    expect(
      resolveMicroFrontendTemplateName('micro-app', { framework: 'react' }),
    ).toBe('micro-micro-app-react')
    expect(
      resolveMicroFrontendTemplateName('module-federation', {
        framework: 'react',
        microFrontendStackMode: 'same',
      }),
    ).toBe('micro-module-federation-react')
  })

  it('resolves vue stack templates', () => {
    expect(resolveMicroFrontendTemplateName('qiankun', { framework: 'vue' })).toBe(
      'micro-qiankun-vue',
    )
    expect(resolveMicroFrontendTemplateName('wujie', { framework: 'vue' })).toBe('micro-wujie-vue')
    expect(
      resolveMicroFrontendTemplateName('micro-app', { framework: 'vue' }),
    ).toBe('micro-micro-app-vue')
    expect(
      resolveMicroFrontendTemplateName('module-federation', {
        framework: 'vue',
        microFrontendStackMode: 'same',
      }),
    ).toBe('micro-module-federation-vue')
  })

  it('resolves mixed module federation templates', () => {
    expect(
      resolveMicroFrontendTemplateName('module-federation', {
        framework: 'react',
        microFrontendStackMode: 'mixed',
        remoteFramework: 'vue',
      }),
    ).toBe('micro-module-federation-mixed-react-vue')
    expect(
      resolveMicroFrontendTemplateName('module-federation', {
        framework: 'vue',
        microFrontendStackMode: 'mixed',
        remoteFramework: 'react',
      }),
    ).toBe('micro-module-federation-mixed-vue-react')
  })

  it('defaults to react when framework is omitted', () => {
    expect(resolveMicroFrontendTemplateName('qiankun')).toBe('micro-qiankun-react')
  })
})

describe('resolveTemplateName micro-frontend', () => {
  it('resolves module federation react template', () => {
    const answers: ProjectAnswers = {
      projectType: 'micro-frontend',
      microFrontendTool: 'module-federation',
      framework: 'react',
      microFrontendStackMode: 'same',
      remoteFramework: 'react',
    }
    expect(resolveTemplateName(answers)).toBe('micro-module-federation-react')
  })

  it('resolves module federation mixed react-vue template', () => {
    const answers: ProjectAnswers = {
      projectType: 'micro-frontend',
      microFrontendTool: 'module-federation',
      framework: 'react',
      microFrontendStackMode: 'mixed',
      remoteFramework: 'vue',
    }
    expect(resolveTemplateName(answers)).toBe('micro-module-federation-mixed-react-vue')
  })

  it('resolves wujie vue template', () => {
    const answers: ProjectAnswers = {
      projectType: 'micro-frontend',
      microFrontendTool: 'wujie',
      framework: 'vue',
    }
    expect(resolveTemplateName(answers)).toBe('micro-wujie-vue')
  })

  it('resolves micro-app react template', () => {
    const answers: ProjectAnswers = {
      projectType: 'micro-frontend',
      microFrontendTool: 'micro-app',
      framework: 'react',
    }
    expect(resolveTemplateName(answers)).toBe('micro-micro-app-react')
  })

  it('resolves qiankun vue template', () => {
    const answers: ProjectAnswers = {
      projectType: 'micro-frontend',
      microFrontendTool: 'qiankun',
      framework: 'vue',
    }
    expect(resolveTemplateName(answers)).toBe('micro-qiankun-vue')
  })
})
