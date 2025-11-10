import { createRouter,createWebHistory } from "vue-router";
const router = createRouter({
    history: createWebHistory('/'), // 这里指定基本URL
    routes: [
        {
            path: '/HelloWorld',
            name: 'HelloWorld',
            component: () => import('@/components/HelloWorld.vue')
        },
        {
          path: '/home',
          name: 'Home',
          component: () => import('@/views/home/index.vue')
        }
    ]
})
export default router