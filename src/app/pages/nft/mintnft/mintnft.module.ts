import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { ComponentsModule } from '../../../components/components.module';
import { MintnftPage } from './mintnft.page';

const routes: Routes = [
  {
    path: '',
    component: MintnftPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    IonicModule,
    ComponentsModule,
    TranslateModule,
    RouterModule.forChild(routes),
  ],
  declarations: [MintnftPage],
})
export class MintnftPageModule {}
