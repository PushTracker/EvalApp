import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { EventData } from 'tns-core-modules/data/observable';
import { topmost } from 'tns-core-modules/ui/frame';
import { Page } from 'tns-core-modules/ui/page';
import { isIOS } from 'tns-core-modules/platform';
import { RouterExtensions } from 'nativescript-angular/router';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { CLog, LoggingService } from '@maxmobility/core';

@Component({
  selector: 'Home',
  moduleId: module.id,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  titles = [
    // tslint:disable-next-line:max-line-length
    { Title: 'Pairing', 
      Image: String.fromCharCode(0xf0c1), 
      Description: 'Connect with PaushTracker and SmartDrive', 
      Route: '/pairing' },
    {
      Title: 'Videos',
      Image: String.fromCharCode(0xf05a),
      Description: 'Training videos and Lessons',
      Route: '/videos'
    },
    {
      Title: 'Eval',
      Image: String.fromCharCode(0xf0ae),
      Description: 'Walk-through evaluation and generate an LMN',
      Route: '/eval-entry'
    },
    {
      Title: 'OTA',
      Image: String.fromCharCode(0xf019),
      Description: 'Over the Air Firmware Updates',
      Route: '/ota'
    },
    {
      Title: 'Demos',
      Image: String.fromCharCode(0xf02a),
      Description: 'Fleet management and Tracking.',
      Route: '/demos'
    },
    { Title: 'FAQ', Image: String.fromCharCode(0xf059), Description: 'Common SmartDrive Questions', Route: '/faq' }
  ];
    pairingItems = [
    { Image: "~/assets/images/band_bluetooth.png", Description: 'Pair your app with a PushTracker', Route: '/pairing' },
    { Image: "~/assets/images/band_settings.png", Description: 'Connect your app with the PushTracker', Route: 'connect()' },
    { Image: "~/assets/images/smartdrive-wheel.png", Description: 'Pair your PushTracker with a SmartDrive', Route: '/home' },

  ];


  videoHtmlString_0 = '<iframe height="170" width="170" margin="0" src="https://www.youtube.com/embed/8fn26J59WJ4" modestbranding=1 controlles=0 frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_1 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/uhA3-svjQFg" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_2 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/6_M1J8HZXIk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_3 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/3B-6ked84us" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_4 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/3B-6ked84us" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_5 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/45Kj7zJpDcM" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_6 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/hFid9ks551A" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

    videoItems = [
    { Url: this.videoHtmlString_0, Description: 'SmartDrive Introduction' 
    },
    { Url: this.videoHtmlString_1, Description: 'SmartDrive MX2+ Basic Operation' },
    { Url: this.videoHtmlString_2, Description: 'PushTracker Basic Operation' 
    },
    { Url: this.videoHtmlString_3, Description: 'Intro to the PushTracker App' 
    },
    { Url: this.videoHtmlString_4, Description: 'Intro to the Eval App' 
    },
    { Url: this.videoHtmlString_5, Description: 'SmartDrive Evaluation and Training' 
    },
    { Url: this.videoHtmlString_6, Description: 'Interview with Chels and Steph' 
    },
    
  ];  

  demoItems = [
    { SerialNumber: '11000', LastUsed: new Date(1988, 10, 23), Location: 'Mountain View, CA' },
    { SerialNumber: '11001', LastUsed: new Date(), Location: 'Nashville, TN' },
    { SerialNumber: '11002', LastUsed: new Date(), Location: 'Breckenridge, CO' },
    { SerialNumber: '11003', LastUsed: new Date(), Location: 'Seattle, WA' },
    { SerialNumber: '11004', LastUsed: new Date(), Location: 'San Francisco, CA' },
    { SerialNumber: '11005', LastUsed: new Date(), Location: 'Los Angeles, CA' },
    { SerialNumber: '11006', LastUsed: new Date(), Location: 'New Orleans, LA' },
    { SerialNumber: '11007', LastUsed: new Date(), Location: 'New York, NY' }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _page: Page, private _routerExtensions: RouterExtensions, private _logService: LoggingService) {}

  ngOnInit(): void {
    CLog('HomeComponent OnInit');
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }

  chevronButtonTapped(String: string) {

    // console.log(String);

    const route = String;

    console.log(route);

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: 'wipe'
        }
      }
    );

  }

  onItemTapThirdList(args) {
    const route = this.titles[args.index].Route;
    CLog('current route', this._routerExtensions.router.url, 'navigating to = ', route);
    this._routerExtensions.navigate(
      [route]
      //   {
      //   transition: {
      //     name: 'slide'
      //   }
      // }
    );
  }
}
