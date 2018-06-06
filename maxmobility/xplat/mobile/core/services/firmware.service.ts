const Buffer = require('buffer').Buffer;
// angular
import { Injectable } from '@angular/core';

// nativescript
const httpModule = require('http');
import { Observable, fromObject } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import * as application from 'tns-core-modules/application';
import * as fs from 'tns-core-modules/file-system';

@Injectable()
export class FirmwareService {
  // static members
  public static firmwarePathPrefix: string = '/assets/ota/';

  // public members
  public lastCheck: Date;
  public haveFirmwares = false;
  public description: ObservableArray<string> = new ObservableArray();
  public firmwares = {
    MCU: {
      filename: 'SmartDriveMCU.ota',
      id: null,
      length: 0,
      data: null,
      version: null
    },
    BLE: {
      filename: 'SmartDriveBLE.ota',
      id: null,
      length: 0,
      data: null,
      version: null
    },
    PT: {
      filename: 'PushTracker.ota',
      id: null,
      length: 0,
      data: null,
      version: null
    }
  };

  // private members

  constructor() {
    this.downloadFirmwares();
  }

  private versionStringToByte(version: string): number {
    const [major, minor] = version.split('.');
    return (parseInt(major) << 4) | parseInt(minor);
  }

  // FOR LOADING A FW FILE FROM FS
  private loadFirmwareFile(fileName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = fs.path.join(fs.knownFolders.currentApp().path, FirmwareService.firmwarePathPrefix + fileName);
      const f = fs.File.fromPath(filePath);
      resolve(f);
    });
  }
  // END FOR LOADING A FW FILE FROM FS

  // FOR LOADING A FW FILE FROM SERVER
  getData(url, filename) {
    const filePath = fs.path.join(fs.knownFolders.currentApp().path, filename);
    return httpModule.getFile(url, filePath);
  }

  onError(error: Response | any) {
    const body = error.json() || '';
    const err = body.error || JSON.stringify(body);
    console.log('onGetDataError: ' + err);
  }

  private unpackFirmwareData(fwKey, data) {
    const length = this.firmwares[fwKey].length;
    let bytes = null;
    if (isIOS) {
      const tmp = new ArrayBuffer(length);
      data.getBytes(tmp);
      bytes = new Uint8Array(tmp);
    } else {
      bytes = new Uint8Array(data);
    }

    // actually save the firmware
    this.firmwares[fwKey].data = bytes;
    // check to make sure they're valid
    const validLength = this.firmwares[fwKey].length;
    const actualLength = this.firmwares[fwKey].data.length;
    if (actualLength !== validLength) {
      const msg = `${fwKey} data length (${actualLength}) not the expected (${validLength})!`;
      return Promise.reject(msg);
    } else {
      console.log(`Downloaded ${fwKey} ota successfully!`);
      return Promise.resolve();
    }
  }

  private updateDescription(desc) {
    if (typeof desc === 'object') {
      this.description.push(desc);
    } else if (typeof desc === 'string') {
      this.description.push(JSON.parse(desc));
    }
  }

  private updateFirmware(fwKey, file) {
    this.firmwares[fwKey].version = this.versionStringToByte('' + file._version);
    this.firmwares[fwKey].id = file._id;
    this.firmwares[fwKey].length = file.size;
    this.updateDescription(file.description);
    console.log(`${fwKey}: ${file._version} : ${file.size}`);
  }

  private downloadFirmwares(): Promise<any> {
    this.haveFirmwares = false;
    this.description.splice(0, this.description.length);
    const tasks = Object.keys(this.firmwares).map(fwKey => {
      const query = new Kinvey.Query();
      query.equalTo('_filename', this.firmwares[fwKey].filename);
      return Kinvey.Files.find(query)
        .then(files => {
          if (files.length == 1) {
            const file = files[0];
            this.updateFirmware(fwKey, file);
            return this.getData(file._downloadURL, FirmwareService.firmwarePathPrefix + file._filename);
          } else if (files.length > 1) {
            throw new String(`Found more than one OTA for ${fwKey}!`);
          } else {
            throw new String(`Couldn't find OTA for ${fwKey}!`);
          }
        })
        .then(file => {
          return this.unpackFirmwareData(fwKey, file.readSync());
        });
    });
    return Promise.all(tasks)
      .then(() => {
        this.haveFirmwares = true;
        this.lastCheck = new Date();
      })
      .catch(err => {
        console.log(`Couldn't get firmware data: ${err}`);
        this.haveFirmwares = false;
        this.lastCheck = new Date();
      });
  }
  // END FOR LOADING A FW FILE FROM SERVER
}
