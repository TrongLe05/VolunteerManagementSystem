import time
import cv2
from insightface.app import FaceAnalysis

print("--- ĐANG KHỞI TẠO RETINAFACE TỐI ƯU CHO CPU ---")

# 1. Khởi tạo app với gói mô hình siêu nhẹ buffalo_sc
# providers=['CPUExecutionProvider']: Ép buộc chạy tối ưu trên CPU
app = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])

# det_size=(320, 320): Kích thước vàng giúp CPU tính toán cực nhanh
app.prepare(ctx_id=0, det_size=(320, 320))

print("Khởi tạo hoàn tất! Đang kết nối camera...")
# 2. Mở Camera (Webcam mặc định 0)
# (Nếu bạn dùng video test, thay số 0 bằng "images/sample.mp4")
cap = cv2.VideoCapture(0)

# Cấu hình camera độ phân giải 640x480 (chuẩn nét và nhẹ)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Xả hàng đợi để không bao giờ bị delay

if not cap.isOpened():
    print("Không thể mở camera! Vui lòng kiểm tra lại thiết bị.")
    exit()

print("Camera đã sẵn sàng! Bấm phím 'q' trên bàn phím để thoát.\n")

prev_time = time.time()

# 3. Vòng lặp đọc và xử lý từng khung hình
while True:
    ret, frame = cap.read()
    if not ret:
        print("Không nhận được dữ liệu từ camera.")
        break

    # 4. Gọi RetinaFace phát hiện khuôn mặt
    # app.get() tự động làm: Phát hiện + Bounding Box + 5 Landmarks

    faces = app.get(frame)

    # 5. Vẽ kết quả lên từng khuôn mặt tìm được
    for face in faces:
        # Lấy Bounding Box [x1, y1, x2, y2]
        bbox = face.bbox.astype(int)
        cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)

        # Lấy 5 điểm mốc vàng (Landmarks)
        landmarks = face.kps.astype(int)
        for pt in landmarks:
            cv2.circle(frame, (pt[0], pt[1]), 3, (0, 0, 255), -1)

    # 6. Đo và tính toán chỉ số FPS thực tế trên CPU
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time)
    prev_time = curr_time

    # Hiển thị FPS lên góc trên bên trái màn hình
    cv2.putText(frame, f"CPU FPS: {fps:.1f}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # 7. Hiển thị cửa sổ video
    cv2.imshow("RetinaFace Realtime on CPU (Optimized)", frame)

    # Bấm 'q' để dừng
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 8. Giải phóng camera
cap.release()
cv2.destroyAllWindows()
