import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { CLog } from '@maxmobility/core';
import { isAndroid, isIOS } from 'platform';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'Videos',
  moduleId: module.id,
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent {
  videos = this._translateService.instant('videos');

  constructor(private _routerExtensions: RouterExtensions, private _translateService: TranslateService) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  onItemTap(args) {
    const item = this.videos[args.index];
    const url = item.Url;
    const route = item.Route;
    const title = item.Title;
    const desc = item.Description;

    this._routerExtensions.navigate([route], {
      transition: {
        name: ''
      },
      queryParams: {
        url,
        desc,
        title
      }
    });
  }
}
