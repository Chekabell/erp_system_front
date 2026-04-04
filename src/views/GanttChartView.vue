<script setup>
  import GanttChart from '@/components/GanttChart.vue'
  import { ganttChartStore } from '@/stores/ganttChartStore'

  onMounted(() => ganttChartStore.fetch())
</script>

<template>
  <GanttChart :groups="ganttChartStore.items" />
</template>
