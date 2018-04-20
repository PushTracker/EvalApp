import { Packet } from '@maxmobility/core';

/**
 * The options object passed to the PushTracker's performOTA function
 */
export interface OTAOptions {
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

export class PushTracker {
  // Event names
  public static disconnect_event = 'disconnect_event';
  public static connect_event = 'disconnect_event';

  public static version_event = 'version_event';
  public static error_event = 'error_event';
  public static distance_event = 'distance_event';
  public static settings_event = 'settings_event';

  public static daily_info_event = 'daily_info_event';
  public static awake_event = 'awake_event';

  public static ota_timeout_event = 'ota_timeout_event';
  public static ota_progress_event = 'ota_progress_event';
  public static ota_version_event = 'ota_version_event';
  public static ota_complete_event = 'ota_complete_event';
  public static ota_failure_event = 'ota_failure_event';

  // public members
  public version: number = 0xff; // firmware version number for the PT firmware
  public mcu_version: number = 0xff; // firmware version number for the SD MCU firmware
  public ble_version: number = 0xff; // firmware version number for the SD BLE firmware
  public battery: number = 0; // battery percent Stat of Charge (SoC)

  public address: string = ''; // MAC Address

  // private members

  // functions
  constructor(obj?: any) {
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  public data(): any {
    return {
      version: this.version,
      address: this.address,
      battery: this.battery
    };
  }

  public fromObject(obj: any): void {
    this.version = (obj && obj.version) || 0xff;
    this.battery = (obj && obj.battery) || 0;
    this.address = (obj && obj.address) || '';
  }

  // regular methods

  public performOTA(otaOptions: OTAOptions) {
    // TODO: handle all the ota process for this specific
    // smartdrive
  }

  // handlers

  public handleConnect() {
    // TODO: update state and spawn events
  }

  public handleDisconnect() {
    // TODO: update state and spawn events
  }

  public handlePacket(obj: Packet) {
    // TODO: determine type here and call the private handlers
    // (which may update state or spawn events)
  }

  // private functions
  private handleVersionInfo(obj: Packet) {
    // This is sent by the PushTracker when it connects
    // TODO: update the version, mcu_version, and ble_version states
    // TODO: send version event to subscribers so they get updated
    /* Version Info
	   struct {
	   uint8_t     pushTracker;         // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
	   uint8_t     smartDrive;          // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
	   uint8_t     smartDriveBluetooth; // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
	   }            versionInfo;
	*/
  }

  private handleErrorInfo(obj: Packet) {
    // This is sent by the PushTracker when it connects
    // TODO: send error event to subscribers so they get updated
    // TODO: update error record for this pushtracker (locally and
    // on the server)
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
  }

  private handleDistance(obj: Packet) {
    // This is sent by the PushTracker when it connects
    // TODO: send distance event to subscribers so they get
    // updated
    // TODO: update distance record for this pushtracker (locally
    // and on the server)
    /* DistanceInfo
	   struct {
           uint64_t   motorDistance;  /** Cumulative Drive distance in ticks.
           uint64_t   caseDistance;   /** Cumulative Case distance in ticks. 
	   }            distanceInfo;
	*/
  }

  private handleSettings(obj: Packet) {
    // This is sent by the PushTracker when it connects
    // TODO: send settings event to subscribers so they get updated
    // TODO: update our stored settings
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
  }

  private handleDailyInfo(obj: Packet) {
    // This is sent by the PushTracker every 10 seconds while it
    // is connected (for today's daily info) - it also sends all
    // unsent daily info for previous days on connection
    // TODO: send daily info event to subscribers so they get
    // updated
    // TODO: upate daily info record for this pushtracker (locally
    // and on the server)
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
  }

  private handleReady(obj: Packet) {
    // This is sent by the PushTracker after it has received a
    // Wake command
    // TODO: send awawke event to subscribers so they get updated
  }
}
