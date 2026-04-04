<template>
  <v-container fluid class="pa-6">
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
            prepend-inner-icon="mdi-magnify"
            label="Поиск по курсу..."
            density="compact"
            variant="solo"
            hide-details
            style="max-width: 300px;"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" prepend-icon="mdi-plus" :loading="groupsStore.state.loading" @click="openCreateModal">
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
            :items="coursesStore.state.items"
            item-title="title"
            item-value="id"
            label="Курс"
            density="compact"
            clearable
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            label="Статус"
            density="compact"
            clearable
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-autocomplete
            v-model="filters.specification"
            :items="specificationsStore.state.items"
            item-title="number"
            item-value="id"
            label="Спецификация"
            density="compact"
            clearable
            @update:model-value="applyFilters"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Loading / Error -->
    <div v-if="groupsStore.state.loading && !groupsStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="groupsStore.state.error" type="error" variant="tonal" class="mt-4">{{ groupsStore.state.error }}</v-alert>

    <!-- Table -->
    <v-card v-else elevation="2" class="rounded-lg overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="groupsStore.state.items"
        class="elevation-0"
        hover
        hide-default-footer
        no-data-text="Группы не найдены"
      >
        <!-- Course -->
        <template v-slot:item.course="{ item }">
          <div class="font-weight-medium">{{ item.course.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.course.duration_days }} дн.</div>
        </template>

        <!-- Period -->
        <template v-slot:item.period="{ item }">
          <div>{{ formatDate(item.start_date) }}</div>
          <div class="text-caption text-medium-emphasis">– {{ formatDate(item.end_date) }}</div>
        </template>

        <!-- Participants -->
        <template v-slot:item.employees_count="{ item }">
          <v-chip size="small" variant="tonal" color="primary">{{ item.employees_count }}</v-chip>
        </template>

        <!-- Progress -->
        <template v-slot:item.average_progress="{ item }">
          <div class="d-flex align-center ga-2">
            <v-progress-linear :model-value="item.average_progress" color="info" height="6" rounded style="width: 80px;"></v-progress-linear>
            <span class="text-caption">{{ item.average_progress }}%</span>
          </div>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip size="small" :color="getStatusColor(item.status)" variant="tonal">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Cost -->
        <template v-slot:item.total_cost="{ item }">
          <div class="text-right font-weight-bold">{{ formatCurrency(item.total_cost) }}</div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" @click="openEditModal(item)" />
          <v-btn icon="mdi-eye" variant="text" color="secondary" size="small" @click="openDetailModal(item)" />
          <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(item)" />
        </template>
      </v-data-table>

      <!-- Footer: Page Size & Pagination -->
      <v-divider></v-divider>
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            v-model="groupsStore.state.pagination.pageSize"
            :items="[10, 20, 50, 100]"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 80px;"
            @update:model-value="groupsStore.changePageSize"
          ></v-select>
          <span class="text-caption text-medium-emphasis">из {{ groupsStore.state.pagination.count }}</span>
        </div>
        <v-pagination
          v-if="totalPages > 1"
          :model-value="groupsStore.state.pagination.page"
          :length="totalPages"
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
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="saveGroup">
            <!-- Course -->
            <v-autocomplete
              v-model="formData.course_id"
              :items="coursesStore.state.items"
              item-title="title"
              item-value="id"
              label="Курс обучения *"
              :rules="[v => !!v || 'Выберите курс']"
              density="compact"
              variant="outlined"
              :disabled="isEditing"
              @update:model-value="onCourseChange"
            />

            <!-- Specification -->
            <v-autocomplete
              v-model="formData.specification_id"
              :items="specificationsStore.state.items"
              item-title="number"
              item-value="id"
              label="Спецификация"
              density="compact"
              variant="outlined"
              hint="Необязательно. Группа может быть не привязана к спецификации."
            />

            <!-- Dates -->
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.start_date"
                  label="Дата начала *"
                  type="date"
                  :rules="[v => !!v || 'Укажите дату']"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.end_date"
                  label="Дата окончания *"
                  type="date"
                  :rules="[v => !!v || 'Укажите дату']"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Status -->
            <v-select
              v-model="formData.status"
              :items="statusOptions"
              label="Статус"
              density="compact"
              variant="outlined"
            />

            <!-- Employees Multi-select -->
            <v-autocomplete
              v-model="selectedEmployeeIds"
              :items="employeesStore.state.items"
              item-title="full_name"
              item-value="id"
              label="Участники группы"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hint="Выберите сотрудников из списка"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:subtitle>
                   {{ item.raw?.company?.name ?? '—' }} • {{ item.raw?.email ?? '—' }} <!-- ВОТ ТУТ ПРИКОЛ -->
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Real-time Cost Calculation -->
            <v-alert type="info" variant="tonal" class="mt-4">
              <template v-slot:title>💰 Расчет стоимости</template>
              <div class="text-body-2">
                <div>Цена за человека: <strong>{{ formatCurrency(coursePrice) }}</strong></div>
                <div>Участников: <strong>{{ selectedEmployeeIds.length }}</strong></div>
                <div class="text-h6 font-weight-bold mt-2">Итого: {{ formatCurrency(calculatedCost) }}</div>
              </div>
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
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
          <v-chip size="small" :color="getStatusColor(selectedGroup.status)" class="ml-2">
            {{ getStatusLabel(selectedGroup.status) }}
          </v-chip>
        </v-card-subtitle>

        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <!-- Summary -->
          <v-row dense class="mb-4">
            <v-col cols="6" sm="3">
              <v-sheet variant="tonal" color="primary" class="pa-3 rounded text-center">
                <div class="text-caption">Участников</div>
                <div class="text-h5 font-weight-bold">{{ selectedGroup.employees_count }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6" sm="3">
              <v-sheet variant="tonal" color="success" class="pa-3 rounded text-center">
                <div class="text-caption">Прогресс</div>
                <div class="text-h5 font-weight-bold">{{ selectedGroup.average_progress }}%</div>
              </v-sheet>
            </v-col>
            <v-col cols="6" sm="3">
              <v-sheet variant="tonal" color="warning" class="pa-3 rounded text-center">
                <div class="text-caption">Цена за чел.</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(selectedGroup.price_at_creation) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6" sm="3">
              <v-sheet variant="tonal" color="info" class="pa-3 rounded text-center">
                <div class="text-caption">Стоимость группы</div>
                <div class="text-h5 font-weight-bold">{{ formatCurrency(selectedGroup.total_cost) }}</div>
              </v-sheet>
            </v-col>
          </v-row>

          <!-- Participants Table with Progress -->
          <h3 class="text-h6 font-weight-medium mb-3">Участники и прогресс</h3>
          <v-table density="compact" class="elevation-0 border-thin rounded-lg">
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
                      :min="0" :max="100"
                      thumb-label
                      hide-details
                      style="width: 100px;"
                      @end="updateEmployeeProgress(emp.id, emp.progress_percent)"
                    />
                    <span class="text-caption font-weight-bold">{{ emp.progress_percent }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <v-btn icon="mdi-close" variant="text" color="error" size="x-small" @click="removeEmployeeFromGroup(emp.id)" />
                </td>
              </tr>
              <tr v-if="groupEmployees.length === 0">
                <td colspan="4" class="text-center text-medium-emphasis py-4">Нет участников в группе</td>
              </tr>
            </tbody>
          </v-table>

          <!-- Add Employee to Group -->
          <div class="mt-4 d-flex ga-2">
            <v-autocomplete
              v-model="newEmployeeId"
              :items="availableEmployees"
              item-title="full_name"
              item-value="id"
              label="Добавить участника"
              density="compact"
              variant="outlined"
              hide-details
              style="flex: 1;"
            />
            <v-btn color="primary" prepend-icon="mdi-plus" :disabled="!newEmployeeId" @click="addEmployeeToGroup">
              Добавить
            </v-btn>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
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
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" @click="confirmDeleteAction">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { groupsStore } from '@/stores/groupsStore'
  import { coursesStore } from '@/stores/coursesStore'
  import { employeesStore } from '@/stores/employeesStore'
  import { specificationsStore } from '@/stores/specificationsStore'
  import { useGroupEmployees } from '@/stores/groupEmployeesStore'
  import type { GroupResponse, GroupRequest, SimpleEmployeeResponse } from '@/types/api'

  // Search & Filters
  const search = ref('')
  const filters = ref({ course: null as number | null, status: null as string | null, specification: null as number | null })
  const totalPages = computed(() => Math.ceil(groupsStore.state.pagination.count / groupsStore.state.pagination.pageSize) || 1)

  const handleSearch = () => {
    groupsStore.reset()
    groupsStore.fetch({ search: search.value || undefined, ...filters.value })
  }
  const applyFilters = () => {
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
    { title: '', key: 'actions', sortable: false, width: 120, align: 'end' }
  ]

  // Status helpers
  const statusOptions = [
    { title: 'Планируется', value: 'planned' },
    { title: 'В процессе', value: 'in_progress' },
    { title: 'Завершено', value: 'completed' }
  ]
  const getStatusColor = (status?: string) => {
    const map: Record<string, string> = { planned: 'blue', in_progress: 'orange', completed: 'green' }
    return map[status || 'planned'] || 'grey'
  }
  const getStatusLabel = (status?: string) => {
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
    total_cost: '0'
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
    const assignedIds = groupEmployees.value.map(e => e.id)
    return employeesStore.state.items.filter(e => !assignedIds.includes(e.id))
  })

  // Utils
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '--'
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }
  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num)
  }

  // Form Handlers
  const onCourseChange = (courseId: number) => {
    const course = coursesStore.state.items.find(c => c.id === courseId)
    if (course) {
      coursePrice.value = parseFloat(course.base_price)
      formData.value.total_cost = (coursePrice.value * selectedEmployeeIds.value.length).toFixed(2)
    }
  }

  const openCreateModal = () => {
    isEditing.value = false
    formData.value = { course_id: 0, specification_id: 0, start_date: '', end_date: '', status: 'planned', total_cost: '0' }
    selectedEmployeeIds.value = []
    coursePrice.value = 0
    formDialog.value = true
  }

  const openEditModal = (group: GroupResponse) => {
    isEditing.value = true
    formData.value = {
      id: group.id,
      course_id: group.course.id,
      specification_id: group.specification?.id || 0,
      start_date: group.start_date,
      end_date: group.end_date,
      status: group.status || 'planned',
      total_cost: group.total_cost
    }
    // Load assigned employees (would need separate API call in real app)
    selectedEmployeeIds.value = [] // Placeholder
    coursePrice.value = parseFloat(group.course.base_price)
    formDialog.value = true
  }

  const saveGroup = async () => {
    if (!formValid.value) return
    formLoading.value = true
    try {
      const payload: GroupRequest = {
        course_id: formData.value.course_id,
        specification_id: formData.value.specification_id || undefined as any,
        start_date: formData.value.start_date,
        end_date: formData.value.end_date,
        status: formData.value.status,
        total_cost: calculatedCost.value.toFixed(2)
      }
      if (isEditing.value && formData.value.id) {
        await groupsStore.update(formData.value.id, payload)
      } else {
        await groupsStore.create(payload)
      }
      formDialog.value = false
      groupsStore.fetch() // Refresh list
    } catch (err) {
      console.error('Ошибка сохранения группы:', err)
    } finally {
      formLoading.value = false
    }
  }

  // Detail Handlers
  const openDetailModal = async (group: GroupResponse) => {
    selectedGroup.value = group
    detailDialog.value = true
    // Load employees for this group via specialized store
    const { state } = useGroupEmployees(group.id)
    // Wait for fetch and assign
    setTimeout(() => {
      if (state.data) {
        groupEmployees.value = state.data.employees
      }
    }, 100)
  }

  const updateEmployeeProgress = async (employeeId: number, progress: number) => {
    if (!selectedGroup.value) return
    try {
      await api.patch(`/api/groups/${selectedGroup.value.id}/employee/${employeeId}/`, { progress_percent: progress })
      // Refresh local state
      const emp = groupEmployees.value.find(e => e.id === employeeId)
      if (emp) emp.progress_percent = progress
    } catch (err) {
      console.error('Ошибка обновления прогресса:', err)
    }
  }

  const addEmployeeToGroup = async () => {
    if (!selectedGroup.value || !newEmployeeId.value) return
    try {
      await api.post(`/api/groups/${selectedGroup.value.id}/employee/`, { employee_ids: [newEmployeeId.value] })
      newEmployeeId.value = null
      // Refresh employees list
      const { fetch } = useGroupEmployees(selectedGroup.value.id)
      fetch()
    } catch (err) {
      console.error('Ошибка добавления участника:', err)
    }
  }

  const removeEmployeeFromGroup = async (employeeId: number) => {
    if (!selectedGroup.value) return
    try {
      await api.delete(`/api/groups/${selectedGroup.value.id}/employee/${employeeId}/`)
      groupEmployees.value = groupEmployees.value.filter(e => e.id !== employeeId)
    } catch (err) {
      console.error('Ошибка удаления участника:', err)
    }
  }

  // Delete Handler
  const confirmDelete = (group: GroupResponse) => {
    groupToDelete.value = group
    deleteDialog.value = true
  }
  const confirmDeleteAction = async () => {
    if (!groupToDelete.value) return
    try {
      await groupsStore.remove(groupToDelete.value.id)
      deleteDialog.value = false
      groupsStore.fetch()
    } catch (err) {
      console.error('Ошибка удаления:', err)
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