import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { CLog } from '@maxmobility/core';
import { isAndroid, isIOS } from 'platform';
import { TranslateService } from '@ngx-translate/core';

const Videos = [
  {
    Url: '8fn26J59WJ4',
    Description: 'videos.overview-desc',
    Title: 'videos.overview-title',
    Thumb: '~/assets/images/overview-thumb.jpg',
    Route: '/video'
  },
  {
    Url: 'uhA3-svjQFg',
    Description: 'videos.sd-basic-op-desc',
    Title: 'videos.sd-basic-op-title',
    Thumb: '~/assets/images/sd-basic-op-thumb.jpg',
    Route: '/video'
  },
  {
    Url: '6_M1J8HZXIk',
    Description: 'videos.pt-basic-op-desc',
    Title: 'videos.pt-basic-op-title',
    Thumb: '~/assets/images/pt-basic-op-thumb.jpg',
    Route: '/video'
  },
  {
    Url: '3B-6ked84us',
    Description: 'videos.pt-ap-basic-op-desc',
    Title: 'videos.pt-ap-basic-op-title',
    Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
    Route: '/video'
  },
  {
    Url: '3B-6ked84us',
    Description: 'videos.sea-basic-op-desc',
    Title: 'videos.sea-basic-op-title',
    Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
    Route: '/video'
  },
  {
    Url: '45Kj7zJpDcM',
    Description: 'videos.eval-training-desc',
    Title: 'videos.eval-training-desc',
    Thumb: '~/assets/images/eval-thumb.jpg',
    Route: '/video'
  },
  {
    Url: 'hFid9ks551A',
    Description: 'videos.interview-desc',
    Title: 'videos.interview-title',
    Thumb: '~/assets/images/interview-thumb.jpg',
    Route: '/video'
  }
];

export { Videos };

@Component({
  selector: 'Videos',
  moduleId: module.id,
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent {
  videos = Videos;

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
