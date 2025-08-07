import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import type { WebSocketMessage, InitialData, Cluster, WorkOrder, Citation } from '../types';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/live';

export const useLiveFeed = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const pingTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    setClusters, 
    setWorkOrders, 
    setCitations, 
    updateCluster, 
    updateWorkOrder, 
    updateCitation, 
    setConnected 
  } = useAppStore();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    console.log('🔌 Connecting to WebSocket:', WS_URL);
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      
      // Start heartbeat
      pingTimer.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'INITIAL_DATA':
            const initialData = message.data as InitialData;
            console.log('📊 Initial data received:', initialData);
            
            // Convert arrays to objects keyed by id
            const clustersObj = initialData.clusters.reduce((acc, cluster) => {
              acc[cluster.id] = cluster;
              return acc;
            }, {} as Record<string, Cluster>);
            
            const workOrdersObj = initialData.work_orders.reduce((acc, wo) => {
              acc[wo.id] = wo;
              return acc;
            }, {} as Record<string, WorkOrder>);
            
            const citationsObj = initialData.citations.reduce((acc, citation) => {
              acc[citation.id] = citation;
              return acc;
            }, {} as Record<string, Citation>);
            
            setClusters(clustersObj);
            setWorkOrders(workOrdersObj);
            setCitations(citationsObj);
            break;

          case 'UPSERT_CLUSTER':
            const cluster = message.data as Cluster;
            console.log('🆕 Cluster update:', cluster);
            updateCluster(cluster);
            break;

          case 'UPSERT_WORK_ORDER':
            const workOrder = message.data as WorkOrder;
            console.log('🔧 Work order update:', workOrder);
            updateWorkOrder(workOrder);
            break;

          case 'UPSERT_CITATION':
            const citation = message.data as Citation;
            console.log('🎫 Citation update:', citation);
            updateCitation(citation);
            break;

          case 'ping':
            // Respond to server ping
            ws.current?.send(JSON.stringify({ type: 'pong' }));
            break;

          case 'pong':
            // Server acknowledged our ping
            console.log('🏓 Pong received');
            break;

          default:
            console.log('📩 Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      setConnected(false);
      
      // Clear heartbeat
      if (pingTimer.current) {
        clearInterval(pingTimer.current);
        pingTimer.current = null;
      }
      
      // Attempt to reconnect after 3 seconds
      if (!event.wasClean) {
        reconnectTimer.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 3000);
      }
    };

    ws.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnected(false);
    };
  }, [setClusters, setWorkOrders, setCitations, updateCluster, updateWorkOrder, updateCitation, setConnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting');
      ws.current = null;
    }
    
    setConnected(false);
  }, [setConnected]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};