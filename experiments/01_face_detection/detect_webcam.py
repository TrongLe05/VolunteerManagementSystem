import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import cv2
from retinaface import RetinaFace

# 1. Khởi tạo Webcam (0 là camera mặc định)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Không thể mở được Webcam của bạn!")
    exit()

print("Webcam đã sẵn sàng! Bấm phím 'q' trên bàn phím để thoát.")

# 2. Vòng lặp liên tục đọc từng khung hình (Frame)
while True:
    ret, frame = cap.read()
    if not ret:
        print("Không nhận được tín hiệu từ camera.")
        break

    # Chuyển đổi hệ màu từ BGR sang RGB cho RetinaFace
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    try:
        # 3. Phát hiện khuôn mặt trên khung hình hiện tại
        faces = RetinaFace.detect_faces(frame_rgb)

        if isinstance(faces, dict):
            # Lặp qua tất cả các khuôn mặt nhìn thấy trước camera
            for face_key in faces.keys():
                face_data = faces[face_key]

                # Lấy tọa độ Bounding Box
                box = face_data["facial_area"]
                x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])

                # Vẽ hộp chữ nhật màu xanh lá quanh mặt
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

                # Vẽ 5 điểm mốc màu đỏ
                landmarks = face_data["landmarks"]
                for point in landmarks.values():
                    px, py = int(point[0]), int(point[1])
                    cv2.circle(frame, (px, py), 4, (0, 0, 255), -1)

    except Exception as e:
        # Nếu frame này không có mặt thì bỏ qua, chạy tiếp frame sau
        pass

    # 4. Hiển thị khung hình lên cửa sổ màn hình
    cv2.imshow("Diem Danh Tinh Nguyen - Realtime Detection", frame)

    # 5. Nếu bấm phím 'q' trên bàn phím thì dừng lại
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 6. Tắt camera và đóng cửa sổ
cap.release()
cv2.destroyAllWindows()
