import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../pages/HomePage.vue'
import ResultPage from '../pages/ResultPage.vue'
import TestPage from '../pages/TestPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/test', name: 'test', component: TestPage },
    { path: '/result', name: 'result', component: ResultPage },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
