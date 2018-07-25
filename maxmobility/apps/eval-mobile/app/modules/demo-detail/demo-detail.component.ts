import { Component, NgZone } from '@angular/core';
import { Demo, PushTracker } from '@maxmobility/core';
import { BluetoothService, DemoService, FirmwareService, LoggingService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { PageRoute } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import * as camera from 'nativescript-camera';
import { ImageCropper, Result as ImageCropperResult } from 'nativescript-imagecropper';
import { SnackBar } from 'nativescript-snackbar';
import { isAndroid, isIOS } from 'platform';
import { switchMap } from 'rxjs/operators';
import { ImageAsset } from 'tns-core-modules/image-asset/image-asset';
import { ImageSource } from 'tns-core-modules/image-source/image-source';
import * as dialogs from 'tns-core-modules/ui/dialogs';

@Component({
  selector: 'Demo',
  moduleId: module.id,
  templateUrl: './demo-detail.component.html',
  styleUrls: ['./demo-detail.component.css']
})
export class DemoDetailComponent {
  demo: Demo = new Demo();
  mcu_version_label = ' - SmartDrive MCU ' + this.translateService.instant('general.version');
  ble_version_label = ' - SmartDrive BLE ' + this.translateService.instant('general.version');
  pt_version_label = ' - PushTracker ' + this.translateService.instant('general.version');
  private imageCropper: ImageCropper;
  private snackbar = new SnackBar();
  private index = -1; // index into DemoService.Demos

  constructor(
    private pageRoute: PageRoute,
    private zone: NgZone,
    private barcodeScanner: BarcodeScanner,
    private _progressService: ProgressService,
    private _demoService: DemoService,
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private translateService: TranslateService,
    private _loggingService: LoggingService
  ) {
    this.imageCropper = new ImageCropper();
    this.pageRoute.activatedRoute.pipe(switchMap(activatedRoute => activatedRoute.queryParams)).forEach(params => {
      if (params.index !== undefined && params.index > -1) {
        this.index = params.index;
        this.demo = DemoService.Demos.getItem(this.index);
      } else {
        this.demo = new Demo();
      }
    });
  }

  get sd_serial_label(): string {
    return (
      (this.demo.smartdrive_serial_number.length && this.demo.smartdrive_serial_number) ||
      this.translateService.instant('demo-detail.scan-sd')
    );
  }

  get pt_serial_label(): string {
    return (
      (this.demo.pushtracker_serial_number.length && this.demo.pushtracker_serial_number) ||
      this.translateService.instant('demo-detail.scan-pt')
    );
  }

  get title(): string {
    return `${this.demo.model} ${this.translateService.instant('general.demo')} ${this.demo.smartdrive_serial_number}`;
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  get currentVersion(): string {
    return this._firmwareService.currentVersion;
  }

  async onUpdateSDImageTap() {
    try {
      const result = await this.takePictureAndCrop();
      console.log('result', result);

      if (result && result.image) {
        console.log('ImageCropper returned cropped image.');
        this.demo.sd_image = result.image;
        if (this.index) {
          // auto-save if this demo already exists
          this.demo.saveSDImage();
        }
      } else {
        console.log('No result returned from the image cropper.');
      }
    } catch (error) {
      console.log('ERROR', error);
    }
  }

  async onUpdatePTImageTap() {
    try {
      const result = await this.takePictureAndCrop();
      console.log('result', result);

      if (result && result.image !== null) {
        console.log('ImageCropper return cropped image.');
        this.demo.pt_image = result.image;
        if (this.index) {
          // auto-save if this demo already exists
          this.demo.savePTImage();
        }
      } else {
        console.log('No result returned from the image cropper.');
      }
    } catch (error) {
      console.log('ERROR', error);
    }
  }

  haveSerial(): boolean {
    const sdSN = this.demo.smartdrive_serial_number.trim();
    // let ptSN = this.demo.pushtracker_serial_number.trim();
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
            console.log('index is greater than -1');
          } else {
            this.index = DemoService.Demos.indexOf(
              this._demoService.getDemoBySmartDriveSerialNumber(this.demo.smartdrive_serial_number)
            );
          }
          this.demo = DemoService.Demos.getItem(this.index);
          // now save the images for the SD if they exist
          this.demo.saveImages();
          this._progressService.hide();
        })
        .catch(err => {
          this._progressService.hide();
          this._loggingService.logException(err);
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
        const validDevices = deviceName === 'pushtracker' ? ['pushtracker', 'wristband'] : ['smartdrive'];
        this.handleSerial(result.text, validDevices);
      })
      .catch(err => {
        this._loggingService.logException(err);
        console.log('No scan. ' + err);
      });
  }

  handleSerial(text: string, forDevices?: string[]) {
    text = text.trim().toUpperCase();
    let deviceType = null;
    const isPushTracker = text[0] === 'B';
    const isWristband = text[0] === 'A';
    let isSmartDrive = false;
    let serialNumber = text;
    try {
      isSmartDrive = !isPushTracker && !isWristband && parseInt(text) !== NaN && true;
      if (isSmartDrive) {
        serialNumber = `${parseInt(text, 10)}`;
      }
    } catch (err) {
      // do nothing
    }
    if (isPushTracker) {
      deviceType = 'pushtracker';
    } else if (isWristband) {
      deviceType = 'wristband';
    } else if (isSmartDrive) {
      deviceType = 'smartdrive';
    }

    // check the type
    if (forDevices && forDevices.length && forDevices.indexOf(deviceType) === -1) {
      const error = new Error('Wrong device scanned!');
      this._loggingService.logException(error);
      throw error;
    }
    // set the model
    if (isPushTracker) {
      this.demo.model = 'MX2+';
    } else if (isWristband) {
      this.demo.model = 'MX2';
    }
    // now set the serial number
    if (deviceType === 'pushtracker' || deviceType === 'wristband') {
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
          this._loggingService.logException(err);
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
          this._loggingService.logException(err);
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
            if (r.indexOf('Cancel') > -1) {
              return;
            }

            const pt = connectedPTs.filter(pt => pt.address === r)[0];
            this.demo.pt_version = PushTracker.versionByteToString(pt.version);
            this.demo.mcu_version = PushTracker.versionByteToString(pt.mcu_version);
            this.demo.ble_version = PushTracker.versionByteToString(pt.ble_version);
            this.demo.pt_mac_addr = pt.address;
          });
      } else if (connectedPTs.length === 1) {
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

  private async takePictureAndCrop() {
    try {
      // check if device has camera
      if (!camera.isAvailable()) {
        console.log('No camera available on device.');
        return null;
      }

      // request camera permissions
      console.log('checking permissions');
      await camera.requestPermissions().catch(error => {
        console.log('Permission denied for camera.');
        let msg: string;
        if (isIOS) {
          msg = `Smart Evaluation app does not have permission to open your camera.
          Please go to settings and enable the camera permission.`;
        } else {
          msg = `Smart Evaluation app needs the Camera permission to open the camera.`;
        }

        dialogs.alert({ message: msg, okButtonText: 'Okay' });
        return null;
      });

      const imageAsset = (await camera.takePicture({
        width: 256,
        height: 256,
        keepAspectRatio: true,
        cameraFacing: 'rear'
      })) as ImageAsset;

      const source = new ImageSource();
      console.log(`Creating ImageSource from the imageAsset ${imageAsset}`);
      const iSrc = await source.fromAsset(imageAsset);

      console.log('Showing ImageCropper.');
      const result = (await this.imageCropper.show(iSrc, {
        width: 256,
        height: 256,
        lockSquare: true
      })) as ImageCropperResult;

      return result;
    } catch (error) {
      console.log('error in takePictureAndCrop', error);
      this._loggingService.logException(error);
      return null;
    }
  }
}
