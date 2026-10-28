export type Role = 'owner' | 'administrator' | 'dentist' | 'receptionist' | 'patient';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired';

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export type RecordType = 'consultation' | 'treatment' | 'xray' | 'cleaning' | 'other';

export type TreatmentPlanStatus = 'proposed' | 'accepted' | 'rejected' | 'completed';

export type InvoicePaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'refunded';

export type VideoCallStatus = 'scheduled' | 'active' | 'ended' | 'failed';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface UserIdentity {
  id: string;
  email?: string;
  phone?: string;
  clerkSubjectId: string;
  authMetadata?: Record<string, unknown>;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  onboardingAnswers?: Record<string, unknown>;
  consentRecords?: Record<string, unknown>;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  branding?: Record<string, unknown>;
  status: string;
  timezone: string;
}

export interface ClinicSubscription {
  id: string;
  clinicId: string;
  status: SubscriptionStatus;
  tierId: string;
  billingProviderReference?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicMembership {
  id: string;
  userId: string;
  clinicId: string;
  role: Role;
}

export interface Dentist {
  id: string;
  clinicId: string;
  name: string;
  licenseNumber?: string;
  specialization?: string;
  contactDetails?: string;
  availability?: Record<string, unknown>;
  workingHours?: Record<string, unknown>;
  breaks?: Record<string, unknown>;
  leave?: Record<string, unknown>;
  blockedSlots?: Record<string, unknown>;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  clinicId: string;
  serviceId: string;
  startDatetime: Date;
  endDatetime: Date;
  status: AppointmentStatus;
  notes?: string;
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  price?: number;
  duration: number; // minutes
  bufferTime: number; // minutes after appointment
}

export interface ClinicEntitlement {
  id: string;
  clinicId: string;
  featureKey: string;
  enabled: boolean;
  value?: string;
  limit?: number;
}

export interface ClinicUsage {
  id: string;
  clinicId: string;
  metricKey: string;
  periodStart: Date;
  periodEnd: Date;
  count: number;
}

export interface DentalRecord {
  id: string;
  patientId: string;
  clinicId: string;
  recordType: RecordType;
  clinicalNotes?: string;
  attachments?: string[];
  author: string;
  timestamp: Date;
  version?: number;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  clinicId: string;
  dentistId: string;
  proposedTreatment?: string;
  status: TreatmentPlanStatus;
  followUpDate?: Date;
  version?: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  clinicId: string;
  dentistId: string;
  medicationDetails?: string;
  instructions?: string;
  issueDate?: Date;
}

export interface Invoice {
  id: string;
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  amount: number;
  currency: string;
  paymentStatus: InvoicePaymentStatus;
}

export interface VideoCall {
  id: string;
  appointmentId: string;
  streamCallId: string;
  participants: string[];
  startTime?: Date;
  endTime?: Date;
  status: VideoCallStatus;
}

export interface Notification {
  id: string;
  clinicId: string;
  recipientId: string;
  type: string;
  content?: string;
  status: NotificationStatus;
  sentAt?: Date;
}
