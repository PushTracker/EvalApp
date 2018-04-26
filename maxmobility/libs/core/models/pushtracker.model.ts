import { Observable, EventData } from 'tns-core-modules/data/observable';

import { Packet } from '@maxmobility/core';

/**
 * The options object passed to the PushTracker's performOTA function
 */
export interface PTOTAOptions {
  /**
   * How long do we want our timeouts (generally on reconnection) to
   * be in seconds?
   */
  timeout: number;

  /**
   * The array of bytes containing the firmware for the PT
   */
  firmware: number[];
}

export enum PTOTAState {
  not_started,
  awaiting_version,
  awaiting_ready,
  updating,
  rebooting,
  veryfing_update,
  complete,
  cancelling,
  canceled
}

export class PushTracker extends Observable {
  // Event names
  public static pushtracker_paired_event = 'pushtracker_paired_event';

  public static pushtracker_connect_event = 'pushtracker_connect_event';
  public static pushtracker_disconnect_event = 'pushtracker_disconnect_event';

  public static pushtracker_version_event = 'pushtracker_version_event';
  public static pushtracker_error_event = 'pushtracker_error_event';
  public static pushtracker_distance_event = 'pushtracker_distance_event';
  public static pushtracker_settings_event = 'pushtracker_settings_event';

  public static pushtracker_daily_info_event = 'pushtracker_daily_info_event';
  public static pushtracker_awake_event = 'pushtracker_awake_event';

  public static pushtracker_ota_timeout_event = 'pushtracker_ota_timeout_event';
  public static pushtracker_ota_progress_event = 'pushtracker_ota_progress_event';
  public static pushtracker_ota_version_event = 'pushtracker_ota_version_event';
  public static pushtracker_ota_complete_event = 'pushtracker_ota_complete_event';
  public static pushtracker_ota_failure_event = 'pushtracker_ota_failure_event';

  public events: any /*IPushTrackerEvents*/;

  // public members
  public version: number = 0xff; // firmware version number for the PT firmware
  public mcu_version: number = 0xff; // firmware version number for the SD MCU firmware
  public ble_version: number = 0xff; // firmware version number for the SD BLE firmware
  public battery: number = 0; // battery percent Stat of Charge (SoC)

  public address: string = ''; // MAC Address
  public paired: boolean = false; // Is this PushTracker paired?
  public connected: boolean = false; // Is this PushTracker connected?

