import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { Clipboard } from '@ionic-native/clipboard/ngx';

import { MyApp } from './app.component';
import { ComponentsModule } from './components/components.module';

import { TranslateLoader, TranslateModule,TranslateService} from '@ngx-translate/core';
import { Observable } from 'rxjs';
import {zh} from './../assets/i18n/zh';
import {en} from './../assets/i18n/en';
import {fr} from './../assets/i18n/fr';

/*
import { AboutPage } from './pages/about/about';
import { ContactPage } from './pages/contact/contact';
import { HomePage } from './pages/home/home';
import { TabsPage } from './pages/tabs/tabs';
*/

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { CarrierService } from './services/CarrierService';
import { NativeService } from './services/NativeService';
import { FeedService } from './services/FeedService';
import { StorageService } from './services/StorageService';
import { JsonRPCService } from './services/JsonRPCService';
// import { TransportService } from './services/TransportService';
import { AppService } from './services/AppService';
import { ThemeService } from './services/theme.service';

import { PopupProvider } from './services/popup';
import { CameraService } from './services/CameraService';
import { AgentService } from './services/AgentService';
import { PopovercomponentPageModule } from './components/popovercomponent/popovercomponent.module';  
import { ServerlistComponentModule } from './components/serverlistcomponent/serverlistcomponent.module';  
import { QRCodeModule } from 'angularx-qrcode';
import { CommentComponentModule } from './components/comment/comment.module';  
import { PostfromComponentPageModule } from './components/postfrom/postfrom.component.module'
import { SplashscreenPageModule } from './pages/splashscreen/splashscreen.module';
import { JWTMessageService } from './services/JWTMessageService';
import { TransportService } from './services/TransportService';
import { SerializeDataService } from './services/SerializeDataService';
import { MenuService } from './services/MenuService';

export class WebpackTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string): Observable<any> {
    return Observable.create(observer => {
      observer.next(lang);
      switch (lang) {
        case 'zh':
          observer.next(zh);
          break;
        case 'fr':
          observer.next(fr);
          break;
        case 'en':
          observer.next(en);
          break;
        default:
          observer.next(en); 
      }
      observer.complete();
    });
  }
}

export function TranslateLoaderFactory() {
  return new WebpackTranslateLoader();
}


@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    QRCodeModule,
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    ComponentsModule,
    PopovercomponentPageModule,
    CommentComponentModule,
    PostfromComponentPageModule,
    ServerlistComponentModule,
    SplashscreenPageModule,
    IonicModule.forRoot({
      rippleEffect: false,
      mode: 'ios'
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory:(TranslateLoaderFactory)
      }
    }),
  ],
  bootstrap: [MyApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Platform,
    Clipboard,
    CarrierService,
    NativeService,
    FeedService,
    TranslateService,
    ThemeService,
    JsonRPCService,
    // TransportService,
    InAppBrowser,
    StorageService,
    PopupProvider,
    AppService,
    CameraService,
    AgentService,
    JWTMessageService,
    TransportService,
    SerializeDataService,
    MenuService,
    PostfromComponentPageModule,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {provide: ErrorHandler, useClass: ErrorHandler}
  ]
})
export class AppModule {}
