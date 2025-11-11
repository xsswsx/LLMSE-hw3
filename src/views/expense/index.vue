<template>
  <div class="expense-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-content">
        <div class="logo">旅行费用管理</div>
        <div class="user-actions">
          <el-button @click="$router.back()">返回</el-button>
          <el-button type="primary" @click="$router.push('/plans')">我的计划</el-button>
          <template v-if="!isLoggedIn">
            <el-button type="primary" @click="$router.push('/')">登录</el-button>
          </template>
          <template v-else>
            <span class="user-email">{{ userInfo?.email }}</span>
            <el-button @click="handleLogout">退出</el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 旅行计划信息 -->
      <div class="plan-info-section">
        <el-card>
          <h2>{{ planInfo?.title }}</h2>
          <div class="plan-summary">
            <div class="summary-item">
              <span class="label">目的地：</span>
              <span class="value">{{ planInfo?.destination }}</span>
            </div>
            <div class="summary-item">
              <span class="label">时间：</span>
              <span class="value">{{ planInfo?.start_date }} 至 {{ planInfo?.end_date }}</span>
            </div>
            <div class="summary-item">
              <span class="label">预算：</span>
              <span class="value">{{ planInfo?.budget ? planInfo.budget.toLocaleString() : '--' }} 元</span>
            </div>
            <div class="summary-item">
              <span class="label">当前支出：</span>
              <span class="value total-expense">{{ totalExpense.toLocaleString() }} 元</span>
            </div>
            <div class="summary-item">
              <span class="label">剩余预算：</span>
              <span class="value" :class="{ 'over-budget': isOverBudget }">{{ remainingBudget.toLocaleString() }} 元</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 费用管理区域 -->
      <div class="expense-management-section">
        <div class="section-header">
          <h3>费用记录</h3>
          <el-button type="primary" @click="addExpense">
            <i class="el-icon-plus" /> 添加费用
          </el-button>
        </div>

        <!-- 费用统计 -->
        <div class="expense-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总费用" :value="totalExpense" suffix="元" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="记录数量" :value="expenses.length" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="平均费用" :value="averageExpense" suffix="元" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="预算剩余" :value="remainingBudget" suffix="元" 
                :value-class="isOverBudget ? 'over-budget-text' : ''" />
            </el-col>
          </el-row>
        </div>

        <!-- 费用列表 -->
        <div class="expense-list">
          <el-table :data="filteredExpenses" style="width: 100%" empty-text="暂无费用记录">
            <el-table-column prop="content" label="开销内容" min-width="200">
              <template #default="{ row }">
                <div class="expense-content">
                  <span class="content-text">{{ row.content }}</span>
                  <el-tag v-if="row.category" size="small" :type="getCategoryType(row.category)">
                    {{ row.category }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="expense-amount">{{ row.amount.toLocaleString() }} 元</span>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="记录时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ $index, row }">
                <el-button size="small" @click="editExpense($index, row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteExpense($index, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 费用分类统计 -->
        <div class="category-chart">
          <h4>费用分类统计</h4>
          <div v-if="categoryStats.length > 0" class="chart-container">
            <el-row :gutter="20">
              <el-col :span="8" v-for="stat in categoryStats" :key="stat.category">
                <el-card>
                  <div class="category-stat">
                    <div class="category-name">{{ stat.category }}</div>
                    <div class="category-amount">{{ stat.amount.toLocaleString() }} 元</div>
                    <div class="category-percentage">{{ stat.percentage }}%</div>
                    <el-progress 
                      :percentage="stat.percentage" 
                      :show-text="false"
                      :color="getCategoryColor(stat.category)" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          <div v-else class="empty-chart">
            <el-empty description="暂无费用数据" />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑费用对话框 -->
    <el-dialog 
      :title="isEditing ? '编辑费用' : '添加费用'" 
      v-model="showAddDialog" 
      width="500px"
      :close-on-click-modal="false">
      <el-form :model="expenseForm" :rules="expenseRules" ref="expenseFormRef" label-width="80px">
        <el-form-item label="开销内容" prop="content">
          <el-input 
            v-model="expenseForm.content" 
            placeholder="请输入开销内容"
            maxlength="100"
            show-word-limit />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number 
            v-model="expenseForm.amount" 
            :min="0" 
            :step="10"
            :precision="2"
            placeholder="请输入金额"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="expenseForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="交通" value="交通" />
            <el-option label="住宿" value="住宿" />
            <el-option label="餐饮" value="餐饮" />
            <el-option label="景点门票" value="景点门票" />
            <el-option label="购物" value="购物" />
            <el-option label="娱乐" value="娱乐" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="expenseForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveExpense">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { expenseService, type Expense } from '@/lib/expense-service'
import { travelPlanService } from '@/lib/travel-plan-service'

const route = useRoute()
const router = useRouter()

// 登录状态
const isLoggedIn = ref(false)
const userInfo = ref<any>(null)

// 计划信息
const planInfo = ref<any>(null)
const planId = ref<string>('')

// 费用列表
const expenses = ref<Expense[]>([])

// 对话框状态
const showAddDialog = ref(false)
const isEditing = ref(false)
const editingIndex = ref(-1)

// 表单数据
const expenseForm = reactive({
  content: '',
  amount: 0,
  category: '',
  date: ''
})

const expenseFormRef = ref()

// 表单验证规则
const expenseRules = {
  content: [
    { required: true, message: '请输入开销内容', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额必须大于0', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ]
}

// 计算属性
const totalExpense = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
})

const averageExpense = computed(() => {
  if (expenses.value.length === 0) return 0
  return Math.round(totalExpense.value / expenses.value.length)
})

const remainingBudget = computed(() => {
  const budget = planInfo.value?.budget || 0
  return Math.max(0, budget - totalExpense.value)
})

const isOverBudget = computed(() => {
  return totalExpense.value > (planInfo.value?.budget || 0)
})

const filteredExpenses = computed(() => {
  return expenses.value.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const categoryStats = computed(() => {
  const categories = ['交通', '住宿', '餐饮', '景点门票', '购物', '娱乐', '其他']
  const stats = categories.map(category => {
    const amount = expenses.value
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const percentage = totalExpense.value > 0 ? Math.round((amount / totalExpense.value) * 100) : 0
    
    return {
      category,
      amount,
      percentage
    }
  }).filter(stat => stat.amount > 0)
  
  return stats
})

// 检查登录状态
const checkAuthStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    isLoggedIn.value = true
    userInfo.value = session.user
  }
}

// 用户登出
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    isLoggedIn.value = false
    userInfo.value = null
    ElMessage.success('已成功登出')
    router.push('/')
  } catch (error) {
    ElMessage.error('登出失败')
  }
}

