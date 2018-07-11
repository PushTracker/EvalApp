import * as httpModule from 'tns-core-modules/http';
import * as LS from 'nativescript-localstorage';
import { Injectable } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { isIOS } from 'tns-core-modules/platform';
import { path, knownFolders, File } from 'tns-core-modules/file-system';

@Injectable()
export class FirmwareService {
  // static members
  public static firmwarePathPrefix = '/assets/ota/';

  private static fsKeyPrefix = 'FirmwareService.';
  private static fsKeyMetadata = 'Metadata';

  // public members
  public haveFirmwares = false;
  public last_check: Date;
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
    this.loadFromFS().then(() => {
      return this.downloadFirmwares();
    });
  }

  public static versionByteToString(version: number): string {
    if (version === 0xff || version === 0x00) {
      return 'unknown';
    } else {
      return `${(version & 0xf0) >> 4}.${version & 0x0f}`;
    }
  }

  public loadFromFS() {
    return this.loadMetadata().then(() => {
      const tasks = Object.keys(this.firmwares).map(k => {
        return this.loadFirmwareFile(this.firmwares[k].filename).catch(err => {
          console.log(`Couldn't find firmware: ${err}`);
        });
      });
      return Promise.all(tasks);
    });
  }

  private versionStringToByte(version: string): number {
    const [major, minor] = version.split('.');
    return (parseInt(major) << 4) | parseInt(minor);
  }

  // FOR STORING METADATA TO FILE SYSTEM
  private saveMetadata() {
    const md = {
      description: this.description.slice(),
      last_check: this.last_check
    };
    Object.keys(this.firmwares).map(k => {
      md[k] = {
        id: this.firmwares[k].id,
        length: this.firmwares[k].length,
        version: this.firmwares[k].version
      };
    });
    try {
      LS.setItem(FirmwareService.fsKeyPrefix + FirmwareService.fsKeyMetadata, md);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private loadMetadata() {
    try {
      const md = LS.getItem(FirmwareService.fsKeyPrefix + FirmwareService.fsKeyMetadata);
      if (md) {
        // now update our firmwares data
        this.description.splice(0, this.description.length, md.description || []);
        this.last_check = md.last_check ? new Date(md.last_check) : null;
        Object.keys(this.firmwares).map(k => {
          this.firmwares[k].id = (md[k] && md[k].id) || null;
          this.firmwares[k].length = (md[k] && md[k].length) || 0;
          this.firmwares[k].version = (md[k] && md[k].version) || null;
        });
        return Promise.resolve();
      } else {
        console.log('No metadata file found!');
        return Promise.resolve();
      }
    } catch (err) {
      return Promise.reject(`Couldn't load metadata file: ${err}`);
    }
  }

  private deleteMetadata() {
    try {
      LS.removeItem(FirmwareService.fsKeyPrefix + FirmwareService.fsKeyMetadata);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  // END FOR STORING METADATA TO FILE SYSTEM

  // FOR LOADING A FW FILE FROM FS
  private loadFirmwareFile(fileName: string): Promise<any> {
    try {
      const fwData = LS.getItem(fileName);
      if (fwData) {
        return Promise.resolve(fwData);
      } else {
        return Promise.reject(`Couldn't find fw data for ${fileName}`);
      }
    } catch (err) {
      return Promise.reject(`Couldn't load firmware file ${fileName}: ${err}`);
    }
  }
  // END FOR LOADING A FW FILE FROM FS

  // FOR LOADING A FW FILE FROM SERVER
  getData(url, filename): Promise<File> {
    const filePath = path.join(knownFolders.currentApp().path, FirmwareService.firmwarePathPrefix + filename);
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

  private clearDescription() {
    this.description.splice(0, this.description.length);
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

  public downloadFirmwares(): Promise<any> {
    this.haveFirmwares = false;
    this.clearDescription();
    const tasks = Object.keys(this.firmwares).map(fwKey => {
      const query = new Kinvey.Query();
      query.equalTo('_filename', this.firmwares[fwKey].filename);
      return Kinvey.Files.find(query)
        .then(files => {
          if (files.length === 1) {
            const file = files[0];
            this.updateFirmware(fwKey, file);
            // download the firmware data and save it to temporary storage
            return this.getData(file._downloadURL, file._filename);
          } else if (files.length > 1) {
            console.log(JSON.stringify(files, null, 2));
            throw new Error(`Found more than one OTA for ${fwKey}!`);
          } else {
            throw new Error(`Couldn't find OTA for ${fwKey}!`);
          }
        })
        .then(file => {
          // marshal the firmware data
          return this.unpackFirmwareData(fwKey, file.readSync());
        })
        .then(() => {
          // save the firmware data to persistent storage
          try {
            LS.setItem(this.firmwares[fwKey].filename, this.firmwares[fwKey].data);
          } catch (err) {
            console.log(`Couldn't save firmware data: ${err}`);
          }
        });
    });
    return Promise.all(tasks)
      .then(() => {
        this.haveFirmwares = true;
        this.last_check = new Date();
        this.saveMetadata();
      })
      .catch(err => {
        console.log(`Couldn't get firmware data: ${err}`);
        this.haveFirmwares = false;
      });
  }
  // END FOR LOADING A FW FILE FROM SERVER
}
