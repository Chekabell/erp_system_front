<template>
  <v-container fluid class="pa-6">
    <!-- 🔹 Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Участники обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Сотрудники компаний, проходящие обучение</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Поиск по ФИО, email или компании..."
            density="compact"
            variant="solo"
            hide-details
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="employeesStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="employeesStore.state.loading && !employeesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="employeesStore.state.error" type="error" variant="tonal" class="mt-4">
      {{ employeesStore.state.error }}
      <v-btn variant="text" color="error" @click="employeesStore.fetch({}, true)" class="ml-2">Повторить</v-btn>
    </v-alert>

    <!-- 🔹 Table -->
    <v-card v-else elevation="2" class="rounded-lg overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="employeesStore.state.items"
        class="elevation-0"
        hover
        no-data-text="Участники не найдены"
        hide-default-footer
      >
        <!-- ФИО + Аватар -->
        <template v-slot:item.full_name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar :color="getAvatarColor(item.full_name)" size="40" class="text-white text-h6">{{ getInitials(item.full_name) }}</v-avatar>
            <div><div class="font-weight-medium">{{ item.full_name }}</div><div class="text-caption text-medium-emphasis">{{ item.email }}</div></div>
          </div>
        </template>

        <!-- Компания -->
        <template v-slot:item.company="{ item }">
          <v-chip size="small" variant="tonal" color="primary"><v-icon start size="small">mdi-office-building-marker</v-icon>{{ item.company?.name || 'Не указана' }}</v-chip>
        </template>

        <!-- Группы -->
        <template v-slot:item.groups="{ item }">
          <v-chip v-if="item.groups?.length" size="small" variant="outlined"><v-icon start size="x-small">mdi-account-group</v-icon>{{ item.groups.length }} гр.</v-chip>
          <span v-else class="text-medium-emphasis text-caption">Не в группах</span>
        </template>

        <!-- Действия -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" disabled title="Редактирование будет доступно в следующей версии" />
          <v-btn icon="mdi-eye" variant="text" color="secondary" size="small" @click="openDetail(item)" />
          <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click.stop="openDeleteDialog(item)" title="Удалить участника" />
        </template>
      </v-data-table>

      <!-- Footer: Page Size & Pagination -->
      <v-divider></v-divider>
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            v-model="employeesStore.state.pagination.pageSize"
            :items="[10, 20, 50, 100]"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 80px;"
            @update:model-value="employeesStore.changePageSize"
          ></v-select>
          <span class="text-caption text-medium-emphasis">из {{ employeesStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :model-value="employeesStore.state.pagination.page"
          :length="totalPages"
          size="small"
          @update:model-value="employeesStore.goToPage"
        />
      </div>
    </v-card>

    <!-- 🔹 Modal: Просмотр участника -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card v-if="selectedEmployee">
        <v-card-title class="text-h5 font-weight-bold pt-4 d-flex align-center ga-3">
          <v-avatar :color="getAvatarColor(selectedEmployee.full_name)" size="48" class="text-white">{{ getInitials(selectedEmployee.full_name) }}</v-avatar>
          <div>{{ selectedEmployee.full_name }}<div class="text-caption font-weight-regular text-medium-emphasis">{{ selectedEmployee.email }}</div></div>
        </v-card-title>
        <v-divider class="my-2"></v-divider>
        <v-card-text class="pa-4">
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-domain"><template v-slot:title>Компания</template><template v-slot:subtitle>{{ selectedEmployee.company?.name }}</template></v-list-item>
            <v-list-item prepend-icon="mdi-account-group-outline">
              <template v-slot:title>Группы</template>
              <template v-slot:subtitle>{{ selectedEmployee.groups?.map(g => g.course_title).join(', ') || 'Нет активных групп' }}</template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="dialog = false">Закрыть</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Создание участника -->
    <v-dialog v-model="createDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новый участник обучения</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания записи</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.full_name"
              label="ФИО участника *"
              :rules="[
                v => !!v?.trim() || 'ФИО обязательно',
                v => (v?.length <= 255) || 'Максимум 255 символов'
              ]"
              density="compact"
              variant="outlined"
              class="mb-3"
              counter="255"
              placeholder="Иванов Иван Иванович"
            />
            <v-text-field
              v-model="form.email"
              label="Email *"
              type="email"
              :rules="[
                v => !!v?.trim() || 'Email обязателен',
                v => /.+@.+\..+/.test(v) || 'Некорректный формат email'
              ]"
              density="compact"
              variant="outlined"
              class="mb-3"
              placeholder="user@company.ru"
            />
            <v-autocomplete
              v-model="form.company_id"
              :items="companiesStore.state.items"
              item-title="name"
              item-value="id"
              label="Компания *"
              :rules="[v => !!v || 'Выберите компанию']"
              density="compact"
              variant="outlined"
              prepend-inner-icon="mdi-office-building-marker"
            />
            <v-alert type="info" variant="tonal" density="compact" class="mt-2">
              <template v-slot:title>💡 Подсказка</template>
              <span class="text-caption">Если сотрудник уже существует (совпадение ФИО + Компания), система покажет предупреждение.</span>
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
        <v-card-title class="text-h6 font-weight-bold pt-4 text-error">Удалить участника?</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Это действие необратимо</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить участника
            <strong class="text-primary">"{{ employeeToDelete?.full_name }}"</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все связи с учебными группами будут удалены. Прогресс обучения будет потерян.
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
import { employeesStore } from '@/stores/employeesStore'
import { companiesStore } from '@/stores/companiesStore'
import type { EmployeeResponse, EmployeeRequest } from '@/types/api'

