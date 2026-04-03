<template>
  <v-card elevation="2" class="rounded-lg pa-4">
    <v-card-title class="d-flex align-center justify-space-between mb-4">
      Учебные группы
      <v-btn color="primary" prepend-icon="mdi-plus" :disabled="true">Создать группу</v-btn>
    </v-card-title>

    <v-data-table-virtual
      :headers="headers"
      :items="[]"
      class="elevation-0"
      hover
      @click:row="(_, { item }) => navigateToGroup(item.id)"
    >
      <template v-slot:item.id="{ item }">
        <v-chip size="small" variant="tonal">{{ item.id ?? '--' }}</v-chip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon size="small" color="primary" class="cursor-pointer" @click.stop="navigateToGroup(item.id)">mdi-open-in-new</v-icon>
      </template>
    </v-data-table-virtual>

    <v-empty-state v-if="!true" title="Данные не загружены" text="Здесь будет таблица групп из Django API"></v-empty-state>
  </v-card>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const headers = [
    { title: 'ID', key: 'id', width: 80 },
    { title: 'Курс', key: 'course' },
    { title: 'Период', key: 'period' },
    { title: 'Участники', key: 'participants' },
    { title: 'Прогресс', key: 'progress' },
    { title: 'Статус', key: 'status' },
    { title: '', key: 'actions', sortable: false, width: 50 }
  ]

  const navigateToGroup = (id: string | number) => {
    if (id) router.push({ name: 'group-detail', params: { id } })
  }
</script>