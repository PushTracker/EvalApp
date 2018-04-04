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
      Route: 'demos'
    },
    { Title: 'FAQ', Image: String.fromCharCode(0xf059), Description: 'Common SmartDrive Questions', Route: '/faq' }
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
