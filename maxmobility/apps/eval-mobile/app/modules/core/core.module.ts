import { NgModule } from '@angular/core';

// libs
import { MaxMobilityCoreModule } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';

@NgModule({
  imports: [MaxMobilityCoreModule, MobileCoreModule]
})
export class CoreModule {}
