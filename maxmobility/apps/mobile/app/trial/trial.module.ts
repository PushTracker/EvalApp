import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';

import { SharedModule } from '../shared/shared.module';
import { TrialRoutingModule } from './trial-routing.module';
import { TrialComponent } from './trial.component';

@NgModule({
  imports: [NativeScriptCommonModule, TrialRoutingModule, SharedModule],
  declarations: [TrialComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class TrialModule {}
