import { describe, expect, it } from "vitest";
import { formatDateTimeVN, getRegistrationStatusBadge } from "@/lib/activity-helpers";

describe("activity-helpers", () => {
  it("formatDateTimeVN formats ISO string to Vietnamese locale format", () => {
    const isoDate = "2026-11-04T10:30:00Z";
    const formatted = formatDateTimeVN(isoDate);
    expect(formatted).toBeDefined();
    expect(formatted).not.toBe("N/A");
  });

  it("formatDateTimeVN returns N/A for null or undefined", () => {
    expect(formatDateTimeVN(null)).toBe("N/A");
    expect(formatDateTimeVN(undefined)).toBe("N/A");
  });

  it("getRegistrationStatusBadge returns correct badges for different registration statuses", () => {
    const approved = getRegistrationStatusBadge("APPROVED");
    expect(approved?.label).toBe("Đã duyệt tham gia");

    const pending = getRegistrationStatusBadge("PENDING");
    expect(pending?.label).toBe("Đã đăng ký • Chờ duyệt");

    const registered = getRegistrationStatusBadge("REGISTERED");
    expect(registered?.label).toBe("Đã đăng ký • Chờ duyệt");

    const rejected = getRegistrationStatusBadge("REJECTED");
    expect(rejected?.label).toBe("Từ chối đăng ký");

    const unknown = getRegistrationStatusBadge("UNKNOWN");
    expect(unknown).toBeNull();
  });
});

describe("Haversine Distance Algorithm", () => {
  const computeDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // meters
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const calcA =
      sinDLat * sinDLat +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(calcA), Math.sqrt(1 - calcA));
    return Math.round(R * c);
  };

  it("returns 0 meters for identical coordinates", () => {
    const dist = computeDistance(10.455, 105.632, 10.455, 105.632);
    expect(dist).toBe(0);
  });

  it("correctly identifies within 150m allowed geofence", () => {
    // 0.0005 degrees latitude is roughly 55 meters
    const dist = computeDistance(10.455, 105.632, 10.4555, 105.632);
    expect(dist).toBeLessThanOrEqual(150);
  });

  it("correctly identifies outside 150m allowed geofence", () => {
    // 0.01 degrees is roughly 1.1 km
    const dist = computeDistance(10.455, 105.632, 10.465, 105.642);
    expect(dist).toBeGreaterThan(150);
  });
});
