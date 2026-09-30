-- ==============================================================================
-- DATABASE INITIALIZATION SCRIPT - VOLUNTEER MANAGEMENT SYSTEM
-- Target Database: PostgreSQL 14+ (Supabase)
-- Extension: pgcrypto, vector (pgvector)
-- Description: Hệ thống quản lý hoạt động tình nguyện có xác thực GPS & Face AI
-- Phiên bản cập nhật: 01/10/2026 (Bổ sung bảng password_reset_tokens cho Quên mật khẩu)
-- ==============================================================================

-- 1. BẬT EXTENSIONS CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- Hỗ trợ hàm gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;   -- Hỗ trợ lưu trữ & truy vấn vector đặc trưng khuôn mặt (pgvector)

-- ==============================================================================
-- 2. BẢNG ORGANIZATIONS (Cơ cấu tổ chức Đoàn - Hội theo dạng cây phân cấp)
-- ==============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. BẢNG USERS (Tài khoản đăng nhập hệ thống)
-- ==============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. BẢNG REFRESH_TOKENS (Quản lý phiên làm việc & Refresh Token Rotation)
-- ==============================================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. BẢNG PASSWORD_RESET_TOKENS (Mã OTP xác thực đặt lại mật khẩu)
-- ==============================================================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL,              -- Mã OTP (ví dụ 6 số: "582914")
    expires_at TIMESTAMPTZ NOT NULL,          -- Hết hạn sau 15 phút
    is_used BOOLEAN NOT NULL DEFAULT FALSE,   -- Đã sử dụng chưa
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. BẢNG ROLES & USER_ROLES (Phân quyền người dùng)
-- ==============================================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ==============================================================================
-- 7. BẢNG VOLUNTEERS (Hồ sơ đoàn viên / Tình nguyện viên)
-- Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân
-- ==============================================================================
CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    volunteer_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    phone VARCHAR(20),
    student_code VARCHAR(50),
    class_name VARCHAR(100),
    joined_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Ghi nhận sự đồng ý thu thập dữ liệu sinh trắc học (Nghị định 13/2023)
    consent_face_auth BOOLEAN NOT NULL DEFAULT FALSE,
    consent_given_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. BẢNG VOLUNTEER_FACE_TEMPLATES (Lưu vector đặc trưng khuôn mặt mẫu AI)
-- Dùng ArcFace w600k_mbf (Vector 512 chiều) lưu trong pgvector
-- ==============================================================================
CREATE TABLE volunteer_face_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    embedding vector(512) NOT NULL,                      -- Vector 512 chiều trích xuất từ ArcFace
    model_version VARCHAR(100) NOT NULL DEFAULT 'ArcFace-w600k_mbf-v1',
    face_crop_url TEXT,                                 -- Ảnh khuôn mặt mẫu đã chuẩn hóa 112x112
    is_active BOOLEAN NOT NULL DEFAULT TRUE,            -- Đang sử dụng để so khớp hay đã đổi mẫu mới
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. BẢNG CAMPAIGNS (Chiến dịch tình nguyện lớn: ví dụ Mùa Hè Xanh, Tiếp Sức Mùa Thi)
-- ==============================================================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date)
);

-- ==============================================================================
-- 10. BẢNG ACTIVITIES (Các hoạt động cụ thể thuộc một chiến dịch)
-- credit_hours (giờ công), credit_days (ngày công) để quy đổi thành tích
-- ==============================================================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER,
    credit_hours NUMERIC(4,2) NOT NULL DEFAULT 0.0 CHECK (credit_hours >= 0),
    credit_days NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (credit_days >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'OPEN', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time),
    CHECK (capacity IS NULL OR capacity > 0)
);

