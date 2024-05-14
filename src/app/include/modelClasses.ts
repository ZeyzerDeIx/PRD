import L, { Marker } from 'leaflet';

/**
 * Interface pour une cohorte
 */
export class Cohorte {
    /**
     * Nombre de patients de la cohorte
     */
    nbPatients: number | undefined;

    /**
     * Ville de départ de la cohorte
     */
    city: City;

    /**
     * Types de tube de la cohorte
     */
    types: Type[];

    constructor(nbPatients: number | undefined = undefined, city: City = new City(), types: Type[] = []) {
        this.nbPatients = nbPatients;
        this.city = city;
        this.types = types;
    }
}

/**
 * Interface pour un type de tube
 */
export class Type {
    /**
     * Nom du type de tube
     */
    name: string;

    /**
     * Tableau de Tube associés au type
     */
    tubes: Tube[];

    /**
     * Cohorte à laquelle est associée le type
     */
    cohorte: Cohorte;

    constructor(name: string = '', tubes: Tube[] = [], cohorte: Cohorte = new Cohorte()) {
        this.name = name;
        this.tubes = tubes;
        this.cohorte = cohorte;
    }
}

/**
 * Interface pour un tube / échantillon sanguin / prélèvement
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

    /**
     * type du tube
     */
    type: Type;

    /**
     * Nombre d'alicotage du tube
     */
    nbAlico: number;

    solution: Solution;

    constructor(number: number = -1, volume: number = 0, consumed: number = 0, arcs: Arc[] = [], cities: City[] = [], type: Type = new Type(), solution: Solution = new Solution(), nbAlico: number = 0) {
        this.number = number;
        this.volume = volume;
        this.consumed = consumed;
        this.arcs = arcs;
        this.cities = cities;
        this.type = type;
        this.solution = solution;
        this.nbAlico = nbAlico;
    }
}

/**
 * Interface pour un arc
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

    constructor(polyline: L.Polyline, origin: City = new City(), destination: City = new City(), quantity: number = 0, tube: Tube = new Tube()) {
        this.polyline = polyline;
        this.origin = origin;
        this.destination = destination;
        this.quantity = quantity;
        this.tube = tube;
    }
}

/**
 * Interface pour une ville
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
     * Tableau des arcs partants de la ville
     */
    arcs: Arc[];

    /**
     * Indique si la ville est selectionnée (seulement pour les cohortes)
     */
    selected: boolean;

    /**
     * Marqueur de la ville sur la carte
     */
    marker: L.Marker|null;

    constructor(name: string = '', id: number = 0, cohorte: boolean = false, arcs: Arc[] = [], selected: boolean = false, marker = null) {
        this.name = name;
        this.id = id;
        this.cohorte = cohorte;
        this.arcs = arcs;
        this.selected = selected;
        this.marker = marker;
    }
}

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
 * Interface pour l'instance
 */
export class Instance {
    /**
     * Tableau des villes de l'instance
     */
    cities: City[];

    /**
     * Types de tube de l'instance
     */
    types: string[];

    /**
     * Cohortes de l'instance
     */
    cohortes: Cohorte[];

    /**
     * Solution de l'instance
     */
    solution: Solution | null;

    /**
     * Demande de chaque type de tube pour chaque ville
     */
    demande: Map<string, Map<string, number>>;

    constructor(
        cities: City[] = [],
        types: string[] = [],
        cohortes: Cohorte[] = [],
        solution: Solution | null = null,
        demande: Map<string, Map<string, number>> = new Map()
    ) {
        this.cities = cities;
        this.types = types;
        this.cohortes = cohortes;
        this.solution = solution;
        this.demande = demande;
    }
}