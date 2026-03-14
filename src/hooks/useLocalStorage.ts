import { useEffect, useState } from "react";
import { getJsonStorageItem, setJsonStorageItem } from "../utils/storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => getJsonStorageItem(key, initialValue));

  useEffect(() => {
    setJsonStorageItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