-- ==============================================================================
-- 11. BẢNG ACTIVITY_LOCATIONS (Địa điểm tổ chức hoạt động & Bán kính Geofence GPS)
-- ==============================================================================
CREATE TABLE activity_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    allowed_radius_meters NUMERIC(10,2) NOT NULL DEFAULT 100.0 CHECK (allowed_radius_meters > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 12. BẢNG ACTIVITY_REGISTRATIONS (Đăng ký tham gia hoạt động của tình nguyện viên)
-- ==============================================================================
CREATE TABLE activity_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED'
        CHECK (status IN ('REGISTERED', 'APPROVED', 'REJECTED', 'CANCELLED')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    UNIQUE (activity_id, volunteer_id) -- Chống đăng ký trùng
);

-- ==============================================================================
-- 13. BẢNG ATTENDANCE_SESSIONS (Các phiên điểm danh Check-in / Check-out do BTC mở)
-- ==============================================================================
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CHECK_IN', 'CHECK_OUT')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- ==============================================================================
-- 14. BẢNG ATTENDANCES (Bản ghi điểm danh thực tế tại hiện trường)
-- ĐÃ CẬP NHẬT THEO GÓP Ý CỦA THẦY:
-- 1. Bỏ volunteer_id (đã có trong activity_registrations)
-- 2. Ràng buộc UNIQUE (attendance_session_id, activity_registration_id) chống spam
-- 3. Bổ sung image_expires_at: Ảnh chụp hiện trường chỉ lưu có thời hạn (NĐ 13/2023)
-- ==============================================================================
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    activity_registration_id UUID NOT NULL REFERENCES activity_registrations(id) ON DELETE CASCADE,
    
    attended_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Tọa độ GPS thực tế của thiết bị lúc bấm điểm danh
    latitude NUMERIC(10,7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10,7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    location_accuracy_meters NUMERIC(10,2),
    location_status VARCHAR(30) DEFAULT 'PENDING_REVIEW'
        CHECK (location_status IN ('VALID', 'INVALID', 'PENDING_REVIEW')),
        
    -- Thông tin xác thực AI (Bằng chứng đối soát)
    verification_method VARCHAR(30) NOT NULL DEFAULT 'FACE_RECOGNITION'
        CHECK (verification_method IN ('FACE_RECOGNITION', 'MANUAL', 'QR_CODE')),
    face_similarity NUMERIC(5,4),              -- Độ tương đồng Cosine (ví dụ: 0.8542)
    is_liveness_verified BOOLEAN DEFAULT FALSE, -- Đã qua kiểm tra Anti-spoofing chưa
    captured_image_url TEXT,                   -- Link ảnh chụp tại hiện trường lúc quét mặt
    image_expires_at TIMESTAMPTZ,              -- Thời hạn lưu trữ ảnh điểm danh (Nghị định 13/2023)
    
    -- Trạng thái duyệt điểm danh
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    credit_earned NUMERIC(4,2) DEFAULT 0.0 CHECK (credit_earned >= 0),
    
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    note TEXT,
    
    -- Ràng buộc chống điểm danh trùng 2 lần trong 1 phiên
    CONSTRAINT uq_session_registration UNIQUE (attendance_session_id, activity_registration_id)
);

-- ==============================================================================
-- 15. BẢNG ACHIEVEMENTS & VOLUNTEER_ACHIEVEMENTS (Khen thưởng & Ghi nhận danh hiệu)
-- ==============================================================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteer_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    awarded_by UUID REFERENCES users(id),
    note TEXT,
    UNIQUE (volunteer_id, achievement_id)
);

-- ==============================================================================
-- 16. BẢNG AUDIT_LOGS (Nhật ký hệ thống để kiểm soát an ninh)
-- ==============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 17. CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

CREATE INDEX idx_volunteers_organization_id ON volunteers(organization_id);
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);

-- Chỉ mục pgvector cho bảng khuôn mặt mẫu (sử dụng HNSW index tăng tốc tìm kiếm tương đồng cosine)
CREATE INDEX idx_face_templates_volunteer_id ON volunteer_face_templates(volunteer_id);
CREATE INDEX idx_face_templates_embedding ON volunteer_face_templates USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

