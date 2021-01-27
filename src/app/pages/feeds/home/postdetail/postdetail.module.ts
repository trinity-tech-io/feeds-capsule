import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { PostdetailPage } from './postdetail.page';
import { ComponentsModule } from 'src/app/components/components.module';

import { VgCoreModule } from 'ngx-videogular';
import { VgControlsModule } from 'ngx-videogular';
import { VgOverlayPlayModule } from 'ngx-videogular';
import { VgBufferingModule } from 'ngx-videogular';

import { ShareModule } from 'src/app/share/share.module';

const routes: Routes = [
  {
    path: '',
    component: PostdetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    ShareModule,
    ComponentsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [PostdetailPage]
})
export class PostdetailPageModule {}
