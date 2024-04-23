import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-arrowheads';
import { Solution, City, Cohorte, Arc } from './include/interfaces';

/**
 * Service gérant la construction de la solution. Attention, le service ne sera pas utilisable tant que son initialisation n'est pas terminée. Étant donné que celle ci est asynchrone pour pouvoir parser les ressources textuelles, il faudra s'assurer d'attendre la fin de l'initialisation avant tout usage.
 */
@Injectable({
  providedIn: 'root'
})
export class SolutionService {
  // TODO: Les données de la carte (villes ect...) sont créées manuellement, peut-être pouvoir choisir la liste des villes ?
  /**
   * URL des données de la carte
   */
  private mapDataUrl:string = "assets/map_data/map.geojson";

  /**
   * URL de l'instance d'entrée du modèle
   */
  private instanceUrl:string = "assets/solution_data/instance.txt";

  /**
   * URL de la solution proposée par le modèle
   */
  private instanceSolutionUrl:string = "assets/solution_data/solution_instance.txt";

  // TODO: Les types de tubes sont créées manuellement, peut-être pouvoir choisir la liste des types ?
  /**
   * Liste des types de tube différents
   */
  private types:string[] = ["LCR","SER","PLA"];

  /**
   * Tableau contenant la position des marqueurs associés à chaque ville
   */
  private citiesPosition: Map<string,number[]>;

  /**
   * Contient la solution proposée par le modèle sous la forme d'un objet Solution
   */
  private solution: Solution;

  private isInitialized: boolean = false;

  /**
   * Constructeur du service
   * @param http Client HTTP permettant de faire les requêtes pour récupérer les données via les fichiers txt
   */
  constructor(protected http:HttpClient) {
    this.citiesPosition = new Map();
    this.solution = {
      cities: [],
      types: [],
      cohortes: [],
      demande: new Map<string, Map<string, number>>()
    };

    this.initService();
  }

  /**
   * Initialise le service de manière synchrone. Une fois le processus terminé, getIsInitilized renverra true.
   */
  private async initService(): Promise<void>
  {
    await this.parseCitiesPosition();
    await this.parseCities();
    await this.parseSolution();

    this.isInitialized = true;
  }

  /**
   * Renvoie les données de la carte
   * @returns Les données de la carte sous la forme d'un Observable
   */
  private getMapData(){
    return this.http.get(this.mapDataUrl);
  }

  /** 
   * Renvoie l'instance texte en entrée du modèle
   * @returns L'instance texte en entrée du modèle sous la forme d'un Observable
   */
  private getInstance(){
    return this.http.get(this.instanceUrl, { responseType: 'text'});
  }

  /**
   * Renvoie la solution texte proposée par le modèle
   * @returns La solution texte proposée par le modèle sous la forme d'un Observable
   */
  private getInstanceSolution(){
    return this.http.get(this.instanceSolutionUrl, { responseType: 'text'});
  }

  /**
   * Renvoie la position des marqueurs de chaque ville
   * @returns Un tableau contenant la position des marqueurs associés à chaque ville
   */
  public getCitiesPosition(): Map<string, number[]> {
    return this.citiesPosition;
  }

  /**
   * Renvoie la solution proposée par le modèle
   * @returns La solution proposée par le modèle sous la forme d'un objet Solution
   */
  public getSolution(): Solution{
    return this.solution;
  }

  public getIsInitialized(): boolean {return this.isInitialized;}

  /**
   * Ajoute les marqueurs associés à chaque ville sur la carte Leaflet
   * @param map Carte sur laquelle ajouter les marqueurs
   * @param cities Tableau des villes à ajouter
   * @returns La liste des marqueurs créés
   */
  public drawCities(map: L.Map, cities:City[]): L.Marker[]{ 
    var markersArray: L.Marker[] = [];
    for (const city of cities) {
      // Ugly line to work around "LatLngExpression is not assignable to number | any | undefined..."
      let latlngs:LatLngExpression = [this.citiesPosition.get(city.name)![0], this.citiesPosition.get(city.name)![1]];

      const marker = L.marker(latlngs, {alt: city.name});

      // Ajout du marqueur à la cart
      marker.addTo(map);

      markersArray.push(marker);
    }
    
    return markersArray;
  }

