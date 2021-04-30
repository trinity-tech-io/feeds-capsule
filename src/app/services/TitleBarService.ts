import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarIconSlot, TitleBarIcon, TitleBarForegroundMode } from 'src/app/components/titlebar/titlebar.types';
import { NativeService } from 'src/app/services/NativeService';
import { MenuController,PopoverController } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';

let TAG: string = "TitleBarService";

@Injectable()
export class TitleBarService {
    constructor(private logUtils: LogUtils,
        private native: NativeService,
        private popoverController: PopoverController,
        // private menuService: MenuService,
        private menu: MenuController,
        private event: Events,) {
    }
    setTitleBarMoreMemu(titleBar: TitleBarComponent){
        this.setIcon(titleBar,FeedsData.TitleBarIconSlot.OUTER_RIGHT, "more", "assets/icon/more_menu.ico");
        this.registerMoreMenu(titleBar);
    }

    setTitleBarBackKeyShown(titleBar: TitleBarComponent, show: boolean) {
        if (show) {
            this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_LEFT, "back", "assets/icon/back.svg");
            this.registerBackKey(titleBar);
            return;
        }
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_LEFT, null , null);
    }

    setTitleBarEditChannel(titleBar: TitleBarComponent){
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editChannel", "assets/icon/edit.svg");
        this.registEditChannel(titleBar);
    }

    setTitleBarEditServer(titleBar: TitleBarComponent){
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editServer", "assets/icon/edit.svg");
        this.registEditServer(titleBar);
    }

    setTitleBarEditImage(titleBar: TitleBarComponent){
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editImages", "assets/icon/yes.ico");
        this.regitstEditImages(titleBar);
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
                this.native.getNavCtrl().pop();
        });
    }

    registerMoreMenu(titleBar: TitleBarComponent) {
        titleBar.addOnItemClickedListener((icon)=>{
            if (icon.key == "more")
                // this.event.publish(FeedsEvent.PublishType.openRightMenu);
                // this.menuService.hideActionSheet();
                // let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
                // if(value!=""){
                //   this.popoverController.dismiss();
                // }
                this.menu.open("menu");
        });
    }
    
    setBackgroundColor(titleBar: TitleBarComponent, hexColor: string){
        titleBar.setBackgroundColor(hexColor);
    }

    setForegroundMode(titleBar: TitleBarComponent, mode: FeedsData.TitleBarForegroundMode){
        let foregroundMode: TitleBarForegroundMode = mode.valueOf();
        titleBar.setForegroundMode(foregroundMode);
    }

    addRight(titleBar: TitleBarComponent){
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_RIGHT, "more", "assets/icon/more_menu.ico");
      }
  
    hideRight(titleBar: TitleBarComponent){
        this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_RIGHT, null, null);
    }


    registEditChannel(titleBar: TitleBarComponent){
        titleBar.addOnItemClickedListener((icon)=>{
            if (icon.key == "editChannel")
                this.event.publish(FeedsEvent.PublishType.editChannel)
        });
    }

    registEditServer(titleBar: TitleBarComponent){
        titleBar.addOnItemClickedListener((icon)=>{
            if (icon.key == "editServer")
                this.event.publish(FeedsEvent.PublishType.editServer);
        });

    }
    
    regitstEditImages(titleBar: TitleBarComponent){
        titleBar.addOnItemClickedListener((icon)=>{
            if (icon.key == "editImages")
                this.event.publish(FeedsEvent.PublishType.editImages);
        });
    }
}