import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesComponent } from './resources.component';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

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

