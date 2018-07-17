import { Component, NgZone } from '@angular/core';
import { Demo, PushTracker } from '@maxmobility/core';
import { BluetoothService, DemoService, FirmwareService, ProgressService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { PageRoute } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import * as camera from 'nativescript-camera';
import { ImageCropper } from 'nativescript-imagecropper';
import { SnackBar } from 'nativescript-snackbar';
import { isAndroid, isIOS } from 'platform';
import { switchMap } from 'rxjs/operators';
import * as imageSource from 'tns-core-modules/image-source';
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
    private translateService: TranslateService
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

  onUpdateSDImageTap() {
    if (camera.isAvailable()) {
      camera
        .requestPermissions()
        .then(() => {
          console.log('Updating SmartSDrive Image!');

          const options = {
            width: 256,
            height: 256,
            lockSquare: true
          };

          camera
            .takePicture({
              width: 500,
              height: 500,
              keepAspectRatio: true,
              cameraFacing: 'rear'
            })
            .then(imageAsset => {
              const source = new imageSource.ImageSource();
              source.fromAsset(imageAsset).then(iSrc => {
                this.imageCropper
                  .show(iSrc, options)
                  .then(args => {
                    if (args.image !== null) {
                      this.demo.sd_image = args.image;
                      if (this.index) {
                        // auto-save if this demo already exists
                        this.demo.saveSDImage();
                      }
                    }
                  })
                  .catch(e => {
                    console.dir(e);
                  });
              });
            })
            .catch(err => {
              console.log('Error -> ' + err.message);
            });
        })
        .catch(err => {
          console.log('Error -> ' + err.message);
        });
    } else {
      console.log('No camera available');
    }
  }

  onUpdatePTImageTap() {
    if (camera.isAvailable()) {
      camera
        .requestPermissions()
        .then(() => {
          console.log('Updating SmartSDrive Image!');

          const options = {
            width: 256,
            height: 256,
            lockSquare: true
          };

          camera
            .takePicture({
              width: 500,
              height: 500,
              keepAspectRatio: true,
              cameraFacing: 'rear'
            })
            .then(imageAsset => {
              const source = new imageSource.ImageSource();
              source.fromAsset(imageAsset).then(iSrc => {
                this.imageCropper
                  .show(iSrc, options)
                  .then(args => {
                    if (args.image !== null) {
                      this.demo.pt_image = args.image;
                      if (this.index) {
                        // auto-save if this demo already exists
                        this.demo.savePTImage();
                      }
                    }
                  })
                  .catch(e => {
                    console.dir(e);
                  });
              });
            })
            .catch(err => {
              console.log('Error -> ' + err.message);
            });
        })
        .catch(err => {
          console.log('Error -> ' + err.message);
        });
    } else {
      console.log('No camera available');
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
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
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
      throw new Error('Wrong device scanned!');
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
