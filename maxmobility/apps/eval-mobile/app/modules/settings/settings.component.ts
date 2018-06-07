import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

import { BluetoothService, FirmwareService, ProgressService } from '@maxmobility/mobile';

import * as application from 'tns-core-modules/application';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import * as fs from 'tns-core-modules/file-system';
import { Kinvey } from 'kinvey-nativescript-sdk';

@Component({
  selector: 'Settings',
  moduleId: module.id,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private _progressService: ProgressService
  ) {}

  /************************************************************
   * Use the sideDrawerTransition property to change the open/close animation of the drawer.
   *************************************************************/
  ngOnInit(): void {
    this._sideDrawerTransition = new SlideAlongTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  /************************************************************
   * According to guidelines, if you have a drawer on your page, you should always
   * have a button that opens it. Use the showDrawer() function to open the app drawer section.
   *************************************************************/
  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  private getFileBytes(data) {
    let bytes = null;
    if (isIOS) {
      const arr = new ArrayBuffer(data.length);
      data.getBytes(arr);
      bytes = new Uint8Array(arr);
    } else if (isAndroid) {
      bytes = new Uint8Array(data);
    }
    return bytes;
  }

  private loadFile(fileName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = fs.path.join(fs.knownFolders.currentApp().path, fileName);
      const f = fs.File.fromPath(filePath);
      resolve(f);
    });
  }

  onReload() {
    this._firmwareService.loadFromFS();
  }

  onRedownload() {
    this._firmwareService.downloadFirmwares();
  }

  onUploadFiles(): Promise<void> {
    let ptFW = null;
    let bleFW = null;
    let mcuFW = null;
    // load firmware files here!
    return this.loadFile('/assets/ota/PushTracker.15.ota')
      .then(otaData => {
        ptFW = otaData;
        return this.loadFile('/assets/ota/SmartDriveBluetooth.15.ota');
      })
      .then(otaData => {
        bleFW = otaData;
        return this.loadFile('/assets/ota/MX2+.15.ota');
      })
      .then(otaData => {
        mcuFW = otaData;
      })
      .then(() => {
        console.log(`size: ${ptFW.readSync().length}`);
        console.log(`size: ${mcuFW.readSync().length}`);
        console.log(`size: ${bleFW.readSync().length}`);
        const ptMD = {
          filename: 'PushTracker.ota',
          size: ptFW.readSync().length,
          version: '1.5',
          public: true
        };
        const mcuMD = {
          filename: 'SmartDriveMCU.ota',
          size: mcuFW.readSync().length,
          version: '1.5',
          public: true
        };
        const bleMD = {
          filename: 'SmartDriveBLE.ota',
          size: bleFW.readSync().length,
          version: '1.5',
          public: true
        };
        const ptPromise = Kinvey.Files.upload(ptFW, ptMD);
        const mcuPromise = Kinvey.Files.upload(mcuFW, mcuMD);
        const blePromise = Kinvey.Files.upload(bleFW, bleMD);
        return Promise.all([ptPromise, mcuPromise, blePromise])
          .then(files => {
            console.log(`Uploaded to kinvey: ${files}`);
          })
          .catch(error => {
            console.log(`Couldn't upload to kinvey: ${error}`);
          });
      });
  }

  onStopBT(): void {
    this._progressService.show('Stopping Bluetooth service');
    const stopProgress = result => {
      console.log(`RESULT: ${result}`);
      setTimeout(() => {
        this._progressService.hide();
      }, 1000);
    };
    this._bluetoothService
      .stop()
      .then(stopProgress)
      .catch(err => {
        console.log(`Couldn't stop BT: ${err}`);
        stopProgress(err);
      });
  }

  onRestartBT(): void {
    this._progressService.show('Restarting Bluetooth service');
    const stopProgress = result => {
      console.log(`RESULT: ${result}`);
      setTimeout(() => {
        this._progressService.hide();
      }, 1000);
    };
    this._bluetoothService
      .advertise()
      .then(stopProgress)
      .catch(err => {
        console.log(`Couldn't restart BT: ${err}`);
        stopProgress(err);
      });
  }
}
