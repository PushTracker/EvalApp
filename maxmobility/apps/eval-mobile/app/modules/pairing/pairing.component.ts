import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { PushTracker } from '@maxmobility/core';
import { BluetoothService } from '@maxmobility/mobile';
import { PageRoute, RouterExtensions } from 'nativescript-angular/router';
import { Feedback } from 'nativescript-feedback';
import { SnackBar } from 'nativescript-snackbar';
import { switchMap } from 'rxjs/operators';
import { Gif } from 'nativescript-gif';
import { ChangedData, ObservableArray } from 'tns-core-modules/data/observable-array';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css']
})
export class PairingComponent implements AfterViewInit {
  @ViewChild('carousel') carousel: ElementRef;
  snackbar = new SnackBar();
  selectedPage = 0;

  slides = this._translateService.instant('pairing');

  private feedback: Feedback;

  constructor(
    private pageRoute: PageRoute,
    private routerExtensions: RouterExtensions,
    private _bluetoothService: BluetoothService,
    private _translateService: TranslateService
  ) {
    // update slides
    this.slides = this._translateService.instant('pairing');

    // figure out which slide we're going to
    this.pageRoute.activatedRoute.pipe(switchMap(activatedRoute => activatedRoute.queryParams)).forEach(params => {
      if (params.index) {
        this.selectedPage = params.index;
        console.log(this.selectedPage);
      }
    });

    this.feedback = new Feedback();
    // handle pushtracker pairing events for existing pushtrackers
    console.log('registering for pairing events!');
    BluetoothService.PushTrackers.map(pt => {
      pt.on(PushTracker.pushtracker_paired_event, args => {
        this.pushTrackerPairingSuccess();
      });
      pt.on(PushTracker.pushtracker_connect_event, args => {
        if (pt.paired) {
          this.pushTrackerConnectionSuccess();
        }
      });
    });
    // listen for completely new pusthrackers (that we haven't seen before)
    BluetoothService.PushTrackers.on(ObservableArray.changeEvent, (args: ChangedData<number>) => {
      if (args.action === 'add') {
        const pt = BluetoothService.PushTrackers.getItem(BluetoothService.PushTrackers.length - 1);
        if (pt) {
          pt.on(PushTracker.pushtracker_paired_event, pairedArgs => {
            this.pushTrackerPairingSuccess();
          });
          pt.on(PushTracker.pushtracker_connect_event, arg => {
            if (pt.paired) {
              this.pushTrackerConnectionSuccess();
            }
          });
        }
      }
    });
  }

  // Connectivity Events
  pushTrackerPairingSuccess() {
    this.feedback.success({
      title: this._translateService.instant('dialogs.success'),
      message: this._translateService.instant('bluetooth.pairing-success'),
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }

  pushTrackerConnectionSuccess() {
    this.feedback.success({
      title: this._translateService.instant('dialogs.success'),
      message: this._translateService.instant('bluetooth.connection-success'),
      duration: 4500,
      // type: FeedbackType.Success, // no need to specify when using 'success' instead of 'show'
      onTap: () => {
        console.log('showSuccess tapped');
      }
    });
  }

  gifLoaded(args) {
    console.log('gif loaded');
    console.log(args.object);
    const x = args.object as Gif;
    console.log(x.src);
    x.start();
  }

  onGifTap(args) {
    const x = args.object as Gif;
    if (x.isPlaying()) {
      x.stop();
    } else {
      x.start();
    }
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

  onCarouselLoad() {
    setTimeout(() => {
      this.carousel.nativeElement.selectedPage = this.selectedPage;
      this.carousel.nativeElement.refresh();
      console.log('Carousel loaded to ' + this.selectedPage);
    }, 100);
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

  onNavButtonTap(): void {
    this.routerExtensions.navigate(['/home'], {
      // clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }
}
