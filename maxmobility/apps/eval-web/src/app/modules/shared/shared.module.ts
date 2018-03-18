import { NgModule } from '@angular/core';

// libs
import { UiModule } from '@maxmobility/web';

const MODULES = [
  UiModule
];

@NgModule({
  imports: [...MODULES],
  exports: [...MODULES]
})
export class SharedModule {}
