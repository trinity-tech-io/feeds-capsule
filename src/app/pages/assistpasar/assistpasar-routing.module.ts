import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AssistpasarPage } from './assistpasar.page';

const routes: Routes = [
  {
    path: '',
    component: AssistpasarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssistpasarPageRoutingModule {}
