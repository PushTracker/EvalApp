// angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterExtensions } from 'nativescript-angular/router';
// nativescript
import { Progress } from 'tns-core-modules/ui/progress';
import { ScrollView, ScrollEventData } from 'ui/scroll-view';
import { Color } from 'tns-core-modules/color';
import { ObservableArray, ChangedData, ChangeType } from 'tns-core-modules/data/observable-array';
import { AnimationCurve } from 'ui/enums';
import { View } from 'ui/core/view';
import { Animation, AnimationDefinition } from 'ui/animation';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { Observable, Scheduler } from 'rxjs';

// libs
import { BluetoothService } from '@maxmobility/mobile';
import { Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';

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

  //bTSmartDriveConnectionIcon = String.fromCharCode(0xf293);
  //bTPushTrackerConnectionIcon = String.fromCharCode(0xf293);

  sdBtProgressValue = 0;
  sdMpProgressValue = 0;
  ptBtProgressValue = 0;

  snackbar = new SnackBar();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private http: HttpClient,
    private routerExtensions: RouterExtensions,
    private _bluetoothService: BluetoothService
  ) {}

  ngOnInit(): void {
    const otaTitleView = <View>this.otaTitleView.nativeElement;
    otaTitleView.opacity = 0;

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.opacity = 0;

    const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
    otaProgressViewPT.opacity = 0;

    const otaFeaturesView = <View>this.otaFeaturesView.nativeElement;
    otaFeaturesView.opacity = 0;

    this._sideDrawerTransition = new SlideInOnTopTransition();

    // TODO: cases we need to handle:
    //  * an already connected pushtracker exists - what do we
    //    want to do here? should we inform the user that a
    //    pushtracker is already connected and try to see what
    //    version it is?

    // sign up for events on PushTrackers and SmartDrives
    // handle pushtracker connection events for existing pushtrackers
    console.log('registering for connection events!');
    BluetoothService.PushTrackers.map(pt => {
      //console.log(pt);
      pt.on(PushTracker.pushtracker_connect_event, args => {
        console.log(`PT CONNECTED EVENT!`);
        if (pt.paired === true) {
          this.onPushTrackerConnected();
        }
      });
    });
    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        //console.log(`PT ADDED EVENT!`);
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        pt.on(PushTracker.pushtracker_connect_event, args => {
          //console.log(`PT CONNECTED EVENT!`);
          if (/*pt.paired === true*/ true) {
            this.onPushTrackerConnected();
          }
        });
      }
    });

    // start discovering smartDrives here; given a list of
    // available smartDrives - ask the user which one they want to
    // update

    // smartdrives
    BluetoothService.SmartDrives.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        //console.log(`SD ADDED EVENT`);
      }
    });
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
    var selected = [];
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
    var selectedSmartDrives = [];
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

  performPTOTA(pt: PushTracker): Promise<any> {
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
          // register for disconnection
          //   - which will happen when we finish / cancel the ota
          pt.on(PushTracker.pushtracker_disconnect_event, () => {});
          // register for version events
          pt.on(PushTracker.pushtracker_version_event, data => {});
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
          resolve();
        }
      }
    });
  }

  performSDOTA(sd: SmartDrive): Promise<any> {
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
          let haveMCUVersion = false;
          let haveBLEVersion = false;
          let connectionIntervalID = null;
          const smartDriveConnectionInterval = 2000;
          const otaTimeout = 60000;
          let cancelOTA = false;
          // TODO: add timeout for connection to let the
          // user know we tried and failed
          setTimeout(() => {
            console.log('OTA Timed out!');
            cancelOTA = true;
            clearInterval(otaIntervalID);
            SmartDrive.Characteristics.map(characteristic => {
              console.log(`Stop Notifying ${characteristic}`);
              this._bluetoothService.stopNotifying({
                peripheralUUID: sd.address,
                serviceUUID: SmartDrive.ServiceUUID,
                characteristicUUID: characteristic
              });
            });
            console.log(`Disconnecting from ${sd.address}`);
            this._bluetoothService.disconnect({
              UUID: sd.address
            });
            reject();
          }, otaTimeout);

          // now that we're starting the OTA, we are awaiting the versions
          sd.otaState = SmartDrive.OTAState.awaiting_versions;
          // register for connection events
          sd.on(SmartDrive.smartdrive_connect_event, d => {
            let data = d.data;
            console.log(`connected to ${data.UUID}::${data.name}`);
            // clear out the connection interval if it exists
            if (connectionIntervalID) {
              clearInterval(connectionIntervalID);
            }
            // TODO: Subscribe to all the characteristics
            // so the SD will send us data!
            var services = data.services;
            if (services) {
              // TODO: if we didn't get services then we should disconnect and re-scan!
              console.log(services);
              var sdService = services.filter(s => s.UUID == SmartDrive.ServiceUUID)[0];
              console.log(sdService);
              if (sdService) {
                // TODO: if we didn't get sdService then we should disconnect and re-scan!
                var characteristics = sdService.characteristics;
                if (characteristics) {
                  // TODO: if we didn't get characteristics then we
                  //       should disconnect and re-scan!
                  console.log(characteristics);
                  let i = 0;
                  const notificationInterval = 1000;
                  characteristics.map(characteristic => {
                    setTimeout(() => {
                      console.log(`Start Notifying ${characteristic.UUID}`);
                      this._bluetoothService.startNotifying({
                        peripheralUUID: sd.address,
                        serviceUUID: SmartDrive.ServiceUUID,
                        characteristicUUID: characteristic.UUID,
                        onNotify: args => {
                          console.log('GOT NOTIFICATION');
                          console.log(Object.keys(args));
                          const value = args.value;
                          const data = new Uint8Array(value);
                          const p = new Packet();
                          p.initialize(data);
                          sd.handlePacket(p);
                          console.log(`${p.Type()}::${p.SubType()} ${p.toString()}`);
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
            if (!cancelOTA) {
              // try to connect to it again
              connectionIntervalID = setInterval(() => {
                this._bluetoothService.connect(
                  sd.address,
                  function(data) {
                    sd.handleConnect(data);
                  },
                  function(data) {
                    sd.handleDisconnect();
                  }
                );
              }, smartDriveConnectionInterval);
            }
          });
          // register for version events
          sd.on(SmartDrive.smartdrive_ble_version_event, data => {
            console.log('GOT BLE VERSION');
            console.log(`Got SD BLE Version ${data.data.ble}`);
            haveBLEVersion = true;
          });
          sd.on(SmartDrive.smartdrive_mcu_version_event, data => {
            console.log('GOT MCU VERSION');
            console.log(`Got SD MCU Version ${data.data.mcu}`);
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

          // we will generate these ota events:
          //  * ota_timeout
          //  * ota_failure
          //  * ota_complete

          // connect to the smartdrive
          this._bluetoothService.connect(
            sd.address,
            function(data) {
              sd.handleConnect(data);
            },
            function(data) {
              sd.handleDisconnect();
            }
          );

          otaIntervalID = setInterval(() => {
            // wait to get the ble version
            // wait to get the mcu version
            if (haveBLEVersion && haveMCUVersion) {
              sd.otaState = SmartDrive.OTAState.awaiting_mcu_ready;
            }

            switch (sd.otaState) {
              case SmartDrive.OTAState.awaiting_mcu_ready:
                if (sd.connected) {
                  // send start OTA
                  console.log(`Sending StartOTA to ${sd.address}`);
                  const p = new Packet();
                  p.Type('Command');
                  p.SubType('StartOTA');
                  const otaDevice = Packet.makeBoundData('PacketOTAType', 'SmartDrive');
                  p.data('otaDevice', otaDevice); // smartdrive is 0
                  const data = p.toUint8Array();
                  console.log(`${data}`);
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
                clearInterval(otaIntervalID);
                break;
              case SmartDrive.OTAState.awaiting_ble_ready:
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

    // const scrollView = new ScrollView();

    const offset = scrollView.scrollableHeight;
    console.log(offset);

    scrollView.scrollToVerticalOffset(offset, true);

    const otaProgressViewSD = <View>this.otaProgressViewSD.nativeElement;
    otaProgressViewSD.animate({
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
      this.discoverSmartDrives()
        .then(smartDrives => {
          return this.select(smartDrives);
        })
        .then(selectedSmartDrives => {
          smartDrives = selectedSmartDrives;
          return this.select(BluetoothService.PushTrackers.filter(pt => pt.connected));
        })
        .then(selectedPushTrackers => {
          pushTrackers = selectedPushTrackers;

          // OTA the selected smart drive(s)
          var smartDriveOTATasks = smartDrives.map(sd => {
            return this.performSDOTA(sd);
          });
          var pushTrackerOTATasks = pushTrackers.map(pt => {
            return this.performPTOTA(pt);
          });
          return Promise.all(smartDriveOTATasks.concat(pushTrackerOTATasks));
        })
        .then(connectionStatus => {})
        .then(versionInfo => {});
    }

    this.updating = true;
    /*
	  let intervalID = null;
	  let updatingPT = false;
	  intervalID = setInterval(() => {
	  this.sdBtProgressValue += 15;
	  if (this.sdBtProgressValue > 100) {
	  this.sdBtProgressValue = 100;
	  }
	  this.sdMpProgressValue += 25;
	  if (this.sdMpProgressValue > 100) {
	  this.sdMpProgressValue = 100;
	  }

	  if (this.sdMpProgressValue >= 100 && this.sdBtProgressValue >= 100) {
	  this.ptBtProgressValue += 25;
	  if (this.ptBtProgressValue > 100) {
	  this.ptBtProgressValue = 100;
	  }

	  if (!updatingPT) {
	  const otaProgressViewPT = <View>this.otaProgressViewPT.nativeElement;
	  otaProgressViewPT.animate({
	  opacity: 1,
	  duration: 500
	  });
	  this.otaButtonText = 'updating PushTracker';
	  updatingPT = true;
	  }

	  if (this.ptBtProgressValue >= 100) {
	  this.otaButtonText = 'Update Complete';
	  // cancel the interval we have set
	  clearInterval(intervalID);

	  setTimeout(() => {
	  this.routerExtensions.navigate(['/pairing'], {
	  clearHistory: true
	  });
	  }, 1500);
	  }
	  }
	  }, 500);
	*/
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }
  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
