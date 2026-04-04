<template>
  <v-card class="gantt-container" elevation="2">
    <v-card-title class="d-flex justify-space-between align-center flex-wrap">
      <span class="text-h6">📊 План обучения групп</span>
      <div class="d-flex gap-2 align-center">
        <v-btn-toggle v-model="scalePreset" density="compact" variant="outlined">
          <v-btn :value="30">Неделя</v-btn>
          <v-btn :value="12">Месяц</v-btn>
          <v-btn :value="5">Квартал</v-btn>
        </v-btn-toggle>
        <v-divider class="mx-1" inset vertical />
        <div class="d-flex gap-1">
          <v-btn v-tooltip="'Вверх'" icon="mdi-arrow-up" variant="text" @click="panVertical(-1)" />
          <v-btn v-tooltip="'Вниз'" icon="mdi-arrow-down" variant="text" @click="panVertical(1)" />
          <v-btn v-tooltip="'Влево (Shift+колёсико)'" icon="mdi-arrow-left" variant="text" @click="panHorizontal(-1)" />
          <v-btn v-tooltip="'Вправо (Shift+колёсико)'" icon="mdi-arrow-right" variant="text" @click="panHorizontal(1)" />
          <v-btn v-tooltip="'Сбросить вид'" icon="mdi-fit-to-page" variant="text" @click="resetView" />
        </div>
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

    <!-- Диалог детализации группы -->
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
  import type { SimpleGroupResponse } from '@/types/api'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

  // ---------- Типы ----------
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

  // ---------- Пропсы ----------
  const props = defineProps<{
    groups: SimpleGroupResponse[]
  }>()

  // ---------- Состояние ----------
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const wrapperRef = ref<HTMLDivElement | null>(null)

  // Масштаб (пикселей на день)
  const pixelsPerDay = ref(30)
  // Смещения: offsetX в днях, offsetY в пикселях
  const offsetX = ref(0)
  const offsetY = ref(0)

  // Пресет для кнопок
  const scalePreset = computed({
    get: () => {
      if (Math.abs(pixelsPerDay.value - 30) < 0.1) return 30
      if (Math.abs(pixelsPerDay.value - 12) < 0.1) return 12
      if (Math.abs(pixelsPerDay.value - 5) < 0.1) return 5
      return null
    },
    set: (val: number | null) => {
      if (val !== null) pixelsPerDay.value = val
    },
  })

  // Drag state
  const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0, isDragging: false })

  const detailsDialog = ref(false)
  const selectedGroup = ref<Group | null>(null)
  const showConflictSnackbar = ref(false)

  // ---------- Геометрия ----------
  const rowHeight = 50
  const leftPanelWidth = 150

  // Глобальный диапазон дат (с отступами)
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

  const canvasWidth = computed(() => totalDays.value * pixelsPerDay.value + leftPanelWidth)
  const canvasHeight = computed(() => props.groups.length * rowHeight + 60)

  // Размеры видимой области
  const viewportWidth = ref(0)
  const viewportHeight = ref(0)

  // Максимальные смещения
  const maxOffsetX = computed(() => {
    const fullWidth = canvasWidth.value
    if (fullWidth <= viewportWidth.value) return 0
    return (fullWidth - viewportWidth.value) / pixelsPerDay.value
  })

  const maxOffsetY = computed(() => {
    const fullHeight = canvasHeight.value
    if (fullHeight <= viewportHeight.value) return 0
    return fullHeight - viewportHeight.value
  })

  function clampOffsets () {
    if (offsetX.value < 0) offsetX.value = 0
    if (offsetX.value > maxOffsetX.value) offsetX.value = maxOffsetX.value
    if (offsetY.value < 0) offsetY.value = 0
    if (offsetY.value > maxOffsetY.value) offsetY.value = maxOffsetY.value
  }

  // ---------- Преобразования координат ----------
  function dateToX (date: Date): number {
    const range = globalDateRange.value
    const daysSinceMin = (date.getTime() - range.min.getTime()) / 86_400_000
    return daysSinceMin * pixelsPerDay.value - offsetX.value * pixelsPerDay.value + leftPanelWidth
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

  function groupY (index: number): number {
    return index * rowHeight + 40 - offsetY.value
  }

  // ---------- Отрисовка ----------
  function draw () {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    clampOffsets()

    canvas.width = canvasWidth.value
    canvas.height = canvasHeight.value
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawTimeScale(ctx)
    drawGrid(ctx)

    // Полосы групп
    for (const [idx, group] of props.groups.entries()) {
      const y = groupY(idx)
      const startX = groupStartX(group)
      const width = groupWidth(group)
      if (y + rowHeight < 0 || y > canvasHeight.value) continue
      if (startX + width < 0 || startX > canvasWidth.value) continue

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

    // Левая панель с названиями
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, leftPanelWidth, canvas.height)
    ctx.strokeStyle = '#ddd'
    ctx.strokeRect(0, 0, leftPanelWidth, canvas.height)
    for (const [idx, group] of props.groups.entries()) {
      const y = groupY(idx)
      if (y + rowHeight < 0 || y > canvasHeight.value) continue
      ctx.fillStyle = '#333'
      ctx.font = '13px "Segoe UI"'
      ctx.fillText(group.name, 10, y + rowHeight / 2 + 3)
    }
  }

  function drawTimeScale (ctx: CanvasRenderingContext2D) {
    const range = globalDateRange.value
    let stepDays: number
    let format: (d: Date) => string
    const ppd = pixelsPerDay.value
    if (ppd >= 25) {
      stepDays = 1
      format = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    } else if (ppd >= 10) {
      stepDays = 3
      format = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    } else if (ppd >= 4) {
      stepDays = 7
      format = (d: Date) => `Нед ${Math.ceil(d.getDate() / 7)}`
    } else {
      stepDays = 30
      format = (d: Date) => d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
    }

    let current = new Date(range.min)
    const end = range.max
    ctx.fillStyle = '#333'
    ctx.font = '11px "Segoe UI"'
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1

    while (current <= end) {
      const x = dateToX(current)
      if (x > leftPanelWidth && x < canvasWidth.value) {
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
    let stepDays: number
    const ppd = pixelsPerDay.value
    if (ppd >= 25) stepDays = 1
    else if (ppd >= 10) stepDays = 3
    else if (ppd >= 4) stepDays = 7
    else stepDays = 30

    let current = new Date(range.min)
    const end = range.max
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    while (current <= end) {
      const x = dateToX(current)
      if (x > leftPanelWidth && x < canvasWidth.value) {
        ctx.beginPath()
        ctx.moveTo(x, 40)
        ctx.lineTo(x, canvasHeight.value)
        ctx.stroke()
      }
      current = new Date(current.getTime() + stepDays * 86_400_000)
    }
  }

  // ---------- Обработка колесика (вертикаль, горизонталь, масштаб) ----------
  function handleWheel (event: WheelEvent) {
    event.preventDefault()
    if (event.ctrlKey) {
      // Масштабирование
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      let newPixels = pixelsPerDay.value * delta
      newPixels = Math.min(80, Math.max(3, newPixels))
      pixelsPerDay.value = newPixels
      clampOffsets()
    } else if (event.shiftKey) {
      // Горизонтальная прокрутка
      const deltaX = event.deltaY > 0 ? 20 : -20
      offsetX.value += deltaX / pixelsPerDay.value
      clampOffsets()
    } else {
      // Вертикальная прокрутка
      const deltaY = event.deltaY > 0 ? 20 : -20
      offsetY.value += deltaY
      clampOffsets()
    }
    draw()
  }

  // ---------- Панорамирование кнопками ----------
  function panHorizontal (direction: number) {
    offsetX.value += direction * 150 / pixelsPerDay.value
    clampOffsets()
    draw()
  }

  function panVertical (direction: number) {
    offsetY.value += direction * 150
    clampOffsets()
    draw()
  }

  function resetView () {
    offsetX.value = 0
    offsetY.value = 0
    pixelsPerDay.value = 30
    clampOffsets()
    draw()
  }

  // ---------- Drag ЛКМ (панорамирование во все стороны) ----------
  function startDrag (event: MouseEvent) {
    dragStart.value = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offsetX.value,
      offsetY: offsetY.value,
      isDragging: true,
    }
    document.body.style.userSelect = 'none'
  }

  function onDrag (event: MouseEvent) {
    if (!dragStart.value.isDragging) return
    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y
    offsetX.value = dragStart.value.offsetX - dx / pixelsPerDay.value
    offsetY.value = dragStart.value.offsetY - dy
    clampOffsets()
    draw()
  }

  function endDrag () {
    dragStart.value.isDragging = false
    document.body.style.userSelect = ''
  }

  // ---------- Конфликты в расписании ----------
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

  // ---------- Клик по полосе для детализации ----------
  function handleCanvasClick (event: MouseEvent) {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (event.clientX - rect.left) * scaleX
    const clickY = (event.clientY - rect.top) * scaleY
    const rowIndex = Math.floor((clickY - 40 + offsetY.value) / rowHeight)
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

  // ---------- Отслеживание размеров контейнера ----------
  function updateViewportSize () {
    if (wrapperRef.value) {
      viewportWidth.value = wrapperRef.value.clientWidth
      viewportHeight.value = wrapperRef.value.clientHeight
      clampOffsets()
      draw()
    }
  }

  let resizeObserver: ResizeObserver | null = null
  onMounted(() => {
    canvasRef.value?.addEventListener('click', handleCanvasClick)
    updateViewportSize()
    if (wrapperRef.value) {
      resizeObserver = new ResizeObserver(() => updateViewportSize())
      resizeObserver.observe(wrapperRef.value)
    }
    draw()
  })
  onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
  })

  watch([() => props.groups, pixelsPerDay, offsetX, offsetY], () => {
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
