// angular
import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';

@Injectable()
export class StorageService {
  public static KEYS: IKeys = {
    current_user: 'current-user',
    token: 'auth-token'
  };

  public static setItem(key: string, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      LoggingService.logException(error);
    }
  }

  /**
   * Get an item from localStorage.
   * @param key
   */
  public static getItem(key: string): string | any {
    try {
      const result = localStorage.getItem(key);
      return result;
    } catch (error) {
      LoggingService.logException(error);
    }
  }

  /**
   * Delete an item from localStorage.
   * @param key
   */
  public static removeItem(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      LoggingService.logException(error);
    }
  }
}

interface IKeys {
  current_user: string;
  token: string;
}
