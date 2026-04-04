<template>
  <v-container fluid class="pa-6">
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Компании-заказчики</h1>
          <p class="text-body-2 text-medium-emphasis">Аналитика обучения и спецификаций в разрезе организаций</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 500px; flex: 1;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Поиск по названию или коду..."
            density="compact"
            variant="solo"
            hide-details
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="companiesStore.state.loading" @click="handleSearch">Найти</v-btn>
        </div>
      </div>
    </v-card>

    <div v-if="companiesStore.state.loading && !companiesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="companiesStore.state.error" type="error" variant="tonal" class="mt-4">
      {{ companiesStore.state.error }}
      <v-btn variant="text" color="error" @click="companiesStore.fetch({}, true)" class="ml-2">Повторить</v-btn>
    </v-alert>

    <v-row v-else dense>
      <v-col v-for="company in companiesStore.state.items" :key="company.id" cols="12" sm="6" lg="4" xl="3">
        <v-card hover elevation="2" class="rounded-lg overflow-hidden company-card cursor-pointer" @click="openAnalytics(company)">
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
          <div class="pa-4">
            <div class="d-flex justify-space-between mb-3">
              <div class="text-center flex-1">
                <div class="text-h5 font-weight-bold text-primary">--</div>
                <div class="text-caption text-medium-emphasis">Сотрудников</div>
              </div>
              <v-divider vertical></v-divider>
              <div class="text-center flex-1">
                <div class="text-h5 font-weight-bold text-success">{{ company.specifications?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">Спецификаций</div>
              </div>
            </div>
            <v-progress-linear :model-value="0" color="info" height="8" rounded class="mb-2"></v-progress-linear>
            <div class="d-flex justify-space-between align-center">
              <span class="text-caption text-medium-emphasis">Прогресс обучения</span>
              <span class="text-caption font-weight-bold">0%</span>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="pa-3 d-flex justify-end">
            <v-btn variant="text" color="primary" size="small" append-icon="mdi-arrow-right">Аналитика</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state v-if="!companiesStore.state.loading && companiesStore.state.items.length === 0"
                   title="Компании не найдены" icon="mdi-office-building-remove" class="mt-8" />

    <div class="d-flex justify-center mt-6" v-if="companiesStore.state.pagination.count > companiesStore.state.pagination.pageSize">
      <v-pagination
        :model-value="companiesStore.state.pagination.page"
        :length="totalPages"
        :total-visible="7"
        @update:model-value="companiesStore.goToPage"
      />
    </div>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { companiesStore } from '@/stores/companiesStore'
  import type { Company } from '@/types/api'

  const search = ref('')
  const dialog = ref(false)
  const selectedCompany = ref<Company | null>(null)

  const totalPages = computed(() => Math.ceil(companiesStore.state.pagination.count / companiesStore.state.pagination.pageSize) || 1)

  const handleSearch = () => {
    companiesStore.reset()
    companiesStore.fetch({ search: search.value || undefined })
  }

  const openAnalytics = (company: Company) => {
    selectedCompany.value = company
    dialog.value = true
  }

  const getAvatarColor = (code: string): string => {
    const colors = ['primary', 'success', 'warning', 'error', 'info', 'purple', 'teal', 'indigo']
    let hash = 0
    for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  onMounted(() => companiesStore.fetch())
</script>

<style scoped>
.company-card { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease; }
.company-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,0.15) !important; }
.flex-1 { flex: 1; }
</style>