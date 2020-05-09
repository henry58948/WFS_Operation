import 'ol/ol.css';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import Draw from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import GeometryType from 'ol/geom/GeometryType';
import Map from 'ol/Map';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Snap from 'ol/interaction/Snap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import XYZSource from 'ol/source/XYZ';
import TileWMSSource from 'ol/source/TileWMS';
import View from 'ol/View';
import sync from 'ol-hashed';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
//! [imports]
import { getArea } from 'ol/sphere';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';

import Feature from 'ol/Feature'
import MultiLineString from 'ol/geom/MultiLineString'
import WFS from 'ol/format/WFS'
import Overlay from 'ol/Overlay'

import ZoomSlider from 'ol/control/ZoomSlider';

import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
//! [imports]

proj4.defs("EPSG:4490", "GEOGCS[\"China Geodetic Coordinate System 2000\",DATUM[\"China_2000\",SPHEROID[\"CGCS2000\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"1024\"]],AUTHORITY[\"EPSG\",\"1043\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4490\"]]");
register(proj4);

//使用变量缓存弹窗需要的DOM对象
const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");
// 创建一个Overlay叠加层对象用作显示弹窗
const overlayPop = new Overlay({
  element: container,
  autoPan: true,
  // autoPanAnimation: {
  //   duration: 250
  // }
});

const map = new Map({
  overlays: [overlayPop],
  target: document.getElementById('map-container'),
  view: new View({
    center: [108, 34],
    zoom: 5,
    minZoom: 4,
    maxZoom:19,
    projection: 'EPSG:4490',
    constrainResolution: true
  })
});
map.addControl(new ZoomSlider());
//sync(map);

const tian_di_tu_satellite_layer = new TileLayer({
  title: "天地图卫星影像",
  // preload: Infinity,
  source: new XYZSource({
    url: 'http://t3.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=d2c83b3ce992559292de67edbdfa00a2'
  })
});
map.addLayer(tian_di_tu_satellite_layer);

const tian_di_tu_annotation = new TileLayer({
  title: "天地图文字标注",
  source: new XYZSource({
    url: 'http://t3.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=d2c83b3ce992559292de67edbdfa00a2'
  })
});
map.addLayer(tian_di_tu_annotation);
//http://gisserver.tianditu.gov.cn/TDTService/wfs?service=wfs&version=1.1.0&request=GetFeature&FILTER=name='北京市''

var river_source = new TileWMSSource({
  url:'http://localhost:8080/geoserver/map/wms',
  params:{
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetMap',
    FORMAT: 'image/png',
    TRANSPARENT: true,
    LAYERS: 'map:river5_polyline'
  }
});

var river_layer = new TileLayer({
  title:"河流WMS",
  source:river_source
})

map.addLayer(river_layer);

const vectorSource = new VectorSource({
  format: new GeoJSON(),
  //url:'http://localhost:8080/geoserver/map/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=map%3Ariver5_polyline&maxFeatures=50&outputFormat=application/json'
  url: function (extent) {
    return 'http://localhost:8080/geoserver/map/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=map%3Ariver5_polyline&outputFormat=application/json&' +
      'bbox=' + extent.join(',') + ',EPSG:4490'
  },
  strategy: bboxStrategy
});

var wfsVectorLayer = new VectorLayer({
  source: vectorSource
});
//

const sourceDraw = new VectorSource({ wrapX: false });

const layer = new VectorLayer({
  title:'绘制显示图层',
  source: sourceDraw,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
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
  })
});

map.addLayer(layer);

//鼠标的移动
map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  var selectedFeature = map.hasFeatureAtPixel(pixel);
  map.getTarget().style.cursor = selectedFeature ? 'pointer' : 'default';
});

map.on("moveend", function (evt) {
  var zoom = map.getView().getZoom();  //获取当前地图的缩放级别
  document.getElementById("span_zoom").innerText = zoom;
  // var layersArr = map.getLayers().array_;
  // var hasWFS = false; //判断是否存在WFS要素服务
  // var hasRiver = true; //判断是否存在动态服务
  // layersArr.forEach((layer,item) =>{
  //   if(layer.values_.title == '河流WMS'){
  //     hasRiver = true;
  //     hasWFS = false;
  //   }else{
  //     hasRiver = false;
  //     hasWFS = true;
  //   }
  // })
  // if(zoom >= 10){
  //   if(!hasWFS){
  //     map.addLayer(wfsVectorLayer);
  //     map.removeLayer(river_layer);
  //     map.render();
  //   }
  // }else{
  //   if(!hasRiver){
  //     map.addLayer(river_layer);
  //     map.removeLayer(wfsVectorLayer);
  //     map.render();
  //   }
  // }
});

