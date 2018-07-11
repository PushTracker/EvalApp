// angular
import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
// nativescript
import { RouterExtensions } from 'nativescript-angular/router';
import { View } from 'ui/core/view';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
const carousel = require('nativescript-carousel').Carousel;
import { isAndroid, isIOS } from 'platform';
import { TranslateService } from '@ngx-translate/core';

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

  constructor(private routerExtensions: RouterExtensions, private translateService: TranslateService) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  // button events
  onNext(): void {
    this.routerExtensions.navigate(['/trial'], {
      // clearHistory: true,
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
      // clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }
}
