import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { FeedsPage } from './feeds.page';
import { FeedsRoutingModule } from './feeds-routing.module';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [CommonModule, IonicModule, FeedsRoutingModule, ComponentsModule],
  declarations: [FeedsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Needed to find ion-back-button, etc
})
export class FeedsPageModule {}
