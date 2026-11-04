import { useEffect, useRef, useState } from "react";
import {
  Crosshair,
  ExternalLink,
  Layers,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

import type { ActivityLocationInput } from "@/types/volunteer.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMapInstance) => LeafletTileLayer;
  remove: () => void;
}

interface LeafletMapInstance {
  setView: (center: [number, number], zoom: number) => void;
  on: (
    event: string,
    handler: (e: { latlng: { lat: number; lng: number } }) => void,
  ) => void;
  remove: () => void;
  invalidateSize: () => void;
}

interface LeafletMarkerInstance {
  setLatLng: (latlng: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, handler: () => void) => void;
}

interface LeafletCircleInstance {
  setLatLng: (latlng: [number, number]) => void;
  setRadius: (radius: number) => void;
}

interface LeafletGlobal {
  map: (el: HTMLElement) => {
    setView: (center: [number, number], zoom: number) => LeafletMapInstance;
  };
  tileLayer: (url: string, opts: Record<string, unknown>) => LeafletTileLayer;
  divIcon: (opts: Record<string, unknown>) => unknown;
  marker: (
    latlng: [number, number],
    opts?: Record<string, unknown>,
  ) => { addTo: (map: LeafletMapInstance) => LeafletMarkerInstance };
  circle: (
    latlng: [number, number],
    opts: Record<string, unknown>,
  ) => { addTo: (map: LeafletMapInstance) => LeafletCircleInstance };
}

declare global {
  interface Window {
    L?: LeafletGlobal;
  }
}

let leafletPromise: Promise<LeafletGlobal> | null = null;

function loadLeaflet(): Promise<LeafletGlobal> {
  if (window.L) {
    return Promise.resolve(window.L);
  }
  if (leafletPromise) {
    return leafletPromise;
  }

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error("Không thể khởi tạo bản đồ."));
      }
    };
    script.onerror = () => reject(new Error("Lỗi tải thư viện bản đồ."));
    document.body.appendChild(script);
  });

  return leafletPromise;
}

// URL lớp bản đồ Google Maps (Streets & Satellite Hybrid) không cần khóa Billing
const GOOGLE_STREETS_TILE =
  "https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}";
const GOOGLE_HYBRID_TILE =
  "https://mt1.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}";

// Tách tọa độ nếu người dùng dán trực tiếp link Google Maps (VD: .../@10.4602,105.6425,17z...)
function extractCoordsFromText(
  input: string,
): { lat: number; lng: number } | null {
  const atMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };
  }
  const pairMatch = input.trim().match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (pairMatch) {
    return { lat: Number(pairMatch[1]), lng: Number(pairMatch[2]) };
  }
  return null;
}

interface LocationMapPickerProps {
  value: ActivityLocationInput;
  onChange: (next: ActivityLocationInput) => void;
}

