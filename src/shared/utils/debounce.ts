/// <reference types="node" />

interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

export function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): DebouncedFunction<T> {
  let timeout: number | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
