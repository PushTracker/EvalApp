import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { PairingComponent } from './pairing.component';

const routes: Routes = [{ path: '', component: PairingComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule],
  declarations: [PairingComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class PairingModule {}
