import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { EventData } from 'tns-core-modules/data/observable';
import { topmost } from 'tns-core-modules/ui/frame';
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
    { Title: 'Intro', Image: String.fromCharCode(0xf05a), Description: 'Learn about SmartDrive', Route: '/home' },
    {
      Title: 'Videos',
      Image: String.fromCharCode(0xf008),
      Description: 'Training videos and Lessons',
      Route: '/videos'
    },
    {
      Title: 'Eval',
      Image: String.fromCharCode(0xf0ae),
      Description: 'Walk-through evaluation and generate an LMN',
      Route: '/evalEntry'
    },
    { Title: 'OTA', Image: String.fromCharCode(0xf019), Description: 'Over the Air Firmware Updates', Route: '/ota' },
    {
      Title: 'Demos',
      Image: String.fromCharCode(0xf02a),
      Description: 'Fleet management and Tracking.',
      Route: '/demos'
    },
    { Title: 'FAQ', Image: String.fromCharCode(0xf059), Description: 'Common SmartDrive Questions', Route: '/faq' }
  ];

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _routerExtensions: RouterExtensions, private _logService: LoggingService) {}

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
    this._routerExtensions.navigate([this.titles[args.index].Route], {
      transition: {
        name: 'slide'
      }
    });
  }
}
