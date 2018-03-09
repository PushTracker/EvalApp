import { UserService } from './user.service';
import { AuthGuardService } from './auth-guard.service';

export const PROVIDERS: any[] = [UserService, AuthGuardService];

export * from './auth-guard.service';
export * from './user.service';
