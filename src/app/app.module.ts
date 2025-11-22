import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { App } from './app';

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot([]), // Will update routes later
    App
  ],
  // Note: Do not use bootstrap array for standalone components. Use bootstrapApplication in main.ts.
})
export class AppModule {}
