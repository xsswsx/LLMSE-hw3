// 旅行计划数据服务
import { supabase } from './supabase'
import type { TravelPlan, DayPlan } from './volcano-ark'
import { ElMessage } from 'element-plus'

export interface SavedTravelPlan {
  id?: string
  user_id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  budget: number
  travelers: number
  preferences: string[]
  travel_style: string
  special_requirements: string
  plan_data: TravelPlan
  created_at?: string
  updated_at?: string
  is_public: boolean
}

class TravelPlanService {
  // 创建旅行计划表
  async createTableIfNotExists() {
    // 在实际项目中，应该在Supabase管理界面创建表
    // 这里只是提供表结构参考
    console.log('旅行计划表结构参考：')
    console.log(`
      CREATE TABLE travel_plans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        budget DECIMAL(10,2) NOT NULL,
        travelers INTEGER NOT NULL,
        preferences TEXT[] DEFAULT '{}',
        travel_style VARCHAR(100),
        special_requirements TEXT,
        plan_data JSONB NOT NULL,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
  }

  // 保存旅行计划
  async saveTravelPlan(planData: SavedTravelPlan): Promise<SavedTravelPlan | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        ElMessage.error('请先登录后再保存计划')
        return null
      }

      const planToSave = {
        ...planData,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('travel_plans')
        .insert(planToSave)
        .select()
        .single()

      if (error) {
        throw error
      }

      ElMessage.success('旅行计划保存成功！')
      return data
    } catch (error) {
      console.error('保存旅行计划失败:', error)
      ElMessage.error('保存失败，请稍后重试')
      return null
    }
  }

  // 更新旅行计划
  async updateTravelPlan(planId: string, planData: Partial<SavedTravelPlan>): Promise<SavedTravelPlan | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        ElMessage.error('请先登录后再更新计划')
        return null
      }

      // 过滤掉不需要更新的字段（如id等）
      const { id, user_id, created_at, ...updateData } = planData
      
      const { data, error } = await supabase
        .from('travel_plans')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase更新错误:', error)
        throw error
      }

      ElMessage.success('旅行计划更新成功！')
      return data
    } catch (error) {
      console.error('更新旅行计划失败:', error)
      ElMessage.error('更新失败，请稍后重试')
      return null
    }
  }

  // 获取用户的所有旅行计划
  async getUserTravelPlans(): Promise<SavedTravelPlan[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('获取旅行计划失败:', error)
      return []
    }
  }

  // 获取特定旅行计划
  async getTravelPlanById(planId: string): Promise<SavedTravelPlan | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('获取旅行计划失败:', error)
      return null
    }
  }

  // 删除旅行计划
  async deleteTravelPlan(planId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        ElMessage.error('请先登录后再删除计划')
        return false
      }

      const { error } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      ElMessage.success('旅行计划删除成功！')
      return true
    } catch (error) {
      console.error('删除旅行计划失败:', error)
      ElMessage.error('删除失败，请稍后重试')
      return false
    }
  }

  // 获取公共旅行计划（示例）
  async getPublicTravelPlans(limit = 10): Promise<SavedTravelPlan[]> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('获取公共旅行计划失败:', error)
      return []
    }
  }
}

export const travelPlanService = new TravelPlanService()
export type { SavedTravelPlan }