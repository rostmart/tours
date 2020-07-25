//js file which is integrated with html and which will run on client side (maps L185)

//function for importing mapbox to index.js
export const displayMap = (locations) => {
  // Code below copied from mapbox.com
  mapboxgl.accessToken = 'pk.eyJ1Ijoicm9zdG1hcnQiLCJhIjoiY2ticXh1aTRjMXhpYjJ4cDl6dWluZ3h1diJ9.9NtJe9z3S_UMtOVl5AOFnQ';
  var map = new mapboxgl.Map({
    // This code inserts a map in our code with #map id (L186)
    container: 'map',
    // The style we created in mapbox and pasted link here
    style: 'mapbox://styles/rostmart/ckbqzj72f182l1iofjye9hhxi',
    //disables zooming when coursor is on a map
    scrollZoom: false
    // Here we specify a center of a map (Where it should display its default view). Just an example of how it works
    //center: [-118.021863, 34.053454],
    //zoom: 5
  });

  // We need to show a map with all loations regarding one particular tour
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker'; //class marker is specified in css

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup (message on each location)
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extends map bounds to include current location
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
