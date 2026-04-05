<template>
  <v-container class="pa-6" fluid>
    <!-- Заголовок -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-semibold" style="font-size: 40px;">Компании</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <!-- Кнопки действий -->
    <v-row align="center" class="mb-6" gap="20">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        style="font-size: 22px;"
        @click="openAddDialog"
      >
        Добавить компанию
      </v-btn>
    </v-row>

    <!-- Поиск -->
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          clearable
          density="comfortable"
          label="Поиск по названию или коду"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="onSearchChange"
        />
      </v-col>
    </v-row>

    <!-- Состояния загрузки и ошибок -->
    <div v-if="companiesStore.state.loading && !companiesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="companiesStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ companiesStore.state.error }}
    </v-alert>

    <!-- Таблица компаний -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        disable-pagination
        :headers="headers"
        hide-default-footer
        hover
        item-key="id"
        :items="companiesStore.state.items"
        :items-per-page="companiesStore.state.pagination.per_page"
        no-data-text="Компании не найдены"
      >
        <!-- Название компании -->
        <template #item.name="{ item }">
          <div class="font-weight-medium">{{ item.name }}</div>
        </template>

        <!-- Код компании -->
        <template #item.code="{ item }">
          <v-chip size="small" variant="tonal" color="primary">{{ item.code }}</v-chip>
        </template>

        <!-- Количество спецификаций -->
        <template #item.specifications="{ item }">
          <v-chip size="small" variant="outlined" color="primary">
            {{ item.specifications?.length || 0 }}
          </v-chip>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(item)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
          <v-btn
            color="secondary"
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="openAnalytics(item)"
          />
        </template>
      </v-data-table>

      <!-- Пагинация и выбор размера страницы -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            density="compact"
            hide-details
            :items="[5, 10, 20]"
            :model-value="companiesStore.state.pagination.per_page"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="onPageSizeChange"
          />
          <span class="text-caption text-medium-emphasis">из {{ companiesStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="companiesStore.state.pagination.page"
          size="small"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- Диалог добавления/редактирования -->
    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold pt-4">
          {{ editingCompany ? 'Редактировать компанию' : 'Добавить компанию' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="formData.name"
              label="Полное наименование *"
              required
              :rules="[requiredRule]"
              counter="255"
            />
            <v-text-field
              v-model="formData.code"
              label="Код компании (2-4 символа) *"
              required
              :rules="[requiredRule, codeRule]"
              counter="4"
              maxlength="4"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogVisible = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveCompany">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог просмотра аналитики -->
    <v-dialog v-model="analyticsDialogVisible" max-width="700" scrollable>
      <v-card v-if="selectedCompany">
        <v-card-title class="text-h5 font-weight-bold pt-4">
          Аналитика: {{ selectedCompany.name }}
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2">
          Код: <v-chip size="x-small">{{ selectedCompany.code }}</v-chip> | ID: {{ selectedCompany.id }}
        </v-card-subtitle>
        <v-divider class="my-2" />
          <v-card-text class="pa-4">
            <!-- 📊 Блок статистики
             <v-row class="mb-4" dense>
              <v-col cols="6" sm="3">
                <v-sheet class="pa-3 rounded text-center" color="primary" variant="tonal">
                  <div class="text-caption">Участников</div>
                  <div class="text-h5 font-weight-bold">{{ selectedGroup.employees_count }}</div>
                </v-sheet>
             </v-col>
            <v-col cols="6" sm="3">
              <v-sheet class="pa-3 rounded text-center" color="success" variant="tonal">
                <div class="text-caption">Прогресс</div>
                <div class="text-h5 font-weight-bold">{{ formatProgress(selectedGroup.average_progress) }}%</div>
              </v-sheet>
            </v-col>
            <v-col cols="6" sm="3">
              <v-sheet class="pa-3 rounded text-center" color="warning" variant="tonal">
                <div class="text-caption">Цена за чел.</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(selectedGroup.price_at_creation) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6" sm="3">
              <v-sheet class="pa-3 rounded text-center" color="info" variant="tonal">
                <div class="text-caption">Стоимость группы</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(selectedGroup.total_cost) }}</div>
              </v-sheet>
            </v-col>
          </v-row>

             -->

            <!-- Карточки метрик -->
            <v-row v-if="statsLoading" class="mb-4">
              <v-col cols="12">
                <div class="d-flex justify-center py-4">
                  <v-progress-circular color="primary" indeterminate size="40" />
                </div>
              </v-col>
            </v-row>

            <v-row v-else-if="companyStats" class="mb-4">
              <!-- Средний прогресс -->
              <v-col cols="6" sm="3">
                <v-sheet class="pa-3 rounded text-center" color="primary" variant="tonal">
                  <div class="text-caption">Средний прогресс</div>
                  <div class="text-h5 font-weight-bold">{{ companyStats.average_progress }}%</div>
                </v-sheet>
              </v-col>

              <!-- Подписавшие сотрудники -->
              <v-col cols="6" sm="3">
                <v-sheet class="pa-3 rounded text-center" color="success" variant="tonal">
                  <div class="text-caption">Обучающихся сотрудников</div>
                  <div class="text-h5 font-weight-bold">{{ companyStats.employees_signed }}</div>
                </v-sheet>
              </v-col>

              <!-- Количество спецификаций -->
              <v-col cols="6" sm="3">
                <v-sheet class="pa-3 rounded text-center" color="warning" variant="tonal">
                  <div class="text-caption">Создано спецификаций</div>
                  <div class="text-h5 font-weight-bold">{{ companyStats.specifications_count}}</div>
                </v-sheet>
              </v-col>


              <!-- Потраченный бюджет -->
              <v-col cols="6" sm="3">
                <v-sheet class="pa-3 rounded text-center" color="info" variant="tonal">
                  <div class="text-caption">Всего расходов </div>
                  <div class="text-h5 font-weight-bold">{{ formatCurrency(companyStats.total_budget_spent) }}</div>
                </v-sheet>
              </v-col>

            </v-row>

            <!-- Привязанные спецификации -->
            <v-divider class="my-4" />

            <div class="text-h6 font-weight-medium mb-3">📋 Привязанные спецификации</div>

            <v-table density="compact" class="elevation-0 border-thin rounded-lg">
              <thead>
                <tr class="bg-surface-variant">
                  <th>Номер</th>
                  <th class="text-right">Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="spec in selectedCompany?.specifications" :key="spec.id">
                  <td class="font-weight-medium">{{ spec.number }}</td>
                  <td class="text-right">{{ formatDate(spec.date) }}</td>
                </tr>
                <tr v-if="!selectedCompany?.specifications?.length">
                  <td colspan="3" class="text-center text-medium-emphasis py-4">
                    Нет привязанных спецификаций
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="analyticsDialogVisible = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialogVisible" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить компанию <strong>{{ companyToDelete?.name }}</strong>?
          <div class="text-caption text-medium-emphasis mt-2">
            Все привязанные спецификации потеряют ссылку на эту компанию.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogVisible = false">Отмена</v-btn>
          <v-btn color="error" @click="deleteCompany">Удалить</v-btn>
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
import type { CompanyRequest, CompanyResponse } from '@/types/api'
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'
import { companiesApi, companiesStore } from '@/stores/companiesStore'

// Состояние
const searchQuery = ref('')
const dialogVisible = ref(false)
const analyticsDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editingCompany = ref<CompanyResponse | null>(null)
const selectedCompany = ref<CompanyResponse | null>(null)
const companyToDelete = ref<CompanyResponse | null>(null)
const formValid = ref(false)
const formRef = ref<any>(null)
const companyStats = ref<{
  average_progress: number;
  employees_signed: number;
  specifications_count: number;
  total_budget_spent: number;
} | null>(null)
const statsLoading = ref(false)


// Форма
const formData = ref<CompanyRequest>({
  name: '',
  code: '',
})

// Уведомления
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

// Заголовки таблицы
const headers = [
  { title: 'Наименование', key: 'name', width: 300, align: 'start' },
  { title: 'Код', key: 'code', sortable: true, width: 100, align: 'start' },
  { title: 'Спецификаций', key: 'specifications', sortable: false, width: 120, align: 'center' },
  { title: 'Действия', key: 'actions', sortable: false, width: 160, align: 'end' },
]

// Пагинация
const totalPages = computed(() => Math.ceil(companiesStore.state.pagination.count / companiesStore.state.pagination.per_page) || 1)

// Валидация
const requiredRule = (v: string) => !!v || 'Поле обязательно'
const codeRule = (v: string) => {
  if (!v) return true
  const len = v.trim().length
  return (len >= 2 && len <= 4) || 'Код должен содержать от 2 до 4 символов'
}

function showSnackbar (message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

async function loadCompanies () {
  const params: Record<string, any> = {}
  if (searchQuery.value) params.search = searchQuery.value
  await companiesStore.fetch(params, true)
}

let searchTimeout: ReturnType<typeof setTimeout>
function onSearchChange () {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    companiesStore.state.pagination.page = 1
    loadCompanies()
  }, 300)
}

function onPageChange (page: number) {
  companiesStore.goToPage(page)
  loadCompanies()
}

async function onPageSizeChange (size: number) {
  companiesStore.changePageSize(size)
  await loadCompanies()
}

function openAddDialog () {
  editingCompany.value = null
  formData.value = { name: '', code: '' }
  dialogVisible.value = true
}

async function loadCompanyStats(companyId: number) {
  statsLoading.value = true
  companyStats.value = null
  try {
    const response = await api.get(`/api/stats/company/${companyId}`)
    companyStats.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
    showSnackbar('Не удалось загрузить статистику', 'error')
  } finally {
    statsLoading.value = false
  }
}

function openEditDialog (company: CompanyResponse) {
  editingCompany.value = company
  formData.value = {
    name: company.name,
    code: company.code,
  }
  dialogVisible.value = true
}

async function saveCompany () {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  try {
    if (editingCompany.value) {
      await companiesApi.update(editingCompany.value.id, formData.value)
      showSnackbar('Компания обновлена')
    } else {
      await companiesApi.create(formData.value)
      showSnackbar('Компания добавлена')
    }
    dialogVisible.value = false
    await loadCompanies()
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Ошибка сохранения'
    showSnackbar(message, 'error')
  }
}

function confirmDelete (company: CompanyResponse) {
  companyToDelete.value = company
  deleteDialogVisible.value = true
}

async function deleteCompany () {
  if (!companyToDelete.value) return
  try {
    await companiesApi.remove(companyToDelete.value.id)
    showSnackbar('Компания удалена')
    deleteDialogVisible.value = false
    await loadCompanies()
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Ошибка удаления'
    showSnackbar(message, 'error')
  }
}

function openAnalytics (company: CompanyResponse) {
  selectedCompany.value = company
  analyticsDialogVisible.value = true
  loadCompanyStats(company.id)
}
// 🛠 Утилиты
function formatDate (dateStr: string): string {
  if (!dateStr) return '--'
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function formatCurrency (value: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
}

onMounted(async () => {
  await loadCompanies()
})
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fafafa;
}

.drop-zone:hover {
  border-color: #1976d2;
  background-color: #f0f7ff;
}

.drop-zone-active {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

.v-data-table__wrapper {
  transition: opacity 0.2s ease;
}

</style>