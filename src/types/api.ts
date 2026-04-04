/* --- ENUMS --- */
export type GroupStatus = 'planned' | 'in_progress' | 'completed'
/* --- GET /api/xml/{model_type}/{obj_id}/ --- */
export type XmlExportModelType = 'employee' | 'course'

/* --- PAGINATION --- */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/* --- /api/employees/ --- */
export interface EmployeeResponse {
  id: number
  full_name: string
  company: CompanyResponse
  email: string
  groups: Array<SimpleGroupResponse>
}

export interface SimpleEmployeeResponse {
  id: number
  full_name: string
  company_name: string
  email: string
}

export interface EmployeeRequest {
  full_name: string
  company_id: number
  email: string
  assign_to_groups: Array<number>
}

/* --- /api/course/ --- */
export interface CourseResponse {
  id: number
  title: string
  description: string
  duration_days: number
  base_price: number
}

export type CourseRequest = Omit<CourseResponse, 'id'>

/* --- /api/specification/ --- */
export interface SpecificationResponse {
  id: number
  date: string // YYYY-MM-DD
  number: string
  company: SimpleCompanyResponse
  groups: Array<SimpleGroupResponse>
  total_no_vat: number
  vat_amount: number
  total_with_vat: number
}

export interface SimpleSpecificationResponse {
  id: number
  date: string // YYYY-MM-DD
  number: string
}

export interface SpecificationRequest {
  date: string // YYYY-MM-DD
  number: string
  company_id: number
}

/* --- /api/group/ --- */
export interface GroupResponse {
  id: number
  course: CourseResponse
  specification: SimpleSpecificationResponse
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  price_at_creation: number
  status?: GroupStatus
  total_cost: number
  employees_count: number
  average_progress: number
}

export interface SimpleGroupResponse {
  id: number
  course_title: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  status?: GroupStatus
  average_progress: number
}

export interface GroupRequest {
  course_id: number
  specification_id: number
  start_date: string
  end_date: string
  status: GroupStatus
}

/* --- /api/company/ --- */
export interface CompanyResponse {
  id: number
  code: string
  name: string
  specifications: Array<SimpleSpecificationResponse>
}

export type SimpleCompanyResponse = Omit<CompanyResponse, 'id'>

export interface CompanyRequest {
  code: string
  name: string
}

/* --- GET /api/group/{id}/employee/ --- */
export interface GroupWithEmployeesResponse {
  group: SimpleGroupResponse
  employees: Array<
    SimpleEmployeeResponse & { progress_percent: number }
  >
}

/* --- POST /api/group/{id}/employee/ --- */
export interface GroupEmployeePostResponse {
  created: Array<number>
  errors: Array<string>
}

export interface GroupEmployeePostRequest {
  employee_ids: Array<number>
}

/* --- PATCH /api/group/{id}/employee/{id}/ --- */
export interface GroupEmployeePatchResponse {
  id: number
  group: SimpleGroupResponse
  employee: SimpleEmployeeResponse
  progress_percent: number
}

export interface GroupEmployeePatchRequest {
  progress_percent: number
}

/* --- GET /api/gantt-data/ --- */
export interface GanttResponse {
  min_date: Date // YYYY-MM-DD
  max_date: Date // YYYY-MM-DD
  groups: Array<SimpleGroupResponse>
}

/* --- POST /api/xml/upload/ --- */
export interface XmlUploadRequest {
  file: File
}
