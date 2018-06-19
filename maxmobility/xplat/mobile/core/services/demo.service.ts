import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, Response, ResponseOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { Kinvey } from 'kinvey-nativescript-sdk';

import { fromObject, Observable } from 'tns-core-modules/data/observable';

import { Demo } from '@maxmobility/core';

@Injectable()
export class DemoService {
  private static cloneUpdateModel(demo: Demo): object {
    return Demo.editableProperties.reduce((a, e) => ((a[e] = demo[e]), a), {
      _id: demo.id,
      _geoloc: demo.geo,
      owner_id: Kinvey.User.getActiveUser()._id,
      usage: demo.usage.map(r => r.data())
    });
  }

  demos: Array<Demo> = [];

  private datastore = Kinvey.DataStore.collection<any>('SmartDrives');

  getDemoById(id: string): Demo {
    if (!id) {
      return;
    }

    return this.demos.filter(demo => {
      return demo.id === id;
    })[0];
  }

  getDemoByPushTrackerSerialNumber(sn: string): Demo {
    if (!sn) {
      return;
    }
    return this.demos.filter(demo => {
      return demo.pushtracker_serial_number === sn;
    })[0];
  }

  getDemoBySmartDriveSerialNumber(sn: string): Demo {
    if (!sn) {
      return;
    }
    return this.demos.filter(demo => {
      return demo.smartdrive_serial_number === sn;
    })[0];
  }

  constructor(private zone: NgZone) {}

  create(demoModel: Demo): Promise<any> {
    return this.update(demoModel).then(() => {
      return this.load();
    });
  }

  save() {
    const tasks = this.demos.map(demo => {
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
        this.demos = [];
        data.forEach((demoData: any) => {
          demoData.id = demoData._id;
          const demo = new Demo(demoData);

          this.demos.push(demo);
        });

        return this.demos;
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
