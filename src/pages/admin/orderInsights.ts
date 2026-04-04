import type { OrderRecord } from "../../features/orders/api";

export type RankedOrderItem = {
  name: string;
  orders: number;
  revenueMinor: number;
};

export type RankedOrderItemsResult = {
  items: RankedOrderItem[];
  mode: "today" | "recent" | "empty";
  sourceOrderCount: number;
};

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const parseDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getOrderTimestamp = (order: OrderRecord) =>
  parseDate(order.createdAt)?.getTime() ?? 0;

export const sortOrdersByNewest = (orders: OrderRecord[]) =>
  [...orders].sort((left, right) => getOrderTimestamp(right) - getOrderTimestamp(left));

export const shortenEntityId = (
  value?: string,
  leadingCharacters = 6,
  trailingCharacters = 4,
) => {
  if (!value) {
    return "--";
  }

  if (value.length <= leadingCharacters + trailingCharacters + 1) {
    return value;
  }

  return `${value.slice(0, leadingCharacters)}...${value.slice(-trailingCharacters)}`;
};

export const formatCompactOrderStatus = (status?: string) => {
  const normalized = status?.trim().toUpperCase();

  switch (normalized) {
    case "CREATED":
      return "Created";
    case "HALF_PAID":
      return "Half Paid";
    case "PENDING_VALIDATION":
      return "Validation";
    case "AWAITING_ADVANCE_PAYMENT":
      return "Awaiting Payment";
    case "AWAITING_CASH_CONFIRMATION":
      return "Awaiting Cash";
    case "PLACED":
      return "Placed";
    case "ACCEPTANCE_EXPIRED":
      return "Expired";
    case "ACCEPTED":
      return "Accepted";
    case "PREPARING":
      return "Preparing";
    case "READY":
      return "Ready";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return normalized
        ? normalized
            .toLowerCase()
            .split("_")
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(" ")
        : "Pending";
  }
};

const resolveLineRevenueMinor = (
  item: NonNullable<OrderRecord["itemsSnapshot"]>[number],
) => {
  if (typeof item.lineTotalSnapshot === "number") {
    return item.lineTotalSnapshot;
  }

  const addonsTotal =
    item.addonsSnapshot?.reduce(
      (total, addon) => total + addon.priceDeltaSnapshot,
      0,
    ) ?? 0;

  return (item.priceSnapshot + addonsTotal) * item.quantity;
};

export const buildRankedOrderItems = (
  orders: OrderRecord[],
  {
    fallbackOrderLimit = 3,
    itemLimit = 5,
    referenceDate = new Date(),
  }: {
    fallbackOrderLimit?: number;
    itemLimit?: number;
    referenceDate?: Date;
  } = {},
): RankedOrderItemsResult => {
  const ordered = sortOrdersByNewest(orders);
  const todayStart = startOfDay(referenceDate);
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const todaysOrders = ordered.filter((order) => {
    const createdAt = parseDate(order.createdAt);
    if (!createdAt) {
      return false;
    }

    const timestamp = createdAt.getTime();
    return timestamp >= todayStart && timestamp < todayEnd;
  });

  const sourceOrders =
    todaysOrders.length > 0 ? todaysOrders : ordered.slice(0, fallbackOrderLimit);

  if (sourceOrders.length === 0) {
    return {
      items: [],
      mode: "empty",
      sourceOrderCount: 0,
    };
  }

  const rankedItems = new Map<string, RankedOrderItem>();

  for (const order of sourceOrders) {
    for (const item of order.itemsSnapshot ?? []) {
      const key = item.nameSnapshot.trim().toLowerCase();
      const previous = rankedItems.get(key);
      const revenueMinor = resolveLineRevenueMinor(item);

      if (previous) {
        previous.orders += item.quantity;
        previous.revenueMinor += revenueMinor;
        continue;
      }

      rankedItems.set(key, {
        name: item.nameSnapshot,
        orders: item.quantity,
        revenueMinor,
      });
    }
  }

  return {
    items: [...rankedItems.values()]
      .sort(
        (left, right) =>
          right.orders - left.orders || right.revenueMinor - left.revenueMinor,
      )
      .slice(0, itemLimit),
    mode: todaysOrders.length > 0 ? "today" : "recent",
    sourceOrderCount: sourceOrders.length,
  };
};