//地图的单击事件
// map.on('singleclick',function(evt){
//   var coordinate = evt.coordinate;


//   content.innerHTML = "<p>你点击了这里:</p><code>" + '1111' + "</code>";
//   overlayPop.setPosition(coordinate);

//   // var pixel = map.getEventPixel(evt.originalEvent);
//   // var selectedFeature = map.getFeaturesAtPixel(pixel); //选中的要素
//   // if(isSelect){
//   //   if(selectedFeature){
//   //     console.log(selectedFeature.item(0).getId())
//   //   }
//   // }
// })

// map.getView().on("change:resolution", function (ev) {
//   var zoom = map.getView().getZoom();  //获取当前地图的缩放级别
//   console.log(zoom);
// });

// map.addInteraction(new DragAndDrop({
//   source: source,
//   formatConstructors: [GeoJSON]
// }));

// var isSelect = true; //点击是否显示弹窗

//弹窗的关闭事件
closer.onclick = function () {
  overlayPop.setPosition(undefined);
  closer.blur();
  return false;
};



//点击要素服务选择交互
var clickFeature = new Select({
  layers: [wfsVectorLayer],
  style: new Style({
    stroke: new Stroke({
      color: '#04f6eb',
      width: 4
    })
  }),
  hitTolerance: 3 //选择的容差
})
var selectedFeature = null;
clickFeature.on('select',function(evt){

  selectedFeature = evt.selected[0];
  if (selectedFeature == null ){
    overlayPop.setPosition(undefined);
    return;
  }
  var coordinate = evt.mapBrowserEvent.coordinate;
  console.log(selectedFeature.getProperties());
  var FeaPorperties = selectedFeature.getProperties()

  content.innerHTML =`<div style="margin-top:15px"><span>河流名称：${FeaPorperties.name}</span></div><button  id="btn_delFeature"style="width: 75px;
  height: 25px;    margin-top: 10px; margin-left: 190px;" }">删除</button>`;
  document.getElementById("btn_delFeature").onclick = null;
  document.getElementById("btn_delFeature").onclick = delFeature;
  overlayPop.setOffset([-50,-110]);
  overlayPop.setPosition(coordinate);
});
map.addInteraction(clickFeature);



//编辑选择交互
var selectInter = new Select({
  layers: [wfsVectorLayer],
  style: new Style({
    stroke: new Stroke({
      color: 'red',
      width: 4
    })
  }),
  hitTolerance: 3 //选择的容差
})
//编辑
var modifyLine = new Modify({
  style: new Style({
    stroke: new Stroke({
      color: '#ffffff',
      width: 4
    })
  }),
  features: selectInter.getFeatures()
});
//绘制
var drawLine = new Draw({
  source: sourceDraw,
  type: 'LineString',
  freehand: true
});
//是否可以捕捉点
var snapLine = new Snap({
  //source: sourceDraw
  source: vectorSource
});

//删除选中的要素
function delFeature(){
  if(selectedFeature){
    var WFSTSerializer = new WFS();
    var featObject = WFSTSerializer.writeTransaction(null, null, [selectedFeature], {
      featureNS: 'http://localhost/map',
      featureType: "river5_polyline"
    });
    var serializer = new XMLSerializer();
    var featString = serializer.serializeToString(featObject);
    xmlRequest('delete',featString,function(){
      overlayPop.setPosition(undefined);
      clickFeature.getFeatures().clear();
      vectorSource.refresh();
    });
  }
}

