import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ScanFace,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { volunteerApi, type UpdateMyProfileRequest } from "@/api/volunteerApi";
import type { VolunteerProfile } from "@/types/volunteer.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";

interface FaceBiometricEnrollmentSectionProps {
  profile: VolunteerProfile | null;
  onProfileUpdated: () => Promise<void> | void;
}

// Helper to convert canvas dataURL to standard File for upload
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function FaceBiometricEnrollmentSection({
  profile,
  onProfileUpdated,
}: FaceBiometricEnrollmentSectionProps) {
  const { user, updateAvatar } = useAuth();

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Modal flow state
  const [currentStep, setCurrentStep] = useState<"CONSENT" | "CAPTURE">(
    "CONSENT",
  );
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      setStartingCamera(true);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError(
        "Không thể mở camera. Vui lòng cho phép quyền truy cập camera trên trình duyệt của bạn.",
      );
    } finally {
      setStartingCamera(false);
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [mediaStream]);

  // Clean up stream on modal close or unmount
  useEffect(() => {
    if (!isEnrollModalOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCurrentStep("CONSENT");
      setHasAgreedTerms(false);
    }
  }, [isEnrollModalOpen, stopCamera]);

  // Switch to capture step & start camera
  const handleProceedToCapture = () => {
    if (!hasAgreedTerms) {
      toast.warning(
        "Vui lòng đọc và tích chọn đồng ý điều khoản xử lý dữ liệu.",
      );
      return;
    }
    setCurrentStep("CAPTURE");
    startCamera();
  };

  // Capture frame from video onto hidden canvas
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally for natural mirror feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Save Biometric Face Profile & Opt-in Consent
  const handleSaveEnrollment = async () => {
    if (!capturedPhoto) {
      toast.error("Vui lòng chụp ảnh khuôn mặt trước khi lưu.");
      return;
    }

    if (!profile) return;

    try {
      setSavingEnrollment(true);

      // 1. Convert snapshot to file and upload as user avatar / reference biometric image
      const photoFile = dataURLtoFile(
        capturedPhoto,
        `face-ref-${Date.now()}.jpg`,
      );
      await updateAvatar(photoFile);

      // 2. Update volunteer profile with consentFaceAuth = true
      const payload: UpdateMyProfileRequest = {
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        className: profile.className,
        studentCode: profile.studentCode,
        consentFaceAuth: true,
      };

      await volunteerApi.updateMyProfile(payload);
      await onProfileUpdated();

      toast.success(
        "Đã đăng ký khuôn mặt mẫu và ghi nhận sự đồng ý hợp lệ theo Nghị định 13/2023/NĐ-CP!",
      );
      setIsEnrollModalOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      toast.error(
        axiosErr.response?.data?.detail ||
          axiosErr.response?.data?.message ||
          "Không thể lưu dữ liệu sinh trắc học. Vui lòng thử lại.",
      );
    } finally {
      setSavingEnrollment(false);
    }
  };

  // Revoke Consent & Opt-out
  const handleRevokeConsent = async () => {
    if (!profile) return;

    try {
      setIsRevoking(true);
      const payload: UpdateMyProfileRequest = {
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        className: profile.className,
        studentCode: profile.studentCode,
        consentFaceAuth: false,
      };

      await volunteerApi.updateMyProfile(payload);
      await onProfileUpdated();

      toast.info(
        "Đã hủy kích hoạt xác thực sinh trắc học. Bạn có thể sử dụng phương thức điểm danh thủ công tại sự kiện.",
      );
      setIsRevokeConfirmOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      toast.error(
        axiosErr.response?.data?.detail ||
          axiosErr.response?.data?.message ||
          "Không thể rút lại sự đồng ý lúc này.",
      );
    } finally {
      setIsRevoking(false);
    }
  };

  const isEnrolled = Boolean(profile?.consentFaceAuth);
  const consentDateFormatted = profile?.consentGivenAt
    ? format(new Date(profile.consentGivenAt), "dd/MM/yyyy HH:mm")
    : null;

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <ScanFace className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Sinh trắc học & Bảo vệ Dữ liệu Cá nhân
              </CardTitle>
              <CardDescription className="text-xs">
                Cơ chế xác thực khuôn mặt minh bạch theo Nghị định 13/2023/NĐ-CP
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-blue-400/50 bg-blue-50/70 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-semibold"
          >
            Nghị định 13/2023/NĐ-CP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Trạng thái hiện tại của Tình nguyện viên */}
        <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`relative flex size-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden border shadow-sm ${
                  isEnrolled
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                    : "border-slate-300 bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Khuôn mặt mẫu"
                    className="size-full object-cover"
                  />
                ) : (
                  <ScanFace
                    className={`size-7 ${
                      isEnrolled ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                )}

                {isEnrolled && (
                  <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 py-0.5 text-[9px] text-center text-white font-bold uppercase tracking-wider">
                    Đã duyệt
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">
                    Trạng thái nhận diện khuôn mặt
                  </span>
                  {isEnrolled ? (
                    <Badge
                      variant="success"
                      className="gap-1 font-semibold text-xs"
                    >
                      <ShieldCheck className="size-3" />
                      Đã kích hoạt hợp lệ
                    </Badge>
                  ) : (
                    <Badge
                      variant="warning"
                      className="gap-1 font-semibold text-xs"
                    >
                      <AlertTriangle className="size-3" />
                      Chưa kích hoạt
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isEnrolled
                    ? `Đã xác nhận sự đồng ý hợp lệ vào lúc ${
                        consentDateFormatted || "hệ thống"
                      }. Khuôn mặt mẫu đã sẵn sàng cho các phiên điểm danh.`
                    : "Bạn chưa đăng ký khuôn mặt mẫu. Hãy hoàn thành quy trình chấp thuận theo Nghị định 13 để sử dụng điểm danh nhanh."}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2.5">
              {isEnrolled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentStep("CAPTURE");
                      setIsEnrollModalOpen(true);
                      startCamera();
                    }}
                    className="text-xs font-semibold gap-1.5"
                  >
                    <Camera className="size-3.5" />
                    Chụp lại ảnh mẫu
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRevokeConfirmOpen(true)}
                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Rút lại sự đồng ý
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 shadow-xs"
                >
                  <ScanFace className="size-4" />
                  Đọc quy chế & Đăng ký khuôn mặt
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* MODAL ĐĂNG KÝ KHUÔN MẶT MẪU & CHẤP THUẬN NGHỊ ĐỊNH 13 */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="max-w-xl p-5">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-primary">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ScanFace className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {currentStep === "CONSENT"
                    ? "Bản Thỏa Thuận Chấp Thuận Dữ Liệu Cá Nhân"
                    : "Chụp Ảnh Khuôn Mặt Mẫu Đối Soát"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* BƯỚC 1: ĐIỀU KHOẢN CHẤP THUẬN NGHỊ ĐỊNH 13 */}
          {currentStep === "CONSENT" && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/40 p-4 space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
                <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Shield className="size-4" />
                  Thông báo về việc thu thập và xử lý dữ liệu sinh trắc học:
                </p>
                <div className="space-y-2 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 pl-1">
                  <p>
                    <strong>1. Loại dữ liệu:</strong> Hình ảnh nhận diện khuôn
                    mặt trực diện (Dữ liệu cá nhân nhạy cảm quy định tại Điều 2
                    Nghị định 13/2023/NĐ-CP).
                  </p>
                  <p>
                    <strong>2. Mục đích xử lý:</strong> Phục vụ việc xác thực
                    danh tính minh bạch, phòng ngừa điểm danh hộ hoặc gian lận
                    vị trí tại các hoạt động và chiến dịch tình nguyện Đoàn
                    trường ĐH Đồng Tháp.
                  </p>
                  <p>
                    <strong>3. Cam kết bảo mật:</strong> Dữ liệu được mã hóa và
                    lưu trữ an toàn trên hệ thống. Tuyệt đối không chuyển giao,
                    mua bán cho bên thứ ba hoặc sử dụng vào mục đích thương mại.
                  </p>
                  <p>
                    <strong>4. Quyền của chủ thể dữ liệu:</strong> Bạn có quyền
                    xem, chụp lại, hoặc rút lại sự đồng ý bất kỳ lúc nào. Nếu
                    không đồng ý, bạn vẫn có quyền tham gia hoạt động và được
                    điểm danh bằng phương thức thủ công qua Giám sát viên.
                  </p>
                </div>
              </div>

              {/* Checkbox xác nhận rõ ràng */}
              <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-card">
                <Checkbox
                  id="agree-decree-13"
                  checked={hasAgreedTerms}
                  onCheckedChange={(checked) =>
                    setHasAgreedTerms(Boolean(checked))
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor="agree-decree-13"
                  className="text-xs text-foreground leading-normal cursor-pointer font-medium select-none"
                >
                  Tôi đã đọc kỹ, hiểu rõ các quyền lợi theo Nghị định
                  13/2023/NĐ-CP và tự nguyện đồng ý cho phép Nhà trường thu
                  thập, xử lý ảnh khuôn mặt để đối soát điểm danh hoạt động tình
                  nguyện.
                </label>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  size="sm"
                  onClick={handleProceedToCapture}
                  disabled={!hasAgreedTerms}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <Camera className="size-4" />
                  Tiếp tục: Bật Camera chụp ảnh
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* BƯỚC 2: CHỤP ẢNH MẪU VỚI KHUNG BẦU DỤC (OVAL) */}
          {currentStep === "CAPTURE" && (
            <div className="space-y-4 pt-2">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-black shadow-inner flex items-center justify-center">
                {/* Hidden canvas for snapshot */}
                <canvas ref={canvasRef} className="hidden" />

                {capturedPhoto ? (
                  /* Ảnh đã chụp preview */
                  <img
                    src={capturedPhoto}
                    alt="Ảnh mẫu chụp được"
                    className="size-full object-cover"
                  />
                ) : (
                  /* Video stream */
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="size-full object-cover transform -scale-x-100"
                  />
                )}

                {/* Khung hướng dẫn hình bầu dục (Face Oval Guide) */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className={`size-60 sm:size-64 rounded-[50%] border-2 transition-all duration-300 ${
                      capturedPhoto
                        ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                        : "border-dashed border-white/80 bg-black/10 animate-pulse"
                    }`}
                  />
                  <div className="mt-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    {capturedPhoto
                      ? "✓ Đã chụp ảnh thành công"
                      : "Đặt khuôn mặt của bạn khớp với khung bầu dục"}
                  </div>
                </div>

                {/* Overlay loading camera */}
                {startingCamera && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-2">
                    <RefreshCw className="size-6 animate-spin text-blue-400" />
                    <span className="text-xs">Đang mở camera...</span>
                  </div>
                )}

                {/* Error overlay */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white gap-3">
                    <ShieldAlert className="size-8 text-rose-400" />
                    <p className="text-xs text-rose-200">{cameraError}</p>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={startCamera}
                      className="border-white/30 text-white hover:bg-white/20 text-xs"
                    >
                      Thử lại
                    </Button>
                  </div>
                )}
              </div>

              {/* Lưu ý khi chụp */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-[11px] text-muted-foreground border border-border">
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Đảm bảo nơi có đủ ánh sáng, không bị ngược sáng.</li>
                  <li>Không đeo khẩu trang hoặc kính râm che khuất mắt.</li>
                  <li>Nhìn thẳng vào camera, giữ nét mặt tự nhiên.</li>
                </ul>
              </div>

              <DialogFooter className="gap-2 pt-2">
                {capturedPhoto ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRetake}
                      disabled={savingEnrollment}
                      className="gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      Chụp lại
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEnrollment}
                      disabled={savingEnrollment}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                    >
                      {savingEnrollment ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          Đang lưu hồ sơ...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Xác nhận & Lưu khuôn mặt mẫu
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEnrollModalOpen(false)}
                      disabled={startingCamera}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCapture}
                      disabled={startingCamera || Boolean(cameraError)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                    >
                      <Camera className="size-4" />
                      Chụp ảnh khuôn mặt
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* HỘP THOẠI XÁC NHẬN RÚT LẠI SỰ ĐỒNG Ý */}
      <ConfirmDialog
        open={isRevokeConfirmOpen}
        onOpenChange={setIsRevokeConfirmOpen}
        title="Rút lại sự đồng ý & Hủy dữ liệu sinh trắc học"
        description="Theo Điều 9 Nghị định 13/2023/NĐ-CP, bạn có toàn quyền rút lại sự đồng ý bất kỳ lúc nào. Sau khi rút lại, hệ thống sẽ hủy xác thực khuôn mặt tự động. Bạn vẫn có thể điểm danh tham gia hoạt động thông qua Giám sát viên sự kiện."
        confirmLabel="Xác nhận rút lại sự đồng ý"
        cancelLabel="Giữ lại"
        variant="destructive"
        loading={isRevoking}
        onConfirm={handleRevokeConsent}
      />
    </Card>
  );
}
