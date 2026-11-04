import axiosClient from "@/api/axiosClient";
import type {
  Campaign,
  CreateCampaignRequest,
  PageResult,
  UpdateCampaignRequest,
} from "@/types/volunteer.types";

export interface GetCampaignsParams {
  searchTerm?: string;
  organizationId?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const campaignApi = {
  getAll: async (
    params?: GetCampaignsParams,
  ): Promise<PageResult<Campaign>> => {
    const response = await axiosClient.get<PageResult<Campaign>>("/campaigns", {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Campaign> => {
    const response = await axiosClient.get<Campaign>(`/campaigns/${id}`);
    return response.data;
  },

  create: async (data: CreateCampaignRequest): Promise<string> => {
    const response = await axiosClient.post<string>("/campaigns", data);
    return response.data;
  },

  update: async (id: string, data: UpdateCampaignRequest): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(`/campaigns/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<boolean>(`/campaigns/${id}`);
    return response.data;
  },
};
