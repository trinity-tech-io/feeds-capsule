import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';


@Injectable()
export class PopupProvider {
    constructor(
            private alertCtrl: AlertController,
            private translate: TranslateService
    ) {}

    public ionicAlert(title: string, subTitle?: string, okText?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.alertCtrl.create({
                header : this.translate.instant(title),
                subHeader : this.translate.instant(subTitle),
                backdropDismiss: false,
                cssClass: 'my-custom-alert',
                buttons: [{
                    text: okText ? okText : this.translate.instant('confirm'),
                    handler: () => {
                        resolve();
                    }
                }]
            }).then(alert => alert.present());
        });
    };


    public ionicConfirm(title: string, message: string, okText?: string, cancelText?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.alertCtrl.create({
                header: this.translate.instant(title),
                message  : this.translate.instant(message),
                cssClass: 'my-custom-alert',
                buttons: [{
                    text: cancelText ? cancelText : this.translate.instant('common.cancel'),
                    handler: () => {
                        reject(false);
                    }
                },
                {
                    text: okText ? okText : this.translate.instant('common.confirm'),
                    handler: () => {
                        resolve(true);
                    }
                }]
            }).then(confirm => confirm.present());
        });
    };

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


