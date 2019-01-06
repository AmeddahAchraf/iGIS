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
import {
    unByKey
} from 'ol/Observable.js';
import Overlay from 'ol/Overlay.js';
import {
    getArea,
    getLength
} from 'ol/sphere.js';
import {
    LineString,
    Polygon
} from 'ol/geom.js';






import $ from 'jquery';
import saveAs from 'file-saver';

require('bootstrap/dist/css/bootstrap.css');
require('bootstrap/dist/js/bootstrap.js');
require('font-awesome/css/font-awesome.css');

window.onload = firstLoad;
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

var _fileName;
var draw;
var map;

var jsonObjects = Array();
var _wkt;
var _feature;
var _Gid;

var _pid = 0;
var _nbElem = 0;
var _perfc = false;
var _new = true;
var _save = false;
var typeSelect = 'LineString';
var type = 0; // 0 Normale // 1 Measure
var listener; // Lisen for measurement


//Hex To Rgb transformation
const hexToRgb = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));

//      Event Listeners
document.getElementById('file-input').addEventListener('change', readSingleFile, false);
document.getElementById('exportPr').addEventListener('click', exportPr, false);
document.getElementById('importPr').addEventListener('click', importPr, false);
document.getElementById('openMap').addEventListener('click', openMap, false);
document.getElementById('line').addEventListener('click', drawLine, false);
document.getElementById('poly').addEventListener('click', drawPoly, false);
document.getElementById('circle').addEventListener('click', drawCircle, false);
document.getElementById('deleteDraw').addEventListener('click', deleteDraw, false);
document.getElementById('export-png').addEventListener('click', savePNG, false);
document.getElementById('cancelDraw').addEventListener('click', hidePropertie, false);
document.getElementById('saveDraw').addEventListener('click', saveDraw, false);
document.getElementById('lineM').addEventListener('click', measureLine, false);
document.getElementById('polyM').addEventListener('click', measurePoly, false);

function measureLine() {
    typeSelect = 'LineString';
    type = 1;
    map.removeInteraction(draw);
    addInteraction();
}

function measurePoly() {
    typeSelect = 'Polygon';
    type = 1;
    map.removeInteraction(draw);
    addInteraction();
}

function savePNG() {
    map.once('rendercomplete', function(event) {
        var canvas = event.context.canvas;
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(canvas.msToBlob(), 'map.png');
        } else {
            canvas.toBlob(function(blob) {
                saveAs(blob, 'map.png');
            });
        }
    });
    map.renderSync();
}

function openMap() {
    document.getElementById('file-input').click();
}

function exportPr() {
    var NameFile = prompt("Save as :");
    if (NameFile != null) {
        reloadModifiedDraw();
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

function reloadModifiedDraw() {
    var feauturs = source.getFeatures();
    feauturs.forEach((elem) => {
        var wkt = new WKT().writeGeometry(elem.getGeometry());
        var lid = elem.getId();
        var oID = getObjectID(lid);
        jsonObjects[oID].wkt = wkt;
    });
}

function getObjectID(lid) {
    var oID = -1;
    jsonObjects.forEach((obj, i) => {
        if (obj.id == lid) {
            oID = i;
        }
    });
    return oID;
}

function importPr() {
    var input = document.createElement("input");
    document.body.appendChild(input);
    input.style = "display: none";
    input.type = 'file';
    input.id = 'Karo';
    input.accept = '.iGis';
    var karo = document.getElementById('Karo');
    karo.addEventListener('change', openFile, false);
    input.click();
    karo.parentNode.removeChild(karo);
}

function openFile(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function() {
        var json = JSON.parse(reader.result);
        if (json != 0) {
            json.forEach((elem) => {
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
                feature.setId(_nbElem);
                source.addFeature(feature);
                elem.id = _nbElem;
                jsonObjects.push(elem);
                document.getElementById('lay').insertAdjacentHTML(
                    'beforeend',
                    '<span class="input-group-text" id="draw' + _nbElem + '">' + elem.name + '<i id="Setting' + _nbElem + '" class="fa fa-cog fa-fw icon" style="display: block; margin-left: auto;"></i></span> ');
                _nbElem++;
            });
        }
    }
    reader.readAsText(input.files[0]);
};

function firstLoad() {
    _fileName = "germany-map.jpg";
    $('[data-toggle="tooltip"]').tooltip();
    loadMap();
}

function readSingleFile(e) {
    _fileName = URL.createObjectURL(e.target.files[0]);
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
                    url: _fileName,
                    projection: projection,
                    imageExtent: extent
                })
            }),
            vector
        ],
        target: 'map',
        view: new View({
            projection: projection,
            zoom: 1.5,
            center: getCenter(extent),
            maxZoom: 6,
            minZoom: 1
        })
    });
    addInteraction();
}

