import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { VideosComponent } from './videos.component';

const routes: Routes = [{ path: '', component: VideosComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule],
  declarations: [VideosComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class VideosModule {}
