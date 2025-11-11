<template>
  <div class="plan-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-content">
        <div class="logo">AI旅行规划</div>
        <div class="user-actions">
          <el-button @click="$router.push('/')">返回首页</el-button>
          <template v-if="!isLoggedIn">
            <el-button type="primary" @click="$router.push('/')">登录</el-button>
            <el-button @click="$router.push('/')">注册</el-button>
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
      <div class="plan-form-section">
        <h2>智能行程规划</h2>
        <p class="subtitle">输入您的旅行需求，AI将为您生成个性化行程</p>
        
        <!-- 行程规划表单 -->
        <el-form :model="planForm" label-width="120px" class="plan-form">
          <el-form-item label="旅行目的地" required>
            <el-input 
              v-model="planForm.destination" 
              placeholder="例如：日本东京、泰国普吉岛"
              clearable
            />
          </el-form-item>

          <el-form-item label="旅行时间" required>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="预算（元）" required>
            <el-input-number
              v-model="planForm.budget"
              :min="1000"
              :max="100000"
              :step="1000"
              controls-position="right"
              placeholder="请输入旅行总预算"
            />
          </el-form-item>

          <el-form-item label="同行人数" required>
            <el-input-number
              v-model="planForm.travelers"
              :min="1"
              :max="20"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="旅行偏好">
            <el-checkbox-group v-model="planForm.preferences">
              <el-checkbox label="美食">美食</el-checkbox>
              <el-checkbox label="购物">购物</el-checkbox>
              <el-checkbox label="自然风光">自然风光</el-checkbox>
              <el-checkbox label="历史文化">历史文化</el-checkbox>
              <el-checkbox label="冒险活动">冒险活动</el-checkbox>
              <el-checkbox label="休闲放松">休闲放松</el-checkbox>
              <el-checkbox label="亲子家庭">亲子家庭</el-checkbox>
              <el-checkbox label="摄影打卡">摄影打卡</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="旅行风格">
            <el-radio-group v-model="planForm.travelStyle">
              <el-radio label="经济实惠">经济实惠</el-radio>
              <el-radio label="舒适体验">舒适体验</el-radio>
              <el-radio label="奢华享受">奢华享受</el-radio>
              <el-radio label="背包客">背包客</el-radio>
              <el-radio label="自由行">自由行</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="特殊需求">
            <el-input
              v-model="planForm.specialRequirements"
              type="textarea"
              :rows="3"
              placeholder="例如：带孩子出行、有老人、饮食禁忌、特殊爱好等"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="generatePlan" :loading="generating">
              生成行程规划
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 行程规划结果 -->
      <div v-if="currentPlan" class="plan-result-section">
        <h3>您的个性化行程规划</h3>
        
        <!-- 行程概览 -->
        <div class="plan-summary">
          <el-card>
            <h4>行程概览</h4>
            <div class="summary-content">
              <p class="summary-text">{{ currentPlan.summary }}</p>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">目的地</span>
                  <span class="stat-value">{{ currentPlan.destination }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">时长</span>
                  <span class="stat-value">{{ currentPlan.duration }}天</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">预算</span>
                  <span class="stat-value">{{ currentPlan.budget ? currentPlan.budget.toLocaleString() : '--' }}元</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">人数</span>
                  <span class="stat-value">{{ currentPlan.travelers }}人</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 每日行程 -->
        <div class="day-plans">
          <h4>每日行程安排</h4>
          <el-card v-for="dayPlan in currentPlan.dayPlans" :key="dayPlan.day" class="day-plan-card">
            <div class="day-header">
              <h5>第{{ dayPlan.day }}天（{{ dayPlan.date }}）</h5>
            </div>
            <div class="activities">
              <div v-for="activity in dayPlan.activities" :key="activity.time" class="activity-item">
                <div class="activity-time">{{ activity.time }}</div>
                <div class="activity-content">
                  <div class="activity-title">
                    <span class="activity-type" :class="getActivityTypeClass(activity.type)">
                      {{ activity.type }}
                    </span>
                    {{ activity.title }}
                  </div>
                  <div class="activity-description">{{ activity.description }}</div>
                  <div v-if="activity.location" class="activity-location">📍 {{ activity.location }}</div>
                  <div v-if="activity.cost" class="activity-cost">💰 约{{ activity.cost }}元</div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 推荐 -->
        <div v-if="currentPlan.recommendations && currentPlan.recommendations.length > 0" class="recommendations">
          <h4>推荐信息</h4>
          <el-row :gutter="16">
            <el-col :span="8" v-for="rec in currentPlan.recommendations" :key="rec.category">
              <el-card>
                <h5>{{ rec.category }}</h5>
                <ul>
                  <li v-for="item in rec.items" :key="item">{{ item }}</li>
                </ul>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 操作按钮 -->
        <div class="plan-actions">
          <el-button type="primary" @click="savePlan">保存计划</el-button>
          <el-button @click="editPlan">编辑计划</el-button>
          <el-button @click="generateNewPlan">重新生成</el-button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-dialog v-model="generating" title="生成中" :close-on-click-modal="false" :show-close="false">
      <div class="loading-content">
        <el-progress :percentage="progressPercentage" :status="progressStatus" />
        <p>AI正在为您生成个性化行程，请稍候...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { volcanoArkService, type TravelPlanRequest, type TravelPlan } from '@/lib/volcano-ark'
import { travelPlanService, type SavedTravelPlan } from '@/lib/travel-plan-service'

const router = useRouter()

// 登录状态
const isLoggedIn = ref(false)
const userInfo = ref<any>(null)

// 表单数据
const planForm = reactive({
  destination: '',
  startDate: '',
  endDate: '',
  budget: 10000,
  travelers: 2,
  preferences: [] as string[],
  travelStyle: '舒适体验',
  specialRequirements: ''
})

const dateRange = ref<string[] | undefined>([])

// 生成状态
const generating = ref(false)
const progressPercentage = ref(0)
const progressStatus = ref<'success' | 'exception' | 'warning' | undefined>(undefined)

// 当前生成的计划
const currentPlan = ref<TravelPlan | null>(null)

// 监听日期范围变化
watch(dateRange, (newRange) => {
  if (newRange && newRange.length === 2 && newRange[0] && newRange[1]) {
    planForm.startDate = newRange[0]
    planForm.endDate = newRange[1]
  } else {
    planForm.startDate = ''
    planForm.endDate = ''
  }
}, { immediate: true })

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

// 生成行程规划
const generatePlan = async () => {
  if (!planForm.destination) {
    ElMessage.error('请输入旅行目的地')
    return
  }
  
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.error('请选择旅行时间')
    return
  }

  generating.value = true
  progressPercentage.value = 0
  progressStatus.value = undefined

  // 模拟进度条
  const progressInterval = setInterval(() => {
    if (progressPercentage.value < 90) {
      progressPercentage.value += 10
    }
  }, 2000)

  try {
    const request: TravelPlanRequest = {
      destination: planForm.destination,
      startDate: planForm.startDate,
      endDate: planForm.endDate,
      budget: planForm.budget,
      travelers: planForm.travelers,
      preferences: planForm.preferences,
      travelStyle: planForm.travelStyle,
      specialRequirements: planForm.specialRequirements
    }

    const plan = await volcanoArkService.generateTravelPlan(request)
    
    clearInterval(progressInterval)
    progressPercentage.value = 100
    progressStatus.value = 'success'
    
    setTimeout(() => {
      generating.value = false
      if (plan) {
        currentPlan.value = plan
        ElMessage.success('行程规划生成成功！')
      }
    }, 500)

  } catch (error) {
    clearInterval(progressInterval)
    progressPercentage.value = 100
    progressStatus.value = 'exception'
    
    setTimeout(() => {
      generating.value = false
      ElMessage.error('生成失败，请稍后重试')
    }, 500)
  }
}

