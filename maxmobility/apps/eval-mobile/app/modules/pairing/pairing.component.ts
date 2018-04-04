import { Component, OnInit } from '@angular/core';

import { Pairing } from './shared/pairing.model';
import { PairingService } from './shared/pairing.service';

@Component({
  selector: 'Pairing',
  moduleId: module.id,
  templateUrl: './pairing.component.html',
  styleUrls: ['./pairing.component.css'],
  providers: [PairingService]
})
export class PairingComponent implements OnInit {
  pairing: Pairing[] = [];

  constructor(private pairingService: PairingService) {}

  ngOnInit() {
    this.pairingService.getList().subscribe(res => {
      this.pairing = res;
    });
  }
}
