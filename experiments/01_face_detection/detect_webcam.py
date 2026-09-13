import cv2
import time
from insightface.app import FaceAnalysis

print("Đang khởi tạo RetinaFace từ InsightFace...")

# 1. Khởi tạo app với detector RetinaFace (name='buffalo_sc' là bản siêu nhẹ MobileNet)
# providers=['CUDAExecutionProvider', 'CPUExecutionProvider']: Tự động nhận diện GPU NVIDIA nếu có!
app = FaceAnalysis(name='buffalo_sc', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))

print("Khởi tạo thành công! Đang mở Camera...")

# 2. Mở Camera
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    print("Lỗi: Không tìm thấy Webcam!")
    exit()

prev_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # 3. Phát hiện khuôn mặt bằng RetinaFace
    # app.get() tự động làm mọi việc: Bounding Box + 5 Landmarks + Chuẩn hóa ảnh
    faces = app.get(frame)

    # 4. Vẽ kết quả lên từng khuôn mặt tìm được
    for face in faces:
        # Lấy Bounding Box [x1, y1, x2, y2]
        bbox = face.bbox.astype(int)
        cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)

        # Lấy 5 điểm Landmarks
        landmarks = face.kps.astype(int)
        for pt in landmarks:
            cv2.circle(frame, (pt[0], pt[1]), 3, (0, 0, 255), -1)

    # Tính và hiển thị FPS
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time)
    prev_time = curr_time

    cv2.putText(frame, f"FPS: {fps:.1f}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("RetinaFace Realtime - InsightFace", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
