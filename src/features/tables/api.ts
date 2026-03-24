import type {
  CreateTablePayload,
  Table,
  UpdateTablePayload,
} from "../../types/table";
import { api } from "../../utils/api";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
};

export const getTablesByBranch = async (branchId: string) => {
  const response = await api.get<ApiResponse<Table[]>>(
    `/api/v1/tables/branch/${branchId}`,
  );

  return response.data;
};

export const createTable = async (
  branchId: string,
  payload: CreateTablePayload,
) => {
  const response = await api.post<ApiResponse<Table>>(
    `/api/v1/tables/branch/${branchId}`,
    payload,
  );

  return response.data;
};

export const updateTable = async (
  tableId: string,
  payload: UpdateTablePayload,
) => {
  const response = await api.put<ApiResponse<Table>>(
    `/api/v1/tables/${tableId}`,
    payload,
  );

  return response.data;
};

export const deleteTable = async (tableId: string) => {
  const response = await api.delete<ApiResponse<Table>>(`/api/v1/tables/${tableId}`);

  return response.data;
};
