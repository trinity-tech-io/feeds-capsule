import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HiveInterfaceTestPage } from './hive-interface-test.page';

const routes: Routes = [
  {
    path: '',
    component: HiveInterfaceTestPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HiveInterfaceTestPageRoutingModule {}
