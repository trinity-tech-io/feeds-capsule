import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from '../../../components/components.module';
import { ConfirmationPage } from './confirmation.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmationPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ConfirmationPage],
})
export class ConfirmationPageModule {}
