import { Component, OnInit, ViewChild } from '@angular/core';
import { DrawerTransitionBase, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { RadSideDrawerComponent } from 'nativescript-ui-sidedrawer/angular';

const Demos = [

    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 00001', 
      PTSerialNumber: 'PT: 00001', 
      Firmware: 'SD Firmware: 0.0.01',
      LastUsed: new Date(1988, 10, 23), 
      Location: 'Mountain View, CA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11001', 
      PTSerialNumber: 'PT: 11001', 
      Firmware: 'SD Firmware: 1.4',
      LastUsed: new Date(), 
      Location: 'Nashville, TN' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11002', 
      PTSerialNumber: 'PT: 110002', 
      Firmware: 'SD Firmware: 1.1',
      LastUsed: new Date(), 
      Location: 'Breckenridge, CO' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11003', 
      PTSerialNumber: 'PT: 11003', 
      Firmware: 'SD Firmware: 1.1',
      LastUsed: new Date(), 
      Location: 'Seattle, WA'
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11004', 
      PTSerialNumber: 'PT: 11004', 
      Firmware: 'SD Firmware: 1.2',
      LastUsed: new Date(), 
      Location: 'San Francisco, CA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11005', 
      PTSerialNumber: 'PT: 11005', 
      Firmware: 'SD Firmware: 1.4',
      LastUsed: new Date(), 
      Location: 'Los Angeles, CA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11006',
      PTSerialNumber: 'PT: 11006',  
      Firmware: 'SD Firmware: 1.2',
      LastUsed: new Date(), 
      Location: 'New Orleans, LA' 
    },
    { Image: "~/assets/images/sd-demo.jpg", 
      SerialNumber: 'SD: 11007', 
      PTSerialNumber: 'PT: 11007', 
      Firmware: 'SD Firmware: 1.1',
      LastUsed: new Date(), 
      Location: 'New York, NY' 
    }
  ];


export { Demos };


@Component({
  selector: 'Demos',
  moduleId: module.id,
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {
  @ViewChild('drawer') drawerComponent: RadSideDrawerComponent;

  public demos = Demos;

  private _sideDrawerTransition: DrawerTransitionBase;

  onDemoTap(args) {
    console.log('onDemoTap');
  }

  ngOnInit() {
    this._sideDrawerTransition = new SlideInOnTopTransition();
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  onDrawerButtonTap(): void {
    this.drawerComponent.sideDrawer.showDrawer();
  }
}
