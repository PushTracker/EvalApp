import { TNSKinveyService } from './tns-kinvey.service';
import { AuthGuardService } from './auth-guard.service';

export const PROVIDERS: any[] = [TNSKinveyService, AuthGuardService];

export * from './tns-kinvey.service';
export * from './auth-guard.service';
