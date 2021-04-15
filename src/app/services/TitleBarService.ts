import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarIconSlot, TitleBarIcon, TitleBarForegroundMode } from 'src/app/components/titlebar/titlebar.types';
import { NativeService } from 'src/app/services/NativeService';

let TAG: string = "TitleBarService";

@Injectable()
export class TitleBarService {
    constructor(private logUtils: LogUtils,
        private native: NativeService) {
    }

    setTitleBarBackKeyShown(titleBar: TitleBarComponent, show: boolean) {
        if (show) {
            this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_LEFT, "back", "assets/icons/back.svg");
            this.registerBackKey(titleBar);
            return;
        }
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_LEFT, null , null);
    }

    setTitle(titleBar: TitleBarComponent, title: string){
        titleBar.setTitle(title);
    }

    setIcon(titleBar: TitleBarComponent, iconSlot: FeedsData.TitleBarIconSlot, key: string, iconPath: string){
        let titleBarIconSlot: TitleBarIconSlot = iconSlot.valueOf();
        let titleBarIcon: TitleBarIcon = null;
        if (key != null && iconPath != null){
            titleBarIcon = {
                key: key,
                iconPath: iconPath
            }
        }
        titleBar.setIcon(titleBarIconSlot,titleBarIcon);
    }

    registerBackKey(titleBar: TitleBarComponent) {
        titleBar.addOnItemClickedListener((icon)=>{
            if (icon.key == "back")
                this.native.getNavCtrl().back();
        });
    }
    
    setBackgroundColor(titleBar: TitleBarComponent, hexColor: string){
        titleBar.setBackgroundColor(hexColor);
    }

    setForegroundMode(titleBar: TitleBarComponent, mode: FeedsData.TitleBarForegroundMode){
        let foregroundMode: TitleBarForegroundMode = mode.valueOf();
        titleBar.setForegroundMode(foregroundMode);
    }
    
}