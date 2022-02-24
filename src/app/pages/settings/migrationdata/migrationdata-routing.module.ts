import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MigrationdataPage } from './migrationdata.page';

const routes: Routes = [
  {
    path: '',
    component: MigrationdataPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MigrationdataPageRoutingModule {}
