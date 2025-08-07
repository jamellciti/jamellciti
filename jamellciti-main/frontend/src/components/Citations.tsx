import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { getEventLabel, getEventColor } from '../utils/eventColors';
import type { Citation, CitationStatus, EventType } from '../types';
import { 
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Calendar,
  MapPin,
  User,
  CreditCard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Citations: React.FC = () => {
  const { citations } = useAppStore();
  const [filter, setFilter] = useState<CitationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const citationsArray = Object.values(citations);

  // Filter and search citations
  const filteredCitations = citationsArray.filter(citation => {
    const matchesFilter = filter === 'all' || citation.status === filter;
    const matchesSearch = citation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         citation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         citation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Sort by creation date (newest first)
  const sortedCitations = filteredCitations.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getStatusColor = (status: CitationStatus) => {
    switch (status) {
      case 'issued':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'contested':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: CitationStatus) => {
    switch (status) {
      case 'issued':
        return <AlertCircle size={16} />;
      case 'paid':
        return <CheckCircle size={16} />;
      case 'contested':
        return <Clock size={16} />;
      default:
        return <Receipt size={16} />;
    }
  };

  const statusCounts = {
    all: citationsArray.length,
    issued: citationsArray.filter(c => c.status === 'issued').length,
    paid: citationsArray.filter(c => c.status === 'paid').length,
    contested: citationsArray.filter(c => c.status === 'contested').length,
  };

  const totalFines = citationsArray.reduce((sum, citation) => sum + citation.fine_amount, 0);
  const paidFines = citationsArray
    .filter(c => c.status === 'paid')
    .reduce((sum, citation) => sum + citation.fine_amount, 0);
  const pendingFines = totalFines - paidFines;

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Citations Ledger</h1>
        <p className="text-gray-600 mt-1">Track fines and citation payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Receipt className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Citations</p>
              <p className="text-2xl font-bold text-gray-900">{citationsArray.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Fines</p>
              <p className="text-2xl font-bold text-gray-900">${totalFines.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">${paidFines.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-red-600">${pendingFines.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Status Filter */}
          <div className="flex space-x-2">
            {(['all', 'issued', 'paid', 'contested'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status} 
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
              placeholder="Search citations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Citations Grid */}
      <div className="grid gap-4">
        {sortedCitations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No citations found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "No citations match your search criteria."
                : `No ${filter} citations found.`
              }
            </p>
          </div>
        ) : (
          sortedCitations.map((citation) => (
            <div
              key={citation.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCitation(citation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getEventColor(citation.type as EventType) }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getEventLabel(citation.type as EventType)}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(citation.status)}`}>
                      {getStatusIcon(citation.status)}
                      <span className="ml-1 capitalize">{citation.status}</span>
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{citation.description}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      Issued {formatDistanceToNow(new Date(citation.created_at))} ago
                    </div>
                    <div className="flex items-center">
                      <User size={16} className="mr-1" />
                      ID: {citation.id.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 ml-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${citation.fine_amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Fine Amount</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Citation Detail Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Citation Details</h2>
                <button
                  onClick={() => setSelectedCitation(null)}
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
                    style={{ backgroundColor: getEventColor(selectedCitation.type as EventType) }}
                  >
                    {getEventLabel(selectedCitation.type as EventType).charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getEventLabel(selectedCitation.type as EventType)}
                    </h3>
                    <p className="text-gray-600">ID: {selectedCitation.id}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCitation.status)}`}>
                      {getStatusIcon(selectedCitation.status)}
                      <span className="ml-1 capitalize">{selectedCitation.status}</span>
                    </span>
                  </div>
                </div>

                {/* Fine Amount */}
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <DollarSign size={32} className="mx-auto text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    ${selectedCitation.fine_amount.toLocaleString()}
                  </p>
                  <p className="text-gray-600">Fine Amount</p>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Violation Description</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                    {selectedCitation.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">Issued Date</h4>
                    <p className="text-gray-600">
                      {new Date(selectedCitation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                    <p className="text-gray-600 capitalize">{selectedCitation.status}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                    <h4 className="font-medium text-gray-900 mb-1">Related Event ID</h4>
                    <p className="text-gray-600 text-sm font-mono">{selectedCitation.event_id}</p>
                  </div>
                </div>

                {/* Payment Info */}
                {selectedCitation.status === 'issued' && (
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center mb-2">
                      <CreditCard size={20} className="text-orange-600 mr-2" />
                      <h4 className="font-medium text-orange-800">Payment Required</h4>
                    </div>
                    <p className="text-sm text-orange-700">
                      This citation requires payment within 30 days of issue date to avoid additional penalties.
                    </p>
                  </div>
                )}

                {selectedCitation.status === 'paid' && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center mb-2">
                      <CheckCircle size={20} className="text-green-600 mr-2" />
                      <h4 className="font-medium text-green-800">Payment Received</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      This citation has been paid in full. No further action required.
                    </p>
                  </div>
                )}

                {selectedCitation.status === 'contested' && (
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center mb-2">
                      <Clock size={20} className="text-yellow-600 mr-2" />
                      <h4 className="font-medium text-yellow-800">Under Review</h4>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This citation is being contested and is currently under review by the citation review board.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedCitation(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Print Citation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};