import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NftavatarlistPage } from './nftavatarlist.page';

const routes: Routes = [
  {
    path: '',
    component: NftavatarlistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NftavatarlistPageRoutingModule {}
