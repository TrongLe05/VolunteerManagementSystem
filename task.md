# 📋 TASK BOARD & MULTI-AGENT COORDINATION (`Antigravity` x `OpenCode`)

**Dự án:** Hệ thống Quản lý Hoạt động Tình nguyện Tích hợp Điểm danh GPS Geofencing và Nhận diện Khuôn mặt AI  
**Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học Đồng Tháp (DThU)  
**Sinh viên thực hiện:** Lê Minh Trọng  

---

## 🤝 1. QUY ƯỚC PHỐI HỢP GIỮA `ANTIGRAVITY` VÀ `OPENCODE`

Để hai AI Agent (**Antigravity** và **OpenCode**) làm việc song song trên cùng một kho mã nguồn mà không ghi đè hoặc làm hỏng code của nhau, cả hai Agent **BẮT BUỘC** tuân thủ các quy tắc sau:

### 1.1. Quy ước trạng thái Task
* `[ ]` : **Chưa thực hiện (Todo)** – Sẵn sàng để nhận.
* `[/]` : **Đang thực hiện (In Progress)** – Ghi rõ tên Agent đang nhận (ví dụ: `[/] [OpenCode]` hoặc `[/] [Antigravity]`). Agent kia **không** tự ý sửa các file thuộc task đang `[/]`.
* `[x]` : **Đã hoàn thành (Done)** – Đã kiểm tra biên dịch (`dotnet build` hoặc `npx tsc -b --noEmit`) không còn lỗi.

### 1.2. Đường dẫn & Cấu trúc thư mục thực tế
* **Root Workspace**: `D:\Workspace\VolunteerManagementSystem`
* **Backend (.NET 10, Clean Architecture + CQRS MediatR + EF Core PostgreSQL)**:
  * Lưu ý tên thư mục hiện tại: `back-end/VolunteerManagerment` (giữ nguyên tên thư mục/namespace để không làm gãy solution).
  * Các tầng:
    * `VolunteerManagerment.Domain` (Entities, Common, Enums)
    * `VolunteerManagerment.Application` (Features theo CQRS `Commands`/`Queries`/`DTOs`, `Common/Interfaces`)
    * `VolunteerManagerment.Infrastructure` (Data `ApplicationDbContext`, Repositories, Services)
    * `VolunteerManagerment.API` (Controllers, Middleware, `Program.cs`)
* **Frontend (React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + `shadcn/ui` `@base-ui/react`)**:
  * Thư mục: `front-end/src`
  * **Nguyên tắc tách file (SRP)**: Tuyệt đối không dồn nhiều component vào 1 file lớn. Mỗi file chỉ đảm nhận 1 trách nhiệm rõ ràng (`api/`, `types/`, `lib/`, `hooks/`, `components/feed/`, `components/layout/`, `pages/`).
  * Lưu ý `shadcn/ui` trong project sử dụng `@base-ui/react` (`style: "base-nova"`), dùng prop `render={<Link to="..." />}` thay vì `asChild`.

### 1.3. Quy tắc kiểm tra trước khi đánh dấu `[x]`
* **Sau khi sửa Backend**: Chạy `dotnet build` trong `back-end/VolunteerManagerment`.
* **Sau khi sửa Frontend**: Chạy `npx tsc -b --noEmit` trong `front-end`.
* Cập nhật lại trạng thái trong file `task.md` này sau khi hoàn tất mỗi đầu việc.

---

## ✅ 2. CÁC HẠNG MỤC ĐÃ HOÀN THÀNH (`DONE`)

### 2.1. Backend (.NET 10 Web API)
- [x] **Module 1 – Xác thực & Tài khoản (`Auth`)**:
  - [x] `Login`, `Register`, `RefreshToken`, `Logout`, `GetMe`, `ChangePassword`.
  - [x] Quên mật khẩu qua OTP Email (`ForgotPassword`, `VerifyOtp` tại `POST /api/auth/verify-otp`, `ResetPassword`).
  - [x] Xử lý ngoại lệ gửi mail trong `ResendEmailService.cs`.
- [x] **Module 2 – Quản lý Tổ chức Đoàn - Hội (`Organizations`)**:
  - [x] CRUD `Organizations` + Đệ quy cây phân cấp `GetSubOrganizationIdsAsync` (Recursive CTE PostgreSQL).
