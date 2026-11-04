import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Compass,
  RefreshCw,
  RotateCcw,
  ScanFace,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import { attendanceApi } from "@/api/attendanceApi";
import type { Activity } from "@/types/volunteer.types";
import type { ActiveAttendanceSession, CheckInResult } from "@/types/attendance.types";
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
import { toast } from "@/components/ui/toaster";

interface VolunteerCheckInModalProps {
  activity: Activity;
  activeSession: ActiveAttendanceSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: CheckInResult) => void;
}

export function VolunteerCheckInModal({
  activity,
  activeSession,
  open,
  onOpenChange,
  onSuccess,
}: VolunteerCheckInModalProps) {
  // GPS state
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [startingCamera, setStartingCamera] = useState<boolean>(false);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);

  // First location target of activity
  const targetLocation = activity.locations?.[0];

  // Calculate distance using Haversine formula
  const computeDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000; // meters
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const calcA =
        sinDLat * sinDLat +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLon * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(calcA), Math.sqrt(1 - calcA));
      return Math.round(R * c);
    },
    []
  );

  // 1. Get GPS Location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setGettingLocation(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ latitude, longitude, accuracy });
        setGettingLocation(false);

        if (targetLocation) {
          const dist = computeDistance(
            latitude,
            longitude,
            targetLocation.latitude,
            targetLocation.longitude
          );
          setDistanceMeters(dist);
          setIsInsideGeofence(dist <= (targetLocation.allowedRadiusMeters || 150));
        } else {
          setIsInsideGeofence(true);
        }
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép quyền vị trí trên trình duyệt để điểm danh."
          );
        } else {
          setGpsError("Không thể lấy tọa độ vị trí hiện tại của thiết bị.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [targetLocation, computeDistance]);

  // 2. Start Camera
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
        "Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera trên trình duyệt hoặc thiết bị của bạn."
      );
    } finally {
      setStartingCamera(false);
    }
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [mediaStream]);

  // Lifecycle on modal open / close
  useEffect(() => {
    if (open) {
      setCapturedPhoto(null);
      requestLocation();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  // Capture frame from video onto hidden canvas
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front camera for natural selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Submit check-in
  const handleSubmit = async () => {
    if (!coords) {
      toast.error("Chưa xác định được tọa độ vị trí của bạn.");
      requestLocation();
      return;
    }

    if (!capturedPhoto) {
      toast.error("Vui lòng chụp ảnh selfie tại hiện trường làm bằng chứng có mặt.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await attendanceApi.checkIn({
        activityId: activity.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationAccuracyMeters: coords.accuracy,
        capturedImageBase64: capturedPhoto,
      });

      toast.success(res.message);
      onSuccess(res);
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: { detail?: string; message?: string; title?: string };
        };
      };
      toast.error(
        axiosErr.response?.data?.message ||
          axiosErr.response?.data?.detail ||
          axiosErr.response?.data?.title ||
          "Không thể gửi điểm danh. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sessionTypeLabel =
    activeSession?.type === "CHECK_IN"
      ? "Điểm danh VÀO (Check-in)"
      : "Điểm danh RA (Check-out)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScanFace className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>{sessionTypeLabel}</span>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  Phiên đang mở
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                Hoạt động: {activity.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 1. Trạng thái GPS Geofencing */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Compass className="size-3.5 text-primary" />
                Vị trí GPS tại Hiện trường:
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={requestLocation}
                disabled={gettingLocation}
                className="h-6 gap-1 text-[11px] text-primary"
              >
                <RefreshCw
                  className={`size-3 ${gettingLocation ? "animate-spin" : ""}`}
                />
                Lấy lại GPS
              </Button>
            </div>

            {gettingLocation ? (
              <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                <RefreshCw className="size-3 animate-spin text-primary" />
                <span>Đang lấy tọa độ GPS từ thiết bị...</span>
              </div>
            ) : gpsError ? (
              <div className="flex items-center gap-1.5 text-destructive text-[11px]">
                <ShieldAlert className="size-3.5 shrink-0" />
                <span>{gpsError}</span>
              </div>
            ) : coords ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isInsideGeofence ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-semibold gap-1 px-1.5 py-0"
                    >
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      Hợp lệ (Trong bán kính {targetLocation?.allowedRadiusMeters || 150}m)
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="text-[10px] font-semibold gap-1 px-1.5 py-0"
                    >
                      <ShieldAlert className="size-3" />
                      Ngoài vùng ({distanceMeters}m &gt; {targetLocation?.allowedRadiusMeters || 150}m)
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-3">
                  {distanceMeters !== null && (
                    <span>
                      Khoảng cách:{" "}
                      <strong className="text-foreground">
                        {distanceMeters} mét
                      </strong>
                    </span>
                  )}
                  {coords.accuracy && (
                    <span>
                      Sai số: ±{Math.round(coords.accuracy)}m
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* 2. Camera Selfie Chụp Ảnh Xác Thực */}
          <div className="rounded-xl border border-border bg-black/90 p-3 text-center text-white relative overflow-hidden">
            <div className="relative aspect-4/3 w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-black flex items-center justify-center">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Ảnh chụp điểm danh"
                  className="size-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="size-full object-cover -scale-x-100"
                  />
                  {/* Khung căn chỉnh khuôn mặt hình Oval */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-60 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                      <span className="text-[11px] text-white/90 bg-black/50 px-2 py-0.5 rounded-full font-medium">
                        Căn khuôn mặt vào đây
                      </span>
                    </div>
                  </div>
                </>
              )}

              {startingCamera && !capturedPhoto && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="size-6 animate-spin text-emerald-400" />
                  <span className="text-xs">Đang mở camera...</span>
                </div>
              )}

              {cameraError && !capturedPhoto && (
                <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center gap-2 text-destructive text-center">
                  <Camera className="size-8" />
                  <span className="text-xs">{cameraError}</span>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={startCamera}
                    className="mt-2 text-xs"
                  >
                    Thử lại
                  </Button>
                </div>
              )}
            </div>

            {/* Điều khiển chụp ảnh */}
            <div className="mt-3 flex items-center justify-center gap-3">
              {capturedPhoto ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetake}
                  className="text-xs bg-white/10 text-white hover:bg-white/20 border-white/20 gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Chụp lại ảnh khác
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCapture}
                  disabled={Boolean(cameraError) || startingCamera}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 px-4 shadow-md"
                >
                  <Camera className="size-4" />
                  Chụp ảnh xác nhận
                </Button>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Ghi chú tuân thủ */}
          <p className="text-[11px] text-muted-foreground text-center">
            Ảnh chụp và tọa độ GPS chỉ được lưu trữ phục vụ đối soát minh bạch
            cho hoạt động này theo quy định của Đoàn trường ĐH Đồng Tháp.
          </p>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !coords || !capturedPhoto}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
          >
            {submitting ? (
              <span>Đang gửi điểm danh...</span>
            ) : (
              <>
                <UserCheck className="size-4" />
                Xác nhận Điểm danh
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
