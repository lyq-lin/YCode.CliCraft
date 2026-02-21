import type { EnvKeyDef } from './types'

// 协议类型
export type ProtocolType = 'openai' | 'anthropic' | 'google' | 'aws' | 'custom'

// 模型信息
export interface ModelInfo {
  id: string
  name: string
  description?: string
}

// Provider 定义
export interface Provider {
  id: string
  name: string
  protocol: ProtocolType
  baseUrlDefault?: string
  envKeys: EnvKeyDef[]
  models: ModelInfo[]
}

// OpenAI 协议 Provider
export const OPENAI_PROVIDER: Provider = {
  id: 'openai',
  name: 'OpenAI',
  protocol: 'openai',
  baseUrlDefault: 'https://api.openai.com/v1',
  envKeys: [
    { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', secret: true },
    { key: 'OPENAI_BASE_URL', label: 'Base URL (可选)', secret: false },
  ],
  models: [
    { id: 'gpt-5.2', name: 'GPT-5.2', description: '最佳编码和 agentic 任务模型' },
    { id: 'gpt-5.1', name: 'GPT-5.1', description: '可配置推理强度的智能模型' },
    { id: 'gpt-5', name: 'GPT-5', description: '最快、最有用的模型' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: '更快的 GPT-5 轻量版本' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: '最快、最经济的 GPT-5 版本' },
    { id: 'gpt-4.1', name: 'GPT-4.1', description: '强大的编程模型' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: '经济型编程模型' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: '快速轻量模型' },
    { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰模型' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '经济型多模态模型' },
    { id: 'o3-mini', name: 'o3 Mini', description: '快速推理模型' },
    { id: 'o1', name: 'o1', description: '复杂推理模型' },
  ],
}

export const DEEPSEEK_PROVIDER: Provider = {
  id: 'deepseek',
  name: 'DeepSeek',
  protocol: 'openai',
  baseUrlDefault: 'https://api.deepseek.com/v1',
  envKeys: [
    { key: 'OPENAI_API_KEY', label: 'DeepSeek API Key', secret: true },
    { key: 'OPENAI_BASE_URL', label: 'Base URL', secret: false },
  ],
  models: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'DeepSeek-V3 非推理模式' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: 'DeepSeek-V3 推理模式（思维链）' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', description: '代码生成专用模型' },
  ],
}

export const MOONSHOT_PROVIDER: Provider = {
  id: 'moonshot',
  name: 'Moonshot (Kimi)',
  protocol: 'openai',
  baseUrlDefault: 'https://api.moonshot.cn/v1',
  envKeys: [
    { key: 'OPENAI_API_KEY', label: 'Moonshot API Key', secret: true },
    { key: 'OPENAI_BASE_URL', label: 'Base URL', secret: false },
  ],
  models: [
    { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', description: 'K2 思考模型' },
    { id: 'kimi-k2-instruct', name: 'Kimi K2 Instruct', description: 'K2 指令模型' },
    { id: 'kimi-for-coding', name: 'Kimi for Coding', description: '编程专用模型' },
    { id: 'kimi-dev-72b', name: 'Kimi Dev 72B', description: '开发场景 72B 模型' },
  ],
}

export const SILICONFLOW_PROVIDER: Provider = {
  id: 'siliconflow',
  name: 'SiliconFlow',
  protocol: 'openai',
  baseUrlDefault: 'https://api.siliconflow.cn/v1',
  envKeys: [
    { key: 'OPENAI_API_KEY', label: 'SiliconFlow API Key', secret: true },
    { key: 'OPENAI_BASE_URL', label: 'Base URL', secret: false },
  ],
  models: [
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'DeepSeek V3 模型' },
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', description: 'DeepSeek 推理模型' },
    { id: 'Qwen/Qwen3-32B', name: 'Qwen3 32B', description: '通义千问 32B 模型' },
    { id: 'THUDM/GLM-4.7', name: 'GLM-4.7', description: '智谱 GLM-4.7' },
    { id: 'moonshotai/Kimi-K2-Thinking', name: 'Kimi K2 Thinking', description: 'Kimi K2 思考模型' },
  ],
}

// Anthropic 协议 Provider
export const ANTHROPIC_PROVIDER: Provider = {
  id: 'anthropic',
  name: 'Anthropic',
  protocol: 'anthropic',
  baseUrlDefault: 'https://api.anthropic.com',
  envKeys: [
    { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', secret: true },
  ],
  models: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: '最新智能模型' },
    { id: 'claude-opus-4', name: 'Claude Opus 4', description: '最高能力模型' },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: '平衡型模型' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: '快速轻量模型' },
    { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Sonnet 4 系列' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', description: '3.7 版本' },
  ],
}

// 兼容 OpenAI 格式的 Anthropic Provider（用于 Claude Code 等）
export const ANTHROPIC_COMPATIBLE_PROVIDER: Provider = {
  id: 'anthropic-compatible',
  name: 'Anthropic (OpenAI 兼容)',
  protocol: 'openai',
  baseUrlDefault: 'https://api.anthropic.com/v1',
  envKeys: [
    { key: 'OPENAI_API_KEY', label: 'Anthropic API Key', secret: true },
    { key: 'OPENAI_BASE_URL', label: 'Base URL', secret: false },
  ],
  models: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'OpenAI 兼容格式' },
    { id: 'claude-opus-4', name: 'Claude Opus 4', description: 'OpenAI 兼容格式' },
  ],
}

// Google 协议 Provider
export const GOOGLE_PROVIDER: Provider = {
  id: 'google',
  name: 'Google Gemini',
  protocol: 'google',
  baseUrlDefault: 'https://generativelanguage.googleapis.com',
  envKeys: [
    { key: 'GOOGLE_API_KEY', label: 'Google API Key', secret: true },
  ],
  models: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速多模态模型' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', description: '经济型快速模型' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '专业级多模态模型' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '1.5 快速模型' },
  ],
}

// AWS 协议 Provider（需要多个密钥）
export const AWS_BEDROCK_PROVIDER: Provider = {
  id: 'aws-bedrock',
  name: 'AWS Bedrock',
  protocol: 'aws',
  envKeys: [
    { key: 'AWS_ACCESS_KEY_ID', label: 'AWS Access Key ID', secret: true },
    { key: 'AWS_SECRET_ACCESS_KEY', label: 'AWS Secret Access Key', secret: true },
    { key: 'AWS_REGION', label: 'AWS Region', secret: false },
  ],
  models: [
    { id: 'anthropic.claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'AWS Bedrock 版' },
    { id: 'anthropic.claude-opus-4', name: 'Claude Opus 4', description: 'AWS Bedrock 版' },
    { id: 'amazon.nova-pro', name: 'Amazon Nova Pro', description: 'Amazon 自研模型' },
  ],
}

// 所有可用 Providers
export const ALL_PROVIDERS: Provider[] = [
  OPENAI_PROVIDER,
  DEEPSEEK_PROVIDER,
  MOONSHOT_PROVIDER,
  SILICONFLOW_PROVIDER,
  ANTHROPIC_PROVIDER,
  ANTHROPIC_COMPATIBLE_PROVIDER,
  GOOGLE_PROVIDER,
  AWS_BEDROCK_PROVIDER,
]

// CLI 工具支持的 Providers
export const CLI_SUPPORTED_PROVIDERS: Record<string, string[]> = {
  // Claude Code: 原生支持 Anthropic 协议，也可通过转换层支持 OpenAI 格式
  'claude-code': ['anthropic', 'deepseek', 'moonshot'],
  // Kimi Code: 官方只支持自家的 API
  'kimi-code': ['moonshot'],
  // OpenCode: 支持多 Provider
  'opencode': ['openai', 'deepseek', 'moonshot', 'siliconflow', 'anthropic-compatible', 'google', 'aws-bedrock'],
}

export function getProviderById(id: string): Provider | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id)
}

export function getProvidersForCli(cliTypeId: string): Provider[] {
  const supportedIds = CLI_SUPPORTED_PROVIDERS[cliTypeId] || []
  return supportedIds.map((id) => getProviderById(id)).filter(Boolean) as Provider[]
}

// 获取 Provider 的默认模型
export function getDefaultModelForProvider(providerId: string): string | undefined {
  const provider = getProviderById(providerId)
  return provider?.models[0]?.id
}