  /**
   * Initialise le tableau des villes grâce aux données de la carte
   */
  private async parseCities(): Promise<void>{
    var finish: boolean = false;
    this.getMapData().subscribe((data:any) => {
      for (const city of data.features) {
        const name = city.properties.name;
        const id = city.id; 
        var cityToAdd: City = {
          name: name,
          id: id,
          cohorte: false
        }
        this.solution.cities.push(cityToAdd);
      }
      finish = true;
    });

    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Initialise la position des marqueurs associés à chaque ville depuis les données de la carte
   */
  private async parseCitiesPosition(): Promise<void>{
    var finish: boolean = false;
    this.getMapData().subscribe((cities:any) => {
      for (const city of cities.features) {
        const lat = city.geometry.coordinates[0];
        const lon = city.geometry.coordinates[1];
        const name = city.properties.name; 
        
        this.citiesPosition.set(name, [lat,lon]);
      }
      finish = true;
    });


    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Initialise la solution
   */
  private async parseSolution(): Promise<void>{
    var finish: boolean = false;

    this.getInstance().subscribe(async(data) => {
      var textLines = data.split('\n');
      var nbVilles = Number(textLines[0]);
      var nbCohortes = Number(textLines[1]);
      var cohorteVilleline = textLines[2].split('\t');
      var cohorteNbPatientsline = textLines[3].split('\t');
      for (var i = 0; i < nbCohortes; i++){
        var villeId = Number(cohorteVilleline[i]) - 1;
        this.solution.cities[villeId].cohorte = true;
        this.solution.cohortes.push({
          nbPatients: Number(cohorteNbPatientsline[i]),
          city: this.solution.cities[villeId].name,
          types: []
        });
      }

      var nbTypes = Number(textLines[4]);
      var nbTubes = Number(textLines[5]);
      for(var i = 0; i < nbCohortes; i++){
        for(var j = 0; j < nbTypes; j++){
          this.solution.cohortes[i].types.push({
            name: this.types[j],
            tubes: []
          });
          var volumeTubesLine = textLines[6+i*nbCohortes+j].split('\t');
          for(var k = 0; k < nbTubes; k++){
            this.solution.cohortes[i].types[j].tubes.push({
              number: k+1,
              volume: Number(volumeTubesLine[k]),
              arcs: []
            });

          }
        }
      }

      for(var i = 0; i < nbVilles; i++){
        this.solution.demande.set(this.solution.cities[i].name, new Map<string, number>());
        var demandeLine = textLines[6+nbTypes*nbCohortes + i].split('\t');
        for(var j = 0; j < nbTypes; j++){
          this.solution.demande.get(this.solution.cities[i].name)!.set(this.solution.types[j],Number(demandeLine[j]));
        }
      }


      var indiceVilles: number[][] = [];
      await this.parseRepartitionTube(indiceVilles);
      var colors = ['red', 'blue', 'green'];

      for(var i = 0; i < nbCohortes; i++){
        var villeCohorte = this.solution.cohortes[i].city;
        for(var j = 0; j < nbTypes; j++){
          for(var k = 0; k < nbTubes; k++){
            var indice = i*nbTypes*nbTubes + j*nbTubes + k;
            for(var l = 0; l < indiceVilles[indice].length; l++){
              var destination = this.findCityNameById(this.solution.cities, indiceVilles[indice][l]);
              var originPoint: LatLngExpression = [this.citiesPosition.get(villeCohorte)![0], this.citiesPosition.get(villeCohorte)![1]];
              var destinationPoint: LatLngExpression = [this.citiesPosition.get(destination)![0], this.citiesPosition.get(destination)![1]];
              var latlngs:LatLngExpression[] = [originPoint, destinationPoint];
              this.solution.cohortes[i].types[j].tubes[k].arcs.push({
                polyline: L.polyline(latlngs,{color: colors[this.solution.cohortes[i].types[j].tubes[k].number!-1], weight: 5, opacity: 0.7}).arrowheads({size: "15px", opacity: 0.7, fill: false, yawn: 75,offsets: {end: '75px'}}),
                origin: villeCohorte,
                destination: destination,
                index: l,
                // TODO: Remplir automatiquement avec les demandes de chaque ville et pas 0
                quantity: 0
              }); 
            }
          }
        }
      }
      finish = true;
    });

    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Retourne l'indice des villes associée à chaque tube proposée par le modèle (répartition par tubes) via le tableau passé par référence en paramètre
   * @param indiceVilles Le tableau dans lequel ranger les résultats
   */
  private async parseRepartitionTube(indiceVilles: number[][]): Promise<void> {
    var finish: boolean = false;

    this.getInstanceSolution().subscribe(data =>{
      var textLines = data.split('\n');
      for(var i = 0; i < textLines.length; i++){
        var line = textLines[i].split(' ');
        var indiceVilleTube: number[] = [];
        for(var j = 0; j < line.length; j++){
            indiceVilleTube.push(Number(line[j]));
        }
        indiceVilles.push(indiceVilleTube);
      }
      finish = true;
    });

    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Renvoie la ville associée à l'id donné en paramètre
   * @param cities Le tableau des villes à chercher
   * @param id Le numéro de la ville à trouver
   * @returns Le nom de la ville correspondant à l'id donné en paramètre, sinon une chaîne vide si aucune ville ne correspond
   */
  private findCityNameById(cities:City[], id:Number) : string {
    for (const city of cities){
      if (city.id == id){
        return city.name;
      }
    }
    return "";
  }
}
