import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  Car
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalSpots: number;
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  pendingVerifications: number;
}

interface PaymentSlip {
  id: string;
  booking_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  upload_status: 'pending' | 'verified' | 'rejected';
  verification_notes: string | null;
  created_at: string;
  booking: {
    id: string;
    total_cost: number;
    user: {
      name: string;
      email: string;
    };
    parking_spot: {
      name: string;
    };
  };
}

export const BackendAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'spots' | 'bookings' | 'payments' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOwners: 0,
    totalSpots: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    pendingVerifications: 0
  });
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState<PaymentSlip | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const [usersResult, ownersResult, spotsResult, bookingsResult, paymentsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('user_type', 'customer'),
        supabase.from('users').select('id', { count: 'exact' }).eq('user_type', 'owner'),
        supabase.from('parking_spots').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id, total_cost', { count: 'exact' }),
        supabase.from('payment_slips').select('id', { count: 'exact' }).eq('upload_status', 'pending')
      ]);

      const totalRevenue = bookingsResult.data?.reduce((sum, booking) => sum + booking.total_cost, 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalOwners: ownersResult.count || 0,
        totalSpots: spotsResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        totalRevenue,
        pendingPayments: paymentsResult.count || 0,
        pendingVerifications: 0 // This would be calculated based on owner verification status
      });

      // Load payment slips
      const { data: slips } = await supabase
        .from('payment_slips')
        .select(`
          *,
          booking:bookings(
            id,
            total_cost,
            user:users(name, email),
            parking_spot:parking_spots(name)
          )
        `)
        .order('created_at', { ascending: false });

      setPaymentSlips(slips || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentVerification = async (slipId: string, status: 'verified' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('payment_slips')
        .update({
          upload_status: status,
          verification_notes: notes,
          verified_at: new Date().toISOString()
        })
        .eq('id', slipId);

      if (error) throw error;

      // Update local state
      setPaymentSlips(prev => prev.map(slip => 
        slip.id === slipId 
          ? { ...slip, upload_status: status, verification_notes: notes }
          : slip
      ));

      // If verified, update booking status
      if (status === 'verified') {
        const slip = paymentSlips.find(s => s.id === slipId);
        if (slip) {
          await supabase
            .from('bookings')
            .update({ payment_status: 'paid', status: 'confirmed' })
            .eq('id', slip.booking_id);
        }
      }

      setSelectedPaymentSlip(null);
      alert(`Payment slip ${status} successfully!`);
    } catch (error) {
      console.error('Error updating payment slip:', error);
      alert('Error updating payment slip');
    }
  };

  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Parking Owners', value: stats.totalOwners, icon: Shield, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Parking Spots', value: stats.totalSpots, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue and Pending Items */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Total platform revenue</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Actions</h3>
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Verifications</span>
              <span className="font-semibold text-orange-600">{stats.pendingPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Owner Verifications</span>
              <span className="font-semibold text-orange-600">{stats.pendingVerifications}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payment Slips</h3>
        <div className="space-y-4">
          {paymentSlips.slice(0, 5).map((slip) => (
            <div key={slip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{slip.booking.user.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    slip.upload_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    slip.upload_status === 'verified' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {slip.upload_status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {slip.booking.parking_spot.name} • ${slip.booking.total_cost}
                </div>
              </div>
              <button
                onClick={() => setSelectedPaymentSlip(slip)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PaymentsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Payment Slip Verification</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button className="flex items-center space-x-2 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Parking Spot</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Uploaded</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentSlips.map((slip) => (
                <tr key={slip.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{slip.booking.user.name}</div>
                      <div className="text-sm text-gray-600">{slip.booking.user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{slip.booking.parking_spot.name}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">${slip.booking.total_cost}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slip.upload_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      slip.upload_status === 'verified' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {slip.upload_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(slip.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedPaymentSlip(slip)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewSection />;
      case 'payments': return <PaymentsSection />;
      default: return <OverviewSection />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Backend Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, verify payments, and monitor platform activity
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'spots', label: 'Parking Spots', icon: MapPin },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'payments', label: 'Payment Verification', icon: FileText },
              { id: 'reports', label: 'Reports', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-6 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'payments' && stats.pendingPayments > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {stats.pendingPayments}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Payment Slip Modal */}
        {selectedPaymentSlip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Payment Slip Verification</h3>
                  <button
                    onClick={() => setSelectedPaymentSlip(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-2 font-medium">{selectedPaymentSlip.booking.user.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2">{selectedPaymentSlip.booking.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Parking Spot:</span>
                      <span className="ml-2 font-medium">{selectedPaymentSlip.booking.parking_spot.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-bold text-green-600">${selectedPaymentSlip.booking.total_cost}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Slip */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Uploaded Payment Slip</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{selectedPaymentSlip.file_name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPaymentSlip.upload_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedPaymentSlip.upload_status === 'verified' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedPaymentSlip.upload_status}
                      </span>
                    </div>
                    
                    {selectedPaymentSlip.file_url.toLowerCase().includes('.pdf') ? (
                      <div className="text-center py-8">
                        <FileText className="h-16 w-16 text-red-600 mx-auto mb-4" />
                        <a
                          href={selectedPaymentSlip.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={selectedPaymentSlip.file_url}
                        alt="Payment slip"
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    )}
                  </div>
                </div>

                {/* Verification Notes */}
                {selectedPaymentSlip.verification_notes && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Verification Notes</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedPaymentSlip.verification_notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedPaymentSlip.upload_status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const notes = prompt('Enter verification notes (optional):');
                        handlePaymentVerification(selectedPaymentSlip.id, 'verified', notes || undefined);
                      }}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Verify Payment</span>
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Enter rejection reason:');
                        if (notes) {
                          handlePaymentVerification(selectedPaymentSlip.id, 'rejected', notes);
                        }
                      }}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>Reject Payment</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};