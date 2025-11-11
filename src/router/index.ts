import { createRouter,createWebHistory } from "vue-router";
const router = createRouter({
    history: createWebHistory('/'), // 这里指定基本URL
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/home/index.vue')
        },
        {
            path: '/HelloWorld',
            name: 'HelloWorld',
            component: () => import('@/components/HelloWorld.vue')
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
        }
    ]
})
export default router