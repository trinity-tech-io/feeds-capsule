import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { IonicModule } from '@ionic/angular';

import { FeedinfoPage } from './feedinfo.page';

const routes: Routes = [
  {
    path: '',
    component: FeedinfoPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    QRCodeModule,
    TranslateModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [FeedinfoPage]
})
export class FeedinfoPageModule {}
