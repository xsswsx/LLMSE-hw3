<template>
  <div class="plans-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-content">
        <div class="logo">AI旅行规划</div>
        <div class="user-actions">
          <el-button @click="$router.push('/')">返回首页</el-button>
          <el-button type="primary" @click="$router.push('/plan')">创建新计划</el-button>
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
      <div class="plans-header">
        <h2>我的旅行计划</h2>
        <p>查看和管理您保存的所有旅行计划</p>
      </div>

      <!-- 计划列表 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="travelPlans.length === 0" class="empty-state">
        <el-empty description="暂无旅行计划">
          <el-button type="primary" @click="$router.push('/plan')">创建第一个计划</el-button>
        </el-empty>
      </div>

      <div v-else class="plans-grid">
        <div class="plans-list">
          <el-card 
            v-for="plan in travelPlans" 
            :key="plan.id" 
            class="plan-card" 
            shadow="hover"
          >
            <template #header>
              <div class="plan-header">
                <h4>{{ plan.title }}</h4>
                <el-tag :type="plan.is_public ? 'success' : 'info'">
                  {{ plan.is_public ? '公开' : '私有' }}
                </el-tag>
              </div>
            </template>

            <div class="plan-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">目的地：</span>
                  <span class="value">{{ plan.destination }}</span>
                </div>
                <div class="info-item">
                  <span class="label">时间：</span>
                  <span class="value">{{ plan.start_date }} 至 {{ plan.end_date }}</span>
                </div>
                <div class="info-item">
                  <span class="label">预算：</span>
                  <span class="value">{{ plan.budget }}元</span>
                </div>
                <div class="info-item">
                  <span class="label">人数：</span>
                  <span class="value">{{ plan.travelers }}人</span>
                </div>
                <div class="info-item">
                  <span class="label">偏好：</span>
                  <span class="value">{{ plan.preferences?.join(', ') || '无' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">创建时间：</span>
                  <span class="value">{{ formatDate(plan.created_at) }}</span>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="plan-actions">
                <el-button type="primary" @click="viewPlan(plan)">查看详情</el-button>
                <el-button @click="editPlan(plan)">编辑</el-button>
                <el-button type="warning" @click="manageExpenses(plan)">费用管理</el-button>
                <el-button type="danger" @click="deletePlan(plan)">删除</el-button>
              </div>
            </template>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 计划详情弹窗 -->
    <el-dialog 
      v-model="showPlanDetail" 
      :title="selectedPlan?.title" 
      width="800px"
      :fullscreen="isFullscreen"
    >
      <div v-if="selectedPlan" class="plan-detail">
        <!-- 计划概览 -->
        <div class="detail-section">
          <h4>计划概览</h4>
          <el-card>
            <p>{{ selectedPlan.plan_data.summary }}</p>
            <div class="summary-details">
              <span><strong>时长：</strong>{{ selectedPlan.plan_data.duration }}天</span>
              <span><strong>总预算：</strong>{{ selectedPlan.plan_data.budget }}元</span>
              <span><strong>人数：</strong>{{ selectedPlan.plan_data.travelers }}人</span>
            </div>
          </el-card>
        </div>

        <!-- 每日行程 -->
        <div class="detail-section">
          <h4>每日行程安排</h4>
          <el-collapse>
            <el-collapse-item 
              v-for="dayPlan in selectedPlan.plan_data.dayPlans" 
              :key="dayPlan.day"
              :title="`第${dayPlan.day}天（${dayPlan.date}）`"
            >
              <div class="day-activities">
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
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 推荐信息 -->
        <div v-if="selectedPlan.plan_data.recommendations && selectedPlan.plan_data.recommendations.length > 0" class="detail-section">
          <h4>推荐信息</h4>
          <el-row :gutter="16">
            <el-col :span="8" v-for="rec in selectedPlan.plan_data.recommendations" :key="rec.category">
              <el-card>
                <h5>{{ rec.category }}</h5>
                <ul>
                  <li v-for="item in rec.items" :key="item">{{ item }}</li>
                </ul>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <template #footer>
        <div class="detail-actions">
          <el-button @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏查看' }}
          </el-button>
          <el-button type="primary" @click="editPlan(selectedPlan)">编辑计划</el-button>
          <el-button @click="showPlanDetail = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="showDeleteConfirm"
      title="确认删除"
      width="400px"
    >
      <span>确定要删除旅行计划 "{{ planToDelete?.title }}" 吗？此操作不可恢复。</span>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { travelPlanService, type SavedTravelPlan } from '@/lib/travel-plan-service'

const router = useRouter()

// 登录状态
const isLoggedIn = ref(false)
const userInfo = ref<any>(null)

// 计划列表
const travelPlans = ref<SavedTravelPlan[]>([])
const loading = ref(false)

// 计划详情
const showPlanDetail = ref(false)
const selectedPlan = ref<SavedTravelPlan | null>(null)
const isFullscreen = ref(false)

// 删除确认
const showDeleteConfirm = ref(false)
const planToDelete = ref<SavedTravelPlan | null>(null)

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

// 加载旅行计划
const loadTravelPlans = async () => {
  if (!isLoggedIn.value) {
    travelPlans.value = []
    return
  }

  loading.value = true
  try {
    const plans = await travelPlanService.getUserTravelPlans()
    travelPlans.value = plans
  } catch (error) {
    ElMessage.error('加载计划列表失败')
  } finally {
    loading.value = false
  }
}

// 查看计划详情
const viewPlan = (plan: SavedTravelPlan) => {
  selectedPlan.value = plan
  showPlanDetail.value = true
  isFullscreen.value = false
}

// 编辑计划
const editPlan = (plan: SavedTravelPlan) => {
  // 跳转到编辑页面，携带计划ID
  router.push(`/plan?edit=${plan.id}`)
}

// 费用管理
const manageExpenses = (plan: SavedTravelPlan) => {
  // 跳转到费用管理页面，携带计划ID
  router.push(`/expense?planId=${plan.id}`)
}

// 删除计划
const deletePlan = (plan: SavedTravelPlan) => {
  planToDelete.value = plan
  showDeleteConfirm.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!planToDelete.value?.id) return

  try {
    const success = await travelPlanService.deleteTravelPlan(planToDelete.value.id)
    if (success) {
      // 从列表中移除
      travelPlans.value = travelPlans.value.filter(p => p.id !== planToDelete.value?.id)
      showDeleteConfirm.value = false
      planToDelete.value = null
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
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

// 组件挂载时加载数据
onMounted(async () => {
  await checkAuthStatus()
  await loadTravelPlans()
})

// 监听登录状态变化
const watchLoginStatus = async () => {
  await checkAuthStatus()
  await loadTravelPlans()
}

watchLoginStatus()
</script>

<style scoped>
.plans-container {
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

.plans-header {
  text-align: center;
  margin-bottom: 40px;
}

.plans-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.plans-header p {
  color: #666;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
}

.empty-state {
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
}

.plans-grid {
  margin-top: 20px;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plan-card {
  margin-bottom: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-header h4 {
  margin: 0;
  flex: 1;
  margin-right: 10px;
}

.plan-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #666;
  font-weight: normal;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.plan-actions {
  display: flex;
  justify-content: space-between;
}

.plan-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: #333;
}

.summary-details {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.day-activities {
  padding: 10px 0;
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

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .plan-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .plan-actions .el-button {
    width: 100%;
  }
  
  .detail-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .detail-actions .el-button {
    width: 100%;
  }
}
</style>