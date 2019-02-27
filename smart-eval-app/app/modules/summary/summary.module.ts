import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { SummaryComponent } from './summary.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [{ path: '', component: SummaryComponent }];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes),
    SharedModule,
    TranslateModule
  ],
  declarations: [SummaryComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SummaryModule {}
