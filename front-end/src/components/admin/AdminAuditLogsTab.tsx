import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileClock,
  Globe,
  Layers,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";

import type { AuditLogItem } from "@/types/auditLog.types";
import { auditLogApi } from "@/api/auditLogApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/components/ui/toaster";
import { AdminAuditLogDetailDialog } from "@/components/admin/AdminAuditLogDetailDialog";

const ENTITY_OPTIONS = [
  { value: "ALL", label: "Tất cả thực thể" },
  { value: "Activity", label: "Hoạt động (Activity)" },
  { value: "Campaign", label: "Chiến dịch (Campaign)" },
  { value: "Organization", label: "Đơn vị Đoàn (Organization)" },
  { value: "User", label: "Tài khoản (User)" },
  { value: "Volunteer", label: "Tình nguyện viên (Volunteer)" },
  { value: "Attendance", label: "Điểm danh (Attendance)" },
  { value: "ActivityRegistration", label: "Đăng ký (Registration)" },
];

const ACTION_OPTIONS = [
  { value: "ALL", label: "Tất cả hành động" },
  { value: "CREATE", label: "Tạo mới (CREATE)" },
  { value: "UPDATE", label: "Cập nhật (UPDATE)" },
  { value: "DELETE", label: "Xoá (DELETE)" },
];

export function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal Detail
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditLogApi.getAll({
        search: searchTerm.trim() || undefined,
        entityType: selectedEntity !== "ALL" ? selectedEntity : undefined,
        action: selectedAction !== "ALL" ? selectedAction : undefined,
        fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
        toDate: toDate ? new Date(toDate).toISOString() : undefined,
        pageNumber: page,
        pageSize,
      });

      setLogs(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error("Không thể lấy danh sách nhật ký hệ thống. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedEntity, selectedAction, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedEntity("ALL");
    setSelectedAction("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
            TẠO MỚI
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
            CẬP NHẬT
          </Badge>
        );
      case "DELETE":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
            XOÁ
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getEntityBadge = (entityType: string) => {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
        <Layers className="size-3 text-slate-500" />
        {entityType}
      </span>
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedEntity !== "ALL") count++;
    if (selectedAction !== "ALL") count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [searchTerm, selectedEntity, selectedAction, fromDate, toDate]);

  return (
    <div className="space-y-4">
      {/* Header Giới thiệu & Thống kê */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileClock className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Nhật ký hệ thống (Audit Trail)
              <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50 text-[11px]">
                SUPER_ADMIN ONLY
              </Badge>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi lịch sử thêm, sửa, xoá và giám sát an ninh toàn bộ các thực thể trên hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Card Bộ lọc */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Tìm email, user, ID thực thể, thay đổi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Entity Type Filter */}
            <div>
              <Select
                value={selectedEntity}
                onValueChange={(val) => {
                  setSelectedEntity(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn thực thể" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div>
              <Select
                value={selectedAction}
                onValueChange={(val) => {
                  setSelectedAction(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn hành động" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range trigger / clear */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 text-xs"
                title="Từ ngày"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 text-xs"
                title="Đến ngày"
              />
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  title="Xoá tất cả bộ lọc"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách dữ liệu bảng */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b">
                <TableRow>
                  <TableHead className="w-[170px] text-xs font-semibold">Thời gian</TableHead>
                  <TableHead className="w-[200px] text-xs font-semibold">Người thực hiện</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold">Hành động</TableHead>
                  <TableHead className="w-[160px] text-xs font-semibold">Thực thể</TableHead>
                  <TableHead className="w-[220px] text-xs font-semibold">Mã ID thực thể</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold">Địa chỉ IP</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                        <RefreshCw className="size-5 animate-spin text-primary" />
                        <span>Đang tải nhật ký kiểm toán...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44">
                      <EmptyState
                        icon={<FileClock className="size-8 text-slate-400" />}
                        title="Chưa có bản ghi nhật ký nào"
                        description={
                          activeFilterCount > 0
                            ? "Không tìm thấy sự kiện kiểm toán khớp với bộ lọc hiện tại."
                            : "Hệ thống sẽ tự động ghi vết khi có thao tác thêm, sửa hoặc xoá dữ liệu."
                        }
                        action={
                          activeFilterCount > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
                              className="text-xs"
                            >
                              Xoá bộ lọc
                            </Button>
                          ) : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedLog(item);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* Thời gian */}
                      <TableCell className="text-xs font-mono text-slate-600">
                        {new Date(item.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>

                      {/* Người thực hiện */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <User className="size-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]" title={item.userEmail || "Hệ thống"}>
                            {item.userEmail || "Hệ thống / Anonymous"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Hành động */}
                      <TableCell className="text-xs">
                        {getActionBadge(item.action)}
                      </TableCell>

                      {/* Thực thể */}
                      <TableCell className="text-xs">
                        {getEntityBadge(item.entityType)}
                      </TableCell>

                      {/* Mã ID thực thể */}
                      <TableCell className="text-xs font-mono text-slate-500">
                        {item.entityId ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title={item.entityId}>
                            {item.entityId.slice(0, 18)}...
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>

                      {/* IP */}
                      <TableCell className="text-xs font-mono text-slate-600">
                        <div className="flex items-center gap-1">
                          <Globe className="size-3 text-slate-400 shrink-0" />
                          <span>{item.ipAddress || "—"}</span>
                        </div>
                      </TableCell>

                      {/* Thao tác */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="size-3.5" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang & Tổng số */}
          {!isLoading && logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-slate-50/40 text-xs text-slate-500">
              <div>
                Hiển thị{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min((page - 1) * pageSize + 1, totalCount)}
                </span>{" "}
                đến{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-slate-800">{totalCount}</span> sự kiện
              </div>
              <Pagination
                page={page}
                pageCount={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog chi tiết thay đổi */}
      <AdminAuditLogDetailDialog
        log={selectedLog}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
