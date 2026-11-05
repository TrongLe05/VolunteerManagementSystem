import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Download,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import type { Organization } from "@/types/auth.types";
import type { VolunteerProfile } from "@/types/volunteer.types";
import { volunteerApi } from "@/api/volunteerApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
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
import { PageHead } from "@/components/blocks/shell/page-chrome";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { toast } from "@/components/ui/toaster";
import { AdminTableRowSkeleton } from "@/components/common/Skeletons";

interface AdminVolunteersTabProps {
  organizations: Organization[];
  onCountChanged?: (count: number) => void;
}

export function AdminVolunteersTab({
  organizations,
  onCountChanged,
}: AdminVolunteersTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const selectedOrgObj = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const fetchVolunteers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await volunteerApi.getAll({
        searchTerm: searchTerm.trim() || undefined,
        organizationId: selectedOrgId || undefined,
        pageNumber,
        pageSize: 12,
      });
      setVolunteers(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
      onCountChanged?.(res.totalCount || 0);
    } catch {
      setVolunteers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedOrgId, pageNumber, onCountChanged]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  useDashboardRealtime({
    onVolunteerChanged: fetchVolunteers,
    onOrganizationChanged: fetchVolunteers,
  });

  const handleDownloadTemplate = () => {
    const headers = [
      "MSSV",
      "Họ và tên",
      "Lớp",
      "Giới tính",
      "Ngày sinh",
      "Số điện thoại",
    ];
    const sampleRows = [
      ["22115053122101", "Nguyễn Văn An", "ĐH CNTT 22A", "Nam", "15/08/2004", "0912345678"],
      ["22115053122102", "Trần Thị Bích", "ĐH CNTT 22A", "Nữ", "20/11/2004", "0987654321"],
      ["22115053122103", "Lê Hoàng Long", "ĐH CNTT 22B", "Nam", "05/03/2004", "0901234567"],
    ];

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Mau_Danh_Sach_Tinh_Nguyen_Vien.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    const targetOrgId = selectedOrgId || organizations[0]?.id;
    if (!targetOrgId) {
      toast.warning("Vui lòng chọn đơn vị Đoàn trước khi Import Excel.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const targetOrgId = selectedOrgId || organizations[0]?.id;
    if (!targetOrgId) return;

    setIsImporting(true);
    try {
      await toast.promise(volunteerApi.importExcel(file, targetOrgId), {
        loading: "Đang đọc và import danh sách Tình nguyện viên từ Excel...",
        success: "Import danh sách Tình nguyện viên thành công!",
        error: (err) =>
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
              err.response?.data?.detail ||
              "Không thể import file Excel. Vui lòng kiểm tra định dạng cột."
            : "Lỗi kết nối máy chủ.",
      });
      fetchVolunteers();
    } catch {
      // Handled
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHead
        title={`Hồ sơ Tình nguyện viên (${totalCount})`}
        description="Tra cứu đoàn viên, liên kết tài khoản qua MSSV, kiểm tra NĐ 13 và Import từ Excel."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Tải file mẫu Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              size="sm"
              disabled={isImporting}
              onClick={handleImportClick}
              className="gap-1.5"
            >
              <FileSpreadsheet className="size-4" />
              {isImporting ? "Đang Import..." : "Import từ Excel"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1);
              }}
              placeholder="Tìm theo Họ tên, MSSV, Mã TNV, Lớp..."
              className="h-9"
            />

            <Combobox<Organization>
              items={organizations}
              value={selectedOrgObj}
              onValueChange={(org) => {
                setSelectedOrgId(org ? org.id : "");
                setPageNumber(1);
              }}
              itemToStringValue={(org) => String(org.id)}
              itemToStringLabel={(org) => org.name}
            >
              <ComboboxInput
                placeholder="Lọc theo Đơn vị Đoàn - Hội (đích khi Import)"
                className="w-full"
                showClear={Boolean(selectedOrgId)}
              />
              <ComboboxContent>
                <ComboboxEmpty>Không tìm thấy đơn vị.</ComboboxEmpty>
                <ComboboxList>
                  {(org: Organization) => (
                    <ComboboxItem key={org.id} value={org}>
                      {org.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {!isLoading && volunteers.length === 0 ? (
            <EmptyState
              title="Chưa có tình nguyện viên nào"
              description="Không tìm thấy hồ sơ phù hợp với bộ lọc tìm kiếm. Bạn có thể Import danh sách sinh viên từ file Excel."
              action={
                <Button onClick={handleImportClick} size="sm">
                  <FileSpreadsheet className="size-4 mr-1.5" />
                  Import file Excel ngay
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã TNV</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>MSSV / Lớp</TableHead>
                    <TableHead>Đơn vị Đoàn - Hội</TableHead>
                    <TableHead>Liên kết TK</TableHead>
                    <TableHead>Xác thực (NĐ13)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <AdminTableRowSkeleton columns={6} rows={5} />
                  ) : (
                    volunteers.map((vol) => (
                      <TableRow key={vol.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {vol.volunteerCode}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          <div>{vol.fullName}</div>
                          {vol.phone && (
                            <div className="text-xs font-normal text-muted-foreground">
                              {vol.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium text-foreground">
                            {vol.studentCode || (
                              <span className="text-warning font-normal italic">
                                Chưa có MSSV
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {vol.className || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-48 truncate">
                          {vol.organizationName}
                        </TableCell>
                        <TableCell>
                          {vol.userId ? (
                            <Badge variant="success">Đã liên kết</Badge>
                          ) : (
                            <Badge variant="warning">Chờ SV cập nhật</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {vol.consentFaceAuth ? (
                            <Badge variant="success" className="gap-1">
                              <ShieldCheck className="size-3" />
                              Đã đồng ý NĐ13
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-muted-foreground"
                            >
                              <ShieldAlert className="size-3" />
                              Chưa đồng ý
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center pt-3">
              <Pagination
                page={pageNumber}
                pageCount={totalPages}
                onPageChange={(p) => setPageNumber(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
