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
        <v-card class="pa-4 rounded-xl d-flex justify-start" height="100%" style="background-image: linear-gradient(to bottom, rgba(2, 136, 255, 0.6) 0%, rgba(1, 136, 255, 0.75) 38%, #1976D2 100%);" variant="tonal">
          <v-icon class="h-100 w-33"><people-icon /></v-icon>
          <div class="ml-2 d-flex flex-column justify-center font-weight-bold text-white">
            <span class="text-h6 font-weight-medium" style="font-size: 32px">{{ stats?.active_groups }}</span>
            <span class="text-h6 font-weight-medium" style="font-size: 16px">Активные группы</span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4 rounded-xl d-flex justify-start" height="100%" style="background-image: linear-gradient(to bottom, rgba(54, 199, 90, 0.6) 0%, rgba(54, 199, 90, 1) 100%);" variant="tonal">
          <v-icon class="h-100 w-33"><ruble-icon /></v-icon>
          <div class="ml-2 d-flex flex-column justify-center font-weight-bold text-white">
            <span class="text-h6 font-weight-medium" style="font-size: 32px">{{ stats?.study_budget }}</span>
            <span class="text-h6 font-weight-medium" style="font-size: 16px">Общий бюджет обучения</span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4 rounded-xl d-flex justify-start" height="100%" style="background-image: linear-gradient(to bottom, rgba(255, 141, 40, 0.6) 0%, rgba(255, 141, 40, 1) 100%);" variant="tonal">
          <v-icon class="h-100 w-33"><pie-chart-icon /></v-icon>
          <div class="ml-2 d-flex flex-column justify-center font-weight-bold text-white">
            <span class="text-h6 font-weight-medium" style="font-size: 32px">{{ stats?.average_progress }}%</span>
            <span class="text-h6 font-weight-medium" style="font-size: 16px">Средний прогресс</span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3" sm="6">
        <v-card class="pa-4 rounded-xl d-flex justify-start" height="100%" style="background-image: linear-gradient(to bottom, rgba(255, 46, 85, 0.6) 0%, rgba(255, 46, 85, 1) 100%);" variant="tonal">
          <v-icon class="h-100 w-33"><official-suit-icon /></v-icon>
          <div class="ml-2 d-flex flex-column justify-center font-weight-bold text-white">
            <span class="text-h6 font-weight-medium" style="font-size: 32px">{{ stats?.active_employees }}</span>
            <span class="text-h6 font-weight-medium" style="font-size: 16px">Сотрудников в обучении</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 📅 Центральная зона – диаграмма Ганта -->
    <v-row v-if="ganttChartStore.state.data">
      <gantt-chart
        :groups="ganttChartStore.state.data.groups"
        @group-updated="refreshGroupData"
        @navigate-to-group="goToGroupPage"
      />
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Stats } from '@/types/api'
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import api from '@/api/client'
  import GanttChart from '@/components/GanttChart.vue'
  import OfficialSuitIcon from '@/icons/OfficialSuitIcon.vue'
  import PeopleIcon from '@/icons/PeopleIcon.vue'
  import PieChartIcon from '@/icons/PieChartIcon.vue'
  import RubleIcon from '@/icons/RubleIcon.vue'
  import { useGantt } from '@/stores/ganttChartStore'

  const router = useRouter()
  const ganttChartStore = useGantt()
  const stats = ref<Stats>()

  // Загрузка данных для диаграммы и статистики
  async function loadGroups () {
    await ganttChartStore.fetch()
    // Обновляем статистику (количество активных групп, сотрудников и т.д.)
    const statsResponse = await api.get<Stats>('/api/stats/')
    stats.value = statsResponse.data
  }

  // Вызывается после изменения состава группы (добавление/удаление сотрудников)
  async function refreshGroupData () {
    // Перезагружаем данные диаграммы и статистики
    await loadGroups()
  }

  // Переход на страницу редактирования группы (для изменения дат и т.п.)
  function goToGroupPage (groupId: number) {
    router.push({ path: '/groups', query: { openGroup: groupId.toString() } })
  }

  onMounted(async () => {
    await loadGroups()
  })
</script>

<style scoped>
.v-skeleton-loader {
  border-radius: 12px;
}
</style>
