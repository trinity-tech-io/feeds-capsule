import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { GalleriachannelPageRoutingModule } from './galleriachannel-routing.module';

import { GalleriachannelPage } from './galleriachannel.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    GalleriachannelPageRoutingModule
  ],
  declarations: [GalleriachannelPage]
})
export class GalleriachannelPageModule {}
