import axiosClient from "@/api/axiosClient";
import type { Organization } from "@/types/auth.types";

export const organizationApi = {
  getAll: async (searchTerm?: string): Promise<Organization[]> => {
    const response = await axiosClient.get<Organization[]>("/organizations", {
      params: searchTerm ? { searchTerm } : undefined,
    });
    return response.data;
  },
};
