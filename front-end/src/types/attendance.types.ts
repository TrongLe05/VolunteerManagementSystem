export type AttendanceSessionType = "CHECK_IN" | "CHECK_OUT";

export interface AttendanceSession {
  id: string;
  activityId: string;
  activityName: string;
  organizationId: string;
  organizationName: string;
  type: AttendanceSessionType | string;
  startedAt: string;
  endedAt?: string | null;
  isActive: boolean;
  remainingSeconds: number;
  totalAttended: number;
  createdByUsername: string;
}

export interface ActiveAttendanceSession {
  id?: string;
  sessionId?: string;
  activityId: string;
  activityName: string;
  type: AttendanceSessionType | string;
  startedAt: string;
  endedAt?: string | null;
  remainingSeconds: number;
  isOpen?: boolean;
  hasAttended?: boolean;
}

export interface AttendanceRecord {
  id: string;
  volunteerId: string;
  volunteerName: string;
  studentCode?: string | null;
  className?: string | null;
  attendedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyMeters?: number | null;
  locationStatus: string;
  verificationMethod: string;
  faceSimilarity?: number | null;
  isLivenessVerified: boolean;
  capturedImageUrl?: string | null;
  status: string;
  note?: string | null;
}

export interface AttendanceRecordDetail {
  attendanceId: string;
  attendedAt: string;
  locationStatus: string;
  locationAccuracyMeters?: number | null;
  verificationMethod: string;
  faceSimilarity?: number | null;
  isLivenessVerified: boolean;
  capturedImageUrl?: string | null;
  status: string;
}

export interface ActivityVolunteerAttendance {
  registrationId: string;
  volunteerId: string;
  fullName: string;
  studentCode?: string | null;
  className?: string | null;
  phone?: string | null;
  registrationStatus: string;
  checkIn?: AttendanceRecordDetail | null;
  checkOut?: AttendanceRecordDetail | null;
}

export interface ActivityAttendanceOverview {
  activityId: string;
  activityName: string;
  campaignName: string;
  organizationName: string;
  startTime: string;
  endTime: string;
  totalRegistered: number;
  totalAttended: number;
  totalCheckedIn: number;
  totalCheckedOut: number;
  totalAbsent: number;
  activeSession?: ActiveAttendanceSession | null;
  volunteers: ActivityVolunteerAttendance[];
}

export interface OpenSessionRequest {
  activityId: string;
  type: AttendanceSessionType;
  durationMinutes?: number;
}

export interface ManualMarkRequest {
  registrationId: string;
  type: AttendanceSessionType | string;
  note?: string;
}

export interface AttendanceSessionFilter {
  activityId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CheckInRequest {
  activityId: string;
  latitude: number;
  longitude: number;
  locationAccuracyMeters?: number | null;
  capturedImageBase64?: string | null;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  sessionType: string;
  attendedAt: string;
  locationStatus: string;
  distanceMeters: number;
  isInsideGeofence: boolean;
}
