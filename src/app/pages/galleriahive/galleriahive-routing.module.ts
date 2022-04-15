import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GalleriahivePage } from './galleriahive.page';

const routes: Routes = [
  {
    path: '',
    component: GalleriahivePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GalleriahivePageRoutingModule {}
