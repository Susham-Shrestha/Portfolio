/*===== MENU SHOW =====*/
const showMenu = (toggleId, navId) => {
  const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId)

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('show')
    })
  }
}
showMenu('nav-toggle', 'nav-menu')

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction() {
  const navMenu = document.getElementById('nav-menu')
  // When we click on each nav__link, we remove the show-menu class
  navMenu.classList.remove('show')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

const scrollActive = () => {
  const scrollDown = window.scrollY

  sections.forEach(current => {
    const sectionHeight = current.offsetHeight,
      sectionTop = current.offsetTop - 58,
      sectionId = current.getAttribute('id'),
      sectionsClass = document.querySelector('.nav__menu a[href*=' + sectionId + ']')

    if (scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight) {
      sectionsClass.classList.add('active-link')
    } else {
      sectionsClass.classList.remove('active-link')
    }
  })
}

window.addEventListener('scroll', scrollActive)

/*===== SCROLL REVEAL ANIMATION =====*/
const sr = ScrollReveal({
  origin: 'top',
  distance: '60px',
  duration: 2000,
  delay: 200,
  //     reset: true
});

document.addEventListener('DOMContentLoaded', () => {
  // === FORM SUBMISSION ===
  const form = document.getElementById('contact-form');
  const message = document.getElementById('form-message');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (response.ok) {
      message.textContent = "Thank you! Your message has been sent.";
      message.style.color = "green";
      form.reset();
    } else {
      message.textContent = "Oops! Something went wrong.";
      message.style.color = "red";
    }
  });

  // === LEAFLET MAP ===
  const map = L.map('leafletMap').setView([27.676410, 85.385511], 13); // Susham coordinates

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  L.marker([27.676410, 85.385511]).addTo(map)
    .bindPopup("Susham is here!")
    .openPopup();
  // === SPATIAL TOOLS ===
  const bufferBtn = document.getElementById('bufferBtn');
  const distanceBtn = document.getElementById('distanceBtn');
  const areaBtn = document.getElementById('areaBtn');
  const mapInfo = document.getElementById('mapInfo');

  let bufferLayer = null;
  let bufferMarker = null;
  let distanceMarkers = [];
  let distanceLine = null;
  let polygonLayer = null;
  let drawControl = null;

  // Buffer Tool
  bufferBtn.addEventListener('click', () => {
    // Clear previous layers, reset state, and close any open popups
    if (bufferLayer) map.removeLayer(bufferLayer);
    if (bufferMarker) map.removeLayer(bufferMarker);
    if (distanceLine) map.removeLayer(distanceLine);
    distanceMarkers.forEach(marker => map.removeLayer(marker));
    distanceMarkers = [];
    if (polygonLayer) map.removeLayer(polygonLayer);
    if (drawControl) map.removeControl(drawControl);
    map.closePopup(); // Close any open popups
    mapInfo.textContent = 'Click a point on the map to create a 1 km buffer.';
    map.off('click'); // Remove any existing click listeners

    // Add new click listener for buffer
    map.on('click', (e) => {
      if (bufferLayer) map.removeLayer(bufferLayer);
      if (bufferMarker) map.removeLayer(bufferMarker);
      map.closePopup(); // Close any open popups
      const point = turf.point([e.latlng.lng, e.latlng.lat]);
      const buffered = turf.buffer(point, 1, { units: 'kilometers' });
      bufferLayer = L.geoJSON(buffered, {
        style: {
          color: '#58BE89',
          fillOpacity: 0.3,
          weight: 2
        }
      }).addTo(map);
      bufferMarker = L.marker(e.latlng).addTo(map).bindPopup('Buffer center').openPopup();
      mapInfo.textContent = '1 km buffer created around selected point.';
      map.fitBounds(bufferLayer.getBounds());
      map.off('click'); // Remove click listener after creating buffer
    });
  });
  // Distance Calculator
  distanceBtn.addEventListener('click', () => {
    // Clear previous layers and reset state
    if (bufferLayer) map.removeLayer(bufferLayer);
    if (bufferMarker) map.removeLayer(bufferMarker); // Clear buffer marker
    if (distanceLine) map.removeLayer(distanceLine);
    distanceMarkers.forEach(marker => map.removeLayer(marker));
    distanceMarkers = [];
    if (polygonLayer) map.removeLayer(polygonLayer);
    if (drawControl) map.removeControl(drawControl);
    mapInfo.textContent = 'Click two points on the map to measure distance.';
    map.off('click'); // Remove any existing click listeners

    map.on('click', (e) => {
      if (distanceMarkers.length < 2) {
        const marker = L.marker(e.latlng).addTo(map);
        distanceMarkers.push(marker);
        if (distanceMarkers.length === 2) {
          const point1 = turf.point([distanceMarkers[0].getLatLng().lng, distanceMarkers[0].getLatLng().lat]);
          const point2 = turf.point([distanceMarkers[1].getLatLng().lng, distanceMarkers[1].getLatLng().lat]);
          const distance = turf.distance(point1, point2, { units: 'kilometers' }).toFixed(2);
          mapInfo.textContent = `Distance: ${distance} km`;

          const line = turf.lineString([
            [distanceMarkers[0].getLatLng().lng, distanceMarkers[0].getLatLng().lat],
            [distanceMarkers[1].getLatLng().lng, distanceMarkers[1].getLatLng().lat]
          ]);
          distanceLine = L.geoJSON(line, {
            style: { color: '#1253A4', weight: 3 }
          }).addTo(map);
          map.off('click');
        }
      }
    });
  });
  // Area Calculator
  areaBtn.addEventListener('click', () => {
    if (bufferLayer) map.removeLayer(bufferLayer);
    if (distanceLine) map.removeLayer(distanceLine);
    distanceMarkers.forEach(marker => map.removeLayer(marker));
    distanceMarkers = [];
    if (polygonLayer) map.removeLayer(polygonLayer);
    if (drawControl) map.removeControl(drawControl);
    mapInfo.textContent = 'Draw a polygon on the map to calculate its area.';

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawControl = new L.Control.Draw({
      draw: {
        polygon: true,
        marker: false,
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false
      },
      edit: { featureGroup: drawnItems }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      if (polygonLayer) map.removeLayer(polygonLayer);
      const layer = e.layer;
      drawnItems.addLayer(layer);
      polygonLayer = layer;
      const geojson = layer.toGeoJSON();
      const area = (turf.area(geojson)).toFixed(2);
      mapInfo.textContent = `Area: ${area} sq m`;
    });
  });

  sr.reveal('.map__container, .map__controls', {});
  sr.reveal('.map__info', { delay: 400 });

});





sr.reveal('.home__data, .about__img, .skills__subtitle, .skills__text', {});
sr.reveal('.home__img, .about__subtitle, .about__text, .skills__img', { delay: 400 });
sr.reveal('.home__social-icon', { interval: 200 });
sr.reveal('.skills__data, .work__img, .contact__input', { interval: 200 }); 