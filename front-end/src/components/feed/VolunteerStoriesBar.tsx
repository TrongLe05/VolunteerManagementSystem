import { Link, useNavigate } from "react-router";
import { Plus, CalendarHeart, Award } from "lucide-react";
import type { Activity } from "@/types/volunteer.types";
import { useAuth } from "@/context/AuthContext";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";
import authBanner from "@/assets/auth-banner.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface VolunteerStoriesBarProps {
  activities: Activity[];
}

const STORY_FALLBACK_IMAGES = [authBanner];

function getStoryImage(activity: Activity): string {
  if (activity.imageUrl) return activity.imageUrl;
  return STORY_FALLBACK_IMAGES[0];
}

export function VolunteerStoriesBar({ activities }: VolunteerStoriesBarProps) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);

  const totalSlides = activities.length + 1;
  const slidesPerView = {
    base: Math.min(totalSlides, 3),
    sm: Math.min(totalSlides, 4),
    md: Math.min(totalSlides, 4),
    lg: Math.min(totalSlides, 5),
  };

  return (
    <div className="relative group/stories select-none">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        slidesPerView={slidesPerView}
        className="w-full"
      >
        <CarouselContent className="-ml-2 sm:-ml-2.5 py-1">
          {/* Slide 1: Tạo hoạt động (Admin) hoặc Tất cả hoạt động (TNV / Khách) */}
          <CarouselItem className="pl-2 sm:pl-2.5">
            <div
              onClick={() =>
                navigate(isAdmin ? "/admin/activities" : "/activities")
              }
              className="relative h-44 sm:h-50 w-full rounded-2xl overflow-hidden cursor-pointer border border-slate-200 bg-white shadow-2xs group/card transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
            >
              {/* Nửa trên: Avatar người dùng hoặc banner DThU */}
              <div className="h-3/4 w-full overflow-hidden bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 relative">
                {isAuthenticated && user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="size-full object-cover object-top transition-transform duration-300 group-hover/card:scale-105"
                  />
                ) : (
                  <img
                    src={authBanner}
                    alt="DThU"
                    className="size-full object-cover object-center opacity-60 transition-transform duration-300 group-hover/card:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/15" />
              </div>

              {/* Nút tròn ở giữa cắt ngang */}
              <div className="absolute left-1/2 top-3/4 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="flex size-8.5 items-center justify-center rounded-full border-3 border-white bg-blue-600 text-white shadow-sm transition-transform duration-300 group-hover/card:scale-110">
                  {isAdmin ? (
                    <Plus className="size-4.5" />
                  ) : (
                    <CalendarHeart className="size-4" />
                  )}
                </div>
              </div>

              {/* Nửa dưới: Tiêu đề hành động */}
              <div className="h-1/4 w-full bg-white flex items-end justify-center pb-2 px-1 text-center">
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                  {isAdmin ? "Tạo hoạt động" : "Tất cả hoạt động"}
                </span>
              </div>
            </div>
          </CarouselItem>

          {/* Các Slide Story Hoạt động Tình nguyện */}
          {activities.map((activity) => {
            const coverImg = getStoryImage(activity);
            return (
              <CarouselItem key={activity.id} className="pl-2 sm:pl-2.5">
                <Link
                  to={`/activities/${activity.id}`}
                  className="relative block h-44 sm:h-50 w-full rounded-2xl overflow-hidden cursor-pointer border border-slate-200/90 shadow-2xs group/story "
                >
                  {/* Ảnh bìa hoạt động */}
                  <img
                    src={coverImg}
                    alt={activity.name}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/story:scale-101"
                    loading="lazy"
                  />

                  {/* Gradient tối dần xuống đáy (chuẩn story Facebook) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/25 transition-opacity group-hover/story:opacity-90" />

                  {/* Avatar tổ chức ở góc trên bên trái */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="flex size-7.5 items-center justify-center rounded-full border-2 border-white bg-blue-600 p-0.5 shadow-md ring-2 ring-blue-500/80">
                      <img
                        src={huyHieuDoan}
                        alt={activity.organizationName}
                        className="size-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Badge ngày CTXH / giờ ở góc trên bên phải */}
                  {(activity.creditDays > 0 || activity.creditHours > 0) && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white shadow-2xs">
                        <Award className="size-2.5" />+
                        {activity.creditDays > 0
                          ? `${activity.creditDays}d`
                          : `${activity.creditHours}h`}
                      </span>
                    </div>
                  )}

                  {/* Tên và đơn vị hoạt động ở đáy Story */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-2 sm:p-2.5 text-white">
                    <p className="text-[11px] sm:text-xs font-bold leading-snug line-clamp-2 text-white drop-shadow-2xs group-hover/story:text-blue-200 transition-colors">
                      {activity.name}
                    </p>
                    <p className="mt-0.5 text-[9px] text-white/75 truncate">
                      {activity.organizationName.replace(
                        /^(Đoàn Khoa|Đoàn Trường|CLB|Đội)\s+/i,
                        "",
                      )}
                    </p>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="-left-2 sm:-left-3.5 z-20 size-8.5 rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-xs hover:bg-white hover:text-blue-600 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer" />
        <CarouselNext className="-right-2 sm:-right-3.5 z-20 size-8.5 rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-xs hover:bg-white hover:text-blue-600 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer" />
      </Carousel>
    </div>
  );
}
