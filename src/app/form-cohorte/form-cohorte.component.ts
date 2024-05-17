import { Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { InstanceService } from '../services/instance.service';
import L, { LatLngExpression } from 'leaflet';
import { __propKey } from 'tslib';
import { ArcService } from '../services/arc.service';
import { iconDefault, iconViolet } from '../include/leaflet-icons';
import { Cohorte, Type, Tube, Arc, Instance, City } from '../include/modelClasses';
import { DataService } from '../services/data.service';

/**
 * FormCohorteComponent gère la sélection de la cohorte, du type et du tube voulu
 */
@Component({
  selector: 'app-form-cohorte',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './form-cohorte.component.html',
  styleUrl: './form-cohorte.component.scss'
})
export class FormCohorteComponent {
  /**
   * Carte Leaflet du composant principal
   */
  @Input() map!: L.Map;

  /**
   * Liste des marqueurs Leaflet de la carte (1 marqueur par ville)
   */
  @Input() markersArray!: L.Marker[];

  /**
   * Marqueur de la ville de départ de la cohorte
   */
  cohorteMarker: L.Marker | undefined = undefined;

  /**
   * Variable contenant la cohorte choisie dans le formulaire
   */
  cohorte: Cohorte = new Cohorte();

  /**
   * Variable contenant le type de tube choisi dans le formulaire
   */
  type: Type = new Type();

  /**
   * Variable contenant le tube choisi dans le formulaire
   */
  tube: Tube = new Tube();

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = this.instanceService.getInstance();
  
  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Instance
   * @param arcService Service permettant de créér les arcs
   * @param dataService Service permettant de communiquer les données importantes à afficher
   */
  constructor(private instanceService:InstanceService, private arcService:ArcService, private dataService: DataService){
    //this.instance = instanceService.instance;
  }

  /**
   * Gère la sélection d'une nouvelle cohorte dans le formulaire
   * @param e Contient l'ancienne cohorte et la nouvelle choisie
   */
  cohorteChange(e: MatSelectChange){
    //Réinitialiser la cohorte actuellement selectionnée
    for(let cohorte of this.instance.cohortes)
      cohorte.city.selected = false;

    var city:City = e.value.city;
    for (const marker of this.markersArray){
      if(marker.options.alt == city.name){
        if(this.cohorteMarker != undefined)
          this.cohorteMarker.setIcon(iconDefault); // Reset the previous marker icon

        this.cohorteMarker = marker;
        this.cohorteMarker.setIcon(iconViolet); // Change the current marker
        city.selected = true;
      }
    }
    
    this.arcService.setCohorteCity(city);
    this.type = new Type();
    this.typeChange();
  }

  /**
   * Gère la sélection d'un nouveau type de tube dans le formulaire
   */
  typeChange(){
    this.tube = new Tube();
    this.tubeChange();
  }

  /**
   * Gère la sélection d'un nouveau tube dans le formulaire
   */
  tubeChange(){
    this.removeArcs();
    this.dataService.setSelectedTube(this.tube);
    this.arcService.setPolylineArray(this.tube.arcs);
    this.arcService.drawPolylines(this.tube.arcs)
  }

  /**
   * Efface tous les arcs créés
   */
  removeArcs(){
    this.map.eachLayer((layer:any) =>{
      if (layer instanceof L.Polyline)
        this.map.removeLayer(layer);
    });
  }

}
