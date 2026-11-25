**Ghi chú công việc**



- [x] trả thêm urlAvt cho endpoint auth/me
- [x] sửa giao diện cột thông tin tài khoản bên trái trang chủ
- [x] trả thêm số lượng tình nguyện viên đã đăng ký hoạt động để hiển thị lên thanh tiến trình đăng ký
- [x] thêm nút xem, cập nhật ảnh đại diện tài khoản
- [x] tạo thêm trang chi tiết hoạt động như trên trang tình nguyện số
- [x] chỉnh sửa lại sidebar giao diện dashboard admin
- [x] chỉnh sửa lại giao diện các chức năng admin
- [x] sửa lỗi các input trong trang admin đang lỗi
- [x] thêm chức năng quản lý tài khoản cho admin
- [x] làm chức năng mở phiên check-in / điểm danh
- [x] làm chức năng điểm danh cho tình nguyện viên (chưa ghép model)
- [ ] làm model nhận diện khuôn mặt
- [ ] ghi nhận và tích lỹ ngày công
- [x] làm các endpoint thống kê cho dashboard admin
- [x] Hoạt động và Chiến dịch đến giờ bắt đầu/kết thúc vẫn chưa tự động chuyển trạng thái
- [x] hoạt động chưa đến giờ bắt đầu nhưng vẫn bấm điểm danh được
- [ ] báo cáo nghi vấn gian lận 
- [ ] giao diện hoạt động của tôi nút điểm danh bấm vào là cho điểm danh khi chưa tạo đợt điểm danh
- [ ] nếu một trong 2 phiên điểm danh bị từ chối thì vẫn để đủ 2 buổi ở phần điểm danh của admin
- [ ] khi đã điểm danh đủ 2 lần nhưng vẫn hiện điểm danh 
- [ ] chưa ghi nhận ngày công 
- [ ] Thông báo Đẩy
- [ ] tối ưu hoá đăng nhập cho nhanh 
- [x] giao diện đăng nhập mobile bị tràn do nút của google
- [x] điểm danh nếu trạng thái đơn đăng ký chưa được duyệt vẫn có thể điểm danh được

- [x] làm audit log dùng serilog ( cần chỉnh sửa lại tí )
- [x] hoạt động và chiến dịch đã hoàn thành cần disable thao tác
- [x] sửa lại 2 ô chọn ngày ở audit log
- [x] avt trong menu mobile không lấy được avt
- [x] các hoạt động nằm ngoài quản lý của role ORGANIZATION_ADMIN vẫn hiển thị 
- [x] OAuth2.0 Google
- [x] lỗi production chặn đăng nhập google



- [x] Phân tách rõ định danh "Hệ thống" và "Anonymous":
  - Tách riêng tài khoản/dịch vụ nền (`System Service` / `Background Job`) với người dùng vãng lai chưa đăng nhập (`Anonymous`).
  - Kiểm tra lại phân quyền (Authorization) của API update ở dòng đầu tiên để đảm bảo `Anonymous` không bị lộ quyền gọi nhầm API chỉnh sửa dữ liệu.  
   **Tối ưu hóa "Bão Log" (Log Flooding):**
  - Gom nhóm các hành động nhỏ lẻ xảy ra cùng một thời điểm (ví dụ: chuỗi xóa/tạo mới `UserRole` và `User` tại cùng một giây `13:54:17`) thành một **Transaction/Operation ID** chung.
  - Gộp các thay đổi liên quan trong cùng một cú click chuột của người dùng vào chung một modal `Chi tiết` thay vì tách quá nhiều dòng rời rạc.
- [ ] Cải thiện hiển thị Mã ID thực thể:
  - Bổ sung tính năng **Tooltip** (hiển thị đầy đủ chuỗi UUID khi rê chuột vào) hoặc copy nhanh mã ID đầy đủ khi bấm vào cột *Mã ID thực thể*.
- [ ] Bổ sung Trace ID / Request ID (Tùy chọn nâng cao):
  - Thêm trường `Trace ID` để dễ dàng liên kết từ bản ghi Audit Log sang Application Log/Error Log khi cần debug hệ thống.


