// angular
import { Injectable } from '@angular/core';

// nativescript
import { Observable, fromObject } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { isIOS, isAndroid } from 'tns-core-modules/platform';

@Injectable()
export class FirmwareService {
  // static members

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

  private unpackFirmwareData(data, length) {
    var arr = new Uint8Array(length);
    var index = 0;
    for (var i = 0; i < data.length; i++) {
      var code = data.codePointAt(i);
      //arr[index] = code & 0xFF;
      //index++;
      do {
        arr[index] = code & 0xff;
        index++;
        code = code >> 8;
      } while (code > 0);
    }
    /*
          if (isIOS) {
          const arr = new ArrayBuffer(this.firmwares[fwKey].length);
          fileData.getBytes(arr);
          this.firmwares[fwKey].data = new Uint8Array(arr);
          } else {
          this.firmwares[fwKey].data = new Uint8Array(fileData);
          }
        */
    console.log('Array ', index);
    return arr;
  }

  private downloadFirmwares(): Promise<any> {
    this.haveFirmwares = false;
    const tasks = Object.keys(this.firmwares).map(fwKey => {
      const query = new Kinvey.Query();
      query.equalTo('_filename', this.firmwares[fwKey].filename);
      this.description.splice(0, this.description.length);
      return Kinvey.Files.find(query)
        .then(files => {
          if (files.length == 1) {
            const file = files[0];
            this.firmwares[fwKey].version = this.versionStringToByte('' + file._version);
            this.firmwares[fwKey].id = file._id;
            this.firmwares[fwKey].length = file.size;
            let desc = file.description;
            if (typeof desc === 'object') {
              this.description.push(desc);
            } else if (typeof desc === 'string') {
              this.description.push(JSON.parse(desc));
            }
            console.log(`${fwKey}: ${file._version} : ${file.size}`);
            console.log(`${this.firmwares[fwKey].version}`);
            return Kinvey.Files.download(file._id);
          } else if (files.length > 1) {
            throw new String(`Found more than one OTA for ${fwKey}!`);
          } else {
            throw new String(`Couldn't find OTA for ${fwKey}!`);
          }
        })
        .then(fileData => {
          this.firmwares[fwKey].data = this.unpackFirmwareData(fileData, this.firmwares[fwKey].length);
          console.log(`FileData: ${typeof fileData} : ${fileData.length}`);
          console.log(`${fwKey}: ${this.firmwares[fwKey].length}`);
          console.log(`${fwKey}: ${this.firmwares[fwKey].data.length}`);
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
}
