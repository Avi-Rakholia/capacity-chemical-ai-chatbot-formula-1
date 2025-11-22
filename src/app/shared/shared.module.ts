import { NgModule } from '@angular/core';
import { LoadingComponent } from './components/loading.component';
import { PlaceholderComponent } from './components/placeholder.component';

@NgModule({
  imports: [
    LoadingComponent,
    PlaceholderComponent
  ],
  exports: [
    LoadingComponent,
    PlaceholderComponent
  ]
})
export class SharedModule {}
