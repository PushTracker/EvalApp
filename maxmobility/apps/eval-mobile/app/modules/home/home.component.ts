import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnInit,
  AfterViewInit,
  ViewChild
} from '@angular/core';
import { EventData } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { topmost } from 'tns-core-modules/ui/frame';
import { View } from 'ui/core/view';
import { Page } from 'tns-core-modules/ui/page';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import { Color } from 'tns-core-modules/color';
import { WebView } from 'tns-core-modules/ui/web-view';
import { isAndroid, isIOS } from 'platform';
import { RouterExtensions } from 'nativescript-angular/router';
import { CLog, LoggingService, Demo } from '@maxmobility/core';
import { DemoService, UserService } from '@maxmobility/mobile';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { FAQs } from '../faq/faq.component';
import { Videos } from '../videos/videos.component';

@Component({
  selector: 'Home',
  moduleId: module.id,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HomeComponent implements OnInit, AfterViewInit {
  faqItems = FAQs;
  videoItems = Videos;
  connectivityItems = [
    {
      Image: '~/assets/images/pt-phone-home.png',
      Description: 'menu.pair-pt-app',
      Directive: 'pt-phone',
      Route: '/pairing'
    },
    {
      Image: '~/assets/images/pt-connect-home.png',
      Description: 'menu.connect-app',
      Directive: 'pt-phone-connect',
      Route: 'pairing'
    },
    {
      Image: '~/assets/images/pt-sd-pairing-home.png',
      Description: 'menu.pair-pt-sd',
      Directive: 'pt-sd',
      Route: '/pairing'
    },
    {
      Image: '~/assets/images/pt-sd-bt.jpg',
      Description: 'menu.ota',
      Directive: 'ota',
      Route: '/ota'
    }
  ];

  evalItems = [
    {
      Image: '~/assets/images/evaluation.jpg',
      Description: 'menu.eval',
      Route: '/eval-entry'
    },
    {
      Image: '~/assets/images/Training.jpg',
      Description: 'menu.training',
      Route: '/training'
    },
    {
      Image: '~/assets/images/trial.jpg',
      Description: 'menu.trial',
      Route: '/trial'
    }
  ];

  private feedback: Feedback;

  constructor(
    private _page: Page,
    private _routerExtensions: RouterExtensions,
    private _logService: LoggingService,
    private _userService: UserService,
    private _demoService: DemoService,
    private zone: NgZone
  ) {
    this._page.enableSwipeBackNavigation = false;
    this.feedback = new Feedback();
    if (this._userService.user) {
      // REGISTER FOR PUSH NOTIFICATIONS
      this._userService.registerForPushNotifications();
      // Download i18n files
      this._userService.downloadTranslationFiles();
    }
  }

  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
  }
  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }
  ngOnInit(): void {
    /*
    this.zone.run(() => {
      this._demoService.load().catch(err => {
        console.log(`Couldn't load demos: ${err}`);
      });
    });
      */
  }

  ngAfterViewInit(): void {
    this._demoService.load().catch(err => {
      console.log(`Couldn't load demos: ${err}`);
    });
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

  onDrawerButtonTap(): void {
    this._routerExtensions.navigate(['/account'], {
      transition: {
        name: 'slideTop',
        duration: 350,
        curve: 'easeInOut'
        // clearHistory: true
      }
    });
  }

  connectivityThumbTapped(item: any) {
    const index = this.connectivityItems.indexOf(item);
    const route = item.Route;
    // Determines the pairing processs to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([route], {
      queryParams: {
        index
      }
    });
  }

  otaThumbTapped(item: any) {
    const route = item.Route;
    // Determines the OTA process to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([route]);
  }

  videoThumbTapped(item: any) {
    const videoUrl = item.Url;
    const route = item.Route;
    const title = item.Title;
    const desc = item.Description;

    this._routerExtensions.navigate([route], {
      transition: {
        name: ''
      },
      queryParams: {
        url: videoUrl,
        desc: item.Description,
        title: item.Title
      }
    });
  }

  evalThumbTapped(item: any) {
    this._routerExtensions.navigate([item.Route], {
      transition: {
        name: ''
      }
    });
  }

  demoThumbTapped(item: any) {
    let index = -1;
    if (item) {
      index = DemoService.Demos.indexOf(item);
    }
    this._routerExtensions.navigate(['/demo-detail'], {
      queryParams: {
        index
      }
    });
  }

  chevronButtonTapped(route: string) {
    this._routerExtensions.navigate([route], {
      transition: {
        name: ''
      }
    });
  }

  faqThumbTapped(item: any) {
    const answer = item.answer;
    const question = item.question;
    this.feedback.show({
      title: question,
      titleColor: new Color('#fff'),
      message: answer,
      messageColor: new Color('#fff'),
      position: FeedbackPosition.Bottom,
      duration: 14500,
      type: FeedbackType.Info,
      backgroundColor: new Color('#004F7E'),
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }
}
