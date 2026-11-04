import { useEffect } from "react";
import { dashboardSignalR } from "@/services/dashboardSignalR";

interface DashboardRealtimeOptions {
  onActivityChanged?: () => void;
  onCampaignChanged?: () => void;
  onOrganizationChanged?: () => void;
  onVolunteerChanged?: () => void;
}

export function useDashboardRealtime(options: DashboardRealtimeOptions) {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    if (options.onActivityChanged) {
      cleanups.push(
        dashboardSignalR.subscribe("ActivityChanged", options.onActivityChanged),
      );
    }
    if (options.onCampaignChanged) {
      cleanups.push(
        dashboardSignalR.subscribe("CampaignChanged", options.onCampaignChanged),
      );
    }
    if (options.onOrganizationChanged) {
      cleanups.push(
        dashboardSignalR.subscribe(
          "OrganizationChanged",
          options.onOrganizationChanged,
        ),
      );
    }
    if (options.onVolunteerChanged) {
      cleanups.push(
        dashboardSignalR.subscribe(
          "VolunteerChanged",
          options.onVolunteerChanged,
        ),
      );
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [
    options.onActivityChanged,
    options.onCampaignChanged,
    options.onOrganizationChanged,
    options.onVolunteerChanged,
  ]);
}
