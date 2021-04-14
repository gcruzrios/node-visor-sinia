function getLayers () {
  return document.getElementById('layer-input').value
}


 // Archivo original

const loaded = new Promise((resolve, reject) => window.addEventListener('load', event => resolve(event)))

const makeSelectOption = ({name, title}) => {
  let option = document.createElement('option')
  option.value = name 
  option.innerHTML = title
  return option
}
const zoomedOrMoved = (map, cb) => {
  map.on('zoomend', cb)
  map.on('moveend', cb)
}

function setMapViewFromUrl(map, url) {
  const lat = url.searchParams.get('lat') || 9.748917
  const lng = url.searchParams.get('lng') || -83.753428
  const zoomlevel = url.searchParams.get('z') || 8
  return map.setView(L.latLng(lat, lng), zoomlevel)
}

loaded
.then(_ => xhrGET('/geoserver/wms?service=wms&request=GetCapabilities&version=1.3.0'))
.then(result => {
  const layers = result.responseXML.querySelectorAll("Layer[queryable=\"1\"]")
  let model = []
  layers.forEach(node => {
    model.push({
      title: node.querySelector('Title').innerHTML,
      name: node.querySelector('Name').innerHTML
    })
  })
  return model 
}).then(optionModels => {
  // set all options from our loaded geoserver layers
  const layerSelection = document.getElementById("layers-selection")
  optionModels
    .map(makeSelectOption)
    .forEach(option => layerSelection.appendChild(option))
  layerSelection.setAttribute('size', optionModels.length)

  layerSelection.addEventListener('change', e => {
    // get just selected nodes
    let selected = []
    e.srcElement.childNodes.forEach(n => n.selected ? selected.push(n.value): noOp())
    document.getElementById('layer-input').value = selected.join(',')
  })
  
  const loadButton = document.getElementById("loadButton")

  const tileLayer = L.tileLayer.wms('/geoserver/wms', {
    layers: getLayers(),
    format: 'image/png',
    opacity: 0.8,
    transparent: 'true',
    attribution: 'Sourced from LINZ. CC-BY 3.0'
  })

  const map = L.map('my-map', {
    center: L.latLng(-36.85, 174.76),
    zoom: 10,
    continuousWorld: true,
    worldCopyJump: false,
  })

  L.tileLayer.provider('OpenStreetMap').addTo(map);

  setMapViewFromUrl(map, new URL(window.location.href))

  zoomedOrMoved(map, e => {
    const location = map.getCenter()
    const zoomlevel = map.getZoom()
    let url = new URL(window.location.href)
    url.searchParams.set('z', zoomlevel)
    url.searchParams.set('lat', location.lat)
    url.searchParams.set('lng', location.lng)
    
    window.history.pushState({path: url.href}, '', url.href);
  })

  map.on('click', e => {
    console.log('dat click in', e)
    query(e.latlng.lat, e.latlng.lng)
      .then(yo => {
        console.log('got data for point', e.latlng, yo)
      })
      .catch(err => {
        console.log('bad request', err)
      })
  })
  map.addLayer(tileLayer)

  loadButton.addEventListener('click', e => {
    tileLayer.setParams({layers: getLayers()})
  })
  
  window.addEventListener('popstate', e => {
    const url = new URL(e.state.path)
    setMapViewFromUrl(map, url)
  })
})

// Visor SINIA

//var defaultBase = L.tileLayer.provider('OpenStreetMap').addTo(map);

const baseLayers = {
  //'OpenStreetMap': defaultBase,
  'USGS TNM': L.tileLayer.provider('USGSTNM'),
  'ESRI Imagery': L.tileLayer.provider('Esri.WorldImagery'),
  'ESRI Ocean Basemap': L.tileLayer.provider('Esri.OceanBasemap'),
  'OSM Topo': L.tileLayer.provider('OpenTopoMap')
};
  var options_layer = {
    transparent: 'true',
    format: 'image/png',
    opacity: 0.5,
    tiled: 'true'
    //info_format: 'text/html'
  };
 
  console.log(L.WMS);
  
  var source = L.WMS.source('http://geomapa.tk:8080/geoserver/costarica-snit/wms?', options_layer);
  var CantonesLayer = source.getLayer('costarica-snit:Cantones_de_Costa_Rica');
  var DistritosLayer = source.getLayer('costarica-snit:Distritos_de_Costa_Rica');
  var ProvinciasLayer = source.getLayer('costarica-snit:Provincias_de_Costa_Rica');

  var groupOverLays = {
    "DTA": {
        "Cantones": CantonesLayer,
        "Distritos": DistritosLayer,
        "Provincias": ProvinciasLayer,
    },
  };

  //add layer switch control
  L.control.groupedLayers(baseLayers, groupOverLays).addTo(map);


  //add scale bar to map
  L.control.scale({
      position: 'bottomleft'
  }).addTo(map);

  // Overview mini map
  const Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});

const miniMap = new L.Control.MiniMap(Esri_WorldTopoMap, {
      toggleDisplay: true,
      minimized: false,
      position: 'bottomleft'
}).addTo(map);

//define Drawing toolbar options
const options = {
    position: 'topleft', // toolbar position, options are 'topleft', 'topright', 'bottomleft', 'bottomright'
    drawMarker: true, // adds button to draw markers
    drawPolyline: true, // adds button to draw a polyline
    drawRectangle: true, // adds button to draw a rectangle
    drawPolygon: true, // adds button to draw a polygon
    drawCircle: true, // adds button to draw a cricle
    cutPolygon: true, // adds button to cut a hole in a polygon
    editMode: true, // adds button to toggle edit mode for all layers
    removalMode: true, // adds a button to remove layers
};

// add leaflet.pm controls to the map
map.pm.addControls(options);

//Logo position: bottomright
const credctrl = L.controlCredits({
    image: "images/opengislab_106x23.png",
    link: "https://www.opengislab.com/",
    text: "Leaflet map example by Stephanie @ <u>opengislab.com<u/>"
}).addTo(map);






// Sigue el proyecto Node Original


// utillity
function xhr (method, url, body) {
  var xhttp = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) resolve(this)
        else reject(this)
      }
    }
    xhttp.open(method, url, true);
    if (method === 'POST') {
      xhttp.setRequestHeader("content-type", "application/xml")
      xhttp.send(body)
    } else {
      xhttp.send()
    }
  })
}
function xhrGET (url) {
  return xhr('GET', url)
}

function xhrPOST (url, body) {
  return xhr('POST', url, body)
}
    
function noOp () {}


function query (lat, lng) {
  var bboxQuery = `
  <wfs:GetFeature
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml"
    xmlns:wfs="http://www.opengis.net/wfs"
    service="WFS"
    version="1.1.0"
    maxFeatures="10"
    outputFormat="text/xml; subtype=gml/3.1.1">
    <wfs:Query
      srsName="EPSG:4326" typeName="ersin-map:parcels-reprojected">
      <ogc:Filter>
        <ogc:BBOX>
          <ogc:PropertyName>shape</ogc:PropertyName>
          <gml:Envelope srsName="EPSG:4326">
            <gml:lowerCorner>${lng - 0.05} ${lat - 0.05}</gml:lowerCorner>
            <gml:upperCorner>${lng + 0.05}  ${lat + 0.05}</gml:upperCorner>
          </gml:Envelope>
        </ogc:BBOX>
      </ogc:Filter>
    </wfs:Query>
  </wfs:GetFeature>`
  console.log(bboxQuery)
  return xhrPOST("/geoserver/wfs", bboxQuery)
}