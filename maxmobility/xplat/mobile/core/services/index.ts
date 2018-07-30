import { AuthGuardService } from './auth-guard.service';
import { BluetoothService } from './bluetooth.service';
import { DemoService } from './demo.service';
import { EvaluationService } from './evaluation.service';
import { FileService } from './file.service';
import { FirmwareService } from './firmware.service';
import { KeyboardService } from './keyboard.service';
import { LocationService } from './location.service';
import { LoggingService } from './logging.service';
import { NetworkService } from './network.service';
import { PairingService } from './pairing.service';
import { ProgressService } from './progress.service';
import { StorageService } from './storage.service';
import { UserService } from './user.service';

export const PROVIDERS: any[] = [
  LocationService,
  EvaluationService,
  FileService,
  DemoService,
  UserService,
  KeyboardService,
  AuthGuardService,
  StorageService,
  LoggingService,
  NetworkService,
  ProgressService,
  BluetoothService,
  FirmwareService,
  PairingService
];

export * from './auth-guard.service';
export * from './bluetooth.service';
export * from './demo.service';
export * from './evaluation.service';
export * from './file.service';
export * from './firmware.service';
export * from './keyboard.service';
export * from './location.service';
export * from './logging.service';
export * from './network.service';
export * from './pairing.service';
export * from './progress.service';
export * from './storage.service';
export * from './user.service';
