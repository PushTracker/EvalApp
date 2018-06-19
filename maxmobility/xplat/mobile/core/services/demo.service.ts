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
  private static cloneUpdateModel(demo: Demo): object {
    return Demo.editableProperties.reduce((a, e) => ((a[e] = demo[e]), a), { _id: demo.id, _geo: demo.geo });
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

  constructor(private zone: NgZone) {}

  createDemo() {
    this.demos.push(new Demo());
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
        const sortByNameQuery = new Kinvey.Query();
        sortByNameQuery.ascending('name');
        const stream = this.datastore.find(sortByNameQuery);

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
