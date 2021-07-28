import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../components/components.module';
import { IonicModule } from '@ionic/angular';

import { BidPage } from './bid.page';

const routes: Routes = [
  {
    path: '',
    component: BidPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [BidPage],
})
export class BidPageModule {}