export function LocationMapPicker({ value, onChange }: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const markerInstanceRef = useRef<LeafletMarkerInstance | null>(null);
  const circleInstanceRef = useRef<LeafletCircleInstance | null>(null);

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapMode, setMapMode] = useState<"streets" | "satellite">("streets");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) {
        const shortName =
          data.name ||
          data.address?.amenity ||
          data.address?.university ||
          data.address?.school ||
          data.address?.building ||
          data.address?.road ||
          valueRef.current.name;
        onChangeRef.current({
          ...valueRef.current,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          name: shortName || valueRef.current.name,
          address: data.display_name,
        });
      }
    } catch {
      // Giữ tọa độ đã ghim
    }
  };

  // Khởi tạo bản đồ với lớp nền Google Maps
  useEffect(() => {
    let isMounted = true;

    loadLeaflet()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) {
          return;
        }

        const initLat = Number(valueRef.current.latitude) || 10.4602;
        const initLng = Number(valueRef.current.longitude) || 105.6425;
        const initRadius = Number(valueRef.current.allowedRadiusMeters) || 150;

        const map = L.map(mapContainerRef.current).setView(
          [initLat, initLng],
          17,
        );

        const tile = L.tileLayer(GOOGLE_STREETS_TILE, {
          maxZoom: 21,
          attribution: "&copy; Google Maps",
        }).addTo(map);

        const modernPinIcon = L.divIcon({
          className: "custom-modern-pin",
          iconSize: [44, 52],
          iconAnchor: [22, 46],
          html: `
            <div style="position:relative;width:44px;height:52px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 6px 10px rgba(37,99,235,0.45));cursor:grab;">
              <span style="position:absolute;bottom:2px;width:22px;height:10px;border-radius:9999px;background:rgba(37,99,235,0.28);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <span style="position:absolute;bottom:4px;width:12px;height:5px;border-radius:9999px;background:rgba(15,23,42,0.35);"></span>
              <svg width="40" height="46" viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:2;">
                <defs>
                  <linearGradient id="pinGrad" x1="6" y1="2" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#3B82F6"/>
                    <stop offset="55%" stop-color="#2563EB"/>
                    <stop offset="100%" stop-color="#1D4ED8"/>
                  </linearGradient>
                </defs>
                <path d="M20 2C10.611 2 3 9.611 3 19C3 30.25 17.45 41.9 18.88 43.02C19.54 43.54 20.46 43.54 21.12 43.02C22.55 41.9 37 30.25 37 19C37 9.611 29.389 2 20 2Z" fill="url(#pinGrad)" stroke="white" stroke-width="2.5"/>
                <circle cx="20" cy="18.5" r="7.5" fill="white"/>
                <circle cx="20" cy="18.5" r="3.5" fill="#2563EB"/>
              </svg>
            </div>
          `,
        });

        const marker = L.marker([initLat, initLng], {
          draggable: true,
          icon: modernPinIcon,
        }).addTo(map);

        const circle = L.circle([initLat, initLng], {
          radius: initRadius,
          color: "#1a73e8",
          fillColor: "#4285f4",
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);

        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          const fixedLat = Number(lat.toFixed(6));
          const fixedLng = Number(lng.toFixed(6));

          marker.setLatLng([fixedLat, fixedLng]);
          circle.setLatLng([fixedLat, fixedLng]);

          onChangeRef.current({
            ...valueRef.current,
            latitude: fixedLat,
            longitude: fixedLng,
          });

          reverseGeocode(fixedLat, fixedLng);
        });

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          const fixedLat = Number(pos.lat.toFixed(6));
          const fixedLng = Number(pos.lng.toFixed(6));

          circle.setLatLng([fixedLat, fixedLng]);

          onChangeRef.current({
            ...valueRef.current,
            latitude: fixedLat,
            longitude: fixedLng,
          });

          reverseGeocode(fixedLat, fixedLng);
        });

        mapInstanceRef.current = map;
        tileLayerRef.current = tile;
        markerInstanceRef.current = marker;
        circleInstanceRef.current = circle;

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      })
      .catch(() => {
        // Ignore
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markerInstanceRef.current = null;
        circleInstanceRef.current = null;
      }
    };
  }, []);

  // Chuyển đổi giữa Google Maps Đường phố & Google Maps Vệ tinh (Satellite Hybrid)
  const toggleMapMode = () => {
    const nextMode = mapMode === "streets" ? "satellite" : "streets";
    setMapMode(nextMode);

    if (window.L && mapInstanceRef.current) {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      const nextUrl =
        nextMode === "streets" ? GOOGLE_STREETS_TILE : GOOGLE_HYBRID_TILE;
      tileLayerRef.current = window.L.tileLayer(nextUrl, {
        maxZoom: 21,
        attribution: "&copy; Google Maps",
      }).addTo(mapInstanceRef.current);
    }
  };

  useEffect(() => {
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    const radius = Number(value.allowedRadiusMeters) || 100;

    if (
      markerInstanceRef.current &&
      circleInstanceRef.current &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
      markerInstanceRef.current.setLatLng([lat, lng]);
      circleInstanceRef.current.setLatLng([lat, lng]);
      circleInstanceRef.current.setRadius(radius);
    }
  }, [value.latitude, value.longitude, value.allowedRadiusMeters]);

  const handleSearchPlace = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    // Nếu người dùng dán trực tiếp link Google Maps hoặc cặp tọa độ "10.4602, 105.6425"
    const directCoords = extractCoordsFromText(q);
    if (directCoords) {
      const lat = Number(directCoords.lat.toFixed(6));
      const lng = Number(directCoords.lng.toFixed(6));
      onChange({
        ...value,
        latitude: lat,
        longitude: lng,
      });
      if (
        mapInstanceRef.current &&
        markerInstanceRef.current &&
        circleInstanceRef.current
      ) {
        mapInstanceRef.current.setView([lat, lng], 18);
        markerInstanceRef.current.setLatLng([lat, lng]);
        circleInstanceRef.current.setLatLng([lat, lng]);
      }
      reverseGeocode(lat, lng);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=5&accept-language=vi&q=${encodeURIComponent(
          q,
        )}`,
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data || []);
      if (!data || data.length === 0) {
        toast.info(
          "Không tìm thấy địa điểm khớp từ khóa. Bạn có thể dán link Google Maps hoặc click trực tiếp lên bản đồ.",
        );
      }
    } catch {
      toast.error("Không thể kết nối dịch vụ tìm kiếm địa điểm.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: NominatimResult) => {
    const lat = Number(Number(place.lat).toFixed(6));
    const lng = Number(Number(place.lon).toFixed(6));
    const shortName =
      place.name || place.display_name.split(",")[0] || value.name;

    onChange({
      ...value,
      name: shortName,
      address: place.display_name,
      latitude: lat,
      longitude: lng,
    });

    if (
      mapInstanceRef.current &&
      markerInstanceRef.current &&
      circleInstanceRef.current
    ) {
      mapInstanceRef.current.setView([lat, lng], 18);
      markerInstanceRef.current.setLatLng([lat, lng]);
      circleInstanceRef.current.setLatLng([lat, lng]);
    }

    setSearchResults([]);
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        onChange({
          ...value,
          latitude: lat,
          longitude: lng,
        });

        if (
          mapInstanceRef.current &&
          markerInstanceRef.current &&
          circleInstanceRef.current
        ) {
          mapInstanceRef.current.setView([lat, lng], 18);
          markerInstanceRef.current.setLatLng([lat, lng]);
          circleInstanceRef.current.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
      },
      () => {
        setIsLocatingGps(false);
        toast.warning(
          "Không thể lấy vị trí hiện tại. Vui lòng cấp quyền vị trí (Location) cho trình duyệt.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
          <MapPin className="size-4 text-blue-600" />
          Google Maps • Ghim Tọa độ & Bán kính Geofence
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={toggleMapMode}
            className="gap-1 bg-white text-slate-700"
          >
            <Layers className="size-3.5 text-blue-600" />
            {mapMode === "streets" ? "Xem Vệ tinh" : "Xem Đường phố"}
          </Button>

          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={isLocatingGps}
            onClick={handleUseCurrentGps}
            className="gap-1 bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            {isLocatingGps ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Crosshair className="size-3.5" />
            )}
            GPS hiện tại
          </Button>

          <a
            href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-6 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="size-3" />
            Mở Google Maps
          </a>
        </div>
      </div>

      {/* Thanh tìm kiếm địa điểm hoặc dán link Google Maps */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Tìm địa điểm hoặc dán trực tiếp đường link Google Maps
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchPlace();
                }
              }}
              placeholder="Nhập tên địa điểm (VD: Đại học Đồng Tháp) hoặc dán link Google Maps..."
              className="pl-8 bg-white"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isSearching}
            onClick={handleSearchPlace}
            className="shrink-0 gap-1.5"
          >
            {isSearching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            Tìm trên Map
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-md divide-y divide-slate-100">
            {searchResults.map((place) => (
              <button
                key={place.place_id}
                type="button"
                onClick={() => handleSelectPlace(place)}
                className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-blue-50 transition-colors"
              >
                <MapPin className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {place.name || place.display_name.split(",")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {place.display_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Khung Bản đồ Google Maps Tương tác */}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-2xs">
        <div ref={mapContainerRef} className="h-60 w-full z-0" />
        <div className="bg-white px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between border-t">
          <span>
            📍 Bấm trực tiếp lên bản đồ Google Maps hoặc kéo ghim xanh để chọn
            vị trí tập kết.
          </span>
          <span className="font-mono font-semibold text-blue-700 shrink-0 ml-2">
            {value.latitude}, {value.longitude}
          </span>
        </div>
      </div>

      {/* Tên địa điểm & Địa chỉ */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Tên địa điểm tập kết</Label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="VD: Khuôn viên Trường ĐH Đồng Tháp"
            className="bg-white"
            required
          />
        </div>
        <div>
          <Label className="text-xs">Địa chỉ mô tả</Label>
          <Input
            value={value.address || ""}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="783 Phạm Hữu Lầu, P.6, TP. Cao Lãnh..."
            className="bg-white"
          />
        </div>
      </div>

      {/* Vĩ độ, Kinh độ, Bán kính Geofence */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Vĩ độ (Latitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={value.latitude}
            onChange={(e) =>
              onChange({ ...value, latitude: Number(e.target.value) })
            }
            className="bg-white font-mono text-xs"
            required
          />
        </div>
        <div>
          <Label className="text-xs">Kinh độ (Longitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={value.longitude}
            onChange={(e) =>
              onChange({ ...value, longitude: Number(e.target.value) })
            }
            className="bg-white font-mono text-xs"
            required
          />
        </div>
        <div>
          <Label className="text-xs">Bán kính (Mét)</Label>
          <Input
            type="number"
            min={10}
            value={value.allowedRadiusMeters}
            onChange={(e) =>
              onChange({
                ...value,
                allowedRadiusMeters: Number(e.target.value),
              })
            }
            className="bg-white"
            required
          />
        </div>
      </div>
    </div>
  );
}
