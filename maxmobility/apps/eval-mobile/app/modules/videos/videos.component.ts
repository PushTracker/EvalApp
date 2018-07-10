import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';
import { LoadEventData, WebView } from 'tns-core-modules/ui/web-view';
import { CLog } from '@maxmobility/core';
import { isAndroid, isIOS } from 'platform';
import { TranslateService } from '@ngx-translate/core';

const Videos = [
  {
    Url:
      '<iframe style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/8fn26J59WJ4"></iframe>',
    Description: 'videos.overview-desc',
    Title: 'videos.overview-title',
    Thumb: '~/assets/images/overview-thumb.jpg',
    Route: '/video'
  },
  {
    Url:
      '<iframe style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/uhA3-svjQFg"  ></iframe>',
    Description: 'videos.sd-basic-op-desc',
    Title: 'videos.sd-basic-op-title',
    Thumb: '~/assets/images/sd-basic-op-thumb.jpg',
    Route: '/video'
  },
  {
    Url:
      '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/6_M1J8HZXIk"  ></iframe>',
    Description: 'videos.pt-basic-op-desc',
    Title: 'videos.pt-basic-op-title',
    Thumb: '~/assets/images/pt-basic-op-thumb.jpg',
    Route: '/video'
  },
  {
    Url:
      '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/3B-6ked84us"  ></iframe>',
    Description: 'videos.pt-ap-basic-op-desc',
    Title: 'videos.pt-ap-basic-op-title',
    Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
    Route: '/video'
  },
  {
    Url:
      '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/3B-6ked84us"  ></iframe>',
    Description: 'videos.sea-basic-op-desc',
    Title: 'videos.sea-basic-op-title',
    Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
    Route: '/video'
  },
  {
    Url:
      '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/45Kj7zJpDcM"  ></iframe>',
    Description: 'videos.eval-training-desc',
    Title: 'videos.eval-training-desc',
    Thumb: '~/assets/images/eval-thumb.jpg',
    Route: '/video'
  },
  {
    Url:
      '<iframe  style="margin-bottom: 10; padding:0; border:0; width:100%; height:100%" src="https://www.youtube.com/embed/hFid9ks551A"  ></iframe>',
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
