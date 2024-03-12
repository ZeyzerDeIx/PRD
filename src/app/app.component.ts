import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import "leaflet-polylinedecorator";
import "leaflet-textpath";
import { HttpClientModule} from '@angular/common/http';
import { SolutionService } from './solution.service';
import { FormComponent } from './form/form.component';

const iconUrl = 'assets/images/marker-icon.png';
const iconVioletUrl = 'assets/images/marker-icon-violet.png';
const shadowUrl = 'assets/images/marker-shadow.png';

const iconDefault = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [HttpClientModule, FormComponent],
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  map: any;
  title = "PRD SLA";
  solution: any;
  markersArray: L.Marker[] = [];

  constructor(private solutionService:SolutionService) {
    solutionService.solution = solutionService.getSolution();
  }

  public ngOnInit(): void {
    this.loadMap();
    this.solution = this.solutionService.solution;
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
    console.log(this.markersArray);
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