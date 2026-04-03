<template>
  <v-container fluid class="pa-6">
    <!-- Верхняя панель -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Компании-заказчики</h1>
          <p class="text-body-2 text-medium-emphasis">Аналитика обучения и спецификаций в разрезе организаций</p>
        </div>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Поиск компании или кода..."
          density="compact"
          variant="solo"
          hide-details
          style="max-width: 320px;"
        />
      </div>
    </v-card>

    <!-- Сетка карточек компаний -->
    <v-row dense>
      <v-col v-for="company in filteredCompanies" :key="company.id" cols="12" sm="6" lg="4" xl="3">
        <v-card hover elevation="2" class="rounded-lg overflow-hidden company-card cursor-pointer" @click="openAnalytics(company)">
          <!-- Шапка карточки -->
          <div class="pa-4 bg-surface-variant">
            <div class="d-flex align-center ga-3">
              <v-avatar :color="getAvatarColor(company.code)" size="48" class="text-white text-h5 font-weight-bold">
                {{ company.code.toUpperCase() }}
              </v-avatar>
              <div class="overflow-hidden">
                <div class="text-h6 font-weight-medium text-truncate">{{ company.name }}</div>
                <div class="text-caption text-medium-emphasis">Код: {{ company.code }}</div>
              </div>
            </div>
          </div>

          <!-- Мини-дашборд -->
          <div class="pa-4">
            <div class="d-flex justify-space-between mb-3">
              <div class="text-center flex-1">
                <div class="text-h5 font-weight-bold text-primary">{{ company.trainedEmployees }}</div>
                <div class="text-caption text-medium-emphasis">Сотрудников</div>
              </div>
              <v-divider vertical></v-divider>
              <div class="text-center flex-1">
                <div class="text-h5 font-weight-bold text-success">{{ company.specificationsCount }}</div>
                <div class="text-caption text-medium-emphasis">Спецификаций</div>
              </div>
            </div>
            <v-progress-linear :model-value="company.avgProgress" color="info" height="8" rounded class="mb-2"></v-progress-linear>
            <div class="d-flex justify-space-between align-center">
              <span class="text-caption text-medium-emphasis">Средний прогресс обучения</span>
              <span class="text-caption font-weight-bold">{{ company.avgProgress }}%</span>
            </div>
          </div>

          <!-- Подвал -->
          <v-divider></v-divider>
          <div class="pa-3 d-flex justify-end">
            <v-btn variant="text" color="primary" size="small" append-icon="mdi-arrow-right">
              Детальная аналитика
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state v-if="filteredCompanies.length === 0" title="Компании не найдены" text="Измените параметры поиска." icon="mdi-office-building-remove" class="mt-8" />

    <!-- Модальное окно с детальной аналитикой -->
    <v-dialog v-model="dialog" max-width="850" scrollable>
      <v-card v-if="selectedCompany" class="rounded-lg" prepend-icon="mdi-chart-box-outline">
        <template v-slot:title>
          <span class="text-h5 font-weight-bold">Аналитика: {{ selectedCompany.name }}</span>
        </template>
        <template v-slot:subtitle>
          Код: <v-chip size="x-small">{{ selectedCompany.code }}</v-chip> | ID: {{ selectedCompany.id }}
        </template>

        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-5">
          <!-- Основные метрики -->
          <v-row dense class="mb-5">
            <v-col cols="12" sm="6" md="3" v-for="metric in mainMetrics" :key="metric.key">
              <v-sheet :color="metric.color" variant="tonal" class="pa-4 rounded-lg text-center h-100">
                <v-icon :color="metric.color" size="26" class="mb-2">{{ metric.icon }}</v-icon>
                <div class="text-h5 font-weight-bold">{{ getMetricValue(metric.key) }}</div>
                <div class="text-caption text-medium-emphasis mt-1">{{ metric.label }}</div>
              </v-sheet>
            </v-col>
          </v-row>

          <!-- Разбивка по курсам -->
          <h3 class="text-h6 font-weight-medium mb-3">Прогресс по направлениям обучения</h3>
          <v-table density="comfortable" class="elevation-0 border-thin rounded-lg">
            <thead>
              <tr>
                <th class="text-uppercase text-caption">Курс</th>
                <th class="text-uppercase text-caption text-right">Участников</th>
                <th class="text-uppercase text-caption text-right">Затраты</th>
                <th class="text-uppercase text-caption" style="width: 180px;">Прогресс</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in selectedCompany.courseBreakdown" :key="row.course">
                <td class="font-weight-medium">{{ row.course }}</td>
                <td class="text-right">{{ row.employees }} чел.</td>
                <td class="text-right">{{ formatPrice(row.cost) }}</td>
                <td>
                  <div class="d-flex align-center ga-2">
                    <v-progress-linear :model-value="row.progress" color="primary" height="6" rounded></v-progress-linear>
                    <span class="text-caption text-medium-emphasis">{{ row.progress }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
          <v-btn color="primary" prepend-icon="mdi-file-pdf-box" disabled>Экспорт отчета</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  // 🔹 Типизация компании + аналитика (бонусные поля ТЗ)
  interface Company {
    id: number
    code: string
    name: string
    // Аналитические метрики
    trainedEmployees: number      // Кол-во сотрудников, прошедших обучение
    specificationsCount: number   // Кол-во созданных спецификаций
    totalSpent: number            // Общие затраты на обучение
    avgProgress: number           // Средний прогресс обучения (%)
    courseBreakdown: CourseBreakdown[]
  }

  interface CourseBreakdown {
    course: string
    employees: number
    cost: number
    progress: number
  }

  interface Metric {
    key: keyof Company | string
    label: string
    icon: string
    color: string
  }

  const search = ref('')
  const dialog = ref(false)
  const selectedCompany = ref<Company | null>(null)

  // 📦 Демо-данные (будут заменены на Django API `/api/companies/`)
  const companies = ref<Company[]>([
    {
      id: 1,
      code: 'ROM',
      name: 'ООО "Ромашка"',
      trainedEmployees: 14,
      specificationsCount: 3,
      totalSpent: 450000,
      avgProgress: 68,
      courseBreakdown: [
        { course: 'Базовый курс бизнес-аналитика', employees: 6, cost: 60000, progress: 85 },
        { course: 'Продвинутый SQL для аналитиков', employees: 5, cost: 92500, progress: 40 },
        { course: 'Управление проектами (Agile/Scrum)', employees: 3, cost: 36000, progress: 92 }
      ]
    },
    {
      id: 2,
      code: 'TECH',
      name: 'АО "ТехноСтрой"',
      trainedEmployees: 8,
      specificationsCount: 1,
      totalSpent: 120000,
      avgProgress: 45,
      courseBreakdown: [
        { course: 'Базовый курс бизнес-аналитика', employees: 8, cost: 80000, progress: 45 },
        { course: 'Excel Pro', employees: 0, cost: 0, progress: 0 }
      ]
    },
    {
      id: 3,
      code: 'GLOB',
      name: 'Global ERP Solutions',
      trainedEmployees: 22,
      specificationsCount: 5,
      totalSpent: 890000,
      avgProgress: 91,
      courseBreakdown: [
        { course: 'Продвинутый SQL для аналитиков', employees: 10, cost: 185000, progress: 100 },
        { course: 'Управление проектами (Agile/Scrum)', employees: 12, cost: 144000, progress: 88 }
      ]
    }
  ])

  // 🔍 Фильтрация
  const filteredCompanies = computed(() => {
    const q = search.value.toLowerCase().trim()
    if (!q) return companies.value
    return companies.value.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  })

  // 🎨 Утилиты UI
  const getAvatarColor = (code: string): string => {
    const colors = ['primary', 'success', 'warning', 'error', 'info', 'purple', 'teal', 'indigo']
    let hash = 0
    for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price)
  }

  // 📊 Метрики для модального окна
  const mainMetrics: Metric[] = [
    { key: 'trainedEmployees', label: 'Сотрудников обучено', icon: 'mdi-account-check', color: 'primary' },
    { key: 'specificationsCount', label: 'Спецификаций оформлено', icon: 'mdi-file-document-multiple', color: 'success' },
    { key: 'totalSpent', label: 'Общий бюджет', icon: 'mdi-currency-rub', color: 'warning' },
    { key: 'avgProgress', label: 'Средний прогресс', icon: 'mdi-speedometer', color: 'info' }
  ]

  const getMetricValue = (key: string): string | number => {
    if (!selectedCompany.value) return '--'
    const val = selectedCompany.value[key as keyof Company]
    return key === 'totalSpent' ? formatPrice(val as number) : val
  }

  // 🛠 Действия
  const openAnalytics = (company: Company) => {
    selectedCompany.value = company
    dialog.value = true
  }
</script>

<style scoped>
.company-card {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
}
.company-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
}
.flex-1 { flex: 1; }
</style>
