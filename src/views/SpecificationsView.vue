<template>
  <v-container fluid class="pa-6">
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
            prepend-inner-icon="mdi-magnify"
            label="Поиск по номеру, компании..."
            density="compact"
            variant="solo"
            hide-details
            @keyup.enter="handleSearch"
          />
          <v-btn prepend-icon="mdi-plus" color="primary" disabled>Создать спецификацию</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Loading / Error -->
    <div v-if="specificationsStore.state.loading && !specificationsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="specificationsStore.state.error" type="error" variant="tonal" class="mt-4">{{ specificationsStore.state.error }}</v-alert>

    <!-- Table -->
    <v-card v-else elevation="2" class="rounded-lg overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="specificationsStore.state.items"
        :search="search"
        class="elevation-0"
        hover
        hide-default-footer
        no-data-text="Спецификации не найдены"
      >
        <template v-slot:item.docInfo="{ item }">
          <div><div class="font-weight-bold text-primary">№ {{ item.number }}</div><div class="text-caption text-medium-emphasis">{{ formatDate(item.date) }}</div></div>
        </template>
        <template v-slot:item.company="{ item }">
          <v-chip size="small" variant="tonal" color="secondary"><v-icon start size="small">mdi-office-building-marker</v-icon>{{ item.company.name }}</v-chip>
        </template>
        <template v-slot:item.groups="{ item }">
          <v-chip size="small" variant="outlined" class="font-weight-bold">{{ item.groups.length }}</v-chip>
        </template>
        <template v-slot:item.subtotal="{ item }"><div class="text-right font-weight-medium">{{ formatCurrency(item.total_no_vat) }}</div></template>
        <template v-slot:item.vat="{ item }"><div class="text-right text-medium-emphasis">{{ formatCurrency(item.vat_amount) }}</div></template>
        <template v-slot:item.total="{ item }"><div class="text-right font-weight-bold text-success">{{ formatCurrency(item.total_with_vat) }}</div></template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye" variant="text" color="primary" size="small" @click="openDetail(item)" />
          <v-btn icon="mdi-printer" variant="text" color="secondary" size="small" disabled />
        </template>
      </v-data-table>

      <!-- Footer: Page Size & Pagination -->
      <v-divider></v-divider>
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            v-model="specificationsStore.state.pagination.pageSize"
            :items="[10, 20, 50, 100]"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 80px;"
            @update:model-value="specificationsStore.changePageSize"
          ></v-select>
          <span class="text-caption text-medium-emphasis">из {{ specificationsStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :model-value="specificationsStore.state.pagination.page"
          :length="totalPages"
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
        <v-divider class="my-2"></v-divider>
        <v-card-text class="pa-5">
          <h3 class="text-h6 font-weight-medium mb-3 d-flex align-center"><v-icon start color="info">mdi-account-group</v-icon>Учебные группы в спецификации ({{ selectedSpec.groups.length }})</h3>
          <v-table density="compact" class="elevation-0 border-thin rounded-lg mb-6">
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
            <v-col cols="12" md="4"><v-sheet variant="outlined" class="pa-4 rounded-lg text-center"><div class="text-caption text-medium-emphasis">Сумма без НДС</div><div class="text-h5 font-weight-bold mt-2">{{ formatCurrency(selectedSpec.total_no_vat) }}</div></v-sheet></v-col>
            <v-col cols="12" md="4"><v-sheet variant="outlined" class="pa-4 rounded-lg text-center"><div class="text-caption text-medium-emphasis">НДС (22%)</div><div class="text-h5 font-weight-bold mt-2 text-warning">{{ formatCurrency(selectedSpec.vat_amount) }}</div></v-sheet></v-col>
            <v-col cols="12" md="4"><v-sheet variant="tonal" color="success" class="pa-4 rounded-lg text-center"><div class="text-caption text-white">Итого с НДС</div><div class="text-h4 font-weight-bold mt-2 text-white">{{ formatCurrency(selectedSpec.total_with_vat) }}</div></v-sheet></v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4"><v-spacer></v-spacer><v-btn variant="text" @click="dialog = false">Закрыть</v-btn><v-btn color="primary" prepend-icon="mdi-file-export" disabled>Экспорт в PDF</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { specificationsStore } from '@/stores/specificationsStore'
  import type { SpecificationResponse } from '@/types/api'

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
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' }
  ]

  const formatCurrency = (value: number): string => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  const formatDate = (dateStr: string): string => { if (!dateStr) return '--'; const [y,m,d] = dateStr.split('-'); return `${d}.${m}.${y}` }

  const handleSearch = () => { specificationsStore.reset(); specificationsStore.fetch({ search: search.value || undefined }) }
  const openDetail = (spec: SpecificationResponse) => { selectedSpec.value = spec; dialog.value = true }

  onMounted(() => specificationsStore.fetch())
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>