<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Спецификации обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Юридические документы, агрегирующие учебные группы и итоговую стоимость</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 500px; flex: 1;">
          <v-text-field
            v-model="search"
            density="compact"
            hide-details
            label="Поиск по номеру, компании..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" disabled prepend-icon="mdi-plus">Создать спецификацию</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Loading / Error -->
    <div v-if="specificationsStore.state.loading && !specificationsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="specificationsStore.state.error" class="mt-4" type="error" variant="tonal">{{ specificationsStore.state.error }}</v-alert>

    <!-- Table -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        :headers="headers"
        hide-default-footer
        hover
        :items="specificationsStore.state.items"
        no-data-text="Спецификации не найдены"
        :search="search"
      >
        <template #item.docInfo="{ item }">
          <div><div class="font-weight-bold text-primary">№ {{ item.number }}</div><div class="text-caption text-medium-emphasis">{{ formatDate(item.date) }}</div></div>
        </template>
        <template #item.company="{ item }">
          <v-chip color="secondary" size="small" variant="tonal"><v-icon size="small" start>mdi-office-building-marker</v-icon>{{ item.company.name }}</v-chip>
        </template>
        <template #item.groups="{ item }">
          <v-chip class="font-weight-bold" size="small" variant="outlined">{{ item.groups.length }}</v-chip>
        </template>
        <template #item.subtotal="{ item }"><div class="text-right font-weight-medium">{{ formatCurrency(item.total_no_vat) }}</div></template>
        <template #item.vat="{ item }"><div class="text-right text-medium-emphasis">{{ formatCurrency(item.vat_amount) }}</div></template>
        <template #item.total="{ item }"><div class="text-right font-weight-bold text-success">{{ formatCurrency(item.total_with_vat) }}</div></template>
        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="openDetail(item)"
          />
          <v-btn
            color="secondary"
            disabled
            icon="mdi-printer"
            size="small"
            variant="text"
          />
        </template>
      </v-data-table>

      <!-- Footer: Page Size & Pagination -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            v-model="specificationsStore.state.pagination.pageSize"
            density="compact"
            hide-details
            :items="[10, 20, 50, 100]"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="specificationsStore.changePageSize"
          />
          <span class="text-caption text-medium-emphasis">из {{ specificationsStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="specificationsStore.state.pagination.page"
          size="small"
          @update:model-value="specificationsStore.goToPage"
        />
      </div>
    </v-card>

    <!-- Modal -->
    <v-dialog v-model="dialog" max-width="900" scrollable>
      <v-card v-if="selectedSpec" class="rounded-lg">
        <v-card-title class="text-h5 font-weight-bold pt-4 d-flex align-center ga-2">
          <v-icon color="primary">mdi-file-document-check</v-icon>
          Спецификация № {{ selectedSpec.number }}
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2">Дата: {{ formatDate(selectedSpec.date) }} | Заказчик: {{ selectedSpec.company.name }}</v-card-subtitle>
        <v-divider class="my-2" />
        <v-card-text class="pa-5">
          <h3 class="text-h6 font-weight-medium mb-3 d-flex align-center"><v-icon color="info" start>mdi-account-group</v-icon>Учебные группы в спецификации ({{ selectedSpec.groups.length }})</h3>
          <v-table class="elevation-0 border-thin rounded-lg mb-6" density="compact">
            <thead>
              <tr class="bg-surface-variant">
                <th class="text-uppercase text-caption">Курс</th>
                <th class="text-uppercase text-caption">Период</th>
                <th class="text-uppercase text-caption text-right">Участников</th>
                <th class="text-uppercase text-caption text-right">Цена за чел.</th>
                <th class="text-uppercase text-caption text-right">Стоимость группы</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="grp in selectedSpec.groups" :key="grp.id">
                <td class="font-weight-medium">{{ grp.course_title }}</td>
                <td class="text-medium-emphasis">{{ formatDate(grp.start_date) }} – {{ formatDate(grp.end_date) }}</td>
                <td class="text-right">--</td>
                <td class="text-right">--</td>
                <td class="text-right font-weight-medium">--</td>
              </tr>
            </tbody>
          </v-table>
          <v-row dense>
            <v-col cols="12" md="4"><v-sheet class="pa-4 rounded-lg text-center" variant="outlined"><div class="text-caption text-medium-emphasis">Сумма без НДС</div><div class="text-h5 font-weight-bold mt-2">{{ formatCurrency(selectedSpec.total_no_vat) }}</div></v-sheet></v-col>
            <v-col cols="12" md="4"><v-sheet class="pa-4 rounded-lg text-center" variant="outlined"><div class="text-caption text-medium-emphasis">НДС (22%)</div><div class="text-h5 font-weight-bold mt-2 text-warning">{{ formatCurrency(selectedSpec.vat_amount) }}</div></v-sheet></v-col>
            <v-col cols="12" md="4"><v-sheet class="pa-4 rounded-lg text-center" color="success" variant="tonal"><div class="text-caption text-white">Итого с НДС</div><div class="text-h4 font-weight-bold mt-2 text-white">{{ formatCurrency(selectedSpec.total_with_vat) }}</div></v-sheet></v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="dialog = false">Закрыть</v-btn><v-btn color="primary" disabled prepend-icon="mdi-file-export">Экспорт в PDF</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { SpecificationResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { specificationsStore } from '@/stores/specificationsStore'

  const search = ref('')
  const dialog = ref(false)
  const selectedSpec = ref<SpecificationResponse | null>(null)

  const totalPages = computed(() => Math.ceil(specificationsStore.state.pagination.count / specificationsStore.state.pagination.pageSize) || 1)

  const headers = [
    { title: 'Реквизиты', key: 'docInfo', sortable: true, width: 180 },
    { title: 'Компания', key: 'company', sortable: true },
    { title: 'Групп', key: 'groups', sortable: false, width: 80, align: 'center' },
    { title: 'Без НДС', key: 'subtotal', sortable: true, align: 'end' },
    { title: 'НДС (22%)', key: 'vat', sortable: true, align: 'end' },
    { title: 'Итого', key: 'total', sortable: true, align: 'end' },
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' },
  ]

  const formatCurrency = (value: number): string => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  function formatDate (dateStr: string): string {
    if (!dateStr) return '--'; const [y, m, d] = dateStr.split('-'); return `${d}.${m}.${y}`
  }

  function handleSearch () {
    specificationsStore.reset(); specificationsStore.fetch({ search: search.value || undefined })
  }
  function openDetail (spec: SpecificationResponse) {
    selectedSpec.value = spec; dialog.value = true
  }

  onMounted(() => specificationsStore.fetch())
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>
