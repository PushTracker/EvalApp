import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Pairing } from '@maxmobility/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PairingService {
  constructor(private http: Http) {}

  getList(): Observable<Pairing[]> {
    // return this.http.get('/api/list').map(res => res.json() as Pairing[]);
    return this.http.get('/api/list').pipe(map(res => res.json() as Pairing[]));
  }
}
