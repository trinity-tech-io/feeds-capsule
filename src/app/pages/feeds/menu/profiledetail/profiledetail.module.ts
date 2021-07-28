import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { ProfiledetailPage } from './profiledetail.page';
import { QRCodeModule } from 'angularx-qrcode';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: ProfiledetailPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    QRCodeModule,
    ComponentsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ProfiledetailPage],
})
export class ProfiledetailPageModule {}
