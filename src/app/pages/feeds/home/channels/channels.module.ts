import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ChannelsPage } from './channels.page';
import { ComponentsModule } from 'src/app/components/components.module';

import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';

import { ShareModule } from 'src/app/share/share.module';

const routes: Routes = [
  {
    path: '',
    component: ChannelsPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    ComponentsModule,
    ShareModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ChannelsPage],
})
export class ChannelsPageModule {}
