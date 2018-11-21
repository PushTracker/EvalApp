import { Component } from '@angular/core';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { TranslateService } from '@ngx-translate/core';
import { Page } from 'tns-core-modules/ui/page';

@Component({
  selector: 'FAQ',
  moduleId: module.id,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FAQComponent {
  faqs = this.translateService.instant('faqs');

  constructor(private _page: Page, private translateService: TranslateService) {
    this._page.className = 'blue-gradient-down';
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }
}
