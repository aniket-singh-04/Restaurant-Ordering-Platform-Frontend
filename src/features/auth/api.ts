import { api } from "../../utils/api";
import type { AuthUser } from "./types";

export type AuthOtpChallenge = {
  challengeId: string;
  maskedEmail: string;
  requiresOtp: boolean;
  message?: string;
};

export type AuthSessionPayload = {
  accessToken: string;
  user: AuthUser | Record<string, unknown>;
};

export const initiateLogin = async (payload: {
  email?: string;
  phone?: string;
  password: string;

}) => {
  const response = await api.post<{ data: AuthOtpChallenge }>(
    "/api/v1/auth/login",
    payload,
    { skipRefresh: true },
  );
  return response.data;
};

export const verifyLoginOtp = async (payload: {
  challengeId: string;
  otp: string;
}) => {
  const response = await api.post<{ data: AuthSessionPayload }>(
    "/api/v1/auth/login/verify-otp",
    payload,
    { skipRefresh: true },
  );
  return response.data;
};

export const initiateRegistration = async (payload: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "RESTRO_OWNER" | "CUSTOMER";

}) => {
  const response = await api.post<{ data: AuthOtpChallenge }>(
    "/api/v1/auth/register",
    payload,
    { skipRefresh: true },
  );
  return response.data;
};

export const verifyRegistrationOtp = async (payload: {
  challengeId: string;
  otp: string;
}) => {
  const response = await api.post<{ data: AuthSessionPayload }>(
    "/api/v1/auth/register/verify-otp",
    payload,
    { skipRefresh: true },
  );
  return response.data;
};

export const requestPasswordReset = async (payload: {
  email?: string;
  phone?: string;
}) => {
  return api.post<{ message?: string; maskedEmail?: string }>(
    "/api/v1/auth/forgot-password",
    payload,
    { skipRefresh: true },
  );
};

export const resetPassword = async (payload: {
  userId: string;
  token: string;
  password: string;
}) => {
  return api.post<{ message?: string }>(
    "/api/v1/auth/reset-password",
    payload,
    { skipRefresh: true },
  );
};

export const requestPasswordChangeOtp = async () => {
  return api.post<{
    challengeId: string;
    maskedEmail: string;
    message?: string;
  }>("/api/v1/auth/password-change/request-otp");
};

export const confirmPasswordChange = async (payload: {
  challengeId: string;
  otp: string;
  newPassword: string;
}) => {
  return api.post<{ message?: string }>(
    "/api/v1/auth/password-change/confirm",
    payload,
  );
};
