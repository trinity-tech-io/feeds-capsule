import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core'
import { AppModule } from './app.module';
import {environment } from '../environments/environment';
import 'hammerjs';

if(environment.production){
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
