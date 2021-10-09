import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { NftavatarlistPageRoutingModule } from './nftavatarlist-routing.module';

import { NftavatarlistPage } from './nftavatarlist.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    NftavatarlistPageRoutingModule
  ],
  declarations: [NftavatarlistPage]
})
export class NftavatarlistPageModule {}
