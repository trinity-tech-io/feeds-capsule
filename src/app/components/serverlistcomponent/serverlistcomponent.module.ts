import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ServerlistcomponentComponent } from './serverlistcomponent.component';

const routes: Routes = [
  {
    path: '',
    component: ServerlistcomponentComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ServerlistcomponentComponent]
})
export class ServerlistComponentModule {}
