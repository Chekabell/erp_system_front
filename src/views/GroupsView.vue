<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Учебные группы</h1>
          <p class="text-body-2 text-medium-emphasis">Основной объект учета: курс + период + участники + стоимость</p>
        </div>
        <div class="d-flex ga-3">
          <v-text-field
            v-model="search"
            density="compact"
            hide-details
            label="Поиск по курсу..."
            prepend-inner-icon="mdi-magnify"
            style="max-width: 300px;"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="groupsStore.state.loading" prepend-icon="mdi-plus" @click="openCreateModal">
            Создать группу
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Filters -->
    <v-card class="mb-4 pa-4" variant="outlined">
      <v-row dense>
        <v-col cols="12" sm="4">
          <v-autocomplete
            v-model="filters.course"
            clearable
            density="compact"
            item-title="title"
            item-value="id"
            :items="coursesStore.state.items"
            label="Курс"
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filters.status"
            clearable
            density="compact"
            :items="statusOptions"
            label="Статус"
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-autocomplete
            v-model="filters.specification"
            clearable
            density="compact"
            item-title="number"
            item-value="id"
            :items="specificationsStore.state.items"
            label="Спецификация"
            @update:model-value="applyFilters"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Loading / Error -->
    <div v-if="groupsStore.state.loading && !groupsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="groupsStore.state.error" class="mt-4" type="error" variant="tonal">{{ groupsStore.state.error }}</v-alert>

    <!-- Table -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        :headers="headers"
        hide-default-footer
        hover
        :items="groupsStore.state.items"
        no-data-text="Группы не найдены"
      >
        <!-- Course -->
        <template #item.course="{ item }">
          <div class="font-weight-medium">{{ item.course.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.course.duration_days }} дн.</div>
        </template>

        <!-- Period -->
        <template #item.period="{ item }">
          <div>{{ formatDate(item.start_date) }}</div>
          <div class="text-caption text-medium-emphasis">– {{ formatDate(item.end_date) }}</div>
        </template>

        <!-- Participants -->
        <template #item.employees_count="{ item }">
          <v-chip color="primary" size="small" variant="tonal">{{ item.employees_count }}</v-chip>
        </template>

        <!-- Progress -->
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

        <!-- Status -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Cost -->
        <template #item.total_cost="{ item }">
          <div class="text-right font-weight-bold">{{ formatCurrency(item.total_cost) }}</div>
        </template>

        <!-- Actions -->
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

      <!-- Footer: Page Size & Pagination -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            v-model="groupsStore.state.pagination.pageSize"
            density="compact"
            hide-details
            :items="[10, 20, 50, 100]"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="groupsStore.changePageSize"
          />
          <span class="text-caption text-medium-emphasis">из {{ groupsStore.state.pagination.count }}</span>
        </div>
        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="groupsStore.state.pagination.page"
          size="small"
          @update:model-value="groupsStore.goToPage"
        />
      </div>
    </v-card>

    <!-- Modal: Create/Edit Group -->
    <v-dialog v-model="formDialog" max-width="700" scrollable>
      <v-card :loading="formLoading">
        <v-card-title class="text-h5 font-weight-bold pt-4">
          {{ isEditing ? 'Редактировать группу' : 'Создать учебную группу' }}
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2">
          {{ isEditing ? `Группа #${formData.id}` : 'Заполните данные новой группы' }}
        </v-card-subtitle>
        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="saveGroup">
            <!-- Course -->
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

            <!-- Specification -->
            <v-autocomplete
              v-model="formData.specification_id"
              density="compact"
              hint="Необязательно. Группа может быть не привязана к спецификации."
              item-title="number"
              item-value="id"
              :items="specificationsStore.state.items"
              label="Спецификация"
              variant="outlined"
            />

            <!-- Dates -->
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

            <!-- Status -->
            <v-select
              v-model="formData.status"
              density="compact"
              :items="statusOptions"
              label="Статус"
              variant="outlined"
            />

            <!-- Employees Multi-select -->
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

            <!-- Real-time Cost Calculation -->
            <v-alert class="mt-4" type="info" variant="tonal">
              <template #title>💰 Расчет стоимости</template>
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

    <!-- Modal: Group Detail (Participants & Progress) -->
    <v-dialog v-model="detailDialog" max-width="800" scrollable>
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

        <v-divider class="my-2" />

        <v-card-text class="pa-4">
          <!-- Summary -->
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

          <!-- Participants Table with Progress -->
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
                <td class="font-weight-medium">{{ emp.full_name }}</td>
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

                    <span class="text-caption font-weight-bold" style="min-width: 35px;">
                      {{ formatProgress(emp.progress_percent) }}%
                    </span>

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

          <!-- Add Employee to Group -->
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы действительно хотите удалить группу "{{ groupToDelete?.course.title }}"?
          <div class="text-caption text-medium-emphasis mt-2">
            Это действие также удалит все связи с участниками.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" @click="confirmDeleteAction">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">

  import type { GroupRequest, GroupResponse, SimpleEmployeeResponse } from '@/types/api'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import api from '@/api/client'
  import { coursesStore } from '@/stores/coursesStore'
  import { employeesStore } from '@/stores/employeesStore'
  import { useGroupEmployees } from '@/stores/groupEmployeesStore'
  import { groupsStore } from '@/stores/groupsStore'
  import { specificationsStore } from '@/stores/specificationsStore'

  const route = useRoute()

  // Функция для открытия модального окна деталей (у вас уже есть openDetailModal)
  // Если её нет – создайте (она принимает GroupResponse)

  // Открытие по query-параметру
  watch(
    () => route.query.openGroup,
    async groupIdStr => {
      if (!groupIdStr) return
      const groupId = Number(groupIdStr)
      if (isNaN(groupId)) return

      // Ждём загрузки списка групп, если ещё не загружен
      if (!groupsStore.state.isFetched) {
        await groupsStore.fetch()
      }
      const group = groupsStore.state.items.find(g => g.id === groupId)
      if (group) {
        await openDetailModal(group) // ваша существующая функция
        // Убираем параметр из URL, чтобы при повторном открытии сработало снова
        router.replace({ query: { ...route.query, openGroup: undefined } })
      }
    },
    { immediate: true },
  )

  // Search & Filters
  const search = ref('')
  const filters = ref({ course: null as number | null, status: null as string | null, specification: null as number | null })
  const totalPages = computed(() => Math.ceil(groupsStore.state.pagination.count / groupsStore.state.pagination.pageSize) || 1)

  function handleSearch () {
    groupsStore.reset()
    groupsStore.fetch({ search: search.value || undefined, ...filters.value })
  }
  function applyFilters () {
    groupsStore.reset()
    groupsStore.fetch({ ...filters.value })
  }

  // Table Headers
  const headers = [
    { title: 'Курс', key: 'course', width: 250 },
    { title: 'Период', key: 'period', width: 180 },
    { title: 'Участников', key: 'employees_count', align: 'center' },
    { title: 'Прогресс', key: 'average_progress', width: 150 },
    { title: 'Статус', key: 'status', width: 120 },
    { title: 'Стоимость', key: 'total_cost', align: 'end' },
    { title: '', key: 'actions', sortable: false, width: 120, align: 'end' },
  ]

  // Status helpers
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

  // Form State
  const formDialog = ref(false)
  const detailDialog = ref(false)
  const deleteDialog = ref(false)
  const isEditing = ref(false)
  const formLoading = ref(false)
  const formValid = ref(false)

  const formData = ref<GroupRequest & { id?: number }>({
    course_id: 0,
    specification_id: 0,
    start_date: '',
    end_date: '',
    status: 'planned',
    total_cost: '0',
  })

  const selectedEmployeeIds = ref<number[]>([])
  const coursePrice = ref<number>(0)
  const calculatedCost = computed(() => coursePrice.value * selectedEmployeeIds.value.length)

  // Detail State
  const selectedGroup = ref<GroupResponse | null>(null)
  const groupEmployees = ref<Array<SimpleEmployeeResponse & { progress_percent: number }>>([])
  const newEmployeeId = ref<number | null>(null)

  // Delete State
  const groupToDelete = ref<GroupResponse | null>(null)

  // Computed
  const availableEmployees = computed(() => {
    const assignedIds = new Set(groupEmployees.value.map(e => e.id))
    return employeesStore.state.items.filter(e => !assignedIds.has(e.id))
  })

  // Utils
  function formatDate (dateStr: string): string {
    if (!dateStr) return '--'
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }
  function formatProgress (value: number | string | null | undefined): number {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 0
    }
    return Math.round(Number(value))
  }
  function formatCurrency (value: string | number): string {
    const num = typeof value === 'string' ? Number.parseFloat(value) : value
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num)
  }

  // Form Handlers
  function onCourseChange (courseId: number) {
    const course = coursesStore.state.items.find(c => c.id === courseId)
    if (course) {
      coursePrice.value = Number.parseFloat(course.base_price)
      formData.value.total_cost = (coursePrice.value * selectedEmployeeIds.value.length).toFixed(2)
    }
  }

  function openCreateModal () {
    isEditing.value = false
    formData.value = { course_id: 0, specification_id: 0, start_date: '', end_date: '', status: 'planned', total_cost: '0' }
    selectedEmployeeIds.value = []
    coursePrice.value = 0
    formDialog.value = true
  }

  function openEditModal (group: GroupResponse) {
    isEditing.value = true
    formData.value = {
      id: group.id,
      course_id: group.course.id,
      specification_id: group.specification?.id || 0,
      start_date: group.start_date,
      end_date: group.end_date,
      status: group.status || 'planned',
      total_cost: calculatedCost.value.toFixed(2),
      employee_ids: selectedEmployeeIds.value,
    }
    selectedEmployeeIds.value = group.employee_ids || []
    coursePrice.value = Number.parseFloat(group.course.base_price)
    formDialog.value = true
  }

  async function saveGroup () {
    if (!formValid.value) return
    formLoading.value = true
    try {
      const payload: GroupRequest = {
        course_id: formData.value.course_id,
        specification_id: formData.value.specification_id || undefined as any,
        start_date: formData.value.start_date,
        end_date: formData.value.end_date,
        status: formData.value.status,
        total_cost: calculatedCost.value.toFixed(2),
        employee_ids: selectedEmployeeIds.value,
      }
      await (isEditing.value && formData.value.id ? groupsStore.update(formData.value.id, payload) : groupsStore.create(payload))
      formDialog.value = false
      groupsStore.fetch() // Refresh list
    } catch (error) {
      console.error('Ошибка сохранения группы:', error)
    } finally {
      formLoading.value = false
    }
  }

  // Detail Handlers
  async function openDetailModal (group: GroupResponse) {
    selectedGroup.value = group
    detailDialog.value = true

    const { state, fetch } = useGroupEmployees(group.id)
    await fetch()

    if (state.data) {
      groupEmployees.value = state.data.employees
    }
  }

  async function updateEmployeeProgress (employeeId: number, progress: number) {
    if (!selectedGroup.value) return
    try {
      const intProgress = formatProgress(progress)
      await api.patch(`/api/groups/${selectedGroup.value.id}/employee/${employeeId}/`, { progress_percent: intProgress })
      // Refresh local state
      const emp = groupEmployees.value.find(e => e.id === employeeId)
      if (emp) emp.progress_percent = intProgress
      await groupsStore.fetch()
    } catch (error) {
      console.error('Ошибка обновления прогресса:', error)
    }
  }

  async function addEmployeeToGroup () {
    if (!selectedGroup.value || !newEmployeeId.value) return
    try {
      await api.post(`/api/groups/${selectedGroup.value.id}/employee/`, { employee_ids: [newEmployeeId.value] })
      const addedId = newEmployeeId.value
      newEmployeeId.value = null
      const { state, fetch } = useGroupEmployees(selectedGroup.value.id)
      await fetch()
      if (state.data) {
        groupEmployees.value = state.data.employees
      }

      await groupsStore.fetch()
    } catch (error) {
      console.error('Ошибка добавления участника:', error)
    }
  }

  async function removeEmployeeFromGroup (employeeId: number) {
    if (!selectedGroup.value) return
    try {
      await api.delete(`/api/groups/${selectedGroup.value.id}/employee/${employeeId}/`)
      groupEmployees.value = groupEmployees.value.filter(e => e.id !== employeeId)
    } catch (error) {
      console.error('Ошибка удаления участника:', error)
    }
  }

  // Delete Handler
  function confirmDelete (group: GroupResponse) {
    groupToDelete.value = group
    deleteDialog.value = true
  }
  async function confirmDeleteAction () {
    if (!groupToDelete.value) return
    try {
      await groupsStore.remove(groupToDelete.value.id)
      deleteDialog.value = false
      groupsStore.fetch()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }

  // Init
  onMounted(() => {
    groupsStore.fetch()
    coursesStore.fetch()
    employeesStore.fetch()
    specificationsStore.fetch()
  })
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>
