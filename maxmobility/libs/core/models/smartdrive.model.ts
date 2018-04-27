import { Observable, EventData } from 'tns-core-modules/data/observable';

import { Packet, bindingTypeToString } from '@maxmobility/core';

enum OTAState {
  not_started,
  awaiting_versions,
  awaiting_mcu_ready,
  updating_mcu,
  awaiting_ble_ready,
  updating_ble,
  rebooting_ble,
  rebooting_mcu,
  verifying_update,
  complete,
  cancelling,
  canceled
}

export class SmartDrive extends Observable {
  static readonly OTAState = OTAState;
  readonly OTAState = SmartDrive.OTAState;

  // bluetooth info
  public static ServiceUUID = '0cd51666-e7cb-469b-8e4d-2742f1ba7723';
  public static Characteristics = [
    'e7add780-b042-4876-aae1-112855353cc1',
    'e8add780-b042-4876-aae1-112855353cc1',
    'e9add780-b042-4876-aae1-112855353cc1',
    'eaadd780-b042-4876-aae1-112855353cc1',
    'ebadd780-b042-4876-aae1-112855353cc1'
  ];
  public static DataCharacteristic = SmartDrive.Characteristics[1];
  public static ControlCharacteristic = SmartDrive.Characteristics[2];
  public static BLEOTADataCharacteristic = SmartDrive.Characteristics[0];
  public static BLEOTAControlCharacteristic = SmartDrive.Characteristics[4];

  // Event names
  public static smartdrive_connect_event = 'smartdrive_connect_event';
  public static smartdrive_disconnect_event = 'smartdrive_disconnect_event';

  public static smartdrive_service_discovered_event = 'smartdrive_service_discovered_event';
  public static smartdrive_characteristic_discovered_event = 'smartdrive_characteristic_discovered_event';

  public static smartdrive_ble_version_event = 'smartdrive_ble_version_event';
  public static smartdrive_mcu_version_event = 'smartdrive_mcu_version_event';

  public static smartdrive_ota_ready_ble_event = 'smartdrive_ota_ready_ble_event';
  public static smartdrive_ota_ready_mcu_event = 'smartdrive_ota_ready_mcu_event';

  public events: any /*ISmartDriveEvents*/;

  // public members
  public mcu_version: number = 0xff; // microcontroller firmware version number
  public ble_version: number = 0xff; // bluetooth chip firmware version number
  public battery: number = 0; // battery percent Stat of Charge (SoC)
  public driveDistance: number = 0; // cumulative total distance the smartDrive has driven
  public coastDistance: number = 0; // cumulative total distance the smartDrive has gone

  public address: string = ''; // MAC Address
  public connected: boolean = false;

  // not serialized
  public otaState: OTAState = OTAState.not_started;

  // private members

