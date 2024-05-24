import { Injectable } from '@angular/core';
import { Tube, Instance, Arc, Type, Cohorte, City } from '../include/modelClasses';
import { InstanceService } from './instance.service';

@Injectable({
  providedIn: 'root'
})
export class SolutionService {
  constructor(private instanceService: InstanceService) { }

  /**
   * Vérifie si la solution modifiée par l'utilisateur reste faisable (i.e. chaque ville est bien desservie par une seule autre ville)
   */
  checkSolution(instance: Instance): boolean{
    var error = "Ok !"

    for(let city of instance.cities){
      if(city.incomming_arcs.length > 1){
        error = this.checkIncommingArcs(city.incomming_arcs);
        if(error != "Ok !") return this.printError(error);
      }
    }

    //on parcours chaque tube de chaque type de chaque cohorte
    for(let cohorte of instance.cohortes){
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
          if(this.instanceService.requiredVolumeByTube(cohorte.city, tube) > tube.volume){
            return this.printError(
              "Le tube n°"+tube.number+" du type "+type.name+" de la cohorte "+cohorte.city.name+" ne peut pas assumer le volume demandé.\nVolume du tube: "+tube.volume+"\nVolume demandé: "+this.instanceService.requiredVolumeByTube(cohorte.city, tube)
              );
          }

          if(tube.usedByCohorte && ++nbUsedByCohorteTube > 1)
            return this.printError(
              "Il y a plusieurs tubes de type "+type.name+" prélevés par la cohorte "+cohorte.city.name+".\nMerci d'en choisir un seul."
              );
        }
      }
      error = this.checkDemandesSatisfied(cohorte, instance.cities);
      if(error != "Ok !") return this.printError(error);
    }

    return true;
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
        return arc.destination.name + " est la destination de plusieurs flux d'un même type ( " + arc.tube.type.name + " ) en provenance de la cohorte " + arc.tube.type.cohorte.city.name + ".\nCela est interdit.";

      types.push(arc.tube.type);
    }
    return "Ok !";
  }

  /**
   * Vérifie si les demandes de chaque type de chaque ville sont satisfaites par la cohorte en entrée.
   * @param cohorte La cohorte à contrôler.
   * @param cities La liste des villes de l'instance.
   * @returns Le message d'erreur s'il y en a une, "Ok !" sinon.
   */
  private checkDemandesSatisfied(cohorte: Cohorte, cities: City[]): string{
    for(let type of cohorte.types)
      for(let city of cities)
        if(city.demandes.get(type.name) != 0 && !this.pathExists(cohorte.city, city, type))
          return city.name + " n'est pas desservie par la cohorte " + cohorte.city.name + " en type " + type.name + ".\nCela est interdit.";
    return "Ok !";
  }

  /**
   * Vérifie qu'il existe bien un chemin entre la ville a et la ville b.
   * @param a Départ du chemin.
   * @param b Arrivé du chemin.
   * @returns true si le chemin existe, false sinon.
   */
  private pathExists(a: City, b: City, type: Type): boolean{
    if(a == b) return true;
    for(let arc of a.outgoing_arcs)
      if(arc.tube.type == type && (arc.destination == b || this.pathExists(arc.destination, b, type)))
        return true;
    return false;
  }

  /**
   * Affiche un message d'erreur quand l'utilisateur essaie de sauvegarder une solution infaisable
   * @param error Message d'erreur à afficher.
   */
  printError(error: string): boolean{
    console.error(error);
    alert(error);
    return false;
  }
}
