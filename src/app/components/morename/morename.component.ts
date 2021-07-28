import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController, NavParams } from '@ionic/angular';
@Component({
  selector: 'app-morename',
  templateUrl: './morename.component.html',
  styleUrls: ['./morename.component.scss'],
})
export class MorenameComponent implements OnInit {
  public name: string = '';
  constructor(
    public theme: ThemeService,
    private navParams: NavParams,
    private popoverController: PopoverController,
  ) {}

  ngOnInit() {
    this.name = this.navParams.get('name') || '';
  }

  cancel() {
    this.popoverController.dismiss();
  }
}
