import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ProfilePage } from './profile.page';

import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';

import { ComponentsModule } from '../../../components/components.module';
const routes: Routes = [
  {
    path: '',
    component: ProfilePage,
  },
];

@NgModule({
  declarations: [ProfilePage],
  imports: [
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    ComponentsModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
})
export class ProfilePageModule {}
