import { NgModule } from '@angular/core';

// libs
import { MaxMobilityCoreModule } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';

import { MyDrawerComponent } from './my-drawer/my-drawer.component';
import { MyDrawerItemComponent } from './my-drawer-item/my-drawer-item.component';

export const CORE_DECLARATIONS = [MyDrawerComponent, MyDrawerItemComponent];

@NgModule({
  imports: [MaxMobilityCoreModule, MobileCoreModule],
  declarations: []
})
export class CoreModule {}
