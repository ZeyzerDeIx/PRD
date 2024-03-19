import { Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { SolutionService } from '../solution.service';
import L, { LatLngExpression } from 'leaflet';
import { __propKey } from 'tslib';
import { ArcService } from '../arc.service';
import { iconDefault, iconViolet } from '../include/leaflet-icons';
import { Cohorte, Type, Tube, CustomPolyline } from '../include/interfaces';

@Component({
  selector: 'app-form-cohorte',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './form-cohorte.component.html',
  styleUrl: './form-cohorte.component.scss'
})
export class FormCohorteComponent {
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
  
  tube: Tube = {
    number: 0,
    volume: 0,
    envoi: []
  }

  solution = this.solutionService.getSolution();
  
  constructor(private solutionService:SolutionService, private arcService:ArcService){
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
          this.cohorteMarker.setIcon(iconViolet); // Change the current marker
        }
        
      }
    }
    this.arcService.setCohorteCity(city);
    this.type = {
      name: "",
      tubes: []
    }
    this.typeChange();
  }

  typeChange(){
    this.tube = {
      number: 0,
      volume: 0,
      envoi: []
    }
    this.tubeChange();
  }

  tubeChange(){
    this.removeArcs();
    var citiesPosition = this.solutionService.getCitiesPosition();
    setTimeout(() => {
      var data: CustomPolyline[] = [];
      var lineIndex = 0;
      for (const line of this.tube.envoi){
        // Ugly line to work around "LatLngExpression is not assignable to number | any | undefined..."
        var origin: LatLngExpression = [citiesPosition.get(line[0])![0], citiesPosition.get(line[0])![1]];
        var destination: LatLngExpression = [citiesPosition.get(line[1])![0], citiesPosition.get(line[1])![1]];
        var latlngs = [origin, destination];
        var quantity = line[2];
        var tubeNumber = this.tube.number || 1;
        if(latlngs[0] != latlngs[1]){ // On ne dessine pas la flèche si départ = arrivée
          data.push({
            polyline: this.drawPolyline(this.map, latlngs, quantity, tubeNumber),
            origin: line[0],
            destination: line[1],
            index: lineIndex
          });
          lineIndex++;
        }
      }
      this.arcService.setPolylineArray(data);
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

  private drawPolyline(map:L.Map, latlngs: LatLngExpression[], quantity: Number, tubeNumber: number): L.Polyline{
    var colors = ['red', 'blue', 'green'];

    var polyline = L.polyline(latlngs, {color: colors[tubeNumber-1], weight: 5, opacity: 0.7}).arrowheads({size: "15px", opacity: 0.7, fill: false, yawn: 75,offsets: {end: '75px'}}).addTo(map);

    polyline.bindTooltip(`<div>Quantité : ${ quantity }</div>`);

    return polyline;
  }
}
