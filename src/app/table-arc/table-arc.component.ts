import { ArcService } from '../services/arc.service';
import { InstanceService } from '../services/instance.service';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NgIf } from '@angular/common';
import { LatLngExpression } from 'leaflet';
import { Arc, Instance, City, Tube, Type } from '../include/modelClasses';
import { DataService } from '../services/data.service';

/**
 * TableArcComponent gère la modification des arcs pour chaque tube
 */
@Component({
  selector: 'app-table-arc',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, MatTableModule, MatPaginator, NgIf,  MatButtonModule],
  templateUrl: './table-arc.component.html',
  styleUrl: './table-arc.component.scss'
})
export class TableArcComponent implements AfterViewInit{

  /**
   * Variable pour les titres des colonnes de l'objet MatTable
   */
  displayedColumns: string[] = ['origin', 'destination', 'quantity', 'delete'];

  /**
   * Variable contenant les données des arcs pour remplir l'objet MatTable
   */
  dataSource!: MatTableDataSource<Arc>;

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = this.instanceService.getInstance();

  /**
   * Tableau d'Arc contenant la liste des arcs 
   */
  polylineArray: Arc[] = [];

  /**
   * Le paginateur du composant
   */
  @ViewChild('paginator') paginator!: MatPaginator;

  /**
   * Taille du tableau d'arcs
   */
  totalRecords = 0;

  /**
   * Nombre d'arcs par page du tableau d'arcs
   */
  pageSize = 6;

  /**
   * Numéro de la page du tableau d'arcs
   */
  pageIndex = 0;

  /**
   * Booléen pour contrôler l'affichage des boutons Sauvegarder et +
   */
  tableIsActive = false;

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Instance
   * @param arcService Service permettant de créér les arcs
   */
  constructor(private arcService:ArcService, private instanceService:InstanceService, private dataService: DataService){
  }

  /**
   * Modifie le style d'un arc quand on passe la souris sur la ligne associée dans le tableau d'arcs
   * @param data Arc à modifier
   */
  mouseOverArc(data: Arc){
    data.polyline.setStyle({
      weight: 6,
      opacity: 1
    })
  }

  /**
   * Réinitialise le style d'un arc quand on enlève la souris de la ligne associée dans le tableau d'arcs
   * @param data Arc à réinitialiser
   */
  mouseOutArc(data: Arc){
    data.polyline.setStyle({
      weight: 4,
      opacity: 0.5
    })
  }

  /**
   * Met à jour la destination de l'arc.
   * @param arc L'arc dont on veut changer la destination.
   * @param newDestName Le nom de la nouvelle ville de destination.
   */
  public arcDestChange(arc: Arc, newDestName: string): void{
    var newDest: City = this.instanceService.findCityByName(newDestName);
    this.arcService.setArcDestination(arc, newDest);
    this.arcChange(arc);
  }

  /**
   * Met à jour l'origine de l'arc.
   * @param arc L'arc dont on veut changer l'origine.
   * @param newOrigName Le nom de la nouvelle ville d'origine.
   */
  public arcOrigChange(arc: Arc, newOrigName: string): void{
    var newOrig: City = this.instanceService.findCityByName(newOrigName);
    this.arcService.setArcOrigin(arc, newOrig);
    this.arcChange(arc);
  }

  /**
   * Modifie l'arc dessiné sur la carte avec les valeurs sélectionnées dans le tableau d'arcs
   * @param index: Indice de l'arc à modifier
   */
  private arcChange(arc: Arc){
    const citiesPos = this.instanceService.getCitiesPosition();

    const orig: number[] = citiesPos.get(arc.origin.name)!;
    const dest: number[] = citiesPos.get(arc.destination.name)!;

    const newOrigCoord: LatLngExpression = [orig[0], orig[1]];
    const newDestCoord: LatLngExpression = [dest[0], dest[1]];

    const newCoords: LatLngExpression[] = [newOrigCoord, newDestCoord];

    this.arcService.modifyArc(arc, newCoords);

    this.dataService.tubeUpdated();
  }

  /**
   * Supprime un arc de la liste et de tous les endroits où il est référencé.
   * @param arc L'arc à supprimer. 
   */
  public deleteArc(arc: Arc){
    this.arcService.deleteArc(arc);
    this.dataService.tubeUpdated();
  }

  /**
   * Fait le minimum entre les deux entrées.
   * @param a Premier nombre
   * @param b Second nombre
   * @returns Le minimum des deux nombres en entrée.
   */
  min(a:number, b:number): number{
    return a>b? b: a;
  }

