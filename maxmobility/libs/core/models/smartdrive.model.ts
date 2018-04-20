import { Packet } from '@maxmobility/core';

export class SmartDrive {
  // public members
  public mcu_version: number = 0xff; // microcontroller firmware version number
  public ble_version: number = 0xff; // bluetooth chip firmware version number
  public battery: number = 0; // battery percent Stat of Charge (SoC)
  public driveDistance: number = 0; // cumulative total distance the smartDrive has driven
  public coastDistance: number = 0; // cumulative total distance the smartDrive has gone

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
      mcu_version: this.mcu_version,
      ble_version: this.ble_version,
      battery: this.battery,
      address: this.address
    };
  }

  public fromObject(obj: any): void {
    this.mcu_version = (obj && obj.mcu_version) || 0xff;
    this.ble_version = (obj && obj.ble_version) || 0xff;
    this.battery = (obj && obj.battery) || 0;
    this.address = (obj && obj.address) || '';
  }

  public handlePacket(obj: Packet) {
    // TODO: determine type here and then call the private
    // handlers (which may update state or spawn events)
  }

  // private functions
  private handleDeviceInfo(obj: Packet) {
    // This is sent by the SmartDrive Bluetooth Chip when it
    // connects
    // TODO: send version event (for BLE_VERSION) to subscribers
    // so they get updated
    /* Device Info
	   struct {
	   Device     device;     // Which Device is this about?
	   uint8_t    version;    // Major.Minor version as the MAJOR and MINOR nibbles of the byte.
	   }            deviceInfo;
	*/
  }

  private handleMotorInfo(obj: Packet) {
    // This is sent by the SmartDrive microcontroller every 200ms
    // (5 hz) while connected
    // TODO: send version event (for MCU_VERSION) to subscribers
    // so they get updated about this smartDrive's version
    // TODO: update battery status for the SmartDrive
    // TODO: update state (is the motor on or off)
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
  }

  private handleDistanceInfo(obj: Packet) {
    // This is sent by the SmartDrive microcontroller every 1000
    // ms (1 hz) while connected and the motor is off
    // TODO: update coastDistance
    // TODO: update driveDistance
    /* Distance Info
	   struct {
           uint64_t   motorDistance;  // Cumulative Drive distance in ticks.
           uint64_t   caseDistance;   // Cumulative Case distance in ticks.
	   }            distanceInfo;
	*/
  }
}
