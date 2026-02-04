/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANKR Portal Widgets - Domain-Agnostic Components
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Reusable widgets for ALL portals:
 * - Customer Portal
 * - Vendor Portal  
 * - Driver Portal
 * - Admin Dashboard
 * 
 * Features:
 * - Invoice & Payment widgets
 * - Order tracking widgets
 * - Approval workflow widgets
 * - Mini Command Center
 * - Rating system
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Package, MapPin, Truck, IndianRupee, Clock, CheckCircle,
  AlertCircle, FileText, Download, Eye, Phone, Star, TrendingUp,
  ChevronRight, Filter, Search, RefreshCw, X, Check, XCircle,
  Navigation, Camera, Calendar, CreditCard, Receipt, Wallet
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// GRAPHQL QUERIES
// ═══════════════════════════════════════════════════════════════════════════

export const PORTAL_QUERIES = {
  // Customer queries
  MY_ORDERS: gql`
    query MyOrders($customerId: String, $status: String) {
      orders(customerId: $customerId, status: $status) {
        id orderNumber status originCity destCity 
        quotedAmount createdAt
        trips { id status vehicle { vehicleNumber } driver { name phone } }
      }
    }
  `,
  
  MY_INVOICES: gql`
    query MyInvoices($customerId: String, $status: String) {
      invoices(customerId: $customerId, status: $status) {
        id invoiceNumber status totalAmount paidAmount balanceAmount
        dueDate createdAt
        order { orderNumber originCity destCity }
      }
    }
  `,

  // Vendor queries
  MY_VEHICLES: gql`
    query MyVehicles($status: String) {
      vehicles(status: $status) {
        id vehicleNumber type capacity status
        currentDriver { id name phone }
        currentPosition { lat lng speed timestamp }
      }
    }
  `,

  MY_TRIPS: gql`
    query MyTrips($vehicleId: String, $driverId: String, $status: String) {
      trips(vehicleId: $vehicleId, driverId: $driverId, status: $status) {
        id tripNumber status startLocation endLocation
        plannedDistance actualDistance fuelCost tollCost
        plannedStart actualStart actualEnd
        vehicle { vehicleNumber }
        driver { name }
        order { orderNumber quotedAmount }
      }
    }
  `,

  // Tracking
  VEHICLE_POSITION: gql`
    query VehiclePosition($vehicleId: ID!) {
      vehiclePositions(vehicleId: $vehicleId) {
        lat lng speed heading timestamp
      }
    }
  `,

  LIVE_POSITIONS: gql`
    query LivePositions {
      livePositions {
        vehicleId lat lng speed heading timestamp
        vehicle { vehicleNumber type }
      }
    }
  `,
};

