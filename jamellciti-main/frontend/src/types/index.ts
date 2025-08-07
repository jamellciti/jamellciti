// Aura Vision TypeScript Type Definitions

export interface Cluster {
  id: string;
  type: EventType;
  lat: number;
  lon: number;
  severity: number;
  count: number;
  ts: string;
  updated_at: string;
  city: string;
}

export interface WorkOrder {
  id: string;
  event_id: string;
  type: string;
  description: string;
  status: WorkOrderStatus;
  created_at: string;
  updated_at: string;
  estimated_sla_hours: number;
}

export interface Citation {
  id: string;
  event_id: string;
  type: string;
  description: string;
  fine_amount: number;
  status: CitationStatus;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  city: string;
  created_at: string;
}

export interface APIKey {
  api_key: string;
  name: string;
  city: string;
}

export interface VideoReview {
  id: string;
  event_id: string;
  video_url: string;
  thumbnail_url: string;
  review_status: ReviewStatus;
  destination_agency: string;
  confidence_score: number;
  reviewer_comments: string;
  created_at: string;
  reviewed_at?: string;
}

export interface KPIData {
  events_today: number;
  work_orders_open: number;
  work_orders_closed: number;
  citations_issued: number;
  citations_paid: number;
  citations_contested: number;
  total_fine_value: number;
  avg_sla_hours: number;
  grant_potential: number;
  // New enforcement KPIs
  video_reviews_queued: number;
  video_reviews_confirmed: number;
  dispute_rate: number;
  video_confirm_rate: number;
  avg_fine_value: number;
  warnings_sent: number;
}

export interface WebSocketMessage {
  type: 'INITIAL_DATA' | 'UPSERT_CLUSTER' | 'UPSERT_WORK_ORDER' | 'UPSERT_CITATION' | 'UPSERT_VIDEO_REVIEW' | 'ping' | 'pong';
  data?: any;
  timestamp: string;
}

export interface InitialData {
  clusters: Cluster[];
  work_orders: WorkOrder[];
  citations: Citation[];
  video_reviews: VideoReview[];
}

export type EventType = 'pothole' | 'storm_drain_clog' | 'near_miss' | 'litter_dumping' | 'ada_obstruction' |
  'illegal_uturn' | 'failure_to_yield' | 'reckless_merge' | 'speeding_school_zone';
export type WorkOrderStatus = 'open' | 'in_progress' | 'closed';
export type CitationStatus = 'issued' | 'paid' | 'contested';
export type ReviewStatus = 'queued' | 'forwarded' | 'reviewed' | 'resolved';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface AppState {
  clusters: Record<string, Cluster>;
  workOrders: Record<string, WorkOrder>;
  citations: Record<string, Citation>;
  videoReviews: Record<string, VideoReview>;
  kpis: KPIData | null;
  isConnected: boolean;
  setClusters: (clusters: Record<string, Cluster>) => void;
  setWorkOrders: (workOrders: Record<string, WorkOrder>) => void;
  setCitations: (citations: Record<string, Citation>) => void;
  setVideoReviews: (videoReviews: Record<string, VideoReview>) => void;
  setKPIs: (kpis: KPIData) => void;
  updateCluster: (cluster: Cluster) => void;
  updateWorkOrder: (workOrder: WorkOrder) => void;
  updateCitation: (citation: Citation) => void;
  updateVideoReview: (videoReview: VideoReview) => void;
  setConnected: (connected: boolean) => void;
}

export interface MapMarker {
  id: string;
  type: EventType;
  lat: number;
  lon: number;
  severity: number;
  count: number;
  color: string;
  icon: string;
}