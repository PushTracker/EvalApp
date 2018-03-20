import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { FAQComponent } from './faq.component';

const routes: Routes = [{ path: '', component: FAQComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [FAQComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class FAQModule {}
