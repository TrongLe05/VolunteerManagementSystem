export interface PageResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type CampaignStatus =
  | "DRAFT"
  | "UPCOMING"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: CampaignStatus | string;
  organizationId: string;
  organizationName: string;
  createdBy: string;
}

export interface CreateCampaignRequest {
  organizationId: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
}

export interface UpdateCampaignRequest {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ActivityLocation {
  id: string;
  activityId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
}

export interface ActivityLocationInput {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
}

export type ActivityStatus =
  | "DRAFT"
  | "OPEN"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export interface Activity {
  id: string;
  campaignId: string;
  campaignName: string;
  organizationId: string;
  organizationName: string;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  creditDays: number;
  status: ActivityStatus | string;
  createdBy: string;
  registeredCount: number;
  locations: ActivityLocation[];
  imageUrl?: string | null;
}

export interface CreateActivityRequest {
  campaignId: string;
  name: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  creditDays: number;
  locations: ActivityLocationInput[];
}

export interface UpdateActivityRequest {
  id: string;
  name: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  creditDays: number;
  status: string;
  locations: ActivityLocationInput[];
}

export type RegistrationStatus =
  | "REGISTERED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface MyAttendanceRecord {
  id: string;
  sessionType: "CHECK_IN" | "CHECK_OUT" | string;
  attendedAt: string;
  locationStatus: string;
  locationAccuracyMeters?: number | null;
  verificationMethod: string;
  faceSimilarity?: number | null;
  isLivenessVerified: boolean;
  capturedImageUrl?: string | null;
  status: string;
  creditEarned: number;
  note?: string | null;
}

export interface MyActivityRegistration {
  registrationId: string;
  activityId: string;
  activityName: string;
  campaignName: string;
  organizationName: string;
  startTime: string;
  endTime: string;
  creditDay: number;
  earnedCreditDays?: number;
  isAttendanceCompleted?: boolean;
  activityStatus: string;
  registrationStatus: RegistrationStatus | string;
  registeredAt: string;
  approveAt: string | null;
  attendances?: MyAttendanceRecord[];
}

export interface ActivityRegistrationItem {
  id: string;
  activityId: string;
  volunteerId: string;
  volunteerCode: string;
  fullName: string;
  studentCode: string | null;
  className: string | null;
  phone: string | null;
  organizationName: string;
  status: RegistrationStatus | string;
  registeredAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  volunteerCode: string;
  studentCode: string | null;
  fullName: string;
  gender: string | null;
  phone: string | null;
  className: string | null;
  dateOfBirth: string | null;
  joinedAt: string;
  isActive?: boolean;
  consentFaceAuth: boolean;
  consentGivenAt: string | null;
}
