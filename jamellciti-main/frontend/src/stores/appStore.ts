import { create } from 'zustand';
import type { AppState, Cluster, WorkOrder, Citation, VideoReview, KPIData } from '../types';

export const useAppStore = create<AppState>((set, get) => ({
  clusters: {},
  workOrders: {},
  citations: {},
  videoReviews: {},
  kpis: null,
  isConnected: false,

  setClusters: (clusters) => set({ clusters }),
  
  setWorkOrders: (workOrders) => set({ workOrders }),
  
  setCitations: (citations) => set({ citations }),
  
  setVideoReviews: (videoReviews) => set({ videoReviews }),
  
  setKPIs: (kpis) => set({ kpis }),
  
  updateCluster: (cluster) => 
    set((state) => ({
      clusters: { ...state.clusters, [cluster.id]: cluster }
    })),
  
  updateWorkOrder: (workOrder) => 
    set((state) => ({
      workOrders: { ...state.workOrders, [workOrder.id]: workOrder }
    })),
  
  updateCitation: (citation) => 
    set((state) => ({
      citations: { ...state.citations, [citation.id]: citation }
    })),
  
  updateVideoReview: (videoReview) => 
    set((state) => ({
      videoReviews: { ...state.videoReviews, [videoReview.id]: videoReview }
    })),
  
  setConnected: (connected) => set({ isConnected: connected }),
}));