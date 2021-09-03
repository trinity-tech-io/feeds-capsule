import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GuidemacPage } from './guidemac.page';

const routes: Routes = [
  {
    path: '',
    component: GuidemacPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GuidemacPageRoutingModule {}
