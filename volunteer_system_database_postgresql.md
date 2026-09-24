# PostgreSQL System Database - Volunteer Management System

> Database nghiệp vụ chính cho hệ thống quản lý hoạt động tình nguyện.
>
> **Phạm vi:** Chỉ bao gồm dữ liệu nghiệp vụ của hệ thống. Chưa bao gồm database/model phục vụ Face Recognition, Face Embedding, Anti-Spoofing hoặc AI.

## 1. Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## 2. Organizations

Quản lý cơ cấu tổ chức theo dạng cây.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    parent_id UUID
        REFERENCES organizations(id)
        ON DELETE SET NULL,

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Users

Quản lý tài khoản đăng nhập hệ thống.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES organizations(id),

    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Roles

Định nghĩa các vai trò trong hệ thống.

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
```

---

## 5. User Roles

Bảng trung gian giữa Users và Roles.

```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    PRIMARY KEY (user_id, role_id)
);
```

---

## 6. Volunteers

Quản lý hồ sơ đoàn viên/tình nguyện viên.

```sql
CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE
        REFERENCES users(id)
        ON DELETE SET NULL,

    organization_id UUID NOT NULL
        REFERENCES organizations(id),

    volunteer_code VARCHAR(50) NOT NULL UNIQUE,

    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),

    phone VARCHAR(20),
    student_code VARCHAR(50),
    class_name VARCHAR(100),

    joined_at DATE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Campaigns

Quản lý các chiến dịch tình nguyện.

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES organizations(id),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status VARCHAR(30) NOT NULL,

    created_by UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_date >= start_date)
);
```

---

## 8. Activities

Quản lý các hoạt động thuộc một chiến dịch.

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    capacity INTEGER,

    status VARCHAR(30) NOT NULL,

    created_by UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_time > start_time),
    CHECK (capacity IS NULL OR capacity > 0)
);
```

---

## 9. Activity Locations

Quản lý địa điểm của hoạt động.

```sql
CREATE TABLE activity_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activity_id UUID NOT NULL
        REFERENCES activities(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    address TEXT,

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    allowed_radius_meters NUMERIC(10,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CHECK (
        allowed_radius_meters IS NULL
        OR allowed_radius_meters > 0
    )
);
```

---

## 10. Activity Registrations

Quản lý tình nguyện viên đăng ký hoạt động.

```sql
CREATE TABLE activity_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activity_id UUID NOT NULL
        REFERENCES activities(id)
        ON DELETE CASCADE,

    volunteer_id UUID NOT NULL
        REFERENCES volunteers(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',

    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    approved_by UUID
        REFERENCES users(id),

    approved_at TIMESTAMPTZ,

    UNIQUE (activity_id, volunteer_id)
);
```

---

## 11. Attendance Sessions

Quản lý các phiên điểm danh Check-in/Check-out.

```sql
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activity_id UUID NOT NULL
        REFERENCES activities(id)
        ON DELETE CASCADE,

    type VARCHAR(20) NOT NULL,

    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,

    created_by UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (type IN ('CHECK_IN', 'CHECK_OUT')),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);
```

---

## 12. Attendances

Lưu kết quả điểm danh thực tế của từng tình nguyện viên.

```sql
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attendance_session_id UUID NOT NULL
        REFERENCES attendance_sessions(id)
        ON DELETE CASCADE,

    volunteer_id UUID NOT NULL
        REFERENCES volunteers(id)
        ON DELETE CASCADE,

    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    location_accuracy_meters NUMERIC(10,2),

    location_status VARCHAR(30),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    reviewed_by UUID
        REFERENCES users(id),

    reviewed_at TIMESTAMPTZ,

    note TEXT
);
```

---

## 13. Achievements

Danh mục các thành tích tình nguyện.

```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 14. Volunteer Achievements

Ghi nhận thành tích của từng tình nguyện viên.

```sql
CREATE TABLE volunteer_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    volunteer_id UUID NOT NULL
        REFERENCES volunteers(id)
        ON DELETE CASCADE,

    achievement_id UUID NOT NULL
        REFERENCES achievements(id)
        ON DELETE CASCADE,

    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    awarded_by UUID
        REFERENCES users(id),

    note TEXT,

    UNIQUE (volunteer_id, achievement_id)
);
```

---

## 15. Audit Logs

Lưu lịch sử các thao tác quan trọng trong hệ thống.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,

    old_values JSONB,
    new_values JSONB,

    ip_address INET,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

# 16. Recommended Indexes

Các index cơ bản để hỗ trợ truy vấn thường xuyên.

```sql
CREATE INDEX idx_users_organization_id
    ON users(organization_id);

CREATE INDEX idx_volunteers_organization_id
    ON volunteers(organization_id);

CREATE INDEX idx_campaigns_organization_id
    ON campaigns(organization_id);

CREATE INDEX idx_activities_campaign_id
    ON activities(campaign_id);

CREATE INDEX idx_activity_locations_activity_id
    ON activity_locations(activity_id);

CREATE INDEX idx_activity_registrations_activity_id
    ON activity_registrations(activity_id);

CREATE INDEX idx_activity_registrations_volunteer_id
    ON activity_registrations(volunteer_id);

CREATE INDEX idx_attendance_sessions_activity_id
    ON attendance_sessions(activity_id);

CREATE INDEX idx_attendances_session_id
    ON attendances(attendance_session_id);

CREATE INDEX idx_attendances_volunteer_id
    ON attendances(volunteer_id);

CREATE INDEX idx_volunteer_achievements_volunteer_id
    ON volunteer_achievements(volunteer_id);

CREATE INDEX idx_audit_logs_user_id
    ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);
```

---

# 17. Initial Roles

Có thể tạo các role ban đầu:

```sql
INSERT INTO roles (code, name, description)
VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Quản trị viên toàn hệ thống'),
    ('ORGANIZATION_ADMIN', 'Organization Administrator', 'Quản trị tổ chức'),
    ('ACTIVITY_MANAGER', 'Activity Manager', 'Quản lý chiến dịch và hoạt động'),
    ('VOLUNTEER', 'Volunteer', 'Đoàn viên/tình nguyện viên');
```

---

# 18. Suggested Status Values

Các giá trị này hiện đang được lưu bằng `VARCHAR` để dễ thay đổi khi nghiệp vụ còn đang phát triển.

### Campaign

```text
DRAFT
UPCOMING
ONGOING
COMPLETED
CANCELLED
```

### Activity

```text
DRAFT
OPEN
ONGOING
COMPLETED
CANCELLED
```

### Activity Registration

```text
REGISTERED
APPROVED
REJECTED
CANCELLED
```

### Attendance

```text
PENDING
APPROVED
REJECTED
```

### Location

```text
VALID
INVALID
PENDING_REVIEW
```

---

# 19. Important Design Notes

Database này cố tình **không chứa**:

```text
face_profiles
face_embeddings
face_verification_attempts
anti_spoofing_results
ai_models
datasets
model_versions
```

Những phần trên sẽ được thiết kế riêng khi xây dựng module AI.

Ngoài ra, database hiện tại **không lưu tổng số ngày công hoặc tổng số giờ** trực tiếp trong `volunteers`.

Các số liệu này nên được tính từ các bản ghi `attendances` đã được duyệt, tránh dữ liệu dư thừa và vấn đề không đồng bộ.

Kiến trúc tổng thể:

    React Frontend
          │
          ▼
    ASP.NET Core API
          │
          ├──────────────► PostgreSQL
          │                    │
          │                    └── System Database
          │
          └──────────────► Python AI Service
                               │
                               └── AI/Face Database
