import { Component, OnInit } from '@angular/core';
import { HttpClientModule} from '@angular/common/http';
import { InstanceService } from './services/instance.service';
import { ArcService } from './services/arc.service';
import { DataService } from './services/data.service';
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
  instance: Instance = new Instance();

   /**
   * Liste des marqueurs Leaflet de la carte (1 marqueur par ville)
   */
  markersArray: L.Marker[] = [];

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Solution
   */
  constructor(private instanceService:InstanceService, private arcService: ArcService, private dataService: DataService) {
  }

  /**
   * Initialise toutes les valeurs du composant
   */
  public async ngOnInit():  Promise<void> {
    this.loadMap();

    //on attend que l'instance puisse être récupérée
    this.instance = await this.instanceService.getInstance();

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

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
    for (let marker of this.markersArray){
      var city = this.instanceService.findCityByName(marker.options.alt as string);
      var popupContent = `<div>Ville : ${ city.name } <br>
                                    Demande : 
                                    <ul>`;

      for (let typeName of this.instance.typeNames)
        popupContent += `<li>${ typeName } : ${ city.demandes.get(typeName) }mL</li>`;

      popupContent += `</ul></div>`

      marker.bindPopup(popupContent, {autoPan: false});
      
      marker.on('mouseover', (e) => {
        e.target.openPopup();
        //obligatoir, pour une raison obscure, city ne fonctionne pas.
        var cityToEmph = this.instanceService.findCityByName(e.target.options.alt as string);
        this.dataService.toggleCityEmphathize(cityToEmph);
      });

      marker.on('mouseout', (e) => {
        e.target.closePopup();
        var cityToEmph = this.instanceService.findCityByName(e.target.options.alt as string);
        this.dataService.toggleCityEmphathize(cityToEmph,false);
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