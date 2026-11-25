import axiosClient from "@/api/axiosClient";
import type {
  ActiveAttendanceSession,
  ActivityAttendanceOverview,
  AttendanceRecord,
  AttendanceSession,
  AttendanceSessionFilter,
  CheckInRequest,
  CheckInResult,
  GetSuspiciousAttendancesParams,
  ManualMarkRequest,
  OpenSessionRequest,
  ReviewSuspiciousAttendanceRequest,
  SuspiciousAttendanceItem,
} from "@/types/attendance.types";
import type { PageResult } from "@/types/volunteer.types";

export const attendanceApi = {
  getSessions: async (
    params?: AttendanceSessionFilter
  ): Promise<PageResult<AttendanceSession>> => {
    const response = await axiosClient.get<PageResult<AttendanceSession>>(
      "/attendances/sessions",
      { params }
    );
    return response.data;
  },

  getActiveSession: async (
    activityId: string
  ): Promise<ActiveAttendanceSession | null> => {
    const response = await axiosClient.get<ActiveAttendanceSession | null>(
      `/attendances/sessions/active/${activityId}`
    );
    return response.data;
  },

  openSession: async (
    data: OpenSessionRequest
  ): Promise<{ sessionId: string }> => {
    const response = await axiosClient.post<{ sessionId: string }>(
      "/attendances/sessions",
      data
    );
    return response.data;
  },

  closeSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const response = await axiosClient.post<{ success: boolean }>(
      `/attendances/sessions/${sessionId}/close`
    );
    return response.data;
  },

  getSessionAttendances: async (
    sessionId: string
  ): Promise<AttendanceRecord[]> => {
    const response = await axiosClient.get<AttendanceRecord[]>(
      `/attendances/sessions/${sessionId}/attendances`
    );
    return response.data;
  },

  getActivityOverview: async (
    activityId: string
  ): Promise<ActivityAttendanceOverview> => {
    const response = await axiosClient.get<ActivityAttendanceOverview>(
      `/attendances/activities/${activityId}/overview`
    );
    return response.data;
  },

  manualMark: async (
    data: ManualMarkRequest
  ): Promise<{ success: boolean }> => {
    const response = await axiosClient.post<{ success: boolean }>(
      "/attendances/manual-mark",
      data
    );
    return response.data;
  },

  checkIn: async (data: CheckInRequest): Promise<CheckInResult> => {
    const response = await axiosClient.post<CheckInResult>(
      "/attendances/check-in",
      data
    );
    return response.data;
  },

  // GET /attendances/suspicious
  getSuspicious: async (
    params?: GetSuspiciousAttendancesParams
  ): Promise<PageResult<SuspiciousAttendanceItem>> => {
    const response = await axiosClient.get<PageResult<SuspiciousAttendanceItem>>(
      "/attendances/suspicious",
      { params }
    );
    return response.data;
  },

  // PUT /attendances/{id}/review
  reviewSuspicious: async (
    data: ReviewSuspiciousAttendanceRequest
  ): Promise<{ success: boolean }> => {
    const response = await axiosClient.put<{ success: boolean }>(
      `/attendances/${data.attendanceId}/review`,
      data
    );
    return response.data;
  },
};
