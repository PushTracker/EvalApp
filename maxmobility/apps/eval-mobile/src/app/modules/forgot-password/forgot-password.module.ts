import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
// import { SharedModule } from '../../shared/shared.module';
import { ForgotPasswordComponent } from './forgot-password.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [{ path: '', component: ForgotPasswordComponent }];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes),
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    TranslateModule
  ],
  declarations: [ForgotPasswordComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ForgotPasswordModule {}
