import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditprofileimagePage } from './editprofileimage.page';

const routes: Routes = [
  {
    path: '',
    component: EditprofileimagePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditprofileimagePageRoutingModule {}
