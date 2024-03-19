import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ArcService {

  private cohorteCity: string = "";
  private polylineArray: any[] = [];
  polylineUpdated:EventEmitter<any[]> = new EventEmitter();
  constructor() { }

  getCohorteCity(): string{
    return this.cohorteCity;
  }

  setCohorteCity(newCity: string){
    this.cohorteCity = newCity
  }

  setPolylineArray(data:any[]){
    //console.log(data);
    this.polylineArray = data;
    this.polylineUpdated.emit(this.polylineArray);
  }

  getPolylineArray(): any[]{
    return this.polylineArray;
  }
}
