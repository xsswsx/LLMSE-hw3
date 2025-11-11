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
        <h2>{{ isEditingMode ? '编辑旅行计划' : '智能行程规划' }}</h2>
        <p class="subtitle">{{ isEditingMode ? '修改您的旅行计划，可重新生成或手动调整' : '输入您的旅行需求，AI将为您生成个性化行程' }}</p>
        
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
              <el-checkbox value="美食">美食</el-checkbox>
              <el-checkbox value="购物">购物</el-checkbox>
              <el-checkbox value="自然风光">自然风光</el-checkbox>
              <el-checkbox value="历史文化">历史文化</el-checkbox>
              <el-checkbox value="冒险活动">冒险活动</el-checkbox>
              <el-checkbox value="休闲放松">休闲放松</el-checkbox>
              <el-checkbox value="亲子家庭">亲子家庭</el-checkbox>
              <el-checkbox value="摄影打卡">摄影打卡</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="旅行风格">
            <el-radio-group v-model="planForm.travelStyle">
              <el-radio value="经济实惠">经济实惠</el-radio>
              <el-radio value="舒适体验">舒适体验</el-radio>
              <el-radio value="奢华享受">奢华享受</el-radio>
              <el-radio value="背包客">背包客</el-radio>
              <el-radio value="自由行">自由行</el-radio>
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
          <div class="day-plans-header">
            <h4>每日行程安排</h4>
            <el-button type="primary" @click="addNewDayPlan">添加新的一天</el-button>
          </div>
          <el-card v-for="dayPlan in currentPlan.dayPlans" :key="dayPlan.day" class="day-plan-card">
            <div class="day-header">
              <h5>第{{ dayPlan.day }}天（{{ dayPlan.date }}）</h5>
              <div class="day-actions">
                <el-button size="small" @click="editDayPlan(dayPlan)">编辑日期</el-button>
                <el-button size="small" type="danger" @click="deleteDayPlan(dayPlan.day)">删除</el-button>
              </div>
            </div>
            <div class="activities">
              <div v-for="(activity, index) in dayPlan.activities" :key="activity.time + index" class="activity-item">
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
                <div class="activity-actions">
                  <el-button size="small" @click="editActivity(dayPlan.day, index)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteActivity(dayPlan.day, index)">删除</el-button>
                </div>
              </div>
              <div class="add-activity-btn">
                <el-button type="primary" size="small" @click="addActivity(dayPlan.day)">+ 添加活动</el-button>
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

    <!-- 编辑活动对话框 -->
    <el-dialog v-model="editActivityDialogVisible" title="编辑活动" width="600px">
      <div class="edit-activity-form">
        <el-form :model="editActivityForm" label-width="80px">
          <el-form-item label="时间">
            <el-input v-model="editActivityForm.time" placeholder="例如：09:00-12:00" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="editActivityForm.type" placeholder="请选择活动类型">
              <el-option label="交通" value="交通" />
              <el-option label="住宿" value="住宿" />
              <el-option label="景点" value="景点" />
              <el-option label="餐饮" value="餐饮" />
              <el-option label="购物" value="购物" />
              <el-option label="娱乐" value="娱乐" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="editActivityForm.title" placeholder="活动标题" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="editActivityForm.description" type="textarea" :rows="3" placeholder="活动详细描述" />
          </el-form-item>
          <el-form-item label="地点">
            <el-input v-model="editActivityForm.location" placeholder="活动地点" />
          </el-form-item>
          <el-form-item label="费用">
            <el-input-number v-model="editActivityForm.cost" :min="0" :step="10" placeholder="费用" />
          </el-form-item>
          <el-form-item label="时长">
            <el-input v-model="editActivityForm.duration" placeholder="例如：2小时" />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <el-button @click="editActivityDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveActivityEdit">保存</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加活动对话框 -->
    <el-dialog v-model="addActivityDialogVisible" title="添加活动" width="600px">
      <div class="add-activity-form">
        <el-form :model="newActivityForm" label-width="80px">
          <el-form-item label="时间">
            <el-input v-model="newActivityForm.time" placeholder="例如：09:00-12:00" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="newActivityForm.type" placeholder="请选择活动类型">
              <el-option label="交通" value="交通" />
              <el-option label="住宿" value="住宿" />
              <el-option label="景点" value="景点" />
              <el-option label="餐饮" value="餐饮" />
              <el-option label="购物" value="购物" />
              <el-option label="娱乐" value="娱乐" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="newActivityForm.title" placeholder="活动标题" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="newActivityForm.description" type="textarea" :rows="3" placeholder="活动详细描述" />
          </el-form-item>
          <el-form-item label="地点">
            <el-input v-model="newActivityForm.location" placeholder="活动地点" />
          </el-form-item>
          <el-form-item label="费用">
            <el-input-number v-model="newActivityForm.cost" :min="0" :step="10" placeholder="费用" />
          </el-form-item>
          <el-form-item label="时长">
            <el-input v-model="newActivityForm.duration" placeholder="例如：2小时" />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <el-button @click="addActivityDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNewActivity">添加</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { volcanoArkService, type TravelPlanRequest, type TravelPlan } from '@/lib/volcano-ark'
