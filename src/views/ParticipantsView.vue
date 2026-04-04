<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Участники обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Сотрудники компаний, проходящие обучение</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
          <v-text-field
            v-model="search"
            density="compact"
            hide-details
            label="Поиск по ФИО, email или компании..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="employeesStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="employeesStore.state.loading && !employeesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="employeesStore.state.error" class="mt-4" type="error" variant="tonal">{{ employeesStore.state.error }}</v-alert>

    <!-- Table -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        :headers="headers"
        hide-default-footer
        hover
        :items="employeesStore.state.items"
        no-data-text="Участники не найдены"
      >
        <template #item.full_name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar class="text-white text-h6" :color="getAvatarColor(item.full_name)" size="40">{{ getInitials(item.full_name) }}</v-avatar>
            <div><div class="font-weight-medium">{{ item.full_name }}</div><div class="text-caption text-medium-emphasis">{{ item.email }}</div></div>
          </div>
        </template>
        <template #item.company="{ item }">
          <v-chip color="primary" size="small" variant="tonal"><v-icon size="small" start>mdi-office-building-marker</v-icon>{{ item.company?.name || 'Не указана' }}</v-chip>
        </template>
        <template #item.groups="{ item }">
          <v-chip v-if="item.groups?.length" size="small" variant="outlined"><v-icon size="x-small" start>mdi-account-group</v-icon>{{ item.groups.length }} гр.</v-chip>
          <span v-else class="text-medium-emphasis text-caption">Не в группах</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn color="primary" icon="mdi-pencil" size="small" variant="text" />
          <v-btn
            color="secondary"
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="openDetail(item)"
          />
        </template>
      </v-data-table>

      <!-- Footer: Page Size & Pagination -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Показывать по:</span>
          <v-select
            v-model="employeesStore.state.pagination.pageSize"
            density="compact"
            hide-details
            :items="[10, 20, 50, 100]"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="employeesStore.changePageSize"
          />
          <span class="text-caption text-medium-emphasis">из {{ employeesStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="employeesStore.state.pagination.page"
          size="small"
          @update:model-value="employeesStore.goToPage"
        />
      </div>
    </v-card>

    <!-- 🔹 Modal: Просмотр участника -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card v-if="selectedEmployee">
        <v-card-title class="text-h5 font-weight-bold pt-4 d-flex align-center ga-3">
          <v-avatar class="text-white" :color="getAvatarColor(selectedEmployee.full_name)" size="48">{{ getInitials(selectedEmployee.full_name) }}</v-avatar>
          <div>{{ selectedEmployee.full_name }}<div class="text-caption font-weight-regular text-medium-emphasis">{{ selectedEmployee.email }}</div></div>
        </v-card-title>
        <v-divider class="my-2" />
        <v-card-text class="pa-4">
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-domain"><template #title>Компания</template><template #subtitle>{{ selectedEmployee.company?.name }}</template></v-list-item>
            <v-list-item prepend-icon="mdi-account-group-outline">
              <template #title>Группы</template>
              <template #subtitle>{{ selectedEmployee.groups?.map(g => g.course_title).join(', ') || 'Нет активных групп' }}</template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="dialog = false">Закрыть</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { EmployeeResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { employeesStore } from '@/stores/employeesStore'

// 🔍 Поиск и пагинация
const search = ref('')
const totalPages = computed(() => Math.ceil(employeesStore.state.pagination.count / employeesStore.state.pagination.pageSize) || 1)

  const headers = [
    { title: 'Сотрудник', key: 'full_name', width: 300 },
    { title: 'Компания', key: 'company', sortable: false },
    { title: 'Группы', key: 'groups', sortable: false, width: 120, align: 'center' },
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' },
  ]

  function handleSearch () {
    employeesStore.reset()
    employeesStore.fetch({ search: search.value || undefined })
  }
  function openDetail (item: EmployeeResponse) {
    selectedEmployee.value = item; dialog.value = true
  }
  const getInitials = (n: string) => n ? (n.split(/\s+/)[0]?.[0] || '') + (n.split(/\s+/)[1]?.[0] || '') : '?'
  const getAvatarColor = (n: string) => ['primary', 'success', 'warning', 'error', 'info', 'purple', 'teal', 'indigo'][Math.abs(n.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 8]

  onMounted(() => employeesStore.fetch())
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>
