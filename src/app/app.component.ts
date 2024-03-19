import { Component, OnInit } from '@angular/core';
import { HttpClientModule} from '@angular/common/http';
import { SolutionService } from './solution.service';
import { FormCohorteComponent } from './form-cohorte/form-cohorte.component';
import { TableArcComponent } from './table-arc/table-arc.component';
import { iconDefault } from './include/leaflet-icons';

import * as L from 'leaflet';
import "leaflet-polylinedecorator";
import "leaflet-textpath";

L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [HttpClientModule, FormCohorteComponent, TableArcComponent],
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  map: any;
  title = "PRD SLA";
  solution: any;
  markersArray: L.Marker[] = [];

  constructor(private solutionService:SolutionService) {
  }

  public ngOnInit(): void {
    this.loadMap();
    this.solution = this.solutionService.getSolution();
    this.markersArray = this.solutionService.drawCities(this.map, this.solution.cities);
    setTimeout(() => {
      this.createMarkersPopup()
    }, 500);
  }

  private loadMap(): void {
    this.map = L.map('map', {
      center: [47.338, 2.071],
      zoom: 6
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);

    this.map.setMaxBounds(this.map.getBounds());
  }

  private createMarkersPopup(){
    for (const marker of this.markersArray){
      var city = marker.options.alt  || "";
      var popupContent = `` + `<div>Ville : ${ city } <br>
                                    Demande : 
                                    <ul>`;

      for (var i = 0; i < this.solution.types.length; i++){
        popupContent += `<li>${ this.solution.types[i] } : ${ this.solution.demande[city][i] } mL</li>`
      }

      popupContent += `</ul></div>`

      marker.bindPopup(popupContent, {autoPan: false});
      marker.on('mouseover', (e) => {
        e.target.openPopup();
      });

      marker.on('mouseout', (e) => {
        e.target.closePopup();
      });
    }
  }

  defaultZoom(e:any){
    this.map.flyTo([47.338, 2.071], 6, {
      animate: true,
      duration: 1
    });
  }
}