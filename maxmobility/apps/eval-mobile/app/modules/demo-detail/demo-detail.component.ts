import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';

import { DemoDetailView } from './shared/demo-detail-view.model';
import { DemoDetailViewService } from './shared/demo-detail-view.service';

import { View } from 'ui/core/view';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import * as dialogs from 'ui/dialogs';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { TranslateService } from '@ngx-translate/core';
import { PageRoute } from 'nativescript-angular/router';
import { switchMap } from 'rxjs/operators';

import { CLog, LoggingService, Demo, Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { DemoService, BluetoothService, FirmwareService, ProgressService } from '@maxmobility/mobile';

@Component({
  selector: 'Demo',
  moduleId: module.id,
  templateUrl: './demo-detail.component.html',
  styleUrls: ['./demo-detail.component.css']
})
export class DemoDetailComponent implements OnInit {
  public demo: Demo = new Demo();

  private index: number = -1; // index into DemoService.Demos
  private snackbar = new SnackBar();

  constructor(
    private pageRoute: PageRoute,
    private zone: NgZone,
    private barcodeScanner: BarcodeScanner,
    private _progressService: ProgressService,
    private _demoService: DemoService,
    private _bluetoothService: BluetoothService
  ) {
    this.pageRoute.activatedRoute.pipe(switchMap(activatedRoute => activatedRoute.queryParams)).forEach(params => {
      if (params.index !== undefined && params.index > -1) {
        this.index = params.index;
        this.demo = DemoService.Demos.getItem(this.index);
      } else {
        this.demo = new Demo();
      }
    });
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  ngOnInit() {}

  haveSerial(): boolean {
    let sdSN = this.demo.smartdrive_serial_number.trim();
    //let ptSN = this.demo.pushtracker_serial_number.trim();
    return sdSN && sdSN.length && true;
  }

  onSave() {
    if (!this.haveSerial()) {
      dialogs.alert('You must enter a SmartDrive serial number!');
    } else {
      this._progressService.show('Saving');
      return this.demo
        .use()
        .then(() => {
          return this._demoService.create(this.demo);
        })
        .then(() => {
          // the demo service calls load() at the end ofa create
          // now re-load our data from the service
          if (this.index > -1) {
          } else {
            this.index = DemoService.Demos.indexOf(
              this._demoService.getDemoBySmartDriveSerialNumber(this.demo.smartdrive_serial_number)
            );
          }
          this.demo = DemoService.Demos.getItem(this.index);
          this._progressService.hide();
        })
        .catch(err => {
          this._progressService.hide();
          console.log(`Couldn't create / load demos: ${err}`);
        });
    }
  }

  onScan(deviceName) {
    this.barcodeScanner
      .scan({
        formats: 'QR_CODE, EAN_13',
        cancelLabel: 'Cancel Scan', // iOS only
        cancelLabelBackgroundColor: '#333333', // iOS only
        message: 'Scan a ' + (deviceName || 'SmartDrive or PushTracker'), // Android only
        showFlipCameraButton: true,
        preferFrontCamera: false,
        showTorchButton: true,
        beepOnScan: true,
        torchOn: false,
        closeCallback: () => {
          console.log('Scanner closed');
        }, // invoked when the scanner was closed (success or abort)
        resultDisplayDuration: 500, // Android only
        openSettingsIfPermissionWasPreviouslyDenied: true
      })
      .then(result => {
        const validDevices = deviceName == 'pushtracker' ? ['pushtracker', 'wristband'] : ['smartdrive'];
        this.handleSerial(result.text, validDevices);
      })
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
      });
  }

  handleSerial(text: string, forDevices?: Array<string>) {
    text = text.trim().toUpperCase();
    let deviceType = null;
    const isPushTracker = text[0] == 'B';
    const isWristband = text[0] == 'A';
    let isSmartDrive = false;
    let serialNumber = text;
    try {
      isSmartDrive = !isPushTracker && !isWristband && parseInt(text) !== NaN && true;
      if (isSmartDrive) {
        serialNumber = `${parseInt(text)}`;
      }
    } catch (err) {
      // do nothing
    }
    if (isPushTracker) deviceType = 'pushtracker';
    else if (isWristband) deviceType = 'wristband';
    else if (isSmartDrive) deviceType = 'smartdrive';
    // check the type
    if (forDevices && forDevices.length && forDevices.indexOf(deviceType) == -1) {
      throw 'Wrong device scanned!';
    }
    // set the model
    if (isPushTracker) this.demo.model = 'MX2+';
    else if (isWristband) this.demo.model = 'MX2';
    // now set the serial number
    if (deviceType === 'pushtracker' || deviceType == 'wristband') {
      this.demo.pushtracker_serial_number = serialNumber;
    } else if (deviceType === 'smartdrive') {
      this.demo.smartdrive_serial_number = serialNumber;
    }
  }

  onEditSD() {
    dialogs
      .prompt({
        title: 'Enter Serial Number',
        message: 'Please enter SmartDrive Serial Number',
        okButtonText: 'Save',
        cancelButtonText: 'Cancel'
      })
      .then(r => {
        try {
          this.handleSerial(r.text, ['smartdrive']);
        } catch (err) {
          dialogs.alert(`${r.text} is not a valid SmartDrive serial number!`);
        }
      });
  }

  onEditPT() {
    dialogs
      .prompt({
        title: 'Enter Serial Number',
        message: 'Please enter PushTracker or Wristband Serial Number',
        okButtonText: 'Save',
        cancelButtonText: 'Cancel'
      })
      .then(r => {
        try {
          this.handleSerial(r.text, ['pushtracker', 'wristband']);
        } catch (err) {
          dialogs.alert(`${r.text} is not a valid PushTracker or Wristband serial number!`);
        }
      });
  }

  onVersionTap() {
    this.zone.run(() => {
      const connectedPTs = BluetoothService.PushTrackers.filter(pt => pt.connected);
      if (connectedPTs.length > 1) {
        const pts = connectedPTs.map(pt => pt.address);
        dialogs
          .action({
            message:
              'Select PushTracker' + this.demo.pushtracker_serial_number.length
                ? ` ${this.demo.pushtracker_serial_number}`
                : '',
            cancelButtonText: 'Cancel',
            actions: pts
          })
          .then(r => {
            if (r.indexOf('Cancel') > -1) return;
            const pt = connectedPTs.filter(pt => pt.address == r)[0];
            this.demo.pt_version = PushTracker.versionByteToString(pt.version);
            this.demo.mcu_version = PushTracker.versionByteToString(pt.mcu_version);
            this.demo.ble_version = PushTracker.versionByteToString(pt.ble_version);
            this.demo.pt_mac_addr = pt.address;
          });
      } else if (connectedPTs.length == 1) {
        const pt = connectedPTs[0];
        this.demo.pt_version = PushTracker.versionByteToString(pt.version);
        this.demo.mcu_version = PushTracker.versionByteToString(pt.mcu_version);
        this.demo.ble_version = PushTracker.versionByteToString(pt.ble_version);
        this.demo.pt_mac_addr = pt.address;
      } else {
        this.snackbar.simple('Please connect a PushTracker');
      }
    });
  }

  onSdTap() {
    // take an image of SD
    console.log('sd image tapped');
  }

  onPtTap() {
    // take an image of PT
    console.log('pt image tapped');
  }

  onSDRowTapped() {
    dialogs
      .confirm({
        title: 'Transfer ' + this.demo.smartdrive_serial_number,
        message: 'Would you like to transfer to ' + this.demo.location,
        okButtonText: 'Transfer',
        cancelButtonText: 'Cancel'
      })
      .then(result => {
        // result argument is boolean
        console.log('Dialog result: ' + result);
      });
  }
}
