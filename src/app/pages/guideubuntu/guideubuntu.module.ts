import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { GuideubuntuPageRoutingModule } from './guideubuntu-routing.module';

import { GuideubuntuPage } from './guideubuntu.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    GuideubuntuPageRoutingModule
  ],
  declarations: [GuideubuntuPage]
})
export class GuideubuntuPageModule {}
