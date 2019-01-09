"use strict";

/* global変数 ----------*/
var map;            // マップ
var rasterLayers;   // ラスタレイヤ（地図レイヤ）のリスト
var rLayerNames = ["osm", "trans"];  // layer選択のselect value
var vectorLayers;   // ベクタレイヤのリスト
var markerLayer;    // マーカレイヤ
var markerSource;   // マーカレイヤのsource（featureのセット）
var drawLayer;      // drawレイヤ
var drawSource;     // drawレイヤのsource（map interaction が描画するところ）
var draw;           // draw interaction
var layerSelect;    // レイヤ選択メニュー
/* 定数 ----------*/
var prec = 10;      // 緯度経度の精度
var mapCenter = [139.7454446554, 35.658567204];  // 中心の経度緯度（東京タワー）
var markerDirUrl = "http://www.openlayers.org/api/img/";  // マーカの画像。openlayers2にしかないみたい。
var apikey = '<insert-your-apikey-here>'  // 交通マップのapikey

/* 四捨五入 ----------*/
function orgRound(value, digits) {
  return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
  //return Math.round(value * (10 ** digits)) / (10 ** digits);  <- IEでは ** 使えない
}

/* レイヤ選択 ----------*/
function onLayerSelect(){
  var sel_layer = layerSelect.value;
  var i, ii;
  // ラスタレイヤは選択したものを表示
  for (i = 0, ii = rasterLayers.length; i < ii; ++i){
    rasterLayers[i].setVisible(rLayerNames[i] === sel_layer);
  }
  // ベクタレイヤはすべて表示
  for (i = 0, ii = vectorLayers.length; i < ii; ++i){
    vectorLayers[i].setVisible(true);
  }
}

/* マップに draw interaction 追加 ----------*/
function addDraw() {  
  var pointerStyle = new ol.style.Style({     // pointer のスタイル
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ {
      anchor: [0.5, 1],
      opacity: 0.5,
      src: markerDirUrl + "marker-blue.png"
    }),
    stroke: new ol.style.Stroke({
      color: '#1E90FF',
      width: 3
    })
  });
  draw = new ol.interaction.Draw({
    source: drawSource,
    type: 'LineString',
    style: pointerStyle
  });
  map.addInteraction(draw);
}

/* クリック処理 ----------*/
function onClick(evt) {
  // 緯度経度取得
  var coordinate = evt.coordinate;
  var lonlat = ol.proj.toLonLat(coordinate);
  var lon = orgRound(lonlat[0], prec);
  var lat = orgRound(lonlat[1], prec);

  // マーカfeature追加
  var newFeature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat(lonlat))
  });
  markerSource.addFeature(newFeature);
  
  // テキスト編集
  var lltext = document.getElementById("lltext");
  lltext.value = lltext.value + lat + "," + lon
                 + "," + document.getElementById("station").value
                 + "," + document.getElementById("route").value + "\n";

  // テキストエリアちいさかったらリサイズ
  if(lltext.scrollHeight > lltext.offsetHeight ){
    lltext.style.height = lltext.scrollHeight+'px';
  }
}

/* マーカクリア ----------*/
function markerClear(){
  markerSource.clear();
  map.removeInteraction(draw);  // 描画中のdrawを消す
  drawSource.clear();  // 確定した線を消す
  addDraw();  // draw interaction 追加しなおし
}

/* データクリア ----------*/
function dataClear(){
  document.getElementById("lltext").value = ""
}

/* all クリア ----------*/
function allClear(){
  dataClear();
  document.getElementById("station").value = "";
  document.getElementById("route").value = "";
}

/* <main> マップ表示 ----------------------------------------------------------*/
function loadMap(){

  // OSMレイヤ
  var osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
  });

  // 交通マップレイヤ
  // ### apiキー取得必要 https://www.thunderforest.com/maps/transport/ ###
  var transLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=' + apikey
    })
  });

  // マーカレイヤ
  var markerStyle = new ol.style.Style({    // マーカスタイル
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ {
      anchor: [0.5, 1],
      opacity: 0.7,  // 透過度
      src: markerDirUrl + "marker.png"
    })
  });
  markerSource = new ol.source.Vector();
  markerLayer = new ol.layer.Vector({
    source: markerSource,
    style: markerStyle
  });

  // drawレイヤ
  drawSource = new ol.source.Vector();
  drawLayer = new ol.layer.Vector({
    source: drawSource,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({color: '#DC143C', width: 2})
    })
  });

  // レイヤを配列に
  rasterLayers = [osmLayer, transLayer];
  vectorLayers = [markerLayer, drawLayer];

  // マップ
  map = new ol.Map({
    target: 'map',
    layers: rasterLayers.concat(vectorLayers),
    view: new ol.View({
      center: ol.proj.fromLonLat(mapCenter),
      zoom: 10
    })
  });
  //map.addControl(new ol.control.ZoomSlider());  // スライダー邪魔みたい

  // マップに draw interaction を追加
  addDraw();

  // イベント処理 ----------
  // レイヤ選択
  layerSelect = document.getElementById('select');
  layerSelect.addEventListener('change', onLayerSelect);
  onLayerSelect();  // 最初の表示用

  // クリック処理
  map.on('click', onClick);

  // マーカクリア
  var btnMKClr = document.getElementById('mk-clr');
  btnMKClr.addEventListener('click', markerClear);

  // データクリア
  var btnDClr = document.getElementById('clr');
  btnDClr.addEventListener('click', dataClear);

  // allクリア（駅名・路線名・データ）
  var btnAllClr = document.getElementById('all-clr');
  btnAllClr.addEventListener('click', allClear);
}
