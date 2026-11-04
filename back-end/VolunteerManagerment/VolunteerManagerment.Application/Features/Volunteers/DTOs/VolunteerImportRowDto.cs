namespace VolunteerManagerment.Application.Features.Volunteers.DTOs;

public class VolunteerImportRowDto
{
    // 1. Mã số sinh viên
    public string? StudentCode { get; set; }
    public string? MSSV { get; set; }
    public string? MaSV { get; set; }
    public string? StudentId { get; set; }

    // 2. Họ và tên
    public string? FullName { get; set; }
    public string? HoTen { get; set; }
    public string? HoVaTen { get; set; }
    public string? Name { get; set; }

    // 3. Tên lớp (Bao quát tất cả cách đặt tên tiêu đề cột)
    public string? ClassName { get; set; }
    public string? Class { get; set; }
    public string? Lop { get; set; }
    public string? TenLop { get; set; }
    public string? LopHoc { get; set; }
    public string? LopSinhHoat { get; set; }
    public string? MaLop { get; set; }

    // 4. Giới tính
    public string? Gender { get; set; }
    public string? GioiTinh { get; set; }
    public string? Phai { get; set; }

    // 5. Số điện thoại
    public string? Phone { get; set; }
    public string? PhoneNumber { get; set; }
    public string? SoDienThoai { get; set; }
    public string? SDT { get; set; }

    // 6. Ngày sinh
    public string? DateOfBirth { get; set; }
    public string? NgaySinh { get; set; }
    public string? DOB { get; set; }

    // Các hàm Resolve để lấy giá trị đầu tiên tìm thấy
    public string? ResolveStudentCode() =>
        !string.IsNullOrWhiteSpace(StudentCode) ? StudentCode :
        !string.IsNullOrWhiteSpace(MSSV) ? MSSV :
        !string.IsNullOrWhiteSpace(MaSV) ? MaSV :
        !string.IsNullOrWhiteSpace(StudentId) ? StudentId : null;

    public string? ResolveFullName() =>
        !string.IsNullOrWhiteSpace(FullName) ? FullName :
        !string.IsNullOrWhiteSpace(HoTen) ? HoTen :
        !string.IsNullOrWhiteSpace(HoVaTen) ? HoVaTen :
        !string.IsNullOrWhiteSpace(Name) ? Name : null;

    public string? ResolveClassName() =>
        !string.IsNullOrWhiteSpace(ClassName) ? ClassName :
        !string.IsNullOrWhiteSpace(Class) ? Class :
        !string.IsNullOrWhiteSpace(Lop) ? Lop :
        !string.IsNullOrWhiteSpace(TenLop) ? TenLop :
        !string.IsNullOrWhiteSpace(LopHoc) ? LopHoc :
        !string.IsNullOrWhiteSpace(LopSinhHoat) ? LopSinhHoat :
        !string.IsNullOrWhiteSpace(MaLop) ? MaLop : null;

    public string? ResolveGender() =>
        !string.IsNullOrWhiteSpace(Gender) ? Gender :
        !string.IsNullOrWhiteSpace(GioiTinh) ? GioiTinh :
        !string.IsNullOrWhiteSpace(Phai) ? Phai : null;

    public string? ResolvePhone() =>
        !string.IsNullOrWhiteSpace(Phone) ? Phone :
        !string.IsNullOrWhiteSpace(PhoneNumber) ? PhoneNumber :
        !string.IsNullOrWhiteSpace(SoDienThoai) ? SoDienThoai :
        !string.IsNullOrWhiteSpace(SDT) ? SDT : null;

    public string? ResolveDateOfBirth() =>
        !string.IsNullOrWhiteSpace(DateOfBirth) ? DateOfBirth :
        !string.IsNullOrWhiteSpace(NgaySinh) ? NgaySinh :
        !string.IsNullOrWhiteSpace(DOB) ? DOB : null;
}
