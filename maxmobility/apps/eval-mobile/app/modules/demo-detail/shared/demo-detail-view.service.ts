import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { DemoDetailView } from './demo-detail-view.model';

@Injectable()
export class DemoDetailViewService {
  constructor(private http: Http) {}

  getList(): Observable<DemoDetailView[]> {
    return this.http.get('/api/list').map(res => res.json() as DemoDetailView[]);
  }
}
