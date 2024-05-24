import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-arrowheads';
import { Instance, City, Cohorte, Arc, Tube, Solution, Type } from '../include/modelClasses';
import { ArcService } from './arc.service';
import { FileService } from './file.service';

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
  // TODO: Les données de la carte (villes ect...) sont créées manuellement, peut-être pouvoir choisir la liste des villes ?
  /**
   * URL des données de la carte
   */
  private mapDataUrl:string = "assets/map_data/map.geojson";

  /**
   * URL de l'instance d'entrée du modèle
   */
  private instanceUrl:string = "assets/solution_data/I_20_4_4_4_3_00.txt";

  /**
   * URL de la solution proposée par le modèle
   */
  private instanceSolutionUrl:string = "assets/solution_data/sol_20_4_4_4_3_00.txt";

  /**
   * URL de la solution proposée par le modèle
   */
  private typesURL:string = "assets/solution_data/types.txt";


  /**
   * Contient la solution proposée par le modèle sous la forme d'un objet Solution
   */
  private instance: Instance;

  /**
   * Faux tant que le parsing des ressources n'est pas terminé
   */
  private isInitialized: boolean = false;

  private tubeCount: number = 0;
  private cityCount: number = 0;
  private typeCount: number = 0;
  private cohorteCount: number = 0;
  public colors: string[] = ['red', 'blue', 'green', 'purple'];

  /**
   * Constructeur du service
   * @param http Client HTTP permettant de faire les requêtes pour récupérer les données via les fichiers txt
   * @param arcService Permet l'injection du ArcService dans ce service
   */
  constructor(protected http:HttpClient, private arcService: ArcService, private fileService: FileService) {
    this.instance = new Instance();

    this.initService();
  }

  /**
   * Renvoie la solution proposée par le modèle
   * @returns La solution proposée par le modèle sous la forme d'un objet Instance
   */
  public getInstance(): Instance{ return this.instance; }

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
    await this.parseTypes();
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
    return this.http.get(this.instanceUrl, {responseType: 'text'});
  }

  /**
   * Renvoie la solution texte proposée par le modèle
   * @returns La solution texte proposée par le modèle sous la forme d'un Observable
   */
  private getInstanceSolutionData(){
    return this.http.get(this.instanceSolutionUrl, {responseType: 'text'});
  }

  /**
   * Renvoie les types sous forme de texte
   * @returns Les types
   */
  private getTypesData(){
    return this.http.get(this.typesURL, {responseType: 'text'});
  }

  /**
   * Initialise le tableau des villes grâce aux données de la carte
   */
  private async parseCities(): Promise<void>{
    var finish: boolean = false;
    this.getMapData().subscribe((data:any) => {
      for (const city of data.features) {
        const name = city.properties.name + " ["+ city.id + "]";
        const id = city.id;
        const lat = city.geometry.coordinates[0];
        const lon = city.geometry.coordinates[1];
        var cityToAdd: City = new City(name,id);
        cityToAdd.position = [lat,lon];
        this.instance.cities.push(cityToAdd);
      }
      finish = true;
    });

    //permet d'attendre que l'execution soit terminée pour que tout se déroulent dans l'ordre
    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Initialise l'instance en parsant le fichier instance
   */
  private async parseInstance(): Promise<void>{
    var finish: boolean = false;

    //on attend la récupération des données de l'instance stockées sur le serveur pour éxécuter les traîtements
    this.getInstanceData().subscribe(async(data) => {
      //on convertie les données en tableau de lignes
      var lines = data.split('\n');

      this.cityCount = Number(lines[0]);
      //on coupe les villes non utilisées par l'instance pour ne pas surcharger l'interface et éviter les bugs liées au parcours des villes
      this.instance.cities = this.instance.cities.slice(0, this.cityCount);

      this.cohorteCount = Number(lines[1]);
      var cohorteCityLine = lines[2].split('\t');
      var cohortePatientCountLine = lines[3].split('\t');
      for (var i = 0; i < this.cohorteCount; i++){
        var villeId = Number(cohorteCityLine[i]);
        this.instance.cities[villeId].cohorte = true;
        this.instance.cohortes.push(new Cohorte(
          Number(cohortePatientCountLine[i]),
          this.instance.cities[villeId]
          ));
      }

      this.typeCount = Number(lines[4]);
      if(this.instance.typeNames.length > this.typeCount)
        this.instance.typeNames = this.instance.typeNames.slice(this.typeCount);
      this.tubeCount = Number(lines[5]);

      this.instance.cohortes.forEach((cohorte, i) =>
        this.instance.typeNames.forEach((typeName, j) => {
          var newType: Type = new Type(typeName, cohorte);
          cohorte.types.push(newType);

          //la ligne contenant les volume des tubes du type
          lines[6+i*this.cohorteCount+j]
          //on en fait un tableau
          .split('\t')
          //on retire le retour chariot du tableau
          .slice(0,this.typeCount)
          //et on la parcourt
          .forEach((volume, k) => 
            newType.tubes.push(new Tube(
              k+1,
              Number(volume),
              newType,
              this.instance.solution!))
          );
        })
      );
      
      //borne inférieur à partir de laquelle on passe aux demandes
      var lowerBound: number = 6+this.typeCount*this.cohorteCount;

      var demandes: string[] = lines.slice(lowerBound,lowerBound + this.cityCount);
      await this.parseDemandes(demandes);

      var afterDemandes = lines.slice(lowerBound + this.cityCount);
      this.instance.maxFreezes = Number(afterDemandes[0]);

      await this.parseSolution();
      
      finish = true;
    });

    //permet d'attendre que l'execution soit terminée pour que tout se déroulent dans l'ordre
    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async parseTypes(): Promise<void>{
    var finish: boolean = false;

    this.getTypesData().subscribe(data =>{
      //transforme le fichier en un tableau de string
      this.instance.typeNames = data.split('\r\n');

      finish = true;
    });

    //permet d'attendre que l'execution soit terminée pour que tout se déroulent dans l'ordre
    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Initialise la solution de l'instance en parsant le fichier solution
   */
  private async parseSolution(): Promise<void>{
    var finish: boolean = false;

    //permet de passer les premières lignes (redondance des données)
    var separator: number = this.cohorteCount*this.typeCount*this.tubeCount;

    this.getInstanceSolutionData().subscribe(data =>{
      this.instance.solution = new Solution(this.instance);
      //transforme le fichier en un tableau de string
      var lines: string[] = data.split('\n');

      //on parse les lignes contenant les villes visitées par chaque tube
      this.parseTubesCities(lines.slice(0, separator));

      //on retire les lignes déjà traité
      lines = lines.slice(separator);

      //l'index de la ligne en cours de traitement
      var curLineIndex: number = 0;

      for(let cohorte of this.instance.cohortes)
        for(let type of cohorte.types)
          for(let tube of type.tubes){
            //la première lignes pour chaque tube contient le nombres d'arcs de ce tube
            const arcCount: number = Number(lines[curLineIndex++]);

            //la liste des id des origines et destinations pour chaque arc du tube
            const arcLines: string[] = lines.slice(curLineIndex,curLineIndex+arcCount);

            this.parseTubeArcs(tube, arcLines);

            //on passe toutes les lignes que l'on vient d'utiliser
            curLineIndex += arcCount;
          }
          
      this.caculateArcsQuantities();
      finish = true;
    });

    //permet d'attendre que l'execution soit terminée pour que tout se déroulent dans l'ordre
    while(!finish)
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Parse la liste des arcs d'un tube pour créer les objets correspondants et les ajouter à la liste tube.arcs.
   * @param tube Le tube dont on souhaite parser les arcs.
   * @param arcLines La liste contenant les id de l'origine et de la destination de chaque arc du tube.
   */
  private parseTubeArcs(tube: Tube, arcLines: string[]): void{
    for(let arcLine of arcLines){
      var split: string[] = arcLine.split('\t');

      //villes de départ et d'arrivée de l'arc
      var orig: City = this.findCityById(Number(split[0]));
      var dest: City = this.findCityById(Number(split[1]));

      //couleur de la polyline de l'arc
      var color = this.colors[tube.number!-1];

      //polyline de l'arc (élément visuel affiché sur la carte)
      var polyline = this.arcService.createPolyline(orig, dest,color);
      
      var arc = new Arc(polyline,orig,dest,tube);
      tube.arcs.push(arc);
    }
  }

  /**
   * Initialise les villes associées à chaque tube en parsant les lignes en entrées.
   * @param lines Les lignes contenants les villes parcourues par les tubes (les premières lignes du fichier solution) sous forme d'un tableau de string.
   */
  private parseTubesCities(lines: string[]): void{
    var tubeNum: number = 0;
    for(let cohorte of this.instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes){
          for(let id of lines[tubeNum++].split("\t").slice(4))
            tube.cities.push(this.findCityById(Number(id)));
          if(tube.cities.includes(cohorte.city))
            tube.usedByCohorte = true;
        }
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
   * Initialise la liste des demandes en parsant le texte fourni
   * @param lines Les lignes à parser sous forme de tableau de string
   */
  private parseDemandes(lines: string[]): void{
    this.instance.cities.forEach((city, i) =>
      this.instance.typeNames.forEach((typeName, j) => 
        city.demandes.set(typeName,Number(lines[i].split('\t')[j]))
        )
    );
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
