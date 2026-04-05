<template>
  <v-card class="gantt-container w-100" elevation="2">
    <v-card-title class="d-flex justify-space-between align-center flex-wrap">
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

    <!-- ДИАЛОГ ДЕТАЛЕЙ ГРУППЫ (с конфликтными участниками) -->
    <v-dialog v-model="detailsDialog" max-width="700">
      <v-card v-if="selectedGroup">
        <v-card-title>{{ selectedGroup.course_title }}</v-card-title>
        <v-card-text>
          <p><strong>📅 Даты:</strong> {{ formatDate(selectedGroup.start_date) }} – {{ formatDate(selectedGroup.end_date) }}</p>
          <p><strong>📈 Прогресс курса:</strong> {{ Math.round(selectedGroup.average_progress) }}%</p>

          <!-- Предупреждение, если есть конфликтные сотрудники -->
          <v-alert
            v-if="employeeConflictsByGroup.get(selectedGroup.id)?.size"
            class="mt-2"
            density="compact"
            type="warning"
            variant="tonal"
          >
            ⚠️ В группе есть {{ employeeConflictsByGroup.get(selectedGroup.id)?.size }} конфликтных участников.
            У этих сотрудников занятия пересекаются с другими группами.
          </v-alert>

          <v-divider class="my-3" />

          <p><strong>👥 Состав группы ({{ selectedGroup.members?.length || 0 }} чел.):</strong></p>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="member in selectedGroup.members"
              :key="member.id"
              :color="isEmployeeConflicting(member.id, selectedGroup.id) ? 'warning' : 'default'"
              size="small"
            >
              {{ member.full_name }}
              <v-icon
                v-if="isEmployeeConflicting(member.id, selectedGroup.id)"
                color="orange-darken-2"
                end
                icon="mdi-alert"
                size="small"
              />
              <v-tooltip
                v-if="isEmployeeConflicting(member.id, selectedGroup.id)"
                activator="parent"
                location="top"
              >
                Сотрудник занят в другой группе в этот же период
              </v-tooltip>
            </v-chip>
            <span v-if="!selectedGroup.members?.length" class="text-caption text-grey">Нет участников</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailsDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

  const props = defineProps<{ groups: SimpleGroupResponse[] }>()

  // ---------- Реактивное состояние ----------
  const canvasRef = ref<HTMLCanvasElement | null>(null) // Ссылка на canvas
  const wrapperRef = ref<HTMLDivElement | null>(null) // Контейнер-обёртка для размеров

  const pixelsPerDay = ref(30) // Масштаб: сколько пикселей приходится на один день
  const offsetX = ref(0) // Горизонтальное смещение (в днях)
  const offsetY = ref(0) // Вертикальное смещение (в пикселях)

  // Привязка к предустановкам кнопок (синхронизация с pixelsPerDay)
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

  // Состояние для перетаскивания (панорамирования)
  const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0, isDragging: false, moved: false })

  // Управление диалогом детализации
  const detailsDialog = ref(false)
  const selectedGroup = ref<SimpleGroupResponse | null>(null)
  const showConflictSnackbar = ref(false)

  // ---------- Геометрические константы ----------
  const rowHeight = 50 // Высота строки для одной группы
  const leftPanelWidth = 150 // Ширина левой панели с названиями

  // Приводим даты к объектам Date для удобства
  const normalizedGroups = computed(() =>
    props.groups.map(g => ({
      ...g,
      start_date: new Date(g.start_date),
      end_date: new Date(g.end_date),
    })),
  )

  // Глобальный диапазон дат (минимальный start – максимальный end с отступами)
  const globalDateRange = computed(() => {
    const groups = normalizedGroups.value
    if (groups.length === 0) return { min: new Date(), max: new Date() }
    let minDate = groups[0].start_date
    let maxDate = groups[0].end_date
    for (const g of groups) {
      if (g.start_date < minDate) minDate = g.start_date
      if (g.end_date > maxDate) maxDate = g.end_date
    }
    const paddingDays = 5
    return {
      min: new Date(minDate.getTime() - paddingDays * 86_400_000),
      max: new Date(maxDate.getTime() + paddingDays * 86_400_000),
    }
  })

  const employeeConflictsByGroup = computed(() => {
    const conflictsMap = new Map<number, Set<number>>()
    const groups = normalizedGroups.value
    const employeeGroups = new Map<number, Array<{ groupId: number, start: Date, end: Date }>>()
    for (const group of groups) {
      if (group.members) {
        for (const emp of group.members) {
          if (!employeeGroups.has(emp.id)) employeeGroups.set(emp.id, [])
          employeeGroups.get(emp.id)!.push({
            groupId: group.id,
            start: group.start_date,
            end: group.end_date,
          })
        }
      }
    }
    for (const [employeeId, intervals] of employeeGroups.entries()) {
      for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
          const a = intervals[i], b = intervals[j]
          if (a.start < b.end && b.start < a.end) {
            if (!conflictsMap.has(a.groupId)) conflictsMap.set(a.groupId, new Set())
            if (!conflictsMap.has(b.groupId)) conflictsMap.set(b.groupId, new Set())
            conflictsMap.get(a.groupId)!.add(employeeId)
            conflictsMap.get(b.groupId)!.add(employeeId)
          }
        }
      }
    }
    return conflictsMap
  })

  function isEmployeeConflicting (employeeId: number, groupId: number): boolean {
    return employeeConflictsByGroup.value.get(groupId)?.has(employeeId) ?? false
  }

  // Общее количество дней в диапазоне (для расчёта ширины canvas)
  const totalDays = computed(() => {
    const range = globalDateRange.value
    return Math.ceil((range.max.getTime() - range.min.getTime()) / 86_400_000)
  })

  // Размеры canvas (полная ширина = дни * масштаб + левая панель)
  const canvasWidth = computed(() => totalDays.value * pixelsPerDay.value + leftPanelWidth)
  const canvasHeight = computed(() => normalizedGroups.value.length * rowHeight + 60)

  // Размеры видимой области (обновляются через ResizeObserver)
  const viewportWidth = ref(0)
  const viewportHeight = ref(0)

  // Максимальные смещения, чтобы нельзя было уйти за пределы
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

  // Ограничивает смещения допустимыми пределами
  function clampOffsets () {
    if (offsetX.value < 0) offsetX.value = 0
    if (offsetX.value > maxOffsetX.value) offsetX.value = maxOffsetX.value
    if (offsetY.value < 0) offsetY.value = 0
    if (offsetY.value > maxOffsetY.value) offsetY.value = maxOffsetY.value
  }

  // ---------- Преобразования координат ----------
  // Переводит дату в X-координату на canvas (с учётом смещения и масштаба)
  function dateToX (date: Date): number {
    const range = globalDateRange.value
    const daysSinceMin = (date.getTime() - range.min.getTime()) / 86_400_000
    return daysSinceMin * pixelsPerDay.value - offsetX.value * pixelsPerDay.value + leftPanelWidth
  }

  function groupStartX (group: SimpleGroupResponse) {
    return dateToX(group.start_date)
  }
  function groupEndX (group: SimpleGroupResponse) {
    return dateToX(group.end_date)
  }
  function groupWidth (group: SimpleGroupResponse) {
    return groupEndX(group) - groupStartX(group)
  }
  // Ширина закрашенной части прогресса (в пикселях)
  function progressWidth (group: SimpleGroupResponse) {
    const totalDuration = group.end_date.getTime() - group.start_date.getTime()
    const elapsed = (group.average_progress / 100) * totalDuration
    const elapsedDays = elapsed / 86_400_000
    return elapsedDays * pixelsPerDay.value
  }

  function groupY (index: number): number {
    return index * rowHeight + 40 - offsetY.value
  }

  // Обрезка текста с многоточием, если не помещается
  function truncateText (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text
    let truncated = text
    while (ctx.measureText(truncated + '…').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '…'
  }

  // ---------- Отрисовка всей диаграммы ----------
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

    drawTimeScale(ctx) // Шкала времени в верхней части
    drawGrid(ctx) // Вертикальные линии сетки

    // ---- Клип: полосы групп не должны заезжать на область шкалы времени ----
    ctx.save()
    ctx.beginPath()
    ctx.rect(leftPanelWidth, 40, canvasWidth.value - leftPanelWidth, canvasHeight.value - 40)
    ctx.clip()

    // Рисуем каждую группу
    for (const [idx, group] of normalizedGroups.value.entries()) {
      const y = groupY(idx)
      const startX = groupStartX(group)
      const width = groupWidth(group)
      if (y + rowHeight < 0 || y > canvasHeight.value) continue // полностью вне видимой области
      if (startX + width < 0 || startX > canvasWidth.value) continue

      // Фон полосы
      ctx.fillStyle = '#e3f2fd'
      ctx.fillRect(startX, y + 5, width, rowHeight - 10)
      ctx.strokeStyle = '#1e88e5'
      ctx.strokeRect(startX, y + 5, width, rowHeight - 10)

      // Прогресс
      const progWidth = progressWidth(group)
      if (progWidth > 0) {
        ctx.fillStyle = '#4caf50'
        ctx.fillRect(startX, y + 5, Math.min(progWidth, width), rowHeight - 10)
      }

      // Название курса (если помещается внутри – рисуем внутри, иначе – справа от полосы)
      ctx.font = '12px "Inter"'
      ctx.fillStyle = '#0d47a1'
      const text = group.course_title
      const textWidth = ctx.measureText(text).width
      if (textWidth < width - 10) {
        ctx.fillText(text, startX + 5, y + rowHeight / 2 + 3)
      } else {
        const maxRightWidth = canvasWidth.value - (startX + width + 5)
        const rightText = truncateText(ctx, text, Math.min(200, maxRightWidth))
        ctx.fillText(rightText, startX + width + 5, y + rowHeight / 2 + 3)
      }

      // Процент прогресса (округлённый) – прижимаем к правому краю полосы
      ctx.fillStyle = '#333'
      ctx.font = '10px "Inter"'
      const percentText = `${Math.round(group.average_progress)}%`
      const percentWidth = ctx.measureText(percentText).width
      let percentX = startX + width - 5 - percentWidth
      if (percentX < startX + 5) percentX = startX + 5
      ctx.fillText(percentText, percentX, y + rowHeight / 2 + 3)

      // Если у группы есть конфликты – накладываем полупрозрачный оранжевый слой
      if (groupConflicts.value[group.id]) {
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.fillStyle = '#ff9800'
        ctx.fillRect(startX, y + 5, width, rowHeight - 10)
        ctx.restore()
      }
    }

    ctx.restore() // снимаем clip

    // ---- Левая панель с названиями (рисуется поверх, без клипа) ----
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, leftPanelWidth, canvas.height)
    ctx.strokeStyle = '#ddd'
    ctx.strokeRect(0, 0, leftPanelWidth, canvas.height)
    ctx.font = '13px "Inter"'
    for (const [idx, group] of normalizedGroups.value.entries()) {
      const y = groupY(idx)
      if (y + rowHeight < 0 || y > canvasHeight.value) continue
      ctx.fillStyle = '#333'
      let title = group.course_title
      const maxTitleWidth = leftPanelWidth - 20
      title = truncateText(ctx, title, maxTitleWidth)
      ctx.fillText(title, 10, y + rowHeight / 2 + 3)
    }
  }

  // Отрисовка шкалы времени (засечки и подписи)
  function drawTimeScale (ctx: CanvasRenderingContext2D) {
    const range = globalDateRange.value
    let stepDays: number
    let format: (d: Date) => string
    const ppd = pixelsPerDay.value

    // Выбираем шаг и формат в зависимости от масштаба
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
    ctx.font = '10px "Inter"'
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

  // Отрисовка вертикальной сетки (совпадает с засечками шкалы)
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

  // ---------- Обработка колесика мыши ----------
  function handleWheel (event: WheelEvent) {
    event.preventDefault()
    if (event.ctrlKey) {
      // Ctrl + колёсико → масштабирование (изменение pixelsPerDay)
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      let newPixels = pixelsPerDay.value * delta
      newPixels = Math.min(80, Math.max(3, newPixels))
      pixelsPerDay.value = newPixels
      clampOffsets()
    } else if (event.shiftKey) {
      // Shift + колёсико → горизонтальное панорамирование
      const deltaX = event.deltaY > 0 ? 20 : -20
      offsetX.value += deltaX / pixelsPerDay.value
      clampOffsets()
    } else {
      // Обычное колёсико → вертикальное панорамирование
      const deltaY = event.deltaY > 0 ? 20 : -20
      offsetY.value += deltaY
      clampOffsets()
    }
    draw()
  }

  // Программное панорамирование по кнопкам
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

  // ---------- Drag (панорамирование зажатой левой кнопкой) ----------
  function startDrag (event: MouseEvent) {
    dragStart.value = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offsetX.value,
      offsetY: offsetY.value,
      isDragging: true,
      moved: false,
    }
    document.body.style.userSelect = 'none' // Запрещаем выделение текста при перетаскивании
  }

  function onDrag (event: MouseEvent) {
    if (!dragStart.value.isDragging) return
    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragStart.value.moved = true // Фиксируем, что было реальное перемещение (а не клик)
    }
    offsetX.value = dragStart.value.offsetX - dx / pixelsPerDay.value
    offsetY.value = dragStart.value.offsetY - dy
    clampOffsets()
    draw()
  }

  function endDrag () {
    dragStart.value.isDragging = false
    document.body.style.userSelect = ''
  }

  // ---------- Обнаружение конфликтов в расписании сотрудников ----------
  // Для каждого сотрудника собираем интервалы всех его групп. Если интервалы пересекаются – помечаем группы.
  const groupConflicts = computed(() => {
    const conflictsMap: Record<number, boolean> = {}
    if (props.groups.length === 0) return conflictsMap
    const employeeGroups = new Map<number, Array<{ groupId: number, start: Date, end: Date }>>()
    for (const group of props.groups) {
      if (group.members != null)
        for (const emp of group.members) {
          if (!employeeGroups.has(emp.id)) employeeGroups.set(emp.id, [])
          employeeGroups.get(emp.id)!.push({ groupId: group.id, start: group.start_date, end: group.end_date })
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
      showConflictSnackbar.value = true // Показываем предупреждение при первом обнаружении
    }
    return conflictsMap
  })

  // ---------- Клик по canvas (открытие диалога группы) ----------
  function handleCanvasClick (event: MouseEvent) {
    // Если было перетаскивание – игнорируем клик
    if (dragStart.value.moved) {
      dragStart.value.moved = false
      return
    }

    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (event.clientX - rect.left) * scaleX
    const clickY = (event.clientY - rect.top) * scaleY

    const rowIndex = Math.floor((clickY - 40 + offsetY.value) / rowHeight)
    if (rowIndex >= 0 && rowIndex < normalizedGroups.value.length) {
      const group = normalizedGroups.value[rowIndex]
      const startX = groupStartX(group)
      const endX = groupEndX(group)
      if (clickX >= startX && clickX <= endX) {
        selectedGroup.value = group
        detailsDialog.value = true
      }
    }
  }

  // ---------- Адаптация размеров контейнера (ResizeObserver) ----------
  function updateViewportSize () {
    if (wrapperRef.value) {
      viewportWidth.value = wrapperRef.value.clientWidth
      viewportHeight.value = wrapperRef.value.clientHeight
      clampOffsets()
      draw()
    }
  }

  const allEmployees = ref<SimpleEmployeeResponse[]>([])
  const snackbar = ref({ show: false, message: '', color: 'success' })

  // Загрузка всех сотрудников для выбора
  async function loadAllEmployees () {
    try {
      const response = await api.get('/api/employees/', { params: { page_size: 1000 } })
      allEmployees.value = response.data.results || response.data
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error)
      showSnackbar('Не удалось загрузить список сотрудников', 'error')
    }
  }

  function showSnackbar (message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
  }

  let resizeObserver: ResizeObserver | null = null
  onMounted(() => {
    loadAllEmployees()
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

  // Перерисовка при изменении данных или параметров отображения
  watch([() => props.groups, pixelsPerDay, offsetX, offsetY], () => {
    nextTick(() => draw())
  })

  // Вспомогательная функция форматирования даты
  function formatDate (date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('ru-RU')
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
