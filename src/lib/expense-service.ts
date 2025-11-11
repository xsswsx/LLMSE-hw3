import { supabase } from './supabase'

export interface Expense {
  id?: string
  plan_id: string
  content: string
  amount: number
  category: string
  date: string
  created_at?: string
  updated_at?: string
}

class ExpenseService {
  // 获取指定计划的所有费用记录
  async getExpensesByPlan(planId: string): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('plan_id', planId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取费用记录失败:', error)
      throw error
    }
  }

  // 添加费用记录
  async addExpense(expense: Partial<Expense>): Promise<Expense | null> {
    try {
      // 获取当前用户ID
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('用户未登录')
      }

      const expenseData = {
        ...expense,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('添加费用记录失败:', error)
      throw error
    }
  }

  // 更新费用记录
  async updateExpense(expenseId: string, expense: Partial<Expense>): Promise<Expense | null> {
    try {
      const updateData = {
        ...expense,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新费用记录失败:', error)
      throw error
    }
  }

  // 删除费用记录
  async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('删除费用记录失败:', error)
      throw error
    }
  }

  // 获取费用统计
  async getExpenseStats(planId: string): Promise<{
    total: number
    count: number
    average: number
    byCategory: Record<string, number>
  }> {
    try {
      const expenses = await this.getExpensesByPlan(planId)
      
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const count = expenses.length
      const average = count > 0 ? total / count : 0
      
      const byCategory: Record<string, number> = {}
      expenses.forEach(expense => {
        byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount
      })
      
      return {
        total,
        count,
        average,
        byCategory
      }
    } catch (error) {
      console.error('获取费用统计失败:', error)
      throw error
    }
  }

  // 批量导入费用记录（用于从计划中自动生成）
  async importExpensesFromPlan(planId: string, activities: any[]): Promise<void> {
    try {
      const existingExpenses = await this.getExpensesByPlan(planId)
      
      // 过滤掉已存在的活动费用
      const newActivities = activities.filter(activity => {
        return !existingExpenses.some(expense => 
          expense.content === activity.title && expense.amount === (activity.cost || 0)
        )
      })
      
      // 批量添加新费用记录
      for (const activity of newActivities) {
        if (activity.cost && activity.cost > 0) {
          await this.addExpense({
            plan_id: planId,
            content: activity.title,
            amount: activity.cost,
            category: this.mapActivityTypeToCategory(activity.type),
            date: activity.date || new Date().toISOString().split('T')[0]
          })
        }
      }
    } catch (error) {
      console.error('从计划导入费用记录失败:', error)
      throw error
    }
  }

  // 将活动类型映射到费用分类
  private mapActivityTypeToCategory(activityType: string): string {
    const mapping: Record<string, string> = {
      '交通': '交通',
      '住宿': '住宿',
      '餐饮': '餐饮',
      '景点': '景点门票',
      '购物': '购物',
      '娱乐': '娱乐'
    }
    
    return mapping[activityType] || '其他'
  }

  // 导出费用数据为Excel/CSV格式
  async exportExpenses(planId: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const expenses = await this.getExpensesByPlan(planId)
      
      if (format === 'json') {
        return JSON.stringify(expenses, null, 2)
      } else {
        // CSV格式
        const headers = ['日期', '分类', '内容', '金额', '记录时间']
        const rows = expenses.map(expense => [
          expense.date,
          expense.category,
          `"${expense.content.replace(/"/g, '""')}"`,
          expense.amount.toString(),
          expense.created_at || ''
        ])
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        return csvContent
      }
    } catch (error) {
      console.error('导出费用数据失败:', error)
      throw error
    }
  }
}

export const expenseService = new ExpenseService()