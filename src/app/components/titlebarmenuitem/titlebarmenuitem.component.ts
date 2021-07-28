import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';
import { TitleBarMenuItem } from '../titlebar/titlebar.types';

@Component({
  selector: 'app-titlebarmenuitem',
  templateUrl: './titlebarmenuitem.component.html',
  styleUrls: ['./titlebarmenuitem.component.scss'],
})
export class TitlebarmenuitemComponent implements OnInit {
  public menuItems: TitleBarMenuItem[] = [];

  constructor(
    private navParams: NavParams,
    private popoverCtrl: PopoverController,
  ) {}

  ngOnInit() {
    this.menuItems = this.navParams.get('items');
  }

  onTitlebarMenuItemClicked(item: TitleBarMenuItem) {
    this.popoverCtrl.dismiss({
      item: item,
    });
  }

  getIconPath(icon) {
    return icon;
  }
}
