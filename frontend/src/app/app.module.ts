import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SunburstComponent } from './sunburst/sunburst.component';
import { HttpClientModule } from '@angular/common/http';
import { DirectedComponent } from './directed/directed.component';
import { SharedService } from './shared.service';
import { IpheatmapComponent } from './ipheatmap/ipheatmap.component';
import { LeafmapComponent } from './leafmap/leafmap.component';

@NgModule({
  declarations: [
    AppComponent,
    SunburstComponent,
    DirectedComponent,
    IpheatmapComponent,
    LeafmapComponent

  ],
  imports: [
    BrowserModule,
    HttpClientModule

  ],
  providers: [SharedService],
  bootstrap: [AppComponent]
})
export class AppModule { }
