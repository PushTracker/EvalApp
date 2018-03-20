// angular
import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';

@Injectable()
export class StorageService {
  constructor(private _logService: LoggingService) {}
  static KEYS: IKeys = {
    current_user: 'current-user',
    token: 'auth-token'
  };

  setItem(key: string, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      this._logService.logException(error);
    }
  }

  /**
   * Get an item from localStorage.
   * @param key
   */
  getItem(key: string): string | any {
    try {
      const result = localStorage.getItem(key);
      return result;
    } catch (error) {
      this._logService.logException(error);
    }
  }

  /**
   * Delete an item from localStorage.
   * @param key
   */
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this._logService.logException(error);
    }
  }
}

interface IKeys {
  current_user: string;
  token: string;
}
