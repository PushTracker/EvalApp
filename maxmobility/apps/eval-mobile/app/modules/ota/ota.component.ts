import application = require('application');

// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import timer = require('tns-core-modules/timer');
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { Color } from 'tns-core-modules/color';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import { View } from 'tns-core-modules/ui/core/view';
import { Animation, AnimationDefinition } from 'tns-core-modules/ui/animation';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { Observable, Scheduler } from 'rxjs';

// libs;
import { knownFolders, File } from 'tns-core-modules/file-system';
import { BluetoothService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { constructDependencies } from '@angular/core/src/di/reflective_provider';
import { constants } from 'fs';

// const timeElapsed = Observable.defer(() => {
//     const start = Scheduler.animationFrame.now();
//     return Observable.interval(1)
//         .map(() => Math.floor((Date.now() - start)));
// });

// const duration = (totalMs) =>
//     timeElapsed
//         .map(elapsedMs => elapsedMs / totalMs)
//         .takeWhile(t => t <= 1);

// const amount = (d) => (t) => t * d;

// const elasticOut = (t) =>
//     Math.sin(-13.0 * (t + 1.0) *
//         Math.PI / 2) *
//     Math.pow(2.0, -10.0 * t) +
//     1.0;

const currentApp = knownFolders.currentApp();

@Component({
  selector: 'OTA',
  moduleId: module.id,
  templateUrl: './ota.component.html',
  styleUrls: ['./ota.component.css']
})
export class OTAComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  @ViewChild('scrollView') scrollView: ElementRef;
  @ViewChild('otaTitleView') otaTitleView: ElementRef;
  @ViewChild('otaProgressViewSD') otaProgressViewSD: ElementRef;
  @ViewChild('otaProgressViewPT') otaProgressViewPT: ElementRef;
  @ViewChild('otaFeaturesView') otaFeaturesView: ElementRef;

  connected = false;
  updating = false;

  // text for buttons and titles in different states
  initialTitleText = 'Press the right button on your PushTracker to connect. (use the one here to test)';
  connectedTitleText = 'Firmware Version 1.5';

  initialButtonText = 'Begin Firmware Updates';
  updatingButtonText = 'Updating SmartDrive firmware...';

  // bTSmartDriveConnectionIcon = String.fromCharCode(0xf293);
  // bTPushTrackerConnectionIcon = String.fromCharCode(0xf293);

  sdBtProgressValue = 0;
  sdMpProgressValue = 0;
  ptBtProgressValue = 0;

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private http: HttpClient,
    private routerExtensions: RouterExtensions,
    private _bluetoothService: BluetoothService
  ) {
    // TODO: cases we need to handle:
    //  * an already connected pushtracker exists - what do we
    //    want to do here? should we inform the user that a
    //    pushtracker is already connected and try to see what
    //    version it is?

    // sign up for events on PushTrackers and SmartDrives
    // handle pushtracker connection events for existing pushtrackers
    console.log('registering for connection events!');
    const self = this;
    BluetoothService.PushTrackers.map(function(pt) {
      pt.on(PushTracker.pushtracker_connect_event, function(args) {
        self.onPushTrackerConnected();
      });
    });

    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, function(args) {
      if (args.action === 'add') {
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        pt.on(PushTracker.pushtracker_connect_event, function(arg) {
          self.onPushTrackerConnected();
        });
      }
    });
  }

  ngOnInit() {
    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.opacity = 0;

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.opacity = 0;

    const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
    otaProgressViewPT.opacity = 0;

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.opacity = 0;

    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  // DEBUGGING
  onPtButtonTapped() {
    this.onPushTrackerConnected();
  }

  onSdButtonTapped() {
    this.onPushTrackerConnected();
  }
  // END DEBUGGING

  // Connectivity
  onPushTrackerConnected() {
    this.connected = true;
    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.animate({
      opacity: 1,
      duration: 500
    });
  }

  discoverSmartDrives() {
    // show list of SDs
    return this._bluetoothService.scanForSmartDrive().then(() => {
      console.log(`Found ${BluetoothService.SmartDrives.length} SmartDrives!`);
      return BluetoothService.SmartDrives;
    });
  }

  select(objects) {
    // takes a list of objects and prompts the user to select
    // which of the objects they're interested in. might be
    // more than one
    let selected = [];
    if (objects && objects.length) {
      if (objects.length > 1) {
        // TODO: add UI for selecting one or more of the objects
        selected = objects;
      } else {
        selected = objects;
      }
    }
    return selected;
  }

  selectSmartDrives(smartDrives) {
    // takes a list of smart drives and prompts the user to select
    // which of the smartdrives they're interested in. might be
    // more than one
    let selectedSmartDrives = [];
    if (smartDrives && smartDrives.length) {
      if (smartDrives.length > 1) {
        // select smart drive(s) here
        // TODO: add UI for selecting one or more of the smartdrives
        selectedSmartDrives = smartDrives;
      } else {
        selectedSmartDrives = smartDrives;
      }
    }
    return selectedSmartDrives;
  }

  performPTOTA(pt: PushTracker, firmware: any): Promise<any> {
    // TODO: make progress bars for the PT

    // TODO: we should actually take a list of pushtrackers here
    //       so that we can send the data synchronously to them -
    //       we just notify all of them at the same time

    // TODO: update so that the state objects can handle more
    //       pushtrackers and try to synchronize their states -
    //       can we send, have they rebooted, etc.
    return new Promise((resolve, reject) => {
      if (!pt) {
        console.log('PushTracker passed for OTA is invalid!');
        reject();
      } else {
        // check state here
        if (pt.otaState !== PushTracker.OTAState.not_started) {
          console.log(`PT already in inconsistent ota state: ${pt.otaState}`);
          console.log('Reboot the PT and then try again!');
          // update the state so it will work next time
          pt.otaState = PushTracker.OTAState.not_started;
          reject();
        } else {
          console.log(`Beginning OTA for PushTracker: ${pt.address}`);
          // set up variables to keep track of the ota
          let otaIntervalID = null;

          let version = 0xff;
          let haveVersion = false;
          let ableToSend = false;

          let hasRebooted = false;

          let connectionIntervalID = null;
          const ptConnectionInterval = 2000;

          let otaTimeoutID = null;
          const otaTimeout = 300000;
          let stopOTA = false;
          otaTimeoutID = timer.setTimeout(() => {
            console.log('OTA Timed out!');
            stopOTA = true;
            timer.clearInterval(otaIntervalID);
            ableToSend = false;
            console.log(`Disconnecting from ${pt.address}`);
            // TODO: How do we disconnect from the PT?
            reject();
          }, otaTimeout);
          // set the state
          if (pt.connected) {
            pt.otaState = PushTracker.OTAState.awaiting_ready;
            ableToSend = true;
            haveVersion = true;
            // TODO: Check the versions here and
            // prompt the user if they want to
            // force the OTA
            //   - add / show buttons on the
            //     progress bar for whether they
            //     want to force it or cancel it
          } else {
            pt.otaState = PushTracker.OTAState.awaiting_version;
          }
          // register for disconnection
          //   - which will happen when we finish / cancel the ota
          pt.on(PushTracker.pushtracker_disconnect_event, () => {
            ableToSend = false;
            hasRebooted = true;
          });
          // register for version events
          pt.on(PushTracker.pushtracker_version_event, data => {
            console.log('GOT PT VERSION');
            console.log(`Got PT Version ${data.data.pt}`);
            version = data.data.pt;
            haveVersion = true;
            ableToSend = true;
          });
          pt.on(PushTracker.pushtracker_ota_ready_event, data => {
            console.log('GOT PT OTA READY');
            pt.otaState = PushTracker.OTAState.updating;
          });
          // now actually perform the ota
          let index = 0;
          const payloadSize = 16;
          const btService = this._bluetoothService;
          const writeFirmwareSector = (fw: any, characteristic: any, nextState: any) => {
            console.log('writing firmware to pt');
            // TODO: right now only sending 1% for faster testing of the OTA process
            const fileSize = fw.length;
            if (index < fileSize) {
              console.log(`Writing ${index} / ${fileSize} of ota to pt`);
              const p = new Packet();
              p.makeOTAPacket('PushTracker', index, fw);
              const data = Array.create('byte', 18);
              const pdata = p.toUint8Array();
              for (let i = 0; i < 18; i++) {
                data[i] = pdata[i];
              }
              p.destroy();
              btService.sendToPushTrackers(data);
              btService.notifyPushTrackers([pt.address]);
              index += payloadSize;
              setTimeout(() => {
                writeFirmwareSector(fw, characteristic, nextState);
              }, 10);
            } else {
              // we are done with the sending change
              // state to the next state
              pt.otaState = nextState;
            }
          };

          otaIntervalID = timer.setInterval(() => {
            switch (pt.otaState) {
              case PushTracker.OTAState.awaiting_version:
                if (haveVersion) {
                  // TODO: Check the versions here and
                  // prompt the user if they want to
                  // force the OTA
                  //   - add / show buttons on the
                  //     progress bar for whether they
                  //     want to force it or cancel it
                  pt.otaState = PushTracker.OTAState.awaiting_ready;
                }
                break;
              case PushTracker.OTAState.awaiting_ready:
                // make sure the index is set to 0 for next OTA
                index = 0;
                if (pt.connected && ableToSend) {
                  // send start OTA
                  console.log(`Sending StartOTA::PT to ${pt.address}`);
                  const p = new Packet();
                  p.Type('Command');
                  p.SubType('StartOTA');
                  const otaDevice = Packet.makeBoundData('PacketOTAType', 'PushTracker');
                  p.data('OTADevice', otaDevice);
                  console.log(`${p.toString()}`);
                  const data = Array.create('byte', 3);
                  const pdata = p.toUint8Array();
                  for (let i = 0; i < 3; i++) {
                    data[i] = pdata[i];
                  }
                  p.destroy();
                  btService.sendToPushTrackers(data);
                  btService.notifyPushTrackers([pt.address]);
                }
                break;
              case PushTracker.OTAState.updating:
                // now that we've successfully gotten the
                // OTA started - don't timeout
                timer.clearTimeout(otaTimeoutID);
                if (index === 0) {
                  writeFirmwareSector(firmware, PushTracker.DataCharacteristic, PushTracker.OTAState.rebooting);
                }
                // update the progress bar
                this.ptBtProgressValue = Math.round(index * 100 / firmware.length);
                // make sure we clear out the version info that we get
                haveVersion = false;
                // we need to reboot after the OTA
                hasRebooted = false;
                break;
              case PushTracker.OTAState.rebooting:
                // if we have gotten the version, it has
                // rebooted
                if (haveVersion) {
                  pt.otaState = PushTracker.OTAState.verifying_update;
                } else if (pt.connected && !hasRebooted) {
                  // send stop ota command
                  console.log(`Sending StopOTA::PT to ${pt.address}`);
                  const p = new Packet();
                  p.Type('Command');
                  p.SubType('StopOTA');
                  const otaDevice = Packet.makeBoundData('PacketOTAType', 'PushTracker');
                  p.data('OTADevice', otaDevice);
                  const data = Array.create('byte', 3);
                  const pdata = p.toUint8Array();
                  for (let i = 0; i < 3; i++) {
                    data[i] = pdata[i];
                  }
                  p.destroy();
                  console.log(`sending ${data}`);
                  btService.sendToPushTrackers(data);
                  console.log(`notifying ${pt.address}`);
                  btService.notifyPushTrackers([pt.address]);
                }
                break;
              case PushTracker.OTAState.verifying_update:
                // check the version here and notify the
                // user of the success / failure
                // - probably add buttons so they can retry?
                let msg = '';
                if (version == 0x15) {
                  msg = `PushTracker OTA Succeeded! ${version.toString(16)}`;
                } else {
                  msg = `PushTracker OTA FAILED! ${version.toString(16)}`;
                }
                console.log(msg);
                this.snackbar.simple(msg);
                clearInterval(otaIntervalID);
                // make sure we tell ourselves not to reconnect!
                stopOTA = true;
                // TODO: disconnect from PT here!
                break;
              case PushTracker.OTAState.complete:
                clearInterval(otaIntervalID);
                resolve();
                break;
              case PushTracker.OTAState.cancelling:
                clearInterval(otaIntervalID);
                break;
              case PushTracker.OTAState.canceled:
                clearInterval(otaIntervalID);
                resolve();
                break;
              default:
                break;
            }
          }, 250);

          // send start ota to PT
          //   - periodically sends start ota
          //   - stop sending once we get ota ready from PT
          // send firmware data for PT
          // send stop ota to PT
          //   - wait for disconnect event
          // inform the user they will need to re-pair the PT to the app
          //   - wait for pairing event for PT
          // tell the user to reconnect to the app
          //   - wait for connection event
          // wait for versions and check to verify update
        }
      }
    });
  }

  performSDOTA(sd: SmartDrive, bleFirmware: any, mcuFirmware: any): Promise<any> {
    // TODO: refactor this code some to move some methods into other
    //       library code for better re-use; perhaps see about having
    //       it be part of the SmartDrive library or the
    //       Bluetooth.service

    // TODO: make progress bars for the SD

    // TODO: add buttons for user control of OTA process
    //   * button on / around progress bar to cancel the OTA
    //   * button on / around progress bar to pause the OTA
    //   * button on / around progress bar to retry the OTA

    // TODO: cancel all timeouts and intervals if the user
    //       navigates away

    // TOOD: add timeout for write function in case of disconnect
    //       during write.

    // TODO: cancel all timeouts and intervals if connection
    //       terminates or write times out

    // TODO: track and show how much time has elapsed for the OTA

    return new Promise((resolve, reject) => {
      if (!sd) {
        console.log('SmartDrive passed for OTA is invalid!');
        reject();
      } else {
        // check state here
        if (sd.otaState !== SmartDrive.OTAState.not_started) {
          console.log(`SD already in inconsistent ota state: ${sd.otaState}`);
          console.log('Reboot the SD and then try again!');
          // update the state so it will work next time
          sd.otaState = SmartDrive.OTAState.not_started;
          reject();
        } else {
          console.log(`Beginning OTA for SmartDrive: ${sd.address}`);
          // set up variables to keep track of the ota
          let otaIntervalID = null;

          let mcuVersion = 0xff;
          let bleVersion = 0xff;
          let haveMCUVersion = false;
          let haveBLEVersion = false;
          let ableToSend = false;

          let hasRebooted = false;

          let connectionIntervalID = null;
          const smartDriveConnectionInterval = 2000;

          let otaTimeoutID = null;
          const otaTimeout = 300000;
          let stopOTA = false;
          otaTimeoutID = timer.setTimeout(() => {
            console.log('OTA Timed out!');
            stopOTA = true;
            timer.clearInterval(otaIntervalID);
            ableToSend = false;
            const tasks = SmartDrive.Characteristics.map(characteristic => {
              console.log(`Stop Notifying ${characteristic}`);
              return this._bluetoothService.stopNotifying({
                peripheralUUID: sd.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: characteristic
              });
            });
            Promise.all(tasks).then(() => {
              console.log(`Disconnecting from ${sd.address}`);
              // TODO: Doesn't properly disconnect
              this._bluetoothService.disconnect({
                UUID: sd.address
              });
              reject();
            });
          }, otaTimeout);

          // now that we're starting the OTA, we are awaiting the versions
          sd.otaState = SmartDrive.OTAState.awaiting_versions;

          // register for connection events
          sd.on(SmartDrive.smartdrive_connect_event, d => {
            ableToSend = false;
            const data = d.data;

            console.log(`connected to ${data.UUID}::${data.name}`);
            // clear out the connection interval if it exists
            if (connectionIntervalID) {
              timer.clearInterval(connectionIntervalID);
            }
            // TODO: Refactor characteristic subscription
            //       out of this code (into
            //       smartdrive.model?)
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
                  const notificationInterval = 1000;
                  characteristics.map(characteristic => {
                    timer.setTimeout(() => {
                      console.log(`Start Notifying ${characteristic.UUID}`);
                      this._bluetoothService.startNotifying({
                        peripheralUUID: sd.address,
                        serviceUUID: SmartDrive.ServiceUUID,
                        characteristicUUID: characteristic.UUID,
                        onNotify: args => {
                          // now that we're receiving data we can definitly send data
                          ableToSend = true;
                          // handle the packet here
                          console.log('GOT NOTIFICATION');
                          console.log(Object.keys(args));
                          const value = args.value;
                          const uArray = new Uint8Array(value);
                          const p = new Packet();
                          p.initialize(uArray);
                          console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
                          sd.handlePacket(p);
                          p.destroy();
                        }
                      });
                    }, i * notificationInterval);
                    i++;
                  });
                }
              }
            }
          });

          sd.on(SmartDrive.smartdrive_disconnect_event, () => {
            ableToSend = false;
            hasRebooted = true;
            // TODO: refactor stop notifying code out of
            //       this code (into smartdrive.model?)
            const tasks = SmartDrive.Characteristics.map(characteristic => {
              console.log(`Stop Notifying ${characteristic}`);
              return this._bluetoothService.stopNotifying({
                peripheralUUID: sd.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: characteristic
              });
            });

            Promise.all(tasks).then(() => {
              if (!stopOTA) {
                // try to connect to it again
                connectionIntervalID = timer.setInterval(() => {
                  this._bluetoothService.connect(
                    sd.address,
                    data => {
                      sd.handleConnect(data);
                    },
                    data => {
                      ableToSend = false;
                      hasRebooted = true;
                      sd.handleDisconnect();
                    }
                  );
                }, smartDriveConnectionInterval);
              }
            });
          });

          // register for version events
          sd.on(SmartDrive.smartdrive_ble_version_event, data => {
            console.log('GOT BLE VERSION');
            console.log(`Got SD BLE Version ${data.data.ble}`);
            bleVersion = data.data.ble;
            haveBLEVersion = true;
          });

          sd.on(SmartDrive.smartdrive_mcu_version_event, data => {
            console.log('GOT MCU VERSION');
            console.log(`Got SD MCU Version ${data.data.mcu}`);
            mcuVersion = data.data.mcu;
            haveMCUVersion = true;
          });

          // register for ota events
          sd.on(SmartDrive.smartdrive_ota_ready_ble_event, data => {
            console.log(`Got BLE OTAReady from ${sd.address}`);
            sd.otaState = SmartDrive.OTAState.updating_ble;
          });

          sd.on(SmartDrive.smartdrive_ota_ready_mcu_event, data => {
            console.log(`Got MCU OTAReady from ${sd.address}`);
            sd.otaState = SmartDrive.OTAState.updating_mcu;
          });

          sd.on(SmartDrive.smartdrive_ota_ready_event, data => {
            console.log(`Got OTAReady from ${sd.address}`);
            if (sd.otaState === SmartDrive.OTAState.awaiting_mcu_ready) {
              console.log('CHANGING SD OTA STATE TO UPDATING MCU');
              sd.otaState = SmartDrive.OTAState.updating_mcu;
            } else if (sd.otaState === SmartDrive.OTAState.awaiting_ble_ready) {
              console.log('CHANGING SD OTA STATE TO UPDATING BLE');
              sd.otaState = SmartDrive.OTAState.updating_ble;
            }
          });

          // we will generate these ota events:
          //  * ota_timeout
          //  * ota_failure
          //  * ota_complete

          // connect to the smartdrive
          this._bluetoothService.connect(
            sd.address,
            data => {
              sd.handleConnect(data);
            },
            data => {
              ableToSend = false;
              hasRebooted = true;
              sd.handleDisconnect();
            }
          );

          let index = 0;
          const payloadSize = 16;
          const btService = this._bluetoothService;
          const writeFirmwareSector = (device: string, fw: any, characteristic: any, nextState: any) => {
            console.log('writing firmware to ' + device);
            // TODO: right now only sending 1% for faster testing of the OTA process
            const fileSize = fw.length;
            if (index < fileSize) {
              console.log(`Writing ${index} / ${fileSize} of ota to ${device}`);
              let data = null;
              if (device === 'SmartDrive') {
                const p = new Packet();
                p.makeOTAPacket(device, index, fw);
                data = p.toUint8Array();
                p.destroy();
              } else if (device === 'SmartDriveBluetooth') {
                const length = Math.min(fw.length - index, 16);
                //console.log(` ----------------- MAKING : ${length}`);
                data = fw.subarray(index, index + length);
                //console.log(` ----------------- SENDING : ${data.length}`);
              } else {
                throw `ERROR: ${device} should be either 'SmartDrive' or 'SmartDriveBluetooth'`;
              }
              btService
                .write({
                  peripheralUUID: sd.address,
                  serviceUUID: SmartDrive.ServiceUUID,
                  characteristicUUID: characteristic,
                  value: data
                })
                .then(() => {
                  writeFirmwareSector(device, fw, characteristic, nextState);
                });
              index += payloadSize;
            } else {
              // we are done with the sending change
              // state to the next state
              sd.otaState = nextState;
            }
          };

          otaIntervalID = timer.setInterval(() => {
            switch (sd.otaState) {
              case SmartDrive.OTAState.awaiting_versions:
                if (haveBLEVersion && haveMCUVersion) {
                  sd.otaState = SmartDrive.OTAState.awaiting_mcu_ready;
                  // TOOD: Check the versions here and
                  // prompt the user if they want to
                  // force the OTA
                  //   - add / show buttons on the
                  //     progress bar for whether they
                  //     want to force it or cancel it
                }
                break;
              case SmartDrive.OTAState.awaiting_mcu_ready:
                // make sure the index is set to 0 for next OTA
                index = 0;
                if (sd.connected && ableToSend) {
                  // send start OTA
                  console.log(`Sending StartOTA::MCU to ${sd.address}`);
                  const p = new Packet();
                  p.Type('Command');
                  p.SubType('StartOTA');
                  const otaDevice = Packet.makeBoundData('PacketOTAType', 'SmartDrive');
                  p.data('OTADevice', otaDevice); // smartdrive is 0
                  const data = p.toUint8Array();
                  this._bluetoothService.write({
                    peripheralUUID: sd.address,
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
                timer.clearTimeout(otaTimeoutID);
                // now send data to SD MCU - probably want
                // to send all the data here and cancel
                // the interval for now? - shouldn't need
                // to
                if (index === 0) {
                  writeFirmwareSector(
                    'SmartDrive',
                    mcuFirmware,
                    SmartDrive.ControlCharacteristic,
                    SmartDrive.OTAState.awaiting_ble_ready
                  );
                }
                // update the progress bar
                this.sdMpProgressValue = Math.round(index * 100 / mcuFirmware.length);
                break;
              case SmartDrive.OTAState.awaiting_ble_ready:
                // make sure the index is set to 0 for next OTA
                index = 0;
                // now send StartOTA to BLE
                if (sd.connected && ableToSend) {
                  // send start OTA
                  console.log(`Sending StartOTA::BLE to ${sd.address}`);
                  const data = Uint8Array.from([0x06]); // this is the start command
                  this._bluetoothService.write({
                    peripheralUUID: sd.address,
                    serviceUUID: SmartDrive.ServiceUUID,
                    characteristicUUID: SmartDrive.BLEOTAControlCharacteristic,
                    value: data
                  });
                }
                break;
              case SmartDrive.OTAState.updating_ble:
                // now that we've successfully gotten the
                // SD connected - don't timeout
                timer.clearTimeout(otaTimeoutID);
                // now send data to SD BLE
                if (index === 0) {
                  writeFirmwareSector(
                    'SmartDriveBluetooth',
                    bleFirmware,
                    SmartDrive.BLEOTADataCharacteristic,
                    SmartDrive.OTAState.rebooting_ble
                  );
                }
                // update the progress bar
                this.sdBtProgressValue = Math.round(index * 100 / bleFirmware.length);
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
                  sd.otaState = SmartDrive.OTAState.rebooting_mcu;
                  hasRebooted = false;
                } else if (sd.connected && !hasRebooted) {
                  // send BLE stop ota command
                  console.log(`Sending StopOTA::BLE to ${sd.address}`);
                  const data = Uint8Array.from([0x03]); // this is the stop command
                  this._bluetoothService.write({
                    peripheralUUID: sd.address,
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
                  sd.otaState = SmartDrive.OTAState.verifying_update;
                  hasRebooted = false;
                } else if (sd.connected && !hasRebooted) {
                  // send MCU stop ota command
                  // send stop OTA
                  console.log(`Sending StopOTA::MCU to ${sd.address}`);
                  const p = new Packet();
                  p.Type('Command');
                  p.SubType('StopOTA');
                  const otaDevice = Packet.makeBoundData('PacketOTAType', 'SmartDrive');
                  p.data('OTADevice', otaDevice); // smartdrive is 0
                  const data = p.toUint8Array();
                  this._bluetoothService.write({
                    peripheralUUID: sd.address,
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
                if (mcuVersion == 0x14 && bleVersion == 0x14) {
                  msg = `SmartDrive OTA Succeeded! ${mcuVersion.toString(16)}, ${bleVersion.toString(16)}`;
                } else {
                  msg = `SmartDrive OTA FAILED! ${mcuVersion.toString(16)}, ${bleVersion.toString(16)}`;
                }
                console.log(msg);
                this.snackbar.simple(msg);
                clearInterval(otaIntervalID);
                // make sure we tell ourselves not to reconnect!
                stopOTA = true;
                // now disconnect from the smartdrive
                console.log(`OTA Complete for ${sd.address}`);
                const tasks = SmartDrive.Characteristics.map(characteristic => {
                  console.log(`Stop Notifying ${characteristic}`);
                  return this._bluetoothService.stopNotifying({
                    peripheralUUID: sd.address,
                    serviceUUID: SmartDrive.ServiceUUID,
                    characteristicUUID: characteristic
                  });
                });
                Promise.all(tasks).then(() => {
                  console.log(`Disconnecting from ${sd.address}`);
                  // TODO: Doesn't properly disconnect
                  this._bluetoothService.disconnect({
                    UUID: sd.address
                  });
                });
                sd.otaState = SmartDrive.OTAState.complete;
                break;
              case SmartDrive.OTAState.complete:
                clearInterval(otaIntervalID);
                resolve();
                break;
              case SmartDrive.OTAState.cancelling:
                clearInterval(otaIntervalID);
                break;
              case SmartDrive.OTAState.canceled:
                clearInterval(otaIntervalID);
                resolve();
                break;
              default:
                break;
            }
          }, 250);

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
        }
      }
    });
  }

  onStartOtaUpdate() {
    const scrollView = this.scrollView.nativeElement as ScrollView;
    const offset = scrollView.scrollableHeight;

    scrollView.scrollToVerticalOffset(offset, true);

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.animate({
      opacity: 1,
      duration: 500
    });

    const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
    otaProgressViewPT.animate({
      opacity: 1,
      duration: 500
    });

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.animate({
      opacity: 1,
      duration: 500
    });

    if (!this.updating) {
      let smartDrives = [];
      let pushTrackers = [];
      let ptFW = null;
      let bleFW = null;
      let mcuFW = null;
      // load firmware files here!
      this.loadFile('/assets/ota/PushTracker.14.ota')
        .then(otaData => {
          ptFW = otaData;
          return this.loadFile('/assets/ota/SmartDriveBluetooth.14.ota');
        })
        .then(otaData => {
          bleFW = otaData;
          return this.loadFile('/assets/ota/MX2+.14.ota');
        })
        .then(otaData => {
          mcuFW = otaData;
          console.log(`got MX2+ OTA, version: 0x${Number(mcuFW[0]).toString(16)}`);
          return this.discoverSmartDrives();
        })
        .then(sds => {
          return this.select(sds);
        })
        .then(selectedSmartDrives => {
          smartDrives = selectedSmartDrives;
          return this.select(BluetoothService.PushTrackers); //.filter(pt => pt.connected));
        })
        .then(selectedPushTrackers => {
          pushTrackers = selectedPushTrackers;

          // OTA the selected smart drive(s)
          const smartDriveOTATasks = smartDrives.map(sd => {
            return this.performSDOTA(sd, bleFW, mcuFW);
          });

          const pushTrackerOTATasks = pushTrackers.map(pt => {
            return this.performPTOTA(pt, ptFW);
          });

          return Promise.all(smartDriveOTATasks.concat(pushTrackerOTATasks));
        })
        .then(connectionStatus => {})
        .then(versionInfo => {});
    }

    this.updating = true;
  }

  private loadFile(fileName: string): Promise<any> {
    const f = currentApp.getFile(fileName);
    return new Promise((resolve, reject) => {
      let data = null;
      const source = f.readSync(e => {
        console.log("couldn't read file:");
        console.log(e);
        reject();
      });
      if (isIOS) {
        const arr = new ArrayBuffer(source.length);
        source.getBytes(arr);
        data = new Uint8Array(arr);
      } else if (isAndroid) {
        data = new Uint8Array(source);
      }
      resolve(data);
    });
  }
}

/*
  setTimeout(() => {
  this.routerExtensions.navigate(['/pairing'], {
  clearHistory: true
  });
  }, 1500);
  }
  }
  }, 500);
*/