//绘制完成触发事件
drawLine.on("drawend", function (e) {
  drawLine.setActive(false);
  var feature = e.feature;
  var newFeature = new Feature({
    "geom": new MultiLineString([feature.getGeometry().getCoordinates()]),
    "name": "新建2",
    "level": 55
  })
  var WFSTSerializer = new WFS();
  var featObject = WFSTSerializer.writeTransaction([newFeature],
    null, null, {
    featureNS: 'http://localhost/map',
    featureType: "river5_polyline",
    //srsName: 'EPSG:4326'
  });
  var serializer = new XMLSerializer();
  var featString = serializer.serializeToString(featObject);
  xmlRequest('Draw',featString,function(){
    sourceDraw.clear();
    vectorSource.refresh();
    drawLine.setActive(true);
  });
})

//编辑完成触发的事件
modifyLine.on("modifyend", function (e) {
  var modifyFeatures = e.features;
  if (modifyFeatures && modifyFeatures.getLength() > 0) {
    var modifyFeature = modifyFeatures.item(0).clone();
    modifyFeature.setId(modifyFeatures.item(0).getId());
    modifyFeature.getGeometry().applyTransform(function (flatCoordinates, flatCoordinates2, stride) {
      for (var j = 0; j < flatCoordinates.length; j += stride) {
        var y = flatCoordinates[j];
        var x = flatCoordinates[j + 1];
        flatCoordinates[j] = x;
        flatCoordinates[j + 1] = y;
      }
    });
    modifyFeature.setGeometryName("geom");
    var WFSTSerializer = new WFS();
    var featObject = WFSTSerializer.writeTransaction(null, [modifyFeature], null, {
      featureNS: 'http://localhost/map',
      featureType: "river5_polyline"
    });
    var serializer = new XMLSerializer();
    var featString = serializer.serializeToString(featObject);
    xmlRequest('Modify',featString);
  }
})

//执行Xml请求
function xmlRequest(type,featString,callback){
  var request = new XMLHttpRequest();
  request.open('POST', 'http://localhost:8080/geoserver/map/wfs');//URL地址
  request.setRequestHeader('Content-Type', 'text/xml');
  request.send(featString);

  request.onload = e => {
    if(callback){
      callback();
    }
    console.log(type + 'success');
  };
}
//开始绘制
const startDraw = document.getElementById('startDraw');
startDraw.addEventListener('click', function () {
  map.removeInteraction(clickFeature);
  map.addInteraction(drawLine);
  map.addInteraction(snapLine);
})

//停止绘制
const endDraw = document.getElementById('endDraw');
endDraw.addEventListener('click', function () {
  map.addInteraction(clickFeature);
  map.removeInteraction(drawLine);
  map.removeInteraction(snapLine);
});

//开始编辑
const startEdit = document.getElementById('startEdit');
startEdit.addEventListener('click', function () {
  map.removeInteraction(clickFeature);
  map.addInteraction(selectInter);
  map.addInteraction(modifyLine);
})

//停止编辑
const stopEdit = document.getElementById('endEdit');
stopEdit.addEventListener('click', function () {
  selectInter.getFeatures().clear();
  map.addInteraction(clickFeature);
  map.removeInteraction(modifyLine);
  map.removeInteraction(selectInter);
})

//清理地图和地图的各种交互
function claerMap(){
  map.addInteraction(clickFeature);
  //清除绘制交互
  map.removeInteraction(drawLine);
  map.removeInteraction(snapLine);
  sourceDraw.clear();
  //清除编辑交互
  selectInter.getFeatures().clear();
  map.removeInteraction(modifyLine);
  map.removeInteraction(selectInter);
  //清除删除交互
  overlayPop.setPosition(undefined);
  clickFeature.getFeatures().clear();
  
  //vectorSource.refresh();
}

const clear = document.getElementById('clear');
clear.addEventListener('click', function () {
  claerMap();
});

const changed = document.getElementById('changed');
var changedLayer = false;
changed.addEventListener('click', function () {
  if(changedLayer){
    map.addLayer(river_layer);
    map.removeLayer(wfsVectorLayer);
  }else{
    map.addLayer(wfsVectorLayer);
    map.removeLayer(river_layer);
  }
  map.render();
  changedLayer = !changedLayer;
});

// const format = new GeoJSON({ featureProjection: 'EPSG:3857' });
// const download = document.getElementById('download');
// source.on('change', function () {
//   const features = source.getFeatures();
//   const json = format.writeFeatures(features);
//   download.href = 'data:text/json;charset=utf-8,' + json;
// });
