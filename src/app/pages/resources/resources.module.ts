import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { ResourcesComponent } from './resources.component';

const routes: Routes = [
  { path: '', component: ResourcesComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ResourcesComponent,   // ✅ Import instead of declare
    RouterModule.forChild(routes)
  ]
})
export class ResourcesModule {}


