<template>
  <v-container class="pa-6" fluid>
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
            density="compact"
            hide-details
            label="Поиск по номеру, компании..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="specificationsStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="specificationsStore.state.loading && !specificationsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="specificationsStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ specificationsStore.state.error }}
      <v-btn class="ml-2" color="error" variant="text" @click="specificationsStore.fetch({}, true)">Повторить</v-btn>
    </v-alert>

    <!-- 🔹 Table -->
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
        <!-- Реквизиты -->
        <template #item.docInfo="{ item }">
          <div><div class="font-weight-bold text-primary">№ {{ item.number }}</div><div class="text-caption text-medium-emphasis">{{ formatDate(item.date) }}</div></div>
        </template>
        <!-- Компания -->
        <template #item.company="{ item }">
          <v-chip color="secondary" size="small" variant="tonal"><v-icon size="small" start>mdi-office-building-marker</v-icon>{{ item.company.name }}</v-chip>
        </template>
        <!-- Группы -->
        <template #item.groups="{ item }">
          <v-chip class="font-weight-bold" size="small" variant="outlined">{{ item.groups.length }}</v-chip>
        </template>
        <!-- Суммы -->
        <template #item.subtotal="{ item }">
          <div class="text-right font-weight-medium">{{ formatCurrency(item.total_no_vat) }}</div>
        </template>

        <template #item.vat="{ item }">
          <div class="text-right font-weight-medium">{{ formatCurrency(item.vat_amount) }}</div>
        </template>

        <template #item.total="{ item }">
          <div class="text-right font-weight-medium">{{ formatCurrency(item.total_with_vat) }}</div>
        </template>
        <!-- Действия -->
        <template #item.actions="{ item }">
          <v-btn
            color="secondary"
            disabled
            icon="mdi-printer"
            size="small"
            title="Экспорт будет доступен в следующей версии"
            variant="text"
          />
          <v-btn
            color="error"
            icon="mdi-delete-outline"
            size="small"
            title="Удалить спецификацию"
            variant="text"
            @click.stop="openDeleteDialog(item)"
          />
        </template>
      </v-data-table>

      <!-- Footer: Page Size & Pagination -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis text-white ">Показывать по:</span>
          <v-select
            v-model="specificationsStore.state.pagination.pageSize"
            density="compact"
            hide-details
            :items="[10, 20, 50, 100]"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="specificationsStore.changePageSize"
          />
          <span class="text-caption text-medium-emphasis text-white ">из {{ specificationsStore.state.pagination.count }}</span>
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

    <!-- 🔹 Modal: Просмотр спецификации -->
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
    <!-- 🔹 Dialog: Создание спецификации -->
    <v-dialog v-model="createDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новая спецификация</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания юридического документа</v-card-subtitle>
        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.number"
              class="mb-3"
              counter="50"
              density="compact"
              label="Номер спецификации *"
              placeholder="СП-2025-001"
              :rules="[
                v => !!v?.trim() || 'Номер обязателен',
                v => (v?.length <= 50) || 'Максимум 50 символов'
              ]"
              variant="outlined"
            />
            <v-text-field
              v-model="form.date"
              class="mb-3"
              density="compact"
              label="Дата спецификации *"
              :rules="[v => !!v || 'Укажите дату']"
              type="date"
              variant="outlined"
            />
            <v-autocomplete
              v-model="form.company_id"
              density="compact"
              item-title="name"
              item-value="id"
              :items="companiesStore.state.items"
              label="Компания-заказчик *"
              prepend-inner-icon="mdi-office-building-marker"
              :rules="[v => !!v || 'Выберите компанию']"
              variant="outlined"
            />
            <v-alert class="mt-2" density="compact" type="info" variant="tonal" color="green-accent-4">
              <template #title>💡 Подсказка</template>
              <span class="text-caption">После создания спецификации вы сможете добавить в неё учебные группы через страницу "Группы".</span>
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
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
        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить спецификацию
            <strong class="text-primary">№ {{ specToDelete?.number }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все привязанные учебные группы останутся в системе, но потеряют ссылку на эту спецификацию.
          </p>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="submitDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { SpecificationRequest, SpecificationResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { companiesStore } from '@/stores/companiesStore'
  import { specificationsStore } from '@/stores/specificationsStore'

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
    { title: '', key: 'actions', sortable: false, width: 120, align: 'end' },
  ]

  function handleSearch () {
    specificationsStore.reset()
    specificationsStore.fetch({ search: search.value || undefined })
  }

  // 📖 Просмотр спецификации
  const dialog = ref(false)
  const selectedSpec = ref<SpecificationResponse | null>(null)

  function openDetail (spec: SpecificationResponse) {
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
    company_id: 0,
  })

  function openCreateDialog () {
    form.value = { number: '', date: '', company_id: 0 }
    formValid.value = false
    createDialog.value = true
  }

  async function submitCreate () {
    if (!formValid.value) return
    createLoading.value = true
    try {
      const payload: SpecificationRequest = { ...form.value }
      await specificationsStore.create(payload)
      createDialog.value = false
      specificationsStore.fetch() // Обновляем список и пагинацию
    } catch (error) {
      console.error('Ошибка создания спецификации:', error)
      alert('Не удалось создать спецификацию. Проверьте данные.')
    } finally {
      createLoading.value = false
    }
  }

  // 🗑 Удаление спецификации
  const deleteDialog = ref(false)
  const deleteLoading = ref(false)
  const specToDelete = ref<SpecificationResponse | null>(null)

  function openDeleteDialog (spec: SpecificationResponse) {
    specToDelete.value = spec
    deleteDialog.value = true
  }

  async function submitDelete () {
    if (!specToDelete.value) return
    deleteLoading.value = true
    try {
      await specificationsStore.remove(specToDelete.value.id)
      deleteDialog.value = false
      specificationsStore.fetch() // Обновляем список и пагинацию
    } catch (error) {
      console.error('Ошибка удаления спецификации:', error)
      alert('Не удалось удалить спецификацию.')
    } finally {
      deleteLoading.value = false
    }
  }

  // 🛠 Утилиты
  function formatCurrency (value: number): string {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  }

  function formatDate (dateStr: string): string {
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
