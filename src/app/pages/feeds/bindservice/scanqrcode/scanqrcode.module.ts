import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ScanqrcodePage } from './scanqrcode.page';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: ScanqrcodePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule, 
    IonicModule,
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ScanqrcodePage]
})
export class ScanqrcodePageModule {}
