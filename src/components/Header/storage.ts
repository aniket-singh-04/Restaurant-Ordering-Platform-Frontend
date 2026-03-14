import { STORAGE_KEYS } from "../../constants/storageKeys";
import {
  getNumericStorageItem,
  getStorageItem,
  setStorageItem,
} from "../../utils/storage";

export const saveRestaurantSelection = (restaurant: string, table: number) => {
  setStorageItem(STORAGE_KEYS.selectedRestaurant, restaurant);
  setStorageItem(STORAGE_KEYS.selectedTable, String(table));
};

export const getStoredRestaurantSelection = () => ({
  restaurant: getStorageItem(STORAGE_KEYS.selectedRestaurant),
  table: getNumericStorageItem(STORAGE_KEYS.selectedTable),
});
