import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterExtensions } from 'nativescript-angular/router';
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
  @ViewChild('carousel') carousel: ElementRef;
  snackbar = new SnackBar();
  slides = this.translateService.instant('training');

  constructor(private routerExtensions: RouterExtensions, private translateService: TranslateService) {
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
    setTimeout(() => {
      this.snackbar.simple('Swipe left to view more slides.');
    }, 1000);
  }

  onBack(): void {
    this.routerExtensions.navigate(['/eval-entry'], {
      transition: {
        name: 'slideRight'
      }
    });
  }
}
