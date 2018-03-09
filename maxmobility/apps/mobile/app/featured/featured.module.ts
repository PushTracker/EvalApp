// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
// nativescript
import { NativeScriptCommonModule } from 'nativescript-angular/common';
// app
import { SharedModule } from '../shared/shared.module';
import { FeaturedRoutingModule } from './featured-routing.module';
import { FeaturedComponent } from './featured.component';

@NgModule({
  imports: [NativeScriptCommonModule, FeaturedRoutingModule, SharedModule, HttpClientModule],
  declarations: [FeaturedComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class FeaturedModule {}
