export interface Cohorte {
    nbPatients: number | undefined,
    city: string,
    types: Type[]
}
    
export interface Type {
    name: string,
    tubes: Tube[]
}

export interface Tube {
    number: number | undefined,
    volume: number | undefined,
    envoi: any[]
}

export interface CustomPolyline {
    polyline: L.Polyline,
    origin: string,
    destination: string,
    index: number
}