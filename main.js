import * as THREE from 'three';

import Stats from './js/stats.module.js';
import { GUI } from './js/lil-gui.module.min.js';

import { OrbitControls } from './js/OrbitControls.js';

let camera, scene, renderer, bulbLight, bulbMat, hemiLight, stats;
let ballMat, cubeMat, floorMat, bigCubeMat;

let leftPressed = false;
let rightPressed = false;
let upPressed = false;
let downPressed = false;

let previousShadowMap = false;


// ref for lumens: http://www.power-sure.com/lumens.htm
const bulbLuminousPowers = {
    "110000 lm (1000W)": 110000,
    "3500 lm (300W)": 3500,
    "1700 lm (100W)": 1700,
    "800 lm (60W)": 800,
    "400 lm (40W)": 400,
    "180 lm (25W)": 180,
    "20 lm (4W)": 20,
    "Off": 0
};

// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
const hemiLuminousIrradiances = {
    "0.0001 lx (Moonless Night)": 0.0001,
    "0.002 lx (Night Airglow)": 0.002,
    "0.5 lx (Full Moon)": 0.5,
    "3.4 lx (City Twilight)": 3.4,
    "50 lx (Living Room)": 50,
    "100 lx (Very Overcast)": 100,
    "350 lx (Office Room)": 350,
    "400 lx (Sunrise/Sunset)": 400,
    "1000 lx (Overcast)": 1000,
    "18000 lx (Daylight)": 18000,
    "50000 lx (Direct Sun)": 50000
};

const params = {
    shadows: true,
    exposure: 0.68,
    bulbPower: Object.keys( bulbLuminousPowers )[ 4 ],
    hemiIrradiance: Object.keys( hemiLuminousIrradiances )[ 0 ]
};

