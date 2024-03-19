import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ArcService {

  private polylineArray: any[] = [];
  polylineUpdated:EventEmitter<any[]> = new EventEmitter();
  constructor() { }

  setPolylineArray(data:any[]){
    //console.log(data);
    this.polylineArray = data;
    this.polylineUpdated.emit(this.polylineArray);
  }

  getPolylineArray(): any[]{
    return this.polylineArray;
  }
}
