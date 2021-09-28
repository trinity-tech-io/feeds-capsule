import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectIpfsNetPage } from './select-ipfs-net.page';

const routes: Routes = [
  {
    path: '',
    component: SelectIpfsNetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectIpfsNetPageRoutingModule {}
