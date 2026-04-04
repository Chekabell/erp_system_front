<template>
  <v-container class="pa-6" fluid>
    <!-- 🔹 Header -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-semibold" style="font-size: 40px;">Сотрудники</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6" />
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
    { title: 'ФИО', key: 'full_name', width: 300 },
    { title: 'Email', key: 'email', sortable: false },
    { title: 'Компания', key: 'company', sortable: false, width: 120, align: 'center' },
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' },
  ]

  function handleSearch () {
    employeesStore.reset()
    employeesStore.fetch({ search: search.value || undefined })
  }
  function openDetail (item: EmployeeResponse) {
    selectedEmployee.value = item; dialog.value = true
  }

  onMounted(() => employeesStore.fetch())
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>
