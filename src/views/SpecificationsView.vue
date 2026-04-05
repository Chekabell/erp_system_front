<template>
  <v-container class="pa-6" fluid>
    <!-- Заголовок -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-semibold" style="font-size: 40px;">Спецификации обучения</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <!-- Кнопки действий -->
    <v-row align="center" class="mb-6" gap="20">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        style="font-size: 22px;"
        @click="openCreateDialog"
      >
        Создать спецификацию
      </v-btn>
    </v-row>

    <!-- Поиск -->
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          clearable
          density="comfortable"
          label="Поиск по номеру, компании..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @keyup.enter="handleSearch"
        />
      </v-col>
    </v-row>

    <!-- Состояния загрузки и ошибок -->
    <div v-if="specificationsStore.state.loading && !specificationsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="specificationsStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ specificationsStore.state.error }}
    </v-alert>

    <!-- Таблица спецификаций -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        disable-pagination
        :headers="headers"
        hide-default-footer
        hover
        item-key="id"
        :items="specificationsStore.state.items"
        :items-per-page="specificationsStore.state.pagination.pageSize"
        no-data-text="Спецификации не найдены"
      >
        <!-- Реквизиты -->
        <template #item.docInfo="{ item }">
          <div>
            <div class="font-weight-medium">№ {{ item.number }}</div>
            <div class="text-caption text-medium-emphasis">{{ formatDate(item.date) }}</div>
          </div>
        </template>

        <!-- Компания -->
        <template #item.company="{ item }">
          <v-chip size="small" variant="tonal" color="primary">
            {{ item.company.name }}
          </v-chip>
        </template>

        <!-- Группы -->
        <template #item.groups="{ item }">
          <v-chip size="small" variant="outlined" color="primary">
            {{ item.groups.length }}
          </v-chip>
        </template>

        <!-- Суммы -->
        <template #item.subtotal="{ item }">
          <div class="text-right font-weight-medium">{{ formatCurrency(item.total_no_vat) }}</div>
        </template>

        <template #item.vat="{ item }">
          <div class="text-right font-weight-medium">{{ formatCurrency(item.vat_amount) }}</div>
        </template>

        <template #item.total="{ item }">
          <div class="text-right font-weight-bold">{{ formatCurrency(item.total_with_vat) }}</div>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click.stop="openDeleteDialog(item)"
          />
        </template>
      </v-data-table>

      <!-- Пагинация и выбор размера страницы -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis text-white">Показывать по:</span>
          <v-select
            density="compact"
            hide-details
            :items="[5, 10, 20]"
            :model-value="specificationsStore.state.pagination.per_page"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="onPageSizeChange"
          />
          <span class="text-caption text-medium-emphasis text-white">из {{ specificationsStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="specificationsStore.state.pagination.page"
          size="small"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- 🔹 Dialog: Создание спецификации -->
    <v-dialog v-model="createDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold pt-4">
          Создать спецификацию
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.number"
              label="Номер спецификации *"
              required
              :rules="[v => !!v?.trim() || 'Номер обязателен', v => (v?.length <= 50) || 'Максимум 50 символов']"
              counter="50"
              placeholder="СП-2025-001"
            />
            <v-text-field
              v-model="form.date"
              label="Дата спецификации *"
              required
              :rules="[v => !!v || 'Укажите дату']"
              type="date"
            />
            <v-autocomplete
              v-model="form.company_id"
              label="Компания-заказчик *"
              required
              :rules="[v => !!v || 'Выберите компанию']"
              item-title="name"
              item-value="id"
              :items="companiesStore.state.items"
              prepend-inner-icon="mdi-office-building-marker"
            />
            <v-alert class="mt-2" density="compact" type="info" variant="tonal" color="green-accent-4">
              <template #title>💡 Подсказка</template>
              <span class="text-caption">После создания спецификации вы сможете добавить в неё учебные группы через страницу "Группы".</span>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" :loading="createLoading" @click="submitCreate">Создать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить спецификацию <strong>№ {{ specToDelete?.number }}</strong>?
          <div class="text-caption text-medium-emphasis mt-2">
            Все привязанные учебные группы останутся в системе, но потеряют ссылку на эту спецификацию.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="submitDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Уведомления -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { SpecificationRequest, SpecificationResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { companiesStore } from '@/stores/companiesStore'
  import { specificationsStore } from '@/stores/specificationsStore'

  // 🔍 Поиск и пагинация
  const search = ref('')

  // 👇 ВАЖНО: используем то же имя поля, что и в store (per_page или pageSize — проверьте ваш store!)
  const totalPages = computed(() =>
    Math.ceil(specificationsStore.state.pagination.count / specificationsStore.state.pagination.per_page) || 1
  )

  // Уведомления
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success',
  })

  function showSnackbar (message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
  }

  const headers = [
    { title: 'Реквизиты', key: 'docInfo', sortable: true, width: 180, align: 'start' },
    { title: 'Компания', key: 'company', sortable: true, width: 200, align: 'start' },
    { title: 'Групп', key: 'groups', sortable: false, width: 100, align: 'center' },
    { title: 'Без НДС', key: 'subtotal', sortable: true, width: 130, align: 'end' },
    { title: 'НДС (22%)', key: 'vat', sortable: true, width: 130, align: 'end' },
    { title: 'Итого', key: 'total', sortable: true, width: 130, align: 'end' },
    { title: 'Действия', key: 'actions', sortable: false, width: 140, align: 'end' },
  ]

  // 👇 Функция загрузки с параметрами
  async function loadSpecifications () {
    const params: Record<string, any> = {}
    if (search.value) params.search = search.value
    await specificationsStore.fetch(params, true)
  }

  // 👇 Обработчик поиска (сброс на 1 страницу + дебаунс опционально)
  function handleSearch () {
    specificationsStore.state.pagination.page = 1
    loadSpecifications()
  }

  // 👇 Обработчик изменения страницы (БЫЛ ОТСУТСТВУЕТ — это главная причина!)
  function onPageChange (page: number) {
    specificationsStore.goToPage(page)
    loadSpecifications()
  }

  // 👇 Обработчик изменения размера страницы (БЫЛ ОТСУТСТВУЕТ!)
  async function onPageSizeChange (size: number) {
    specificationsStore.changePageSize(size)
    specificationsStore.state.pagination.page = 1 // сброс на первую страницу при смене размера
    await loadSpecifications()
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
      showSnackbar('Спецификация создана')
      createDialog.value = false
      specificationsStore.fetch()
    } catch (error) {
      console.error('Ошибка создания спецификации:', error)
      showSnackbar('Не удалось создать спецификацию', 'error')
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
      showSnackbar('Спецификация удалена')
      deleteDialog.value = false
      specificationsStore.fetch()
    } catch (error) {
      console.error('Ошибка удаления спецификации:', error)
      showSnackbar('Не удалось удалить спецификацию', 'error')
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
    if (!companiesStore.state.isFetched) companiesStore.fetch()
  })
</script>

<style scoped>
.v-data-table__wrapper {
  transition: opacity 0.2s ease;
}
</style>