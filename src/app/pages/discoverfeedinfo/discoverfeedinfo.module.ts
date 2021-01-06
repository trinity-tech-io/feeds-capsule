import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { QRCodeModule } from 'angularx-qrcode';
import { DiscoverfeedinfoPage } from './discoverfeedinfo.page';

const routes: Routes = [
  {
    path: '',
    component: DiscoverfeedinfoPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    QRCodeModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DiscoverfeedinfoPage]
})
export class DiscoverfeedinfoPageModule {}
