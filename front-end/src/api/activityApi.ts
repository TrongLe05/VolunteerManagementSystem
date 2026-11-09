import axiosClient from "@/api/axiosClient";
import type {
  Activity,
  ActivityRegistrationItem,
  CreateActivityRequest,
  MyActivityRegistration,
  PageResult,
  UpdateActivityRequest,
} from "@/types/volunteer.types";

export interface GetActivitiesParams {
  searchTerm?: string;
  campaignId?: string;
  organizationId?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface GetMyRegistrationsParams {
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface GetActivityRegistrationsParams {
  searchTerm?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const activityApi = {
  getAll: async (
    params?: GetActivitiesParams,
  ): Promise<PageResult<Activity>> => {
    const response = await axiosClient.get<PageResult<Activity>>(
      "/activities",
      {
        params,
      },
    );
    return response.data;
  },

  getManage: async (
    params?: GetActivitiesParams,
  ): Promise<PageResult<Activity>> => {
    const response = await axiosClient.get<PageResult<Activity>>(
      "/activities/manage",
      {
        params,
      },
    );
    return response.data;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await axiosClient.get<Activity>(`/activities/${id}`);
    return response.data;
  },

  create: async (data: CreateActivityRequest): Promise<string> => {
    const response = await axiosClient.post<string>("/activities", data);
    return response.data;
  },

  update: async (id: string, data: UpdateActivityRequest): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(`/activities/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<boolean>(`/activities/${id}`);
    return response.data;
  },

  register: async (id: string): Promise<string> => {
    const response = await axiosClient.post<string>(
      `/activities/${id}/register`,
    );
    return response.data;
  },

  cancelRegistration: async (id: string): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(
      `/activities/${id}/cancel-registration`,
    );
    return response.data;
  },

  getMyRegistrations: async (
    params?: GetMyRegistrationsParams,
  ): Promise<PageResult<MyActivityRegistration>> => {
    const response = await axiosClient.get<PageResult<MyActivityRegistration>>(
      "/activities/my-registrations",
      { params },
    );
    return response.data;
  },

  getRegistrations: async (
    activityId: string,
    params?: GetActivityRegistrationsParams,
  ): Promise<PageResult<ActivityRegistrationItem>> => {
    const response = await axiosClient.get<
      PageResult<ActivityRegistrationItem>
    >(`/activities/${activityId}/registrations`, { params });
    return response.data;
  },

  reviewRegistration: async (
    activityId: string,
    registrationId: string,
    status: "APPROVED" | "REJECTED",
  ): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(
      `/activities/${activityId}/registrations/${registrationId}/status`,
      {
        activityId,
        registrationId,
        status,
      },
    );
    return response.data;
  },
};
