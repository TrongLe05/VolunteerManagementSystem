import os
import urllib.request

os.makedirs("weights", exist_ok=True)
output_file = "weights/retinaface_mobilenet025.onnx"

# Link trực tiếp file mô hình RetinaFace ONNX (chuẩn 1.68 MB)
url = "https://github.com/ternaus/retinaface/releases/download/0.01/retinaface_mv1.onnx"

print("Đang tải file mô hình...")

# Thêm User-Agent để GitHub cho phép tải file nhị phân
opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)

urllib.request.urlretrieve(url, output_file)

file_size_kb = os.path.getsize(output_file) / 1024
print(f"==> Đã tải xong! Dung lượng file: {file_size_kb:.1f} KB")

if file_size_kb < 500:
    print("CẢNH BÁO: File quá nhỏ, có thể bị lỗi tải trang web thay vì file mô hình!")
else:
    print("Mô hình hợp lệ chuẩn ONNX!")
