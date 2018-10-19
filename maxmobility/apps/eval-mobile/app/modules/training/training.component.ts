import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { Toasty } from 'nativescript-toasty';
import { Subscription } from 'rxjs';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'Training',
  moduleId: module.id,
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements AfterViewInit {
  @ViewChild('carousel')
  carousel: ElementRef;
  slides = this.translateService.instant('training');

  private routeSub: Subscription; // subscription to route observer
  private toastTimeoutID: any;

  constructor(
    private _page: Page,
    private _router: Router,
    private routerExtensions: RouterExtensions,
    private translateService: TranslateService
  ) {
    // re-update slides every time it's created
    this.slides = this.translateService.instant('training');
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/trial'], {
      transition: {
        name: 'wipe'
      }
    });
  }

  ngAfterViewInit() {
    this.toastTimeoutID = setTimeout(() => {
      new Toasty(this.translateService.instant('training_component.swipe-left-message'), 'long').show();
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
