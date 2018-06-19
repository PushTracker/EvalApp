import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, Response, ResponseOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { Image } from 'tns-core-modules/ui/image';
import { fromObject, Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

export class Demo extends Observable {
  //  members
   _id = null;

   sd_serial_number: string = '';
   pt_serial_number: string = '';
   model: string = '';
   firmware: string = '';
   current_location: string = '';
   image: Image;
  //  locations: ObservableArray<Location> = new ObservableArray();
  //  date: Date().toLocaleDateString();

   constructor(obj?: any) {
    super();
    if (obj !== null && obj !== undefined) {
      this.fromObject(obj);
    }
  }

//    fromObject(obj: any) {
//     Object.assign(this, obj);
//   }

//    data(): any {
//     var obj = {
//       trials: []
//     };
//     Object.keys(this).map(k => {
//       if (typeof this[k] === 'number' || typeof this[k] === 'string') {
//         obj[k] = this[k];
//       }
//     });
//     this.trials.map(t => {
//       obj.trials.push(t.data());
//     });
//     console.log(obj);
//     return obj;
//   }
// }

// tslint:disable-next-line:max-classes-per-file
   @Injectable()
export class DemoService {
  demo: Demo = new Demo();

  private datastore = Kinvey.DataStore.collection<Demo>('Demos');

  constructor(private zone: NgZone) {}

  private updateDemo(_demo) {
    this.demo = new Demo({
      _id: _demo._id,
      date: new Date().toLocaleDateString(),
      sd_serial_number: _demo.sd_serial_number,
      pt_serial_number: _demo.pt_serial_number,
      model: _demo.model,
      firmware: _demo.firmware,
      current_location: _demo.location,
      image: _demo.image,
      trials: _demo.trials,
      locations: _demo.locations
    });
  }

  createDemo() {
    this.demo = new Demo();
    /*
    return this.datastore
      .save({})
      .then(data => {
        this.updateDemo(data);
        this.publishUpdates();
      })
      .catch(this.handleErrors);
        */
  }

  save() {
    return this.datastore
      .save(this.demo.data())
      .then(data => {
        this.updateDemo(data);
        this.publishUpdates();
      })
      .catch(this.handleErrors);
  }

  load() {
    const promise = Promise.resolve();
    return promise
      .then(() => {
        var stream = this.datastore.find();
        return stream.toPromise();
      })
      .then(data => {
        data.forEach(_demo => {
          this.updateDemo(_demo);
          this.publishUpdates();
        });
      })
      .catch(error => {
        this.handleErrors;
      });
  }

  private put(data: Object) {
    return this.datastore.save(data).catch(this.handleErrors);
  }

  private publishUpdates() {}

  private handleErrors(error: Response) {
    console.log(error);
  }
}
