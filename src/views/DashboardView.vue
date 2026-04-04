<template>
  <v-container fluid>
    <!-- Заголовок -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h3 font-weight-semibold" style="font-size: 40px;">Статистика</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <!-- 📊 KPI Карточки -->
    <v-row class="mb-6">
      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4 rounded-xl" height="100%" style="background-image: linear-gradient(to bottom, rgba(2, 136, 255, 0.6) 0%, rgba(1, 136, 255, 0.75) 38%, #1976D2 100%);" variant="tonal">
          <div class="d-flex align-center ga-3 mb-3">
            <v-icon><PeopleIcon /></v-icon>
            <span class="text-h6 font-weight-medium">Компании</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ stats.companies }}</div>
          <div class="text-caption text-medium-emphasis">В справочнике системы</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4" color="success" height="100%" variant="tonal">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar class="text-white" color="success" size="40" variant="elevated">
              <v-icon>mdi-book-open-page-variant</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-medium">Курсы</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ stats.courses }}</div>
          <div class="text-caption text-medium-emphasis">Доступно программ</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4" color="warning" height="100%" variant="tonal">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar class="text-white" color="warning" size="40" variant="elevated">
              <v-icon>mdi-account-group</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-medium">Активные группы</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ stats.activeGroups }}</div>
          <div class="text-caption text-medium-emphasis">В процессе обучения</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4" color="info" height="100%" variant="tonal">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar class="text-white" color="info" size="40" variant="elevated">
              <v-icon>mdi-currency-rub</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-medium">Бюджет (с НДС)</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ formatCurrency(stats.totalBudget) }}</div>
          <div class="text-caption text-medium-emphasis">По всем спецификациям</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 📅 Центральная зона -->
    <v-row>
      <!-- Левая колонка: Ближайшие группы -->
      <v-col cols="12" md="7">
        <v-card class="h-100" elevation="2">
          <v-card-title class="text-h6 font-weight-bold pa-4">
            <v-icon color="primary" start>mdi-calendar-clock</v-icon>
            Ближайшие учебные группы (30 дней)
          </v-card-title>
          <v-divider />
          <v-list class="pa-2" lines="two">
            <v-skeleton-loader v-if="groupsStore.state.loading" class="pa-4" type="list-item@3" />
            <template v-else>
              <v-list-item v-for="group in upcomingGroups" :key="group.id" :prepend-icon="getGroupIcon(group.status)">
                <template #title>
                  <span class="font-weight-medium">{{ group.course.title }}</span>
                </template>
                <template #subtitle>
                  {{ formatDate(group.start_date) }} – {{ formatDate(group.end_date) }} • {{ group.employees_count }} уч.
                </template>
                <template #append>
                  <v-chip :color="getStatusColor(group.status)" size="small" variant="tonal">
                    {{ getStatusLabel(group.status) }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item v-if="upcomingGroups.length === 0" class="text-center">
                <template #title class="text-medium-emphasis">Нет запланированных групп</template>
                <template #subtitle>Создайте новую группу в разделе "Учебные группы"</template>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-col>

      <!-- Правая колонка: Статусы + Быстрые действия -->
      <v-col cols="12" md="5">
        <v-card class="h-100" elevation="2">
          <v-card-title class="text-h6 font-weight-bold pa-4">
            <v-icon color="success" start>mdi-chart-pie</v-icon>
            Статусы обучения
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">Завершено</span>
                <span class="font-weight-bold">{{ stats.completed }} ({{ stats.completedPercent }}%)</span>
              </div>
              <v-progress-linear color="success" height="8" :model-value="stats.completedPercent" rounded />
            </div>
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">В процессе</span>
                <span class="font-weight-bold">{{ stats.inProgress }} ({{ stats.inProgressPercent }}%)</span>
              </div>
              <v-progress-linear color="warning" height="8" :model-value="stats.inProgressPercent" rounded />
            </div>
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">Планируется</span>
                <span class="font-weight-bold">{{ stats.planned }} ({{ stats.plannedPercent }}%)</span>
              </div>
              <v-progress-linear color="primary" height="8" :model-value="stats.plannedPercent" rounded />
            </div>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-plus"
              to="/groups"
              variant="tonal"
            >
              Создать учебную группу
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 📄 Последние спецификации -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="text-h6 font-weight-bold pa-4">
            <v-icon color="info" start>mdi-file-document-multiple</v-icon>
            Последние спецификации
          </v-card-title>
          <v-divider />
          <v-table density="comfortable">
            <thead>
              <tr class="bg-surface-variant">
                <th>Номер</th>
                <th>Дата</th>
                <th>Компания-заказчик</th>
                <th class="text-right">Сумма (с НДС)</th>
                <th class="text-center" style="width: 120px;">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spec in recentSpecs" :key="spec.id">
                <td class="font-weight-medium text-primary">{{ spec.number }}</td>
                <td>{{ formatDate(spec.date) }}</td>
                <td>{{ spec.company.name }}</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(spec.total_with_vat) }}</td>
                <td class="text-center">
                  <v-btn
                    color="primary"
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="router.push('/specifications')"
                  />
                </td>
              </tr>
              <tr v-if="recentSpecs.length === 0">
                <td class="text-center text-medium-emphasis py-6" colspan="5">Спецификации отсутствуют</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import PeopleIcon from '@/icons/PeopleIcon.vue'
  import { companiesStore } from '@/stores/companiesStore'
  import { coursesStore } from '@/stores/coursesStore'
  import { groupsStore } from '@/stores/groupsStore'
  import { specificationsStore } from '@/stores/specificationsStore'

  const router = useRouter()

  // 📅 Утилиты
  const currentDate = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  function formatDate (dateStr: string): string {
    if (!dateStr) return '--'
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }

  function formatCurrency (val: string | number): string {
    const num = typeof val === 'string' ? Number.parseFloat(val) : val
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num || 0)
  }

  function getStatusColor (s?: string): string {
    const map: Record<string, string> = { planned: 'blue', in_progress: 'orange', completed: 'green' }
    return map[s || ''] || 'grey'
  }

  function getStatusLabel (s?: string): string {
    const map: Record<string, string> = { planned: 'Планируется', in_progress: 'В процессе', completed: 'Завершено' }
    return map[s || ''] || 'Неизвестно'
  }

  function getGroupIcon (s?: string): string {
    const map: Record<string, string> = { planned: 'mdi-calendar-clock', in_progress: 'mdi-progress-clock', completed: 'mdi-check-decagram' }
    return map[s || ''] || 'mdi-help-circle'
  }

  // 📊 Метрики (реактивные вычисления из сторов)
  const stats = computed(() => {
    const groups = groupsStore.state.items
    const specs = specificationsStore.state.items
    const totalGroupsCount = groupsStore.state.pagination.count || groups.length

    const completed = groups.filter(g => g.status === 'completed').length
    const inProgress = groups.filter(g => g.status === 'in_progress').length
    const planned = groups.filter(g => g.status === 'planned').length

    const totalBudget = specs.reduce((sum, s) => sum + (Number.parseFloat(String(s.total_with_vat)) || 0), 0)

    return {
      companies: companiesStore.state.pagination.count,
      courses: coursesStore.state.pagination.count,
      activeGroups: inProgress,
      completed,
      inProgress,
      planned,
      totalGroupsCount,
      totalBudget,
      completedPercent: totalGroupsCount ? Math.round((completed / totalGroupsCount) * 100) : 0,
      inProgressPercent: totalGroupsCount ? Math.round((inProgress / totalGroupsCount) * 100) : 0,
      plannedPercent: totalGroupsCount ? Math.round((planned / totalGroupsCount) * 100) : 0,
    }
  })

  // 📅 Ближайшие группы (следующие 30 дней)
  const upcomingGroups = computed(() => {
    const today = new Date()
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    return groupsStore.state.items
      .filter(g => {
        const start = new Date(g.start_date)
        return start >= today && start <= nextMonth && g.status !== 'completed'
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 6)
  })

  // 📄 Последние спецификации
  const recentSpecs = computed(() => specificationsStore.state.items.slice(0, 5))

  // 🔄 Инициализация данных
  onMounted(() => {
    if (!companiesStore.state.isFetched) companiesStore.fetch()
    if (!coursesStore.state.isFetched) coursesStore.fetch()
    if (!groupsStore.state.isFetched) groupsStore.fetch()
    if (!specificationsStore.state.isFetched) specificationsStore.fetch()
  })
</script>

<style scoped>
/* Плавная анимация для карточек при загрузке */
.v-skeleton-loader {
  border-radius: 12px;
}
</style>
