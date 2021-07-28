import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../components/components.module';
import { IonicModule } from '@ionic/angular';

import { AssetdetailsPage } from './assetdetails.page';

const routes: Routes = [
  {
    path: '',
    component: AssetdetailsPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ComponentsModule,
    IonicModule,
    TranslateModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AssetdetailsPage],
})
export class AssetdetailsPageModule {}
