import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { QRCodeModule } from 'angularx-qrcode';
import { DiscoverfeedsinfoPage } from './discoverfeedsinfo.page';

const routes: Routes = [
  {
    path: '',
    component: DiscoverfeedsinfoPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    QRCodeModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DiscoverfeedsinfoPage]
})
export class DiscoverfeedsinfoPageModule {}
