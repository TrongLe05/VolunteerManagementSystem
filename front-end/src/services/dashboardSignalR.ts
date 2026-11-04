import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

export type RealtimeEventType =
  | "ActivityChanged"
  | "CampaignChanged"
  | "OrganizationChanged"
  | "VolunteerChanged";

class DashboardSignalRService {
  private connection: HubConnection | null = null;
  private isStarting = false;
  private listeners: Map<RealtimeEventType, Set<() => void>> = new Map([
    ["ActivityChanged", new Set()],
    ["CampaignChanged", new Set()],
    ["OrganizationChanged", new Set()],
    ["VolunteerChanged", new Set()],
  ]);

  public getConnection(): HubConnection {
    if (!this.connection) {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? "/api" : "https://localhost:7161/api");
      const hubBase = apiBase.replace(/\/api\/?$/, "");
      const hubUrl = hubBase ? `${hubBase}/hubs/dashboard` : "/hubs/dashboard";

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => localStorage.getItem("accessToken") || "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Warning)
        .build();

      const events: RealtimeEventType[] = [
        "ActivityChanged",
        "CampaignChanged",
        "OrganizationChanged",
        "VolunteerChanged",
      ];

      events.forEach((evt) => {
        this.connection!.on(evt, () => {
          this.listeners.get(evt)?.forEach((cb) => {
            try {
              cb();
            } catch (err) {
              console.error(`Lỗi khi thực thi callback sự kiện ${evt}:`, err);
            }
          });
        });
      });
    }

    return this.connection;
  }

  public async start(): Promise<void> {
    const conn = this.getConnection();
    if (
      conn.state === HubConnectionState.Disconnected &&
      !this.isStarting
    ) {
      this.isStarting = true;
      try {
        await conn.start();
      } catch (err) {
        console.warn(
          "Không thể kết nối ngay tới SignalR Hub, hệ thống sẽ tự động thử lại:",
          err,
        );
      } finally {
        this.isStarting = false;
      }
    }
  }

  public subscribe(
    event: RealtimeEventType,
    callback: () => void,
  ): () => void {
    const set = this.listeners.get(event);
    set?.add(callback);
    this.start();

    return () => {
      set?.delete(callback);
    };
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

export const dashboardSignalR = new DashboardSignalRService();
