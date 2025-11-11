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
          <div class="action-buttons">
            <el-button type="success" @click="generateAIAdviceHandler">
              <i class="el-icon-chat-dot-round" /> AI建议
            </el-button>
            <el-button type="primary" @click="addExpense">
              <i class="el-icon-plus" /> 添加费用
            </el-button>
          </div>
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

    <!-- AI建议对话框 -->
    <el-dialog 
      title="AI费用建议" 
      v-model="showAIDialog" 
      width="600px"
      :close-on-click-modal="false">
      <div class="ai-advice-container">
        <div v-if="isGeneratingAdvice" class="ai-loading">
          <el-skeleton :rows="5" animated />
          <div style="text-align: center; margin-top: 20px;">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span style="margin-left: 8px;">AI正在分析您的费用数据...</span>
          </div>
        </div>
        
        <div v-else-if="aiAdvice" class="ai-advice-content">
          <div class="advice-header">
            <el-tag type="success">AI建议</el-tag>
            <span class="advice-title">基于您的旅行计划和费用记录</span>
          </div>
          
          <div class="advice-text">
            <p>{{ aiAdvice }}</p>
          </div>
          
          <div class="advice-actions">
            <el-button @click="regenerateAdvice">重新生成</el-button>
            <el-button type="primary" @click="copyAdvice">复制建议</el-button>
          </div>
        </div>
        
        <div v-else class="ai-error">
          <el-empty description="生成AI建议失败，请重试" />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showAIDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'
import { expenseService, type Expense } from '@/lib/expense-service'
import { travelPlanService } from '@/lib/travel-plan-service'
import { generateAIAdvice, checkVolcanoArkConfig } from '@/lib/volcano-ark-service'

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

// AI建议状态
const showAIDialog = ref(false)
const isGeneratingAdvice = ref(false)
const aiAdvice = ref('')

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

// 生成AI建议
const generateAIAdviceHandler = async () => {
  showAIDialog.value = true
  isGeneratingAdvice.value = true
  aiAdvice.value = ''
  
  try {
    // 检查API配置
    const hasValidConfig = checkVolcanoArkConfig()
    if (!hasValidConfig) {
      ElMessage.warning('火山方舟API配置缺失，使用模拟建议')
      await generateMockAIAdvice()
      return
    }
    
    // 构造提示词
    const prompt = constructAIPrompt()
    
    // 调用火山方舟API
    aiAdvice.value = await generateAIAdvice(prompt)
    
    ElMessage.success('AI建议生成成功')
    
  } catch (error) {
    console.error('生成AI建议失败:', error)
    
    // API调用失败时，使用模拟建议
    ElMessage.warning('AI服务暂时不可用，使用模拟建议')
    await generateMockAIAdvice()
  } finally {
    isGeneratingAdvice.value = false
  }
}

// 构造AI提示词
const constructAIPrompt = () => {
  const plan = planInfo.value
  const totalBudget = plan?.budget || 0
  const currentExpenses = totalExpense.value
  const remainingBudgetValue = remainingBudget.value
  const isOverBudgetValue = isOverBudget.value
  
  // 分类统计信息
  const categoryStatsText = categoryStats.value.map(stat => 
    `${stat.category}: ${stat.amount}元 (${stat.percentage}%)`
  ).join('，')
  
  // 最近消费记录
  const recentExpenses = filteredExpenses.value.slice(0, 5).map(expense =>
    `${expense.content}: ${expense.amount}元`
  ).join('，')
  
  return `
请根据以下旅行计划和费用记录，为用户的旅游费用管理提供简单建议：

旅行计划信息：
- 目的地：${plan?.destination || '未知'}
- 时间：${plan?.start_date || '未知'} 至 ${plan?.end_date || '未知'}
- 总预算：${totalBudget.toLocaleString()}元
- 当前支出：${currentExpenses.toLocaleString()}元
- 剩余预算：${remainingBudgetValue.toLocaleString()}元
- 预算状态：${isOverBudgetValue ? '已超支' : '正常'}

费用统计：
${categoryStatsText}

最近消费记录：
${recentExpenses}

请提供以下方面的建议：
1. 预算分配是否合理
2. 潜在的节省机会
3. 未来消费建议

使用段落格式，可以适当使用emoji，不要使用markdown格式。
`
}

