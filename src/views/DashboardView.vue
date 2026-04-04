<template>
  <v-container fluid class="pa-6">
    <!-- Заголовок -->
    <v-row class="mb-6" align="center">
      <v-col>
        <h1 class="text-h3 font-weight-bold mb-1">Панель управления</h1>
        <p class="text-body-1 text-medium-emphasis">Корпоративное обучение: ключевые показатели и планирование</p>
      </v-col>
      <v-col cols="auto">
        <v-chip color="primary" variant="tonal" size="large" prepend-icon="mdi-calendar">
          {{ currentDate }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- 📊 KPI Карточки -->
    <v-row dense class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="tonal" color="primary" height="100%">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="primary" variant="elevated" size="40" class="text-white">
              <v-icon>mdi-office-building-marker</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-medium">Компании</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ stats.companies }}</div>
          <div class="text-caption text-medium-emphasis">В справочнике системы</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="tonal" color="success" height="100%">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="success" variant="elevated" size="40" class="text-white">
              <v-icon>mdi-book-open-page-variant</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-medium">Курсы</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ stats.courses }}</div>
          <div class="text-caption text-medium-emphasis">Доступно программ</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="tonal" color="warning" height="100%">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="warning" variant="elevated" size="40" class="text-white">
              <v-icon>mdi-account-group</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-medium">Активные группы</span>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ stats.activeGroups }}</div>
          <div class="text-caption text-medium-emphasis">В процессе обучения</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="tonal" color="info" height="100%">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="info" variant="elevated" size="40" class="text-white">
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
            <v-icon start color="primary">mdi-calendar-clock</v-icon>
            Ближайшие учебные группы (30 дней)
          </v-card-title>
          <v-divider></v-divider>
          <v-list lines="two" class="pa-2">
            <v-skeleton-loader v-if="groupsStore.state.loading" type="list-item@3" class="pa-4" />
            <template v-else>
              <v-list-item v-for="group in upcomingGroups" :key="group.id" :prepend-icon="getGroupIcon(group.status)">
                <template v-slot:title>
                  <span class="font-weight-medium">{{ group.course.title }}</span>
                </template>
                <template v-slot:subtitle>
                  {{ formatDate(group.start_date) }} – {{ formatDate(group.end_date) }} • {{ group.employees_count }} уч.
                </template>
                <template v-slot:append>
                  <v-chip size="small" :color="getStatusColor(group.status)" variant="tonal">
                    {{ getStatusLabel(group.status) }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item v-if="upcomingGroups.length === 0" class="text-center">
                <template v-slot:title class="text-medium-emphasis">Нет запланированных групп</template>
                <template v-slot:subtitle>Создайте новую группу в разделе "Учебные группы"</template>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-col>

      <!-- Правая колонка: Статусы + Быстрые действия -->
      <v-col cols="12" md="5">
        <v-card class="h-100" elevation="2">
          <v-card-title class="text-h6 font-weight-bold pa-4">
            <v-icon start color="success">mdi-chart-pie</v-icon>
            Статусы обучения
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4">
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">Завершено</span>
                <span class="font-weight-bold">{{ stats.completed }} ({{ stats.completedPercent }}%)</span>
              </div>
              <v-progress-linear :model-value="stats.completedPercent" color="success" height="8" rounded></v-progress-linear>
            </div>
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">В процессе</span>
                <span class="font-weight-bold">{{ stats.inProgress }} ({{ stats.inProgressPercent }}%)</span>
              </div>
              <v-progress-linear :model-value="stats.inProgressPercent" color="warning" height="8" rounded></v-progress-linear>
            </div>
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">Планируется</span>
                <span class="font-weight-bold">{{ stats.planned }} ({{ stats.plannedPercent }}%)</span>
              </div>
              <v-progress-linear :model-value="stats.plannedPercent" color="primary" height="8" rounded></v-progress-linear>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-btn block color="primary" variant="tonal" to="/groups" prepend-icon="mdi-plus">
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
            <v-icon start color="info">mdi-file-document-multiple</v-icon>
            Последние спецификации
          </v-card-title>
          <v-divider></v-divider>
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
                  <v-btn icon="mdi-eye" variant="text" color="primary" size="small" @click="router.push('/specifications')" />
                </td>
              </tr>
              <tr v-if="recentSpecs.length === 0">
                <td colspan="5" class="text-center text-medium-emphasis py-6">Спецификации отсутствуют</td>
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
  import { companiesStore } from '@/stores/companiesStore'
  import { coursesStore } from '@/stores/coursesStore'
  import { groupsStore } from '@/stores/groupsStore'
  import { specificationsStore } from '@/stores/specificationsStore'

  const router = useRouter()

  // 📅 Утилиты
  const currentDate = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '--'
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }

  const formatCurrency = (val: string | number): string => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num || 0)
  }

  const getStatusColor = (s?: string): string => {
    const map: Record<string, string> = { planned: 'blue', in_progress: 'orange', completed: 'green' }
    return map[s || ''] || 'grey'
  }

  const getStatusLabel = (s?: string): string => {
    const map: Record<string, string> = { planned: 'Планируется', in_progress: 'В процессе', completed: 'Завершено' }
    return map[s || ''] || 'Неизвестно'
  }

  const getGroupIcon = (s?: string): string => {
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

    const totalBudget = specs.reduce((sum, s) => sum + (parseFloat(String(s.total_with_vat)) || 0), 0)

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
      plannedPercent: totalGroupsCount ? Math.round((planned / totalGroupsCount) * 100) : 0
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