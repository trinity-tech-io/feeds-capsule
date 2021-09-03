import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { GuidemacPageRoutingModule } from './guidemac-routing.module';

import { GuidemacPage } from './guidemac.page';

import { ComponentsModule } from 'src/app/components/components.module';


@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ComponentsModule,
    IonicModule,
    GuidemacPageRoutingModule
  ],
  declarations: [GuidemacPage]
})
export class GuidemacPageModule {}
