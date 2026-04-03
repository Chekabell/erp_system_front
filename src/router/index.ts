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
      { path: 'groups/:id', name: 'group-detail', component: () => import('@/views/GroupDetailView.vue'), meta: { title: 'Карточка группы' } },
      { path: 'specifications', name: 'specifications', component: () => import('@/views/SpecificationsView.vue'), meta: { title: 'Спецификации' } },
      { path: 'companies', name: 'companies', component: () => import('@/views/CompaniesView.vue'), meta: { title: 'Компании' } },
      { path: 'gantt', name: 'gantt', component: () => import('@/views/GanttChartView.vue'), meta: { title: 'Диаграмма Ганта' } },
      { path: 'integration', name: 'integration', component: () => import('@/views/IntegrationView.vue'), meta: { title: 'XML Интеграция' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(to => {
  document.title = to.meta.title ? `${to.meta.title} | Global ERP Learning` : 'Global ERP Learning'
})

export default router