function drawLine() {
    typeSelect = 'LineString';
    type = 0;
    map.removeInteraction(draw);
    addInteraction();
}

function drawPoly() {
    typeSelect = 'Polygon';
    type = 0;
    map.removeInteraction(draw);
    addInteraction();
}

function drawCircle() {
    typeSelect = 'Circle';
    map.removeInteraction(draw);
    addInteraction();
}

function jsonID() {
    var id = -1;
    jsonObjects.forEach((object, i) => {
        if (object.id == _Gid) {
            id = i;
        }
    });
    return id;
}

function deleteDraw() {
    hidePropertie();
    //Delete feature from source layer
    var features = source.getFeatures();
    features.forEach((feature) => {
        if (feature.getId() == _Gid) {
            source.removeFeature(feature);
        }
    })
    //Delete Draw from the array
    jsonObjects.splice(jsonID(), 1);

    //Delete span from html
    $('#draw' + _Gid).remove();
}

function addInteraction() {
    var save = false;
    var value = typeSelect;

    if (value !== 'None') {
        if (type == 1) {
            draw = new Draw({
                source: source,
                type: value,
                style: new Style({
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.5)',
                        lineDash: [10, 10],
                        width: 2
                    })
                }),
                freehand : false
            });
            createMeasureTooltip();
            draw.on('drawstart',
                (evt) => {
                    // set sketch
                    sketch = evt.feature;
                    var tooltipCoord = evt.coordinate;
                    listener = sketch.getGeometry().on('change', function(evt) {
                        var geom = evt.target;
                        var output;
                        if (geom instanceof Polygon) {
                            output = formatArea(geom);
                            tooltipCoord = geom.getInteriorPoint().getCoordinates();
                        } else if (geom instanceof LineString) {
                            output = formatLength(geom);
                            tooltipCoord = geom.getLastCoordinate();
                        }
                        measureTooltipElement.innerHTML = output;
                        measureTooltip.setPosition(tooltipCoord);
                    });
                }, this);
        } else {
            draw = new Draw({
                source: source,
                type: value,
                freehand: false
            });
        }
        draw.on('drawend',
            (e) => {
                var format = new WKT();
                _wkt = format.writeGeometry(e.feature.getGeometry());
                _feature = e.feature;
                document.getElementById('addedProp').innerHTML = '';
                _pid = 0;
                _new = true;
                $('#deleteDraw').addClass('hide');
                showPropertie();
            });
        map.addInteraction(draw);
        map.addInteraction(modify);
    }
}

function showPropertie() {
    $('#myModal').modal('show');
}

function hidePropertie() {
    $('#myModal').modal('hide');
}

function showDataInPropertie() {
    var id = jsonID();
    $('#addedProp').html('');
    $('#name').val(jsonObjects[id].name);
    if (jsonObjects[id].Pnames.length > 0) {
        var htmlString = '';
        for (var i = 0; i < jsonObjects[id].Pnames.length; i++) {
            htmlString += '<div class="input-group mb-3"><div class="input-group-prepend">    <input id="Pname' + i + '" type="text" class="form-control exist" aria-label="Default" aria-describedby="inputGroup-sizing-default" Value=' + jsonObjects[id].Pnames[i] + '>   </div>    <input id="Pvalue' + i + '" type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default"Value=' + jsonObjects[id].Pvalues[i] + '></div>';
        }
        $('#addedProp').html(htmlString);
    }
    _pid = jsonObjects[id].Pnames.length;

    if (!_new) {
        $('#deleteDraw').removeClass('hide');
    }

}

