import { ChangeDetectionStrategy, Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { EventData } from 'tns-core-modules/data/observable';
import { topmost } from 'tns-core-modules/ui/frame';
import { View } from "ui/core/view";
import { Page } from 'tns-core-modules/ui/page';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import { Color } from "tns-core-modules/color";
import { Feedback, FeedbackType, FeedbackPosition } from "nativescript-feedback";
import { WebView } from 'tns-core-modules/ui/web-view';
import { isAndroid, isIOS } from "platform";
import { RouterExtensions } from 'nativescript-angular/router';
// import { DrawerTransitionBase, SlideAlongTransition } from 'nativescript-ui-sidedrawer';
// import { RadSideDrawerComponent, SideDrawerType } from 'nativescript-ui-sidedrawer/angular';
// import { RadListViewComponent } from 'nativescript-ui-listview/angular';
import { CLog, LoggingService } from '@maxmobility/core';
import { FAQs } from '../faq/faq.component';
import { Videos } from '../videos/videos.component';
import { Demos } from '../demos/demos.component';

@Component({
  selector: 'Home',
  moduleId: module.id,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, AfterViewInit {
  // @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

    isIOS(): boolean {
        return isIOS;
    }

    isAndroid(): boolean {
        return isAndroid;
    }

  // private drawer: SideDrawerType;
  private feedback: Feedback;
  
  faqItems = FAQs;
  videoItems = Videos;
  demoItems = Demos;
    
  connectivityItems = [
    { Image: "~/assets/images/pt-phone-home.png", 
      Description: 'Pair your app with a PushTracker', 
      Directive:'pt-phone',
      Route: '/pairing' 
    },
    { Image: "~/assets/images/pt-connect-home.png", 
      Description: 'Connect your app with the PushTracker', 
      Directive:'pt-phone-connect',
      Route: 'pairing' 
    },
    { Image: "~/assets/images/pt-sd-pairing-home.png", 
      Description: 'Pair your PushTracker with a SmartDrive',
      Directive:'pt-sd',
      Route: '/pairing' 
    },
    { Image: "~/assets/images/pt-sd-bt.jpg", 
      Description: 'Update a PushTracker and SmartDrive',
      Directive:'pt-sd',
      Route: '/ota' 
    }
  ];

  evalItems = [
    { Image: "~/assets/images/Training.jpg", 
      Description: 'Training how to use SmartDrive', 
      Route: '/training' 
    },
    { Image: "~/assets/images/evaluation.jpg", 
      Description: 'Begin SmartDrive Evaluation', 
      Route: '/eval-entry' 
    },
    { Image: "~/assets/images/trial.jpg", 
      Description: 'Begin a SmartDrive Trial.', 
      Route: '/trial' 
    }

  ];

  // private _sideDrawerTransition: DrawerTransitionBase;

  constructor(private _page: Page, private _routerExtensions: RouterExtensions, private _logService: LoggingService) {

    this._page.enableSwipeBackNavigation = false;

    this.feedback = new Feedback();


    //const radList = <RadListViewComponent>this.radListView.nativeElement;
    //this.radListView.listView.scrollWithAmount(50, true);

  }

  ngOnInit(): void {
    CLog('HomeComponent OnInit');
    // this._sideDrawerTransition = new SlideAlongTransition();    
  }

  ngAfterViewInit(): void {

    // this.drawer = this.drawerComponent.sideDrawer;


  }

  onRadListLoaded(event) {
    // const radListView = event.object;
    // setTimeout(() => {
    //   radListView.scrollWithAmount(150, true);
    // setTimeout(() => {
    //   radListView.scrollWithAmount(-150, true);    
    // }, 500);
    // }, 100);
  }

  // get sideDrawerTransition(): DrawerTransitionBase {
  //   return this._sideDrawerTransition;
  // }

  onDrawerButtonTap(): void {
    // this.drawerComponent.sideDrawer.showDrawer();
    this._routerExtensions.navigate(["/account"],
        {
        transition: {
            name: "slideTop",
            duration: 350,
            curve: "easeInOut",
            clearHistory: true
        }
      }
    );
  }

  connectivityThumbTapped(item: any) {

    const route = item.Route;
    //Determines the pairing processs to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([route]);
  }

  otaThumbTapped(item: any) {

    const route = item.Route;
    //Determines the OTA process to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([route]);
  }

  videoThumbTapped(item: any) {

    const videoUrl = item.Url;
    const route = item.Route;
    const title = item.Title;
    const desc = item.Description;
    console.log(item.Url);
    console.log(item.Route);

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: ''
        },
        queryParams: {
        url: videoUrl,
        desc: item.Description,
        title: item.Title
        }
      }
    );
  }

  evalThumbTapped(item: any) {

    console.log(item.Route);

    this._routerExtensions.navigate([item.Route],
        {
        transition: {
          name: ''
        }
      }
    );
  }

  chevronButtonTapped(route: string) {

    console.log(route);

    this._routerExtensions.navigate([route],
        {
        transition: {
          name: ''
        }
      }
    );

  }

}
