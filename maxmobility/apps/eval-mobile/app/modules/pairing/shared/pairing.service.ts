import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Pairing } from './pairing.model';

@Injectable()
export class PairingService {

	constructor(private http: Http) { }

	getList(): Observable<Pairing[]> {
		return this.http.get('/api/list').map(res => res.json() as Pairing[]);
	}
}