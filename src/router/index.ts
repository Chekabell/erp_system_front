import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'), meta: { title: 'Главная' },
      },
      {
        path: 'courses',
        name: 'courses',
        component: () => import('@/views/CoursesView.vue'),
        meta: { title: 'Курсы обучения' },
      },
      { path: 'participants', name: 'participants', component: () => import('@/views/ParticipantsView.vue'), meta: { title: 'Участники обучения' } },
      { path: 'groups', name: 'groups', component: () => import('@/views/GroupsView.vue'), meta: { title: 'Учебные группы' } },
      { path: 'specifications', name: 'specifications', component: () => import('@/views/SpecificationsView.vue'), meta: { title: 'Спецификации' } },
      { path: 'companies', name: 'companies', component: () => import('@/views/CompaniesView.vue'), meta: { title: 'Компании' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(to => {
  document.title = to.meta.title ? `${to.meta.title} | АРБУЗ ERP` : 'АРБУЗ ERP'
})

export default router
