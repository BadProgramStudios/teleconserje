import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderPageRoutingModule } from './folder-routing.module';

import { FolderPage } from './folder.page';
import { QrCodeModule } from 'ng-qrcode';
import { ReactiveFormsModule } from '@angular/forms'; // Asegúrate de importar esto

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    QrCodeModule,
    IonicModule,
    FolderPageRoutingModule,
    ReactiveFormsModule, // Agrégalo aquí
  ],
  declarations: [FolderPage]
})

export class FolderPageModule {}
