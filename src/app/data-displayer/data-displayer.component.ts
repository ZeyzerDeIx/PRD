// data-displayer.component.ts

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { InstanceService } from '../services/instance.service';
import { Instance, Tube, City } from '../include/modelClasses';
import { DataService } from '../services/data.service';
import { NgIf, NgFor } from '@angular/common';
import L from 'leaflet';
import { iconDefault, iconViolet, iconEmph } from '../include/leaflet-icons';

/**
 * Ce composant permet l'affichage de donnée utiles pour mieux comprendre l'état actuelle de la solution ou pour faire du débuggage.
 */
@Component({
  selector: 'app-data-displayer',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './data-displayer.component.html',
  styleUrls: ['./data-displayer.component.scss']
})
export class DataDisplayerComponent implements OnInit {

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = this.instanceService.getInstance();

  /**
   * Le tube actuellement selectionné par l'utilisateur.
   * Source des informations à afficher.
   */
  selectedTube: Tube = new Tube();

  /**
   * Si oui ou non la boite d'information est ouverte.
   */
  isInfoBoxOpen: boolean = false;

  /**
   * Cet élément fait le lien avec la template et permet de récupérer des informations sur la taille de la boite notament.
   */
  @ViewChild('infoContent') infoContent!: ElementRef;

  /**
   * Permet à la page d'actualiser le texte de toggle.
   * Cette méthode est utilisée par la template d'affichage.
   * @returns "Fermer" si la boite est ouverte, "Afficher" sinon.
   */
  get toggleButtonText(): string {
    return this.isInfoBoxOpen ? 'Fermer' : 'Afficher';
  }

  /**
   * Permet une animation plus fluide en ajustant la taille de la boite d'affichage.
   * Cette méthode est utilisée par la template d'affichage.
   * @returns La taille actuelle de la boite.
   */
  get infoBoxHeight(): number {
    return this.isInfoBoxOpen ? this.infoContent.nativeElement.scrollHeight : 0;
  }

  /**
   * Permet de connaître le volume totale que demande la solution au tube selectionné.
   * Cette méthode est utilisée par la template d'affichage.
   * @returns le volume requis totale pour le tube selectionné.
   */
  get requiredVolume(): number|string {
    try{
      return this.instanceService.requiredVolumeByTubeRecursive(this.selectedTube.type.cohorte.city, this.selectedTube);
    } catch(error: any){
      return "Erreur";
    }
  }

  /**
   * Permet de récupérer la demande d'une ville pour le type du tube selectionné.
   * Cette méthode est utilisée par la template d'affichage.
   * @param city La ville dont on souhaite connaître la demande.
   * @returns La demande de la ville en entrée pour le type du tube selectionné.
   */
  public cityDemande(city: City): number {
    return this.instanceService.requiredVolumeByType(city, this.selectedTube.type);
  }

  /**
   * Permet de changer l'état de la boite d'information entre ouverte et fermée.
   * Cette méthode est utilisée par la template d'affichage.
   * @param event L'évennement déclanché. Permet de connaître l'état de la checkbox.
   */
  toggleInfoBox(event: any) {
    this.isInfoBoxOpen = event.target.checked;
  }

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Instance
   * @param dataService Service permettant de communiquer les données importantes à afficher
   */
  constructor(private instanceService:InstanceService, private dataService: DataService){
  }

  async ngOnInit(): Promise<void> {
    this.dataService.selectedTubeUpdate.subscribe(this.onSelectedTubeUpdate.bind(this));

    //on attend que le instance service soit initialisé
    while(!this.instanceService.getIsInitialized())
      await new Promise(resolve => setTimeout(resolve, 10));

    this.caculateAlicotagesNb();
  }

  /**
   * Est appelé à chaque fois que le tube selectionné est update.
   * Permet de mettre à jour les donnée et leur affichage.
   * @param newTube Le nouveau tube s'il a changé, le même qu'avant sinon (valeur par defaut).
   */
  private onSelectedTubeUpdate(newTube: Tube = this.selectedTube): void{
    this.selectedTube = newTube;
    this.updateTubeCities();
    this.caculateAlicotagesNb();
  }

  /**
   * Met à jour la liste des villes visitées par le tuube selectionnée.
   */
  private updateTubeCities(): void{
    this.selectedTube.cities = [];
    for(let arc of this.selectedTube.arcs){
      this.addCity(arc.origin);
      this.addCity(arc.destination);
    }
  }

  /**
   * Permet d'ajouter une ville au tube en vérifiant qu'elle n'y est pas déjà et qu'elle prélève bien le tube.
   * @param city Ville à vérifier et ajouter.
   */
  private addCity(city: City): void{
    var t = this.selectedTube;
    if(!t.cities.includes(city) && (city != t.type.cohorte.city || !t.usedByCohorte))
        t.cities.push(city);
  }

  /**
   * Calcul le nombre d'alicotage de chaque tube ainsi que de la solution pour les mettres à jour.
   */
  private caculateAlicotagesNb(): void{
    //on reinitialise tout les nombres d'alico à 0 pour les recalculer
    this.instance.solution!.nbAlico = 0;
    for(let cohorte of this.instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes)
          tube.nbAlico = 0;

    for(let city of this.instance.cities){
      //le nombre d'arc sortant de la ville courrante par tube sous forme de map
      var arcsByTube: Map<Tube, number> = new Map();

      //on compte le nombre d'arcs sortants par tube
      for(let arc of city.outgoing_arcs){
        if(!arcsByTube.has(arc.tube))
          arcsByTube.set(arc.tube, 0);
        var curVal: number = arcsByTube.get(arc.tube) as number;
        arcsByTube.set(arc.tube, curVal+1);
      }

      //pour tous tube ayant + d'un arc sortant, les arcs supplémentaires sont compté comme +1 alicotage
      for(let [key, value] of arcsByTube){
          this.instance.solution!.nbAlico += value-1;
          key.nbAlico += value-1;
      }
    }
  }

  /**
   * Met en évidence le marker d'une ville.
   * @param city La ville à mettre en évidence.
   * @param emph Vrai par defaut, si faux, la mise en évidence est inversé, c'est à dire que l'on redonne un logo normal pour le marker.
   */
  public toggleCityEmphathize(city: City, emph: boolean = true):void{
    if(city.marker == null) return;
    
    if(emph) city.marker.setIcon(iconEmph);
    else if(city == this.selectedTube.type.cohorte.city) city.marker.setIcon(iconViolet);
    else city.marker.setIcon(iconDefault);
  }

}
