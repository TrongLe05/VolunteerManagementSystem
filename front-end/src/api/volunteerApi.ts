import axiosClient from "@/api/axiosClient";
import type {
  GrantManualCreditRequest,
  PageResult,
  VolunteerCreditRecord,
  VolunteerCreditSummary,
  VolunteerProfile,
} from "@/types/volunteer.types";

export interface GetVolunteersParams {
  searchTerm?: string;
  organizationId?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface UpdateMyProfileRequest {
  fullName: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  className?: string | null;
  studentCode?: string | null;
  consentFaceAuth: boolean;
}

export const volunteerApi = {
  getMyProfile: async (): Promise<VolunteerProfile> => {
    const response = await axiosClient.get<VolunteerProfile>("/volunteers/me");
    return response.data;
  },

  updateMyProfile: async (data: UpdateMyProfileRequest): Promise<boolean> => {
    const response = await axiosClient.put<boolean>("/volunteers/me", data);
    return response.data;
  },

  getAll: async (
    params?: GetVolunteersParams,
  ): Promise<PageResult<VolunteerProfile>> => {
    const response = await axiosClient.get<PageResult<VolunteerProfile>>(
      "/volunteers",
      { params },
    );
    return response.data;
  },

  importExcel: async (file: File, organizationId: string): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("organizationId", organizationId);

    const response = await axiosClient.post("/volunteers/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getMyCredits: async (): Promise<VolunteerCreditSummary> => {
    const response =
      await axiosClient.get<VolunteerCreditSummary>("/volunteers/me/credits");
    return response.data;
  },

  getVolunteerCredits: async (
    volunteerId: string,
  ): Promise<VolunteerCreditSummary> => {
    const response = await axiosClient.get<VolunteerCreditSummary>(
      `/volunteers/${volunteerId}/credits`,
    );
    return response.data;
  },

  grantManualCredit: async (
    volunteerId: string,
    data: GrantManualCreditRequest,
  ): Promise<VolunteerCreditRecord> => {
    const response = await axiosClient.post<VolunteerCreditRecord>(
      `/volunteers/${volunteerId}/credits/manual-grant`,
      data,
    );
    return response.data;
  },
};
