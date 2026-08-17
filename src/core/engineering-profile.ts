import type { ProjectAnswers } from '../types.js'

export type EngineeringProfile =
  | 'react'
  | 'vue'
  | 'taro-react'
  | 'taro-vue'
  | 'uni-app'
  | 'react-native'

export function resolveEngineeringProfile(answers: ProjectAnswers): EngineeringProfile | null {
  if (answers.mobilePlatform === 'flutter') return null

  if (answers.mobilePlatform === 'taro') {
    return answers.framework === 'vue' ? 'taro-vue' : 'taro-react'
  }

  if (answers.mobilePlatform === 'uni-app') {
    return 'uni-app'
  }

  if (answers.mobilePlatform === 'react-native') {
    return 'react-native'
  }

  if (answers.framework === 'vue') return 'vue'
  if (answers.framework === 'react') return 'react'

  return null
}

export function profileUsesReact(profile: EngineeringProfile): boolean {
  return profile === 'react' || profile === 'taro-react' || profile === 'react-native'
}

export function profileUsesVue(profile: EngineeringProfile): boolean {
  return profile === 'vue' || profile === 'taro-vue' || profile === 'uni-app'
}
