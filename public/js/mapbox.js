export const displayMap = locations => {
    mapboxgl.accessToken = 
'pk.eyJ1Ijoic29sb2tpbmcyIiwiYSI6ImNrYnNnZ201bDAxZHAzN3NmMXRxcmNoNzgifQ.XZM0GyaV1db0AdEX_l8vaw';
var map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/soloking2/ckbsgq16j77ar1ipiuqyiatbc',
scrollZoom: false
// center: [-118.113491, 34.111745],
// zoom: 10
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'

    }).setLngLat(loc.coordinates).addTo(map);

    // Add popup
    new mapboxgl.Popup(
        {
            offset: 30
        }
    ).setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map)
    // extends map bound to include current location
    bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
    }
});
}

