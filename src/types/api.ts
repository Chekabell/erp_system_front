// src/types/api.ts

export interface SimpleCompany {
  id: number
  code: string
  name: string
}

export interface Company extends SimpleCompany {
  specifications?: SimpleSpecification[]
}

export interface Course {
  id: number
  title: string
  description: string | null
  duration_days: number
  base_price: string // Decimal as string
}

export interface SimpleGroup {
  id: number
  course_title: string
  start_date: string
  end_date: string
  status: 'planned' | 'in_progress' | 'completed'
}

export interface SimpleEmployee {
  id: number
  full_name: string
  company_name: string
  email: string
}

export interface SimpleSpecification {
  id: number
  date: string
  number: string
}

export interface Employee {
  id: number
  full_name: string
  company: SimpleCompany
  email: string
  groups: SimpleGroup[]
}

export interface Group {
  id: number
  course: Course
  specification: SimpleSpecification | null
  start_date: string
  end_date: string
  price_at_creation: string
  status: 'planned' | 'in_progress' | 'completed'
  total_cost: string
  employees_count: number
  average_progress: number
}

export interface GroupEmployee {
  id: number
  group: SimpleGroup
  employee: SimpleEmployee
  progress_percent: number
}

export interface Specification {
  id: number
  date: string
  number: string
  company: SimpleCompany
  groups: SimpleGroup[]
  total_no_vat: number
  vat_amount: number
  total_with_vat: number
}

export interface GanttItem {
  id: number
  course_title: string
  start_date: string
  end_date: string
  progress: number
  status: string
}

export interface XmlUploadResponse {
  status: string
  message: string
}

export interface XmlUploadError {
  error: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}