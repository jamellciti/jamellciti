import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../stores/appStore';
import { getEventLabel, getEventColor } from '../utils/eventColors';
import type { KPIData, EventType } from '../types';
import { 
  TrendingUp, 
  FileText, 
  Receipt, 
  Clock, 
  DollarSign, 
  Target,
  RefreshCw,
  Calendar,
  Video,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import { isToday } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export const KPIDashboard: React.FC = () => {
  const { clusters, workOrders, citations, videoReviews, kpis, setKPIs } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch KPIs from backend
  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/kpis`);
      setKPIs(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  // Calculate client-side KPIs as backup
  const clientKPIs = React.useMemo(() => {
    const clustersArray = Object.values(clusters);
    const workOrdersArray = Object.values(workOrders);
    const citationsArray = Object.values(citations);
    const videoReviewsArray = Object.values(videoReviews);

    const eventsToday = clustersArray.filter(c => 
      isToday(new Date(c.ts))
    ).length;

    const openWorkOrders = workOrdersArray.filter(w => 
      w.status === 'open'
    ).length;

    const closedWorkOrders = workOrdersArray.filter(w => 
      w.status === 'closed'
    ).length;

    const citationsIssued = citationsArray.length;
    const citationsPaid = citationsArray.filter(c => c.status === 'paid').length;
    const citationsContested = citationsArray.filter(c => c.status === 'contested').length;

    const fineTotal = citationsArray.reduce((sum, c) => 
      sum + c.fine_amount, 0
    );

    const videoReviewsQueued = videoReviewsArray.filter(v => v.review_status === 'queued').length;
    const videoReviewsConfirmed = videoReviewsArray.filter(v => v.review_status === 'reviewed').length;

    // Mock SLA calculation
    const avgSla = 36.5;

    return {
      events_today: eventsToday,
      work_orders_open: openWorkOrders,
      work_orders_closed: closedWorkOrders,
      citations_issued: citationsIssued,
      citations_paid: citationsPaid,
      citations_contested: citationsContested,
      total_fine_value: fineTotal,
      avg_sla_hours: avgSla,
      grant_potential: fineTotal * 0.15,
      video_reviews_queued: videoReviewsQueued,
      video_reviews_confirmed: videoReviewsConfirmed,
      dispute_rate: citationsIssued > 0 ? (citationsContested / citationsIssued * 100) : 0,
      video_confirm_rate: videoReviewsArray.length > 0 ? (videoReviewsConfirmed / videoReviewsArray.length * 100) : 0,
      avg_fine_value: citationsIssued > 0 ? (fineTotal / citationsIssued) : 0,
      warnings_sent: 0
    };
  }, [clusters, workOrders, citations, videoReviews]);

  // Use backend KPIs if available, otherwise client-side calculation
  const displayKPIs = kpis || clientKPIs;

  // Chart data for events by type - include new enforcement types
  const chartData = React.useMemo(() => {
    const clustersArray = Object.values(clusters);
    const eventCounts: Record<string, number> = {};

    // Initialize all event types including enforcement
    const eventTypes: EventType[] = [
      'pothole', 'storm_drain_clog', 'near_miss', 'litter_dumping', 'ada_obstruction',
      'illegal_uturn', 'failure_to_yield', 'reckless_merge', 'speeding_school_zone'
    ];
    eventTypes.forEach(type => {
      eventCounts[type] = 0;
    });

    // Count events by type (last 24h)
    clustersArray
      .filter(cluster => {
        const clusterDate = new Date(cluster.ts);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return clusterDate >= yesterday;
      })
      .forEach(cluster => {
        eventCounts[cluster.type] = (eventCounts[cluster.type] || 0) + cluster.count;
      });

    return Object.entries(eventCounts)
      .filter(([_, count]) => count > 0) // Only show types with events
      .map(([type, count]) => ({
        name: getEventLabel(type as EventType),
        count,
        fill: getEventColor(type as EventType)
      }));
  }, [clusters]);

  const kpiCards = [
    {
      title: 'Events Today',
      value: displayKPIs.events_today,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Open Work Orders',
      value: displayKPIs.work_orders_open,
      icon: FileText,
      color: 'bg-orange-50 text-orange-600',
      bgColor: 'bg-orange-500'
    },
    {
      title: 'Citations Issued',
      value: displayKPIs.citations_issued,
      icon: Receipt,
      color: 'bg-purple-50 text-purple-600',
      bgColor: 'bg-purple-500'
    },
    {
      title: 'Avg SLA (hours)',
      value: Math.round(displayKPIs.avg_sla_hours * 10) / 10,
      icon: Clock,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Total Fines',
      value: `$${displayKPIs.total_fine_value.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-red-50 text-red-600',
      bgColor: 'bg-red-500'
    },
    {
      title: 'Grant Potential',
      value: `$${Math.round(displayKPIs.grant_potential).toLocaleString()}`,
      icon: Target,
      color: 'bg-indigo-50 text-indigo-600',
      bgColor: 'bg-indigo-500'
    }
  ];

  const enforcementKpiCards = [
    {
      title: 'Video Reviews Pending',
      value: displayKPIs.video_reviews_queued || 0,
      icon: Video,
      color: 'bg-yellow-50 text-yellow-600',
      bgColor: 'bg-yellow-500'
    },
    {
      title: 'Violations Confirmed',
      value: displayKPIs.video_reviews_confirmed || 0,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Dispute Rate',
      value: `${Math.round(displayKPIs.dispute_rate || 0)}%`,
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
      bgColor: 'bg-red-500'
    },
    {
      title: 'Video Confirm Rate',
      value: `${Math.round(displayKPIs.video_confirm_rate || 0)}%`,
      icon: AlertTriangle,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
          <p className="text-gray-600 flex items-center mt-1">
            <Calendar size={16} className="mr-2" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchKPIs}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* General KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enforcement KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enforcement Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {enforcementKpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Type Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Events by Type (Last 24h)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Work Order Completion Rate</span>
              <span className="font-semibold text-gray-900">
                {displayKPIs.work_orders_closed > 0 
                  ? Math.round((displayKPIs.work_orders_closed / (displayKPIs.work_orders_closed + displayKPIs.work_orders_open)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Revenue per Citation</span>
              <span className="font-semibold text-gray-900">
                ${Math.round(displayKPIs.avg_fine_value || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Grant Conversion Rate</span>
              <span className="font-semibold text-green-600">15%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Active Clusters</span>
              <span className="font-semibold text-gray-900">
                {Object.keys(clusters).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};