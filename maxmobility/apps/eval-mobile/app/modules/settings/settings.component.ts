import { Component } from '@angular/core';
import {
  BluetoothService,
  FirmwareService,
  LoggingService,
  ProgressService
} from '@maxmobility/mobile';
import { Kinvey } from 'kinvey-nativescript-sdk';
import * as fs from 'tns-core-modules/file-system';
import { isAndroid, isIOS } from 'tns-core-modules/platform';

@Component({
  selector: 'Settings',
  moduleId: module.id,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  constructor(
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private _progressService: ProgressService,
    private _loggingService: LoggingService
  ) {}

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
    return this.loadFile('/assets/ota/PushTracker.16.ota')
      .then(otaData => {
        ptFW = otaData;
        return this.loadFile('/assets/ota/SmartDriveBLE.16.ota');
      })
      .then(otaData => {
        bleFW = otaData;
        return this.loadFile('/assets/ota/SmartDriveMCU.16.ota');
      })
      .then(otaData => {
        mcuFW = otaData;
      })
      .then(() => {
        console.log(`size: ${ptFW.readSync().length}`);
        console.log(`size: ${mcuFW.readSync().length}`);
        console.log(`size: ${bleFW.readSync().length}`);
        const ptMD = {
          filename: 'PushTracker.ota.beta',
          size: ptFW.readSync().length,
          version: '1.6',
          public: true
        };
        const mcuMD = {
          filename: 'SmartDriveMCU.ota.beta',
          size: mcuFW.readSync().length,
          version: '1.6',
          public: true
        };
        const bleMD = {
          filename: 'SmartDriveBLE.ota.beta',
          size: bleFW.readSync().length,
          version: '1.6',
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
            //this._loggingService.logException(error);
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
        //this._loggingService.logException(err);
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
        //this._loggingService.logException(err);
        console.log(`Couldn't restart BT: ${err}`);
        stopProgress(err);
      });
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
      try {
        const filePath = fs.path.join(
          fs.knownFolders.currentApp().path,
          fileName
        );
        const f = fs.File.fromPath(filePath);
        resolve(f);
      } catch (error) {
        //this._loggingService.logException(error);
        reject(error);
      }
    });
  }
}
