export type Role = 'admin' | 'staff';

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityIconKey = 'karate' | 'dance' | 'chess' | 'skating' | 'music' | 'yoga' | 'cricket';
export type ActivityStatus = 'active' | 'inactive' | 'full';

export interface ActivityDTO {
  _id: string;
  name: string;
  coach: string;
  monthlyFee: number;
  schedule: string;
  capacity: number;
  enrolled: number;
  status: ActivityStatus;
  description: string;
  color: string;
  icon: string;
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Activity as embedded/populated on a Student document — a subset of ActivityDTO's fields. */
export interface StudentActivityRef {
  _id: string;
  name: string;
  coach: string;
  monthlyFee: number;
  color: string;
  icon: string;
  status?: ActivityStatus;
  isFull?: boolean;
}

export type StudentStatus = 'active' | 'inactive' | 'overdue';

interface StudentBase {
  _id: string;
  admissionNo: string;
  studentId: string;
  name: string;
  standard: string;
  section: string;
  joinedDate: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDTO extends StudentBase {
  activities: StudentActivityRef[];
  /** Present on the list endpoint only; absent on GET /students/:id. */
  outstanding?: number;
}

export interface StudentFormPayload {
  admissionNo?: string;
  name: string;
  standard: string;
  section: string;
  joinedDate?: string;
  activities?: string[];
  status?: StudentStatus;
}

export type MonthStatus = 'paid' | 'pending' | 'partial' | 'none';

export interface MonthEntry {
  month: number; // 1-12
  status: MonthStatus;
  amount: number;
  paidAmount: number;
  paidDate: string | null;
  paymentId: string | null;
}

export interface MonthlyStatusEntry {
  activityId: string;
  activityName: string;
  monthlyFee: number;
  year: number;
  months: MonthEntry[];
  progressPercent: number;
  outstanding: number;
  paidAmount: number;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank';
export type PaymentStatus = 'success' | 'cancelled' | 'refunded';

/** A brief ref for a user, populated on some endpoints, a bare ObjectId string on others (e.g. dashboard). */
export type UserRef = string | { _id: string; name: string };
/** A brief ref for a student, populated on some endpoints (payments list, dashboard), a bare ObjectId string on others (payment-history, scoped to one student already). */
export type StudentRef = string | { _id: string; name: string; admissionNo: string; studentId?: string };

export interface PaymentDTO {
  _id: string;
  receiptNo: string;
  // Populated refs come back `null` once the referenced student/activity/user has
  // been deleted — the Payment record itself is kept for audit/receipt history.
  studentId: StudentRef | null;
  activityId: { _id: string; name: string; color: string; icon: string; monthlyFee?: number } | null;
  months: number[];
  year: number;
  amount: number;
  discount: number;
  lateFee: number;
  total: number;
  paymentMode: PaymentMode;
  referenceNo: string;
  collectedBy: UserRef | null;
  paymentDate: string;
  remarks: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentPayload {
  studentId: string;
  activityId: string;
  months: number[];
  year: number;
  discount?: number;
  lateFee?: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  remarks?: string;
}

export type TrackerRowStatus = 'paid' | 'pending' | 'partial' | 'overdue';

export interface TrackerRow {
  studentId: string;
  studentName: string;
  admissionNo: string;
  standard: string;
  section: string;
  activityId: string;
  activityName: string;
  monthlyFee: number;
  year: number;
  months: MonthEntry[];
  progressPercent: number;
  paidAmount: number;
  outstanding: number;
  rowStatus: TrackerRowStatus;
}

export interface DashboardActivityRevenue {
  activityId: string;
  name: string;
  color: string;
  icon: string;
  revenue: number;
  paymentsCount: number;
}

export interface DashboardPendingStudent {
  studentId: string;
  name: string;
  admissionNo: string;
  standard: string;
  section: string;
  outstanding: number;
}

export interface DashboardRegistration {
  _id: string;
  name: string;
  admissionNo: string;
  standard: string;
  section: string;
  createdAt: string;
  activities: { _id: string; name: string }[];
}

export interface DashboardData {
  totalStudents: number;
  activeActivities: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  collectionPercentage: number;
  pendingCount: number;
  recentPayments: PaymentDTO[];
  recentRegistrations: DashboardRegistration[];
  monthlyRevenueChart: { month: number; revenue: number }[];
  activityRevenue: DashboardActivityRevenue[];
  pendingStudents: DashboardPendingStudent[];
  currentMonth: number;
  currentYear: number;
}

export interface ReportResult {
  title: string;
  columns: { header: string; key: string }[];
  rows: Record<string, unknown>[];
  summary: Record<string, unknown>;
}

export type ReportEndpoint = 'revenue' | 'pending' | 'activity' | 'monthly-collection' | 'yearly-collection';
export type ReportFormat = 'json' | 'pdf' | 'excel' | 'csv';
export interface ReportParams {
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  activityId?: string;
}

export interface ImportStudentsResult {
  totalRows: number;
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface BulkDeleteStudentsResult {
  totalRequested: number;
  deleted: number;
  failed: number;
  errors: { id: string; message: string }[];
}

export interface SettingsDTO {
  _id: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  logo: string;
  academicYear: string;
  receiptPrefix: string;
  partialPaymentPercentage: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type SettingsFormPayload = Partial<
  Omit<SettingsDTO, '_id' | 'createdAt' | 'updatedAt' | 'logo'>
>;

/** Resolve a possibly-populated student/user ref to a display name — `null`/`undefined` when the referenced record was since deleted, or a bare id string when unpopulated. */
export function refName(ref: StudentRef | UserRef | null | undefined, fallback = 'Unknown'): string {
  if (!ref || typeof ref === 'string') return fallback;
  return ref.name;
}
