import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { activityApi } from "@/api/activityApi";
import { campaignApi } from "@/api/campaignApi";
import { organizationApi } from "@/api/organizationApi";
import { volunteerApi } from "@/api/volunteerApi";
import type { Organization } from "@/types/auth.types";
import type {
  Activity,
  Campaign,
  MyActivityRegistration,
  VolunteerProfile,
} from "@/types/volunteer.types";
import { ActivityPostCard } from "@/components/feed/ActivityPostCard";
import { FeedFilterBar } from "@/components/feed/FeedFilterBar";
import { FeedLeftSidebar } from "@/components/feed/FeedLeftSidebar";
import { FeedRightSidebar } from "@/components/feed/FeedRightSidebar";
import { GuestHeroBanner } from "@/components/feed/GuestHeroBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const isVolunteer = hasRole(["VOLUNTEER"]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<
    MyActivityRegistration[]
  >([]);
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const fetchFeedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [actRes, campRes, orgRes] = await Promise.all([
        activityApi.getAll({
          searchTerm: searchTerm.trim() || undefined,
          organizationId: selectedOrgId || undefined,
          campaignId: selectedCampaignId || undefined,
          status: selectedStatus || undefined,
          pageNumber: 1,
          pageSize: 20,
        }),
        campaignApi.getAll({ pageNumber: 1, pageSize: 10 }),
        organizationApi.getAll(),
      ]);

      setActivities(actRes.items || []);
      setCampaigns(campRes.items || []);
      setOrganizations(orgRes || []);
    } catch {
      // Fallback empty on error
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedOrgId, selectedCampaignId, selectedStatus, user]);

  const fetchVolunteerContext = useCallback(async () => {
    if (!isAuthenticated || !isVolunteer) {
      setMyRegistrations([]);
      setProfile(null);
      return;
    }

    try {
      const [regRes, profRes] = await Promise.allSettled([
        activityApi.getMyRegistrations({ pageNumber: 1, pageSize: 50 }),
        volunteerApi.getMyProfile(),
      ]);

      if (regRes.status === "fulfilled") {
        setMyRegistrations(regRes.value.items || []);
      }
      if (profRes.status === "fulfilled") {
        setProfile(profRes.value);
      }
    } catch {
      // Ignore profile/registration fetch errors
    }
  }, [isAuthenticated, isVolunteer]);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  useEffect(() => {
    fetchVolunteerContext();
  }, [fetchVolunteerContext]);

  const registrationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const reg of myRegistrations) {
      map.set(reg.activityId, reg.registrationStatus);
    }
    return map;
  }, [myRegistrations]);

  const volunteerStats = useMemo(() => {
    const approved = myRegistrations.filter(
      (r) => r.registrationStatus === "APPROVED",
    );
    const totalDays = approved.reduce((sum, r) => sum + (r.creditDay || 0), 0);
    return {
      totalRegistered: myRegistrations.filter(
        (r) => r.registrationStatus !== "CANCELLED",
      ).length,
      totalDays,
    };
  }, [myRegistrations]);

  const hasActiveFilters = Boolean(
    selectedOrgId || selectedCampaignId || selectedStatus || searchTerm,
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedOrgId(null);
    setSelectedCampaignId(null);
    setSelectedStatus(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 pb-12">
      {!isAuthenticated && (
        <GuestHeroBanner
          campaignCount={campaigns.length}
          activityCount={activities.length}
          organizationCount={organizations.length}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <FeedLeftSidebar
            isAuthenticated={isAuthenticated}
            isVolunteer={isVolunteer}
            user={user}
            profile={profile}
            totalDays={volunteerStats.totalDays}
            totalRegistered={volunteerStats.totalRegistered}
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            onSelectOrg={setSelectedOrgId}
          />

          <section className="space-y-4 lg:col-span-6">
            <FeedFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              campaigns={campaigns}
              selectedCampaignId={selectedCampaignId}
              onSelectCampaign={setSelectedCampaignId}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
              onRefresh={fetchFeedData}
            />

            {isLoading ? (
              <Card className="border-slate-200 bg-white py-16">
                <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="size-8 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">
                    Đang tải bảng tin hoạt động tình nguyện...
                  </p>
                </CardContent>
              </Card>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <ActivityPostCard
                    key={activity.id}
                    activity={activity}
                    registrationStatus={registrationMap.get(activity.id)}
                    onRegistrationChanged={() => {
                      fetchFeedData();
                      fetchVolunteerContext();
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-slate-200 bg-white py-12">
                <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Compass className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">
                      Chưa có bài viết hoạt động nào phù hợp
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Hiện chưa có hoạt động nào khớp với bộ lọc hoặc cơ sở Đoàn
                      chưa đăng tải hoạt động mới.
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Xem lại tất cả hoạt động
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          <FeedRightSidebar
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
          />
        </div>
      </div>
    </div>
  );
}
