import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VolunteerCheckInModal } from "@/components/activities/VolunteerCheckInModal";
import type { Activity } from "@/types/volunteer.types";
import type { ActiveAttendanceSession } from "@/types/attendance.types";

const mockActivity: Activity = {
  id: "act-101",
  campaignId: "camp-1",
  campaignName: "Chiến dịch Mùa Hè Xanh",
  organizationId: "org-1",
  organizationName: "Đoàn Trường ĐH Đồng Tháp",
  name: "Ra quân Chủ Nhật Xanh",
  description: "Dọn vệ sinh khuôn viên trường",
  startTime: "2026-11-04T07:00:00Z",
  endTime: "2026-11-04T11:00:00Z",
  capacity: 100,
  creditHours: 4,
  creditDays: 0.5,
  status: "ONGOING",
  createdBy: "admin-1",
  registeredCount: 45,
  locations: [
    {
      id: "loc-1",
      activityId: "act-101",
      name: "Sân trường ĐH Đồng Tháp",
      address: "783 Phạm Hữu Lầu, Cao Lãnh",
      latitude: 10.4602,
      longitude: 105.6426,
      allowedRadiusMeters: 150,
    },
  ],
};

const mockSession: ActiveAttendanceSession = {
  sessionId: "sess-1",
  activityId: "act-101",
  activityName: "Ra quân Chủ Nhật Xanh",
  type: "CHECK_IN",
  startedAt: "2026-11-04T07:00:00Z",
  endedAt: "2026-11-04T08:00:00Z",
  remainingSeconds: 1800,
  hasAttended: false,
};

describe("VolunteerCheckInModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      configurable: true,
    });
  });

  it("displays valid geofence badge when volunteer GPS is within allowed 150m radius", async () => {
    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({
            coords: {
              latitude: 10.4603, // ~11 meters away
              longitude: 105.6426,
              accuracy: 10,
            },
          })
        ),
      },
      configurable: true,
    });

    render(
      <VolunteerCheckInModal
        activity={mockActivity}
        activeSession={mockSession}
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText("Điểm danh VÀO (Check-in)")).toBeInTheDocument();
    expect(screen.getByText("Căn khuôn mặt vào đây")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Hợp lệ \(Trong bán kính 150m\)/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: /Xác nhận Điểm danh/i });
    expect(confirmBtn).toBeDisabled(); // Disabled until photo is captured
  });

  it("displays out-of-bounds warning badge when volunteer GPS is outside 150m radius", async () => {
    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({
            coords: {
              latitude: 10.4800, // ~2200 meters away
              longitude: 105.6426,
              accuracy: 15,
            },
          })
        ),
      },
      configurable: true,
    });

    render(
      <VolunteerCheckInModal
        activity={mockActivity}
        activeSession={mockSession}
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ngoài vùng/i)).toBeInTheDocument();
    });
  });
});
