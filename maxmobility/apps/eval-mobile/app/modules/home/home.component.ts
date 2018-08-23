import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Demo } from '@maxmobility/core';
import { DemoService, FileService, FirmwareService, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { Feedback, FeedbackPosition, FeedbackType } from 'nativescript-feedback';
import { Color } from 'tns-core-modules/color';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'Home',
  moduleId: module.id,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HomeComponent {
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
      Image: '~/assets/images/evaluation.png',
      Description: 'menu.eval',
      Route: '/eval-entry'
    },
    {
      Image: '~/assets/images/training.jpg',
      Description: 'menu.training',
      Route: '/training'
    },
    {
      Image: '~/assets/images/trial.jpg',
      Description: 'menu.trial',
      Route: '/trial'
    }
  ];

  faqItems = this.translateService.instant('faqs');
  videoItems = this.translateService.instant('videos');
  /**
   * Boolean to track when the demo unit loading has finished to hide the loading indicator and show the list data
   */
  demoUnitsLoaded = false;

  private feedback: Feedback;

  constructor(
    private _page: Page,
    private _routerExtensions: RouterExtensions,
    private _logService: LoggingService,
    private _demoService: DemoService,
    private _firmwareService: FirmwareService,
    private _loggingService: LoggingService,
    private _fileService: FileService,
    private _userService: UserService,
    private translateService: TranslateService
  ) {
    console.log(`Home.Component start constructor ${performance.now()}`);
    this._page.enableSwipeBackNavigation = false;
    this.feedback = new Feedback();

    this._fileService.downloadTranslationFiles();

    // REGISTER FOR PUSH NOTIFICATIONS
    this._userService.registerForPushNotifications();

    // delaying since it typically won't be in the viewport initially on majority of devices
    setTimeout(() => {
      this._demoService
        .load()
        .then(() => {
          this.demoUnitsLoaded = true;
        })
        .catch(err => {
          this._loggingService.logException(err);
          this.demoUnitsLoaded = true;
        });
    }, 2500);

    console.log(`Home.Component end constructor ${performance.now()}`);
  }

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
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
    // Determines the pairing processs to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([item.Route], {
      queryParams: {
        index
      }
    });
  }

  otaThumbTapped(item: any) {
    // Determines the OTA process to perform
    const directive = item.Directive;
    this._routerExtensions.navigate([item.Route]);
  }

  videoThumbTapped(item: any) {
    this._routerExtensions.navigate([item.Route], {
      transition: {
        name: ''
      },
      queryParams: {
        url: item.Url,
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
