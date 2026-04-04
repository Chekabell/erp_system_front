<template>
  <v-container class="pa-6" fluid>
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
            density="compact"
            hide-details
            label="Поиск по названию или коду..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="companiesStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="companiesStore.state.loading && !companiesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="companiesStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ companiesStore.state.error }}
      <v-btn class="ml-2" color="error" variant="text" @click="companiesStore.fetch({}, true)">Повторить</v-btn>
    </v-alert>

    <!-- 🔹 Grid -->
    <v-row v-else dense>
      <v-col
        v-for="company in companiesStore.state.items"
        :key="company.id"
        cols="12"
        lg="4"
        sm="6"
        xl="3"
      >
        <!-- Добавил cursor-pointer явно -->
        <v-card class="rounded-lg overflow-hidden company-card cursor-pointer" elevation="2" hover @click="openAnalytics(company)">
          <v-card class="rounded-lg overflow-hidden company-card" elevation="2" hover @click="openAnalytics(company)">
            <!-- Шапка с кнопкой удаления -->
            <div class="pa-4 bg-surface-variant d-flex justify-space-between align-start">
              <div class="overflow-hidden flex-1 pr-2">
                <div class="text-h6 font-weight-medium text-truncate">{{ company.name }}</div>
                <div class="text-caption text-medium-emphasis">Код: {{ company.code }}</div>
              </div>
              <v-btn
                class="mt-n1 mr-n2"
                color="error"
                icon="mdi-delete-outline"
                size="small"
                title="Удалить компанию"
                variant="text"
                @click.stop="openDeleteDialog(company)"
              />
            </div>
            <!-- Метрики -->
            <div class="pa-4">
              <div class="d-flex justify-space-between mb-3">
                <div class="text-center flex-1">
                  <div class="text-h5 font-weight-bold text-primary">--</div>
                  <div class="text-caption text-medium-emphasis">Сотрудников</div>
                </div>
                <v-divider vertical />
                <div class="text-center flex-1">
                  <div class="text-h5 font-weight-bold text-success">{{ company.specifications?.length || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">Спецификаций</div>
                </div>
              </div>
              <v-progress-linear
                class="mb-2"
                color="info"
                height="8"
                :model-value="0"
                rounded
              />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Прогресс обучения</span>
                <span class="text-caption font-weight-bold">0%</span>
              </div>
            </div>
            <v-divider />
            <div class="pa-3 d-flex justify-end">
              <v-btn append-icon="mdi-arrow-right" color="primary" size="small" variant="text">Аналитика</v-btn>
            </div>
          </v-card>
        </v-card></v-col>
    </v-row>

    <v-empty-state v-if="!companiesStore.state.loading && companiesStore.state.items.length === 0" class="mt-8" icon="mdi-office-building-remove" title="Компании не найдены" />

    <!-- 🔹 Пагинация -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination :length="totalPages" :model-value="companiesStore.state.pagination.page" @update:model-value="companiesStore.goToPage" />
    </div>

    <!-- 🔹 Dialog: Аналитика компании -->
    <v-dialog v-model="dialog" max-width="850" scrollable>
      <v-card v-if="selectedCompany" class="rounded-lg" prepend-icon="mdi-chart-box-outline">
        <template #title>
          <span class="text-h5 font-weight-bold">Аналитика: {{ selectedCompany.name }}</span>
        </template>
        <template #subtitle>
          Код: <v-chip size="x-small">{{ selectedCompany.code }}</v-chip> | ID: {{ selectedCompany.id }}
        </template>

        <v-divider class="my-2" />

        <v-card-text class="pa-5">
          <v-alert class="mb-4" type="info" variant="tonal">
            <template #title>📊 Данные аналитики</template>
            <div class="text-body-2 text-medium-emphasis mt-1">
              Список привязанных спецификаций обучения.
            </div>
          </v-alert>

          <v-table class="elevation-0 border-thin rounded-lg" density="comfortable">
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
                <td class="text-center text-medium-emphasis py-4" colspan="3">Нет привязанных спецификаций</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Создание компании -->
    <v-dialog v-model="createDialog" max-width="480">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новая компания</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания записи</v-card-subtitle>
        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.name"
              class="mb-3"
              density="compact"
              label="Полное наименование *"
              :rules="[v => !!v?.trim() || 'Название обязательно']"
              variant="outlined"
            />
            <v-text-field
              v-model="form.code"
              counter="4"
              density="compact"
              label="Код компании (2-4 символа) *"
              :rules="[
                v => !!v?.trim() || 'Код обязателен',
                v => (v?.length >= 2 && v?.length <= 4) || 'Длина кода от 2 до 4 символов'
              ]"
              variant="outlined"
            />
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

    <!-- 🔹 Dialog: Создание компании -->
    <v-dialog v-model="createDialog" max-width="480">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новая компания</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания записи</v-card-subtitle>
        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.name"
              class="mb-3"
              density="compact"
              label="Полное наименование *"
              :rules="[v => !!v?.trim() || 'Название обязательно']"
              variant="outlined"
            />
            <v-text-field
              v-model="form.code"
              counter="4"
              density="compact"
              label="Код компании (2-4 символа) *"
              :rules="[
                v => !!v?.trim() || 'Код обязателен',
                v => (v?.length >= 2 && v?.length <= 4) || 'Длина кода от 2 до 4 символов'
              ]"
              variant="outlined"
            />
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
        <v-card-title class="text-h6 font-weight-bold pt-4 text-error">Удалить компанию?</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Это действие необратимо</v-card-subtitle>
        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить компанию
            <strong class="text-primary">"{{ companyToDelete?.name }}"</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все привязанные спецификации и ссылки будут потеряны.
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
  import type { CompanyRequest, CompanyResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { companiesStore } from '@/stores/companiesStore'

  // 🔍 Поиск
  const search = ref('')
  const totalPages = computed(() => Math.ceil(companiesStore.state.pagination.count / companiesStore.state.pagination.pageSize) || 1)

  function handleSearch () {
    companiesStore.reset()
    companiesStore.fetch({ search: search.value || undefined })
  }

  // 📊 Аналитика
  const dialog = ref(false)
  const selectedCompany = ref<CompanyResponse | null>(null)

  function openAnalytics (company: CompanyResponse) {
    selectedCompany.value = company
    dialog.value = true
  }

  // ➕ Создание
  const createDialog = ref(false)
  const formValid = ref(false)
  const createLoading = ref(false)
  const form = ref<CompanyRequest>({ code: '', name: '' })

  function openCreateDialog () {
    form.value = { code: '', name: '' }
    formValid.value = false
    createDialog.value = true
  }

  async function submitCreate () {
    if (!formValid.value) return
    createLoading.value = true
    try {
      await companiesStore.create(form.value)
      createDialog.value = false
      companiesStore.fetch() // Обновляем список и пагинацию
    } catch (error) {
      console.error('Ошибка создания компании:', error)
    } finally {
      createLoading.value = false
    }
  }

  // 🗑 Удаление
  const deleteDialog = ref(false)
  const deleteLoading = ref(false)
  const companyToDelete = ref<CompanyResponse | null>(null)

  function openDeleteDialog (company: CompanyResponse) {
    companyToDelete.value = company
    deleteDialog.value = true
  }

  async function submitDelete () {
    if (!companyToDelete.value) return
    deleteLoading.value = true
    try {
      await companiesStore.remove(companyToDelete.value.id)
      deleteDialog.value = false
      companiesStore.fetch() // Обновляем список и пагинацию
    } catch (error) {
      console.error('Ошибка удаления компании:', error)
    } finally {
      deleteLoading.value = false
    }
  }

  // 🛠 Утилиты
  function formatDate (dateStr: string): string {
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
