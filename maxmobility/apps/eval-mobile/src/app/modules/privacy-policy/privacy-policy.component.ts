import { Component } from '@angular/core';
import { ModalDialogParams } from 'nativescript-angular/directives/dialogs';
import { TranslateService } from '@ngx-translate/core';
import { User } from '@maxmobility/core';
import { openUrl } from 'tns-core-modules/utils/utils';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'privacy-policy',
  templateUrl: './privacy-policy.html',
  styleUrls: ['./privacy-policy.css']
})
export class PrivacyPolicyComponent {
  user = new User();

  constructor(
    private _page: Page,
    private _translateService: TranslateService,
    private params: ModalDialogParams
  ) {
    this._page.className = 'blue-gradient-down';
    this.user = this.params.context.user;
  }

  openWebsite(url) {
    url = this._translateService.instant(url);
    openUrl(url);
  }

  close() {
    this.params.closeCallback(this.user);
  }

  cancel() {
    this.params.closeCallback();
  }
}
