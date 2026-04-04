<template>
  <v-container fluid class="pa-6">
    <!-- 🔹 Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Компании-заказчики</h1>
          <p class="text-body-2 text-medium-emphasis">Аналитика обучения и спецификаций в разрезе организаций</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
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
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="companiesStore.state.loading && !companiesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="companiesStore.state.error" type="error" variant="tonal" class="mt-4">
      {{ companiesStore.state.error }}
      <v-btn variant="text" color="error" @click="companiesStore.fetch({}, true)" class="ml-2">Повторить</v-btn>
    </v-alert>

    <!-- 🔹 Grid -->
    <v-row v-else dense>
      <v-col v-for="company in companiesStore.state.items" :key="company.id" cols="12" sm="6" lg="4" xl="3">
        <v-card hover elevation="2" class="rounded-lg overflow-hidden company-card" @click="openAnalytics(company)">
          <!-- Шапка с кнопкой удаления -->
          <div class="pa-4 bg-surface-variant d-flex justify-space-between align-start">
            <div class="overflow-hidden flex-1 pr-2">
              <div class="text-h6 font-weight-medium text-truncate">{{ company.name }}</div>
              <div class="text-caption text-medium-emphasis">Код: {{ company.code }}</div>
            </div>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              color="error"
              size="small"
              class="mt-n1 mr-n2"
              @click.stop="openDeleteDialog(company)"
              title="Удалить компанию"
            />
          </div>

          <!-- Метрики -->
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

          <!-- Футер карточки -->
          <v-divider></v-divider>
          <div class="pa-3 d-flex justify-end">
            <v-btn variant="text" color="primary" size="small" append-icon="mdi-arrow-right">Аналитика</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state v-if="!companiesStore.state.loading && companiesStore.state.items.length === 0" title="Компании не найдены" icon="mdi-office-building-remove" class="mt-8" />

    <!-- 🔹 Пагинация -->
    <div class="d-flex justify-center mt-6" v-if="totalPages > 1">
      <v-pagination :model-value="companiesStore.state.pagination.page" :length="totalPages" @update:model-value="companiesStore.goToPage" />
    </div>

    <!-- 🔹 Dialog: Аналитика компании -->
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
          <v-alert type="info" variant="tonal" class="mb-4">
            <template v-slot:title>📊 Данные аналитики</template>
            <div class="text-body-2 text-medium-emphasis mt-1">
              Список привязанных спецификаций обучения.
            </div>
          </v-alert>

          <v-table density="comfortable" class="elevation-0 border-thin rounded-lg">
            <thead>
              <tr>
                <th class="text-uppercase text-caption">Спецификация</th>
                <th class="text-uppercase text-caption text-right">Дата</th>
                <th class="text-uppercase text-caption text-right">Номер</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spec in selectedCompany.specifications" :key="spec.id">
                <td class="font-weight-medium">Спецификация #{{ spec.id }}</td>
                <td class="text-right">{{ formatDate(spec.date) }}</td>
                <td class="text-right">{{ spec.number }}</td>
              </tr>
              <tr v-if="!selectedCompany.specifications?.length">
                <td colspan="3" class="text-center text-medium-emphasis py-4">Нет привязанных спецификаций</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Создание компании -->
    <v-dialog v-model="createDialog" max-width="480">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новая компания</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания записи</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.name"
              label="Полное наименование *"
              :rules="[v => !!v?.trim() || 'Название обязательно']"
              density="compact"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="form.code"
              label="Код компании (2-4 символа) *"
              :rules="[
                v => !!v?.trim() || 'Код обязателен',
                v => (v?.length >= 2 && v?.length <= 4) || 'Длина кода от 2 до 4 символов'
              ]"
              density="compact"
              variant="outlined"
              counter="4"
            />
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
        <v-card-title class="text-h6 font-weight-bold pt-4 text-error">Удалить компанию?</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Это действие необратимо</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить компанию
            <strong class="text-primary">"{{ companyToDelete?.name }}"</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все привязанные спецификации и ссылки будут потеряны.
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
  import { companiesStore } from '@/stores/companiesStore'
  import type { CompanyResponse, CompanyRequest } from '@/types/api'

  // 🔍 Поиск
  const search = ref('')
  const totalPages = computed(() => Math.ceil(companiesStore.state.pagination.count / companiesStore.state.pagination.pageSize) || 1)

  const handleSearch = () => {
    companiesStore.reset()
    companiesStore.fetch({ search: search.value || undefined })
  }

  // 📊 Аналитика
  const dialog = ref(false)
  const selectedCompany = ref<CompanyResponse | null>(null)

  const openAnalytics = (company: CompanyResponse) => {
    selectedCompany.value = company
    dialog.value = true
  }

  // ➕ Создание
  const createDialog = ref(false)
  const formValid = ref(false)
  const createLoading = ref(false)
  const form = ref<CompanyRequest>({ code: '', name: '' })

  const openCreateDialog = () => {
    form.value = { code: '', name: '' }
    formValid.value = false
    createDialog.value = true
  }

  const submitCreate = async () => {
    if (!formValid.value) return
    createLoading.value = true
    try {
      await companiesStore.create(form.value)
      createDialog.value = false
      companiesStore.fetch() // Обновляем список и пагинацию
    } catch (err) {
      console.error('Ошибка создания компании:', err)
    } finally {
      createLoading.value = false
    }
  }

  // 🗑 Удаление
  const deleteDialog = ref(false)
  const deleteLoading = ref(false)
  const companyToDelete = ref<CompanyResponse | null>(null)

  const openDeleteDialog = (company: CompanyResponse) => {
    companyToDelete.value = company
    deleteDialog.value = true
  }

  const submitDelete = async () => {
    if (!companyToDelete.value) return
    deleteLoading.value = true
    try {
      await companiesStore.remove(companyToDelete.value.id)
      deleteDialog.value = false
      companiesStore.fetch() // Обновляем список и пагинацию
    } catch (err) {
      console.error('Ошибка удаления компании:', err)
    } finally {
      deleteLoading.value = false
    }
  }

  // 🛠 Утилиты
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '--'
    const [year, month, day] = dateStr.split('-')
    return `${day}.${month}.${year}`
  }

  onMounted(() => companiesStore.fetch())
</script>

<style scoped>
.company-card { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease; }
.company-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,0.15) !important; }
.flex-1 { flex: 1; }
</style>