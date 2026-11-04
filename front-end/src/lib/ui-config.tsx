import * as React from "react"

/* Cấu hình chung cho mọi component: locale (định dạng số, ngày, so sánh chuỗi), bảng nhãn giao diện và cỡ mặc định.
 * Không bọc UiProvider thì mọi component chạy như mặc định: tiếng Việt, vi-VN, cỡ "default".
 * Thứ tự ưu tiên trong component: prop truyền trực tiếp > UiProvider gần nhất > mặc định. */

export type UiSize = "sm" | "default" | "lg"

export const viLabels = {
  // chung
  close: "Đóng",
  cancel: "Hủy",
  confirm: "Đồng ý",
  clear: "Xóa",
  search: "Tìm…",
  searchLabel: "Tìm kiếm",
  select: "Chọn…",
  selectAll: "Chọn tất cả",
  clearSelection: "Xóa tất cả lựa chọn",
  noResults: "Không có kết quả",
  noData: "Không có dữ liệu",
  loading: "Đang tải…",
  yes: "Có",
  no: "Không",
  // phân trang
  pagination: "Phân trang",
  prevPage: "Trang trước",
  nextPage: "Trang sau",
  page: (n: number) => `Trang ${n}`,
  // ngày giờ
  pickDate: "Chọn ngày",
  pickDateRange: "Chọn khoảng ngày",
  pickTime: "Chọn giờ",
  today: "Hôm nay",
  hour: "Giờ",
  minute: "Phút",
  calendarMonth: (m: number) => `Tháng ${m}`,
  calendarWeekday: (day: number) => (day === 0 ? "CN" : `T${day + 1}`),
  // thao tác chung
  confirmAction: "Xác nhận",
  remove: "Xóa",
  removeItem: (name: string) => `Xóa ${name}`,
  clearSelected: "Xoá lựa chọn",
  deselectAll: "Bỏ chọn tất cả",
  selectedCount: (n: number) => `Đã chọn ${n} mục`,
  searchResults: "Kết quả tìm kiếm",
  suggestions: "Gợi ý",
  showMore: "Xem thêm",
  moreActions: "Thêm thao tác",
  refresh: "Làm mới",
  reset: "Đặt lại",
  increase: "Tăng",
  decrease: "Giảm",
  loadingOverlay: "Đang tải...",
  spinner: "Đang tải",
  // điều hướng, bố cục
  breadcrumb: "Đường dẫn",
  anchorNav: "Mục lục trang",
  scrollTop: "Lên đầu trang",
  toolbar: "Thanh công cụ",
  collapseSider: "Thu gọn thanh bên",
  expandSider: "Mở rộng thanh bên",
  sidebarTitle: "Menu chức năng",
  sidebarDescription: "Điều hướng chính của ứng dụng.",
  toggleSidebar: "Đóng/mở thanh menu",
  speedDial: "Hành động nhanh",
  // thông báo, kết quả
  dismissBanner: "Đóng thông báo",
  resultSuccess: "Thành công",
  resultError: "Thất bại",
  resultInfo: "Thông tin",
  resultWarning: "Cảnh báo",
  result404: "Không tìm thấy trang",
  result403: "Không có quyền truy cập",
  result500: "Lỗi hệ thống",
  // AddressPicker
  addressProvince: "Tỉnh / Thành phố",
  addressDistrict: "Quận / Huyện",
  addressWard: "Phường / Xã",
  addressStreet: "Số nhà, đường, thôn xóm",
  addressProvinceShort: "tỉnh / thành",
  addressDistrictShort: "quận / huyện",
  addressWardShort: "phường / xã",
  addressPick: (unit: string) => `Chọn ${unit}`,
  addressPickFirst: (unit: string) => `Chọn ${unit} trước`,
  addressSearch: (unit: string) => `Tìm ${unit}…`,
  addressStreetPlaceholder: "Ví dụ: Số 12, ngõ 5, đường Láng",
  // AvatarGroup
  avatarMore: (n: number) => `và ${n} người khác`,
  // Carousel
  carouselPrev: "Slide trước",
  carouselNext: "Slide sau",
  carouselDots: "Chọn slide",
  carouselGoTo: (n: number) => `Đến slide ${n}`,
  // Cascader, TreeSelect, Mentions
  cascaderLevel: (n: number) => `Cấp ${n}`,
  treeSearch: "Tìm trong cây",
  treePick: "Chọn từ cây",
  mentionSuggestions: "Gợi ý nhắc tên",
  // Chart, StatTile
  chartCategory: "Danh mục",
  chartDataTable: (label: string) => `Bảng dữ liệu: ${label}`,
  chartLegend: "Chú giải",
  trendUp: "Tăng",
  trendDown: "Giảm",
  trendFlat: "Không đổi",
  // ColorPicker
  colorTrigger: (color: string) => `Chọn màu, hiện tại ${color}`,
  colorSwatches: "Màu gợi ý",
  colorNative: "Bộ chọn màu",
  colorHex: "Mã màu hex",
  colorInvalid: "Mã màu không hợp lệ, ví dụ #1E88E5",
  // FileUpload
  uploadTitle: "Kéo thả tệp vào đây hoặc bấm để chọn",
  uploadList: "Tệp đã chọn",
  uploadFormats: (formats: string) => `Định dạng: ${formats}`,
  uploadMaxSize: (size: string) => `tối đa ${size}/tệp`,
  uploadMaxFiles: (n: number) => `tối đa ${n} tệp`,
  uploadBadType: (name: string) => `"${name}": định dạng không được hỗ trợ`,
  uploadTooLarge: (name: string, size: string) => `"${name}": vượt quá dung lượng tối đa ${size}`,
  uploadTooMany: (name: string, max: number) => `"${name}": vượt quá số tệp tối đa (${max})`,
  uploadProgress: (name: string) => `Tiến độ tải ${name}`,
  // Image
  imagePreviewTitle: (name: string) => `Xem trước ảnh: ${name}`,
  imageNth: (n: number) => `ảnh ${n}`,
  imagePreviewHelp: "Dùng thanh công cụ hoặc phím + và - để phóng to, thu nhỏ; phím mũi tên trái phải để chuyển ảnh; Esc để đóng.",
  imageToolbar: "Công cụ xem ảnh",
  zoomIn: "Phóng to",
  zoomOut: "Thu nhỏ",
  rotateLeft: "Xoay trái",
  rotateRight: "Xoay phải",
  flipHorizontal: "Lật ngang",
  flipVertical: "Lật dọc",
  imageDownload: "Tải ảnh xuống",
  imagePrev: "Ảnh trước",
  imageNext: "Ảnh sau",
  imagePreviewMask: "Xem trước",
  imagePreviewAction: "Xem trước ảnh",
  imagePreviewOf: (alt: string) => `Xem trước: ${alt}`,
  imageError: "Không tải được ảnh",
  imageErrorOf: (alt: string) => `Không tải được ảnh: ${alt}`,
  // Kanban
  kanbanEmpty: "Chưa có thẻ nào",
  kanbanCardRole: "thẻ có thể di chuyển",
  kanbanColumn: (title: string, n: number) => `${title}, ${n} thẻ`,
  kanbanCount: (n: number) => `${n} thẻ`,
  kanbanCountLimit: (n: number, limit: number) => `${n} trên tối đa ${limit}`,
  kanbanMoveMenu: (item: string) => `Chuyển ${item} sang cột khác`,
  kanbanMoveTo: "Chuyển sang",
  kanbanPicked: (item: string) => `Đã nhấc ${item}. Dùng phím mũi tên để di chuyển, Space để thả, Esc để huỷ.`,
  kanbanMoving: (item: string, column: string, position: number) => `${item} ở cột ${column}, vị trí ${position}.`,
  kanbanDroppedIn: (item: string, column: string) => `Đã thả ${item} vào cột ${column}.`,
  kanbanDropped: (item: string) => `Đã thả ${item}.`,
  kanbanCancelled: (item: string, column: string) => `Đã huỷ, ${item} về cột ${column}.`,
  kanbanMoved: (item: string, column: string) => `${item} đã chuyển sang cột ${column}.`,
  // QRCode
  qrLabel: (value: string) => `Mã QR: ${value}`,
  qrLoading: "Đang tải mã QR",
  qrExpired: "Mã QR đã hết hạn",
  // Rating, Slider
  rating: "Đánh giá",
  sliderValue: "Giá trị",
  sliderMin: "Giá trị nhỏ nhất",
  sliderMax: "Giá trị lớn nhất",
  // TagInput
  tagInputPlaceholder: "Nhập rồi nhấn Enter",
  tagMax: (max: number) => `Tối đa ${max} thẻ`,
  tagDuplicate: (tag: string) => `"${tag}" đã có`,
  tagInvalid: (tag: string) => `"${tag}" không hợp lệ`,
  // Tour
  tourStep: (n: number, total: number) => `Bước ${n} trên ${total}`,
  tourClose: "Đóng hướng dẫn",
  tourSkip: "Bỏ qua",
  tourPrev: "Trước",
  tourNext: "Tiếp",
  tourFinish: "Hoàn tất",
  // Transfer
  transferSource: "Nguồn",
  transferTarget: "Đã chọn",
  transferUnit: "mục",
  transferSelectAll: (list: string) => `Chọn tất cả: ${list}`,
  transferSearchIn: (search: string, list: string) => `${search} trong ${list}`,
  transferRemove: (item: string) => `Bỏ ${item}`,
  transferMoveTo: (list: string) => `Chuyển sang ${list}`,
  transferMoveBack: (list: string) => `Chuyển về ${list}`,
  // DataGrid
  gridActions: "Thao tác",
  gridSearch: "Tìm kiếm...",
  gridSearchLabel: "Tìm kiếm trong bảng",
  gridDensity: "Mật độ dòng",
  gridDensityCompact: "Gọn",
  gridDensityNormal: "Vừa",
  gridDensityComfortable: "Rộng",
  gridColumns: "Cột",
  gridColumnsLabel: "Ẩn hiện cột",
  gridFilters: "Bộ lọc cột",
  gridResetFilters: "Xóa bộ lọc",
  gridVisibleColumns: "Hiển thị cột",
  gridFilterAll: "Tất cả",
  gridExportCsv: "Tệp CSV (.csv)",
  gridExportXls: "Tệp Excel (.xls)",
  gridSelected: (n: number) => `Đã chọn ${n} dòng`,
  gridSelectAllRows: (n: number) => `Chọn tất cả ${n} dòng`,
  gridClearSelection: "Bỏ chọn",
  gridPerPage: "Số dòng/trang",
  gridEditCell: (column: string) => `Sửa ${column}`,
  gridSaving: "Đang lưu…",
  gridEditFailed: "Không lưu được thay đổi.",
  gridExpandRow: "Mở rộng dòng",
  gridCollapseRow: "Thu gọn dòng",
  gridResizeColumn: (column: string) => `Đổi độ rộng cột ${column}`,
  gridExport: "Xuất",
  gridExportLabel: "Xuất dữ liệu",
  gridExportSelected: (n: number) => `Xuất ${n} dòng đã chọn`,
  gridExportRows: (n: number) => `Xuất ${n} dòng`,
  gridScrollable: (label: string) => `${label} (cuộn được)`,
  gridSelectPage: "Chọn tất cả dòng trong trang",
  gridSelectRow: (n: number) => `Chọn dòng ${n}`,
  gridSortedAsc: ", đang sắp xếp tăng dần",
  gridSortedDesc: ", đang sắp xếp giảm dần",
  gridSortHint: ", bấm để sắp xếp",
  gridFilterPlaceholder: "Lọc...",
  gridFilterBy: (column: string) => `Lọc theo ${column}`,
  gridEmptyFiltered: "Không có dòng nào khớp bộ lọc hiện tại.",
  gridRows: (n: number) => `${n} dòng`,
  gridRange: (from: number, to: number, total: number) => `${from}–${to} / ${total} dòng`,
  gridPageSize: "Số dòng mỗi trang",
}

