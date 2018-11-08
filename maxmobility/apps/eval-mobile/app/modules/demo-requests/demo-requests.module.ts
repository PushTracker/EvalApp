import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { DemoRequestsComponent } from './demo-requests.component';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [{ path: '', component: DemoRequestsComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule, TranslateModule],
  declarations: [DemoRequestsComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class DemoRequestsModule {}
