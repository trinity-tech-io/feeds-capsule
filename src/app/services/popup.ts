import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController} from '@ionic/angular';
import {ConfirmdialogComponent} from '../components/confirmdialog/confirmdialog.component';
import {AlertdialogComponent} from '../components/alertdialog/alertdialog.component';
import { PopoverController} from '@ionic/angular';

@Injectable()

export class PopupProvider {

    public popover: any = null;

    constructor(
        private alertCtrl: AlertController,
        private translate: TranslateService,
        private popoverController:PopoverController
    ) {}


    public ionicAlert1(title: string, subTitle?: string, okText?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.alertCtrl.create({
                header : this.translate.instant(title),
                subHeader: subTitle ? this.translate.instant(subTitle) : '',
                backdropDismiss: false,
                buttons: [{
                    text: okText ? okText : this.translate.instant('confirm'),
                    handler: () => {
                        resolve(null);
                    }
                }]
            }).then(alert => alert.present());
        });
    };

    public ionicAlert(
        that: any,
        title: string,
        message: string,
        okFunction: any, 
        imgageName: string,
        okText?: string) {
        let ok = okText || "common.confirm";
        return this.showalertdialog(that,title,message,okFunction,imgageName,ok);
    };

    public async showalertdialog(that:any,title: string,message: string,okFunction:any,imgageName:string,okText?: string){
        this.popover = await this.popoverController.create({
            mode: 'ios',
            cssClass: 'ConfirmdialogComponent',
            component:AlertdialogComponent,
            backdropDismiss: false,
            componentProps: {
                "that":that, 
                "title":title,
                "message":message,
                "okText":okText,
                "okFunction":okFunction,
                "imgageName":imgageName
            },
          });
      
          this.popover.onWillDismiss().then(()=>{
               if(this.popover!=null){
                 this.popover = null;
               }
                
          })
         await this.popover.present();

         return this.popover;
    }

    hideAlertPopover(){
        if(this.popover!=null){
            this.popover.dismiss();
        }
    }

    //tskth.svg
    ionicConfirm(
        that: any,
        title: string,
        message: string,
        cancelFunction: any, 
        okFunction: any, 
        imgageName: string,
        okText?: string, 
        cancelText?: string
    ){
        let ok = okText || "common.confirm";
        let cancel = cancelText || "common.cancel";
        return this.showConfirmdialog(that,title,message,cancelFunction,okFunction,imgageName,ok,cancel);
    };

    public async showConfirmdialog(that:any,title: string,message: string,cancelFunction:any,okFunction:any,imgageName:string,okText?: string, cancelText?: string){
        this.popover = await this.popoverController.create({
            mode: 'ios',
            cssClass: 'ConfirmdialogComponent',
            component:ConfirmdialogComponent,
            componentProps: {
                "that":that, 
                "title":title,
                "message":message,
                "okText":okText,
                "cancelText":cancelText,
                "okFunction":okFunction,
                "cancelFunction":cancelFunction,
                "imgageName":imgageName
            },
          });
      
          this.popover.onWillDismiss().then(()=>{
               if(this.popover!=null){
                 this.popover = null;
               }
                
          })
         await this.popover.present();

         return this.popover;
    }

    public ionicPrompt(title: string, message: string, opts?: any, okText?: string, cancelText?: string): Promise<any> {
        return new Promise((resolve, reject) => {
        let defaultText = opts && opts.defaultText ? opts.defaultText : null;
        let placeholder = opts && opts.placeholder ? opts.placeholder : null;
        let inputType = opts && opts.type ? opts.type : 'text';
        let cssClass = opts.useDanger ? "alertDanger" : null;
        let backdropDismiss = !!opts.backdropDismiss;

        this.alertCtrl.create({
            header:title,
            message,
            cssClass,
            backdropDismiss,
            inputs: [{
                value: defaultText,
                placeholder,
                type: inputType
            }],
            buttons: [{
                text: cancelText ? cancelText : this.translate.instant('Cancel'),
                handler: data => {
                    resolve(null);
                }
            },
            {
                text: okText ? okText : this.translate.instant('Ok'),
                handler: data => {
                    resolve(data[0]);
                }
            }]
            }).then(prompt => prompt.present());
        });
    }
}


