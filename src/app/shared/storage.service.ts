import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  read<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem('mentorship-' + key);
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  }

  write(key: string, value: unknown): boolean {
    try {
      localStorage.setItem('mentorship-' + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

