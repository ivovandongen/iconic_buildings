import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import mapboxgl from 'mapbox-gl'
// import 'THREE.GLTFLoader' from 'three-gltf-loader'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXZvdmFuZG9uZ2VuIiwiYSI6ImNpbzVpdG10eDAwM3R1bWtubGw0Y2dsb3kifQ.S0KL6oRTIrz12tQw1etMcg';
var map = (window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    zoom: 18,
    center: [-73.975333, 40.751622],
    pitch: 60,
    antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
}));

// parameters to ensure the model is georeferenced correctly on the map
var modelOrigin = [-73.975333, 40.751622];
var modelAltitude = 0;
var modelRotate = [Math.PI / 2, 0, 0];

var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
);

// transformation parameters to position, rotate and scale the 3D model onto the map
var modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
};

// configuration of the custom layer for a 3D model per the CustomLayerInterface
var customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // create two three.js lights to illuminate the model
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        var directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        // use the three.js GLTF loader to add the 3D model to the three.js scene
        var loader = new GLTFLoader();
        loader.load(
            // 'models/ChryslerBuilding_embedded.gltf',
            'models/ChryslerBuilding.glb',
            function (gltf) {
                this.scene.add(gltf.scene);
            }.bind(this)
        );
        this.map = map;

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });

        this.renderer.autoClear = false;
    },
    render: function (gl, matrix) {
        var rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
        );
        var rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
        );
        var rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
        );

        var m = new THREE.Matrix4().fromArray(matrix);
        var l = new THREE.Matrix4()
            .makeTranslation(
                modelTransform.translateX,
                modelTransform.translateY,
                modelTransform.translateZ
            )
            .scale(
                new THREE.Vector3(
                    modelTransform.scale,
                    -modelTransform.scale,
                    modelTransform.scale
                )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
};

// The 'building' layer in the mapbox-streets vector source contains building-height
// data from OpenStreetMap.
var buildingsLayer = {
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
        'fill-extrusion-color': '#aaa',

        // use an 'interpolate' expression to add a smooth transition effect to the
        // buildings as the user zooms in
        'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
        ],
        'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
    }
};

map.on('style.load', function () {
    // Insert the layer beneath any symbol layer.
    var layers = map.getStyle().layers;

    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addLayer(customLayer, labelLayerId);
    map.addLayer(buildingsLayer, labelLayerId);
});

console.log("Map setup");

