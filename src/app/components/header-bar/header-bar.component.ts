import { Component, OnInit, Input } from '@angular/core';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
    selector: 'header-bar',
    templateUrl: './header-bar.component.html',
    styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent implements OnInit {
    @Input('title') title: string = "";
    @Input('showMinimize') showMinimize: boolean = true;
    @Input('showClose') showClose: boolean = true;

    constructor() { }

    ngOnInit() { }

    minimize() {
        appManager.launcher();
    }

    close() {
        appManager.close();
    }
}
