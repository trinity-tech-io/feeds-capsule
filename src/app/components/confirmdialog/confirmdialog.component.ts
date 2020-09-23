import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NavParams} from '@ionic/angular';
@Component({
  selector: 'app-confirmdialog',
  templateUrl: './confirmdialog.component.html',
  styleUrls: ['./confirmdialog.component.scss'],
})
export class ConfirmdialogComponent implements OnInit {

  public title:string = "";
  public message:string ="";
  public okText:string="";
  public cancelText:string ="";
  public cancel:any;
  public confirm:any;
  public imgageName:string ="";
  public imgagePath:string = "";
  public darkimgagePath:string = "";
  public that:any;

  constructor(
    public theme: ThemeService,
    private navParams: NavParams
  ) { 
      this.that = this.navParams.get('that');
      this.title = this.navParams.get('title');
      this.message = this.navParams.get('message');
      this.okText = this.navParams.get('okText');

      this.cancelText = this.navParams.get('cancelText');

      this.cancel = this.navParams.get('cancelFunction');
      this.confirm = this.navParams.get('okFunction');
      this.imgageName = this.navParams.get("imgageName");
      this.imgagePath = '/assets/images/'+this.imgageName;
      this.darkimgagePath = '/assets/images/darkmode/'+this.imgageName;
    }

  ngOnInit() {}

}