// 加载计划信息
const loadPlanInfo = async () => {
  try {
    const plan = await travelPlanService.getTravelPlanById(planId.value)
    if (plan) {
      planInfo.value = plan
    }
  } catch (error) {
    ElMessage.error('加载计划信息失败')
  }
}

// 加载费用列表
const loadExpenses = async () => {
  try {
    const expenseList = await expenseService.getExpensesByPlan(planId.value)
    expenses.value = expenseList || []
  } catch (error) {
    ElMessage.error('加载费用列表失败')
    expenses.value = []
  }
}

// 添加费用
const addExpense = () => {
  isEditing.value = false
  editingIndex.value = -1
  
  // 重置表单
  Object.assign(expenseForm, {
    content: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0] // 默认今天
  })
  
  showAddDialog.value = true
}

// 编辑费用
const editExpense = (index: number, expense: Expense) => {
  isEditing.value = true
  editingIndex.value = index
  
  // 填充表单数据
  Object.assign(expenseForm, {
    content: expense.content,
    amount: expense.amount,
    category: expense.category,
    date: expense.date
  })
  
  showAddDialog.value = true
}

// 保存费用
const saveExpense = async () => {
  try {
    // 验证表单
    await expenseFormRef.value?.validate()
    
    const expenseData: Partial<Expense> = {
      plan_id: planId.value,
      content: expenseForm.content,
      amount: expenseForm.amount,
      category: expenseForm.category,
      date: expenseForm.date
    }
    
    if (isEditing.value && editingIndex.value >= 0) {
      // 编辑模式
      const expenseId = expenses.value[editingIndex.value].id
      if (expenseId) {
        await expenseService.updateExpense(expenseId, expenseData)
        ElMessage.success('费用更新成功')
      }
    } else {
      // 添加模式
      await expenseService.addExpense(expenseData)
      ElMessage.success('费用添加成功')
    }
    
    showAddDialog.value = false
    await loadExpenses() // 重新加载费用列表
    
  } catch (error) {
    console.error('保存费用失败:', error)
    ElMessage.error('保存失败，请检查输入')
  }
}

// 删除费用
const deleteExpense = async (index: number, expense: Expense) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用记录"${expense.content}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (expense.id) {
      await expenseService.deleteExpense(expense.id)
      ElMessage.success('删除成功')
      await loadExpenses()
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 工具函数
const formatDate = (dateStr: string) => {
  return dateStr
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getCategoryType = (category: string) => {
  const typeMap: Record<string, any> = {
    '交通': 'primary',
    '住宿': 'success',
    '餐饮': 'warning',
    '景点门票': 'info',
    '购物': 'danger',
    '娱乐': 'primary',
    '其他': ''
  }
  return typeMap[category] || ''
}

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '交通': '#409EFF',
    '住宿': '#67C23A',
    '餐饮': '#E6A23C',
    '景点门票': '#909399',
    '购物': '#F56C6C',
    '娱乐': '#9C27B0',
    '其他': '#607D8B'
  }
  return colorMap[category] || '#409EFF'
}

// 组件挂载时初始化
onMounted(async () => {
  await checkAuthStatus()
  
  // 获取路由参数
  planId.value = route.query.planId as string
  
  if (!planId.value) {
    ElMessage.error('缺少计划ID参数')
    router.push('/plans')
    return
  }
  
  await loadPlanInfo()
  await loadExpenses()
})
</script>

<style scoped>
.expense-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.user-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-email {
  margin-right: 12px;
  color: #666;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.plan-info-section {
  margin-bottom: 30px;
}

.plan-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.summary-item .label {
  font-weight: bold;
  color: #666;
}

.summary-item .value {
  font-weight: bold;
  color: #333;
}

.total-expense {
  color: #f56c6c;
  font-size: 18px;
}

.over-budget {
  color: #f56c6c;
}

.expense-management-section {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.expense-stats {
  margin-bottom: 30px;
}

.expense-list {
  margin-bottom: 40px;
}

.expense-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-text {
  flex: 1;
}

.expense-amount {
  font-weight: bold;
  color: #f56c6c;
}

.category-chart {
  margin-top: 40px;
}

.chart-container {
  margin-top: 20px;
}

.category-stat {
  text-align: center;
}

.category-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.category-amount {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.category-percentage {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.empty-chart {
  text-align: center;
  padding: 40px 0;
}

.over-budget-text {
  color: #f56c6c !important;
}
</style>