  /**
   * Créer un nouvel arc reliant la cohorte du tube à elle même.
   */
  addArc(){

    const citiesPos = this.instanceService.getCitiesPosition();
    const co: City = this.arcService.getCohorteCity();
    const coPos: number[] = citiesPos.get(co.name)!;
    const newCoord: LatLngExpression = [coPos[0], coPos[1]];
    const tube: Tube = this.dataService.getSelectedTube();
    const color = this.instanceService.colors[tube.number-1];
    const polyline = this.arcService.createPolyline(co, co, color, citiesPos);
    
    var arc = new Arc(polyline,co,co,tube);
    arc.polyline.setLatLngs([newCoord, newCoord]);
    this.arcService.addArc(arc);

    this.dataService.tubeUpdated();
  }

  // TODO : La fonction marche mais elle ne fait que afficher le résultat dans la console
  /**
   * Vérifie si la solution modifiée par l'utilisateur reste faisable (i.e. chaque ville est bien desservie par une seule autre ville)
   */
  checkSolution(){
    var error = "Ok !"

    for(let city of this.instance.cities){
      if(city.incomming_arcs.length > 1){
        error = this.checkIncommingArcs(city.incomming_arcs);
        if(error != "Ok !") return this.printError(error);
      }
    }

    //on parcours chaque tube de chaque type de chaque cohorte
    for(let cohorte of this.instance.cohortes){
      for(let type of cohorte.types){
        var nbUsedByCohorteTube: number = 0;
        for(let tube of type.tubes){
          //on vérifie qu'aucun arc du tube n'a pour destination sa cohorte ou son origine
          for(let arc of tube.arcs){
            //l'arc a pour destination son origine
            if(arc.destination == arc.origin)
              return this.printError(
                "Un arc du tube n°"+tube.number+" du type "+type.name+" de la cohorte "+cohorte.city.name+" a pour destination et origine la même ville ("+arc.destination.name+").\nCela est interdit."
                );
            //l'arc a pour destination sa cohorte
            if(arc.destination == cohorte.city)
              return this.printError(
                "Un arc du tube n°"+tube.number+" du type "+type.name+" de la cohorte "+cohorte.city.name+" a pour destination "+cohorte.city.name+" qui est la ville cohorte d'origine du tube.\nCela est interdit."
                );
          }

          //on vérifie que le tube peut assumer le volume demandé
          if(this.instanceService.requiredVolumeByTubeRecursive(cohorte.city, tube) > tube.volume){
            return this.printError(
              "Le tube n°"+tube.number+" du type "+type.name+" de la cohorte "+cohorte.city.name+" ne peut pas assumer le volume demandé.\nVolume du tube: "+tube.volume+"\nVolume demandé: "+this.instanceService.requiredVolumeByTubeRecursive(cohorte.city, tube)
              );
          }

          if(tube.usedByCohorte && ++nbUsedByCohorteTube > 1)
            return this.printError(
              "Il y a plusieurs tubes de type "+type.name+" prélevés par la cohorte "+cohorte.city.name+".\nMerci d'en choisir un seul."
              );
        }
      }
    }
    
    alert("La solution a été sauvegardé avec succès!");
  }

  /**
   * Vérifie que les arcs entrants d'une ville remplissent bien les deux critères suivants:
   * <ul>
   * <li>Les arcs entrants proviennent tous de tubes différents.</li>
   * <li>Au moins un des arcs entrant peut satisfaire pleinement la demande.</li>
   * </ul>
   * @param arcs La liste des arcs entrants de la ville
   * @returns Un message d'erreur si une des condition n'est pas respéctée, sinon le message contient "Ok !".
   */
  private checkIncommingArcs(arcs: Arc[]): string{

    //on commence par vérifier que tous les arcs proviennent bien de types différents (par cohorte)
    var types: Type[] = [];
    for(let arc of arcs){
      if(types.includes(arc.tube.type))
        return arc.destination.name + " est la destination de plusieurs flux d'un même type ( " + arc.tube.type.name + " ) en provenance de la cohorte "+ arc.tube.type.cohorte.city.name +".\nCela est interdit.";

      types.push(arc.tube.type);
    }
    return "Ok !";
  }

  /**
   * Affiche un message d'erreur quand l'utilisateur essaie de sauvegarder une solution infaisable
   * @param error Message d'erreur à afficher
   */
  printError(error: string){
    console.error(error);
    alert(error);
  }

  /**
   * Initialise toutes les valeurs du composant
   */
  ngAfterViewInit(){
    this.arcService.polylineUpdated.subscribe(
      (polylineArray) => {
        this.polylineArray = polylineArray;

        //TODO à remplacer par un ErrorService et un composant d'affichage
        try{
          this.instanceService.caculateArcsQuantities();
        } catch(error: any){
          console.error("Impossible de calculer les flux des arcs!");
        }

        this.arcService.drawPolylines(polylineArray);

        this.dataSource = new MatTableDataSource<Arc>(polylineArray);
        this.totalRecords = this.polylineArray.length;
        this.dataSource.paginator = this.paginator;

        this.tableIsActive = (this.dataService.getSelectedTube().number != -1);
      }
    );
  }
}