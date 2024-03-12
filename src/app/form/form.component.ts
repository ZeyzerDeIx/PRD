import { Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { SolutionService } from '../solution.service';
import L, { LatLngExpression } from 'leaflet';

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

const iconViolet = L.icon({
  iconUrl : iconVioletUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface Cohorte {
  nbPatients: Number | undefined,
  city: string,
  types: any[]
}

interface Type {
  name: string,
  tubes: any[]
}

interface Tube {
  number: number | undefined,
  volume: number | undefined,
  envoi: any[]
}

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent {
  @Input() map!: L.Map;
  @Input() markersArray!: L.Marker[];

  cohorteMarker: L.Marker | undefined = undefined;

  cohorte: Cohorte = {
    nbPatients: 0,
    city: "",
    types: []
  };
  type: Type = {
    name: "",
    tubes: []
  }
  
  tubes: Tube[] = [];

  solution = this.solutionService.solution;
  
  constructor(private solutionService:SolutionService){
    //this.solution = solutionService.solution;
  }

  cohorteChange(e: MatSelectChange){
    var city:string = e.value.city;
    for (const marker of this.markersArray){
      if(marker.options.alt == city){
        if(this.cohorteMarker == undefined){
          this.cohorteMarker = marker;
          this.cohorteMarker.setIcon(iconViolet);
        }
        else{
          this.cohorteMarker.setIcon(iconDefault); // Reset the previous marker icon
          this.cohorteMarker = marker;
          this.cohorteMarker.setIcon(iconViolet); // Change the actual marker
        }
        
      }
    }
    this.type = {
      name: "",
      tubes: []
    }
    this.typeChange();
  }

  typeChange(){
    this.tubes = [];
    this.tubeChange();
  }

  tubeChange(){
    this.removeArcs();
    var citiesPosition = this.solutionService.getCitiesPosition();
    setTimeout(() => {
      for (const tube of this.tubes){
        for (const line of tube.envoi){
          var latlngs = [citiesPosition[line[0]], citiesPosition[line[1]]];
          var quantity = line[2];
          var tubeNumber = tube.number || 1;
          this.drawPolyline(this.map, latlngs, quantity, tubeNumber);
        }
      }
    },200);
  }

  removeArcs(){
    this.map.eachLayer((layer:any) =>{
      if (layer instanceof L.Polyline) {
        // Removes the Click Event Listener from this Polyline.
        this.map.removeLayer(layer);
      }
    });
  }

  private drawPolyline(map:L.Map, latlngs: LatLngExpression[], quantity: Number, tubeNumber: number){
    var colors = ['red', 'blue', 'green'];
    if(latlngs[0] != latlngs[1]){ // On ne dessine pas la flèche si départ = arrivée
      var polyline = L.polyline(latlngs, {color: colors[tubeNumber-1]}).arrowheads({size: "15px", fill: false, yawn: 75,offsets: {end: '75px'}}).addTo(map);
      polyline.bindTooltip(`<div>Quantité : ${ quantity }</div>`);
    }
  }
}
