import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) return initialValue;
    try {
      return JSON.parse(storedValue) as T;
    } catch (error) {
      console.error(`Unable to parse local storage value for "${key}".`, error);
      return initialValue;
    }
  });

  const updateValue = (nextValue: T) => {
    setValue(nextValue);
    window.localStorage.setItem(key, JSON.stringify(nextValue));
  };

  return [value, updateValue] as const;
}
