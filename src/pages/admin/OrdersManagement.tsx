import { useCallback, useMemo, useState, type ButtonHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Clock, Check, ChefHat, Bell, X, RefreshCw, ChevronDown } from 'lucide-react';

// --------------------
// Local Button component
// --------------------
const buttonBase = 'px-4 py-2 rounded-md font-semibold transition-colors duration-200';
const buttonVariants = {
  default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  warm: 'bg-orange-400 text-white hover:bg-orange-500',
  outline: 'bg-transparent border border-gray-400 text-gray-800 hover:bg-gray-100',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
};

function Button({
  children,
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={`${buttonBase} ${buttonVariants[variant] || ''} ${className}`} {...props}>
      {children}
    </button>
  );
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

// --------------------
// Local Badge component
// --------------------
// function Badge({ children, className = '' }: any) {
//   return (
//     <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
//       {children}
//     </span>
//   );
// }

// --------------------
// Order types
// --------------------
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export interface Order {
  id: string;
  items: {
    id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    addOns: any[];
  }[];
  total: number;
  status: OrderStatus;
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: 'upi' | 'card' | 'cash';
  paymentStatus: 'pending' | 'completed';
}

// --------------------
// Mock orders
// --------------------


// --------------------
// Status configuration
// --------------------
const statusConfig: Record<OrderStatus, { label: string; color: string; icon: LucideIcon; nextStatus?: OrderStatus }> = {
  pending: { label: 'Pending', color: 'bg-yellow-400 text-yellow-900', icon: Clock, nextStatus: 'confirmed' },
  confirmed: { label: 'Confirmed', color: 'bg-sky-400 text-sky-900', icon: Check, nextStatus: 'preparing' },
  preparing: { label: 'Preparing', color: 'bg-orange-400 text-orange-900', icon: ChefHat, nextStatus: 'ready' },
  ready: { label: 'Ready', color: 'bg-green-400 text-green-900', icon: Bell, nextStatus: 'completed' },
  completed: { label: 'Completed', color: 'bg-gray-300 text-gray-700', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-400 text-red-900', icon: X },
};

// --------------------
// OrderCard component
// --------------------
function OrderCard({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;
  const itemsId = `order-items-${order.id}`;

  const timeSince = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl text-left overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header */}
      <div className="border-b border-orange-200/50 flex justify-between items-center px-4 py-3">
        <div className="flex gap-3 items-center">
          <div className={`${config.color} w-12 h-12 rounded-full flex items-center justify-center shadow`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-serif font-semibold text-gray-800">{order.id}</p>
            <p className="text-sm text-gray-500">
              {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : 'Takeaway'} - {timeSince(order.createdAt)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Items */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between focus:outline-none hover:bg-gray-50 rounded-lg px-2 py-1 transition"
          aria-expanded={expanded}
          aria-controls={itemsId}
        >
          <div className="flex items-center gap-2">
            {order.items.slice(0, 3).map(item => (
              <img
                key={item.id}
                src={item.image}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
              />
            ))}
            <span className="text-sm text-gray-600 ml-2 font-medium">
              {order.items.length} items - {formatCurrency(order.total)}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              id={itemsId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-4 space-y-2"
            >
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="p-4 border-t border-orange-200/50 flex flex-col sm:flex-row gap-2">
          {order.status === 'pending' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 flex items-center justify-center gap-2 transition"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          )}
          {config.nextStatus && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, config.nextStatus!)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 transition"
            >
              {config.nextStatus === 'confirmed' && 'Accept'}
              {config.nextStatus === 'preparing' && 'Start Preparing'}
              {config.nextStatus === 'ready' && 'Mark Ready'}
              {config.nextStatus === 'completed' && 'Mark Served'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// --------------------
// OrdersManagement page
// --------------------
export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const handleUpdateStatus = useCallback((id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o));
  }, []);

  const filteredOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter(o => o.status === filter)),
    [orders, filter],
  );

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        if (order.status === 'pending') acc.pending += 1;
        if (order.status === 'preparing') acc.preparing += 1;
        if (order.status === 'ready') acc.ready += 1;
        return acc;
      },
      { pending: 0, preparing: 0, ready: 0 },
    );
  }, [orders]);

  return (
    <div className="text-left space-y-6 min-h-screen ">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#3b2f2f]">Orders</h1>
          <p className="text-[#6b665f] mt-1">Manage incoming and active orders</p>
        </div>
        <Button
          variant="outline"
          className="text-[#ef6820] border-[#ef6820] hover:bg-linear-to-tr hover:from-yellow-400 hover:to-orange-500 hover:text-white flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
        <Button
          variant={filter === 'all' ? 'default' : 'secondary'}
          onClick={() => setFilter('all')}
          className="font-semibold whitespace-nowrap"
        >
          All Orders
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'secondary'}
          onClick={() => setFilter('pending')}
          className="relative font-semibold whitespace-nowrap flex items-center gap-1"
        >
          <Clock className="w-4 h-4 text-yellow-600" /> Pending
          {statusCounts.pending > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold">
              {statusCounts.pending}
            </span>
          )}
        </Button>
        <Button
          variant={filter === 'preparing' ? 'default' : 'secondary'}
          onClick={() => setFilter('preparing')}
          className="font-semibold whitespace-nowrap flex items-center gap-1"
        >
          <ChefHat className="w-4 h-4 text-orange-500" /> Preparing
          {statusCounts.preparing > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-orange-400 text-orange-900 text-xs font-semibold">
              {statusCounts.preparing}
            </span>
          )}
        </Button>
        <Button
          variant={filter === 'ready' ? 'default' : 'secondary'}
          onClick={() => setFilter('ready')}
          className="font-semibold whitespace-nowrap flex items-center gap-1"
        >
          <Bell className="w-4 h-4 text-green-600" /> Ready
          {statusCounts.ready > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-green-400 text-green-900 text-xs font-semibold">
              {statusCounts.ready}
            </span>
          )}
        </Button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
          ))}
        </AnimatePresence>
      </div>

      {/* No Orders Message */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-16 text-[#6b665f] font-semibold">
          No orders found
        </div>
      )}
    </div>
  );
}
