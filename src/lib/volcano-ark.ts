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

  // 分析旅行需求
  async analyzeTravelRequirements(prompt: string): Promise<string | null> {
    if (!this.config.apiKey) {
      ElMessage.error('请配置火山方舟API密钥')
      return null
    }

    try {
      // 调用火山方舟API
      const response = await this.callVolcanoArkAPI(prompt)
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content
        
        // 提取JSON内容（可能会包含一些说明文字）
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return jsonMatch[0]
        }
        
        // 如果没有找到JSON，直接返回内容
        return content
      }
      
      // 如果API调用失败，使用模拟分析
      ElMessage.warning('API调用失败，使用模拟分析')
      return this.generateMockAnalysis(prompt)
      
    } catch (error) {
      console.error('火山方舟API调用失败:', error)
      
      // 使用模拟分析作为备选方案
      ElMessage.warning('API调用失败，使用模拟分析作为备选方案')
      return this.generateMockAnalysis(prompt)
    }
  }

  // 分析旅行需求
  async analyzeTravelRequirements(prompt: string): Promise<string | null> {
    if (!this.config.apiKey) {
      ElMessage.error('请配置火山方舟API密钥')
      return null
    }

    try {
      // 调用火山方舟API
      const response = await this.callVolcanoArkAPI(prompt)
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content
        
        // 提取JSON内容（可能会包含一些说明文字）
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return jsonMatch[0]
        }
        
        // 如果没有找到JSON，直接返回内容
        return content
      }
      
      // 如果API调用失败，使用模拟分析
      ElMessage.warning('API调用失败，使用模拟分析')
      return this.generateMockAnalysis(prompt)
      
    } catch (error) {
      console.error('火山方舟API调用失败:', error)
      
      // 使用模拟分析作为备选方案
      ElMessage.warning('API调用失败，使用模拟分析作为备选方案')
      return this.generateMockAnalysis(prompt)
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
      
      // 解析返回的JSON数据
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content
        console.log('解析前的内容:', content)
        
        // 尝试解析JSON内容
        try {
          const planData = JSON.parse(content)
          console.log('解析后的旅行计划数据:', planData)
          
          // 验证数据格式
          if (this.validateTravelPlanData(planData)) {
            return planData as TravelPlan
          } else {
            ElMessage.error('返回的数据格式不符合要求')
            return null
          }
        } catch (parseError) {
          console.error('JSON解析失败:', parseError)
          ElMessage.error('无法解析AI返回的数据')
          return null
        }
      }
      
      // 如果API调用失败，使用模拟数据作为备用
      ElMessage.warning('API调用失败，使用模拟数据')
      return this.generateMockResponse(request)
      
    } catch (error) {
      console.error('火山方舟API调用失败:', error)
      
      // 使用模拟数据作为备选方案
      ElMessage.warning('API调用失败，使用模拟数据作为备选方案')
      return this.generateMockResponse(request)
    }
  }

  private buildPrompt(request: TravelPlanRequest): string {
    return `请为以下旅行需求生成详细的行程规划，请严格按照指定的JSON格式返回：

旅行需求：
- 目的地：${request.destination}
- 旅行时间：${request.startDate} 至 ${request.endDate}
- 预算：${request.budget}元
- 同行人数：${request.travelers}人
- 旅行偏好：${request.preferences.join(', ')}
- 旅行风格：${request.travelStyle}
- 特殊需求：${request.specialRequirements}

请严格按照以下JSON格式返回行程规划数据：
{
  "destination": "目的地名称",
  "duration": 天数（整数）,
  "budget": 预算（数字）,
  "travelers": 人数（整数）,
  "summary": "行程概要描述",
  "dayPlans": [
    {
      "day": 天数（整数，从1开始）,
      "date": "日期（格式：YYYY-MM-DD）",
      "activities": [
        {
          "time": "时间（如：09:00-12:00）",
          "type": "活动类型（交通/住宿/景点/餐饮/购物/娱乐）",
          "title": "活动标题",
          "description": "活动详细描述",
          "location": "地点（可选）",
          "cost": 费用（数字，可选）,
          "duration": "时长（如：2小时，可选）"
        }
      ]
    }
  ],
  "recommendations": [
    {
      "category": "推荐类别",
      "items": ["推荐项目1", "推荐项目2"]
    }
  ]
}

重要要求：
1. 必须返回有效的JSON格式，不包含任何额外的文本，不包含头尾的\`\`\`json标注。
2. "dayPlans"数组的天数要与旅行总天数一致
3. 每个活动必须有time、type、title、description字段
4. 活动类型只能是：交通、住宿、景点、餐饮、购物、娱乐
5. 推荐信息要基于用户偏好和旅行风格
6. 预算分配要合理，考虑用户指定的预算限制

请基于以上要求生成专业、实用的旅行计划。`
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

  // 验证旅行计划数据格式
  private validateTravelPlanData(data: any): boolean {
    try {
      // 检查必需字段
      if (!data.destination || typeof data.destination !== 'string') {
        console.error('目的地字段验证失败')
        return false
      }
      
      if (!data.duration || typeof data.duration !== 'number' || data.duration <= 0) {
        console.error('天数字段验证失败')
        return false
      }
      
      if (!data.budget || typeof data.budget !== 'number' || data.budget <= 0) {
        console.error('预算字段验证失败')
        return false
      }
      
      if (!data.travelers || typeof data.travelers !== 'number' || data.travelers <= 0) {
        console.error('人数字段验证失败')
        return false
      }
      
      if (!data.summary || typeof data.summary !== 'string') {
        console.error('概要字段验证失败')
        return false
      }
      
      // 检查dayPlans数组
      if (!Array.isArray(data.dayPlans)) {
        console.error('dayPlans字段验证失败')
        return false
      }
      
      for (const dayPlan of data.dayPlans) {
        if (!dayPlan.day || typeof dayPlan.day !== 'number' || dayPlan.day <= 0) {
          console.error('dayPlan.day字段验证失败')
          return false
        }
        
        if (!dayPlan.date || typeof dayPlan.date !== 'string') {
          console.error('dayPlan.date字段验证失败')
          return false
        }
        
        // 检查activities数组
        if (!Array.isArray(dayPlan.activities)) {
          console.error('dayPlan.activities字段验证失败')
          return false
        }
        
        for (const activity of dayPlan.activities) {
          if (!activity.time || typeof activity.time !== 'string') {
            console.error('activity.time字段验证失败')
            return false
          }
          
          const validTypes = ['交通', '住宿', '景点', '餐饮', '购物', '娱乐']
          if (!activity.type || !validTypes.includes(activity.type)) {
            console.error('activity.type字段验证失败')
            return false
          }
          
          if (!activity.title || typeof activity.title !== 'string') {
            console.error('activity.title字段验证失败')
            return false
          }
          
          if (!activity.description || typeof activity.description !== 'string') {
            console.error('activity.description字段验证失败')
            return false
          }
        }
      }
      
      // 检查recommendations数组（可选）
      if (data.recommendations) {
        if (!Array.isArray(data.recommendations)) {
          console.error('recommendations字段验证失败')
          return false
        }
        
        for (const rec of data.recommendations) {
          if (!rec.category || typeof rec.category !== 'string') {
            console.error('recommendation.category字段验证失败')
            return false
          }
          
          if (!Array.isArray(rec.items)) {
            console.error('recommendation.items字段验证失败')
            return false
          }
        }
      }
      
      console.log('数据验证通过')
      return true
      
    } catch (error) {
      console.error('数据验证过程中发生错误:', error)
      return false
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

  // 生成模拟分析结果
  private generateMockAnalysis(prompt: string): string {
    // 从prompt中提取语音文本
    const speechMatch = prompt.match(/用户语音输入："([^"]+)"/)
    const speechText = speechMatch ? speechMatch[1] : '未识别到语音内容'
    
    // 基于语音内容生成模拟分析
    let destination = ''
    let budget = 0
    let travelers = 0
    let preferences: string[] = []
    let travelStyle = ''
    let specialRequirements = ''

    // 简单的关键词匹配逻辑
    if (speechText.includes('日本') || speechText.includes('东京')) {
      destination = '日本东京'
    } else if (speechText.includes('泰国') || speechText.includes('普吉岛')) {
      destination = '泰国普吉岛'
    } else if (speechText.includes('北京')) {
      destination = '北京'
    }

    // 预算识别
    const budgetMatch = speechText.match(/(\d+)[千万]?元/)
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1]) * 10000
    }

    // 人数识别
    const travelersMatch = speechText.match(/(\d+)人/)
    if (travelersMatch) {
      travelers = parseInt(travelersMatch[1])
    }

    // 偏好识别
    if (speechText.includes('美食') || speechText.includes('吃')) {
      preferences.push('美食')
    }
    if (speechText.includes('购物') || speechText.includes('买')) {
      preferences.push('购物')
    }
    if (speechText.includes('自然') || speechText.includes('风光')) {
      preferences.push('自然风光')
    }
    if (speechText.includes('文化') || speechText.includes('历史')) {
      preferences.push('历史文化')
    }

    // 风格识别
    if (speechText.includes('经济') || speechText.includes('便宜')) {
      travelStyle = '经济实惠'
    } else if (speechText.includes('舒适') || speechText.includes('舒适')) {
      travelStyle = '舒适体验'
    }

    // 特殊需求
    if (speechText.includes('孩子') || speechText.includes('小孩')) {
      specialRequirements = '带孩子出行，需要亲子活动'
    } else if (speechText.includes('老人')) {
      specialRequirements = '有老人同行，需要舒适安排'
    }

    return JSON.stringify({
      destination: destination,
      travelDate: '',
      budget: budget,
      travelers: travelers,
      preferences: preferences,
      travelStyle: travelStyle,
      specialRequirements: specialRequirements
    }, null, 2)
  }
}

export const volcanoArkService = new VolcanoArkService()
export type { TravelPlanRequest, TravelPlan, DayPlan }