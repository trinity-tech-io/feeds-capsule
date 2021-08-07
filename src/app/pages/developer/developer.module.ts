import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DeveloperPageRoutingModule } from './developer-routing.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { DeveloperPage } from './developer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    DeveloperPageRoutingModule,
    ComponentsModule
  ],
  declarations: [DeveloperPage]
})
export class DeveloperPageModule {}
