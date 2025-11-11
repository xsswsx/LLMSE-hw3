import { createRouter,createWebHistory } from "vue-router";
const router = createRouter({
    history: createWebHistory('/'), // 这里指定基本URL
    routes: [
        {
          path: '/',
          redirect: '/home'
        },
        {
          path: '/home',
          name: 'Home',
          component: () => import('@/views/home/index.vue')
        },
        {
          path: '/plan',
          name: 'Plan',
          component: () => import('@/views/plan/index.vue')
        },
        {
          path: '/plans',
          name: 'Plans',
          component: () => import('@/views/plans/index.vue')
        },
        {
          path: '/expense',
          name: 'Expense',
          component: () => import('@/views/expense/index.vue')
        }
    ]
})
export default router