import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { EditimagePage } from './editimage.page';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: EditimagePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ImageCropperModule,
    ComponentsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [EditimagePage],
})
export class EditimagePageModule {}
