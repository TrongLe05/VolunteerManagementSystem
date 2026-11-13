import { useMemo, useState } from "react";
import {
  Bot,
  Calendar,
  Check,
  Copy,
  FileCode,
  Globe,
  Layers,
  Table as TableIcon,
  User,
  UserX,
} from "lucide-react";

import type { AuditLogItem } from "@/types/auditLog.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminAuditLogDetailDialogProps {
  log: AuditLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminAuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AdminAuditLogDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "json">("diff");
  const [copied, setCopied] = useState(false);

  // Parse JSON an toàn
  const oldParsed = useMemo<Record<string, unknown> | null>(() => {
    if (!log?.oldValues) return null;
    try {
      return JSON.parse(log.oldValues);
    } catch {
      return null;
    }
  }, [log?.oldValues]);

  const newParsed = useMemo<Record<string, unknown> | null>(() => {
    if (!log?.newValues) return null;
    try {
      return JSON.parse(log.newValues);
    } catch {
      return null;
    }
  }, [log?.newValues]);

  // Danh sách các key thay đổi (cho trường hợp UPDATE)
  const diffKeys = useMemo<string[]>(() => {
    const keys = new Set<string>();
    if (oldParsed) Object.keys(oldParsed).forEach((k) => keys.add(k));
    if (newParsed) Object.keys(newParsed).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [oldParsed, newParsed]);

  const resolvedActorType = log
    ? log.actorType ||
      (log.userId || log.userEmail
        ? "USER"
        : log.ipAddress
          ? "ANONYMOUS"
          : "SYSTEM")
    : "SYSTEM";

  const handleCopyJson = () => {
    if (!log) return;
    const payload = {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorType: resolvedActorType,
      userEmail: log.userEmail,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      oldValues: oldParsed,
      newValues: newParsed,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "true (Có)" : "false (Không)";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
            TẠO MỚI (CREATE)
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">
            CẬP NHẬT (UPDATE)
          </Badge>
        );
      case "DELETE":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold">
            XOÁ (DELETE)
          </Badge>
        );
      case "LOGIN":
        return (
          <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-semibold">
            ĐĂNG NHẬP (LOGIN)
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="font-semibold text-lg text-slate-900">
                Chi tiết sự kiện kiểm toán
              </DialogTitle>
              {getActionBadge(log.action)}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={activeTab === "diff" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setActiveTab("diff")}
              >
                <TableIcon className="size-3.5" />
                Bảng so sánh
              </Button>
              <Button
                variant={activeTab === "json" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setActiveTab("json")}
              >
                <FileCode className="size-3.5" />
                JSON thô
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs ml-1"
                onClick={handleCopyJson}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Sao chép
                  </>
                )}
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Mã định danh nhật ký:{" "}
            <code className="text-slate-700 font-mono bg-slate-100 px-1 py-0.5 rounded">
              {log.id}
            </code>
          </DialogDescription>
        </DialogHeader>

        {/* Thông tin Meta */}
        <div className="p-5 border-b bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Layers className="size-3.5" /> Thực thể
            </span>
            <span className="font-semibold text-slate-800">
              {log.entityType}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <User className="size-3.5" /> Người thực hiện
            </span>
            {resolvedActorType === "USER" && log.userEmail ? (
              <span
                className="font-semibold text-slate-800 truncate"
                title={log.userEmail}
              >
                {log.userEmail}
              </span>
            ) : resolvedActorType === "ANONYMOUS" ? (
              <span
                className="inline-flex items-center gap-1 font-semibold text-amber-700"
                title="Yêu cầu HTTP chưa đăng nhập (Anonymous)"
              >
                <UserX className="size-3.5 text-amber-600" />
                Anonymous
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 font-semibold text-indigo-700"
                title="Tác vụ tự động của hệ thống (Background Worker / System)"
              >
                <Bot className="size-3.5 text-indigo-600" />
                Hệ thống
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Globe className="size-3.5" /> Địa chỉ IP
            </span>
            <span className="font-semibold font-mono text-slate-800">
              {log.ipAddress || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="size-3.5" /> Thời gian
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(log.createdAt).toLocaleString("vi-VN")}
            </span>
          </div>

          {log.entityId && (
            <div className="col-span-2 sm:col-span-4 pt-1 flex items-center gap-2 text-slate-600">
              <span className="text-slate-400">Entity ID:</span>
              <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                {log.entityId}
              </code>
            </div>
          )}
        </div>

        {/* Nội dung thay đổi (Body) */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30">
          {activeTab === "diff" ? (
            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-1/4">Thuộc tính (Trường)</th>
                    <th className="py-2.5 px-3 w-[37.5%]">
                      {log.action === "CREATE"
                        ? "Dữ liệu ban đầu"
                        : "Giá trị trước khi sửa (Cũ)"}
                    </th>
                    <th className="py-2.5 px-3 w-[37.5%]">
                      {log.action === "DELETE"
                        ? "Trạng thái sau xoá"
                        : "Giá trị sau khi sửa (Mới)"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diffKeys.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-slate-400 italic"
                      >
                        Không có chi tiết trường thay đổi cụ thể
                      </td>
                    </tr>
                  ) : (
                    diffKeys.map((key) => {
                      const oldVal = oldParsed ? oldParsed[key] : undefined;
                      const newVal = newParsed ? newParsed[key] : undefined;
                      const isChanged = oldVal !== newVal;

                      return (
                        <tr
                          key={key}
                          className={
                            isChanged
                              ? "bg-amber-50/40 hover:bg-amber-50/70"
                              : "hover:bg-slate-50/50"
                          }
                        >
                          <td className="py-2 px-3 font-medium text-slate-700 font-mono">
                            {key}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-mono break-all">
                            {oldVal !== undefined ? (
                              <span
                                className={
                                  isChanged && log.action === "UPDATE"
                                    ? "text-rose-600 line-through bg-rose-50 px-1 py-0.5 rounded"
                                    : ""
                                }
                              >
                                {formatValue(oldVal)}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-mono break-all">
                            {newVal !== undefined ? (
                              <span
                                className={
                                  isChanged && log.action === "UPDATE"
                                    ? "text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded"
                                    : ""
                                }
                              >
                                {formatValue(newVal)}
                              </span>
                            ) : log.action === "DELETE" ? (
                              <span className="text-rose-500 italic">
                                [Đã xoá]
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Old Values (JSON)
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[350px]">
                  {log.oldValues
                    ? JSON.stringify(oldParsed, null, 2)
                    : "null"}
                </pre>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  New Values (JSON)
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[350px]">
                  {log.newValues
                    ? JSON.stringify(newParsed, null, 2)
                    : "null"}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3.5 px-5 border-t bg-slate-50 flex items-center justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
