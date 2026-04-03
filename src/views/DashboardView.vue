<template>
  <v-card elevation="2" class="rounded-lg pa-6">
    <v-card-title class="text-h4 font-weight-medium mb-2">Панель управления обучением</v-card-title>
    <v-card-subtitle class="text-body-1 text-medium-emphasis mb-6">
      Планирование, расчёт стоимости и мониторинг прогресса сотрудников.
    </v-card-subtitle>

    <v-divider class="mb-6"></v-divider>

    <v-row>
      <v-col cols="12" md="4" v-for="card in metricCards" :key="card.title">
        <v-card variant="tonal" :color="card.color" class="pa-5 h-100">
          <v-icon size="x-large" class="mb-3">{{ card.icon }}</v-icon>
          <div class="text-h6">{{ card.title }}</div>
          <div class="text-h3 font-weight-bold mt-2">--</div>
        </v-card>
      </v-col>
    </v-row>

    <v-alert type="info" variant="tonal" class="mt-6">
      🔧 <strong>Статус:</strong> UI готов. Подключение API Django (REST/GraphQL) будет выполнено на следующем этапе.
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
  const metricCards = [
    { title: 'Активные группы', icon: 'mdi-account-group', color: 'primary' },
    { title: 'Запланированные курсы', icon: 'mdi-calendar-check', color: 'success' },
    { title: 'Ожидают XML загрузки', icon: 'mdi-cloud-upload', color: 'warning' }
  ]
</script>