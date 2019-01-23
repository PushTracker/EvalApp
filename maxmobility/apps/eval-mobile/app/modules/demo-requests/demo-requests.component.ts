import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild
} from '@angular/core';
import { User } from '@maxmobility/core';
import {
  BluetoothService,
  DemoService,
  FirmwareService,
  LoggingService,
  ProgressService
} from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { PageRoute, RouterExtensions } from 'nativescript-angular/router';
import { SmartEvalKeys } from 'smart-eval-kinvey';
import { setTimeout } from 'tns-core-modules/timer';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'DemoRequests',
  moduleId: module.id,
  templateUrl: './demo-requests.component.html',
  styleUrls: ['./demo-requests.component.css']
})
export class DemoRequestsComponent implements OnInit, AfterViewInit {
  @ViewChild('listview')
  listview: ElementRef;
  mapboxToken = SmartEvalKeys.MAPBOX_TOKEN;
  items: any[] = [];
  itemsLoaded = false;
  isFetchingData = false;
  userType;
  currentUserId;

  private _datastore = Kinvey.DataStore.collection<any>('DemoRequests');

  constructor(
    private _page: Page,
    private _routerExtensions: RouterExtensions,
    private _pageRoute: PageRoute,
    private _zone: NgZone,
    private _progressService: ProgressService,
    private _demoService: DemoService,
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private _translateService: TranslateService,
    private _logService: LoggingService
  ) {
    this._page.className = 'blue-gradient-down';
  }

  ngOnInit() {
    const activeUser = Kinvey.User.getActiveUser();
    this.userType = (activeUser.data as User).type as number;
    this.currentUserId = activeUser._id;
  }

  ngAfterViewInit() {
    setTimeout(async () => {
      await this._datastore.sync();
      this.itemsLoaded = false; // show the loading indicator message
      this.loadDemoRequests().then(() => {
        // (this.listview.nativeElement as ListView).refresh();
        this.itemsLoaded = true; // hide the loading indicator message
      });
    }, 200);
  }

  async loadDemoRequests() {
    return new Promise(async (resolve, reject) => {
      try {
        this.isFetchingData = true;
        // current array length
        const cachedData = this.items;
        console.log('this.items.length', this.items.length);
        console.log('cache length', cachedData.length);

        // await this._datastore.sync();
        const query = new Kinvey.Query();
        query.descending('_kmd.ect');
        query.limit = 15; // only query for 15 at a time
        // need to determine offset for the query based on current data
        query.skip = cachedData.length ? cachedData.length : -1;

        console.log(query);

        const stream = this._datastore.find().toPromise();

        stream
          .then(result => {
            console.log('result length', result.length);
            this.isFetchingData = false;
            // const newData = [...cachedData, ...result];
            // this.items = newData;
            this.items.unshift(result);
            resolve();
          })
          .catch(error => {
            this.isFetchingData = false;
            this._logService.logException(error);
            reject(error);
          });
      } catch (error) {
        this._logService.logException(error);
        reject(error);
      }
    });
  }

  onRequestTap(index) {
    console.log(this.items[index]);
  }

  loadMoreItems(args) {
    console.log('load more items');
    this.loadDemoRequests();
  }
}
