
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

declare let appManager: AppManagerPlugin.AppManager;

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor(private router: Router,) {
    }

    scanAddress() {
        appManager.sendIntent("scanqrcode", {}, {}, (res) => {
            console.log("Got scan result:", res.result.scannedContent);
            
            this.router.navigate(['/menu/servers/add-server',res.result.scannedContent]);
            // this.native.go("/addfriend", {"address": res.result.scannedContent});
        }, (err: any) => {
            console.error(err);
        });
    }
}