  // not serialized
  public otaState: PTOTAState = PTOTAState.not_started;

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
      version: this.version,
      mcu_version: this.mcu_version,
      ble_version: this.ble_version,
      battery: this.battery,
      address: this.address,
      paired: this.paired,
      connected: this.connected
    };
  }

  public fromObject(obj: any): void {
    this.version = (obj && obj.version) || 0xff;
    this.mcu_version = (obj && obj.mcu_version) || 0xff;
    this.ble_version = (obj && obj.ble_version) || 0xff;
    this.battery = (obj && obj.battery) || 0;
    this.address = (obj && obj.address) || '';
    this.paired = (obj && obj.paired) || false;
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

  public performOTA(otaOptions: PTOTAOptions) {
    // TODO: handle all the ota process for this specific
    // smartdrive
  }

  // handlers
  public handlePaired() {
    this.paired = true;
    this.sendEvent(PushTracker.pushtracker_paired_event);
  }

  public handleConnect() {
    this.connected = true;
    this.sendEvent(PushTracker.pushtracker_connect_event);
  }

  public handleDisconnect() {
    this.connected = false;
    this.sendEvent(PushTracker.pushtracker_disconnect_event);
  }

  public handlePacket(p: Packet) {
    // if we get a pakcet we must have been paired
    this.paired = true;
    // TODO: determine type here and call the private handlers
    // (which may update state or spawn events)
    const packetType = p.Type();
    const subType = p.SubType();
    if (packetType && packetType == 'Data') {
      switch (subType) {
        case 'VersionInfo':
          this.handleVersionInfo(p);
          break;
        case 'ErrorInfo':
          this.handleErrorInfo(p);
          break;
        case 'TotalDistance':
          this.handleDistance(p);
          break;
        case 'DailyInfo':
          this.handleDailyInfo(p);
          break;
        case 'Ready':
          this.handleReady(p);
          break;
        default:
          break;
      }
    } else if (packetType && packetType == 'Command') {
      switch (subType) {
        case 'SetSettings':
          this.handleSettings(p);
          break;
        default:
          break;
      }
    }
  }

  // private functions
  private handleVersionInfo(p: Packet) {
    // This is sent by the PushTracker when it connects
    const versionInfo = p.data('versionInfo');
    /* Version Info
           struct {
           uint8_t     pushTracker;         // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
           uint8_t     smartDrive;          // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
           uint8_t     smartDriveBluetooth; // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
           }            versionInfo;
        */
    this.version = versionInfo.pushTracker;
    this.mcu_version = versionInfo.smartDrive;
    this.ble_version = versionInfo.smartDriveBluetooth;
    // TODO: send version event to subscribers so they get updated
    this.sendEvent(PushTracker.pushtracker_version_event, {
      pt: this.version,
      mcu: this.mcu_version,
      ble: this.ble_version
    });
  }

  private handleErrorInfo(p: Packet) {
    // This is sent by the PushTracker when it connects
    const errorInfo = p.data('errorInfo');
    /* Error Info
           struct {
           uint16_t            year;
           uint8_t             month;
           uint8_t             day;
           uint8_t             hour;
           uint8_t             minute;
           uint8_t             second;
           SmartDrive::Error   mostRecentError;  // Type of the most recent error, associated with the timeStamp.
           uint8_t             numBatteryVoltageErrors;
           uint8_t             numOverCurrentErrors;
           uint8_t             numMotorPhaseErrors;
           uint8_t             numGyroRangeErrors;
           uint8_t             numOverTemperatureErrors;
           uint8_t             numBLEDisconnectErrors;
           }                     errorInfo;
        */
    // TODO: send error event to subscribers so they get updated
    this.sendEvent(PushTracker.pushtracker_error_event, {
      // what should we put here?
    });
    // TODO: update error record for this pushtracker (locally and
    // on the server)
  }

  private handleDistance(p: Packet) {
    // This is sent by the PushTracker when it connects
    const distance = p.data('distanceInfo');
    /* DistanceInfo
           struct {
           uint64_t   motorDistance;  /** Cumulative Drive distance in ticks.
           uint64_t   caseDistance;   /** Cumulative Case distance in ticks. 
           }            distanceInfo;
        */
    // TODO: send distance event to subscribers so they get
    // updated
    this.sendEvent(PushTracker.pushtracker_distance_event, {
      driveDistance: distance.motorDistance, // TODO: make sure these accessors work
      coastDistance: distance.caseDistance //  - may need to use p.getMotorDistance() etc.
    });
    // TODO: update distance record for this pushtracker (locally
    // and on the server)
  }

  private handleSettings(p: Packet) {
    // This is sent by the PushTracker when it connects
    const settings = p.data('settings');
    /* Settings
           struct Settings {
           ControlMode controlMode;
           Units       units;
           uint8_t     settingsFlags1;  /** Bitmask of boolean settings.     
           uint8_t     padding;
           float       tapSensitivity;  /** Slider setting, range: [0.1, 1.0]
           float       acceleration;    /** Slider setting, range: [0.1, 1.0]
           float       maxSpeed;        /** Slider setting, range: [0.1, 1.0]
           } settings;
        */
    // TODO: send settings event to subscribers so they get updated
    this.sendEvent(PushTracker.pushtracker_settings_event, {
      // TODO: fill in this
    });
    // TODO: update our stored settings
  }

  private handleDailyInfo(p: Packet) {
    // This is sent by the PushTracker every 10 seconds while it
    // is connected (for today's daily info) - it also sends all
    // unsent daily info for previous days on connection
    const di = p.data('dailyInfo');
    /* Daily Info
           struct {
           uint16_t    year;
           uint8_t     month;
           uint8_t     day;
           uint16_t    pushesWith;      /** Raw integer number of pushes. 
           uint16_t    pushesWithout;   /** Raw integer number of pushes. 
           uint16_t    coastWith;       /** Coast Time (s) * 100.         
           uint16_t    coastWithout;    /** Coast Time Without (s) * 100. 
           uint8_t     distance;        /** Distance (mi) * 10.           
           uint8_t     speed;           /** Speed (mph) * 10.             
           uint8_t     ptBattery;       /** Percent, [0, 100].            
           uint8_t     sdBattery;       /** Percent, [0, 100].            
           }            dailyInfo;
        */
    // TODO: send daily info event to subscribers so they get
    // updated
    this.sendEvent(PushTracker.pushtracker_daily_info_event, {
      // TODO: fill this in
    });
    // TODO: upate daily info record for this pushtracker (locally
    // and on the server)
  }

  private handleReady(p: Packet) {
    // This is sent by the PushTracker after it has received a
    // Wake command
    // TODO: send awawke event to subscribers so they get updated
    this.sendEvent(PushTracker.pushtracker_awake_event);
  }
}

/**
 * All of the events for PushTracker that can be emitted and listened
 * to.
 */
export interface IPushtrackerEvents {
  pushtracker_disconnect_event: string;
  pushtracker_connect_event: string;

  pushtracker_version_event: string;
  pushtracker_error_event: string;
  pushtracker_distance_event: string;
  pushtracker_settings_event: string;

  pushtracker_daily_info_event: string;
  pushtracker_awake_event: string;

  pushtracker_ota_timeout_event: string;
  pushtracker_ota_progress_event: string;
  pushtracker_ota_version_event: string;
  pushtracker_ota_complete_event: string;
  pushtracker_ota_failure_event: string;
}
