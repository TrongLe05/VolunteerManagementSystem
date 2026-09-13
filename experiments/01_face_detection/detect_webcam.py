import time
import cv2
import numpy as np
import onnxruntime as ort

# =========================================================================
# 1. CẤU HÌNH THIẾT BỊ (ƯU TIÊN GPU NVIDIA CUDA)
# =========================================================================
available_providers = ort.get_available_providers()
print("Các Provider có sẵn trên hệ thống:", available_providers)

# Nếu có 'CUDAExecutionProvider' (NVIDIA GPU), ưu tiên dùng hàng đầu
if 'CUDAExecutionProvider' in available_providers:
    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
    device_info = "GPU (NVIDIA CUDA)"
else:
    providers = ['CPUExecutionProvider']
    device_info = "CPU (Fallback)"

print(f"==> Thiết bị đang sử dụng để nhận diện: {device_info}")

# =========================================================================
# 2. KHỞI TẠO MÔ HÌNH RETINAFACE ONNX
# =========================================================================
# (Đảm bảo file weights/retinaface_mobilenet025.onnx đã được tải về)
model_path = "weights/retinaface_mobilenet025.onnx"

try:
    session = ort.InferenceSession(model_path, providers=providers)
    input_name = session.get_inputs()[0].name
except Exception as e:
    print(f"Lỗi khi load model ONNX: {e}")
    print("Hãy chắc chắn bạn đã chạy file download_model.py thành công!")
    exit()

# =========================================================================
# 3. MỞ WEBCAM (TỐI ƯU HÓA TỐC ĐỘ, KHÔNG DELAY)
# =========================================================================
# 0 là webcam mặc định (trên laptop sẽ tự mở webcam trước mặt)
cap = cv2.VideoCapture(0)

# Cấu hình độ phân giải chuẩn 640x480 (vừa nét vừa mượt 60 FPS trên RTX 3050)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
# Giảm bộ đệm xuống 1 frame để cử động không bao giờ bị trễ
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    print("Không tìm thấy Webcam! Hãy kiểm tra kết nối camera.")
    exit()

print("\n--- BẮT ĐẦU STREAM CAMERA ---")
print("Bấm phím 'q' trên bàn phím để dừng chương trình.\n")

prev_time = time.time()

# =========================================================================
# 4. VÒNG LẶP XỬ LÝ THEO THỜI GIAN THỰC (REALTIME LOOP)
# =========================================================================
while True:
    ret, frame = cap.read()
    if not ret:
        print("Không đọc được dữ liệu từ camera.")
        break

    h, w, _ = frame.shape

    # Tiền xử lý ảnh cho RetinaFace MobileNet:
    # 1. Resize về kích thước đầu vào mô hình (thường là 640x640)
    input_img = cv2.resize(frame, (640, 640))
    # 2. Chuẩn hóa ma trận (Normalize)
    input_img = input_img.astype(np.float32)
    # Trừ giá trị trung bình màu BGR chuẩn của ImageNet
    input_img -= np.array([104.0, 117.0, 123.0], dtype=np.float32)
    # 3. Chuyển vị trí trục từ [H, W, C] sang [1, C, H, W] để đưa vào mô hình
    input_tensor = np.transpose(input_img, (2, 0, 1))
    input_tensor = np.expand_dims(input_tensor, axis=0)

    # ----------------- INFERENCE TRÊN GPU / CPU -----------------
    # outputs trả về 3 thành phần: Bounding Boxes, Class Confidence, Landmarks
    outputs = session.run(None, {input_name: input_tensor})

    # (Tại đây các outputs thô đã được tính toán với tốc độ cực cao trên GPU)
    # -------------------------------------------------------------

    # Tính toán chỉ số FPS thực tế
    current_time = time.time()
    fps = 1.0 / (current_time - prev_time)
    prev_time = current_time

    # Hiển thị thông số FPS và Thiết bị lên góc trên màn hình
    info_text = f"FPS: {fps:.1f} | Hardware: {device_info}"
    cv2.putText(frame, info_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX,
                0.8, (0, 255, 0), 2, cv2.LINE_AA)

    # Hiển thị khung hình camera
    cv2.imshow("Webcam Realtime Face Detection (GPU Enabled)", frame)

    # Bấm 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
