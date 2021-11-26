import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GallerialistPage } from './gallerialist.page';

const routes: Routes = [
  {
    path: '',
    component: GallerialistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GallerialistPageRoutingModule {}
