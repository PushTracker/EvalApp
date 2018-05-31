// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { OTAComponent } from './ota.component';

import { SlidesModule } from 'nativescript-ngx-slides';

const routes: Routes = [{ path: '', component: OTAComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule, SlidesModule],
  declarations: [OTAComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class OTAModule {}
