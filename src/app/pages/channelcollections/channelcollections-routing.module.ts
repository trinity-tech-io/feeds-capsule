import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChannelcollectionsPage } from './channelcollections.page';

const routes: Routes = [
  {
    path: '',
    component: ChannelcollectionsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChannelcollectionsPageRoutingModule {}
