import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-confirmdialog',
  templateUrl: './confirmdialog.component.html',
  styleUrls: ['./confirmdialog.component.scss'],
})
export class ConfirmdialogComponent implements OnInit {
  public title: string = '';
  public message: string = '';
  public okText: string = '';
  public cancelText: string = '';
  public cancel: any;
  public confirm: any;
  public that: any;
  public imgPath: string = '';
  constructor(public theme: ThemeService, private navParams: NavParams) {
    this.that = this.navParams.get('that');
    this.title = this.navParams.get('title') || 'common.confirmDialog';
    this.message = this.navParams.get('message');
    this.okText = this.navParams.get('okText');

    this.cancelText = this.navParams.get('cancelText');

    this.cancel = this.navParams.get('cancelFunction');
    this.confirm = this.navParams.get('okFunction');
    this.imgPath =
      this.navParams.get('imgageName') || './assets/images/tskth.svg';
  }

  ngOnInit() {}
}