function init() {

    const container = document.getElementById( 'container' );

    stats = new Stats();
    container.appendChild( stats.dom );


    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.x = - 4;
    camera.position.z = 4;
    camera.position.y = 2;

    scene = new THREE.Scene();

    const bulbGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
    bulbLight = new THREE.PointLight( 0xffee88, 1, 100, 2 );

    bulbMat = new THREE.MeshStandardMaterial( {
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    } );
    bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
    bulbLight.position.set( 0, 2, 0 );
    bulbLight.castShadow = true;
    scene.add( bulbLight );

    hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
    scene.add( hemiLight );

    floorMat = new THREE.MeshStandardMaterial( {
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 0.0005
    } );
    floorMat.userData.ground = true
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load( "textures/hardwood2_diffuse.jpg", function ( map ) {

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 24 );
        map.encoding = THREE.sRGBEncoding;
        floorMat.map = map;
        floorMat.needsUpdate = true;

    } );
    textureLoader.load( "textures/hardwood2_bump.jpg", function ( map ) {

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 24 );
        floorMat.bumpMap = map;
        floorMat.needsUpdate = true;

    } );
    textureLoader.load( "textures/hardwood2_roughness.jpg", function ( map ) {

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 24 );
        floorMat.roughnessMap = map;
        floorMat.needsUpdate = true;

    } );

    cubeMat = new THREE.MeshStandardMaterial( {
        roughness: 0.7,
        color: 0xffffff,
        bumpScale: 0.002,
        metalness: 0.2
    } );

    bigCubeMat = new THREE.MeshStandardMaterial( {
        roughness: 0.7,
        color: 0xffffff,
        bumpScale: 0.002,
        metalness: 0.2
    } );
    textureLoader.load( "textures/brick_diffuse.jpg", function ( map ) {

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 1, 1 );
        map.encoding = THREE.sRGBEncoding;
        cubeMat.map = map;
        cubeMat.needsUpdate = true;

    } );
    textureLoader.load( "textures/brick_bump.jpg", function ( map ) {

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 1, 1 );
        cubeMat.bumpMap = map;
        cubeMat.needsUpdate = true;

    } );

    ballMat = new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        roughness: 0.5,
        metalness: 1.0
    } );
    textureLoader.load( "textures/earth_atmos_2048.jpg", function ( map ) {

        map.anisotropy = 4;
        map.encoding = THREE.sRGBEncoding;
        ballMat.map = map;
        ballMat.needsUpdate = true;

    } );
    textureLoader.load( "textures/earth_specular_2048.jpg", function ( map ) {

        map.anisotropy = 4;
        map.encoding = THREE.sRGBEncoding;
        ballMat.metalnessMap = map;
        ballMat.needsUpdate = true;

    } );

    textureLoader.load( "textures/crate.gif", function ( map ) {

        map.anisotropy = 4;
        map.encoding = THREE.sRGBEncoding;
        bigCubeMat.map = map;
        bigCubeMat.needsUpdate = true;

    } );

    const floorGeometry = new THREE.PlaneGeometry( 20, 20 );
    const floorMesh = new THREE.Mesh( floorGeometry, floorMat );
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = - Math.PI / 2.0;
    scene.add( floorMesh );

    const ballGeometry = new THREE.SphereGeometry( 0.25, 32, 32 );
    const ballMesh = new THREE.Mesh( ballGeometry, ballMat );
    ballMesh.position.set( 1, 0.25, 1 );
    ballMesh.rotation.y = Math.PI;
    ballMesh.castShadow = true;
    scene.add( ballMesh );

    const boxGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    const boxMesh = new THREE.Mesh( boxGeometry, cubeMat );
    boxMesh.position.set( - 0.5, 0.25, - 1 );
    boxMesh.castShadow = true;
    scene.add( boxMesh );
    

    const boxMesh2 = new THREE.Mesh( boxGeometry, cubeMat );
    boxMesh2.position.set( 0, 0.25, - 5 );
    boxMesh2.castShadow = true;
    scene.add( boxMesh2 );

    const boxMesh3 = new THREE.Mesh( boxGeometry, cubeMat );
    boxMesh3.position.set( 7, 0.25, 0 );
    boxMesh3.castShadow = true;
    scene.add( boxMesh3 );

    const bigBoxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
    const boxMesh4 = new THREE.Mesh( bigBoxGeometry, bigCubeMat );
    boxMesh4.position.set( 5, 0.5, -5);
    boxMesh4.castShadow = true;
    scene.add( boxMesh4 );

    const boxMesh5 = new THREE.Mesh( bigBoxGeometry, bigCubeMat );
    boxMesh5.position.set( 3, 0.5, 0 );
    boxMesh5.castShadow = true;
    scene.add( boxMesh5 );

    const boxMesh6 = new THREE.Mesh( bigBoxGeometry, bigCubeMat );
    boxMesh6.position.set( -5, 0.5, -6 );
    boxMesh6.castShadow = true;
    scene.add( boxMesh6 );

    const boxMesh7 = new THREE.Mesh( bigBoxGeometry, bigCubeMat );
    boxMesh7.position.set( -4.3, 0.5, 2 );
    boxMesh7.castShadow = true;
    scene.add( boxMesh7 );

    const boxMesh8 = new THREE.Mesh( bigBoxGeometry, bigCubeMat );
    boxMesh8.position.set( 0, 0.5, 4.5 );
    boxMesh8.castShadow = true;
    scene.add( boxMesh8 );

    const boxMesh9 = new THREE.Mesh( bigBoxGeometry, bigCubeMat );
    boxMesh9.position.set( 8, 0.5, 8 );
    boxMesh9.castShadow = true;
    scene.add( boxMesh9 );

    const bigBallGeometry = new THREE.SphereGeometry( 0.75, 32, 32 );
    const bigBallMesh1 = new THREE.Mesh( bigBallGeometry, ballMat );
    bigBallMesh1.position.set( 1, 0.7, 1 );
    bigBallMesh1.rotation.y = Math.PI;
    bigBallMesh1.castShadow = true;
    scene.add( bigBallMesh1 );

    const bigBallMesh2 = new THREE.Mesh( bigBallGeometry, ballMat );
    bigBallMesh2.position.set( -3, 0.7, 4 );
    bigBallMesh2.rotation.y = Math.PI;
    bigBallMesh2.castShadow = true;
    scene.add( bigBallMesh2 );

    const bigBallMesh3 = new THREE.Mesh( bigBallGeometry, ballMat );
    bigBallMesh3.position.set( -2.5, 0.7, -4 );
    bigBallMesh3.rotation.y = Math.PI;
    bigBallMesh3.castShadow = true;
    scene.add( bigBallMesh3 );

    const bigBallMesh4 = new THREE.Mesh( bigBallGeometry, ballMat );
    bigBallMesh4.position.set( 4, 0.7, -4);
    bigBallMesh4.rotation.y = Math.PI;
    bigBallMesh4.castShadow = true;
    scene.add( bigBallMesh4 );

    renderer = new THREE.WebGLRenderer();
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.enableKeys = false;
    controls.enableDamping = true;

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    function onKeyDown(event) {
        console.log('keypress');
        let keyCode = event.which;
        if (keyCode == 37) { // Left arrow key
            leftPressed = true;
        } else if (keyCode == 39) { // Right arrow key
            rightPressed = true;
        } else if (keyCode == 38) {
            upPressed = true;
        } else if (keyCode == 40) {
            downPressed = true;
        }
    }
    
    function onKeyUp(event) {
        let keyCode = event.which;
        if (keyCode == 37) { // Left arrow key
            leftPressed = false;
        } else if (keyCode == 39) { // Right arrow key
            rightPressed = false;
        } else if (keyCode == 38) {
            upPressed = false;
        } else if (keyCode == 40) {
            downPressed = false;
        }
    }

    window.addEventListener( 'resize', onWindowResize );


    const gui = new GUI();

    gui.add( params, 'hemiIrradiance', Object.keys( hemiLuminousIrradiances ) );
    gui.add( params, 'bulbPower', Object.keys( bulbLuminousPowers ) );
    gui.add( params, 'exposure', 0, 1 );
    gui.add( params, 'shadows' );
    gui.open();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    if (leftPressed) {
        bulbLight.position.x -= Math.cos(0.00005)*0.02;
        camera.position.x -= Math.cos(0.00005)*0.02
        if(bulbLight.position.x < -10){
            bulbLight.position.x = -10;
        }
    }
    
    if (rightPressed) {
        bulbLight.position.x += Math.cos(0.00005)*0.02;
        camera.position.x += Math.cos(0.00005)*0.02
        if(bulbLight.position.x > 10){
            bulbLight.position.x = 10;
            camera.position.x -= Math.cos(0.00005)*0.02
        }
    }

    if (upPressed) {
        bulbLight.position.z -= Math.cos(0.00005)*0.02;
        camera.position.z -= Math.cos(0.00005)*0.02
        if(bulbLight.position.z < -10){
            bulbLight.position.z = -10;
            camera.position.z += Math.cos(0.00005)*0.02
        }
    }
    
    if (downPressed) {
        bulbLight.position.z += Math.cos(0.00005)*0.02;
        camera.position.z += Math.cos(0.00005)*0.02
        if(bulbLight.position.z > 10){
            bulbLight.position.z = 10;
            camera.position.z -= Math.cos(0.00005)*0.02
        }
    }
    
    renderer.render(scene, camera);
    render();

}

function render() {

    renderer.toneMappingExposure = Math.pow( params.exposure, 5.0 ); // to allow for very bright scenes.
    renderer.shadowMap.enabled = params.shadows;
    bulbLight.castShadow = params.shadows;

    if ( params.shadows !== previousShadowMap ) {

        ballMat.needsUpdate = true;
        cubeMat.needsUpdate = true;
        bigCubeMat.needsUpdate = true;
        floorMat.needsUpdate = true;
        previousShadowMap = params.shadows;

    }

    bulbLight.power = bulbLuminousPowers[ params.bulbPower ];
    bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow( 0.02, 2.0 ); // convert from intensity to irradiance at bulb surface

    hemiLight.intensity = hemiLuminousIrradiances[ params.hemiIrradiance ];
    const time = Date.now() * 0.0005;

    bulbLight.position.y = Math.cos( time ) * 0.75 + 2.25;

    renderer.render( scene, camera );
    stats.update()
}

init();
animate();