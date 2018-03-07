// angular
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// libs
import { baseRoutes } from '@maxmobility/features';

// app
import { SharedModule } from './modules/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forRoot(baseRoutes('./modules/home/home.loader.module#HomeModuleLoader'))
  ]
})
export class AppRoutingModule {}
