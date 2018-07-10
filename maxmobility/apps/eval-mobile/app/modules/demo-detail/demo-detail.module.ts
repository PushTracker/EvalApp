import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { DemoDetailComponent } from './demo-detail.component';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { BarcodeScanner } from 'nativescript-barcodescanner';

const routes: Routes = [{ path: '', component: DemoDetailComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule, TranslateModule],
  declarations: [DemoDetailComponent],
  providers: [BarcodeScanner],
  schemas: [NO_ERRORS_SCHEMA]
})
export class DemoDetailModule {}
