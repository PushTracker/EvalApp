import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { FAQComponent } from './faq.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [{ path: '', component: FAQComponent }];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes),
    SharedModule,
    TranslateModule
  ],
  declarations: [FAQComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class FAQModule {}