CREATE INDEX idx_activities_campaign_id ON activities(campaign_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_time ON activities(start_time, end_time);

CREATE INDEX idx_activity_locations_activity_id ON activity_locations(activity_id);
CREATE INDEX idx_activity_registrations_activity_id ON activity_registrations(activity_id);
CREATE INDEX idx_activity_registrations_volunteer_id ON activity_registrations(volunteer_id);

CREATE INDEX idx_attendance_sessions_activity_id ON attendance_sessions(activity_id);
CREATE INDEX idx_attendances_session_id ON attendances(attendance_session_id);
CREATE INDEX idx_attendances_registration_id ON attendances(activity_registration_id);
CREATE INDEX idx_attendances_status ON attendances(status);

CREATE INDEX idx_volunteer_achievements_volunteer_id ON volunteer_achievements(volunteer_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ==============================================================================
-- 18. DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA CHO ROLES)
-- ==============================================================================
INSERT INTO roles (code, name, description)
VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Quản trị viên toàn hệ thống'),
    ('ORGANIZATION_ADMIN', 'Organization Administrator', 'Quản trị tổ chức / Đoàn khoa'),
    ('ACTIVITY_MANAGER', 'Activity Manager', 'Ban tổ chức / Quản lý hoạt động'),
    ('VOLUNTEER', 'Volunteer', 'Đoàn viên / Tình nguyện viên')
ON CONFLICT (code) DO NOTHING;


-- ==============================================================================
-- 19. DỮ LIỆU KHỞI TẠO MẪU ĐỂ TEST HỆ THỐNG (SEED DATA FOR TESTING)
-- ==============================================================================

-- 1. TỔ CHỨC ĐOÀN - HỘI (Cấu trúc cây 3 cấp)
-- Cấp 1: Đoàn Trường
INSERT INTO organizations (id, parent_id, code, name, description, is_active)
VALUES 
    ('70f78c10-ae9d-4b05-b849-86a4aa12f7ec', NULL, 'DOAN_TRUONG', 'Đoàn Trường Đại học Đồng Tháp', 'Ban Chấp hành Đoàn trường cấp cao nhất', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Cấp 2: Các Đoàn Khoa trực thuộc Đoàn Trường
INSERT INTO organizations (id, parent_id, code, name, description, is_active)
VALUES 
    ('ed2ef505-1eab-464a-94c5-831ef9661efa', '70f78c10-ae9d-4b05-b849-86a4aa12f7ec', 'DOAN_KHOA_CNTT', 'Đoàn Khoa Công nghệ Thông tin', 'Đoàn thanh niên Khoa Công nghệ Thông tin', TRUE),
    ('afc2b22c-5084-4e28-af6e-c7b04a119d7f', '70f78c10-ae9d-4b05-b849-86a4aa12f7ec', 'DOAN_KHOA_KT', 'Đoàn Khoa Kinh tế', 'Đoàn thanh niên Khoa Kinh tế - Quản trị kinh doanh', TRUE),
    ('d34eb28b-fc01-4bc8-8179-4714a0931d1e', '70f78c10-ae9d-4b05-b849-86a4aa12f7ec', 'DOAN_KHOA_SP', 'Đoàn Khoa Sư phạm', 'Đoàn thanh niên khối ngành Sư phạm', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Cấp 3: Các CLB / Đội trực thuộc Khoa và Trường
INSERT INTO organizations (id, parent_id, code, name, description, is_active)
VALUES 
    ('f7145898-a95a-4817-9660-21cecb8e4e35', 'ed2ef505-1eab-464a-94c5-831ef9661efa', 'CLB_TN_XANH_CNTT', 'CLB Tình Nguyện Xanh CNTT', 'Đội chuyên trách hoạt động tình nguyện khoa CNTT', TRUE),
    ('95351f72-7f30-45a3-91a3-a7f105c34ce2', 'ed2ef505-1eab-464a-94c5-831ef9661efa', 'DOI_TIN_HOC_TRE', 'Đội Tin học Trẻ Tình nguyện', 'Hỗ trợ chuyển đổi số và tin học cộng đồng', TRUE),
    ('cba093c4-d33f-44db-90a1-d0de7db6e258', '70f78c10-ae9d-4b05-b849-86a4aa12f7ec', 'CLB_HMTN_TRUONG', 'CLB Hiến Máu Tình Nguyện Trường', 'Câu lạc bộ hiến máu cứu người cấp trường', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. TÀI KHOẢN MẪU (USERS) ĐỂ TEST ĐĂNG NHẬP & PHÂN QUYỀN
-- Mật khẩu mặc định cho tất cả tài khoản test: "Admin123@"
-- Hash BCrypt: $2a$11$qR0qZc3U1aU6gq9gK9s2mOcS4Gv2j1kL3q5t6u7v8w9x0y1z2a3b4
INSERT INTO users (id, organization_id, username, email, password_hash, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', '70f78c10-ae9d-4b05-b849-86a4aa12f7ec', 'superadmin', 'superadmin@dthu.edu.vn', '$2a$11$0jS/Wc9r8kK6rL4jC5y2e.8q5t3v1m7o9p2r4t6v8x0z2a4b6c8e.', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'ed2ef505-1eab-464a-94c5-831ef9661efa', 'admin_cntt', 'admin.cntt@dthu.edu.vn', '$2a$11$0jS/Wc9r8kK6rL4jC5y2e.8q5t3v1m7o9p2r4t6v8x0z2a4b6c8e.', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'ed2ef505-1eab-464a-94c5-831ef9661efa', 'volunteer_trong', 'trong.volunteer@dthu.edu.vn', '$2a$11$0jS/Wc9r8kK6rL4jC5y2e.8q5t3v1m7o9p2r4t6v8x0z2a4b6c8e.', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 3. GÁN QUYỀN CHO CÁC TÀI KHOẢN MẪU (USER_ROLES)
INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM roles WHERE code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM roles WHERE code = 'ORGANIZATION_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM roles WHERE code = 'VOLUNTEER'
ON CONFLICT DO NOTHING;

-- 4. HỒ SƠ TÌNH NGUYỆN VIÊN MẪU (VOLUNTEERS)
INSERT INTO volunteers (
    id, user_id, organization_id, volunteer_code, full_name, 
    date_of_birth, gender, phone, student_code, class_name, 
    joined_at, is_active, consent_face_auth, consent_given_at
)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'ed2ef505-1eab-464a-94c5-831ef9661efa',
    'TNV-2026-0001',
    'Lê Minh Trọng',
    '2004-05-15',
    'MALE',
    '0912345678',
    '0023413651',
    'ĐHCNTT23A-CS',
    '2023-09-05',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT (volunteer_code) DO NOTHING;

-- 5. DANH MỤC KHEN THƯỞNG / DANH HIỆU MẪU (ACHIEVEMENTS)
INSERT INTO achievements (id, code, name, description)
VALUES 
    ('55555555-5555-5555-5555-555555555551', 'TNV_XUAT_SAC', 'Tình nguyện viên Xuất sắc', 'Hoàn thành trên 50 giờ tình nguyện và tham gia tích cực các chiến dịch lớn'),
    ('55555555-5555-5555-5555-555555555552', 'DONG_MAU_CUU_NGUOI', 'Giọt Máu Nghĩa Tình', 'Tham gia hiến máu tình nguyện từ 3 lần trở lên trong năm học'),
    ('55555555-5555-5555-5555-555555555553', 'MUA_HE_XANH_TIEU_BIEU', 'Chiến sĩ Mùa Hè Xanh Tiêu Biểu', 'Đóng góp xuất sắc trong chiến dịch Mùa Hè Xanh cấp Trường')
ON CONFLICT (code) DO NOTHING;
