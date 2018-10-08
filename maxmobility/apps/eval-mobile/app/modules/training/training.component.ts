import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavigationStart, Router } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { Subscription } from 'rxjs';
import { Page } from 'tns-core-modules/ui/page';
import { SnackBar } from 'nativescript-snackbar';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
const carousel = require('nativescript-carousel').Carousel;

@Component({
  selector: 'Training',
  moduleId: module.id,
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements AfterViewInit {
  @ViewChild('carousel')
  carousel: ElementRef;
  snackbar = new SnackBar();
  slides = this.translateService.instant('training');

  private routeSub: Subscription; // subscription to route observer
  private snackbarTimeoutID: any;

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
    this.snackbarTimeoutID = setTimeout(() => {
      try {
        this.snackbar.simple('Swipe left to view more slides.').catch(err => {
          this.snackbarTimeoutID = null;
        });
      } catch (ex) {
        this.snackbarTimeoutID = null;
      }
      this.snackbarTimeoutID = null;
    }, 1000);

    this.routeSub = this._router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.snackbarTimeoutID) {
          clearTimeout(this.snackbarTimeoutID);
        }
      }
    });

    this._page.on(Page.navigatingFromEvent, event => {
      if (this.snackbarTimeoutID) {
        clearTimeout(this.snackbarTimeoutID);
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
