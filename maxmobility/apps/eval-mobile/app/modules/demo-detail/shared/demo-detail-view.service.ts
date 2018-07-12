import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DemoDetailView } from './demo-detail-view.model';

@Injectable()
export class DemoDetailViewService {
  constructor(private http: Http) {}

  getList(): Observable<DemoDetailView[]> {
    // return this.http.get('/api/list').map(res => res.json() as DemoDetailView[]);
    return this.http.get('/api/list').pipe(map(res => res.json() as DemoDetailView[]));
  }
}
