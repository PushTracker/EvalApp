import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
// nativescript
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
// app
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { SignUpComponent } from './sign-up.component';

const routes: Routes = [{ path: '', component: SignUpComponent }];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes),
    SharedModule,
    NativeScriptFormsModule,
    TranslateModule
  ],
  declarations: [SignUpComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SignUpModule {}