// 重置表单
const resetForm = () => {
  planForm.destination = ''
  dateRange.value = []
  planForm.budget = 10000
  planForm.travelers = 2
  planForm.preferences = []
  planForm.travelStyle = '舒适体验'
  planForm.specialRequirements = ''
  currentPlan.value = null
}

// 获取活动类型样式
const getActivityTypeClass = (type: string) => {
  const typeMap: Record<string, string> = {
    '交通': 'transport',
    '住宿': 'accommodation',
    '景点': 'attraction',
    '餐饮': 'dining',
    '购物': 'shopping',
    '娱乐': 'entertainment'
  }
  return typeMap[type] || 'other'
}

// 保存计划
const savePlan = async () => {
  if (!currentPlan.value) return
  
  if (!isLoggedIn.value) {
    ElMessage.error('请先登录后再保存计划')
    router.push('/')
    return
  }

  try {
    const savedPlan: SavedTravelPlan = {
      title: `${planForm.destination} ${currentPlan.value.duration}天旅行计划`,
      destination: planForm.destination,
      start_date: planForm.startDate,
      end_date: planForm.endDate,
      budget: planForm.budget,
      travelers: planForm.travelers,
      preferences: planForm.preferences,
      travel_style: planForm.travelStyle,
      special_requirements: planForm.specialRequirements,
      plan_data: currentPlan.value,
      is_public: false,
      user_id: '' // 将在服务中自动填充
    }

    const result = await travelPlanService.saveTravelPlan(savedPlan)
    if (result) {
      ElMessage.success('计划保存成功！')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 编辑计划
const editPlan = () => {
  // 将当前计划数据回填到表单
  if (currentPlan.value) {
    planForm.destination = currentPlan.value.destination
    planForm.budget = currentPlan.value.budget
    planForm.travelers = currentPlan.value.travelers
    
    // 这里可以添加更多编辑逻辑
    ElMessage.info('进入编辑模式，修改后重新生成')
  }
}

// 重新生成计划
const generateNewPlan = () => {
  currentPlan.value = null
  generatePlan()
}

// 组件挂载时检查登录状态
onMounted(() => {
  checkAuthStatus()
})
</script>

<style scoped>
.plan-container {
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

.plan-form-section {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
  margin-bottom: 40px;
}

.plan-form-section h2 {
  text-align: center;
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.plan-form {
  max-width: 600px;
  margin: 0 auto;
}

.plan-result-section {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
}

.plan-summary {
  margin-bottom: 30px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-text {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f0f2f5;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.day-plans {
  margin-bottom: 30px;
}

.day-plan-card {
  margin-bottom: 20px;
}

.day-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.activity-item {
  display: flex;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.activity-time {
  flex: 0 0 100px;
  font-weight: bold;
  color: #409eff;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.activity-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  color: #fff;
}

.activity-type.transport { background: #67c23a; }
.activity-type.accommodation { background: #e6a23c; }
.activity-type.attraction { background: #f56c6c; }
.activity-type.dining { background: #409eff; }
.activity-type.shopping { background: #909399; }
.activity-type.entertainment { background: #9c27b0; }
.activity-type.other { background: #607d8b; }

.activity-description {
  color: #666;
  margin-bottom: 5px;
}

.activity-location,
.activity-cost {
  font-size: 12px;
  color: #999;
}

.recommendations {
  margin-bottom: 30px;
}

.plan-actions {
  text-align: center;
  margin-top: 30px;
}

.loading-content {
  text-align: center;
}

.loading-content p {
  margin-top: 15px;
  color: #666;
}
</style>