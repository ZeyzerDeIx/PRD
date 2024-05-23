import L, { Marker, LatLngExpression } from 'leaflet';

/**
 * Classe modèle représentant une cohorte
 */
export class Cohorte {
    /**
     * Nombre de patients de la cohorte
     */
    patientCount: number | undefined;

    /**
     * Ville de départ de la cohorte
     */
    city: City;

    /**
     * Types de tube de la cohorte
     */
    types: Type[];

    constructor(patientCount: number | undefined = undefined, city: City = new City(), types: Type[] = []) {
        this.patientCount = patientCount;
        this.city = city;
        this.types = types;
    }
}

/**
 * Classe modèle représentant un type de tube
 */
export class Type {
    /**
     * Nom du type de tube
     */
    name: string;

    /**
     * Cohorte à laquelle est associée le type
     */
    cohorte: Cohorte;

    /**
     * Tableau de Tube associés au type
     */
    tubes: Tube[];

    constructor(name: string = '', cohorte: Cohorte = new Cohorte(), tubes: Tube[] = []) {
        this.name = name;
        this.cohorte = cohorte;
        this.tubes = tubes;
    }
}

/**
 * Classe modèle représentant un tube / échantillon sanguin / prélèvement
 */
export class Tube {
    /**
     * Numéro du tube
     */
    number: number;

    /**
     * Volume / quantité du tube
     */
    volume: number;

    /**
     * type du tube
     */
    type: Type;

    /**
     * Solution rattachée au tube
     */
    solution: Solution;

    /**
     * Nombre d'alicotage du tube
     */
    nbAlico: number;

    /**
     * Vrai si la cohorte de départ du tube se sert dedans avant expédition, faux sinon
     */
    usedByCohorte: boolean;

    /**
     * Volume consommé
     */
    consumed: number;

    /**
     * Liste d'arcs associés au tube
     */
    arcs: Arc[];

    /**
     * Liste des villes associées au tube
     */
    cities: City[];

    constructor(
        number: number = -1,
        volume: number = 0,
        type: Type = new Type(),
        solution: Solution = new Solution(),
        nbAlico: number = 0,
        usedByCohorte: boolean = false,
        consumed: number = 0,
        arcs: Arc[] = [],
        cities: City[] = []
    ) {
        this.number = number;
        this.volume = volume;
        this.type = type;
        this.solution = solution;
        this.nbAlico = nbAlico;
        this.usedByCohorte = usedByCohorte;
        this.consumed = consumed;
        this.arcs = arcs;
        this.cities = cities;
    }
}

/**
 * Classe modèle représentant un arc
 */
export class Arc {
    /**
     * Objet Polyline de Leaflet, i.e. l'arc dessiné sur la carte
     */
    polyline: L.Polyline;

    /**
     * Nom de la ville de départ 
     */
    origin: City;

    /**
     * Nom de la ville d'arrivée 
     */
    destination: City;

    /**
     * Flux envoyé de la ville origin à la ville destination
     */
    quantity: number;

    /**
     * Tube auquel est rattaché l'arc
     */
    tube: Tube;

    constructor(polyline: L.Polyline, origin: City = new City(), destination: City = new City(), tube: Tube = new Tube(), quantity: number = 0) {
        this.polyline = polyline;
        this.origin = origin;
        this.destination = destination;
        this.tube = tube;
        this.quantity = quantity;
        this.origin.outgoing_arcs.push(this);
        this.destination.incomming_arcs.push(this);
    }
}

/**
 * Classe modèle représentant une ville
 */
export class City {
    /**
     * Nom de la ville
     */
    name: string;

    /**
     * Indice de la ville
     */
    id: number;

    /**
     * Indique si la ville est une cohorte ou non
     */
    cohorte: boolean;

    /**
     * Tableau des arcs sortants de la ville
     */
    outgoing_arcs: Arc[];

    /**
     * Tableau des arcs entrants de la ville
     */
    incomming_arcs: Arc[];

    /**
     * Marqueur de la ville sur la carte
     */
    marker: L.Marker|null;

    /**
     * Demandes de la ville par type de tube.
     */
    demandes: Map<string, number>;

    /**
     * Position en degrés.
     */
    position: LatLngExpression;

    constructor(name: string = '',
        id: number = 0,
        cohorte: boolean = false,
        outgoing_arcs: Arc[] = [],
        incomming_arcs: Arc[] = [],
        marker: L.Marker|null = null,
        demandes: Map<string, number> = new Map(),
        position: LatLngExpression = [0,0]
    ) {
        this.name = name;
        this.id = id;
        this.cohorte = cohorte;
        this.outgoing_arcs = outgoing_arcs;
        this.incomming_arcs = incomming_arcs;
        this.marker = marker;
        this.demandes = demandes;
        this.position = position;
    }
}

/**
 * Classe modèle représentant une solution de l'instance
 */
export class Solution {

    /**
     * Instance à laquelle est rattachée la solution
     */
    instance: Instance | null;

    /**
     * Nombre d'alicotage
     */
    nbAlico: number;

    constructor(instance: Instance | null = null, nbAlico: number = 0) {
        this.instance = instance;
        this.nbAlico = nbAlico;
    }
}

/**
 * Classe modèle représentant l'instance
 */
export class Instance {
    /**
     * Tableau des villes de l'instance
     */
    cities: City[];

    /**
     * Types de tube de l'instance
     */
    typesName: string[];

    /**
     * Cohortes de l'instance
     */
    cohortes: Cohorte[];

    /**
     * Solution de l'instance
     */
    solution: Solution | null;

    /**
     * Nombre de congélations maximum de l'instance
     */
    maxFreezes: number;

    constructor(
        cities: City[] = [],
        typesName: string[] = [],
        cohortes: Cohorte[] = [],
        solution: Solution | null = null,
        maxFreezes: number = 0
    ) {
        this.cities = cities;
        this.typesName = typesName;
        this.cohortes = cohortes;
        this.solution = solution;
        this.maxFreezes = maxFreezes;
    }
}