<template>
  <v-container fluid class="pa-6">
    <!-- 🔹 Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Спецификации обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Юридические документы, агрегирующие учебные группы и итоговую стоимость</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Поиск по номеру, компании..."
            density="compact"
            variant="solo"
            hide-details
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="specificationsStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="specificationsStore.state.loading && !specificationsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="specificationsStore.state.error" type="error" variant="tonal" class="mt-4">
      {{ specificationsStore.state.error }}
      <v-btn variant="text" color="error" @click="specificationsStore.fetch({}, true)" class="ml-2">Повторить</v-btn>
    </v-alert>

    <!-- 🔹 Table -->
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
        <!-- Реквизиты -->
        <template v-slot:item.docInfo="{ item }">
          <div><div class="font-weight-bold text-primary">№ {{ item.number }}</div><div class="text-caption text-medium-emphasis">{{ formatDate(item.date) }}</div></div>
        </template>

        <!-- Компания -->
        <template v-slot:item.company="{ item }">
          <v-chip size="small" variant="tonal" color="secondary"><v-icon start size="small">mdi-office-building-marker</v-icon>{{ item.company.name }}</v-chip>
        </template>

        <!-- Группы -->
        <template v-slot:item.groups="{ item }">
          <v-chip size="small" variant="outlined" class="font-weight-bold">{{ item.groups.length }}</v-chip>
        </template>

        <!-- Суммы -->
        <template v-slot:item.subtotal="{ item }"><div class="text-right font-weight-medium">{{ formatCurrency(item.total_no_vat) }}</div></template>
        <template v-slot:item.vat="{ item }"><div class="text-right text-medium-emphasis">{{ formatCurrency(item.vat_amount) }}</div></template>
        <template v-slot:item.total="{ item }"><div class="text-right font-weight-bold text-success">{{ formatCurrency(item.total_with_vat) }}</div></template>

        <!-- Действия -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye" variant="text" color="primary" size="small" @click="openDetail(item)" />
          <v-btn icon="mdi-printer" variant="text" color="secondary" size="small" disabled title="Экспорт будет доступен в следующей версии" />
          <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click.stop="openDeleteDialog(item)" title="Удалить спецификацию" />
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

    <!-- 🔹 Modal: Просмотр спецификации -->
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

    <!-- 🔹 Dialog: Создание спецификации -->
    <v-dialog v-model="createDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новая спецификация</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания юридического документа</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.number"
              label="Номер спецификации *"
              :rules="[
                v => !!v?.trim() || 'Номер обязателен',
                v => (v?.length <= 50) || 'Максимум 50 символов'
              ]"
              density="compact"
              variant="outlined"
              class="mb-3"
              counter="50"
              placeholder="СП-2025-001"
            />
            <v-text-field
              v-model="form.date"
              label="Дата спецификации *"
              type="date"
              :rules="[v => !!v || 'Укажите дату']"
              density="compact"
              variant="outlined"
              class="mb-3"
            />
            <v-autocomplete
              v-model="form.company_id"
              :items="companiesStore.state.items"
              item-title="name"
              item-value="id"
              label="Компания-заказчик *"
              :rules="[v => !!v || 'Выберите компанию']"
              density="compact"
              variant="outlined"
              prepend-inner-icon="mdi-office-building-marker"
            />
            <v-alert type="info" variant="tonal" density="compact" class="mt-2">
              <template v-slot:title>💡 Подсказка</template>
              <span class="text-caption">После создания спецификации вы сможете добавить в неё учебные группы через страницу "Группы".</span>
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="createDialog = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" :loading="createLoading" @click="submitCreate">Создать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4 text-error">Удалить спецификацию?</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Это действие необратимо</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить спецификацию
            <strong class="text-primary">№ {{ specToDelete?.number }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все привязанные учебные группы останутся в системе, но потеряют ссылку на эту спецификацию.
          </p>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="submitDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { specificationsStore } from '@/stores/specificationsStore'
  import { companiesStore } from '@/stores/companiesStore'
  import type { SpecificationResponse, SpecificationRequest } from '@/types/api'

  // 🔍 Поиск и пагинация
  const search = ref('')
  const totalPages = computed(() => Math.ceil(specificationsStore.state.pagination.count / specificationsStore.state.pagination.pageSize) || 1)

  const headers = [
    { title: 'Реквизиты', key: 'docInfo', sortable: true, width: 180 },
    { title: 'Компания', key: 'company', sortable: true },
    { title: 'Групп', key: 'groups', sortable: false, width: 80, align: 'center' },
    { title: 'Без НДС', key: 'subtotal', sortable: true, align: 'end' },
    { title: 'НДС (22%)', key: 'vat', sortable: true, align: 'end' },
    { title: 'Итого', key: 'total', sortable: true, align: 'end' },
    { title: '', key: 'actions', sortable: false, width: 120, align: 'end' }
  ]

  const handleSearch = () => {
    specificationsStore.reset()
    specificationsStore.fetch({ search: search.value || undefined })
  }

  // 📖 Просмотр спецификации
  const dialog = ref(false)
  const selectedSpec = ref<SpecificationResponse | null>(null)

  const openDetail = (spec: SpecificationResponse) => {
    selectedSpec.value = spec
    dialog.value = true
  }

  // ➕ Создание спецификации
  const createDialog = ref(false)
  const formValid = ref(false)
  const createLoading = ref(false)
  const form = ref<SpecificationRequest>({
    number: '',
    date: '',
    company_id: 0
  })

  const openCreateDialog = () => {
    form.value = { number: '', date: '', company_id: 0 }
    formValid.value = false
    createDialog.value = true
  }

  const submitCreate = async () => {
    if (!formValid.value) return
    createLoading.value = true
    try {
      const payload: SpecificationRequest = { ...form.value }
      await specificationsStore.create(payload)
      createDialog.value = false
      specificationsStore.fetch() // Обновляем список и пагинацию
    } catch (err) {
      console.error('Ошибка создания спецификации:', err)
      alert('Не удалось создать спецификацию. Проверьте данные.')
    } finally {
      createLoading.value = false
    }
  }

  // 🗑 Удаление спецификации
  const deleteDialog = ref(false)
  const deleteLoading = ref(false)
  const specToDelete = ref<SpecificationResponse | null>(null)

  const openDeleteDialog = (spec: SpecificationResponse) => {
    specToDelete.value = spec
    deleteDialog.value = true
  }

  const submitDelete = async () => {
    if (!specToDelete.value) return
    deleteLoading.value = true
    try {
      await specificationsStore.remove(specToDelete.value.id)
      deleteDialog.value = false
      specificationsStore.fetch() // Обновляем список и пагинацию
    } catch (err) {
      console.error('Ошибка удаления спецификации:', err)
      alert('Не удалось удалить спецификацию.')
    } finally {
      deleteLoading.value = false
    }
  }

  // 🛠 Утилиты
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '--'
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }

  onMounted(() => {
    specificationsStore.fetch()
    if (!companiesStore.state.isFetched) companiesStore.fetch() // Загружаем компании для селекта
  })
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>