  // functions
  constructor(obj?: any) {
    super();
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  public data(): any {
    return {
      mcu_version: this.mcu_version,
      ble_version: this.ble_version,
      battery: this.battery,
      driveDistance: this.driveDistance,
      coastDistance: this.coastDistance,
      address: this.address,
      connected: this.connected
    };
  }

  public fromObject(obj: any): void {
    this.mcu_version = (obj && obj.mcu_version) || 0xff;
    this.ble_version = (obj && obj.ble_version) || 0xff;
    this.battery = (obj && obj.battery) || 0;
    this.driveDistance = (obj && obj.driveDistance) || 0;
    this.coastDistance = (obj && obj.coastDistance) || 0;
    this.address = (obj && obj.address) || '';
    this.connected = (obj && obj.connected) || false;
  }

  // regular methods

  /**
   * Notify events by name and optionally pass data
   */
  public sendEvent(eventName: string, data?: any, msg?: string) {
    this.notify({
      eventName,
      object: this,
      data,
      message: msg
    });
  }

  // handlers

  public handleConnect(data?: any) {
    // TODO: update state and spawn events
    this.connected = true;
    this.sendEvent(SmartDrive.smartdrive_connect_event, data);
  }

  public handleDisconnect() {
    // TODO: update state and spawn events
    this.connected = false;
    this.sendEvent(SmartDrive.smartdrive_disconnect_event);
  }

  public handlePacket(p: Packet) {
    const packetType = p.Type();
    const subType = p.SubType();
    if (!packetType || !subType) {
      return;
    } else if (packetType == 'Data') {
      switch (subType) {
        case 'DeviceInfo':
          this.handleDeviceInfo(p);
          break;
        case 'MotorInfo':
          this.handleMotorInfo(p);
          break;
        case 'DistanceInfo':
          this.handleDistanceInfo(p);
          break;
        default:
          break;
      }
    } else if (packetType == 'Command') {
      switch (subType) {
        case 'OTAReady':
          this.handleOTAReady(p);
          break;
        default:
          break;
      }
    }
  }

  // private functions
  private handleDeviceInfo(p: Packet) {
    // This is sent by the SmartDrive Bluetooth Chip when it
    // connects
    const devInfo = p.data('deviceInfo');
    // so they get updated
    /* Device Info
           struct {
           Device     device;     // Which Device is this about?
           uint8_t    version;    // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
           }            deviceInfo;
        */
    this.ble_version = devInfo.version;
    // TODO: send version event (for BLE_VERSION) to subscribers
    this.sendEvent(SmartDrive.smartdrive_ble_version_event, {
      ble: this.ble_version
    });
  }

  private handleMotorInfo(p: Packet) {
    // This is sent by the SmartDrive microcontroller every 200ms
    // (5 hz) while connected
    const motorInfo = p.data('motorInfo');
    /* Motor Info
           struct {
           Motor::State state;
           uint8_t      batteryLevel; // [0,100] integer percent. 
           uint8_t      version;      // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
           uint8_t      padding;
           float        distance;
           float        speed;
           float        driveTime;
           }            motorInfo;
        */
    this.mcu_version = motorInfo.version;
    this.battery = motorInfo.batteryLevel;
    // TODO: send version event (for MCU_VERSION) to subscribers
    this.sendEvent(SmartDrive.smartdrive_mcu_version_event, {
      mcu: this.mcu_version
    });
    // so they get updated about this smartDrive's version
    // TODO: update state (is the motor on or off)
  }

  private handleDistanceInfo(p: Packet) {
    // This is sent by the SmartDrive microcontroller every 1000
    // ms (1 hz) while connected and the motor is off
    const distInfo = p.data('distanceInfo');
    /* Distance Info
           struct {
           uint64_t   motorDistance;  // Cumulative Drive distance in ticks.
           uint64_t   caseDistance;   // Cumulative Case distance in ticks.
           }            distanceInfo;
        */
    this.driveDistance = distInfo.motorDistance;
    this.coastDistance = distInfo.caseDistance;
  }

  private handleOTAReady(p: Packet) {
    // this is sent by both the MCU and the BLE chip in response
    // to a Command::StartOTA
    const otaDevice = bindingTypeToString('PacketOTAType', p.data('otaDevice'));
    switch (otaDevice) {
      case 'SmartDrive':
        this.sendEvent(SmartDrive.smartdrive_ota_ready_mcu_event);
        break;
      case 'SmartDriveBluetooth':
        this.sendEvent(SmartDrive.smartdrive_ota_ready_ble_event);
        break;
      default:
        break;
    }
  }
}

/**
 * All of the events for SmartDrive that can be emitted and listened to.
 */
export interface ISmartDriveEvents {
  smartdrive_disconnect_event: string;
  smartdrive_connect_event: string;

  smartdrive_ble_version_event: string;
  smartdrive_mcu_version_event: string;

  smartdrive_ota_timeout_event: string;
  smartdrive_ota_progress_event: string;
  smartdrive_ota_version_event: string;
  smartdrive_ota_complete_event: string;
  smartdrive_ota_failure_event: string;
}
