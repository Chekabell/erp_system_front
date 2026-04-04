import type { GanttItem } from '@/types/api'
import { createEntityStore } from './base'
export const ganttChartStore = createEntityStore<GanttItem>('/api/gantt_data/')
