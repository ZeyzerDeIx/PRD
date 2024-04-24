import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-arrowheads';
import { Instance, City, Cohorte, Arc, Tube } from './include/interfaces';

/**
 * Service gérant la construction de la solution. Attention, le service ne sera pas utilisable tant que son initialisation n'est pas terminée. Étant donné que celle ci est asynchrone pour pouvoir parser les ressources textuelles, il faudra s'assurer d'attendre la fin de l'initialisation avant tout usage.
 */
@Injectable({
  providedIn: 'root'
})
export class InstanceService {
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
  private instance: Instance;

  /**
   * Faux tant que le parsing des ressources n'est pas terminé
   */
  private isInitialized: boolean = false;

  /**
   * Constructeur du service
   * @param http Client HTTP permettant de faire les requêtes pour récupérer les données via les fichiers txt
   */
  constructor(protected http:HttpClient) {
    this.citiesPosition = new Map();
    this.instance = {
      cities: [],
      types: this.types,
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
    await this.parseInstance();

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
  private getInstanceData(){
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
   * @returns La solution proposée par le modèle sous la forme d'un objet Instance
   */
  public getInstance(): Instance{
    return this.instance;
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
        this.instance.cities.push(cityToAdd);
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
  private async parseInstance(): Promise<void>{
    var finish: boolean = false;

    this.getInstanceData().subscribe(async(data) => {
      var textLines = data.split('\n');
      var nbVilles = Number(textLines[0]);
      var nbCohortes = Number(textLines[1]);
      var cohorteVilleline = textLines[2].split('\t');
      var cohorteNbPatientsline = textLines[3].split('\t');
      for (var i = 0; i < nbCohortes; i++){
        var villeId = Number(cohorteVilleline[i]) - 1;
        this.instance.cities[villeId].cohorte = true;
        this.instance.cohortes.push({
          nbPatients: Number(cohorteNbPatientsline[i]),
          city: this.instance.cities[villeId].name,
          types: []
        });
      }

      var nbTypes = Number(textLines[4]);
      var nbTubes = Number(textLines[5]);
      for(var i = 0; i < nbCohortes; i++){
        for(var j = 0; j < nbTypes; j++){
          this.instance.cohortes[i].types.push({
            name: this.types[j],
            tubes: [],
            cohorte: this.instance.cohortes[i]
          });
          var volumeTubesLine = textLines[6+i*nbCohortes+j].split('\t');
          for(var k = 0; k < nbTubes; k++){
            this.instance.cohortes[i].types[j].tubes.push({
              number: k+1,
              volume: Number(volumeTubesLine[k]),
              arcs: [],
              type: this.instance.cohortes[i].types[j]
            });

          }
        }
      }

      var borneInf: number = 6+nbTypes*nbCohortes;
      var lines: string[] = textLines.slice(borneInf,borneInf + nbVilles);
      this.parseDemandes(lines,nbTypes,nbVilles);


      var indiceVilles: number[][] = [];
      await this.parseRepartitionTube(indiceVilles);

      var colors = ['red', 'blue', 'green'];

      for(var i = 0; i < nbCohortes; i++){
        var villeCohorte = this.instance.cohortes[i].city;
        for(var j = 0; j < nbTypes; j++){
          for(var k = 0; k < nbTubes; k++){
            var indice = i*nbTypes*nbTubes + j*nbTubes + k;
            for(var l = 0; l < indiceVilles[indice].length; l++){
              var tube: Tube = this.instance.cohortes[i].types[j].tubes[k];

              var destination = this.findCityNameById(this.instance.cities, indiceVilles[indice][l]);

              var polylineColor = colors[this.instance.cohortes[i].types[j].tubes[k].number!-1];

              var polyline = this.createPolyline(villeCohorte, destination,polylineColor);
              
              // TODO: Remplir automatiquement avec les demandes de chaque ville et pas 0
              var arc = this.createArc(polyline,villeCohorte,destination,l,0,tube);

              tube.arcs.push(arc); 
            }
          }
        }
      }
      finish = true;
    });

    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  private createPolyline(origin: string, destination: string, color: string): L.Polyline
  {
    var pos: Map<string,number[]> = this.citiesPosition;
    
    var originPoint: LatLngExpression = 
    [pos.get(origin)![0], pos.get(origin)![1]];

    var destinationPoint: LatLngExpression = 
    [pos.get(destination)![0], pos.get(destination)![1]];

    var latlngs:LatLngExpression[] = [originPoint, destinationPoint];

    var polylineOptions = {color: color, weight: 5, opacity: 0.7};

    return L.polyline(latlngs, polylineOptions)
    .arrowheads({
      size: "15px",
      opacity: 0.7,
      fill: false,
      yawn: 75,
      offsets: {end: '75px'}
    });
  }

  private createArc(polyline: L.Polyline, origin: string, destination: string, index: number, quantity: number, tube: Tube): Arc
  {
    return { polyline: polyline, origin: origin, destination: destination, index: index, quantity: quantity, tube: tube };
  }

  private parseDemandes(lines: string[], nbTypes: number, nbVilles: number): void{
    for(var i = 0, s = this.instance; i < nbVilles; i++){
        var ville: Map<string, number> = new Map();
        var dem = lines[i].split('\t');
        for(var j = 0; j < nbTypes; j++)
          ville.set(s.types[j],Number(dem[j]));
        s.demande.set(s.cities[i].name, ville);
      }
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
