/**
 * Interface pour une cohorte
 */
export interface Cohorte {
    /**
     * Nombre de patients de la cohorte
     */
    nbPatients: number | undefined,

    /**
     * Ville de départ de la cohorte
     */
    city: City,

    /**
     * Types de tube de la cohorte
     */
    types: Type[]
}

/**
 * Interface pour un type de tube
 */
export interface Type {
    /**
     * Nom du type de tube
     */
    name: string,

    /**
     * Tableau de Tube associés au type
     */
    tubes: Tube[],

    /**
     * Cohorte à laquelle est associée le type
     */
    cohorte: Cohorte
}

/**
 * Interface pour un tube / échantillon sanguin / prélèvement
 */
export interface Tube {
    /**
     * Numéro du tube
     */
    number: number,

    /**
     * Volume / quantité du tube
     */
    volume: number,

    /**
     * Liste d'arcs associés au tube
     */
    arcs: Arc[],

    /**
     * type du tube
     */
    type: Type
}

/**
 * Interface pour un arc
 */
export interface Arc {
    /**
     * Objet Polyline de Leaflet, i.e. l'arc dessiné sur la carte
     */
    polyline: L.Polyline,

    /**
     * Nom de la ville de départ 
     */
    origin: City,

    /**
     * Nom de la ville d'arrivée 
     */
    destination: City,

    /**
     * Numéro de l'arc
     */
    index: number,

    /**
     * Flux envoyé de la ville origin à la ville destination
     */
    quantity: number,

    /**
     * Tube auquel est rattaché l'arc
     */
    tube: Tube
}

/**
 * Interface pour une ville
 */
export interface City {
    /**
     * Nom de la ville
     */
    name: string,

    /**
     * Indice de la ville
     */
    id: number,

    /**
     * Indique si la ville est une cohorte ou non
     */
    cohorte: boolean
}

/**
 * Interface pour l'instance
 */
export interface Instance {
    /**
     * Tableau des villes de l'instance
     */
    cities: City[],

    /**
     * Types de tube de l'instance
     */
    types: string[],

    /**
     * Cohortes de l'instance
     */
    cohortes: Cohorte[],

    /**
     * Demande de chaque type de tube pour chaque ville
     */
    demande: Map<string, Map<string, number>>;
}