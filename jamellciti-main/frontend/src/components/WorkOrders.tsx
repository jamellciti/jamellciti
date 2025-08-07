import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { getEventLabel, getEventColor } from '../utils/eventColors';
import type { WorkOrder, WorkOrderStatus, EventType } from '../types';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  Search,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export const WorkOrders: React.FC = () => {
  const { workOrders, updateWorkOrder } = useAppStore();
  const [filter, setFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const workOrdersArray = Object.values(workOrders);

  // Filter and search work orders
  const filteredWorkOrders = workOrdersArray.filter(wo => {
    const matchesFilter = filter === 'all' || wo.status === filter;
    const matchesSearch = wo.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Sort by creation date (newest first)
  const sortedWorkOrders = filteredWorkOrders.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleStatusUpdate = async (workOrderId: string, newStatus: WorkOrderStatus) => {
    try {
      await axios.patch(`${API}/work-orders/${workOrderId}?status=${newStatus}`);
      console.log(`✅ Work order ${workOrderId} updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update work order:', error);
    }
  };

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: WorkOrderStatus) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'closed':
        return <CheckCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getSLAStatus = (workOrder: WorkOrder) => {
    const createdAt = new Date(workOrder.created_at);
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const slaHours = workOrder.estimated_sla_hours;
    
    if (workOrder.status === 'closed') return 'completed';
    if (hoursElapsed > slaHours) return 'overdue';
    if (hoursElapsed > slaHours * 0.8) return 'warning';
    return 'on-time';
  };

  const getSLAColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'completed':
        return 'text-green-600';
      case 'overdue':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'on-time':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const statusCounts = {
    all: workOrdersArray.length,
    open: workOrdersArray.filter(wo => wo.status === 'open').length,
    in_progress: workOrdersArray.filter(wo => wo.status === 'in_progress').length,
    closed: workOrdersArray.filter(wo => wo.status === 'closed').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <p className="text-gray-600 mt-1">Manage and track city maintenance work orders</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Status Filter */}
          <div className="flex space-x-2">
            {(['all', 'open', 'in_progress', 'closed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')} 
                <span className="ml-1 text-xs">
                  ({statusCounts[status]})
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Work Orders Grid */}
      <div className="grid gap-4">
        {sortedWorkOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "No work orders match your search criteria."
                : `No ${filter.replace('_', ' ')} work orders found.`
              }
            </p>
          </div>
        ) : (
          sortedWorkOrders.map((workOrder) => {
            const slaStatus = getSLAStatus(workOrder);
            return (
              <div
                key={workOrder.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedWorkOrder(workOrder)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEventColor(workOrder.type as EventType) }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getEventLabel(workOrder.type as EventType)}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workOrder.status)}`}>
                        {getStatusIcon(workOrder.status)}
                        <span className="ml-1 capitalize">{workOrder.status.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{workOrder.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        Created {formatDistanceToNow(new Date(workOrder.created_at))} ago
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        <span className={getSLAColor(slaStatus)}>
                          SLA: {workOrder.estimated_sla_hours}h
                        </span>
                      </div>
                      <div className="flex items-center">
                        <User size={16} className="mr-1" />
                        ID: {workOrder.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {workOrder.status === 'open' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(workOrder.id, 'in_progress');
                        }}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    {workOrder.status === 'in_progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(workOrder.id, 'closed');
                        }}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Mark Fixed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Work Order Detail Modal */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Work Order Details</h2>
                <button
                  onClick={() => setSelectedWorkOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: getEventColor(selectedWorkOrder.type as EventType) }}
                  >
                    {getEventLabel(selectedWorkOrder.type as EventType).charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getEventLabel(selectedWorkOrder.type as EventType)}
                    </h3>
                    <p className="text-gray-600">ID: {selectedWorkOrder.id}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedWorkOrder.status)}`}>
                      {getStatusIcon(selectedWorkOrder.status)}
                      <span className="ml-1 capitalize">{selectedWorkOrder.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                    {selectedWorkOrder.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                    <p className="text-gray-600">
                      {new Date(selectedWorkOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                    <p className="text-gray-600">
                      {new Date(selectedWorkOrder.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">SLA Target</h4>
                    <p className="text-gray-600">{selectedWorkOrder.estimated_sla_hours} hours</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">Event ID</h4>
                    <p className="text-gray-600 text-sm">{selectedWorkOrder.event_id}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedWorkOrder(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {selectedWorkOrder.status === 'open' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedWorkOrder.id, 'in_progress');
                        setSelectedWorkOrder(null);
                      }}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Start Work
                    </button>
                  )}
                  {selectedWorkOrder.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedWorkOrder.id, 'closed');
                        setSelectedWorkOrder(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};