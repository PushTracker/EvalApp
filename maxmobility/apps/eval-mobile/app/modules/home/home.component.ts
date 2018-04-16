import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EventData } from 'tns-core-modules/data/observable';
import { topmost } from 'tns-core-modules/ui/frame';
import { View } from "ui/core/view";
import { Page } from 'tns-core-modules/ui/page';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import { WebView } from 'tns-core-modules/ui/web-view';
import { isIOS } from 'tns-core-modules/platform';
import { RouterExtensions } from 'nativescript-angular/router';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';
import { CLog, LoggingService } from '@maxmobility/core';

import { FAQComponent } from '../faq/faq.component';

@Component({
  selector: 'Home',
  moduleId: module.id,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;
  
    faqItems = FAQComponent.faqs;
    
  titles = [
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

  connectivityItems = [
    { Image: "~/assets/images/band_bluetooth.png", 
      Description: 'Pair your app with a PushTracker', 
      Directive:'pt-phone',
      Route: '/pairing' 
    },
    { Image: "~/assets/images/band_settings.png", 
      Description: 'Connect your app with the PushTracker', 
      Directive:'pt-phone-connect',
      Route: 'pairing' 
    },
    { Image: "~/assets/images/smartdrive-wheel.png", 
      Description: 'Pair your PushTracker with a SmartDrive',
      Directive:'pt-sd',
      Route: '/pairing' 
    },
  ];

  evalItems = [
    { Image: "~/assets/images/training-tap.jpg", 
      Description: 'Training how to use SmartDrive', 
      Route: '/training' 
    },
    { Image: "~/assets/images/eval-controls.jpg", 
      Description: 'Begin SmartDrive Evaluation', 
      Route: '/eval-entry' 
    },
    { Image: "~/assets/images/trial.jpg", 
      Description: 'Begin a SmartDrive Trial.', 
      Route: '/trial' 
    },

  ];

  otaItems = [
    { Image: "~/assets/images/pt-bt.jpg", 
      Description: 'Update the Firmware on your PushTracker',
      Directive:'pt',
      Route: '/ota'
    },
    { Image: "~/assets/images/sd-bt.jpg", 
      Description: 'Update the Firmware on your SmartDrive',
      Directive:'sd',
      Route: '/ota' 
    },
    { Image: "~/assets/images/pt-sd-bt.jpg", 
      Description: 'Update a PushTracker and SmartDrive together',
      Directive:'pt-sd',
      Route: '/ota' 
    },

  ];

  demoItems = [

    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 00001', 
      PTSerialNumber: 'PT: 00001', 
      Firmware: 'SD Firmware: 0.0.01',
      LastUsed: new Date(1988, 10, 23), 
      Location: 'Mountain View, CA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11001', 
      PTSerialNumber: 'PT: 11001', 
      Firmware: 'SD Firmware: 1.4',
      LastUsed: new Date(), 
      Location: 'Nashville, TN' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11002', 
      PTSerialNumber: 'PT: 110002', 
      Firmware: 'SD Firmware: 1.1',
      LastUsed: new Date(), 
      Location: 'Breckenridge, CO' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11003', 
      PTSerialNumber: 'PT: 11003', 
      Firmware: 'SD Firmware: 1.1',
      LastUsed: new Date(), 
      Location: 'Seattle, WA'
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11004', 
      PTSerialNumber: 'PT: 11004', 
      Firmware: 'SD Firmware: 1.2',
      LastUsed: new Date(), 
      Location: 'San Francisco, CA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11005', 
      PTSerialNumber: 'PT: 11005', 
      Firmware: 'SD Firmware: 1.4',
      LastUsed: new Date(), 
      Location: 'Los Angeles, CA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11006',
      PTSerialNumber: 'PT: 11006',  
      Firmware: 'SD Firmware: 1.2',
      LastUsed: new Date(), 
      Location: 'New Orleans, LA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11007', 
      PTSerialNumber: 'PT: 11007', 
      Firmware: 'SD Firmware: 1.1',
      LastUsed: new Date(), 
      Location: 'New York, NY' 
    }
  ];

  videoHtmlString_0 = '<iframe height="100%" width="100%" margin="0" src="https://www.youtube.com/embed/8fn26J59WJ4" modestbranding=1 controlles=0 frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_1 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/uhA3-svjQFg" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_2 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/6_M1J8HZXIk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_3 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/3B-6ked84us" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_4 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/3B-6ked84us" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_5 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/45Kj7zJpDcM" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoHtmlString_6 = '<iframe height="170" width="170" src="https://www.youtube.com/embed/hFid9ks551A" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

  videoItems = [
    { Url: this.videoHtmlString_0, 
      Description: 'SmartDrive Introduction',
      Thumb: '~/assets/images/overview-thumb.jpg',
      Route:"/video"
    },
    { Url: this.videoHtmlString_1, 
      Description: 'SmartDrive MX2+ Basic Operation',
      Thumb: '~/assets/images/sd-basic-op-thumb.jpg',
      Route:"/video"
    },
    { Url: this.videoHtmlString_2, 
      Description: 'PushTracker Basic Operation',
      Thumb: '~/assets/images/pt-basic-op-thumb.jpg',
      Route:"/video" 
    },
    { Url: this.videoHtmlString_3, 
      Description: 'Intro to the PushTracker App',
      Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
      Route:"/video" 
    },
    { Url: this.videoHtmlString_4, 
      Description: 'Intro to the Eval App',
      Thumb: '~/assets/images/intro-PushTracker-app-thumb.jpg',
      Route:"/video"  
    },
    { Url: this.videoHtmlString_5, 
      Description: 'SmartDrive Evaluation and Training',
      Thumb: '~/assets/images/eval-thumb.jpg',
      Route:"/video"  
    },
    { Url: this.videoHtmlString_6, 
      Description: 'Interview with Chels and Steph',
      Thumb: '~/assets/images/interview-thumb.jpg',
      Route:"/video"  
    },
    
  ];  

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _page: Page, private _routerExtensions: RouterExtensions, private _logService: LoggingService) {


  }

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

  connectivityThumbTapped(item: any) {

    const route = item.Route;
    //Determines the pairing processs to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: 'wipe'
        }
      }
    );
  }

  otaThumbTapped(item: any) {

    const route = item.Route;
    //Determines the OTA process to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: 'wipe'
        }
      }
    );
  }

  videoThumbTapped(item: any) {

    const videoUrl = item.Url;
    const route = item.Route;

    console.log(item.Url);
    console.log(item.Route);

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: 'wipe'
        },
        queryParams: {
        url: videoUrl,
        desc: item.Description
        }
      }
    );
  }

  evalThumbTapped(item: any) {

    console.log(item.Route);

    this._routerExtensions.navigate([item.Route],
        {
        transition: {
          name: 'wipe'
        }
      }
    );
  }

  chevronButtonTapped(route: string) {

    console.log(route);

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: 'wipe'
        }
      }
    );

  }

}
