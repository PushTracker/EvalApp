import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Demo, User } from '@maxmobility/core';
import {
  BluetoothService,
  DemoService,
  FileService,
  FirmwareService,
  LocationService,
  LoggingService,
  UserService
} from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
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
      Image: '~/assets/images/training-transparent.png',
      Description: 'menu.training',
      Route: '/training'
    },
    {
      Image: '~/assets/images/pt-phone-home.png',
      Description: 'menu.pair-pt-app',
      Directive: 0,
      Route: '/pairing'
    },
    {
      Image: '~/assets/images/pt-connect-home.png',
      Description: 'menu.connect-app',
      Directive: 1,
      Route: 'pairing'
    },
    {
      Image: '~/assets/images/pt-sd-pairing-home.png',
      Description: 'menu.pair-pt-sd',
      Directive: 2,
      Route: '/pairing'
    },
    {
      Image: '~/assets/images/pt-settings-gear.png',
      Description: 'PushTracker Settings',
      Directive: 3,
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
      Image: '~/assets/images/trial-history-transparent.png',
      Description: 'menu.eval-history',
      Route: '/evals'
    },
    {
      Image: '~/assets/images/trial-transparent.png',
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

  userType: number;

  private feedback = new Feedback();

  constructor(
    private _page: Page,
    private _routerExtensions: RouterExtensions,
    private _logService: LoggingService,
    private _demoService: DemoService,
    private _firmwareService: FirmwareService,
    private _loggingService: LoggingService,
    private _fileService: FileService,
    private _userService: UserService,
    private _bluetoothService: BluetoothService,
    private translateService: TranslateService
  ) {
    console.log(`Home.Component start constructor ${performance.now()}`);
    this._page.enableSwipeBackNavigation = false;

    this._fileService.downloadTranslationFiles();

    this._firmwareService.initFirmwareService();

    const activeUser = this._userService.user;
    this.userType = (activeUser.data as User).type as number;

    // delaying since it typically won't be in the viewport initially on majority of devices
    setTimeout(() => {
      this._demoService
        .load()
        .then(() => {
          this.demoUnitsLoaded = true;
          console.log('bluetoothService enabled', this._bluetoothService.enabled);
        })
        .catch(err => {
          this._loggingService.logException(err);
          this.demoUnitsLoaded = true;
        });
    }, 2000);

    // update the users geolocation tag so we can query by location
    LocationService.getCoordinates()
      .then(result => {
        console.log('location coords result', result);
        Kinvey.User.update({
          _geoloc: [result.longitude, result.latitude]
        });
      })
      .catch(error => {
        console.log('location error', error);
      });

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
      }
    });
  }

  connectivityThumbTapped(item: any) {
    //const index = this.connectivityItems.indexOf(item);
    // Determines the pairing processs to perform
    const directive = item.Directive;

    this._routerExtensions.navigate([item.Route], {
      queryParams: {
        index: directive
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
    const whiteColor = new Color('#fff');
    const blueColor = new Color('#004F7E');
    this.feedback.show({
      title: question,
      titleColor: whiteColor,
      message: answer,
      messageColor: whiteColor,
      position: FeedbackPosition.Bottom,
      duration: 14500,
      type: FeedbackType.Info,
      backgroundColor: blueColor,
      onTap: () => {
        console.log('feedback tapped');
      }
    });
  }
}
