import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
// nativescript
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
// app
import { SignUpComponent } from './sign-up.component';
import { CORE_PROVIDERS } from '@maxmobility/core';

const routes: Routes = [{ path: '', component: SignUpComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), NativeScriptFormsModule],
  declarations: [SignUpComponent],
  providers: [...CORE_PROVIDERS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SignUpModule {}
