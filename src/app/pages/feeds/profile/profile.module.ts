import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ProfilePage } from './profile.page';

// import { PostfromComponentPageModule } from '../../../components/postfrom/postfrom.component.module'
// import { PostfromComponent } from '../../../components/postfrom/postfrom.component'
import {ComponentsModule} from '../../../components/components.module'
const routes: Routes = [
  {
    path: '',
    component: ProfilePage
  }
];


@NgModule({
  declarations: [ProfilePage],
  imports: [
    // ProfilePage.forChild(PostfromComponentPageModule),
    // PostfromComponentPageModule,
    ComponentsModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
})
export class ProfilePageModule {}
