/**
 * 火山方舟API服务
 * 用于调用火山方舟的大语言模型API生成AI建议
 */

import { ElMessage } from 'element-plus'

// 从环境变量获取配置
const API_KEY = import.meta.env.VITE_VOLCANO_ARK_API_KEY
const BASE_URL = import.meta.env.VITE_VOLCANO_ARK_BASE_URL

interface VolcanoArkRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
}

interface VolcanoArkResponse {
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  created: number
}

/**
 * 调用火山方舟API生成AI建议
 * @param prompt 用户输入的提示词
 * @returns AI生成的响应文本
 */
export const generateAIAdvice = async (prompt: string): Promise<string> => {
  if (!API_KEY || !BASE_URL) {
    throw new Error('火山方舟API配置缺失，请检查环境变量')
  }

  const requestBody: VolcanoArkRequest = {
    model: 'bot-20251111100821-mms64', // 使用火山方舟提供的模型
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: false
  }

  try {
    const response = await fetch(`${BASE_URL}/api/v3/bots/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`火山方舟API调用失败: ${errorData.message || response.statusText}`)
    }

    const data: VolcanoArkResponse = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim()
    } else {
      throw new Error('火山方舟API返回空响应')
    }

  } catch (error) {
    console.error('火山方舟API调用错误:', error)
    
    // 如果API调用失败，返回一个友好的错误信息
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查网络设置')
      } else if (error.message.includes('401')) {
        throw new Error('API密钥无效，请检查配置')
      } else if (error.message.includes('429')) {
        throw new Error('API调用频率限制，请稍后重试')
      }
    }
    
    throw new Error('AI建议生成失败，请重试')
  }
}

/**
 * 检查火山方舟API配置
 */
export const checkVolcanoArkConfig = (): boolean => {
  const hasConfig = !!(API_KEY && BASE_URL)
  
  if (!hasConfig) {
    console.warn('火山方舟API配置缺失，请检查环境变量 VITE_VOLCANO_ARK_API_KEY 和 VITE_VOLCANO_ARK_BASE_URL')
  }
  
  return hasConfig
}