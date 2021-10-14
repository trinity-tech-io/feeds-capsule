import { NgModule, ErrorHandler, Injectable } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { PhotoLibrary } from '@ionic-native/photo-library/ngx';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { File } from '@ionic-native/file/ngx';
import { Animation, AnimationBuilder } from '@ionic/core';

import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Network } from '@ionic-native/network/ngx';

import { MyApp } from './app.component';
import { ComponentsModule } from './components/components.module';

import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { ScanService } from 'src/app/services/scan.service';

import { Observable } from 'rxjs';
import { zh } from './../assets/i18n/zh';
import { en } from './../assets/i18n/en';

import { NgxIonicImageViewerModule } from 'ngx-ionic-image-viewer';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { CarrierService } from './services/CarrierService';
import { NativeService } from './services/NativeService';
import { FeedService } from './services/FeedService';
import { StorageService } from './services/StorageService';
import { JsonRPCService } from './services/JsonRPCService';
import { AppService } from './services/AppService';
import { ThemeService } from './services/theme.service';
import { ConnectionService } from './services/ConnectionService';
import { HttpService } from './services/HttpService';
import { IntentService } from './services/IntentService';

import { PopupProvider } from './services/popup';
import { CameraService } from './services/CameraService';
import { QRCodeModule } from 'angularx-qrcode';
import { JWTMessageService } from './services/JWTMessageService';
import { TransportService } from './services/TransportService';
import { SerializeDataService } from './services/SerializeDataService';
import { MenuService } from './services/MenuService';
import { FormatInfoService } from './services/FormatInfoService';
import { SessionService } from './services/SessionService';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { AddFeedService } from 'src/app/services/AddFeedService';
import { FileService } from 'src/app/services/FileService';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { DataHelper } from 'src/app/services/DataHelper';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { IonicStorageModule } from '@ionic/storage';

import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { RewriteFrames } from '@sentry/integrations';
import { customAnimation } from 'src/app/services/nav_anamition';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { LanguageService } from 'src/app/services/language.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { GlobalService } from 'src/app/services/global.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';

import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn:
    'https://4196003a1c864f5798dd2be18be5cb48@o339076.ingest.sentry.io/5524842',
  release: '2.0.4',
  integrations: [new RewriteFrames()],
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor(private popup: PopupProvider) {}

  handleError(error) {
    // Only send reports to sentry if we are not debugging.
    if (document.URL.includes('io.trinity-tech.dapp.feeds')) {
      // Prod builds or --nodebug CLI builds use the app package id instead of a local IP
      /*const eventId = */ Sentry.captureException(
        error.originalError || error,
      );
      //Sentry.showReportDialog({ eventId });
    }

    this.popup.ionicAlert1(
      'Error',
      'Sorry, the application encountered an error. This has been reported to the team.',
      'Close',
    );
  }
}

export class WebpackTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string): Observable<any> {
    return Observable.create(observer => {
      observer.next(lang);
      switch (lang) {
        case 'zh':
          observer.next(zh);
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
  declarations: [MyApp],
  imports: [
    NgxIonicImageViewerModule,
    QRCodeModule,
    CommonModule,
    BrowserModule,
    HammerModule,
    HttpClientModule,
    AppRoutingModule,
    ComponentsModule,
    IonicModule.forRoot({
      swipeBackEnabled: false,
      rippleEffect: true,
      mode: 'ios',
      // navAnimation: customAnimation,
      // swipeBackEnabled: true
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: TranslateLoaderFactory,
      },
    }),
    IonicStorageModule.forRoot({
      name: 'feedsdb',
      driverOrder: ['indexeddb', 'sqlite', 'websql'],
    }),
  ],
  bootstrap: [MyApp],
  entryComponents: [MyApp],
  providers: [
    Keyboard,
    PhotoLibrary,
    File,
    VideoEditor,
    StatusBar,
    SplashScreen,
    Platform,
    Clipboard,
    Network,
    CarrierService,
    NativeService,
    SessionService,
    FeedService,
    TranslateService,
    ThemeService,
    JsonRPCService,
    InAppBrowser,
    StorageService,
    PopupProvider,
    AppService,
    CameraService,
    JWTMessageService,
    TransportService,
    SerializeDataService,
    MenuService,
    FormatInfoService,
    ConnectionService,
    HttpService,
    AddFeedService,
    StandardAuthService,
    FileService,
    FileHelperService,
    IntentService,
    DataHelper,
    ViewHelper,
    TitleBarService,
    ScanService,
    LanguageService,
    BarcodeScanner,
    NFTContractParsarService,
    NFTContractStickerService,
    NFTContractControllerService,
    WalletConnectControllerService,
    IPFSService,
    NFTPersistenceHelper,
    GlobalService,
    NFTContractHelperService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: ErrorHandler },
  ],
})
export class AppModule {}
