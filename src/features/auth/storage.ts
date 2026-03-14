import { STORAGE_KEYS } from "../../constants/storageKeys";
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "../../utils/storage";

export const getAuthToken = () => getStorageItem(STORAGE_KEYS.token);

export const setAuthToken = (token: string) =>
  setStorageItem(STORAGE_KEYS.token, token);

export const removeAuthToken = () => removeStorageItem(STORAGE_KEYS.token);
