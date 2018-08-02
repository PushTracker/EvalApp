import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Demo } from '@maxmobility/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { fromBase64 } from 'tns-core-modules/image-source/image-source';

@Injectable()
export class DemoService {
  public static Demos: ObservableArray<Demo> = new ObservableArray<Demo>([]);

  private static cloneUpdateModel(demo: Demo): object {
    return Demo.editableProperties.reduce((a, e) => ((a[e] = demo[e]), a), {
      _id: demo.id,
      _geoloc: demo.geo,
      owner_id: Kinvey.User.getActiveUser()._id,
      usage: demo.usage.map(r => r.data())
    });
  }

  private datastore = Kinvey.DataStore.collection<any>('SmartDrives');

  getDemoById(id: string): Demo {
    if (!id) {
      return;
    }
    let o = DemoService.Demos.filter(demo => {
      return demo.id === id;
    });
    let obj = o && o.length ? o[0] : null;
    return obj;
  }

  getDemoByPushTrackerSerialNumber(sn: string): Demo {
    if (!sn || !sn.length || !sn.trim().length) {
      return;
    }
    let o = DemoService.Demos.filter(demo => {
      return demo.pushtracker_serial_number === sn;
    });
    let obj = o && o.length ? o[0] : null;
    return obj;
  }

  getDemoBySmartDriveSerialNumber(sn: string): Demo {
    if (!sn || !sn.length || !sn.trim().length) {
      return;
    }
    let o = DemoService.Demos.filter(demo => {
      return demo.smartdrive_serial_number === sn;
    });
    let obj = o && o.length ? o[0] : null;
    return obj;
  }

  constructor() {
    //this.load();
  }

  create(demoModel: Demo): Promise<any> {
    console.log('**** DEMO MODEL ****', demoModel);

    const foundSD = this.getDemoBySmartDriveSerialNumber(demoModel.smartdrive_serial_number);
    const foundPT = this.getDemoByPushTrackerSerialNumber(demoModel.pushtracker_serial_number);
    if (foundSD) {
      console.log('Found SD', foundSD);
      foundSD.update(demoModel);
      demoModel = foundSD;
    } else if (foundPT) {
      console.log('Found PT');
      foundPT.update(demoModel);
      demoModel = foundPT;
    } else {
      console.log('New PT and SD S/N');
    }
    return this.update(demoModel).then(() => {
      return this.load();
    });
  }

  save() {
    const tasks = DemoService.Demos.map(demo => {
      return this.datastore
        .save(demo.data())
        .then(data => {
          this.update(data);
          this.publishUpdates();
        })
        .catch(this.handleErrors);
    });
    return Promise.all(tasks);
  }

  load(): Promise<any> {
    DemoService.Demos.splice(0, DemoService.Demos.length);
    return this.login()
      .then(() => {
        return this.datastore.sync();
      })
      .then(() => {
        const query = new Kinvey.Query();
        query.equalTo('owner_id', Kinvey.User.getActiveUser()._id);
        query.ascending('smartdrive_serial_number');
        const stream = this.datastore.find(query);

        return stream.toPromise();
      })
      .then(data => {
        let demos = data.map((demoData: Demo) => {
          demoData.id = demoData._id;

          // BRAD = trying to fix issue-144 loading images for demos
          if (demoData.sd_image && demoData.sd_image_base64) {
            const source = fromBase64(demoData.sd_image_base64);
            demoData.sd_image = source;
          }

          return new Demo(demoData);
        });
        DemoService.Demos.splice(0, DemoService.Demos.length, ...demos);
      });
  }

  private update(demoModel: Demo): Promise<any> {
    const updateModel = DemoService.cloneUpdateModel(demoModel);

    return this.datastore.save(updateModel);
  }

  private put(data: Object) {
    return this.datastore.save(data).catch(this.handleErrors);
  }

  private login(): Promise<any> {
    if (!!Kinvey.User.getActiveUser()) {
      return Promise.resolve();
    } else {
      return Promise.reject('No active user!');
    }
  }

  private publishUpdates() {}

  private handleErrors(error: Response) {
    console.log(error);
  }
}
