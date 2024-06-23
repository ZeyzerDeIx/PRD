import { Injectable } from '@angular/core';
import { Tube, Instance, Arc, Type, Cohorte, City } from '../include/modelClasses';
import { InstanceService } from './instance.service';
import { ArcService } from './arc.service';

@Injectable({
  providedIn: 'root'
})
export class SolutionService {
  /**
   * Variable contenant le message "Ok !", signifiant qu'il n'y a pas d'erreure.
   */
  private readonly noErrorMessage: string = "Ok !";

  constructor(private instanceService: InstanceService, private arcService: ArcService) { }

  /**
   * Vérifie si la solution modifiée par l'utilisateur reste faisable (i.e. chaque ville est bien desservie par une seule autre ville)
   */
  checkSolution(instance: Instance): boolean{
    var error = this.noErrorMessage;

    for(let city of instance.cities){
      if(city.incomming_arcs.length > 1){
        error = this.checkIncommingArcs(city.incomming_arcs);
        if(error != this.noErrorMessage) return this.printError(error);
      }
    }

    //on parcours chaque tube de chaque type de chaque cohorte
    for(let cohorte of instance.cohortes){
      for(let type of cohorte.types){
        var tubeUsedByCohorteCount: number = 0;
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
          if(this.instanceService.requiredVolumeByTube(cohorte.city, tube) > tube.volume)
            return this.printError(
              "Le tube n°"+tube.number+" du type "+type.name+" de la cohorte "+cohorte.city.name+" ne peut pas assumer le volume demandé.\nVolume du tube: "+tube.volume+"\nVolume demandé: "+this.instanceService.requiredVolumeByTube(cohorte.city, tube)
              );

          //on vérifie que la cohorte ne prélève pas plusieurs tubes par type
          if(tube.usedByCohorte && ++tubeUsedByCohorteCount > 1)
            return this.printError(
              "Il y a plusieurs tubes de type "+type.name+" prélevés par la cohorte "+cohorte.city.name+".\nMerci d'en choisir un seul."
              );
        }
        //on vérifie que la cohorte prélève bien un tube
        if(tubeUsedByCohorteCount == 0)
          return this.printError(
            "La cohorte "+cohorte.city.name+" ne prélève aucun tube du type "+type.name+". Sa demande n'est donc pas satisfaite."
            );
      }
      error = this.checkFreezesCount(instance.maxFreezes, cohorte, instance.cities);
      if(error != this.noErrorMessage) return this.printError(error);
      error = this.checkDemandesSatisfied(cohorte, instance.cities);
      if(error != this.noErrorMessage) return this.printError(error);
    }

    return true;
  }

  /**
   * Vérifie que les arcs entrants d'une ville remplissent bien le critère suivant:
   * Les arcs entrants proviennent tous de tubes différents.
   * @param arcs La liste des arcs entrants de la ville
   * @returns Un message d'erreur si une des condition n'est pas respéctée, sinon le message contient "Ok !".
   */
  private checkIncommingArcs(arcs: Arc[]): string{

    //on vérifie que tous les arcs proviennent bien de types différents (par cohorte)
    var types: Type[] = [];
    for(let arc of arcs){
      if(types.includes(arc.tube.type))
        return arc.destination.name + " est la destination de plusieurs flux d'un même type ( " + arc.tube.type.name + " ) en provenance de la cohorte " + arc.tube.type.cohorte.city.name + ".\nCela est interdit.";

      types.push(arc.tube.type);
    }
    return this.noErrorMessage;
  }

  /**
   * Vérifie si les demandes de chaque type de chaque ville sont satisfaites par la cohorte en entrée.
   * @param cohorte La cohorte à contrôler.
   * @param cities La liste des villes de l'instance.
   * @returns Le message d'erreur s'il y en a une, "Ok !" sinon.
   */
  private checkDemandesSatisfied(cohorte: Cohorte, cities: City[]): string{
    for(let city of cities)
      for(let type of cohorte.types){
        var path: boolean = false;
        for(let tube of type.tubes)
          if(!(city.demandes.get(type.name) != 0 && !this.arcService.pathExists(cohorte.city, city, tube)))
            path = true;
          if(!path)
            return city.name + " n'est pas desservie par la cohorte " + cohorte.city.name + " en type " + type.name + ".\nCela est interdit.";
      }
    
    return this.noErrorMessage;
  }

  /**
   * Vérifie que toutes les villes du tube respectent bien le nombre de congélation max.
   *
   * @param maxFreezes Le nombre de congélations maximum.
   * @param cohorte La cohorte.
   * @param cities Toutes les villes de l'instance.
   * @returns Le message d'erreur s'il y en a une, "Ok !" sinon.
   */
  private checkFreezesCount(maxFreezes: number, cohorte: Cohorte, cities: City[]): string{
    for(let city of cities)
      for(let type of cohorte.types)
        for(let tube of type.tubes){
          var path: Arc[] = this.arcService.findPath(cohorte.city, city, tube);
          if(path.length > maxFreezes)
            return "Le chemin entre la cohorte"+cohorte.city.name+" et "+city.name+" dépasse les "+maxFreezes+" congélations.\nCela est interdit.";
        }
    return this.noErrorMessage;
  }

  /**
   * Affiche un message d'erreur quand l'utilisateur essaie de sauvegarder une solution infaisable.
   * @param error Message d'erreur à afficher.
   * @returns Systématiquement false, car si une erreur est affichée, c'est que checkSolution retourne false.
   */
  printError(error: string): boolean{
    error = "Sauvegarde impossible:\n"+ error;
    console.error(error);
    alert(error);
    return false;
  }
}
