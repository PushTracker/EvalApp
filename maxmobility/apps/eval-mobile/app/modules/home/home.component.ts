import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Page } from 'tns-core-modules/ui/page';
import { Color } from 'tns-core-modules/color';
import { RouterExtensions } from 'nativescript-angular/router';
import { LoggingService, Demo } from '@maxmobility/core';
import { DemoService, FirmwareService } from '@maxmobility/mobile';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { FAQs } from '../faq/faq.component';
import { Videos } from '../videos/videos.component';

@Component({
  selector: 'Home',
  moduleId: module.id,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HomeComponent {
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
    private _demoService: DemoService,
    private _firmwareService: FirmwareService
  ) {
    this._page.enableSwipeBackNavigation = false;
    this.feedback = new Feedback();

    this._demoService.load().catch(err => {
      console.log(`Couldn't load demos: ${err}`);
    });
  }

  get currentVersion(): string {
    return FirmwareService.versionByteToString(this._firmwareService.firmwares.PT.version);
  }

  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
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
