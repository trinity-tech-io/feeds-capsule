import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GalleriachannelPage } from './galleriachannel.page';

const routes: Routes = [
  {
    path: '',
    component: GalleriachannelPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GalleriachannelPageRoutingModule {}
