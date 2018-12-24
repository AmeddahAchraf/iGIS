import 'ol/ol.css';
import {
    Map,
    View
} from 'ol';
import {
    Tile as TileLayer,
    Vector as VectorLayer
} from 'ol/layer.js';
import ImageLayer from 'ol/layer/Image.js';
import {
    OSM,
    Vector as VectorSource
} from 'ol/source.js';
import {
    getCenter
} from 'ol/extent.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import {
    Draw,
    Modify,
    Snap
} from 'ol/interaction.js';
import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style
} from 'ol/style.js';
import WKT from 'ol/format/WKT.js';
import Feature from 'ol/Feature.js';

require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');



window.onload = firstLoad;
var _fileName;
var draw;
var map;
var extent = [0, 0, 1024, 968];
var projection = new Projection({
    units: 'pixels',
    extent: extent
});
var source = new VectorSource({
    wrapX: false
});
var vector = new VectorLayer({
    source: source
});
var modify = new Modify({
    source: source
});

var jsonObjects = Array();
var _wkt;
var _feature;
var _pid = 0;
var typeSelect='LineString';


//      Event Listeners
document.getElementById('file-input').addEventListener('change', readSingleFile, false);
document.getElementById('exportPr').addEventListener('click', exportPr, false);
document.getElementById('importPr').addEventListener('click', importPr, false);
document.getElementById('openMap').addEventListener('click', openMap, false);
document.getElementById('line').addEventListener('click', drawLine, false);
document.getElementById('poly').addEventListener('click', drawPoly, false);
document.getElementById('circle').addEventListener('click', drawCircle, false);

function openMap() {
    document.getElementById('file-input').click();
}

function exportPr() {
    var NameFile = prompt("Save as :");
    if (NameFile != null) {
        var text = JSON.stringify(jsonObjects); //transform it to string
        var a = document.createElement('a');
        var blob = new Blob([text], {
            type: 'log/plain'
        });
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = NameFile + ".iGis";
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

function importPr() {
    var input = document.createElement("input");
    document.body.appendChild(input);
    input.style = "display: none";
    input.type = 'file';
    input.id = 'Karo';
    input.accept = '.iGis';
    document.getElementById('Karo').addEventListener('change', openFile, false);
    input.click();
}

function openFile(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function() {
        var json = JSON.parse(reader.result);
        if (json != 0) {
            jsonObjects = json;
            _pid = json.length;
            //localStorage.setItem("stringObjects", reader.result);
            json.forEach(function(elem) {
                var wktObject = new WKT();
                var feature = wktObject.readFeature(elem.wkt);
                var style = new Style({
                    fill: new Fill({
                        color: elem.style.fill
                    }),
                    stroke: new Stroke({
                        color: elem.style.stroke,
                        width: 2
                    })
                });
                feature.setStyle(style);
                source.addFeature(feature);
            });
        }
    }
    reader.readAsText(input.files[0]);
};

function changeColor() {
    var style = new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.5)'
        }),
        stroke: new Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new CircleStyle({
            radius: 7,
            fill: new Fill({
                color: '#ffcc33'
            })
        })
    });
    map.getLayers().array_[1].setStyle(style)
    console.log(map.getLayers().array_[1].getStyle());
}

function firstLoad() {
    _fileName = "germany-map.jpg";
    loadMap();
}

function readSingleFile(e) {
    _fileName = e.target.files[0].name;
    var parent = document.getElementById("map");
    var child = document.getElementsByClassName("ol-viewport")[0];
    parent.removeChild(child);
    loadMap();
}

function loadMap() {
    map = new Map({
        layers: [
            new ImageLayer({
                source: new Static({
                    url: 'http://127.0.0.1:8080/' + _fileName,
                    projection: projection,
                    imageExtent: extent
                })
            }),
            vector
        ],
        target: 'map',
        view: new View({
            projection: projection,
            zoom: 3,
            center: getCenter(extent),
            maxZoom: 4
        })
    });
    addInteraction();
}

function drawLine() {
    typeSelect='LineString';
    map.removeInteraction(draw);
    addInteraction();
}
function drawPoly() {
    typeSelect='Polygon';
    map.removeInteraction(draw);
    addInteraction();
}
function drawCircle() {
    typeSelect='Circle';
    map.removeInteraction(draw);
    addInteraction();
}

function addInteraction() {
    var save = false;
    var value = typeSelect;
    if (value !== 'None') {
        draw = new Draw({
            source: source,
            type: value,
            freehand: false
        });
        draw.on('drawend', function(e) {

            var format = new WKT();
            _wkt = format.writeGeometry(e.feature.getGeometry());
            _feature = e.feature;
            document.getElementById('addedProp').innerHTML = '';
            _pid = 0;
            showPropertie();

        })

        map.addInteraction(draw);
        map.addInteraction(modify);
    }
}

function showPropertie() {
    var element = document.getElementsByClassName('Propertie')[0];
    element.style.display = "block";
}

document.getElementById('cancelDraw').addEventListener('click', function() {
    var element = document.getElementsByClassName('Propertie')[0];
    element.style.display = "none";
    source.removeFeature(_feature);
    map.removeInteraction(draw);
    addInteraction();
}, false);

document.getElementById('saveDraw').addEventListener('click', function() {
    var element = document.getElementsByClassName('Propertie')[0];
    element.style.display = "none";

    //Get Properties
    var name = document.getElementById('name').value;
    var fill = document.getElementById('fill').value;
    var stroke = document.getElementById('stroke').value;

    var style = new Style({
        fill: new Fill({
            color: fill
        }),
        stroke: new Stroke({
            color: stroke,
            width: 2
        })
    });

    _feature.setStyle(style);

    var Pnames = Array();
    var Pvalues = Array();
    var propElements = document.getElementsByClassName('exist');
    if (propElements.length != 0) {
        for (var i = 0; i < propElements.length; i++) {
            Pnames[i] = document.getElementById('Pname' + i).value;
            Pvalues[i] = document.getElementById('Pvalue' + i).value;
        }
    }
    var styleJson = {
        'fill': fill,
        'stroke': stroke
    }
    var jsonObject = {
        'name': name,
        'style': styleJson,
        'wkt': _wkt,
        'Pnames': Pnames,
        'Pvalues': Pvalues
    };
    jsonObjects.push(jsonObject);
    console.log(jsonObjects);
    map.removeInteraction(draw);
    addInteraction();
}, false);

document.getElementById('addProp').addEventListener('click', function() {
    document.getElementById('addedProp').insertAdjacentHTML(
        'beforeend',
        '<div class="input-group mb-3">\
    <div class="input-group-prepend">\
    <input id="Pname' + _pid + '"type="text" class="form-control exist" aria-label="Default" aria-describedby="inputGroup-sizing-default" placeholder="Propertie">\
    </div>\
    <input id="Pvalue' + _pid + '" type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" placeholder="Value">\
</div>');
    _pid++;
}, false);
