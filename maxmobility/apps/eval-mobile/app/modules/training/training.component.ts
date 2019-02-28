import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { RouterExtService } from '@maxmobility/core';
import { LoggingService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { ToastDuration, Toasty } from 'nativescript-toasty';
import { Subscription } from 'rxjs';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'Training',
  moduleId: module.id,
  templateUrl: 'training.component.html',
  styleUrls: ['training.component.scss']
})
export class TrainingComponent implements AfterViewInit, OnInit {
  private static LOG_TAG = 'training.component ';

  @ViewChild('carousel')
  carousel: ElementRef;
  slides = this.translateService.instant('training');

  previousUrl = '';

  private routeSub: Subscription; // subscription to route observer
  private toastTimeoutID: any;

  constructor(
    private _page: Page,
    private _routerExtService: RouterExtService,
    private _router: Router,
    private routerExtensions: RouterExtensions,
    private translateService: TranslateService,
    private _logService: LoggingService
  ) {
    this._logService.logBreadCrumb(TrainingComponent.LOG_TAG + `constructor.`);

    this._page.className = 'blue-gradient-down';
    // re-update slides every time it's created
    this.slides = this.translateService.instant('training');
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  isGif(value: string) {
    if (value.endsWith('.gif')) {
      return true;
    } else {
      return false;
    }
  }

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/trial'], {
      transition: {
        name: 'wipe'
      }
    });
  }

  ngOnInit() {
    this.previousUrl = this._routerExtService.getPreviousUrl();
  }

  ngAfterViewInit() {
    this.toastTimeoutID = setTimeout(() => {
      new Toasty(
        this.translateService.instant('training_component.swipe-left-message'),
        ToastDuration.LONG
      ).show();
    }, 1000);

    this.routeSub = this._router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.toastTimeoutID) {
          clearTimeout(this.toastTimeoutID);
        }
      }
    });
  }

  onBack(): void {
    this.routerExtensions.navigate(['/eval-entry'], {
      transition: {
        name: 'slideRight'
      }
    });
  }
}
