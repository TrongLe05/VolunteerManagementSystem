import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Skeleton cho từng bài viết Hoạt động dạng mạng xã hội trên Bảng tin */
export function ActivityPostCardSkeleton() {
  return (
    <Card className="border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header: Avatar đơn vị + Tên + Thời gian đăng */}
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Tiêu đề bài viết */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Khung ảnh 16:9 */}
        <Skeleton className="w-full aspect-[16/9] rounded-xl" />

        {/* Thông tin metadata: thời gian, địa điểm, ngày CTXH */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton cho dãy thanh Story Hoạt động trên Bảng tin */
export function VolunteerStoriesSkeleton() {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="relative h-44 sm:h-50 w-28 sm:w-32 shrink-0 rounded-2xl overflow-hidden border border-slate-200/80 bg-white p-2.5 flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton cho danh sách Chiến dịch ở cột bên phải */
export function FeedRightSidebarSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200/80 p-3 space-y-2 bg-white"
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton cho danh sách Hoạt động đã đăng ký (MyRegistrationsPage) */
export function RegistrationCardSkeleton() {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="flex flex-col justify-between gap-2 pb-3 sm:flex-row sm:items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </CardContent>
    </Card>
  );
}

/** Skeleton cho trang Hồ sơ cá nhân (ProfilePage) */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Banner + Avatar */}
      <Card className="overflow-hidden border-slate-200 bg-white">
        <Skeleton className="h-28 w-full" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-12 sm:-mt-14 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Skeleton className="size-24 rounded-2xl border-4 border-white shadow-md" />
              <div className="space-y-1.5 text-center sm:text-left">
                <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
              </div>
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Grid form thông tin sinh viên */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** Skeleton cho các dòng dữ liệu bảng quản trị (Admin Table Rows) */
export function AdminTableRowSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-slate-100">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="p-3">
              <Skeleton
                className={`h-4 ${
                  colIdx === 0
                    ? "w-8"
                    : colIdx === 1
                      ? "w-48"
                      : colIdx === columns - 1
                        ? "w-16 ml-auto"
                        : "w-24"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Skeleton cho toàn bộ Dashboard Quản trị */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[14px] border border-slate-200 bg-white p-4 space-y-2 shadow-2xs"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Chart & Pending Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 border-slate-200 bg-white space-y-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </Card>
          <Card className="p-4 border-slate-200 bg-white space-y-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </Card>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 border-slate-200 bg-white space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </Card>
          <Card className="p-4 border-slate-200 bg-white space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </Card>
        </div>
      </div>
    </div>
  );
}
