import { describe, expect, it, vi, beforeEach } from "vitest";
import axiosClient from "@/api/axiosClient";
import { attendanceApi } from "@/api/attendanceApi";
import type { CheckInRequest, CheckInResult } from "@/types/attendance.types";

vi.mock("@/api/axiosClient");

describe("attendanceApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checkIn dispatches POST /attendances/check-in with correct payload", async () => {
    const mockPayload: CheckInRequest = {
      activityId: "act-123",
      latitude: 10.455,
      longitude: 105.632,
      locationAccuracyMeters: 5,
      capturedImageBase64: "data:image/jpeg;base64,sample123",
    };

    const mockResult: CheckInResult = {
      success: true,
      message: "Điểm danh thành công!",
      sessionType: "CHECK_IN",
      attendedAt: "2026-11-04T10:00:00Z",
      locationStatus: "VALID",
      distanceMeters: 25,
      isInsideGeofence: true,
    };

    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResult });

    const result = await attendanceApi.checkIn(mockPayload);

    expect(axiosClient.post).toHaveBeenCalledTimes(1);
    expect(axiosClient.post).toHaveBeenCalledWith("/attendances/check-in", mockPayload);
    expect(result).toEqual(mockResult);
    expect(result.isInsideGeofence).toBe(true);
    expect(result.locationStatus).toBe("VALID");
  });

  it("getActiveSession queries GET /attendances/sessions/active/:activityId", async () => {
    const mockSession = {
      id: "sess-1",
      activityId: "act-123",
      activityName: "Mùa hè xanh",
      type: "CHECK_IN",
      startedAt: "2026-11-04T10:00:00Z",
      remainingSeconds: 240,
      hasAttended: false,
    };

    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockSession });

    const result = await attendanceApi.getActiveSession("act-123");

    expect(axiosClient.get).toHaveBeenCalledWith("/attendances/sessions/active/act-123");
    expect(result).toEqual(mockSession);
    expect(result?.remainingSeconds).toBe(240);
  });
});