// 模拟AI建议（备用方案）
const generateMockAIAdvice = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 模拟不同类型的AI建议
  const adviceTemplates = [
    `基于您的旅行计划分析，我发现您的费用管理整体比较合理。建议关注以下几点：

📊 **预算分配建议**：
- 目前${categoryStats.value.find(s => s.category === '交通')?.percentage || 0}%的预算用于交通，相对合理
- ${categoryStats.value.find(s => s.category === '住宿')?.percentage || 0}%用于住宿，可考虑优化住宿选择

💡 **优化建议**：
- 餐饮费用占比${categoryStats.value.find(s => s.category === '餐饮')?.percentage || 0}%，建议尝试当地特色小餐馆
- 购物预算可适当控制，重点放在体验型消费

🎯 **后续建议**：
- 每日消费控制在${Math.round(remainingBudget.value / Math.max(1, (new Date(planInfo.value?.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}元以内
- 预留10%预算作为应急资金`,

    `您的旅行费用管理需要重点关注预算控制。分析如下：

⚠️ **重点关注**：
- 当前支出${totalExpense.value.toLocaleString()}元，占总预算${planInfo.value?.budget ? Math.round(totalExpense.value / planInfo.value.budget * 100) : 0}%
- ${isOverBudget.value ? '已超出预算，需要严格控制后续支出' : '预算使用进度正常'}

🔍 **费用分析**：
- 交通费用占比${categoryStats.value.find(s => s.category === '交通')?.percentage || 0}%，考虑是否有更经济的出行方式
- 娱乐费用可以适当优化，选择免费或低成本活动

💡 **实用建议**：
- 制定每日消费上限
- 优先体验当地文化而非购物消费
- 关注当地优惠活动和免费景点`,

    `您的旅行费用结构整体健康，以下是我的专业建议：

✅ **优势分析**：
- 费用分布相对均衡
- ${!isOverBudget.value ? '预算控制良好' : '需要加强预算管理'}

📈 **优化方向**：
- 餐饮：尝试当地市场和小吃，体验更地道美食
- 交通：考虑公共交通或拼车服务节省费用
- 住宿：提前预订可能有更多优惠选择

🔮 **前瞻建议**：
- 剩余${remainingBudget.value.toLocaleString()}元预算，建议合理分配到剩余天数
- 关注${planInfo.value?.destination}当地的消费水平，调整消费策略`
  ]
  
  // 根据当前状态选择最合适的建议模板
  let selectedTemplate = 0
  if (isOverBudget.value) {
    selectedTemplate = 1
  } else if (remainingBudget.value / (planInfo.value?.budget || 1) > 0.5) {
    selectedTemplate = 2
  }
  
  aiAdvice.value = adviceTemplates[selectedTemplate]
}

// 重新生成建议
const regenerateAdvice = async () => {
  await generateAIAdviceHandler()
}

// 复制建议
const copyAdvice = async () => {
  try {
    await navigator.clipboard.writeText(aiAdvice.value)
    ElMessage.success('建议已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
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

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
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

/* AI建议样式 */
.ai-advice-container {
  min-height: 300px;
}

.ai-loading {
  text-align: center;
  padding: 40px 0;
}

.ai-advice-content {
  padding: 20px 0;
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.advice-title {
  color: #666;
  font-size: 14px;
}

.advice-text {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.advice-text p {
  margin: 0;
  white-space: pre-wrap;
  color: #333;
}

.advice-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ai-error {
  text-align: center;
  padding: 40px 0;
}
</style>