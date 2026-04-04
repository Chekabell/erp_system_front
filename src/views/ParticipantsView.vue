<template>
  <v-container fluid class="pa-6">
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <h1 class="text-h4 font-weight-bold">Участники обучения</h1>
        <div class="d-flex ga-3" style="max-width: 500px; flex: 1;">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Поиск по ФИО, email или компании..." density="compact" variant="solo" hide-details @keyup.enter="handleSearch" />
          <v-btn color="primary" :loading="employeesStore.state.loading" @click="handleSearch">Найти</v-btn>
        </div>
      </div>
    </v-card>

    <div v-if="employeesStore.state.loading && !employeesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="employeesStore.state.error" type="error" variant="tonal" class="mt-4">{{ employeesStore.state.error }}</v-alert>

    <v-card v-else elevation="2" class="rounded-lg overflow-hidden">
      <v-data-table :headers="headers" :items="employeesStore.state.items" class="elevation-0" hover no-data-text="Участники не найдены">
        <template v-slot:item.full_name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar :color="getAvatarColor(item.full_name)" size="40" class="text-white text-h6">{{ getInitials(item.full_name) }}</v-avatar>
            <div><div class="font-weight-medium">{{ item.full_name }}</div><div class="text-caption text-medium-emphasis">{{ item.email }}</div></div>
          </div>
        </template>
        <template v-slot:item.company="{ item }">
          <v-chip size="small" variant="tonal" color="primary"><v-icon start size="small">mdi-office-building-marker</v-icon>{{ item.company?.name || 'Не указана' }}</v-chip>
        </template>
        <template v-slot:item.groups="{ item }">
          <v-chip v-if="item.groups?.length" size="small" variant="outlined"><v-icon start size="x-small">mdi-account-group</v-icon>{{ item.groups.length }} гр.</v-chip>
          <span v-else class="text-medium-emphasis text-caption">Не в группах</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" />
          <v-btn icon="mdi-eye" variant="text" color="secondary" size="small" @click="openDetail(item)" />
        </template>
      </v-data-table>
    </v-card>

    <div class="d-flex justify-center mt-6" v-if="employeesStore.state.pagination.count > employeesStore.state.pagination.pageSize">
      <v-pagination :model-value="employeesStore.state.pagination.page" :length="Math.ceil(employeesStore.state.pagination.count / employeesStore.state.pagination.pageSize)" @update:model-value="employeesStore.goToPage" />
    </div>

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
  </v-container>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { employeesStore } from '@/stores/employeesStore'
  import type { Employee } from '@/types/api'

  const search = ref('')
  const dialog = ref(false)
  const selectedEmployee = ref<Employee | null>(null)
  const headers = [
    { title: 'Сотрудник', key: 'full_name', width: 300 },
    { title: 'Компания', key: 'company', sortable: false },
    { title: 'Группы', key: 'groups', sortable: false, width: 120, align: 'center' },
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' }
  ]

  const handleSearch = () => {
    employeesStore.reset()
    employeesStore.fetch({ search: search.value || undefined })
  }
  const openDetail = (item: Employee) => { selectedEmployee.value = item; dialog.value = true }
  const getInitials = (n: string) => n ? (n.split(/\s+/)[0]?.[0]||'') + (n.split(/\s+/)[1]?.[0]||'') : '?'
  const getAvatarColor = (n: string) => ['primary','success','warning','error','info','purple','teal','indigo'][Math.abs(n.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % 8]

  onMounted(() => employeesStore.fetch())
</script>