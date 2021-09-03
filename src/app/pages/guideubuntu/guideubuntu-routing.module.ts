import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GuideubuntuPage } from './guideubuntu.page';

const routes: Routes = [
  {
    path: '',
    component: GuideubuntuPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GuideubuntuPageRoutingModule {}
