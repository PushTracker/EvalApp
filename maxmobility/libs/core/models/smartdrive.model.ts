// nativescript
import timer = require('tns-core-modules/timer');
import { Observable, EventData } from 'tns-core-modules/data/observable';
// libs
import { Packet, bindingTypeToString } from '@maxmobility/core';
import { BluetoothService } from '@maxmobility/mobile';

enum OTAState {
  not_started = 'Not Started',
  awaiting_versions = 'Awaiting Versions',
  awaiting_mcu_ready = 'Waiting on MCU',
  updating_mcu = 'Updating MCU',
  awaiting_ble_ready = 'Waiting on BLE',
  updating_ble = 'Updating BLE',
  rebooting_ble = 'Rebooting BLE',
  rebooting_mcu = 'Rebooting MCU',
  verifying_update = 'Verifying',
  complete = 'Complete',
  cancelling = 'Cancelling',
  canceled = 'Canceled',
  failed = 'Failed',
  timeout = 'Timeout'
}

export class SmartDrive extends Observable {
  // STATIC:
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
  public static BLEOTADongleCharacteristic = SmartDrive.Characteristics[3];

  // Event names
  public static smartdrive_connect_event = 'smartdrive_connect_event';
  public static smartdrive_disconnect_event = 'smartdrive_disconnect_event';

  public static smartdrive_service_discovered_event = 'smartdrive_service_discovered_event';
  public static smartdrive_characteristic_discovered_event = 'smartdrive_characteristic_discovered_event';

  public static smartdrive_ble_version_event = 'smartdrive_ble_version_event';
  public static smartdrive_mcu_version_event = 'smartdrive_mcu_version_event';

  public static smartdrive_ota_ready_event = 'smartdrive_ota_ready_event';
  public static smartdrive_ota_ready_ble_event = 'smartdrive_ota_ready_ble_event';
  public static smartdrive_ota_ready_mcu_event = 'smartdrive_ota_ready_mcu_event';

  // user interaction events
  public static smartdrive_ota_start_event = 'smartdrive_ota_start_event';
  public static smartdrive_ota_pause_event = 'smartdrive_ota_pause_event';
  public static smartdrive_ota_resume_event = 'smartdrive_ota_resume_event';
  public static smartdrive_ota_cancel_event = 'smartdrive_ota_cancel_event';
  public static smartdrive_ota_force_event = 'smartdrive_ota_force_event';
  public static smartdrive_ota_retry_event = 'smartdrive_ota_retry_event';
  public static smartdrive_ota_failed_event = 'smartdrive_ota_failed_event';
  public static smartdrive_ota_timeout_event = 'smartdrive_ota_timeout_event';

  // static methods:
  public static caseTicksToMiles(ticks: number): number {
    return ticks * (2.0 * 3.14159265358 * 3.8) / (265.714 * 63360.0);
  }

  public static motorTicksToMiles(ticks: number): number {
    return ticks * (2.0 * 3.14159265358 * 3.8) / (36.0 * 63360.0);
  }

  // NON STATIC:
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
  public bleOTAProgress: number = 0;
  public mcuOTAProgress: number = 0;
  public otaActions: string[] = [];
  public ableToSend: boolean = false;

  // private members
  private _bluetoothService: BluetoothService;

  // functions
  constructor(btService: BluetoothService, obj?: any) {
    super();
    this._bluetoothService = btService;
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

  public toString(): string {
    return `${this.data()}`;
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

  get otaProgress(): number {
    return (this.mcuOTAProgress + this.bleOTAProgress) / 2;
  }

  public otaStateToString(): string {
    return this.otaState; //SmartDrive.OTAState[this.otaState];
  }

  public onOTAActionTap(action: string) {
    console.log(`OTA Action`);
    console.log(`OTA Action: ${action}`);
    switch (action) {
      case 'Start':
        this.sendEvent(SmartDrive.smartdrive_ota_start_event);
        break;
      case 'Pause':
        this.sendEvent(SmartDrive.smartdrive_ota_pause_event);
        break;
      case 'Resume':
        this.sendEvent(SmartDrive.smartdrive_ota_resume_event);
        break;
      case 'Cancel':
        this.sendEvent(SmartDrive.smartdrive_ota_cancel_event);
        break;
      case 'Force':
        this.sendEvent(SmartDrive.smartdrive_ota_force_event);
        break;
      case 'Retry':
        this.sendEvent(SmartDrive.smartdrive_ota_retry_event);
        break;
      default:
        break;
    }
  }

  public cancelOTA() {
    this.sendEvent(SmartDrive.smartdrive_ota_cancel_event);
  }

  public performOTA(
    bleFirmware: any,
    mcuFirmware: any,
    bleFWVersion: number,
    mcuFWVersion: number,
    timeout: number
  ): Promise<any> {
    // send start ota for MCU
    //   - wait for reconnection (try to reconnect)
    //   - keep sending periodically (check connection state)
    //   - stop sending once we get ota ready from mcu
    // send firmware data for MCU
    // send start ota for BLE
    //   - keep sending periodically (check connection state)
    //   - stop sending once we get ota ready from mcu
    // send firmware data for BLE
    // send '3' to ble control characteristic
    //   - wait for reconnection (try to reconnect)
    // send stop OTA to MCU
    //   - wait for reconnection (try to reconnect)
    // wait to get ble version
    // wait to get mcu version
    // check versions
    return new Promise((resolve, reject) => {
      console.log(`Beginning OTA for SmartDrive: ${this.address}`);
      // set up variables to keep track of the ota
      let otaIntervalID = null;

      let mcuVersion = 0xff;
      let bleVersion = 0xff;
      let haveMCUVersion = false;
      let haveBLEVersion = false;

      let hasRebooted = false;
      let cancelOTA = false;
      let paused = false;

      let index = 0; // tracking the pointer into the firmware
      const payloadSize = 16; // how many firmware bytes to send each time

      // timer ids
      let connectionIntervalID = null;
      let otaTimeoutID = null;
      const otaTimeout = timeout;
      const smartDriveConnectionInterval = 2000;

      // define our functions here
      const begin = () => {
        paused = false;
        cancelOTA = false;
        hasRebooted = false;
        index = 0;
        // set the action
        this.otaActions = ['Start'];
        // now that we're starting the OTA, we are awaiting the versions
        this.otaState = SmartDrive.OTAState.not_started;

        // register for connection events
        this.on(SmartDrive.smartdrive_connect_event, connectHandler);
        this.on(SmartDrive.smartdrive_disconnect_event, disconnectHandler);
        this.on(SmartDrive.smartdrive_ble_version_event, bleVersionHandler);
        this.on(SmartDrive.smartdrive_mcu_version_event, mcuVersionHandler);
        this.on(SmartDrive.smartdrive_ota_ready_event, otaReadyHandler);
        this.on(SmartDrive.smartdrive_ota_start_event, otaStartHandler);
        this.on(SmartDrive.smartdrive_ota_pause_event, otaPauseHandler);
        this.on(SmartDrive.smartdrive_ota_resume_event, otaResumeHandler);
        this.on(SmartDrive.smartdrive_ota_force_event, otaForceHandler);
        this.on(SmartDrive.smartdrive_ota_retry_event, otaRetryHandler);
        this.on(SmartDrive.smartdrive_ota_cancel_event, otaCancelHandler);
        this.on(SmartDrive.smartdrive_ota_timeout_event, otaTimeoutHandler);
        // stop the timer
        if (otaIntervalID) {
          timer.clearInterval(otaIntervalID);
        }
        // now actually start the ota
        otaIntervalID = timer.setInterval(runOTA, 250);
      };
      const otaStartHandler = data => {
        // set the progresses
        this.bleOTAProgress = 0;
        this.mcuOTAProgress = 0;
        this.otaActions = ['Cancel'];
        // connect to the smartdrive
        this._bluetoothService.connect(
          this.address,
          data => {
            this.handleConnect(data);
          },
          data => {
            this.ableToSend = false;
            hasRebooted = true;
            this.handleDisconnect();
          }
        );
        this.otaState = SmartDrive.OTAState.awaiting_versions;
        // start the timeout timer
        if (otaTimeoutID) {
          timer.clearTimeout(otaTimeoutID);
        }
        otaTimeoutID = timer.setTimeout(() => {
          this.sendEvent(SmartDrive.smartdrive_ota_timeout_event);
        }, otaTimeout);
      };
      const otaForceHandler = data => {
        this.otaState = SmartDrive.OTAState.awaiting_mcu_ready;
        this.otaActions = ['Pause', 'Cancel'];
      };
      const otaPauseHandler = data => {
        this.otaActions = ['Resume', 'Cancel'];
        paused = true;
      };
      const otaResumeHandler = data => {
        this.otaActions = ['Pause', 'Cancel'];
        paused = false;
      };
      const otaCancelHandler = data => {
        this.otaState = SmartDrive.OTAState.cancelling;
      };
      const otaTimeoutHandler = data => {
        this.otaState = SmartDrive.OTAState.timeout;
      };
      const otaRetryHandler = data => {
        begin();
      };
      const connectHandler = data => {
        this.ableToSend = false;
        // clear out the connection interval
        timer.clearInterval(connectionIntervalID);
      };
      const disconnectHandler = () => {
        this.ableToSend = false;
        hasRebooted = true;
        if (!cancelOTA) {
          // try to connect to it again
          if (connectionIntervalID) {
            timer.clearInterval(connectionIntervalID);
          }
          connectionIntervalID = timer.setInterval(() => {
            this._bluetoothService.connect(
              this.address,
              data => {
                this.handleConnect(data);
              },
              data => {
                this.ableToSend = false;
                hasRebooted = true;
                this.handleDisconnect();
              }
            );
          }, smartDriveConnectionInterval);
        }
      };
      const bleVersionHandler = data => {
        bleVersion = data.data.ble;
        haveBLEVersion = true;
      };
      const mcuVersionHandler = data => {
        mcuVersion = data.data.mcu;
        haveMCUVersion = true;
      };
      const otaReadyHandler = data => {
        this.otaActions = ['Pause', 'Cancel'];
        console.log(`Got OTAReady from ${this.address}`);
        if (this.otaState === SmartDrive.OTAState.awaiting_mcu_ready) {
          console.log('CHANGING SD OTA STATE TO UPDATING MCU');
          this.otaState = SmartDrive.OTAState.updating_mcu;
        } else if (this.otaState === SmartDrive.OTAState.awaiting_ble_ready) {
          console.log('CHANGING SD OTA STATE TO UPDATING BLE');
          this.otaState = SmartDrive.OTAState.updating_ble;
        }
      };
      const writeFirmwareSector = (device: string, fw: any, characteristic: any, nextState: any) => {
        //console.log('writing firmware to ' + device);
        if (index < 0) index = 0;
        const fileSize = fw.length;
        if (cancelOTA) {
          return;
        } else if (paused) {
          setTimeout(() => {
            writeFirmwareSector(device, fw, characteristic, nextState);
          }, 100);
        } else if (index < fileSize) {
          //console.log(`Writing ${index} / ${fileSize} of ota to ${device}`);
          let data = null;
          if (device === 'SmartDrive') {
            const p = new Packet();
            p.makeOTAPacket(device, index, fw);
            data = p.toUint8Array();
            p.destroy();
          } else if (device === 'SmartDriveBluetooth') {
            const length = Math.min(fw.length - index, 16);
            data = fw.subarray(index, index + length);
          } else {
            throw `ERROR: ${device} should be either 'SmartDrive' or 'SmartDriveBluetooth'`;
          }
          // TODO: add write timeout here in case of disconnect or other error
          this._bluetoothService
            .write({
              peripheralUUID: this.address,
              serviceUUID: SmartDrive.ServiceUUID,
              characteristicUUID: characteristic,
              value: data
            })
            .then(() => {
              index += payloadSize;
              writeFirmwareSector(device, fw, characteristic, nextState);
            })
            .catch(err => {
              console.log(`Couldn't send fw to ${device}: ${err}`);
              console.log('Retrying');
              writeFirmwareSector(device, fw, characteristic, nextState);
            });
        } else {
          // we are done with the sending change
          // state to the next state
          this.otaState = nextState;
        }
      };
      const stopOTA = (reason: string, success: boolean = false, doRetry: boolean = false) => {
        cancelOTA = true;
        this.otaActions = [];
        // stop timers
        if (connectionIntervalID) {
          timer.clearInterval(connectionIntervalID);
        }
        if (otaIntervalID) {
          timer.clearInterval(otaIntervalID);
        }
        if (otaTimeoutID) {
          timer.clearInterval(otaTimeoutID);
        }

        // unregister for events
        this.off(SmartDrive.smartdrive_connect_event, connectHandler);
        this.off(SmartDrive.smartdrive_disconnect_event, disconnectHandler);
        this.off(SmartDrive.smartdrive_ble_version_event, bleVersionHandler);
        this.off(SmartDrive.smartdrive_mcu_version_event, mcuVersionHandler);
        this.off(SmartDrive.smartdrive_ota_ready_event, otaReadyHandler);
        this.off(SmartDrive.smartdrive_ota_start_event, otaStartHandler);
        this.off(SmartDrive.smartdrive_ota_force_event, otaForceHandler);
        this.off(SmartDrive.smartdrive_ota_pause_event, otaPauseHandler);
        this.off(SmartDrive.smartdrive_ota_resume_event, otaResumeHandler);
        this.off(SmartDrive.smartdrive_ota_retry_event, otaRetryHandler);
        this.off(SmartDrive.smartdrive_ota_cancel_event, otaCancelHandler);
        this.off(SmartDrive.smartdrive_ota_timeout_event, otaTimeoutHandler);

        // stop notifying characteristics
        const tasks = SmartDrive.Characteristics.map(characteristic => {
          console.log(`Stop Notifying ${characteristic}`);
          return this._bluetoothService.stopNotifying({
            peripheralUUID: this.address,
            serviceUUID: SmartDrive.ServiceUUID,
            characteristicUUID: characteristic
          });
        });
        Promise.all(tasks).then(() => {
          // then disconnect
          console.log(`Disconnecting from ${this.address}`);
          // TODO: Doesn't properly disconnect
          this._bluetoothService.disconnect({
            UUID: this.address
          });
          if (success) {
            resolve(reason);
          } else if (doRetry) {
            this.otaActions = ['Retry'];
          } else {
            reject(reason);
          }
        });
      };
      const runOTA = () => {
        switch (this.otaState) {
          case SmartDrive.OTAState.not_started:
            this.otaActions = ['Start'];
            break;
          case SmartDrive.OTAState.awaiting_versions:
            if (haveBLEVersion && haveMCUVersion) {
              if (bleVersion == bleFWVersion && mcuVersion == mcuFWVersion) {
                // TODO: add ability to select which FW to
                //       force (if they're not the same)
                this.otaActions = ['Force', 'Cancel'];
              } else {
                this.otaState = SmartDrive.OTAState.awaiting_mcu_ready;
              }
            }
            break;
          case SmartDrive.OTAState.awaiting_mcu_ready:
            // make sure the index is set to -1 to start next OTA
            index = -1;
            if (this.connected && this.ableToSend) {
              // send start OTA
              console.log(`Sending StartOTA::MCU to ${this.address}`);
              const p = new Packet();
              p.Type('Command');
              p.SubType('StartOTA');
              const otaDevice = Packet.makeBoundData('PacketOTAType', 'SmartDrive');
              p.data('OTADevice', otaDevice); // smartdrive is 0
              const data = p.toUint8Array();
              this._bluetoothService.write({
                peripheralUUID: this.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: SmartDrive.ControlCharacteristic,
                value: data
              });
              p.destroy();
            }
            break;
          case SmartDrive.OTAState.updating_mcu:
            // now that we've successfully gotten the
            // SD connected - don't timeout
            if (otaTimeoutID) {
              timer.clearTimeout(otaTimeoutID);
            }
            // now send data to SD MCU - probably want
            // to send all the data here and cancel
            // the interval for now? - shouldn't need
            // to
            if (index === -1) {
              writeFirmwareSector(
                'SmartDrive',
                mcuFirmware,
                SmartDrive.ControlCharacteristic,
                SmartDrive.OTAState.awaiting_ble_ready
              );
            }
            // update the progress bar
            this.mcuOTAProgress = Math.round((index + 16) * 100 / mcuFirmware.length);
            break;
          case SmartDrive.OTAState.awaiting_ble_ready:
            // make sure the index is set to -1 to start next OTA
            index = -1;
            // now send StartOTA to BLE
            if (this.connected && this.ableToSend) {
              // send start OTA
              console.log(`Sending StartOTA::BLE to ${this.address}`);
              const data = Uint8Array.from([0x06]); // this is the start command
              this._bluetoothService.write({
                peripheralUUID: this.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: SmartDrive.BLEOTAControlCharacteristic,
                value: data
              });
            }
            break;
          case SmartDrive.OTAState.updating_ble:
            // now that we've successfully gotten the
            // SD connected - don't timeout
            if (otaTimeoutID) {
              timer.clearTimeout(otaTimeoutID);
            }
            // now send data to SD BLE
            if (index === -1) {
              writeFirmwareSector(
                'SmartDriveBluetooth',
                bleFirmware,
                SmartDrive.BLEOTADataCharacteristic,
                SmartDrive.OTAState.rebooting_ble
              );
            }
            // update the progress bar
            this.bleOTAProgress = Math.round((index + 16) * 100 / bleFirmware.length);
            // make sure we clear out the version info that we get
            haveBLEVersion = false;
            haveMCUVersion = false;
            // we need to reboot after the OTA
            hasRebooted = false;
            break;
          case SmartDrive.OTAState.rebooting_ble:
            // if we have gotten the version, it has
            // rebooted so now we should reboot the
            // MCU
            if (haveBLEVersion) {
              this.otaState = SmartDrive.OTAState.rebooting_mcu;
              hasRebooted = false;
            } else if (this.connected && !hasRebooted) {
              // send BLE stop ota command
              console.log(`Sending StopOTA::BLE to ${this.address}`);
              const data = Uint8Array.from([0x03]); // this is the stop command
              this._bluetoothService.write({
                peripheralUUID: this.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: SmartDrive.BLEOTAControlCharacteristic,
                value: data
              });
            }
            break;
          case SmartDrive.OTAState.rebooting_mcu:
            // if we have gotten the version, it has
            // rebooted so now we should reboot the
            // MCU
            if (haveMCUVersion) {
              this.otaState = SmartDrive.OTAState.verifying_update;
              hasRebooted = false;
            } else if (this.connected && !hasRebooted) {
              // send MCU stop ota command
              // send stop OTA
              console.log(`Sending StopOTA::MCU to ${this.address}`);
              const p = new Packet();
              p.Type('Command');
              p.SubType('StopOTA');
              const otaDevice = Packet.makeBoundData('PacketOTAType', 'SmartDrive');
              p.data('OTADevice', otaDevice); // smartdrive is 0
              const data = p.toUint8Array();
              this._bluetoothService.write({
                peripheralUUID: this.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: SmartDrive.ControlCharacteristic,
                value: data
              });
              p.destroy();
            }
            break;
          case SmartDrive.OTAState.verifying_update:
            // check the versions here and notify the
            // user of the success / failure of each
            // of t he updates!
            // - probably add buttons so they can retry?
            let msg = '';
            if (mcuVersion == 0x15 && bleVersion == 0x15) {
              msg = `SmartDrive OTA Succeeded! ${mcuVersion.toString(16)}, ${bleVersion.toString(16)}`;
              console.log(msg);
              this.otaState = SmartDrive.OTAState.complete;
            } else {
              msg = `SmartDrive OTA FAILED! ${mcuVersion.toString(16)}, ${bleVersion.toString(16)}`;
              console.log(msg);
              this.otaState = SmartDrive.OTAState.failed;
            }
            break;
          case SmartDrive.OTAState.complete:
            stopOTA('OTA Complete', true);
            break;
          case SmartDrive.OTAState.cancelling:
            this.otaActions = [];
            this.mcuOTAProgress = 0;
            this.bleOTAProgress = 0;
            cancelOTA = true;
            if (this.connected && this.ableToSend) {
              // send stop OTA command
              console.log(`Sending StopOTA::MCU to ${this.address}`);
              const p = new Packet();
              p.Type('Command');
              p.SubType('StopOTA');
              const otaDevice = Packet.makeBoundData('PacketOTAType', 'SmartDrive');
              p.data('OTADevice', otaDevice); // smartdrive is 0
              const data = p.toUint8Array();
              p.destroy();
              this._bluetoothService
                .write({
                  peripheralUUID: this.address,
                  serviceUUID: SmartDrive.ServiceUUID,
                  characteristicUUID: SmartDrive.ControlCharacteristic,
                  value: data
                })
                .then(() => {
                  // now set state to cancelled
                  this.otaState = SmartDrive.OTAState.canceled;
                })
                .catch(err => {
                  console.log(`Couldn't cancel ota, retrying: ${err}`);
                });
            } else {
              // now set state to cancelled
              this.otaState = SmartDrive.OTAState.canceled;
            }
            break;
          case SmartDrive.OTAState.canceled:
            stopOTA('OTA Canceled', false);
            break;
          case SmartDrive.OTAState.failed:
            stopOTA('OTA Failed', false, true);
            break;
          case SmartDrive.OTAState.timeout:
            stopOTA('OTA Timeout', false, true);
            break;
          default:
            break;
        }
      };
      // now actually start
      begin();
    });
  }

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
    // now that we're connected, subscribe to the characteristics
    const services = data.services;
    if (services) {
      // TODO: if we didn't get services then we should disconnect and re-scan!
      console.log(services);
      const sdService = services.filter(s => s.UUID === SmartDrive.ServiceUUID)[0];
      console.log(sdService);
      if (sdService) {
        // TODO: if we didn't get sdService then we should disconnect and re-scan!
        const characteristics = sdService.characteristics;
        if (characteristics) {
          // TODO: if we didn't get characteristics then we
          //       should disconnect and re-scan!
          console.log(characteristics);
          let i = 0;
          // TODO: find a better solution than notification interval!
          const notificationInterval = 1000;
          characteristics.map(characteristic => {
            if (characteristic.UUID == SmartDrive.BLEOTADongleCharacteristic) {
              return; // isn't set up to be subscribed to - we also don't use it
            }
            timer.setTimeout(() => {
              console.log(`Start Notifying ${characteristic.UUID}`);
              this._bluetoothService.startNotifying({
                peripheralUUID: this.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: characteristic.UUID,
                onNotify: this.handleNotify.bind(this)
              });
            }, i * notificationInterval);
            i++;
          });
        }
      }
    }
  }

  public handleDisconnect() {
    // update state
    this.connected = false;
    this.ableToSend = false;
    // stop notifying
    const tasks = SmartDrive.Characteristics.map(characteristic => {
      console.log(`Stop Notifying ${characteristic}`);
      return this._bluetoothService.stopNotifying({
        peripheralUUID: this.address,
        serviceUUID: SmartDrive.ServiceUUID,
        characteristicUUID: characteristic
      });
    });
    Promise.all(tasks).then(() => {
      // now send the event
      this.sendEvent(SmartDrive.smartdrive_disconnect_event);
    });
  }

  public handleNotify(args: any) {
    // Notify is called when the SmartDrive sends us data, args.value is the data
    // now that we're receiving data we can definitly send data
    this.ableToSend = true;
    // handle the packet here
    const value = args.value;
    const uArray = new Uint8Array(value);
    const p = new Packet();
    p.initialize(uArray);
    console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
    this.handlePacket(p);
    p.destroy();
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
        this.sendEvent(SmartDrive.smartdrive_ota_ready_event);
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