// 🔍 Поиск и пагинация
const search = ref('')
const totalPages = computed(() => Math.ceil(employeesStore.state.pagination.count / employeesStore.state.pagination.pageSize) || 1)

const headers = [
  { title: 'Сотрудник', key: 'full_name', width: 300 },
  { title: 'Компания', key: 'company', sortable: false },
  { title: 'Группы', key: 'groups', sortable: false, width: 120, align: 'center' },
  { title: '', key: 'actions', sortable: false, width: 120, align: 'end' }
]

const handleSearch = () => {
  employeesStore.reset()
  employeesStore.fetch({ search: search.value || undefined })
}

// 📖 Просмотр участника
const dialog = ref(false)
const selectedEmployee = ref<EmployeeResponse | null>(null)

const openDetail = (item: EmployeeResponse) => {
  selectedEmployee.value = item
  dialog.value = true
}

// ➕ Создание участника
const createDialog = ref(false)
const formValid = ref(false)
const createLoading = ref(false)
const form = ref<EmployeeRequest>({
  full_name: '',
  company_id: 0,
  email: '',
  assign_to_groups: []
})

const openCreateDialog = () => {
  form.value = { full_name: '', company_id: 0, email: '', assign_to_groups: [] }
  formValid.value = false
  createDialog.value = true
}

const submitCreate = async () => {
  if (!formValid.value) return
  createLoading.value = true
  try {
    const payload: EmployeeRequest = {
      ...form.value,
      assign_to_groups: [] // Пока не поддерживаем привязку к группам при создании
    }
    await employeesStore.create(payload)
    createDialog.value = false
    employeesStore.fetch() // Обновляем список и пагинацию
  } catch (err: any) {
    // Обработка ошибки уникальности (бонусный функционал ТЗ п.3.1)
    if (err.response?.status === 400 && err.response?.data?.non_field_errors) {
      alert('⚠️ Сотрудник с таким ФИО уже существует в этой компании!')
    } else {
      console.error('Ошибка создания участника:', err)
      alert('Не удалось создать участника. Проверьте данные.')
    }
  } finally {
    createLoading.value = false
  }
}

// 🗑 Удаление участника
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const employeeToDelete = ref<EmployeeResponse | null>(null)

const openDeleteDialog = (employee: EmployeeResponse) => {
  employeeToDelete.value = employee
  deleteDialog.value = true
}

const submitDelete = async () => {
  if (!employeeToDelete.value) return
  deleteLoading.value = true
  try {
    await employeesStore.remove(employeeToDelete.value.id)
    deleteDialog.value = false
    employeesStore.fetch() // Обновляем список и пагинацию
  } catch (err) {
    console.error('Ошибка удаления участника:', err)
    alert('Не удалось удалить участника.')
  } finally {
    deleteLoading.value = false
  }
}

// 🛠 Утилиты
const getInitials = (n: string): string => {
  if (!n) return '?'
  const parts = n.trim().split(/\s+/)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

const getAvatarColor = (n: string): string => {
  const colors = ['primary','success','warning','error','info','purple','teal','indigo']
  let hash = 0
  for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

onMounted(() => {
  employeesStore.fetch()
  if (!companiesStore.state.isFetched) companiesStore.fetch() // Загружаем список компаний для селекта
})
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>