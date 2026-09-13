from retinaface import RetinaFace
import cv2

image_path = "images/test.jpg"

# cv đọc ảnh
image_cv = cv2.imread(image_path)

# phát hiện khuôn mặt
face = RetinaFace.detect_faces(image_cv)

# lưu data khuôn mặt
face_data = face["face_1"]

# lưu dữ liệu toạ độ hộp
box = face_data["facial_area"]
x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])

# cv2 vẽ hộp màu xanh lá theo toạ độ box
cv2.rectangle(image_cv, (x1, y1), (x2, y2), (0, 255, 0), 10)

# lưu các điểm landmark và vẽ chấm tròn tại các điểm
landmarks = face_data["landmarks"]
for point in landmarks.values():
    px, py = int(point[0]), int(point[1])
    cv2.circle(image_cv, (px, py), 6, (0, 0, 255), -1)

# lưu ảnh sau khi detect
output_path = "images/result.jpg"
cv2.imwrite(output_path, image_cv)

print(f"Đã lưu ảnh sau khi detect!")