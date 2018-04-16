import { Component, OnInit } from '@angular/core';

import { DemoDetailView } from './shared/demo-detail-view.model';
import { DemoDetailViewService } from './shared/demo-detail-view.service';

@Component({
  selector: 'demo-detail-view',
  templateUrl: 'demo-detail-view.component.html',
  providers: [DemoDetailViewService]
})
export class DemoDetailViewComponent implements OnInit {
  demoDetailView: DemoDetailView[] = [];

  constructor(private demoDetailViewService: DemoDetailViewService) {}

  ngOnInit() {
    this.demoDetailViewService.getList().subscribe(res => {
      this.demoDetailView = res;
    });
  }
}
