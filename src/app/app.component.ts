import { Component, OnInit } from '@angular/core';
import { HttpClientModule} from '@angular/common/http';
import { InstanceService } from './services/instance.service';
import { ArcService } from './services/arc.service';
import { FormCohorteComponent } from './form-cohorte/form-cohorte.component';
import { TableArcComponent } from './table-arc/table-arc.component';
import { DataDisplayerComponent } from './data-displayer/data-displayer.component';
import { iconDefault } from './include/leaflet-icons';

import * as L from 'leaflet';
import { Instance } from './include/modelClasses';

L.Marker.prototype.options.icon = iconDefault;

/**
 * Composant principal de l'application, contient notamment la carte
 */
@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [HttpClientModule, FormCohorteComponent, TableArcComponent, DataDisplayerComponent],
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  /**
   * Carte Leaflet
   */
  map!: L.Map;
  
  /**
   * Solution provenant de SolutionService (Initialisée en amont depuis le service même)
   */
  instance: Instance = this.instanceService.getInstance();

   /**
   * Liste des marqueurs Leaflet de la carte (1 marqueur par ville)
   */
  markersArray: L.Marker[] = [];

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Solution
   */
  constructor(private instanceService:InstanceService, private arcService: ArcService) {
  }

  /**
   * Initialise toutes les valeurs du composant
   */
  public async ngOnInit():  Promise<void> {
    this.loadMap();

    //on attend que le solution service soit initialisé
    while(!this.instanceService.getIsInitialized())
      await new Promise(resolve => setTimeout(resolve, 10));

    this.markersArray = this.instanceService.drawCities(this.map, this.instance.cities);
    this.createMarkersPopup()
  }

  /**
   * Initialise la carte Leaflet
   */
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

    this.arcService.map = this.map;
  }

  /**
   * Crée un popup pour chaque marqueur sur la carte
   */
  private createMarkersPopup(){
    for (const marker of this.markersArray){
      var city = marker.options.alt  || "";
      var popupContent = `` + `<div>Ville : ${ city } <br>
                                    Demande : 
                                    <ul>`;

      for (var i = 0; i < this.instance.types.length; i++){
        popupContent += `<li>${ this.instance.types[i] } : ${ this.instance.demande.get(city)!.get(this.instance.types[i]) } mL</li>`;
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

  /**
   * Méthode appelée depuis le bouton "Retour" qui réinitialise le zoom et la position de la carte
   */
  defaultZoom(){
    this.map.flyTo([47.338, 2.071], 6, {
      animate: true,
      duration: 1
    });
  }
}