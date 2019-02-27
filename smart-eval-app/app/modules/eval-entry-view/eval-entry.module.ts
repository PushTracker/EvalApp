import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { EvalEntryComponent } from './eval-entry.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [{ path: '', component: EvalEntryComponent }];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes),
    SharedModule,
    TranslateModule
  ],
  declarations: [EvalEntryComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class EvalEntryModule {}
