import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // 注册路由
import {store} from './store' // 注册vuex
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

createApp(App).use(router).use(store).use(ElementPlus).mount('#app')