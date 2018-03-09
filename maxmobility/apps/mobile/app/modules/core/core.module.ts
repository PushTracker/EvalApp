import { NgModule } from '@angular/core';

// libs
import { MobileCoreModule } from '@maxmobility/mobile';

import { PROVIDERS } from './services';

@NgModule({
  imports: [MobileCoreModule],
  providers: [...PROVIDERS]
})
export class CoreModule {}
