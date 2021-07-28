import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-addasset',
  templateUrl: './addasset.component.html',
  styleUrls: ['./addasset.component.scss'],
})
export class AddassetComponent implements OnInit {
  @Output() addAsset = new EventEmitter();
  constructor() {}

  ngOnInit() {}

  add() {
    this.addAsset.emit();
  }
}
