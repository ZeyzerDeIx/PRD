import L from "leaflet";

const iconUrl = 'assets/images/marker-icon.png';
const iconVioletUrl = 'assets/images/marker-icon-violet.png';
const shadowUrl = 'assets/images/marker-shadow.png';

export const iconDefault = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

export const iconViolet = L.icon({
iconUrl : iconVioletUrl,
shadowUrl,
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
tooltipAnchor: [16, -28],
shadowSize: [41, 41]
});