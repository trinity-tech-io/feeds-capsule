import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditprofileimagePageRoutingModule } from './editprofileimage-routing.module';

import { EditprofileimagePage } from './editprofileimage.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    TranslateModule,
    EditprofileimagePageRoutingModule,
  ],
  declarations: [EditprofileimagePage],
})
export class EditprofileimagePageModule {}
