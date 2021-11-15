import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { AssistpasarPageRoutingModule } from './assistpasar-routing.module';

import { AssistpasarPage } from './assistpasar.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    ComponentsModule,
    AssistpasarPageRoutingModule
  ],
  declarations: [AssistpasarPage]
})
export class AssistpasarPageModule {}
