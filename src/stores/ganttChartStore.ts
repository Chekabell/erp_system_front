import type { GanttResponse } from '@/types/api'
import { createEntityStore } from './base'
export const ganttChartStore = createEntityStore<GanttResponse>('/api/gantt_data/')
