<template>
  <v-container class="pa-6" fluid>
    <!-- Заголовок -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-semibold" style="font-size: 40px;">Сотрудники</h1>
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
        Добавить сотрудника
      </v-btn>
      <v-btn
        color="secondary"
        prepend-icon="mdi-upload"
        style="font-size: 22px;"
        @click="xmlImportDialogVisible = true"
      >
        XML-импорт
      </v-btn>
    </v-row>

    <!-- Поиск и фильтр -->
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          clearable
          density="comfortable"
          label="Поиск по ФИО или email"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="onSearchChange"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedCompanyId"
          clearable
          density="comfortable"
          item-title="name"
          item-value="id"
          :items="companyOptions"
          label="Фильтр по компании"
          variant="outlined"
          @update:model-value="onCompanyFilterChange"
        />
      </v-col>
    </v-row>

    <!-- Состояния загрузки и ошибок -->
    <div v-if="employeesStore.state.loading && !employeesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="employeesStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ employeesStore.state.error }}
    </v-alert>

    <!-- Таблица сотрудников -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        disable-pagination
        :headers="headers"
        hide-default-footer
        hover
        item-key="id"
        :items="employeesStore.state.items"
        :items-per-page="employeesStore.state.pagination.per_page"
        no-data-text="Сотрудники не найдены"
      >
        <template #item.full_name="{ item }">
          <div class="d-flex align-center ga-3">
            <div class="font-weight-medium">{{ item.full_name }}</div>
          </div>
        </template>
        <template #item.email="{ item }">
          <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
        </template>
        <template #item.company="{ item }">
          <div class="text-caption text-medium-emphasis">{{ item.company.name }}</div>
        </template>
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
            @click="openDetail(item)"
          />
          <v-btn
            color="success"
            icon="mdi-xml"
            size="small"
            variant="text"
            @click="exportEmployeeToXML(item)"
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
            :model-value="employeesStore.state.pagination.per_page"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="onPageSizeChange"
          />
          <span class="text-caption text-medium-emphasis">из {{ employeesStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="employeesStore.state.pagination.page"
          size="small"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- Диалог добавления/редактирования -->
    <v-dialog v-model="dialogVisible" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold pt-4">
          {{ editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="formData.full_name"
              label="ФИО"
              required
              :rules="[requiredRule]"
            />
            <v-text-field
              v-model="formData.email"
              label="Email"
              required
              :rules="[requiredRule, emailRule]"
            />
            <v-select
              v-model="formData.company_id"
              item-title="name"
              item-value="id"
              :items="companies"
              label="Компания"
              required
              :rules="[requiredRule]"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogVisible = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveEmployee">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог просмотра деталей -->
    <v-dialog v-model="detailDialogVisible" max-width="600">
      <v-card v-if="selectedEmployee">
        <v-card-title class="text-h5 font-weight-bold pt-4 d-flex align-center ga-3">
          <div>
            {{ selectedEmployee.full_name }}
            <div class="text-caption font-weight-regular text-medium-emphasis">{{ selectedEmployee.email }}</div>
          </div>
        </v-card-title>
        <v-divider class="my-2" />
        <v-card-text class="pa-4">
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-domain">
              <template #title>Компания</template>
              <template #subtitle>{{ selectedEmployee.company?.name }}</template>
            </v-list-item>
            <v-list-item prepend-icon="mdi-account-group-outline">
              <template #title>Группы</template>
              <template #subtitle>{{ selectedEmployee.groups?.map(g => g.course_title).join(', ') || 'Нет активных групп' }}</template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialogVisible = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialogVisible" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить сотрудника <strong>{{ employeeToDelete?.full_name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogVisible = false">Отмена</v-btn>
          <v-btn color="error" @click="deleteEmployee">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Модальное окно для XML импорта -->
    <v-dialog v-model="xmlImportDialogVisible" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold pt-4">
          Импорт сотрудников из XML
        </v-card-title>
        <v-card-text class="pa-4">
          <v-card
            class="drop-zone pa-4 text-center"
            :class="{ 'drop-zone-active': isDragging }"
            @dragleave.prevent="isDragging = false"
            @dragover.prevent="isDragging = true"
            @drop.prevent="handleDrop"
          >
            <v-icon color="grey-darken-1" size="48">mdi-file-xml-box</v-icon>
            <div class="text-body-1 mt-2">
              Перетащите XML-файл с сотрудниками сюда или <strong>нажмите для выбора</strong>
            </div>
            <input
              ref="fileInput"
              accept=".xml"
              style="display: none"
              type="file"
              @change="handleFileImport"
            >
            <v-btn
              class="mt-4"
              color="secondary"
              variant="tonal"
              @click="triggerFileInput"
            >
              Выбрать файл
            </v-btn>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="xmlImportDialogVisible = false">Закрыть</v-btn>
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
  import type { CompanyResponse, EmployeeResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import api from '@/api/client'
  import { useXml } from '@/composables/useXml'
  import { employeesApi, employeesStore } from '@/stores/employeesStore'

  const { upload: uploadXml, exportXml } = useXml()

  // Состояние
  const searchQuery = ref('')
  const selectedCompanyId = ref<number | null>(null)
  const dialogVisible = ref(false)
  const detailDialogVisible = ref(false)
  const deleteDialogVisible = ref(false)
  const xmlImportDialogVisible = ref(false) // управление модалкой
  const editingEmployee = ref<EmployeeResponse | null>(null)
  const selectedEmployee = ref<EmployeeResponse | null>(null)
  const employeeToDelete = ref<EmployeeResponse | null>(null)
  const formValid = ref(false)
  const formRef = ref<any>(null)
  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  // Список компаний
  const companies = ref<CompanyResponse[]>([])
  const companyOptions = computed(() => companies.value)

  // Форма
  const formData = ref({
    full_name: '',
    email: '',
    company_id: null as number | null,
  })

  // Уведомления
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success',
  })

  // Заголовки таблицы
  const headers = [
    { title: 'ФИО', key: 'full_name', width: 300, align: 'start' },
    { title: 'Email', key: 'email', sortable: false, align: 'start' },
    { title: 'Компания', key: 'company', sortable: false, width: 300, align: 'start' },
    { title: 'Действия', key: 'actions', sortable: false, width: 160, align: 'end' },
  ]

  // Пагинация
  const totalPages = computed(() => Math.ceil(employeesStore.state.pagination.count / employeesStore.state.pagination.per_page) || 1)

  // Валидация
  const requiredRule = (v: string) => !!v || 'Поле обязательно'
  const emailRule = (v: string) => /.+@.+\..+/.test(v) || 'Введите корректный email'

  function showSnackbar (message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
  }

  async function loadCompanies () {
    try {
      const response = await api.get('/api/companies/')
      let data: CompanyResponse[] = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        data = response.data.results
      } else {
        console.warn('Неожиданный формат ответа компаний:', response.data)
      }
      companies.value = data
    } catch (error) {
      console.error('Ошибка загрузки компаний:', error)
      companies.value = []
      showSnackbar('Не удалось загрузить список компаний', 'error')
    }
  }

  async function loadEmployees () {
    const params: Record<string, any> = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedCompanyId.value) params.company = selectedCompanyId.value
    await employeesStore.fetch(params, true)
  }

  let searchTimeout: ReturnType<typeof setTimeout>
  function onSearchChange () {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      employeesStore.state.pagination.page = 1
      loadEmployees()
    }, 300)
  }

  function onCompanyFilterChange () {
    employeesStore.state.pagination.page = 1
    loadEmployees()
  }

  function onPageChange (page: number) {
    employeesStore.goToPage(page)
    // goToPage уже вызывает fetch внутри, но для единообразия можно вызвать loadEmployees
    // Однако goToPage сам вызывает fetch, поэтому loadEmployees не нужен.
    // Но чтобы гарантировать обновление с фильтрами, лучше перевызвать loadEmployees
    loadEmployees()
  }

  async function onPageSizeChange (size: number) {
    employeesStore.changePageSize(size)
    await loadEmployees()
  }

  function openAddDialog () {
    editingEmployee.value = null
    formData.value = { full_name: '', email: '', company_id: null }
    dialogVisible.value = true
  }

  function openEditDialog (employee: EmployeeResponse) {
    editingEmployee.value = employee
    formData.value = {
      full_name: employee.full_name,
      email: employee.email,
      company_id: employee.company.id,
    }
    dialogVisible.value = true
  }

  async function saveEmployee () {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    try {
      if (editingEmployee.value) {
        await employeesApi.update(editingEmployee.value.id, {
          full_name: formData.value.full_name,
          email: formData.value.email,
          company_id: formData.value.company_id!,
          assign_to_groups: [],
        })
        showSnackbar('Сотрудник обновлён')
      } else {
        await employeesApi.create({
          full_name: formData.value.full_name,
          email: formData.value.email,
          company_id: formData.value.company_id!,
          assign_to_groups: [],
        })
        showSnackbar('Сотрудник добавлен')
      }
      dialogVisible.value = false
      await loadEmployees()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка сохранения'
      showSnackbar(message, 'error')
    }
  }

  function confirmDelete (employee: EmployeeResponse) {
    employeeToDelete.value = employee
    deleteDialogVisible.value = true
  }

  async function deleteEmployee () {
    if (!employeeToDelete.value) return
    try {
      await employeesApi.remove(employeeToDelete.value.id)
      showSnackbar('Сотрудник удалён')
      deleteDialogVisible.value = false
      await loadEmployees()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка удаления'
      showSnackbar(message, 'error')
    }
  }

  function openDetail (employee: EmployeeResponse) {
    selectedEmployee.value = employee
    detailDialogVisible.value = true
  }

  async function exportEmployeeToXML (employee: EmployeeResponse) {
    try {
      await exportXml('employee', employee.id)
      showSnackbar('XML экспортирован')
    } catch {
      showSnackbar('Ошибка экспорта XML', 'error')
    }
  }

  // XML импорт внутри модалки
  const triggerFileInput = () => fileInput.value?.click()

  async function handleFileImport (event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files?.[0]) await processXmlFile(input.files[0])
    input.value = ''
  }

  async function handleDrop (event: DragEvent) {
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) await processXmlFile(file)
  }

  async function processXmlFile (file: File) {
    if (!file.name.endsWith('.xml')) {
      showSnackbar('Загрузите XML-файл', 'error')
      return
    }
    try {
      await uploadXml(file)
      showSnackbar('XML импортирован, обновление данных...')
      // Даём время бэкенду обработать
      setTimeout(async () => {
        await loadEmployees()
        xmlImportDialogVisible.value = false
        showSnackbar('Таблица обновлена')
      }, 1500)
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка импорта XML'
      showSnackbar(message, 'error')
    }
  }

  onMounted(async () => {
    await Promise.all([loadCompanies(), loadEmployees()])
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
