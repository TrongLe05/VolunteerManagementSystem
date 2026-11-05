import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Hash,
  Phone,
  User,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

import { useAuth } from "@/context/AuthContext";
import { volunteerApi, type UpdateMyProfileRequest } from "@/api/volunteerApi";
import type { VolunteerProfile } from "@/types/volunteer.types";
import { FaceBiometricEnrollmentSection } from "@/components/profile/FaceBiometricEnrollmentSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHead } from "@/components/blocks/shell/page-chrome";
import { toast } from "@/components/ui/toaster";
import { ProfileSkeleton } from "@/components/common/Skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { SquareUser, Image } from "lucide-react";

export function ProfilePage() {
  const { user, updateAvatar } = useAuth();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAvatarUpdate, setIsAvatarUpdate] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [className, setClassName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string>("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [consentFaceAuth, setConsentFaceAuth] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await volunteerApi.getMyProfile();
      setProfile(data);
      setFullName(data.fullName || user?.username || "");
      setStudentCode(data.studentCode || "");
      setClassName(data.className || "");
      setPhone(data.phone || "");
      setGender(data.gender || "MALE");
      setDateOfBirth(data.dateOfBirth || "");
      setConsentFaceAuth(Boolean(data.consentFaceAuth));
      setAvatarFile(null);
    } catch {
      toast.error("Không thể tải thông tin hồ sơ tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }

    setIsSubmitting(true);
    const payload: UpdateMyProfileRequest = {
      fullName: fullName.trim(),
      studentCode: studentCode.trim() || null,
      className: className.trim() || null,
      phone: phone.trim() || null,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      consentFaceAuth,
    };

    try {
      await volunteerApi.updateMyProfile(payload);
      await fetchProfile();
      toast.success("Cập nhật thông tin tài khoản thành công!");
    } catch (err: unknown) {
      let msg = "Có lỗi xảy ra khi lưu thông tin.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        msg = data?.message || data?.detail || data?.title || msg;
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      await updateAvatar(avatarFile);
      await fetchProfile();
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err: unknown) {
      let msg = "Có lỗi xảy ra khi lưu ảnh đại diện.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        msg = data?.message || data?.detail || data?.title || msg;
      }
      toast.error(msg);
    } finally {
      setIsFormOpen(false);
      setAvatarFile(null);
    }
  };

  const isProfileIncomplete = !profile?.studentCode;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-6 px-4 space-y-6">
        <PageHead
          title="Hồ sơ Tài khoản Sinh viên"
          description="Quản lý thông tin định danh, MSSV và liên kết hồ sơ Đoàn trường"
        />
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-4xl py-6 px-4 space-y-6">
        <PageHead
          title="Hồ sơ Tài khoản Sinh viên"
          description="Quản lý thông tin định danh, MSSV và liên kết hồ sơ Đoàn trường"
        />

        {/* Banner cảnh báo DThU Alert nếu chưa cập nhật MSSV */}
        {isProfileIncomplete && (
          <Alert variant="warning">
            <AlertCircle className="size-5" />
            <AlertTitle>Hồ sơ tình nguyện viên chưa hoàn thiện!</AlertTitle>
            <AlertDescription>
              Bạn cần cập nhật <strong>Mã số sinh viên (MSSV)</strong> bên dưới
              để hệ thống tự động liên kết với hồ sơ Đoàn trường và mở khóa
              quyền đăng ký tham gia các hoạt động tình nguyện.
            </AlertDescription>
          </Alert>
        )}

        {/* Card Header Thông tin tổng quan */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl font-bold text-primary-foreground shadow-sm">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Avatar className="size-12">
                          <AvatarImage src={user?.avatarUrl} alt={fullName} />
                          <AvatarFallback>
                            {fullName
                              ? fullName.slice(0, 2).toUpperCase()
                              : "TN"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => {
                            {
                              setIsFormOpen(true);
                              setIsAvatarUpdate(false);
                            }
                          }}
                        >
                          <SquareUser />
                          Xem ảnh đại diện
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setIsAvatarUpdate(true);
                            setIsFormOpen(true);
                          }}
                        >
                          <Image />
                          Thay đổi ảnh đại diện
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">
                      {fullName || user?.username}
                    </h2>
                    {profile?.studentCode ? (
                      <Badge variant="success" className="gap-1 font-medium">
                        <CheckCircle2 className="size-3" />
                        Đã liên kết MSSV: {profile.studentCode}
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="font-medium">
                        Chưa liên kết MSSV
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>@{user?.username}</span>
                    <span>•</span>
                    <span>{user?.email}</span>
                  </p>
                </div>
              </div>

              {profile?.volunteerCode && (
                <div className="rounded-xl border border-border bg-secondary p-2.5 text-right self-start sm:self-auto">
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">
                    Mã thẻ Tình nguyện viên
                  </div>
                  <div className="font-mono text-xs font-bold text-primary">
                    {profile.volunteerCode}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Cập nhật thông tin tài khoản */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Thông tin Cá nhân & Hồ sơ Sinh viên
            </CardTitle>
            <CardDescription className="text-xs">
              Thiết lập thông tin cá nhân chính xác để Đoàn trường xét duyệt hồ
              sơ và cấp chứng nhận hoàn thành hoạt động.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold">
                    Họ và tên sinh viên{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Lê Minh Trọng"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="studentCode"
                    className="text-xs font-semibold"
                  >
                    Mã số sinh viên (MSSV){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="studentCode"
                      value={studentCode}
                      onChange={(e) =>
                        setStudentCode(e.target.value.toUpperCase())
                      }
                      placeholder="VD: 0021410123"
                      className="pl-9 font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hệ thống sẽ tự động liên kết với hồ sơ nếu Đoàn trường đã
                    import từ Excel.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="className" className="text-xs font-semibold">
                    Lớp sinh hoạt
                  </Label>
                  <Input
                    id="className"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="VD: ĐH CNTT 21A"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Số điện thoại
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-semibold">
                    Giới tính
                  </Label>
                  <Select
                    value={gender}
                    onValueChange={(val) => setGender(val || "MALE")}
                  >
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="dateOfBirth"
                    className="text-xs font-semibold"
                  >
                    Ngày sinh
                  </Label>
                  <DatePicker
                    value={dateOfBirth ? new Date(dateOfBirth) : undefined}
                    onChange={(d) =>
                      setDateOfBirth(d ? format(d, "yyyy-MM-dd") : "")
                    }
                    placeholder="Chọn ngày sinh..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Đơn vị Đoàn - Hội
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      value={
                        profile?.organizationName ||
                        user?.organizationName ||
                        "Chưa gán đơn vị"
                      }
                      disabled
                      className="pl-9 bg-secondary text-foreground"
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thông tin tài khoản"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Khối Sinh trắc học & Nghị định 13/2023/NĐ-CP (Step B) */}
        <FaceBiometricEnrollmentSection
          profile={profile}
          onProfileUpdated={fetchProfile}
        />
      </div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isAvatarUpdate ? "Cập nhật ảnh đại diện" : "Xem ảnh đại diện"}
            </DialogTitle>
            {isAvatarUpdate && (
              <DialogDescription>
                Chọn ảnh đại diện mới từ máy tính của bạn. Ảnh sẽ được tải lên
                và cập nhật ngay lập tức.
              </DialogDescription>
            )}
          </DialogHeader>
          {isAvatarUpdate ? (
            <div className="flex items-center justify-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Ảnh đại diện"
                  className="max-h-96 rounded-lg"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <span className="text-sm">Chưa có ảnh đại diện</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={() => handleAvatarUpload()}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
