<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'

defineProps({
  msg: String,
})

const count = ref(0)

// 登录/注册弹窗控制
const showLoginDialog = ref(false)
const showRegisterDialog = ref(false)

// 表单数据
const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

// 登录状态
const isLoggedIn = ref(false)
const userInfo = ref(null)

const openLogin = () => {
  showLoginDialog.value = true
}

const openRegister = () => {
  showRegisterDialog.value = true
}

// 处理用户登录
const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    ElMessage.error('请填写邮箱和密码')
    return
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    })

    if (error) {
      ElMessage.error(error.message)
      return
    }

    if (data.user) {
      isLoggedIn.value = true
      userInfo.value = data.user
      ElMessage.success('登录成功！')
      showLoginDialog.value = false
      loginForm.email = ''
      loginForm.password = ''
    }
  } catch (error) {
    ElMessage.error('登录失败，请稍后重试')
    console.error('Login error:', error)
  }
}

// 处理用户注册
const handleRegister = async () => {
  if (!registerForm.email || !registerForm.password) {
    ElMessage.error('请填写邮箱和密码')
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  if (registerForm.password.length < 6) {
    ElMessage.error('密码长度至少为6位')
    return
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password
    })

    if (error) {
      ElMessage.error(error.message)
      return
    }

    if (data.user) {
      ElMessage.success('注册成功！请检查邮箱完成验证')
      showRegisterDialog.value = false
      registerForm.email = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''
    }
  } catch (error) {
    ElMessage.error('注册失败，请稍后重试')
    console.error('Register error:', error)
  }
}

// 用户登出
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      ElMessage.error('登出失败')
      return
    }

    isLoggedIn.value = false
    userInfo.value = null
    ElMessage.success('已成功登出')
  } catch (error) {
    ElMessage.error('登出失败，请稍后重试')
    console.error('Logout error:', error)
  }
}

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    isLoggedIn.value = true
    userInfo.value = session.user
  } else if (event === 'SIGNED_OUT') {
    isLoggedIn.value = false
    userInfo.value = null
  }
})

// 检查当前登录状态
const checkAuthStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    isLoggedIn.value = true
    userInfo.value = session.user
  }
}

// 组件挂载时检查登录状态
checkAuthStatus()
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-content">
        <div class="logo">AI旅行规划</div>
        <div class="user-actions">
          <template v-if="!isLoggedIn">
            <el-button type="primary" @click="openLogin">登录</el-button>
            <el-button @click="openRegister">注册</el-button>
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
      <div class="home-page">home page</div>
    </div>

    <!-- 登录弹窗 -->
    <el-dialog v-model="showLoginDialog" title="用户登录" width="400px">
      <div class="login-form">
        <el-form label-width="80px">
          <el-form-item label="邮箱">
            <el-input v-model="loginForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showLoginDialog = false">取消</el-button>
        <el-button type="primary" @click="handleLogin">登录</el-button>
      </template>
    </el-dialog>

    <!-- 注册弹窗 -->
    <el-dialog v-model="showRegisterDialog" title="用户注册" width="400px">
      <div class="register-form">
        <el-form label-width="80px">
          <el-form-item label="邮箱">
            <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showRegisterDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.home-container {
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
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.home-page {
  color: #195CC2;
  font-size: 18px;
  text-align: center;
  padding: 60px 0;
}

.login-form,
.register-form {
  padding: 20px 0;
}
</style>