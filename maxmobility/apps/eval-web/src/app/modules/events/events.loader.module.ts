// from workaround:
// https://github.com/angular/angular-cli/issues/6373#issuecomment-319116889

import { NgModule } from '@angular/core';
import { EventsModule } from '@maxmobility/web';

@NgModule({
  imports: [EventsModule]
})
export class EventsModuleLoader {}