- [x] **Module 3 – Hồ sơ Tình nguyện viên (`Volunteers`)**:
  - [x] `GetMyProfile` (`GET /api/volunteers/me`), `UpdateMyProfile` (`PUT /api/volunteers/me` kèm `ConsentFaceAuth` Nghị định 13).
  - [x] `GetVolunteers`, `GetVolunteerById`, `ImportVolunteersFromExcel` (`POST /api/volunteers/import` bằng MiniExcel).
- [x] **Module 4 – Chiến dịch, Hoạt động & Đăng ký tham gia (`Campaigns`, `Activities`, `ActivityRegistrations`)**:
  - [x] CRUD Chiến dịch (`DRAFT`, `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`).
  - [x] CRUD Hoạt động kèm danh sách tọa độ GPS Geofence (`ActivityLocations`) (`DRAFT`, `OPEN`, `ONGOING`, `COMPLETED`, `CANCELLED`).
  - [x] Mở `[AllowAnonymous]` cho `GET /api/campaigns`, `GET /api/campaigns/{id}`, `GET /api/activities`, `GET /api/activities/{id}` (ẩn `DRAFT` đối với Khách/TNV).
  - [x] Đăng ký hoạt động (`POST /api/activities/{id}/register`), Hủy đăng ký (`DELETE /api/activities/{id}/register`), Xem danh sách đã đăng ký (`GET /api/activities/my-registrations`), Admin duyệt/từ chối (`PATCH /api/activities/{id}/registrations/{regId}/status`).

