-- ==============================================================================
-- DATABASE INITIALIZATION SCRIPT - VOLUNTEER MANAGEMENT SYSTEM
-- Target Database: PostgreSQL 14+
-- Description: Hệ thống quản lý hoạt động tình nguyện có xác thực GPS & Face AI
-- ==============================================================================

-- 1. Bật Extensions cần thiết
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- Hỗ trợ hàm gen_random_uuid()

-- ==============================================================================
-- 2. BẢNG ORGANIZATIONS (Cơ cấu tổ chức Đoàn - Hội theo dạng cây)
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
-- 4. BẢNG ROLES & USER_ROLES (Phân quyền người dùng)
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
-- 5. BẢNG VOLUNTEERS (Hồ sơ đoàn viên / Tình nguyện viên)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. BẢNG CAMPAIGNS (Chiến dịch tình nguyện lớn: ví dụ Mùa Hè Xanh, Xuân Tình Nguyện)
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
-- 7. BẢNG ACTIVITIES (Các hoạt động cụ thể thuộc một chiến dịch)
-- Đã bổ sung: credit_hours (giờ công), credit_days (ngày công) để quy đổi thành tích
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
-- 8. BẢNG ACTIVITY_LOCATIONS (Địa điểm tổ chức hoạt động & Bán kính GPS cho phép)
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
-- 9. BẢNG ACTIVITY_REGISTRATIONS (Đăng ký tham gia hoạt động của tình nguyện viên)
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
-- 10. BẢNG ATTENDANCE_SESSIONS (Các phiên điểm danh Check-in / Check-out do BTC mở)
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
-- 11. BẢNG ATTENDANCES (Bản ghi điểm danh thực tế tại hiện trường)
-- Đã cải thiện:
-- - UNIQUE (attendance_session_id, volunteer_id): Chống điểm danh trùng trong 1 phiên
-- - attended_at thay cho registered_at
-- - verification_method, face_similarity, is_liveness_verified, captured_image_url
-- - credit_earned: Giờ công được ghi nhận khi duyệt
-- ==============================================================================
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    activity_registration_id UUID REFERENCES activity_registrations(id) ON DELETE SET NULL,
    
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
    face_similarity NUMERIC(5,4),              -- Độ tương đồng Cosine (ví dụ 0.8542)
    is_liveness_verified BOOLEAN DEFAULT FALSE, -- Đã qua kiểm tra Anti-spoofing chưa
    captured_image_url TEXT,                   -- Link ảnh chụp tại hiện trường lúc quét mặt
    
    -- Trạng thái duyệt điểm danh
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    credit_earned NUMERIC(4,2) DEFAULT 0.0 CHECK (credit_earned >= 0),
    
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    note TEXT,
    
    CONSTRAINT uq_session_volunteer UNIQUE (attendance_session_id, volunteer_id) -- Chống spam điểm danh
);

-- ==============================================================================
-- 12. BẢNG ACHIEVEMENTS & VOLUNTEER_ACHIEVEMENTS (Khen thưởng & Ghi nhận danh hiệu)
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
-- 13. BẢNG AUDIT_LOGS (Nhật ký hệ thống để kiểm soát an ninh)
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
-- 14. CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_volunteers_organization_id ON volunteers(organization_id);
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
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
CREATE INDEX idx_attendances_volunteer_id ON attendances(volunteer_id);
CREATE INDEX idx_attendances_status ON attendances(status);

CREATE INDEX idx_volunteer_achievements_volunteer_id ON volunteer_achievements(volunteer_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ==============================================================================
-- 15. DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA CHO ROLES)
-- ==============================================================================
INSERT INTO roles (code, name, description)
VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Quản trị viên toàn hệ thống'),
    ('ORGANIZATION_ADMIN', 'Organization Administrator', 'Quản trị tổ chức / Đoàn khoa'),
    ('ACTIVITY_MANAGER', 'Activity Manager', 'Ban tổ chức / Quản lý hoạt động'),
    ('VOLUNTEER', 'Volunteer', 'Đoàn viên / Tình nguyện viên')
ON CONFLICT (code) DO NOTHING;
