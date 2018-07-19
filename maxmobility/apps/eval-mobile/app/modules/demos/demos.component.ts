import { Component } from '@angular/core';
import { Demo } from '@maxmobility/core';
import { DemoService, FirmwareService } from '@maxmobility/mobile';
import { RouterExtensions } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

@Component({
  selector: 'Demos',
  moduleId: module.id,
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent {
  get Demos(): ObservableArray<Demo> {
    return DemoService.Demos;
  }

  constructor(
    private barcodeScanner: BarcodeScanner,
    private routerExtensions: RouterExtensions,
    private _demoService: DemoService,
    private _firmwareService: FirmwareService
  ) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  onDemoTap(args) {
    const index = args.index;
    this.routerExtensions.navigate(['/demo-detail'], {
      queryParams: {
        index
      }
    });
  }

  onNavBtnTap(): void {
    this.routerExtensions.navigate(['/home'], {
      // clearHistory: true,
      transition: {
        name: 'slideRight'
      }
    });
  }

  addDemo() {
    // add a new demo
    console.log('add a new demo');
    this.routerExtensions.navigate(['/demo-detail'], {});
  }
}
