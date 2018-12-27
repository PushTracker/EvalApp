import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthGuardService } from '@maxmobility/mobile';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: '~/app/modules/login/login.module#LoginModule'
  },
  {
    path: 'sign-up',
    loadChildren: '~/app/modules/sign-up/sign-up.module#SignUpModule'
  },
  {
    path: 'forgot-password',
    loadChildren:
      '~/app/modules/forgot-password/forgot-password.module#ForgotPasswordModule'
  },
  {
    path: 'home',
    loadChildren: '~/app/modules/home/home.module#HomeModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'ota',
    loadChildren: '~/app/modules/ota/ota.module#OTAModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'pairing',
    loadChildren: '~/app/modules/pairing/pairing.module#PairingModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'account',
    loadChildren: '~/app/modules/account/account.module#AccountModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'videos',
    loadChildren: '~/app/modules/videos/videos.module#VideosModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'video',
    loadChildren: '~/app/modules/video-page/video.module#VideoModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'search',
    loadChildren: '~/app/modules/search/search.module#SearchModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'training',
    loadChildren: '~/app/modules/training/training.module#TrainingModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'trial',
    loadChildren: '~/app/modules/trial/trial.module#TrialModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'evals',
    loadChildren: '~/app/modules/evals/evals.module#EvalsModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'eval-entry',
    loadChildren:
      '~/app/modules/eval-entry-view/eval-entry.module#EvalEntryModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'summary',
    loadChildren: '~/app/modules/summary/summary.module#SummaryModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'demos',
    loadChildren: '~/app/modules/demos/demos.module#DemosModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'demo-detail',
    loadChildren:
      '~/app/modules/demo-detail/demo-detail.module#DemoDetailModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'faq',
    loadChildren: '~/app/modules/faq/faq.module#FAQModule',
    canActivate: [AuthGuardService]
  },
  {
    path: 'settings',
    loadChildren: '~/app/modules/settings/settings.module#SettingsModule',
    canActivate: [AuthGuardService]
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule]
})
export class AppRoutingModule {}
