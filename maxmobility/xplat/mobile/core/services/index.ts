import { LocationService } from './location.service';
import { EvaluationService } from './evaluation.service';
import { DemoService } from './demo.service';
import { UserService } from './user.service';
import { KeyboardService } from './keyboard.service';
import { AuthGuardService } from './auth-guard.service';
import { StorageService } from './storage.service';
import { LoggingService } from './logging.service';
import { ProgressService } from './progress.service';
import { BluetoothService } from './bluetooth.service';
import { FirmwareService } from './firmware.service';
import { PairingService } from './pairing.service';

export const PROVIDERS: any[] = [
  LocationService,
  EvaluationService,
  DemoService,
  UserService,
  KeyboardService,
  AuthGuardService,
  StorageService,
  LoggingService,
  ProgressService,
  BluetoothService,
  FirmwareService,
  PairingService
];

export * from './auth-guard.service';
export * from './location.service';
export * from './evaluation.service';
export * from './demo.service';
export * from './keyboard.service';
export * from './logging.service';
export * from './user.service';
export * from './storage.service';
export * from './progress.service';
export * from './bluetooth.service';
export * from './firmware.service';
export * from './pairing.service';