export type UiLabels = typeof viLabels

export interface UiConfig {
  /** Locale BCP 47 cho Intl (số, ngày) và so sánh chuỗi. */
  locale: string
  /** Định dạng ngày theo date-fns, ví dụ "dd/MM/yyyy". */
  dateFormat: string
  /** Cỡ mặc định cho component có prop cỡ. */
  size: UiSize
  /** Bảng nhãn giao diện (aria-label, placeholder, chữ trên nút). */
  labels: UiLabels
}

export const defaultUiConfig: UiConfig = { locale: "vi-VN", dateFormat: "dd/MM/yyyy", size: "default", labels: viLabels }

const UiContext = React.createContext<UiConfig>(defaultUiConfig)

export interface UiProviderProps extends Partial<Omit<UiConfig, "labels">> {
  /** Chỉ cần truyền nhãn muốn đổi; phần còn lại lấy từ provider cha hoặc mặc định. */
  labels?: Partial<UiLabels>
  children: React.ReactNode
}

/** Đặt locale, nhãn và cỡ mặc định cho cây con. Lồng được: provider con chỉ ghi đè phần nó truyền. */
export function UiProvider({ children, labels, locale, dateFormat, size }: UiProviderProps) {
  const parent = React.useContext(UiContext)
  const value = React.useMemo<UiConfig>(() => ({
    locale: locale ?? parent.locale,
    dateFormat: dateFormat ?? parent.dateFormat,
    size: size ?? parent.size,
    labels: labels ? { ...parent.labels, ...labels } : parent.labels,
  }), [parent, labels, locale, dateFormat, size])
  return <UiContext value={value}>{children}</UiContext>
}

/** Đọc cấu hình gần nhất (hoặc mặc định khi không có UiProvider). */
export function useUiConfig(): UiConfig {
  return React.useContext(UiContext)
}
