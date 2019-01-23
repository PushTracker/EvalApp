import { AfterViewInit, Component, OnInit } from '@angular/core';
import { DemoRequest, User } from '@maxmobility/core';
import { LoggingService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { RouterExtensions } from 'nativescript-angular/router';
import { ToastDuration, ToastPosition, Toasty } from 'nativescript-toasty';
import { setTimeout } from 'tns-core-modules/timer';
import { confirm } from 'tns-core-modules/ui/dialogs/dialogs';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'DemoRequests',
  moduleId: module.id,
  templateUrl: './demo-requests.component.html',
  styleUrls: ['./demo-requests.component.css']
})
export class DemoRequestsComponent implements OnInit, AfterViewInit {
  items: DemoRequest[] = [];
  itemsLoaded = false;
  isFetchingData = false;
  userType: number;
  currentUserId: string;

  private _datastore = Kinvey.DataStore.collection<DemoRequest>('DemoRequests');

  constructor(
    private _page: Page,
    private _routerExtensions: RouterExtensions,
    private _progressService: ProgressService,
    private _translateService: TranslateService,
    private _logService: LoggingService
  ) {
    this._page.className = 'blue-gradient-down';
  }

  ngOnInit() {
    const activeUser = Kinvey.User.getActiveUser();
    this.userType = (activeUser.data as User).type as number;
    this.currentUserId = activeUser._id;
    this._datastore.clearSync();
  }

  ngAfterViewInit() {
    setTimeout(async () => {
      await this._datastore.sync();
      this.itemsLoaded = false; // show the loading indicator message
      this.loadDemoRequests()
        .then(() => {
          // (this.listview.nativeElement as ListView).refresh();
          this.itemsLoaded = true; // hide the loading indicator message
          console.log(
            'demo request done',
            'this.items.length',
            this.items.length
          );
        })
        .catch(error => {
          this._logService.logException(error);
        });
    }, 200);
  }

  loadDemoRequests() {
    return new Promise(async (resolve, reject) => {
      this.isFetchingData = true;
      // current array length
      const cachedData = this.items;
      console.log('this.items.length', this.items.length);

      // build the Kinvey Query for DemoRequests
      const query = new Kinvey.Query().descending('_kmd.ect');
      query.limit = 20; // only query for 15 at a time
      // need to determine offset for the query based on current data
      query.skip = cachedData.length ? cachedData.length : 0;
      console.log({ query });

      this._datastore.find(query).subscribe(
        (entities: DemoRequest[]) => {
          this.isFetchingData = false;
          for (const i of entities) {
            this.items.push(i);
          }
        },
        error => {
          console.log(error.message);
          this.isFetchingData = false;
          this._logService.logException(error);
          reject(error);
        },
        () => {
          resolve();
        }
      );
    });
  }

  /**
   * Button tap event for "claiming" Demo Requests. Will confirm with the user if they wish to claim the demo.
   * If confirmed, set the `claimed_user` value to the claiming user (current user id) and save to Kinvey.
   * This user will then be able to flag Demo Requests as `complete`.
   * @param index [number] - Index in the items array for DemoRequest entities.
   */
  async onClaimDemoRequestTap(index: number) {
    const dr = this.items[index];
    const confirmResult = await confirm({
      title: this._translateService.instant('demo-requests.claim'),
      message: this._translateService.instant('demo-requests.claim_confirm'),
      okButtonText: this._translateService.instant('dialogs.yes'),
      cancelButtonText: this._translateService.instant('dialogs.no')
    });

    if (confirmResult === true) {
      // set the claimed_user to the current user since they confirmed to claim this demo
      dr.claimed_user = this.currentUserId;

      console.log('Modified DemoRequest', { dr });

      this._datastore
        .save(dr)
        .then(entity => {
          console.log('updated entity', { entity });
          new Toasty(
            'Demo Request Claimed.',
            ToastDuration.LONG,
            ToastPosition.CENTER
          ).show();
        })
        .catch(error => {
          this._logService.logException(error);
          console.log('error saving modified demo request', { dr }, error);
        });
    }
  }

  loadMoreItems(args) {
    console.log('load more items');
    this.loadDemoRequests().then(() => {
      console.log('loadMoreItems done', 'this.items.length', this.items.length);
    });
  }
}
