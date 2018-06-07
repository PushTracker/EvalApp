import { ChangeDetectionStrategy, Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { EventData } from 'tns-core-modules/data/observable';
import { topmost } from 'tns-core-modules/ui/frame';
import { View } from 'ui/core/view';
import { Page } from 'tns-core-modules/ui/page';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import { Color } from 'tns-core-modules/color';
import { WebView } from 'tns-core-modules/ui/web-view';
import { isAndroid, isIOS } from 'platform';
import { RouterExtensions } from 'nativescript-angular/router';
import { CLog, LoggingService } from '@maxmobility/core';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
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
  private feedback: Feedback;

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  faqItems = FAQs;
  videoItems = Videos;
  demoItems = Demos;

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

  constructor(private _page: Page, private _routerExtensions: RouterExtensions, private _logService: LoggingService) {
    this._page.enableSwipeBackNavigation = false;

    this.feedback = new Feedback();
  }

  ngOnInit(): void {
    CLog('HomeComponent OnInit');
  }

  ngAfterViewInit(): void {}

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
        curve: 'easeInOut',
        clearHistory: true
      }
    });
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
    console.log(item.Route);

    this._routerExtensions.navigate([item.Route], {
      transition: {
        name: ''
      }
    });
  }

  chevronButtonTapped(route: string) {
    console.log(route);

    this._routerExtensions.navigate([route], {
      transition: {
        name: ''
      }
    });
  }

  faqThumbTapped(item: any) {
    const answer = item.answer;
    const question = item.question;
    console.log(item.answer);
    console.log(item.question);

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
