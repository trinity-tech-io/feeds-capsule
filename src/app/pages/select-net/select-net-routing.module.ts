import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectNetPage } from './select-net.page';

const routes: Routes = [
  {
    path: '',
    component: SelectNetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectNetPageRoutingModule {}
