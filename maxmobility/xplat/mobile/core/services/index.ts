import { UserService } from './user.service';
import { KeyboardService } from './keyboard.service';
import { AuthGuardService } from './auth-guard.service';
import { StorageService } from './storage.service';
import { LoggingService } from './logging.service';

export const PROVIDERS: any[] = [UserService, KeyboardService, AuthGuardService, StorageService, LoggingService];

export * from './auth-guard.service';
export * from './keyboard.service';
export * from './logging.service';
export * from './user.service';
export * from './storage.service';
