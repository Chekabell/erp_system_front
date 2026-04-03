<template>
  <v-app>
    <v-navigation-drawer
      permanent
      width="280"
      color="grey-lighten-5"
      class="border-e"
    >
      <div class="pa-4 d-flex align-center ga-3">
        <v-avatar color="primary" size="40">
          <span class="text-h6 text-white"></span>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">Global ERM</div>
          <div class="text-caption text-medium-emphasis">
            Управление обучением
          </div>
        </div>
      </div>

      <v-divider />

      <v-list density="comfortable" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :active="item.title === 'Дашборд'"
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat height="72" class="border-b">
      <v-container fluid class="d-flex align-center ga-4">
        <div>
          <div class="text-h6 font-weight-bold">Главная</div>
          <div class="text-caption text-medium-emphasis">
            Сводка по корпоративному обучению
          </div>
        </div>

        <v-spacer />

        <v-text-field
          max-width="320"
          density="comfortable"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          placeholder="Поиск группы, курса, сотрудника"
          hide-details
        />

        <v-btn icon variant="text">
          <v-badge dot color="error">
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
        </v-btn>

        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" class="text-none">
              <v-avatar size="32" color="primary" class="mr-2">
                <span class="text-white">HR</span>
              </v-avatar>
              HR Manager
            </v-btn>
          </template>

          <v-list>
            <v-list-item title="Профиль" prepend-icon="mdi-account-circle-outline" />
            <v-list-item title="Настройки" prepend-icon="mdi-cog-outline" />
            <v-list-item title="Выход" prepend-icon="mdi-logout" />
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col
            v-for="card in stats"
            :key="card.title"
            cols="12"
            sm="6"
            lg="3"
          >
            <v-card rounded="xl" elevation="0" class="fill-height">
              <v-card-text class="d-flex justify-space-between align-start">
                <div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ card.title }}
                  </div>
                  <div class="text-h4 font-weight-bold mt-2">
                    {{ card.value }}
                  </div>
                  <div
                    class="text-caption mt-2"
                    :class="card.trendColor"
                  >
                    {{ card.trend }}
                  </div>
                </div>

                <v-avatar :color="card.color" variant="tonal" size="48">
                  <v-icon>{{ card.icon }}</v-icon>
                </v-avatar>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-1">
          <v-col cols="12" lg="8">
            <v-card rounded="xl" elevation="0">
              <v-card-title class="d-flex align-center">
                Ближайшие учебные группы
                <v-spacer />
                <v-btn variant="text" color="primary">Все группы</v-btn>
              </v-card-title>

              <v-data-table
                :headers="groupHeaders"
                :items="groups"
                density="comfortable"
                class="elevation-0"
              >
                <template #item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>

                <template #item.progress="{ item }">
                  <div class="d-flex align-center ga-3">
                    <v-progress-linear
                      :model-value="item.progress"
                      height="8"
                      rounded
                      color="primary"
                      class="flex-grow-1"
                    />
                    <span class="text-body-2">{{ item.progress }}%</span>
                  </div>
                </template>

                <template #item.actions>
                  <v-btn icon variant="text" size="small">
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <v-col cols="12" lg="4">
            <v-card rounded="xl" elevation="0" class="mb-4">
              <v-card-title>Быстрые действия</v-card-title>
              <v-card-text class="d-flex flex-column ga-3">
                <v-btn color="primary" prepend-icon="mdi-plus" block rounded="lg">
                  Создать группу
                </v-btn>
                <v-btn variant="outlined" prepend-icon="mdi-book-plus-outline" block rounded="lg">
                  Добавить курс
                </v-btn>
                <v-btn variant="outlined" prepend-icon="mdi-account-plus-outline" block rounded="lg">
                  Добавить участника
                </v-btn>
                <v-btn variant="outlined" prepend-icon="mdi-file-document-outline" block rounded="lg">
                  Создать спецификацию
                </v-btn>
              </v-card-text>
            </v-card>

            <v-card rounded="xl" elevation="0">
              <v-card-title>Конфликты расписания</v-card-title>
              <v-card-text>
                <v-alert
                  type="warning"
                  variant="tonal"
                  border="start"
                  class="mb-3"
                >
                  Найдено 2 конфликта по одинаковому времени старта.
                </v-alert>

                <v-list lines="two">
                  <v-list-item
                    v-for="conflict in conflicts"
                    :key="conflict.id"
                    prepend-icon="mdi-alert-circle-outline"
                    :title="conflict.title"
                    :subtitle="conflict.subtitle"
                  />
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-1">
          <v-col cols="12" lg="7">
            <v-card rounded="xl" elevation="0">
              <v-card-title class="d-flex align-center">
                Прогресс по группам
                <v-spacer />
                <v-select
                  :items="['Неделя', 'Месяц', 'Квартал']"
                  model-value="Месяц"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 160px"
                />
              </v-card-title>

              <v-card-text>
                <div
                  v-for="item in progressItems"
                  :key="item.name"
                  class="mb-5"
                >
                  <div class="d-flex justify-space-between mb-2">
                    <span class="font-weight-medium">{{ item.name }}</span>
                    <span class="text-medium-emphasis">{{ item.value }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="item.value"
                    :color="item.color"
                    height="12"
                    rounded
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" lg="5">
            <v-card rounded="xl" elevation="0">
              <v-card-title class="d-flex align-center">
                План обучения / Gantt preview
                <v-spacer />
                <v-btn variant="text" color="primary">
                  Открыть диаграмму
                </v-btn>
              </v-card-title>

              <v-card-text>
                <div
                  v-for="task in ganttItems"
                  :key="task.name"
                  class="mb-4"
                >
                  <div class="d-flex justify-space-between mb-1">
                    <span class="font-weight-medium">{{ task.name }}</span>
                    <span class="text-caption text-medium-emphasis">
                      {{ task.period }}
                    </span>
                  </div>

                  <v-progress-linear
                    :model-value="task.progress"
                    :color="task.color"
                    height="18"
                    rounded
                  >
                    <template #default>
                      <span class="text-caption text-white">
                        {{ task.progress }}%
                      </span>
                    </template>
                  </v-progress-linear>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
type MenuItem = {
  title: string
  icon: string
}

type StatCard = {
  title: string
  value: string
  trend: string
  trendColor: string
  icon: string
  color: string
}

type GroupRow = {
  name: string
  course: string
  startDate: string
  status: string
  progress: number
}

type ConflictItem = {
  id: number
  title: string
  subtitle: string
}

type ProgressItem = {
  name: string
  value: number
  color: string
}

type GanttItem = {
  name: string
  period: string
  progress: number
  color: string
}

const menuItems: MenuItem[] = [
  { title: 'Дашборд', icon: 'mdi-view-dashboard-outline' },
  { title: 'Учебные группы', icon: 'mdi-account-group-outline' },
  { title: 'Курсы', icon: 'mdi-book-open-variant-outline' },
  { title: 'Участники', icon: 'mdi-account-outline' },
  { title: 'Компании', icon: 'mdi-domain' },
  { title: 'Спецификации', icon: 'mdi-file-document-outline' },
  { title: 'Диаграмма Ганта', icon: 'mdi-chart-gantt' },
  { title: 'XML интеграция', icon: 'mdi-xml' },
  { title: 'Отчеты', icon: 'mdi-chart-box-outline' },
]

const stats: StatCard[] = [
  {
    title: 'Активные группы',
    value: '24',
    trend: '+3 за неделю',
    trendColor: 'text-success',
    icon: 'mdi-account-group',
    color: 'primary',
  },
  {
    title: 'Участники обучения',
    value: '186',
    trend: '+12 новых',
    trendColor: 'text-success',
    icon: 'mdi-account-multiple-outline',
    color: 'success',
  },
  {
    title: 'Средний прогресс',
    value: '68%',
    trend: '+5% к прошлому периоду',
    trendColor: 'text-success',
    icon: 'mdi-chart-line',
    color: 'info',
  },
  {
    title: 'Сумма спецификаций',
    value: '2.84 млн ₽',
    trend: 'Обновлено сегодня',
    trendColor: 'text-medium-emphasis',
    icon: 'mdi-cash-multiple',
    color: 'warning',
  },
]

const groupHeaders = [
  { title: 'Группа', key: 'name' },
  { title: 'Курс', key: 'course' },
  { title: 'Старт', key: 'startDate' },
  { title: 'Статус', key: 'status' },
  { title: 'Прогресс', key: 'progress' },
  { title: '', key: 'actions', sortable: false, width: 60 },
]

const groups: GroupRow[] = [
  {
    name: 'GR-101 Аналитики',
    course: 'Power BI Advanced',
    startDate: '08.04.2026',
    status: 'Активна',
    progress: 72,
  },
  {
    name: 'GR-102 HR команда',
    course: 'Управление компетенциями',
    startDate: '10.04.2026',
    status: 'Планируется',
    progress: 15,
  },
  {
    name: 'GR-103 Финансовый блок',
    course: 'Excel Pro',
    startDate: '11.04.2026',
    status: 'Активна',
    progress: 48,
  },
  {
    name: 'GR-104 Руководители',
    course: 'Project Management',
    startDate: '14.04.2026',
    status: 'Завершена',
    progress: 100,
  },
]

const conflicts: ConflictItem[] = [
  {
    id: 1,
    title: 'Power BI Advanced / 08.04.2026 10:00',
    subtitle: 'Пересечение с группой "Финансовый блок"',
  },
  {
    id: 2,
    title: 'Excel Pro / 11.04.2026 09:00',
    subtitle: 'Совпадение по одному и тому же курсу',
  },
]

const progressItems: ProgressItem[] = [
  { name: 'GR-101 Аналитики', value: 72, color: 'primary' },
  { name: 'GR-102 HR команда', value: 15, color: 'warning' },
  { name: 'GR-103 Финансовый блок', value: 48, color: 'info' },
  { name: 'GR-104 Руководители', value: 100, color: 'success' },
]

const ganttItems: GanttItem[] = [
  {
    name: 'Power BI Advanced',
    period: '08.04 — 18.04',
    progress: 72,
    color: 'primary',
  },
  {
    name: 'Управление компетенциями',
    period: '10.04 — 25.04',
    progress: 15,
    color: 'warning',
  },
  {
    name: 'Excel Pro',
    period: '11.04 — 16.04',
    progress: 48,
    color: 'info',
  },
]

function getStatusColor(status: string): string {
  switch (status) {
    case 'Активна':
      return 'primary'
    case 'Планируется':
      return 'warning'
    case 'Завершена':
      return 'success'
    default:
      return 'default'
  }
}
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.border-e {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
</style>