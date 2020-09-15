import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { DiscoverfeedsPage } from './discoverfeeds.page';

const routes: Routes = [
  {
    path: '',
    component: DiscoverfeedsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DiscoverfeedsPage]
})
export class DiscoverfeedsPageModule {}