export const PORTAL_MUTATIONS = {
  // Invoice actions
  APPROVE_INVOICE: gql`
    mutation ApproveInvoice($id: ID!) {
      updateInvoiceStatus(id: $id, status: "approved") { id status }
    }
  `,

  MAKE_PAYMENT: gql`
    mutation MakePayment($invoiceId: ID!, $amount: Float!, $paymentMode: String!, $referenceNo: String) {
      createPayment(input: { invoiceId: $invoiceId, amount: $amount, paymentMode: $paymentMode, referenceNo: $referenceNo }) {
        id amount paymentMode
      }
    }
  `,

  // Order actions
  APPROVE_ORDER: gql`
    mutation ApproveOrder($id: ID!) {
      updateOrderStatus(id: $id, status: "confirmed") { id status }
    }
  `,

  CANCEL_ORDER: gql`
    mutation CancelOrder($id: ID!, $reason: String) {
      updateOrderStatus(id: $id, status: "cancelled") { id status }
    }
  `,

  // Trip actions  
  UPDATE_TRIP_STATUS: gql`
    mutation UpdateTripStatus($id: ID!, $status: String!) {
      updateTripStatus(id: $id, status: $status) { id status }
    }
  `,

  // Rating
  SUBMIT_RATING: gql`
    mutation SubmitRating($tripId: ID!, $rating: Int!, $review: String, $tags: [String]) {
      submitRating(tripId: $tripId, rating: $rating, review: $review, tags: $tags) { id }
    }
  `,
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const formatINR = (amount: number): string => {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Order statuses
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_transit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    // Invoice statuses
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
    // Vehicle statuses
    available: 'bg-green-500/20 text-green-400 border-green-500/30',
    on_trip: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    maintenance: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[status?.toLowerCase()] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export const getStatusIcon = (status: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    confirmed: <CheckCircle className="w-4 h-4" />,
    in_transit: <Truck className="w-4 h-4" />,
    delivered: <Package className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
    available: <CheckCircle className="w-4 h-4" />,
    on_trip: <Navigation className="w-4 h-4" />,
  };
  return icons[status?.toLowerCase()] || <AlertCircle className="w-4 h-4" />;
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: ORDER LIST
// ═══════════════════════════════════════════════════════════════════════════

interface OrderListWidgetProps {
  customerId?: string;
  vendorId?: string;
  limit?: number;
  showActions?: boolean;
  onOrderClick?: (order: any) => void;
  compact?: boolean;
}

export const OrderListWidget: React.FC<OrderListWidgetProps> = ({
  customerId,
  vendorId,
  limit = 5,
  showActions = false,
  onOrderClick,
  compact = false,
}) => {
  const { data, loading, refetch } = useQuery(PORTAL_QUERIES.MY_ORDERS, {
    variables: { customerId },
    skip: !customerId,
  });

  const orders = data?.orders?.slice(0, limit) || [];

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800 rounded-xl h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order: any) => (
        <div
          key={order.id}
          onClick={() => onOrderClick?.(order)}
          className={`bg-slate-800 hover:bg-slate-750 rounded-xl p-4 cursor-pointer transition-colors ${
            compact ? 'p-3' : 'p-4'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
              </div>
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-slate-400">
                  {order.originCity} → {order.destCity}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-400">{formatINR(order.quotedAmount)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Trip info if available */}
          {order.trips?.[0] && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Truck className="w-4 h-4" />
                <span>{order.trips[0].vehicle?.vehicleNumber}</span>
              </div>
              {order.trips[0].driver && (
                <a 
                  href={`tel:${order.trips[0].driver.phone}`}
                  className="flex items-center gap-1 text-blue-400"
                  onClick={e => e.stopPropagation()}
                >
                  <Phone className="w-4 h-4" />
                  <span>{order.trips[0].driver.name}</span>
                </a>
              )}
            </div>
          )}

          {showActions && order.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium">
                ✅ Approve
              </button>
              <button className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium">
                ✏️ Edit
              </button>
            </div>
          )}
        </div>
      ))}

      {orders.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: INVOICE LIST WITH APPROVAL
// ═══════════════════════════════════════════════════════════════════════════

interface InvoiceListWidgetProps {
  customerId?: string;
  vendorId?: string;
  showApproval?: boolean;
  showPayment?: boolean;
  limit?: number;
  onInvoiceClick?: (invoice: any) => void;
}

export const InvoiceListWidget: React.FC<InvoiceListWidgetProps> = ({
  customerId,
  vendorId,
  showApproval = false,
  showPayment = false,
  limit = 5,
  onInvoiceClick,
}) => {
  const { data, loading, refetch } = useQuery(PORTAL_QUERIES.MY_INVOICES, {
    variables: { customerId },
    skip: !customerId,
  });
  const [approveInvoice] = useMutation(PORTAL_MUTATIONS.APPROVE_INVOICE);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);

  const invoices = data?.invoices?.slice(0, limit) || [];

  const handleApprove = async (id: string) => {
    await approveInvoice({ variables: { id } });
    refetch();
  };

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-40" />;
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice: any) => {
        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
        
        return (
          <div
            key={invoice.id}
            className="bg-slate-800 rounded-xl p-4 hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{invoice.invoiceNumber}</p>
                <p className="text-sm text-slate-400">
                  {invoice.order?.orderNumber} • {invoice.order?.originCity} → {invoice.order?.destCity}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs border ${
                isOverdue ? 'bg-red-500/20 text-red-400 border-red-500/30' : getStatusColor(invoice.status)
              }`}>
                {isOverdue ? '⚠️ Overdue' : invoice.status}
              </span>
            </div>

            {/* Amount breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-semibold">{formatINR(invoice.totalAmount)}</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <p className="text-xs text-green-400">Paid</p>
                <p className="font-semibold text-green-400">{formatINR(invoice.paidAmount)}</p>
              </div>
              <div className={`rounded-lg p-2 text-center ${
                invoice.balanceAmount > 0 ? 'bg-red-500/10' : 'bg-slate-700/50'
              }`}>
                <p className="text-xs text-slate-400">Balance</p>
                <p className={`font-semibold ${invoice.balanceAmount > 0 ? 'text-red-400' : ''}`}>
                  {formatINR(invoice.balanceAmount)}
                </p>
              </div>
            </div>

            {/* Due date */}
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => onInvoiceClick?.(invoice)}
                  className="text-blue-400 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button className="text-blue-400 flex items-center gap-1">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            {/* Actions */}
            {(showApproval || showPayment) && invoice.status !== 'paid' && (
              <div className="flex gap-2">
                {showApproval && invoice.status === 'sent' && (
                  <button 
                    onClick={() => handleApprove(invoice.id)}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                {showPayment && invoice.balanceAmount > 0 && (
                  <button 
                    onClick={() => setShowPaymentModal(invoice.id)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Now
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {invoices.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No invoices found</p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: LIVE TRACKING MAP (Mini Command Center)
// ═══════════════════════════════════════════════════════════════════════════

interface LiveTrackingWidgetProps {
  vehicleIds?: string[];
  tripId?: string;
  height?: number;
  showControls?: boolean;
}

export const LiveTrackingWidget: React.FC<LiveTrackingWidgetProps> = ({
  vehicleIds,
  tripId,
  height = 300,
  showControls = true,
}) => {
  const { data, loading } = useQuery(PORTAL_QUERIES.LIVE_POSITIONS);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const positions = data?.livePositions || [];
  const filteredPositions = vehicleIds 
    ? positions.filter((p: any) => vehicleIds.includes(p.vehicleId))
    : positions;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden" style={{ height }}>
      {/* Map Header */}
      {showControls && (
        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Live Tracking</span>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
              {filteredPositions.length} vehicles
            </span>
          </div>
          <button className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Map Placeholder - Replace with actual map */}
      <div 
        className="relative bg-slate-900 flex items-center justify-center"
        style={{ height: showControls ? height - 52 : height }}
      >
        {/* Simulated map with vehicle markers */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-blue-900/50 to-slate-900" />
        </div>

        {/* Vehicle markers */}
        {filteredPositions.map((pos: any, i: number) => (
          <div
            key={pos.vehicleId}
            className={`absolute p-2 rounded-full cursor-pointer transition-all ${
              selectedVehicle === pos.vehicleId 
                ? 'bg-blue-500 scale-125 z-10' 
                : 'bg-green-500 hover:scale-110'
            }`}
            style={{
              left: `${20 + (i * 15) % 60}%`,
              top: `${20 + (i * 20) % 60}%`,
            }}
            onClick={() => setSelectedVehicle(pos.vehicleId)}
          >
            <Truck className="w-4 h-4" />
          </div>
        ))}

        {/* No data message */}
        {filteredPositions.length === 0 && !loading && (
          <div className="text-center text-slate-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No live positions available</p>
          </div>
        )}

        {/* Selected vehicle info */}
        {selectedVehicle && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-800/95 backdrop-blur rounded-xl p-3 border border-slate-700">
            {(() => {
              const vehicle = filteredPositions.find((p: any) => p.vehicleId === selectedVehicle);
              return vehicle ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{vehicle.vehicle?.vehicleNumber}</p>
                    <p className="text-sm text-slate-400">
                      Speed: {vehicle.speed || 0} km/h
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-blue-600 rounded-lg">
                      <Navigation className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-green-600 rounded-lg">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: RATING & REVIEW
// ═══════════════════════════════════════════════════════════════════════════

interface RatingWidgetProps {
  tripId: string;
  entityType: 'driver' | 'transporter' | 'customer';
  entityName: string;
  onSubmit?: (rating: number, review: string) => void;
}

export const RatingWidget: React.FC<RatingWidgetProps> = ({
  tripId,
  entityType,
  entityName,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const [submitRating] = useMutation(PORTAL_MUTATIONS.SUBMIT_RATING);

  const tagOptions = entityType === 'driver' 
    ? ['On Time', 'Safe Driving', 'Good Communication', 'Professional', 'Helpful']
    : entityType === 'transporter'
    ? ['Reliable', 'Fair Pricing', 'Good Vehicles', 'Professional', 'On Time']
    : ['Clear Instructions', 'Easy Loading', 'Payment On Time', 'Professional'];

  const handleSubmit = async () => {
    await submitRating({ variables: { tripId, rating, review, tags } });
    setSubmitted(true);
    onSubmit?.(rating, review);
  };

  if (submitted) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <p className="font-medium text-green-400">Thank you for your feedback!</p>
        <p className="text-sm text-slate-400 mt-1">Your rating helps improve our service.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h3 className="font-medium mb-4 text-center">
        Rate your experience with {entityName}
      </h3>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star 
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-slate-600'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {tagOptions.map(tag => (
          <button
            key={tag}
            onClick={() => setTags(prev => 
              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            )}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              tags.includes(tag)
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Review text */}
      <textarea
        value={review}
        onChange={e => setReview(e.target.value)}
        placeholder="Write your review (optional)"
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl resize-none h-20 focus:border-blue-500 focus:outline-none"
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className={`w-full mt-4 py-3 rounded-xl font-medium transition-colors ${
          rating > 0
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        Submit Rating
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: APPROVAL QUEUE
// ═══════════════════════════════════════════════════════════════════════════

interface ApprovalItem {
  id: string;
  type: 'order' | 'invoice' | 'trip' | 'expense';
  title: string;
  subtitle: string;
  amount?: number;
  requestedBy: string;
  requestedAt: Date;
  priority: 'low' | 'medium' | 'high';
}

interface ApprovalQueueWidgetProps {
  items: ApprovalItem[];
  onApprove: (id: string, type: string) => void;
  onReject: (id: string, type: string) => void;
  onViewDetails: (id: string, type: string) => void;
}

export const ApprovalQueueWidget: React.FC<ApprovalQueueWidgetProps> = ({
  items,
  onApprove,
  onReject,
  onViewDetails,
}) => {
  const priorityColors = {
    low: 'bg-slate-500/20 text-slate-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  };

  const typeIcons = {
    order: Package,
    invoice: Receipt,
    trip: Truck,
    expense: Wallet,
  };

  return (
    <div className="space-y-3">
      {items.map(item => {
        const Icon = typeIcons[item.type];
        return (
          <div key={item.id} className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${priorityColors[item.priority]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.subtitle}</p>
                </div>
              </div>
              {item.amount && (
                <p className="font-semibold text-green-400">{formatINR(item.amount)}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
              <span>Requested by: {item.requestedBy}</span>
              <span>{new Date(item.requestedAt).toLocaleDateString('en-IN')}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(item.id, item.type)}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => onReject(item.id, item.type)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => onViewDetails(item.id, item.type)}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>All caught up! No pending approvals.</p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: FLEET OVERVIEW (for Vendor)
// ═══════════════════════════════════════════════════════════════════════════

interface FleetOverviewWidgetProps {
  vendorId?: string;
  onVehicleClick?: (vehicle: any) => void;
}

export const FleetOverviewWidget: React.FC<FleetOverviewWidgetProps> = ({
  vendorId,
  onVehicleClick,
}) => {
  const { data, loading } = useQuery(PORTAL_QUERIES.MY_VEHICLES);
  
  const vehicles = data?.vehicles || [];
  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v: any) => v.status === 'available').length,
    onTrip: vehicles.filter((v: any) => v.status === 'on_trip' || v.status === 'in_transit').length,
    maintenance: vehicles.filter((v: any) => v.status === 'maintenance').length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total', value: stats.total, color: 'blue', icon: Truck },
          { label: 'Available', value: stats.available, color: 'green', icon: CheckCircle },
          { label: 'On Trip', value: stats.onTrip, color: 'orange', icon: Navigation },
          { label: 'Maintenance', value: stats.maintenance, color: 'red', icon: AlertCircle },
        ].map(stat => (
          <div 
            key={stat.label}
            className={`bg-${stat.color}-500/10 border border-${stat.color}-500/30 rounded-xl p-3 text-center`}
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-1 text-${stat.color}-400`} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Vehicle list */}
      <div className="space-y-2">
        {vehicles.slice(0, 5).map((vehicle: any) => (
          <div
            key={vehicle.id}
            onClick={() => onVehicleClick?.(vehicle)}
            className="bg-slate-800 hover:bg-slate-750 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(vehicle.status)}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">{vehicle.vehicleNumber}</p>
                <p className="text-sm text-slate-400">
                  {vehicle.currentDriver?.name || 'No driver'} • {vehicle.type}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(vehicle.status)}`}>
              {vehicle.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET: EARNINGS SUMMARY (for Vendor/Driver)
// ═══════════════════════════════════════════════════════════════════════════

interface EarningsSummaryWidgetProps {
  thisMonth: number;
  lastMonth: number;
  trips: number;
  avgPerTrip: number;
  rating?: number;
  showTrend?: boolean;
}

export const EarningsSummaryWidget: React.FC<EarningsSummaryWidgetProps> = ({
  thisMonth,
  lastMonth,
  trips,
  avgPerTrip,
  rating,
  showTrend = true,
}) => {
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;
  const isPositive = Number(growth) >= 0;

  return (
    <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 rounded-2xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-emerald-300 mb-1">This Month's Earnings</p>
          <p className="text-3xl font-bold text-emerald-400">{formatINR(thisMonth)}</p>
        </div>
        {showTrend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
            <span className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{growth}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{trips}</p>
          <p className="text-xs text-slate-400">Trips</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{formatINR(avgPerTrip)}</p>
          <p className="text-xs text-slate-400">Avg/Trip</p>
        </div>
        {rating !== undefined && (
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              {rating.toFixed(1)}
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </p>
            <p className="text-xs text-slate-400">Rating</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export default {
  OrderListWidget,
  InvoiceListWidget,
  LiveTrackingWidget,
  RatingWidget,
  ApprovalQueueWidget,
  FleetOverviewWidget,
  EarningsSummaryWidget,
  // Utilities
  formatINR,
  getStatusColor,
  getStatusIcon,
  // Queries
  PORTAL_QUERIES,
  PORTAL_MUTATIONS,
};
