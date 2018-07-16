import { Component } from '@angular/core';
import { ModalDialogParams } from 'nativescript-angular/directives/dialogs';
import { alert, confirm } from 'tns-core-modules/ui/dialogs';
import { WebView, LoadEventData } from 'ui/web-view';
import { TranslateService } from '@ngx-translate/core';
// app
import { User } from '@maxmobility/core';
import * as utilityModule from 'utils/utils';

@Component({
  selector: 'privacy-policy',
  templateUrl: './privacy-policy.html',
  styleUrls: ['./privacy-policy.css']
})
export class PrivacyPolicyComponent {
  user = new User();

  constructor(private _translateService: TranslateService, private params: ModalDialogParams) {
    this.user = this.params.context.user;
  }

  openWebsite(url) {
    url = this._translateService.instant(url);
    utilityModule.openUrl(url);
  }

  close() {
    this.params.closeCallback(this.user);
  }

  cancel() {
    this.params.closeCallback();
  }
}
