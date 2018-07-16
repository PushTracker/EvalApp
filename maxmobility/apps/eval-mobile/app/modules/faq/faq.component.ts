import { Component } from '@angular/core';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'FAQ',
  moduleId: module.id,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FAQComponent {
  faqs = this.translateService.instant('faqs');

  constructor(private translateService: TranslateService) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }
}
