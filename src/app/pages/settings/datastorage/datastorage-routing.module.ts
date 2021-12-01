import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DatastoragePage } from './datastorage.page';

const routes: Routes = [
  {
    path: '',
    component: DatastoragePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DatastoragePageRoutingModule {}
