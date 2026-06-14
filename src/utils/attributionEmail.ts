const MODEL_EMAIL_MAP: Array<{ keywords: string[]; email: string }> = [
  { keywords: ['claude'], email: 'noreply@anthropic.com' },
  // 由于找不到他们的邮箱和头像, 所以改为了使用我们的邮箱先记录, 后续官方有 github 能用的邮箱可以替换
  // github 组织是不能用 co author 的
  {
    keywords: ['gpt', 'dall-e', 'o1-', 'o3-', 'o4-'],
    email: 'openai@chris-code.win',
  },
  { keywords: ['gemini'], email: 'google-gemini@chris-code.win' },
  { keywords: ['grok'], email: 'xai-org@chris-code.win' },
  { keywords: ['glm'], email: 'zai-org@chris-code.win' },
  { keywords: ['deepseek'], email: 'deepseek-ai@chris-code.win' },
  { keywords: ['qwen'], email: 'QwenLM@chris-code.win' },
  { keywords: ['minimax'], email: 'MiniMax-AI@chris-code.win' },
  { keywords: ['mimo'], email: 'XiaomiMiMo@chris-code.win' },
  { keywords: ['kimi'], email: 'MoonshotAI@chris-code.win' },
]

export function getAttributionEmail(modelName: string): string {
  const lower = modelName.toLowerCase()
  for (const { keywords, email } of MODEL_EMAIL_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return email
    }
  }
  return 'noreply@anthropic.com'
}
