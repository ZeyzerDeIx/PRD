import { ArcService } from '../arc.service';
import { InstanceService } from '../instance.service';
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
import { Arc, Instance, City, Tube } from '../include/modelClasses';
import { DataService } from '../data.service';

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
  pageSize = 4;

  /**
   * Numéro de la page du tableau d'arcs
   */
  pageIndex = 0;

  /**
   * Booléen pour contrôler l'affichage des boutons Sauvegarder et +
   */
  tableIsActive = false;

  // MatPaginator event
  pageEvent: PageEvent = new PageEvent();

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

  public arcDestChange(arc: Arc, newDestName: string): void{
    var newDest: City = this.instanceService.findCityByName(newDestName);
    this.arcService.setArcDestination(arc, newDest);
    this.arcChange(arc);
  }

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
  }

  public deleteArc(arc: Arc){
    this.arcService.deleteArc(arc);
  }

  min(a:number, b:number): number{
    return a>b? b: a;
  }

  addArc(){
    const citiesPos = this.instanceService.getCitiesPosition();
    const co: City = this.arcService.getCohorteCity();
    const coPos: number[] = citiesPos.get(co.name)!;
    const newCoord: LatLngExpression = [coPos[0], coPos[1]];
    const tube: Tube = this.dataService.getSelectedTube();
    const polylineColor = this.instanceService.colors[tube.number-1];
    const polyline = this.arcService.createPolyline(co, co, polylineColor, citiesPos);
    
    var arc = new Arc(polyline,co,co,this.polylineArray.length,tube);
    arc.polyline.setLatLngs([newCoord, newCoord]);
    this.arcService.addArc(arc);

    this.paginator.lastPage();
  }

  // TODO : La fonction marche mais elle ne fait que afficher le résultat dans la console
  /**
   * Vérifie si la solution modifiée par l'utilisateur reste faisable (i.e. chaque ville est bien desservie par une seule autre ville)
   */
  checkSolution(){
    var cohorteCity = this.arcService.getCohorteCity();
    var error = "Ok !"

    try{
      this.instanceService.caculateArcsQuantities();
    } catch(error: any){
      if(error instanceof Error)
        alert("La solution proposée n'est pas conforme. En conséquence, toutes les quantités des arcs ne sont pas actualisées.");
      else alert("Une erreur indeterminé s'est produite lors du calcul des quantités des arcs.");
    }
    /*if (this.selectedDestination.includes(cohorteCity.name)){
      error = "La ville cohorte ne peut pas être dans les villes d'arrivée";
      this.handleSaveErrors(error);
    }
    var nbOccurences = new Map<string, number>();
    this.cities.forEach(city => {
      nbOccurences.set(city, 0);
    });
    this.selectedDestination.forEach(city => {
      nbOccurences.set(city, nbOccurences.get(city)! + 1);
    });
    for (const city of this.cities){
      if(city != cohorteCity.name && nbOccurences.get(city) != 1){
        error = city + " ne doit apparaître qu'une seule et unique fois !"
        this.handleSaveErrors(error);
      }
    }
    for (var id = 0; id < this.selectedDestination.length; id++){
      if (this.selectedOrigin.at(id) == this.selectedDestination.at(id)){
        error = "Veuillez sélectionner une ville de départ et d'arivée différente pour chaque arc !"
        this.handleSaveErrors(error);
      }
    }*/
    
    if(error == "Ok !"){
      this.handleSaveErrors(error);
    }
  }

  /**
   * Affiche un message d'erreur quand l'utilisateur essaie de sauvegarder une solution infaisable
   * @param error Message d'erreur à afficher
   */
  handleSaveErrors(error: string){
    alert(error);
    console.log(error);
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