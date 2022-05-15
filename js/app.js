mapboxgl.accessToken = 'pk.eyJ1IjoicGFvbG9iYW5nIiwiYSI6ImNsMzJhaXVmdDFiMnkzam1ocmp1dWVsNmEifQ.EBuZ90AD89Lfg4YgtNV0ug';
/**
* Add the map to the page
*/
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-71.104081, 42.365554],
    zoom: 13
});

      async function render(){
        const locations = await getBusLocations();
        locations.forEach((bus, i)=> {
          bus.attributes.id = i;
          bus.attributes.coordinates = [bus.attributes.longitude,bus.attributes.latitude] 
        });

        buildBusesList(locations);
        addMarkers(locations);
      }


      async function run(){
        const lastLocation = await getBusLocations();
        lastLocation.forEach((curLc, i)=> {
          curLc.attributes.id = i;
          curLc.attributes.coordinates = [curLc.attributes.longitude,curLc.attributes.latitude]; 
          //console.log('Real Time ',new Date(), curLc.attributes.coordinates)
          updateList(curLc);
        });
        moveBus(lastLocation);
        setTimeout(run, 15000);
      }

      function addMarkers(locations) {
        /* For each feature in the GeoJSON object*/
        for (const marker of locations) {
          /* Create a div element for the marker. */
          const el = document.createElement('div');
          el.id = `marker-${marker.attributes.id}`;
          el.className = 'marker';        
          el.style.backgroundImage = `url(./assets/bus-${marker.attributes.id}.png)`;
          const name = `marker${marker.attributes.id}`;
          /**
          * Create a marker using the div element
          * defined above and add it to the map.
          **/
          window[name] = new mapboxgl.Marker(el, { offset: [0, -23] })
            .setLngLat(marker.attributes.coordinates)
            .addTo(map);
          /**
          * Listen to the element and when it is clicked, do three things:
          * 1. Fly to the point
          * 2. Close all other popups and display popup for clicked store
          * 3. Highlight listing in sidebar (and remove highlight for all other listings)
          **/
          el.addEventListener('click', (e) => {
            /* Fly to the point */
            flyToBus(marker);
            /* Close all other popups and display popup for clicked store */
            createPopUp(marker);
            /* Highlight listing in sidebar */
            const activeItem = document.getElementsByClassName('active');
                e.stopPropagation();
                if (activeItem[0]) {
                activeItem[0].classList.remove('active');
            }
            const listing = document.getElementById(
                `listing-${marker.attributes.id}`
            );
            
            listing.classList.add('active');
          });
          
          
        }
      }



      function moveBus(curLc){
        var size = Object.keys(curLc).length;
        for (let i = 0 ; i < size ; i++){
            const el = document.getElementById('marker-'+i);
            el.style.backgroundImage = `url(./assets/bus-${i}.png)`;
            const name = 'marker' + i;
            const marker = new mapboxgl.Marker(el)
            .setLngLat(curLc[i].attributes.coordinates)
            .addTo(map);
            //console.log(curLc[i].attributes.coordinates);
        }
        //console.log(`tamano object: ${size}`);
      }
      /**
       Add a listing for each bus to the sidebar.
      **/
      function buildBusesList(locations) {
        for (const bus of locations) {
          /* Add a new listing section to the sidebar. */
          const listings = document.getElementById('listings');
          const listing = listings.appendChild(document.createElement('div'));
          /* Assign a unique `id` to the listing. */
          listing.id = `listing-${bus.attributes.id}`;
          /* Assign the `item` class to each listing for styling. */
          listing.className = 'item';

          /* Add the link to the individual listing created above. */
          const link = listing.appendChild(document.createElement('a'));
          link.href = '#';
          link.className = 'title';
          link.id = `link-${bus.attributes.id}`;
          link.innerHTML = `Bus Number: ${bus.attributes.label}`;

          /* Add details to the individual listing. */
          const details = listing.appendChild(document.createElement('div'));
          details.id = `details-${bus.attributes.id}`
          details.innerHTML = `Coordinates: ${bus.attributes.coordinates}`;

          /**
           * Listen to the element and when it is clicked, do four things:
           * 1. Update the `currentFeature` to the store associated with the clicked link
           * 2. Fly to the point
           * 3. Close all other popups and display popup for clicked store
           * 4. Highlight listing in sidebar (and remove highlight for all other listings)
           **/
          link.addEventListener('click', function () {
            for (const feature of locations) {
              if (this.id === `link-${feature.attributes.id}`) {
                flyToBus(feature);
                createPopUp(feature);
              }
            }
            const activeItem = document.getElementsByClassName('active');
            if (activeItem[0]) {
              activeItem[0].classList.remove('active');
            }
            this.parentNode.classList.add('active');
          });
        }

      }

      function updateList(curLc){
        const detId = `details-${curLc.attributes.id}`
        const detail = document.getElementById(detId);
        if (detail != null) {
          detail.innerHTML = `Coordinates: ${curLc.attributes.coordinates}`;
        }
        
      }

      /**
       * Use Mapbox GL JS's `flyTo` to move the camera smoothly
       * a given center point.
       **/
      function flyToBus(currentBus) {
        map.flyTo({
          center: currentBus.attributes.coordinates,
          zoom: 15
        });
      }

      /**
       * Create a Mapbox GL JS `Popup`.
       **/
      function createPopUp(currentFeature) {
        const popUps = document.getElementsByClassName('mapboxgl-popup');
        if (popUps[0]) popUps[0].remove();
        const date = new Date();
        const popup = new mapboxgl.Popup({   closeButton: true})
          .setLngLat(currentFeature.attributes.coordinates)
          .setHTML(
            `<h3>Bus Nr. ${currentFeature.attributes.label}</h3><h4>Last Time: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}</h4>`
          )
          .addTo(map);
      }

      async function getBusLocations(){
        const url = 'https://api-v3.mbta.com/vehicles?filter[route]=1&include=trip';
        const response = await fetch(url);
        const json     = await response.json();
        return json.data;
      }

      render();
      run();  
      
    