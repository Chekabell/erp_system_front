<template>
  <v-card class="gantt-container" elevation="2">
    <v-card-title class="d-flex justify-space-between align-center flex-wrap">
      <span class="text-h6">📊 План обучения групп</span>
      <div class="d-flex gap-2 align-center">
        <v-btn v-tooltip="'Отдалить (Ctrl+колёсико мыши)'" icon="mdi-minus" variant="text" @click="zoomOut" />
        <v-btn v-tooltip="'Приблизить (Ctrl+колёсико мыши)'" icon="mdi-plus" variant="text" @click="zoomIn" />
        <v-divider class="mx-1" inset vertical />
        <v-btn v-tooltip="'Прокрутить влево'" icon="mdi-arrow-left" variant="text" @click="pan(-0.3)" />
        <v-btn v-tooltip="'Прокрутить вправо'" icon="mdi-arrow-right" variant="text" @click="pan(0.3)" />
        <v-btn v-tooltip="'Сбросить вид'" icon="mdi-fit-to-page" variant="text" @click="resetView" />
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <div
        ref="wrapperRef"
        class="gantt-wrapper"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @wheel="handleWheel"
      >
        <canvas ref="canvasRef" class="gantt-canvas" :height="canvasHeight" :width="canvasWidth" />
      </div>
    </v-card-text>

    <!-- Диалог детализации -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card v-if="selectedGroup">
        <v-card-title>{{ selectedGroup.name }}</v-card-title>
        <v-card-text>
          <p><strong>📅 Даты:</strong> {{ formatDate(selectedGroup.startDate) }} – {{ formatDate(selectedGroup.endDate) }}</p>
          <p><strong>📈 Прогресс курса:</strong> {{ selectedGroup.progress }}%</p>
          <v-divider class="my-2" />
          <p><strong>👥 Состав группы ({{ selectedGroup.members?.length || 0 }} чел.):</strong></p>
          <v-chip v-for="member in selectedGroup.members" :key="member.id" class="ma-1" size="small">
            {{ member.name }}
          </v-chip>
          <v-alert v-if="groupConflicts[selectedGroup.id]" class="mt-3" density="compact" type="warning">
            ⚠️ Конфликт: у сотрудников пересекаются занятия с другими группами
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="detailsDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Уведомления о конфликтах -->
    <v-snackbar
      v-model="showConflictSnackbar"
      color="warning"
      location="top"
      :multi-line="true"
      timeout="5000"
    >
      ⚠️ Обнаружены конфликты в расписании сотрудников. Нажмите на группу для подробностей.
      <template #actions>
        <v-btn color="white" variant="text" @click="showConflictSnackbar = false">Закрыть</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

  interface Employee {
    id: number
    name: string
  }

  interface Group {
    id: number
    name: string
    startDate: Date
    endDate: Date
    progress: number
    members: Employee[]
  }

  const props = defineProps<{
    groups: Group[]
  }>()

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const wrapperRef = ref<HTMLDivElement | null>(null)

  // Текущий масштаб (пикселей на день)
  const pixelsPerDay = ref(30) // стартовый zoom
  const offset = ref(0) // смещение в днях

  // Drag state
  const dragStart = ref({ x: 0, offset: 0, isDragging: false })

  const detailsDialog = ref(false)
  const selectedGroup = ref<Group | null>(null)
  const showConflictSnackbar = ref(false)

  // ---------- Вспомогательные функции ограничения прокрутки ----------
  function clampOffset () {
    if (!wrapperRef.value) return
    const wrapper = wrapperRef.value
    const viewportWidth = wrapper.clientWidth
    const fullWidth = canvasWidth.value
    if (fullWidth <= viewportWidth) {
      offset.value = 0
      return
    }
    const maxOffsetDays = (fullWidth - viewportWidth) / pixelsPerDay.value
    if (offset.value < 0) offset.value = 0
    if (offset.value > maxOffsetDays) offset.value = maxOffsetDays
  }

  // ---------- Динамическая шкала времени ----------
  const timeScaleConfig = computed(() => {
    const ppd = pixelsPerDay.value
    if (ppd >= 25) {
      return { stepDays: 1, format: (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) }
    } else if (ppd >= 10) {
      return { stepDays: 3, format: (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) }
    } else if (ppd >= 4) {
      return { stepDays: 7, format: (d: Date) => `Нед ${Math.ceil(d.getDate() / 7)}` }
    } else {
      return { stepDays: 30, format: (d: Date) => d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }) }
    }
  })

  // Глобальный диапазон дат
  const globalDateRange = computed(() => {
    if (props.groups.length === 0) return { min: new Date(), max: new Date() }
    let minDate = new Date(props.groups[0].startDate)
    let maxDate = new Date(props.groups[0].endDate)
    for (const g of props.groups) {
      if (g.startDate < minDate) minDate = g.startDate
      if (g.endDate > maxDate) maxDate = g.endDate
    }
    const paddingDays = 5
    return {
      min: new Date(minDate.getTime() - paddingDays * 86_400_000),
      max: new Date(maxDate.getTime() + paddingDays * 86_400_000),
    }
  })

  const totalDays = computed(() => {
    const range = globalDateRange.value
    return Math.ceil((range.max.getTime() - range.min.getTime()) / 86_400_000)
  })

  const rowHeight = 50
  const canvasWidth = computed(() => totalDays.value * pixelsPerDay.value + 200)
  const canvasHeight = computed(() => props.groups.length * rowHeight + 60)

  function dateToX (date: Date): number {
    const range = globalDateRange.value
    const daysSinceMin = (date.getTime() - range.min.getTime()) / 86_400_000
    return daysSinceMin * pixelsPerDay.value - offset.value * pixelsPerDay.value + 150
  }

  function groupStartX (group: Group) {
    return dateToX(group.startDate)
  }
  function groupEndX (group: Group) {
    return dateToX(group.endDate)
  }
  function groupWidth (group: Group) {
    return groupEndX(group) - groupStartX(group)
  }
  function progressWidth (group: Group) {
    const totalDuration = group.endDate.getTime() - group.startDate.getTime()
    const elapsed = (group.progress / 100) * totalDuration
    const elapsedDays = elapsed / 86_400_000
    return elapsedDays * pixelsPerDay.value
  }

  // ---------- Отрисовка ----------
  function draw () {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Применяем ограничение перед отрисовкой
    clampOffset()

    canvas.width = canvasWidth.value
    canvas.height = canvasHeight.value
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawTimeScale(ctx)
    drawGrid(ctx)

    for (const [idx, group] of props.groups.entries()) {
      const y = idx * rowHeight + 40
      const startX = groupStartX(group)
      const width = groupWidth(group)
      if (startX + width < 0 || startX > canvas.width) continue

      ctx.fillStyle = '#e3f2fd'
      ctx.fillRect(startX, y + 5, width, rowHeight - 10)
      ctx.strokeStyle = '#1e88e5'
      ctx.strokeRect(startX, y + 5, width, rowHeight - 10)

      const progWidth = progressWidth(group)
      if (progWidth > 0) {
        ctx.fillStyle = '#4caf50'
        ctx.fillRect(startX, y + 5, Math.min(progWidth, width), rowHeight - 10)
      }

      ctx.font = '12px "Segoe UI"'
      ctx.fillStyle = '#0d47a1'
      const text = group.name
      const textWidth = ctx.measureText(text).width
      if (textWidth < width - 10) {
        ctx.fillText(text, startX + 5, y + rowHeight / 2 + 3)
      } else {
        ctx.fillText(text, startX + width + 5, y + rowHeight / 2 + 3)
      }

      ctx.fillStyle = '#333'
      ctx.font = '10px "Segoe UI"'
      ctx.fillText(`${group.progress}%`, startX + width - 25, y + rowHeight / 2 + 3)

      if (groupConflicts.value[group.id]) {
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.fillStyle = '#ff9800'
        ctx.fillRect(startX, y + 5, width, rowHeight - 10)
        ctx.restore()
      }
    }

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, 150, canvas.height)
    ctx.strokeStyle = '#ddd'
    ctx.strokeRect(0, 0, 150, canvas.height)
    for (const [idx, group] of props.groups.entries()) {
      const y = idx * rowHeight + 40
      ctx.fillStyle = '#333'
      ctx.font = '13px "Segoe UI"'
      ctx.fillText(group.name, 10, y + rowHeight / 2 + 3)
    }
  }

  function drawTimeScale (ctx: CanvasRenderingContext2D) {
    const range = globalDateRange.value
    const { stepDays, format } = timeScaleConfig.value
    let current = new Date(range.min)
    const end = range.max

    ctx.fillStyle = '#333'
    ctx.font = '11px "Segoe UI"'
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1

    while (current <= end) {
      const x = dateToX(current)
      if (x > 0 && x < canvasWidth.value) {
        ctx.beginPath()
        ctx.moveTo(x, 30)
        ctx.lineTo(x, 40)
        ctx.stroke()
        ctx.fillText(format(current), x + 2, 25)
      }
      current = new Date(current.getTime() + stepDays * 86_400_000)
    }
  }

  function drawGrid (ctx: CanvasRenderingContext2D) {
    const range = globalDateRange.value
    const { stepDays } = timeScaleConfig.value
    let current = new Date(range.min)
    const end = range.max
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    while (current <= end) {
      const x = dateToX(current)
      if (x > 0 && x < canvasWidth.value) {
        ctx.beginPath()
        ctx.moveTo(x, 40)
        ctx.lineTo(x, canvasHeight.value)
        ctx.stroke()
      }
      current = new Date(current.getTime() + stepDays * 86_400_000)
    }
  }

  // ---------- Масштабирование кнопками и колесом ----------
  function zoomIn () {
    let newPixels = pixelsPerDay.value * 1.2
    if (newPixels > 80) newPixels = 80
    pixelsPerDay.value = newPixels
    clampOffset()
    draw()
  }

  function zoomOut () {
    let newPixels = pixelsPerDay.value / 1.2
    if (newPixels < 3) newPixels = 3
    pixelsPerDay.value = newPixels
    clampOffset()
    draw()
  }

  function handleWheel (event: WheelEvent) {
    event.preventDefault()
    if (event.ctrlKey) {
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      let newPixels = pixelsPerDay.value * delta
      newPixels = Math.min(80, Math.max(3, newPixels))
      pixelsPerDay.value = newPixels
    } else {
      const panDelta = event.deltaY > 0 ? 20 : -20
      offset.value += panDelta / pixelsPerDay.value
    }
    clampOffset()
    draw()
  }

  function pan (direction: number) {
    offset.value += direction * 200 / pixelsPerDay.value
    clampOffset()
    draw()
  }

  function resetView () {
    offset.value = 0
    pixelsPerDay.value = 30
    clampOffset()
    draw()
  }

  // ---------- Drag ----------
  function startDrag (event: MouseEvent) {
    dragStart.value = { x: event.clientX, offset: offset.value, isDragging: true }
    document.body.style.userSelect = 'none'
  }

  function onDrag (event: MouseEvent) {
    if (!dragStart.value.isDragging) return
    const dx = event.clientX - dragStart.value.x
    const deltaOffset = -dx / pixelsPerDay.value
    offset.value = dragStart.value.offset + deltaOffset
    clampOffset()
    draw()
  }

  function endDrag () {
    dragStart.value.isDragging = false
    document.body.style.userSelect = ''
  }

  // ---------- Конфликты ----------
  const groupConflicts = computed(() => {
    const conflictsMap: Record<number, boolean> = {}
    if (props.groups.length === 0) return conflictsMap
    const employeeGroups = new Map<number, Array<{ groupId: number, start: Date, end: Date }>>()
    for (const group of props.groups) {
      for (const emp of group.members) {
        if (!employeeGroups.has(emp.id)) employeeGroups.set(emp.id, [])
        employeeGroups.get(emp.id)!.push({ groupId: group.id, start: group.startDate, end: group.endDate })
      }
    }
    for (const intervals of employeeGroups.values()) {
      for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
          const a = intervals[i], b = intervals[j]
          if (a.start < b.end && b.start < a.end) {
            conflictsMap[a.groupId] = true
            conflictsMap[b.groupId] = true
          }
        }
      }
    }
    if (Object.keys(conflictsMap).length > 0 && !showConflictSnackbar.value) {
      showConflictSnackbar.value = true
    }
    return conflictsMap
  })

  // ---------- Клик по полосе ----------
  function handleCanvasClick (event: MouseEvent) {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const clickX = (event.clientX - rect.left) * scaleX
    const clickY = (event.clientY - rect.top) * scaleX
    const rowIndex = Math.floor((clickY - 40) / rowHeight)
    if (rowIndex >= 0 && rowIndex < props.groups.length) {
      const group = props.groups[rowIndex]
      const startX = groupStartX(group)
      const endX = groupEndX(group)
      if (clickX >= startX && clickX <= endX) {
        selectedGroup.value = group
        detailsDialog.value = true
      }
    }
  }

  // ---------- Resize observer для пересчёта ограничений ----------
  let resizeObserver: ResizeObserver | null = null
  onMounted(() => {
    canvasRef.value?.addEventListener('click', handleCanvasClick)
    draw()
    if (wrapperRef.value) {
      resizeObserver = new ResizeObserver(() => {
        clampOffset()
        draw()
      })
      resizeObserver.observe(wrapperRef.value)
    }
  })
  onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
  })

  watch([() => props.groups, pixelsPerDay, offset], () => {
    nextTick(() => draw())
  })

  function formatDate (date: Date): string {
    return date.toLocaleDateString('ru-RU')
  }
</script>

<style scoped>
.gantt-container {
  overflow: hidden;
  border-radius: 12px;
}
.gantt-wrapper {
  width: 100%;
  height: 70vh;
  overflow: hidden;
  cursor: grab;
  background: #fafafa;
  position: relative;
}
.gantt-canvas {
  display: block;
  cursor: pointer;
}
.gantt-wrapper:active {
  cursor: grabbing;
}
</style>
