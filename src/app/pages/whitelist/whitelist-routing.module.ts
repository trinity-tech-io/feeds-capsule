import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WhitelistPage } from './whitelist.page';

const routes: Routes = [
  {
    path: '',
    component: WhitelistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WhitelistPageRoutingModule {}
