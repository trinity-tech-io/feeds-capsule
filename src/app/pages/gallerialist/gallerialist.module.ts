import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { GallerialistPageRoutingModule } from './gallerialist-routing.module';

import { GallerialistPage } from './gallerialist.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    GallerialistPageRoutingModule
  ],
  declarations: [GallerialistPage]
})
export class GallerialistPageModule {}