import { travelPlanService, type SavedTravelPlan } from '@/lib/travel-plan-service'

const router = useRouter()
const route = useRoute()

// 登录状态
const isLoggedIn = ref(false)
const userInfo = ref<any>(null)

// 编辑模式
const editingPlanId = ref<string>('')
const isEditingMode = ref(false)

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

// 编辑状态
const editActivityDialogVisible = ref(false)
const addActivityDialogVisible = ref(false)
const editingDay = ref<number>(0)
const editingActivityIndex = ref<number>(-1)

// 编辑活动表单
const editActivityForm = reactive({
  time: '',
  type: '',
  title: '',
  description: '',
  location: '',
  cost: 0,
  duration: ''
})

// 添加活动表单
const newActivityForm = reactive({
  time: '',
  type: '',
  title: '',
  description: '',
  location: '',
  cost: 0,
  duration: ''
})

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

    let result
    if (isEditingMode.value && editingPlanId.value) {
      // 编辑模式下更新现有计划
      savedPlan.id = editingPlanId.value
      result = await travelPlanService.updateTravelPlan(editingPlanId.value, savedPlan)
    } else {
      // 新创建计划
      result = await travelPlanService.saveTravelPlan(savedPlan)
    }
    
    if (result) {
      ElMessage.success(isEditingMode.value ? '计划更新成功！' : '计划保存成功！')
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



// 编辑活动
const editActivity = (day: number, activityIndex: number) => {
  if (!currentPlan.value) return
  
  const dayPlan = currentPlan.value.dayPlans.find(d => d.day === day)
  if (!dayPlan) return
  
  const activity = dayPlan.activities[activityIndex]
  if (!activity) return
  
  editingDay.value = day
  editingActivityIndex.value = activityIndex
  
  // 填充编辑表单
  editActivityForm.time = activity.time || ''
  editActivityForm.type = activity.type || ''
  editActivityForm.title = activity.title || ''
  editActivityForm.description = activity.description || ''
  editActivityForm.location = activity.location || ''
  editActivityForm.cost = activity.cost || 0
  editActivityForm.duration = activity.duration || ''
  
  editActivityDialogVisible.value = true
}

// 保存活动编辑
const saveActivityEdit = () => {
  if (!currentPlan.value || editingDay.value === 0 || editingActivityIndex.value === -1) return
  
  const dayPlan = currentPlan.value.dayPlans.find(d => d.day === editingDay.value)
  if (!dayPlan) return
  
  // 更新活动数据
  dayPlan.activities[editingActivityIndex.value] = {
    time: editActivityForm.time,
    type: editActivityForm.type as any,
    title: editActivityForm.title,
    description: editActivityForm.description,
    location: editActivityForm.location,
    cost: editActivityForm.cost,
    duration: editActivityForm.duration
  }
  
  editActivityDialogVisible.value = false
  editingDay.value = 0
  editingActivityIndex.value = -1
  
  // 重置表单
  Object.assign(editActivityForm, {
    time: '',
    type: '',
    title: '',
    description: '',
    location: '',
    cost: 0,
    duration: ''
  })
  
  ElMessage.success('活动编辑成功')
}

// 删除活动
const deleteActivity = (day: number, activityIndex: number) => {
  if (!currentPlan.value) return
  
  const dayPlan = currentPlan.value.dayPlans.find(d => d.day === day)
  if (!dayPlan) return
  
  dayPlan.activities.splice(activityIndex, 1)
  ElMessage.success('活动删除成功')
}

// 添加活动
const addActivity = (day: number) => {
  editingDay.value = day
  
  // 重置表单
  Object.assign(newActivityForm, {
    time: '',
    type: '',
    title: '',
    description: '',
    location: '',
    cost: 0,
    duration: ''
  })
  
  addActivityDialogVisible.value = true
}

// 保存新活动
const saveNewActivity = () => {
  if (!currentPlan.value || editingDay.value === 0) return
  
  const dayPlan = currentPlan.value.dayPlans.find(d => d.day === editingDay.value)
  if (!dayPlan) return
  
  // 添加新活动
  dayPlan.activities.push({
    time: newActivityForm.time,
    type: newActivityForm.type as any,
    title: newActivityForm.title,
    description: newActivityForm.description,
    location: newActivityForm.location,
    cost: newActivityForm.cost,
    duration: newActivityForm.duration
  })
  
  addActivityDialogVisible.value = false
  editingDay.value = 0
  
  // 重置表单
  Object.assign(newActivityForm, {
    time: '',
    type: '',
    title: '',
    description: '',
    location: '',
    cost: 0,
    duration: ''
  })
  
  ElMessage.success('活动添加成功')
}

// 添加新的一天
const addNewDayPlan = () => {
  if (!currentPlan.value) return
  
  const newDay = currentPlan.value.dayPlans.length + 1
  const startDate = new Date(planForm.startDate)
  const newDate = new Date(startDate)
  newDate.setDate(startDate.getDate() + newDay - 1)
  
  currentPlan.value.dayPlans.push({
    day: newDay,
    date: newDate.toISOString().split('T')[0],
    activities: []
  })
  
  ElMessage.success(`第${newDay}天添加成功`)
}

// 编辑日期
const editDayPlan = (dayPlan: any) => {
  const newDate = prompt(`请输入第${dayPlan.day}天的新日期 (YYYY-MM-DD):`, dayPlan.date)
  if (newDate) {
    dayPlan.date = newDate
    ElMessage.success('日期修改成功')
  }
}

// 删除某一天
const deleteDayPlan = (day: number) => {
  if (!currentPlan.value) return
  
  if (currentPlan.value.dayPlans.length <= 1) {
    ElMessage.warning('至少需要保留一天行程')
    return
  }
  
  currentPlan.value.dayPlans = currentPlan.value.dayPlans.filter(d => d.day !== day)
  
  // 重新排序天数
  currentPlan.value.dayPlans.forEach((d, index) => {
    d.day = index + 1
  })
  
  ElMessage.success(`第${day}天删除成功`)
}

// 加载已存在的计划
const loadExistingPlan = async (planId: string) => {
  try {
    const plan = await travelPlanService.getTravelPlanById(planId)
    if (plan) {
      // 填充表单数据
      planForm.destination = plan.destination
      planForm.startDate = plan.start_date
      planForm.endDate = plan.end_date
      planForm.budget = plan.budget
      planForm.travelers = plan.travelers
      planForm.preferences = plan.preferences || []
      planForm.travelStyle = plan.travel_style
      planForm.specialRequirements = plan.special_requirements || ''
      
      // 设置日期范围
      dateRange.value = [plan.start_date, plan.end_date]
      
      // 设置当前计划
      currentPlan.value = plan.plan_data
      
      // 设置为编辑模式
      isEditingMode.value = true
      editingPlanId.value = planId
    }
  } catch (error) {
    ElMessage.error('加载计划失败')
  }
}

// 检查路由参数
const checkRouteParams = () => {
  const editParam = route.query.edit as string
  if (editParam) {
    editingPlanId.value = editParam
    isEditingMode.value = true
    // 加载已存在的计划
    loadExistingPlan(editParam)
  }
}

// 组件挂载时检查登录状态和路由参数
onMounted(() => {
  checkAuthStatus()
  checkRouteParams()
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

/* 编辑功能样式 */
.day-plans-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.day-actions {
  display: flex;
  gap: 8px;
}

.activity-item {
  display: flex;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  position: relative;
}

.activity-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-left: 10px;
}

.add-activity-btn {
  text-align: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.edit-activity-form,
.add-activity-form {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

/* 编辑功能样式 */
.day-plans-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.day-actions {
  display: flex;
  gap: 8px;
}

.activity-item {
  display: flex;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  position: relative;
}

.activity-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-left: 10px;
}

.add-activity-btn {
  text-align: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.edit-activity-form,
.add-activity-form {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.dialog-footer .el-button {
  margin-left: 10px;
}
</style>