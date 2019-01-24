import { Component, OnInit } from '@angular/core';
import { DemoRequest, User } from '@maxmobility/core';
import { LoggingService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
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
export class DemoRequestsComponent implements OnInit {
  items: DemoRequest[] = [];
  itemsLoaded = false;
  isFetchingData = false;
  userType: number;
  currentUserId: string;

  private _datastore = Kinvey.DataStore.collection<DemoRequest>('DemoRequests');

  constructor(
    private _page: Page,
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

    this.loadDemoRequests()
      .then(() => {
        this.itemsLoaded = true;
      })
      .catch(error => {
        this._logService.logException(error);
        this.itemsLoaded = false;
      });
  }

  loadDemoRequests() {
    return new Promise((resolve, reject) => {
      this.isFetchingData = true;
      // build the Kinvey Query for DemoRequests
      const query = new Kinvey.Query();
      query.descending('_kmd.ect');
      // only query for 20 at a time for paging
      query.limit = 20;
      // need to determine offset for the query based on current data
      query.skip = this.items.length;
      console.log({ query });

      this._datastore
        .find(query)
        .toPromise()
        .then((entities: DemoRequest[]) => {
          this.itemsLoaded = true;
          this.isFetchingData = false;
          for (const i of entities) {
            this.items.push(i);
          }
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Load more when listview nears the bottom to page data into the items array.
   * @param args
   */
  loadMoreItems(args) {
    this.loadDemoRequests();
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
}
