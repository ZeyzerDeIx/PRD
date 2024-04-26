import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-arrowheads';
import { Instance, City, Cohorte, Arc, Tube, Solution, Type } from './include/modelClasses';

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

  private nbTubes: number = 0;
  private nbVilles: number = 0;
  private nbTypes: number = 0;
  private nbCohortes: number = 0;

  /**
   * Constructeur du service
   * @param http Client HTTP permettant de faire les requêtes pour récupérer les données via les fichiers txt
   */
  constructor(protected http:HttpClient) {
    this.citiesPosition = new Map();
    this.instance = new Instance([], this.types);

    this.initService();
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
  private getInstanceSolutionData(){
    return this.http.get(this.instanceSolutionUrl, { responseType: 'text'});
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
        var cityToAdd: City = new City(name,id);
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
   * Initialise l'instance en parsant le fichier instance
   */
  private async parseInstance(): Promise<void>{
    var finish: boolean = false;

    this.getInstanceData().subscribe(async(data) => {
      var textLines = data.split('\n');
      this.nbVilles = Number(textLines[0]);
      this.nbCohortes = Number(textLines[1]);
      var cohorteVilleline = textLines[2].split('\t');
      var cohorteNbPatientsline = textLines[3].split('\t');
      for (var i = 0; i < this.nbCohortes; i++){
        var villeId = Number(cohorteVilleline[i]) - 1;
        this.instance.cities[villeId].cohorte = true;
        this.instance.cohortes.push({
          nbPatients: Number(cohorteNbPatientsline[i]),
          city: this.instance.cities[villeId],
          types: []
        });
      }

      this.nbTypes = Number(textLines[4]);
      this.nbTubes = Number(textLines[5]);
      for(var i = 0; i < this.nbCohortes; i++){
        for(var j = 0; j < this.nbTypes; j++){
          this.instance.cohortes[i].types.push(new Type(this.types[j],[],this.instance.cohortes[i]));
          var volumeTubesLine = textLines[6+i*this.nbCohortes+j].split('\t');
          for(var k = 0; k < this.nbTubes; k++){
            var tube: Tube = new Tube(k+1, Number(volumeTubesLine[k]), 0, [], [], this.instance.cohortes[i].types[j]);
            this.instance.cohortes[i].types[j].tubes.push(tube);

          }
        }
      }
      var borneInf: number = 6+this.nbTypes*this.nbCohortes;
      var lines: string[] = textLines.slice(borneInf,borneInf + this.nbVilles);
      await this.parseDemandes(lines);
      await this.parseSolution();
      
      finish = true;
    });

    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Initialise la solution de l'instance en parsant le fichier solution
   */
  private async parseSolution(): Promise<void>{
    var finish: boolean = false;

    //permet de passer les premières lignes (redondance des données)
    var separator: number = this.nbCohortes*this.nbTypes*this.nbTubes;
    var colors = ['red', 'blue', 'green'];

    this.getInstanceSolutionData().subscribe(data =>{
      this.instance.solution = new Solution([], this.instance);
      //transforme le fichier en un tableau de string
      var lines: string[] = data.split('\n');
      this.parseTubesCities(lines.slice(0, separator));
      lines = lines.slice(separator);
      var index: number = 0;
      for(var i = 0; i < this.nbCohortes; i++){
        for(var j = 0; j < this.nbTypes; j++){
          for(var k = 0; k < this.nbTubes; k++){
            var tubeNum: number = i*this.nbTypes*this.nbTubes + j*this.nbTubes + k;
            var tube: Tube = this.instance.cohortes[i].types[j].tubes[k];
            var nbArcs: number = Number(lines[index++]);
            for(var l = 0; l < nbArcs; l++){

              var split: string[] = lines[index++].split('\t');

              var origin: City = this.findCityById(Number(split[0]));
              var destination: City = this.findCityById(Number(split[1]));

              var polylineColor = colors[this.instance.cohortes[i].types[j].tubes[k].number!-1];

              var polyline = this.createPolyline(origin, destination,polylineColor);
              
              // TODO: Remplir automatiquement avec les demandes de chaque ville et pas 0
              var arc = new Arc(polyline,origin,destination,l,0,tube);
              arc.origin.arcs.push(arc);
              tube.arcs.push(arc);
              this.instance.solution.arcs.push(arc);
            }
          }
        }
      }
      this.caculateArcsQuantities();
      this.caculateAlicotagesNb();
      finish = true;
    });

    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  private parseTubesCities(lines: string[]): void{
    for(var i = 0; i < this.nbCohortes; i++){
      for(var j = 0; j < this.nbTypes; j++){
        for(var k = 0; k < this.nbTubes; k++){
          var tubeNum: number = i*this.nbTypes*this.nbTubes + j*this.nbTubes + k;
          var tube: Tube = this.instance.cohortes[i].types[j].tubes[k];
          for(let id of lines[tubeNum].split("\t").slice(4)){
            tube.cities.push(this.findCityById(Number(id)));
          }
        }
      }
    }
  }

  /**
   * Calcul et met à jour les quantités qui circulents dans chaque arc de la solution
   */
  private caculateArcsQuantities(): void{
    var arcs: Arc[] = this.instance.solution!.arcs;
    for(var i = 0; i < arcs.length; i++){
      arcs[i].quantity = this.requiredVolumeRecursive(arcs[i].destination, arcs[i].tube.type);
    }
  }

  private caculateAlicotagesNb(): void{
    for(let city of this.instance.cities){
      var nbOfArcsbyTube: Map<Tube, number> = new Map();
      for(let arc of city.arcs){
        if(!nbOfArcsbyTube.has(arc.tube))
          nbOfArcsbyTube.set(arc.tube, 0);
        var curVal: number = nbOfArcsbyTube.get(arc.tube) as number;
        nbOfArcsbyTube.set(arc.tube, curVal+1);
      }
      for(let [key, value] of nbOfArcsbyTube){
        if(value > 1 && this.instance.solution != null){
          this.instance.solution.nbAlico += value-1;
          key.nbAlico += value-1;
        }
      }
    }
  }

  /**
   * Calcul le volume demandé par une ville <b><u>et ses succeusseurs</u></b> pour le type de tube donnée en paramètre
   * @param city La ville dont on souhaite connaitre la demande
   * @param type Le type de tube dont on souhaite connaitre la demande
   */
  private requiredVolumeRecursive(city: City, type: Type): number{
    var volume: number = this.requiredVolume(city,type);
    for(var i = 0; i < city.arcs.length; i++){
      if(city.arcs[i].tube.type == type){
        var dest: City = city.arcs[i].destination;
        volume += this.requiredVolumeRecursive(dest,type);
      }
    }
    return volume;
  }

  /**
   * Calcul le volume demandé par une ville pour le type de tube donnée en paramètre
   * @param city La ville dont on souhaite connaitre la demande
   * @param type Le type de tube dont on souhaite connaitre la demande
   */
  private requiredVolume(city: City, type: Type): number{
    var cityDem: Map<string, number> = this.instance.demande.get(city.name) as Map<string, number>;
    return cityDem.get(type.name) as number;
  }

  /**
   * Créer une Polyline
   * @param origin La ville d'origine de l'arc/la polyline
   * @param destination La ville de destination de l'arc/la polyline
   * @param color La couleur d'affichage de la polyline
   */
  private createPolyline(origin: City, destination: City, color: string): L.Polyline{
    var pos: Map<string,number[]> = this.citiesPosition;
    
    var originPoint: LatLngExpression = 
    [pos.get(origin.name)![0], pos.get(origin.name)![1]];

    var destinationPoint: LatLngExpression = 
    [pos.get(destination.name)![0], pos.get(destination.name)![1]];

    var latlngs:LatLngExpression[] = [originPoint, destinationPoint];

    var polylineOptions = {color: color, weight: 4, opacity: 0.5};

    return L.polyline(latlngs, polylineOptions)
    .arrowheads({
      size: "25px",
      opacity: 0.5,
      fill: false,
      yawn: 75,
      offsets: {end: '75px'}
    });
  }

  /**
   * Initialise la liste des demandes en parsant le texte fourni
   * @param lines Les lignes à parser
   */
  private parseDemandes(lines: string[]): void{
    for(var i = 0, inst = this.instance; i < this.nbVilles; i++){
        var ville: Map<string, number> = new Map();
        var dem = lines[i].split('\t');
        for(var j = 0; j < this.nbTypes; j++)
          ville.set(inst.types[j],Number(dem[j]));
        inst.demande.set(inst.cities[i].name, ville);
      }
  }

  /**
   * Retourne l'indice des villes associée à chaque tube proposée par le modèle (répartition par tubes) via le tableau passé par référence en paramètre
   * @param indiceVilles Le tableau dans lequel ranger les résultats
   */
  private async parseRepartitionTube(indiceVilles: number[][]): Promise<void> {
    var finish: boolean = false;

    this.getInstanceSolutionData().subscribe(data =>{
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
   * @param id Le numéro de la ville à trouver
   * @returns La ville correspondant à l'id donné en paramètre, sinon une ville par defaut si aucune ville ne correspond
   */
  private findCityById(id:Number) : City {
    for (const city of this.instance.cities){
      if (city.id == id){
        return city;
      }
    }
    return new City();
  }
}
