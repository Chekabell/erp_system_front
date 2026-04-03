<script lang="ts" setup>
  import GanttChart from '@/components/GanttChart.vue'

  const trainingGroups = [
    {
      id: 1,
      name: 'HR-аналитика',
      startDate: new Date(2026, 3, 10),
      endDate: new Date(2026, 5, 20),
      progress: 65,
      members: [{ id: 101, name: 'Анна Иванова' }, { id: 102, name: 'Ольга Петрова' }],
    },
    {
      id: 2,
      name: 'Бухгалтерский учёт',
      startDate: new Date(2026, 4, 1),
      endDate: new Date(2026, 6, 15),
      progress: 30,
      members: [{ id: 103, name: 'Сергей Смирнов' }],
    },
    {
      id: 3,
      name: 'Бухгалтерский учёт',
      startDate: new Date(2026, 4, 1),
      endDate: new Date(2026, 5, 1),
      progress: 20,
      members: [{ id: 104, name: 'Сергей Смирнов' }],
    },
    {
      id: 4,
      name: 'Бухгалтерский учёт',
      startDate: new Date(2026, 4, 1),
      endDate: new Date(2026, 4, 15),
      progress: 90,
      members: [{ id: 105, name: 'Сергей Смирнов' }],
    },
  ]
</script>

<template>
  <GanttChart :groups="trainingGroups" />
</template>