function resetStyle() {
    if (_perfc && jsonObjects.length >= 1) {
        var styleAr = Array();
        //console.log(jsonObjects.length,source.getFeatures().length);
        jsonObjects.forEach((elem) => {
            var style = new Style({
                fill: new Fill({
                    color: elem.style.fill
                }),
                stroke: new Stroke({
                    color: elem.style.stroke,
                    width: 1
                })
            });
            styleAr.push(style);
        });
        source.getFeatures().forEach((f, i) => {
            f.setStyle(styleAr[i]);
        })
        _perfc = false;
    }
}

function saveDraw() {
    var name = document.getElementById('name').value;
    if (name != '') {
        _save = true;
        hidePropertie();
        //Get Properties
        var fill = document.getElementById('fill').value;
        var stroke = document.getElementById('stroke').value;
        var tmp = hexToRgb(fill);
        fill = 'rgba(' + tmp[0] + ',' + tmp[1] + ',' + tmp[2] + ',0.5)';
        var style = new Style({
            fill: new Fill({
                color: fill
            }),
            stroke: new Stroke({
                color: stroke,
                width: 1
            })
        });
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
            'id': _nbElem,
            'name': name,
            'style': styleJson,
            'wkt': _wkt,
            'Pnames': Pnames,
            'Pvalues': Pvalues
        };
        if (_new) {
            _feature.setStyle(style);
            _feature.setId(_nbElem);
            source.addFeature(_feature);
            jsonObjects.push(jsonObject);
            //Add layer to the left layer Div
            document.getElementById('lay').insertAdjacentHTML(
                'beforeend',
                '<span class="input-group-text" id="draw' + _nbElem + '">' + name + '<i id="Setting' + _nbElem + '" class="fa fa-cog fa-fw icon" style="display: block; margin-left: auto;"></i></span> ');
            _nbElem++; //Increment nb of elements
        } else {
            _feature = source.getFeatureById(_Gid);
            _feature.setStyle(style);
            var id = jsonID();

            jsonObject.wkt = jsonObjects[id].wkt;
            jsonObject.id = jsonObjects[id].id;
            $('#draw' + _Gid).html(name + '<i id="Setting' + _Gid + '" class="fa fa-cog fa-fw icon" style="display: block; margin-left: auto;"></i>');
            jsonObjects[id] = jsonObject;
        }

        if (type == 1) {
            measureTooltipElement.className = 'tooltipp tooltip-static';
            measureTooltip.setOffset([0, -30]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            unByKey(listener);
        }
        map.removeInteraction(draw);
        addInteraction();
    }

}

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

document.addEventListener('mouseover', function(e) {
    if (e.target.id.indexOf('draw') != -1 || e.target.id.indexOf('Setting') != -1) {
        resetStyle();
        _perfc = true;
        var id = parseInt(e.target.id.replace(/^\D+/g, ''));
        var feature = source.getFeatureById(id);
        var style = new Style({
            fill: new Fill({
                color: 'rgba(0,253,255,0.5'
            }),
            stroke: new Stroke({
                color: 'black',
                width: 2
            })
        });
        feature.setStyle(style);
    } else {
        resetStyle();
    }
});

document.addEventListener('click', function(e) {
    if (e.target.id.indexOf('Setting') != -1) {
        _new = false;
        _Gid = parseInt(e.target.id.replace(/^\D+/g, ''));
        showPropertie();
        showDataInPropertie();
    }
});

$('#myModal').on('hidden.bs.modal', function(e) {
    if (!_save && _new) {
        source.removeFeature(_feature);
        map.removeOverlay(measureTooltip);
    }
    _save = false;
});




var sketch;


var measureTooltipElement;

var measureTooltip;

var formatLength = function(line) {
    var length = getLength(line);
    return (Math.round(length / 100 * 100) ) +' ' + 'km';
};

var formatArea = function(polygon) {
    var area = getArea(polygon);
    return  ( (Math.round( (area / 100 * 100) ) /2 )  ) + ' ' + 'km<sup>2</sup>';
};

function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltipp tooltip-measure';
    measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [10, -30],
        positioning: 'top-center'
    });
    map.addOverlay(measureTooltip);
}
