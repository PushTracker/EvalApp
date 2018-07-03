import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, Response, ResponseOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { Kinvey } from 'kinvey-nativescript-sdk';

import { fromObject, Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

import { Demo } from '@maxmobility/core';

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
    this.load();
  }

  create(demoModel: Demo): Promise<any> {
    const foundSD = this.getDemoBySmartDriveSerialNumber(demoModel.smartdrive_serial_number);
    const foundPT = this.getDemoByPushTrackerSerialNumber(demoModel.pushtracker_serial_number);
    if (foundSD) {
      console.log('Found SD');
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
        let demos = data.map((demoData: any) => {
          demoData.id = demoData._id;
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