### 2.2. Frontend (React + TypeScript + Tailwind v4)
- [x] **Luồng Authentication UI**:
  - [x] `LayoutAuth.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `VerifyOtpPage.tsx`, `ChangePasswordPage.tsx`.
  - [x] Hook `usePasswordStrength.ts` kiểm tra độ mạnh mật khẩu theo thời gian thực.
- [x] **Thanh điều hướng & Layout (`Navbar.tsx`, `Avatar.tsx`)**:
  - [x] Responsive 2 tầng cho Mobile/Tablet (`< 1024px`) và Desktop (`>= 1024px`), chống tràn chữ tên đơn vị dài.
- [x] **Giao diện Khách & Tình nguyện viên (Mô hình Bảng tin Facebook + Trang chuyên biệt)**:
  - [x] Tách module rõ ràng: `volunteer.types.ts`, `activity-helpers.ts`, `activityApi.ts`, `campaignApi.ts`, `volunteerApi.ts`.
  - [x] Các component bảng tin: `GuestHeroBanner.tsx`, `FeedLeftSidebar.tsx`, `FeedFilterBar.tsx`, `FeedRightSidebar.tsx`, `ActivityPostCard.tsx`, `ActivityDetailDialog.tsx`.
  - [x] Các trang chính: `Home.tsx` (`/`), `ActivitiesPage.tsx` (`/activities`), `CampaignsPage.tsx` (`/campaigns`), `MyRegistrationsPage.tsx` (`/my-registrations`).

---

## 🚀 3. DANH SÁCH CÔNG VIỆC CẦN THỰC HIỆN (`BACKLOG / TODO`)

### Nhóm A: Xử lý Lỗi & Tinh chỉnh Nghiệp vụ Backend (Ưu tiên ngay)

- [ ] **TASK-BE-01: Tự động cập nhật trạng thái Chiến dịch & Hoạt động theo thời gian thực**
  - **Mô tả vấn đề**: Hiện tại `Activity.Status` (`OPEN`, `ONGOING`, `COMPLETED`) và `Campaign.Status` (`UPCOMING`, `ONGOING`, `COMPLETED`) lưu tĩnh trong DB, không tự chuyển thành `ONGOING` khi tới giờ bắt đầu hoặc `COMPLETED` khi đã qua `EndTime`/`EndDate`.
  - **Yêu cầu kỹ thuật**:
    1. Tạo `BackgroundService` (ví dụ: `ActivityStatusSyncBackgroundService` trong `VolunteerManagerment.Infrastructure/Services`) chạy định kỳ mỗi 1–5 phút để tự động cập nhật trạng thái trong DB:
       - `Activity`: Đang `OPEN` mà `StartTime <= UtcNow < EndTime` $\rightarrow$ `ONGOING`; Đang `OPEN` hoặc `ONGOING` mà `EndTime <= UtcNow` $\rightarrow$ `COMPLETED`.
       - `Campaign`: Đang `UPCOMING` mà `StartDate <= Today <= EndDate` $\rightarrow$ `ONGOING`; Đang `UPCOMING` hoặc `ONGOING` mà `EndDate < Today` $\rightarrow$ `COMPLETED`.
    2. Trong `RegisterForActivityCommandHandler.cs`: Kiểm tra chặt `DateTimeOffset.UtcNow >= activity.EndTime` thì chặn không cho đăng ký (kể cả khi job chạy ngầm chưa kịp quét).

- [x] **TASK-BE-02: Chuẩn hóa Phân quyền Xem & Đăng ký Hoạt động theo Tổ chức (`Scope-Based Access Control`)** *(Đã thực hiện bởi Antigravity)*
  - **Mô tả vấn đề**: Cần thống nhất quy tắc hiển thị hoạt động giữa các cấp tổ chức (Đoàn Trường, Liên chi đoàn Khoa, Chi đoàn Lớp) cho `ORGANIZATION_ADMIN`, `VOLUNTEER` và `Guest`, đồng thời kiểm tra điều kiện đơn vị khi Tình nguyện viên bấm Đăng ký tham gia.
  - **File liên quan**:
    - `GetActivitiesQueryHandler.cs`, `GetActivityByIdQueryHandler.cs`
    - `GetCampaignsQueryHandler.cs`, `GetCampaignByIdQueryHandler.cs`
    - `RegisterForActivityCommandHandler.cs`

---

### Nhóm B: Các Phân hệ Cốt lõi Khóa luận (GPS Geofencing & AI Face Verification)

- [ ] **TASK-BE-03: Module Đăng ký & Lưu trữ Khuôn mặt mẫu (`Face Enrollment`)**
  - **Yêu cầu kỹ thuật**:
    - Định nghĩa abstraction `IFaceVerificationService` / `IFaceEmbeddingService` tại `VolunteerManagerment.Application/Common/Interfaces`.
    - Kiểm tra bắt buộc `volunteer.ConsentFaceAuth == true` (Nghị định 13/2023/NĐ-CP) trước khi cho phép lưu dữ liệu sinh trắc học.
    - Xử lý nhận ảnh khuôn mặt từ TNV $\rightarrow$ Phát hiện khuôn mặt (Face Detection) $\rightarrow$ Kiểm tra chất lượng & Căn chỉnh (Alignment) $\rightarrow$ Trích xuất vector đặc trưng 512 chiều (`embedding`) $\rightarrow$ Lưu vào bảng `volunteer_face_templates`.
    - API Endpoints:
      - `POST /api/volunteers/me/face-templates` (Đăng ký/Cập nhật khuôn mặt mẫu).
      - `GET /api/volunteers/me/face-templates` (Kiểm tra trạng thái đã đăng ký khuôn mặt chưa, tuyệt đối không trả raw vector 512 chiều về Frontend).
      - `DELETE /api/volunteers/me/face-templates` (Xóa dữ liệu khuôn mặt khi rút lại sự đồng ý NĐ13).

- [ ] **TASK-BE-04: Module Quản lý Phiên Điểm danh (`AttendanceSessions`)**
  - **Yêu cầu kỹ thuật**:
    - Dành cho `SUPER_ADMIN` và `ORGANIZATION_ADMIN` (thuộc phạm vi đơn vị quản lý hoạt động).
    - Tạo phiên điểm danh (`CHECK_IN` hoặc `CHECK_OUT`) cho một `Activity` trong khung giờ cấu hình (`StartTime`, `EndTime`, `Status`).
    - API Endpoints:
      - `POST /api/activities/{id}/attendance-sessions`
      - `GET /api/activities/{id}/attendance-sessions`
      - `PUT /api/activities/{id}/attendance-sessions/{sessionId}`

- [ ] **TASK-BE-05: Module Điểm danh Hiện trường (`Attendances` – GPS Geofence + AI Face + Anti-Spoofing)**
  - **Yêu cầu kỹ thuật**:
    - Tuân thủ kiến trúc tại `AGENT.md` (Mục 10 – `Attendance architecture`):
      1. Kiểm tra TNV đã đăng ký và được duyệt (`APPROVED`) trong hoạt động chưa.
      2. Kiểm tra phiên điểm danh (`AttendanceSession`) có đang mở và nằm trong khung giờ hợp lệ không.
      3. Kiểm tra chống điểm danh trùng (`UNIQUE (attendance_session_id, activity_registration_id)`).
      4. **Xác thực vị trí GPS (`IGpsValidationService`)**: Tính khoảng cách Haversine từ tọa độ GPS hiện tại của TNV tới `ActivityLocations` (so sánh với `AllowedRadiusMeters`).
      5. **Chống giả mạo (`Anti-Spoofing`) & Xác thực Khuôn mặt (`Face Verification`)**: So khớp vector đặc trưng khuôn mặt chụp trực tiếp với `VolunteerFaceTemplates` của chính TNV đó (`Cosine Similarity`).
      6. Lưu kết quả vào bảng `attendances` kèm chính sách tự động hết hạn ảnh hiện trường (`image_expires_at`).
      7. **Tính ngày công / giờ công**: Ghi nhận hoàn thành và cộng `CreditDays` / `CreditHours` khi TNV có đủ cả 2 phiên hợp lệ (`CHECK_IN` và `CHECK_OUT`).

- [ ] **TASK-BE-06: Module Thống kê, Thành tích & Báo cáo (`Achievements & Dashboard`)**
  - **Yêu cầu kỹ thuật**:
    - API tổng hợp số giờ công, ngày công tình nguyện tích lũy của TNV (`GET /api/volunteers/me/achievements`).
    - API thống kê cho Admin Dashboard: Số lượng chiến dịch, hoạt động, tỷ lệ tham gia thực tế so với đăng ký, lịch sử điểm danh & cảnh báo gian lận.

---

### Nhóm C: Phát triển Giao diện Frontend (`React + TypeScript`)

- [ ] **TASK-FE-01: Trang Hồ sơ Cá nhân & Đăng ký Khuôn mặt (`/profile`)**
  - **File dự kiến**:
    - `front-end/src/pages/ProfilePage.tsx`
    - `front-end/src/components/profile/ProfileInfoForm.tsx`
    - `front-end/src/components/profile/FaceEnrollmentCard.tsx`
  - **Chức năng**:
    - Hiển thị và cập nhật thông tin Đoàn viên/TNV (Họ tên, MSSV, Lớp, SĐT, Ngày sinh, Giới tính).
    - Nút bật/tắt chấp thuận Nghị định 13/2023/NĐ-CP (`consentFaceAuth`).
    - Giao diện mở Webcam/Camera điện thoại chụp mẫu khuôn mặt để đăng ký FaceID.

- [ ] **TASK-FE-02: Giao diện Điểm danh Thực địa bằng GPS + Camera AI (`/activities/:id/check-in`)**
  - **File dự kiến**:
    - `front-end/src/pages/AttendanceCheckInPage.tsx`
    - `front-end/src/components/attendance/GpsStatusCard.tsx`
    - `front-end/src/components/attendance/CameraCaptureBox.tsx`
  - **Chức năng**:
    - Lấy tọa độ GPS thời gian thực (`navigator.geolocation`), hiển thị khoảng cách tới điểm tập kết và trạng thái trong/ngoài vùng Geofence.
    - Mở Camera trước, chụp ảnh trực tiếp và gửi kèm tọa độ GPS về Backend để điểm danh Check-in / Check-out.

- [ ] **TASK-FE-03: Phân hệ Quản trị dành cho Cán bộ Đoàn (`/admin/*`)**
  - **File dự kiến**:
    - `front-end/src/components/layout/AdminLayout.tsx`
    - `front-end/src/pages/admin/AdminDashboardPage.tsx`
    - `front-end/src/pages/admin/ManageOrganizationsPage.tsx`
    - `front-end/src/pages/admin/ManageCampaignsPage.tsx`
    - `front-end/src/pages/admin/ManageActivitiesPage.tsx`
    - `front-end/src/pages/admin/ManageRegistrationsPage.tsx`
    - `front-end/src/pages/admin/ManageVolunteersPage.tsx` (kèm chức năng Import Excel)
  - **Chức năng**:
    - Giao diện quản trị theo đúng phân quyền `SUPER_ADMIN` và `ORGANIZATION_ADMIN`.
