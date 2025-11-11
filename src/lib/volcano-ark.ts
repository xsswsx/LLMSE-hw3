// 火山方舟API服务
import { ElMessage } from 'element-plus'

interface VolcanoArkConfig {
  apiKey: string
  baseUrl: string
}

interface TravelPlanRequest {
  destination: string
  startDate: string
  endDate: string
  budget: number
  travelers: number
  preferences: string[]
  travelStyle: string
  specialRequirements: string
}

interface DayPlan {
  day: number
  date: string
  activities: {
    time: string
    type: '交通' | '住宿' | '景点' | '餐饮' | '购物' | '娱乐'
    title: string
    description: string
    location?: string
    cost?: number
    duration?: string
  }[]
}

interface TravelPlan {
  destination: string
  duration: number
  budget: number
  travelers: number
  summary: string
  dayPlans: DayPlan[]
  recommendations: {
    category: string
    items: string[]
  }[]
}

class VolcanoArkService {
  private config: VolcanoArkConfig

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_VOLCANO_ARK_API_KEY || '',
      baseUrl: import.meta.env.VITE_VOLCANO_ARK_BASE_URL || 'https://ark.cn-beijing.volces.com'
    }
  }

  // 生成AI行程规划
  async generateTravelPlan(request: TravelPlanRequest): Promise<TravelPlan | null> {
    if (!this.config.apiKey) {
      ElMessage.error('请配置火山方舟API密钥')
      return null
    }

    try {
      const prompt = this.buildPrompt(request)
      
      // 模拟API调用 - 实际使用时替换为真实API调用
      console.log(prompt)
      const response = await this.callVolcanoArkAPI(prompt)
      console.log(response.choices[0].message.content)
      return response.choices[0].message.content
      
      // 临时模拟响应
      // const mockResponse = this.generateMockResponse(request)
      // return mockResponse
      
    } catch (error) {
      console.error('火山方舟API调用失败:', error)
      ElMessage.error('行程规划生成失败，请稍后重试')
      return null
    }
  }

  private buildPrompt(request: TravelPlanRequest): string {
    return `请为以下旅行需求生成详细的行程规划：

目的地：${request.destination}
旅行时间：${request.startDate} 至 ${request.endDate}
预算：${request.budget}元
同行人数：${request.travelers}人
旅行偏好：${request.preferences.join(', ')}
旅行风格：${request.travelStyle}
特殊需求：${request.specialRequirements}

请生成详细的每日行程安排，包括交通、住宿、景点、餐饮等。格式要求为JSON格式。`
  }

  private generateMockResponse(request: TravelPlanRequest): TravelPlan {
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const dayPlans: DayPlan[] = []
    
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      dayPlans.push({
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        activities: [
          {
            time: '09:00-12:00',
            type: '景点',
            title: `第${i + 1}天景点游览`,
            description: `探索${request.destination}的著名景点`,
            location: `${request.destination}市中心`,
            cost: 200,
            duration: '3小时'
          },
          {
            time: '12:00-13:30',
            type: '餐饮',
            title: '当地特色午餐',
            description: `品尝${request.destination}的特色美食`,
            cost: 100,
            duration: '1.5小时'
          },
          {
            time: '14:00-17:00',
            type: '景点',
            title: '文化体验',
            description: '参观当地博物馆或文化遗址',
            cost: 150,
            duration: '3小时'
          }
        ]
      })
    }

    return {
      destination: request.destination,
      duration: duration,
      budget: request.budget,
      travelers: request.travelers,
      summary: `这是一份${request.destination}${duration}天${request.travelers}人游的行程规划，专注于${request.preferences.join('和')}。`,
      dayPlans: dayPlans,
      recommendations: [
        {
          category: '美食推荐',
          items: ['当地特色餐厅', '网红打卡小吃', '传统美食体验']
        },
        {
          category: '住宿建议',
          items: ['市中心酒店', '特色民宿', '经济型住宿']
        }
      ]
    }
  }

  // 实际API调用方法（待实现）
  private async callVolcanoArkAPI(prompt: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/v3/bots/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: 'bot-20251111100821-mms64', // 替换为实际模型名称
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.statusText}`)
    }

    return await response.json()
  }
}

export const volcanoArkService = new VolcanoArkService()
export type { TravelPlanRequest, TravelPlan, DayPlan }