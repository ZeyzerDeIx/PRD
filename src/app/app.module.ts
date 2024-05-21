import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { SolutionService } from './solution.service';
import { FileSaverModule } from 'ngx-filesaver';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    LeafletModule,
    HttpClientModule,
    FileSaverModule
  ],
  exports: [
  ],
  providers: [
    SolutionService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }