export const TableStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  ARCHIVED: "ARCHIVED",
} as const;

export type TableStatus = typeof TableStatus[keyof typeof TableStatus];

export interface Table {
  id: string;
  restaurantId: string;
  branchId: string;
  branchName?: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  publicQrId: string;
  qrUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTablePayload {
  tableNumber: string;
  capacity?: number;
  status?: TableStatus;
}

export interface UpdateTablePayload {
  tableNumber?: string;
  capacity?: number;
  status?: TableStatus;
}

export interface QrContext {
  publicQrId: string;
  scanUrl: string;
  restaurant: {
    id: string;
    name: string;
    slug?: string;
  };
  branch: {
    id: string;
    name: string;
    status?: string;
    city?: string;
  };
  table: {
    id: string;
    tableNumber: string;
    capacity?: number;
    status?: TableStatus;
  };
  menuVersion: number;
}
