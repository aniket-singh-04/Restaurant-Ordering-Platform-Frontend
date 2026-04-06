import { api } from "../../utils/api";

export type PlatformContactPayload = {
  email: string;
  phone: string;
  message: string;
};

type PlatformContactResponse = {
  success: boolean;
  message: string;
};

export const submitPlatformContact = async (payload: PlatformContactPayload) => {
  const response = await api.post<PlatformContactResponse>(
    "/api/v1/contact/platform-owner",
    payload,
  );

  return response;
};
