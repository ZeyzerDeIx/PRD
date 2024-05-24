import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-arrowheads';
import { Instance, City, Cohorte, Arc, Tube, Solution, Type } from '../include/modelClasses';
import { ArcService } from './arc.service';
import { FileService } from './file.service';
import { ParseService } from './parse.service';

/**
 * Service gérant la construction de l'instance et de sa solution.
 * 
 * <strong>Attention</strong>, le service ne sera pas utilisable tant que son initialisation n'est pas terminée. Étant donné que celle-ci est asynchrone pour pouvoir parser les ressources textuelles, il faudra s'assurer d'attendre la fin de l'initialisation avant tout usage.
 * Pour ce faire, il faut utiliser la méthode getIsInitialized().
 */
@Injectable({
  providedIn: 'root'
})
export class InstanceService {


  /**
   * Contient la solution proposée par le modèle sous la forme d'un objet Solution
   */
  private instance: Instance;

  /**
   * Faux tant que le parsing des ressources n'est pas terminé
   */
  private isInitialized: boolean = false;
  public colors: string[] = ['red', 'blue', 'green', 'purple'];

  /**
   * Constructeur du service
   * @param http Client HTTP permettant de faire les requêtes pour récupérer les données via les fichiers txt
   * @param arcService Permet l'injection du ArcService dans ce service
   */
  constructor(private arcService: ArcService, private fileService: FileService, private parseService: ParseService) {
    this.instance = new Instance();

    this.initService();
  }

  /**
   * Retourne l'instance une fois celle ci initialisée de manière asynchrone.
   * @returns L'instance. (Promise)
   */
  public async getInstance(): Promise<Instance>{
    while(!this.isInitialized) await new Promise(resolve => setTimeout(resolve, 10));
    return this.instance;
  }

  /**
   * Ajoute les marqueurs associés à chaque ville sur la carte Leaflet
   * @param map Carte sur laquelle ajouter les marqueurs
   * @param cities Tableau des villes à ajouter
   * @returns La liste des marqueurs créés
   */
  public drawCities(map: L.Map, cities:City[]): L.Marker[]{ 
    var markersArray: L.Marker[] = [];
    for (const city of cities) {

      const marker = L.marker(city.position, {alt: city.name});

      // Ajout du marqueur à la ville
      city.marker = marker;

      // Ajout du marqueur à la carte
      marker.addTo(map);

      markersArray.push(marker);
    }
    
    return markersArray;
  }


  //------------------------------------------------------------//
  //--------------------------PRIVATE---------------------------//
  //------------------------------------------------------------//


  /**
   * Initialise le service de manière synchrone. Une fois le processus terminé, getIsInitilized renverra true.
   */
  private async initService(): Promise<void>
  {
    await this.parseService.parseTypes();
    await this.parseService.parseCities();
    await this.parseService.parseInstance();

    this.instance = this.parseService.getInstance();

    this.caculateArcsQuantities();

    this.isInitialized = true;
  }

  /**
   * Calcul et met à jour les quantités qui circulents dans chaque arc de la solution
   */
  public caculateArcsQuantities(): void{
    for(let arc of this.arcService.getPolylineArray())
      arc.quantity = this.requiredVolumeByTube(arc.destination, arc.tube);
  }

  /**
   * Calcul le volume demandé par une ville <b><u>et ses succeusseurs</u></b> pour le tube donnée en paramètre
   * @param city La ville dont on souhaite connaitre la demande
   * @param tube Le tube dont on souhaite connaitre la demande
   * @returns Le volume demandé par la ville donnée et ses successeurs pour le tube données.
   */
  public requiredVolumeByTube(city: City, tube: Tube): number{
    var volume: number = city.demandes.get(tube.type.name) as number;

    if(!tube.usedByCohorte && tube.type.cohorte.city == city)
      volume = 0;

    for(let arc of city.outgoing_arcs)
      if(arc.tube == tube)
        volume += this.requiredVolumeByTube(arc.destination, tube);
    return volume;
  }

  /**
   * Renvoie la ville associée à l'id donné en paramètre
   * @param id Le numéro de la ville à trouver
   * @returns La ville correspondant à l'id donné en paramètre, sinon une ville par defaut si aucune ville ne correspond
   */
  public findCityById(id:Number) : City{
    for(const city of this.instance.cities)
      if(city.id == id)
        return city;
    return new City();
  }

  /**
   * Renvoie la ville associée au nom donné en paramètre
   * @param name Le nom de la ville à trouver
   * @returns La ville correspondant au nom donné en paramètre, sinon une ville par defaut si aucune ville ne correspond
   */
  public findCityByName(name: string) : City{
    for(const city of this.instance.cities)
      if(city.name == name)
        return city;
    return new City();
  }

  /**
   * Créer le fichier texte de la solution et le télécharge chez le client.
   */
  public saveSolution(): void{
    var content: string = "";

    //L'entête avec les villes utilisants chaque tube
    this.instance.cohortes.forEach((cohorte, i) =>
      cohorte.types.forEach((type, j) =>
        type.tubes.forEach((tube, k) =>
          content += `${i}\t${j}\t${k}\t${tube.cities.length}` +
          tube.cities.map(city => `\t${city.id}`).join('') + "\n"
        )));

    //Les arcs pour chaque tube
    for(let cohorte of this.instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes)
          content += `${tube.arcs.length}\n` + tube.arcs.map(arc => `${arc.origin.id}\t${arc.destination.id}\n`).join('');

    const fileName = 'solution.txt';
    this.fileService.downloadFile(content, fileName);
  }
}
