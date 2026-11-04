import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FaceBiometricEnrollmentSection } from "@/components/profile/FaceBiometricEnrollmentSection";
import type { VolunteerProfile } from "@/types/volunteer.types";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-1",
      username: "testvolunteer",
      email: "test@dthu.edu.vn",
      avatarUrl: null,
    },
    updateAvatar: vi.fn(),
    hasRole: () => true,
  }),
}));

describe("FaceBiometricEnrollmentSection (Decree 13/2023/NĐ-CP)", () => {
  const unenrolledProfile: VolunteerProfile = {
    id: "v-1",
    userId: "u-1",
    organizationId: "org-1",
    organizationName: "Đoàn trường ĐH Đồng Tháp",
    volunteerCode: "TNV-2026-001",
    studentCode: "002141001",
    fullName: "Nguyễn Văn TNV",
    gender: "MALE",
    phone: "0912345678",
    className: "ĐH CNTT 21A",
    dateOfBirth: "2003-05-15",
    joinedAt: "2026-01-01",
    consentFaceAuth: false,
    consentGivenAt: null,
  };

  it("renders Decree 13/2023 compliance header and status block", () => {
    render(
      <FaceBiometricEnrollmentSection
        profile={unenrolledProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    expect(screen.getByText("Sinh trắc học & Bảo vệ Dữ liệu Cá nhân")).toBeInTheDocument();
    expect(screen.getByText("Nghị định 13/2023/NĐ-CP")).toBeInTheDocument();
    expect(
      screen.getByText("Cơ chế xác thực khuôn mặt minh bạch theo Nghị định 13/2023/NĐ-CP")
    ).toBeInTheDocument();
    expect(screen.getByText("Trạng thái nhận diện khuôn mặt")).toBeInTheDocument();
  });

  it("shows Unenrolled state when consentFaceAuth is false and opens consent dialog", () => {
    render(
      <FaceBiometricEnrollmentSection
        profile={unenrolledProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    expect(screen.getByText("Chưa kích hoạt")).toBeInTheDocument();
    const openBtn = screen.getByRole("button", {
      name: /Đọc quy chế & Đăng ký khuôn mặt/i,
    });
    expect(openBtn).toBeInTheDocument();

    // Click button to open modal
    fireEvent.click(openBtn);

    // Expect Decree 13 terms inside dialog
    expect(
      screen.getByText("Bản Thỏa Thuận Chấp Thuận Dữ Liệu Cá Nhân")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tôi đã đọc kỹ, hiểu rõ các quyền lợi theo Nghị định 13\/2023\/NĐ-CP/i)
    ).toBeInTheDocument();
  });

  it("shows Enrolled state and consent timestamp when consentFaceAuth is true", () => {
    const enrolledProfile: VolunteerProfile = {
      ...unenrolledProfile,
      consentFaceAuth: true,
      consentGivenAt: "2026-11-04T08:30:00Z",
    };

    render(
      <FaceBiometricEnrollmentSection
        profile={enrolledProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    expect(screen.getByText("Đã kích hoạt hợp lệ")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Chụp lại ảnh mẫu/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Rút lại sự đồng ý/i })
    ).toBeInTheDocument();
  });
});
