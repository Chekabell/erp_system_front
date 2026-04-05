<template>
  <v-container class="pa-6" fluid>
    <!-- Заголовок -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-semibold" style="font-size: 40px;">Учебные группы</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <!-- Кнопки действий -->
    <v-row align="center" class="mb-6" gap="20">
      <v-btn color="primary" prepend-icon="mdi-plus" style="font-size: 22px;" @click="openCreateModal">
        Создать группу
      </v-btn>
    </v-row>

    <!-- Поиск и фильтры -->
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          clearable
          density="comfortable"
          label="Поиск по курсу..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="onSearchChange"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-autocomplete
          v-model="filters.course"
          clearable
          density="comfortable"
          item-title="title"
          item-value="id"
          :items="coursesStore.state.items"
          label="Курс"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.status"
          clearable
          density="comfortable"
          :items="statusOptions"
          label="Статус"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-autocomplete
          v-model="filters.specification"
          clearable
          density="comfortable"
          item-title="number"
          item-value="id"
          :items="specificationsStore.state.items"
          label="Спецификация"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </v-col>
    </v-row>

    <!-- Загрузка / Ошибка -->
    <div v-if="groupsStore.state.loading && !groupsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="groupsStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ groupsStore.state.error }}
    </v-alert>

    <!-- Таблица групп -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        :headers="headers"
        hide-default-footer
        hover
        :items="groupsStore.state.items"
        no-data-text="Группы не найдены"
      >
        <template #item.course="{ item }">
          <div class="font-weight-medium">{{ item.course.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.course.duration_days }} дн.</div>
        </template>
        <template #item.period="{ item }">
          <div>{{ formatDate(item.start_date) }}</div>
          <div class="text-caption text-medium-emphasis">– {{ formatDate(item.end_date) }}</div>
        </template>
        <template #item.employees_count="{ item }">
          <v-chip color="primary" size="small" variant="tonal">{{ item.employees_count }}</v-chip>
        </template>
        <template #item.average_progress="{ item }">
          <div class="d-flex align-center ga-2">
            <v-progress-linear
              color="green-accent-4"
              height="6"
              :model-value="item.average_progress"
              rounded
              style="width: 80px;"
            />
            <span class="text-caption">{{ formatProgress(item.average_progress) }}%</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.total_cost="{ item }">
          <div class="text-right font-weight-bold">{{ formatCurrency(item.total_cost) }}</div>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditModal(item)"
          />
          <v-btn
            color="secondary"
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="openDetailModal(item)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>

      <!-- Пагинация -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            density="compact"
            hide-details
            :items="[5, 10, 20]"
            :model-value="groupsStore.state.pagination.per_page"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="onPageSizeChange"
          />
          <span class="text-caption text-medium-emphasis">из {{ groupsStore.state.pagination.count }}</span>
        </div>
        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="groupsStore.state.pagination.page"
          size="small"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- Модальное окно: создание / редактирование группы -->
    <v-dialog v-model="formDialog" max-width="700" scrollable>
      <v-card :loading="formLoading">
        <v-card-title class="text-h5 font-weight-bold pt-4">
          {{ isEditing ? 'Редактировать группу' : 'Создать учебную группу' }}
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2">
          {{ isEditing ? `Группа #${formData.id}` : 'Заполните данные новой группы' }}
        </v-card-subtitle>
        <v-divider />
        <v-card-text class="pa-4">
          <v-form ref="formRef" v-model="formValid">
            <v-autocomplete
              v-model="formData.course_id"
              density="compact"
              :disabled="isEditing"
              item-title="title"
              item-value="id"
              :items="coursesStore.state.items"
              label="Курс обучения *"
              :rules="[v => !!v || 'Выберите курс']"
              variant="outlined"
              @update:model-value="onCourseChange"
            />
            <v-autocomplete
              v-model="formData.specification_id"
              density="compact"
              hint="Необязательно"
              item-title="number"
              item-value="id"
              :items="specificationsStore.state.items"
              label="Спецификация"
              variant="outlined"
            />
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.start_date"
                  density="compact"
                  label="Дата начала *"
                  :rules="[v => !!v || 'Укажите дату']"
                  type="date"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.end_date"
                  density="compact"
                  label="Дата окончания *"
                  :rules="[v => !!v || 'Укажите дату']"
                  type="date"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <v-select
              v-model="formData.status"
              density="compact"
              :items="statusOptions"
              label="Статус"
              variant="outlined"
            />
            <v-autocomplete
              v-model="selectedEmployeeIds"
              chips
              closable-chips
              density="compact"
              hint="Выберите сотрудников из списка"
              item-title="full_name"
              item-value="id"
              :items="employeesStore.state.items"
              label="Участники группы"
              multiple
              variant="outlined"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    {{ item.raw?.company?.name ?? '—' }} • {{ item.raw?.email ?? '—' }}
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
            <v-alert class="mt-4" type="info" variant="tonal">
              <template #title>💰 Расчёт стоимости</template>
              <div class="text-body-2">
                <div>Цена за человека: <strong>{{ formatCurrency(coursePrice) }}</strong></div>
                <div>Участников: <strong>{{ selectedEmployeeIds.length }}</strong></div>
                <div class="text-h6 font-weight-bold mt-2">Итого: {{ formatCurrency(calculatedCost) }}</div>
              </div>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveGroup">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Модальное окно: детали группы (участники, прогресс, конфликты) -->
    <v-dialog v-model="detailDialog" max-width="900" scrollable>
      <v-card v-if="selectedGroup">
        <v-card-title class="text-h5 font-weight-bold pt-4 d-flex align-center ga-3">
          <v-icon color="primary">mdi-account-group</v-icon>
          {{ selectedGroup.course.title }}
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2">
          {{ formatDate(selectedGroup.start_date) }} – {{ formatDate(selectedGroup.end_date) }}
          <v-chip class="ml-2" :color="getStatusColor(selectedGroup.status)" size="small">
            {{ getStatusLabel(selectedGroup.status) }}
          </v-chip>
        </v-card-subtitle>
        <v-divider />
        <v-card-text class="pa-4">
          <!-- Карточки статистики -->
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

          <!-- Предупреждение о конфликтах -->
          <v-alert
            v-if="conflictingEmployeeIds.size > 0"
            class="mb-4"
            density="compact"
            type="warning"
            variant="tonal"
          >
            ⚠️ В группе есть {{ conflictingEmployeeIds.size }} конфликтных участников.
            У этих сотрудников занятия пересекаются с другими группами.
          </v-alert>

          <!-- Таблица участников -->
          <h3 class="text-h6 font-weight-medium mb-3">Участники и прогресс</h3>
          <v-table class="elevation-0 border-thin rounded-lg" density="compact">
            <thead>
              <tr class="bg-surface-variant">
                <th>Сотрудник</th>
                <th>Компания</th>
                <th class="text-right" style="width: 150px;">Прогресс</th>
                <th class="text-center" style="width: 80px;">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in groupEmployees" :key="emp.id">
                <td class="font-weight-medium">
                  {{ emp.full_name }}
                  <v-icon
                    v-if="conflictingEmployeeIds.has(emp.id)"
                    class="ml-1"
                    color="orange-darken-2"
                    icon="mdi-alert"
                    size="small"
                  />
                </td>
                <td class="text-medium-emphasis">{{ emp.company_name }}</td>
                <td>
                  <div class="d-flex align-center ga-2">
                    <v-slider
                      v-model="emp.progress_percent"
                      color="primary"
                      density="compact"
                      hide-details
                      max="100"
                      min="0"
                      step="1"
                      style="width: 100px;"
                      @end="updateEmployeeProgress(emp.id, emp.progress_percent)"
                    />
                    <span class="text-caption font-weight-bold">{{ formatProgress(emp.progress_percent) }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <v-btn
                    color="error"
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    @click="removeEmployeeFromGroup(emp.id)"
                  />
                </td>
              </tr>
              <tr v-if="groupEmployees.length === 0">
                <td class="text-center text-medium-emphasis py-4" colspan="4">Нет участников в группе</td>
              </tr>
            </tbody>
          </v-table>

          <!-- Добавление участника -->
          <div class="mt-4 d-flex ga-2">
            <v-autocomplete
              v-model="newEmployeeId"
              density="compact"
              hide-details
              item-title="full_name"
              item-value="id"
              :items="availableEmployees"
              label="Добавить участника"
              style="flex: 1;"
              variant="outlined"
            />
            <v-btn color="primary" :disabled="!newEmployeeId" prepend-icon="mdi-plus" @click="addEmployeeToGroup">
              Добавить
            </v-btn>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы действительно хотите удалить группу "{{ groupToDelete?.course.title }}"?
          <div class="text-caption text-medium-emphasis mt-2">Это действие также удалит все связи с участниками.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" @click="confirmDeleteAction">Удалить</v-btn>
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
  import type { GroupRequest, GroupResponse, SimpleEmployeeResponse } from '@/types/api'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import api from '@/api/client'
  import { coursesStore } from '@/stores/coursesStore'
  import { employeesStore } from '@/stores/employeesStore'
  import { useGantt } from '@/stores/ganttChartStore'
  import { groupsStore } from '@/stores/groupsStore'
  import { specificationsStore } from '@/stores/specificationsStore'

  const route = useRoute()
  const router = useRouter()
  const ganttStore = useGantt()

  // ---------- Уведомления ----------
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success',
  })

  function showSnackbar (message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
  }

  // ---------- Поиск и фильтры ----------
  const search = ref('')
  const filters = ref({
    course: null as number | null,
    status: null as string | null,
    specification: null as number | null,
  })
  const totalPages = computed(() => Math.ceil(groupsStore.state.pagination.count / groupsStore.state.pagination.per_page) || 1)

  // ---------- Поиск и фильтры ----------
  function applyFilters () {
    groupsStore.reset()
    groupsStore.fetch({ ...filters.value }, true) // force = true
  }

  let searchTimeout: ReturnType<typeof setTimeout>
  function onSearchChange () {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      groupsStore.reset()
      groupsStore.state.pagination.page = 1
      groupsStore.fetch({ search: search.value, ...filters.value }, true)
    }, 300)
  }

  function onPageChange (page: number) {
    groupsStore.goToPage(page)
    groupsStore.fetch({ search: search.value, ...filters.value }, true)
  }

  async function onPageSizeChange (size: number) {
    groupsStore.changePageSize(size)
    await groupsStore.fetch({ search: search.value, ...filters.value }, true)
  }

  // ---------- Таблица ----------
  const headers = [
    { title: 'Курс', key: 'course', width: 250 },
    { title: 'Период', key: 'period', width: 180 },
    { title: 'Участников', key: 'employees_count', align: 'center' },
    { title: 'Прогресс', key: 'average_progress', width: 150 },
    { title: 'Статус', key: 'status', width: 120 },
    { title: 'Стоимость', key: 'total_cost', align: 'end' },
    { title: '', key: 'actions', sortable: false, width: 120, align: 'end' },
  ]

  // ---------- Статусы ----------
  const statusOptions = [
    { title: 'Планируется', value: 'planned' },
    { title: 'В процессе', value: 'in_progress' },
    { title: 'Завершено', value: 'completed' },
  ]

  function getStatusColor (status?: string) {
    const map: Record<string, string> = { planned: 'blue', in_progress: 'orange', completed: 'green' }
    return map[status || 'planned'] || 'grey'
  }

  function getStatusLabel (status?: string) {
    const map: Record<string, string> = { planned: 'Планируется', in_progress: 'В процессе', completed: 'Завершено' }
    return map[status || 'planned'] || 'Неизвестно'
  }

  // ---------- Форма создания/редактирования ----------
  const formDialog = ref(false)
  const detailDialog = ref(false)
  const deleteDialog = ref(false)
  const isEditing = ref(false)
  const formLoading = ref(false)
  const formValid = ref(false)
  const formRef = ref<any>(null)

  interface GroupFormData extends GroupRequest {
    id?: number
    employee_ids: number[]
  }

  const formData = ref<GroupFormData>({
    course_id: 0,
    specification_id: null as any,
    start_date: '',
    end_date: '',
    status: 'planned',
    employee_ids: [],
  })

  const selectedEmployeeIds = ref<number[]>([])
  const coursePrice = ref<number>(0)
  const calculatedCost = computed(() => coursePrice.value * selectedEmployeeIds.value.length)

  // ---------- Детали группы ----------
  const selectedGroup = ref<GroupResponse | null>(null)
  const groupEmployees = ref<Array<SimpleEmployeeResponse & { progress_percent: number }>>([])
  const newEmployeeId = ref<number | null>(null)
  const groupToDelete = ref<GroupResponse | null>(null)

  // ---------- Конфликты (на основе ganttStore) ----------
  const conflictingEmployeeIds = computed(() => {
    if (!selectedGroup.value) return new Set<number>()
    const currentGroupId = selectedGroup.value.id
    const currentStart = new Date(selectedGroup.value.start_date)
    const currentEnd = new Date(selectedGroup.value.end_date)
    const allGanttGroups = ganttStore.state.data?.groups || []

    const employeeSchedules = new Map<number, Array<{ start: Date, end: Date }>>()
    for (const g of allGanttGroups) {
      if (g.id === currentGroupId) continue
      if (g.members) {
        for (const emp of g.members) {
          if (!employeeSchedules.has(emp.id)) employeeSchedules.set(emp.id, [])
          employeeSchedules.get(emp.id)!.push({
            start: new Date(g.start_date),
            end: new Date(g.end_date),
          })
        }
      }
    }

    const conflicted = new Set<number>()
    for (const emp of groupEmployees.value) {
      const schedules = employeeSchedules.get(emp.id) || []
      for (const s of schedules) {
        if (currentStart < s.end && s.start < currentEnd) {
          conflicted.add(emp.id)
          break
        }
      }
    }
    return conflicted
  })

  // ---------- Вспомогательные функции ----------
  function formatDate (dateStr: string): string {
    if (!dateStr) return '--'
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }

  function formatProgress (value: number | string | null | undefined): number {
    if (value === null || value === undefined || isNaN(Number(value))) return 0
    return Math.round(Number(value))
  }

  function formatCurrency (value: string | number): string {
    const num = typeof value === 'string' ? Number.parseFloat(value) : value
    if (isNaN(num)) return '0 ₽'
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num)
  }

  // ---------- Обработчики формы ----------
  function onCourseChange (courseId: number) {
    const course = coursesStore.state.items.find(c => c.id === courseId)
    if (course) {
      coursePrice.value = Number.parseFloat(String(course.base_price))
    }
  }

  function openCreateModal () {
    isEditing.value = false
    formData.value = {
      course_id: 0,
      specification_id: null,
      start_date: '',
      end_date: '',
      status: 'planned',
      employee_ids: [],
    }
    selectedEmployeeIds.value = []
    coursePrice.value = 0
    formDialog.value = true
  }

  async function openEditModal (group: GroupResponse) {
    isEditing.value = true
    formData.value = {
      id: group.id,
      course_id: group.course.id,
      specification_id: group.specification?.id ?? null,
      start_date: group.start_date,
      end_date: group.end_date,
      status: group.status || 'planned',
      employee_ids: [],
    }
    coursePrice.value = Number.parseFloat(String(group.course.base_price))

    // Загружаем текущих сотрудников группы
    try {
      const response = await api.get(`/api/groups/${group.id}/employee/`)
      const employees = response.data.employees || []
      selectedEmployeeIds.value = employees.map((e: any) => e.id)
      formData.value.employee_ids = [...selectedEmployeeIds.value]
    } catch (error) {
      console.error('Ошибка загрузки участников группы:', error)
      selectedEmployeeIds.value = []
    }

    formDialog.value = true
  }

  async function saveGroup () {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    formLoading.value = true
    try {
      const groupPayload: GroupRequest = {
        course_id: formData.value.course_id,
        specification_id: formData.value.specification_id === 0 ? null : formData.value.specification_id,
        start_date: formData.value.start_date,
        end_date: formData.value.end_date,
        status: formData.value.status,
      }

      if (isEditing.value && formData.value.id) {
        // Обновляем основную информацию
        await groupsStore.update(formData.value.id, groupPayload)
        // Синхронизируем участников: получаем текущий список, вычисляем разницу
        const currentResponse = await api.get(`/api/groups/${formData.value.id}/employee/`)
        const currentIds = currentResponse.data.employees.map((e: any) => e.id)
        const newIds = selectedEmployeeIds.value
        const toAdd = newIds.filter(id => !currentIds.includes(id))
        const toRemove = currentIds.filter(id => !newIds.includes(id))

        for (const empId of toAdd) {
          await api.post(`/api/groups/${formData.value.id}/employee/`, { employee_ids: [empId] })
        }
        for (const empId of toRemove) {
          await api.delete(`/api/groups/${formData.value.id}/employee/${empId}/`)
        }
        showSnackbar('Группа обновлена')
      } else {
        // Создание: отправляем employee_ids в теле (если бэкенд поддерживает)
        await groupsStore.create({ ...groupPayload, employee_ids: selectedEmployeeIds.value })
        showSnackbar('Группа создана')
      }
      formDialog.value = false
      await groupsStore.fetch({ search: search.value, ...filters.value }, true)
      await ganttStore.fetch()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка сохранения группы'
      showSnackbar(message, 'error')
    } finally {
      formLoading.value = false
    }
  }

  // ---------- Детали группы (участники, прогресс) ----------
  async function openDetailModal (group: GroupResponse) {
    selectedGroup.value = group
    detailDialog.value = true
    await loadGroupEmployees(group.id)
  }

  async function loadGroupEmployees (groupId: number) {
    try {
      const response = await api.get(`/api/groups/${groupId}/employee/`)
      groupEmployees.value = response.data.employees || []
    } catch (error) {
      console.error('Ошибка загрузки участников:', error)
      groupEmployees.value = []
    }
  }

  async function updateEmployeeProgress (employeeId: number, progress: number) {
    if (!selectedGroup.value) return
    try {
      const intProgress = formatProgress(progress)
      await api.patch(`/api/groups/${selectedGroup.value.id}/employee/${employeeId}/`, { progress_percent: intProgress })
      // Обновляем локально
      const emp = groupEmployees.value.find(e => e.id === employeeId)
      if (emp) emp.progress_percent = intProgress
      // Обновляем средний прогресс в таблице
      await groupsStore.fetch({ search: search.value, ...filters.value })
      await ganttStore.fetch()
      showSnackbar('Прогресс обновлён')
    } catch (error) {
      console.error('Ошибка обновления прогресса:', error)
      showSnackbar('Ошибка обновления прогресса', 'error')
    }
  }

  async function addEmployeeToGroup () {
    if (!selectedGroup.value || !newEmployeeId.value) return
    try {
      await api.post(`/api/groups/${selectedGroup.value.id}/employee/`, { employee_ids: [newEmployeeId.value] })
      newEmployeeId.value = null
      await loadGroupEmployees(selectedGroup.value.id)
      await groupsStore.fetch({ search: search.value, ...filters.value })
      await ganttStore.fetch()
      showSnackbar('Участник добавлен')
    } catch (error) {
      console.error('Ошибка добавления участника:', error)
      showSnackbar('Ошибка добавления участника', 'error')
    }
  }

  async function removeEmployeeFromGroup (employeeId: number) {
    if (!selectedGroup.value) return
    try {
      await api.delete(`/api/groups/${selectedGroup.value.id}/employee/${employeeId}/`)
      groupEmployees.value = groupEmployees.value.filter(e => e.id !== employeeId)
      await groupsStore.fetch({ search: search.value, ...filters.value })
      await ganttStore.fetch()
      showSnackbar('Участник удалён')
    } catch (error) {
      console.error('Ошибка удаления участника:', error)
      showSnackbar('Ошибка удаления участника', 'error')
    }
  }

  // ---------- Удаление группы ----------
  function confirmDelete (group: GroupResponse) {
    groupToDelete.value = group
    deleteDialog.value = true
  }

  async function confirmDeleteAction () {
    if (!groupToDelete.value) return
    try {
      await groupsStore.remove(groupToDelete.value.id)
      deleteDialog.value = false
      await groupsStore.fetch({ search: search.value, ...filters.value }, true)
      await ganttStore.fetch()
      showSnackbar('Группа удалена')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка удаления'
      showSnackbar(message, 'error')
    }
  }

  // ---------- Доступные для добавления сотрудники ----------
  const availableEmployees = computed(() => {
    const assignedIds = new Set(groupEmployees.value.map(e => e.id))
    return employeesStore.state.items.filter(e => !assignedIds.has(e.id))
  })

  // ---------- Инициализация ----------
  onMounted(async () => {
    await Promise.all([
      groupsStore.fetch(),
      coursesStore.fetch(),
      employeesStore.fetch(),
      specificationsStore.fetch(),
    ])
    if (!ganttStore.state.data) {
      await ganttStore.fetch()
    }
  })
</script>

<style scoped>
.v-data-table__wrapper {
  transition: opacity 0.2s ease;
}
</style>
