import L from "leaflet";

/**
 * URL de l'icône par défaut
 */
const iconUrl = 'assets/images/marker-icon.png';

/**
 * URL de l'icône violette
 */
const iconVioletUrl = 'assets/images/marker-icon-violet.png';

/**
 * URL de l'icône jaune
 */
const iconYellowUrl = 'assets/images/marker-icon-yellow.png';

/**
 * URL de l'ombre de l'icône 
 */
const shadowUrl = 'assets/images/marker-shadow.png';

/**
 * Icône par défaut des marqueurs Leaflet
 */
export const iconDefault = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

/**
 * Icône pour le marqueur de la cohorte
 */
export const iconViolet = L.icon({
iconUrl : iconVioletUrl,
shadowUrl,
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
tooltipAnchor: [16, -28],
shadowSize: [41, 41]
});

/**
 * Icône pour le marqueur emphasize
 */
export const iconEmph = L.icon({
    iconUrl: iconYellowUrl,
    shadowUrl,
    iconSize: [30, 49], // Légèrement plus grand que [25, 41]
    iconAnchor: [15, 49], // Même proportion que iconSize
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
