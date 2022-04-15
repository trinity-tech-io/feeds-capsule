import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { GalleriahivePageRoutingModule } from './galleriahive-routing.module';

import { GalleriahivePage } from './galleriahive.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    GalleriahivePageRoutingModule
  ],
  declarations: [GalleriahivePage]
})
export class GalleriahivePageModule {}
