var canvas = document.getElementById("renderCanvas");

window.addEventListener("DOMContentLoaded", init.bind(this,canvas));

function init(canvas) {
  /*** Engine & Scene ***/
  var engine = new BABYLON.Engine(canvas, true);
  var scene = new BABYLON.Scene(engine);

  /*** Main camera & light ***/
  var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, -20), scene);
  camera.setTarget(new BABYLON.Vector3(0,0,0));
  var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  /*** Axis ***/
  // axis(scene,2.5);


  /*** Création Skybox ***/
  var skybox = BABYLON.Mesh.CreateBox("skybox",1000, 0, 0, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene);
  skybox.material = skyboxMaterial;
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0.05);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/nebula", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;


  var loader = new BABYLON.AssetsManager(scene);
  var missileTask = loader.addMeshTask("Missile", "", "models/missile/", "Missile.babylon");
  missileTask.onSuccess = function(task) {
    var missile = task.loadedMeshes[0];
    missile.setEnabled(false);
  }
  var rabbitTask = loader.addMeshTask("Rabbit", "", "models/rabbit/", "Rabbit.babylon");
  rabbitTask.onSuccess = function(task) {
    var rabbit = task.loadedMeshes[0];
    rabbit.setEnabled(false);
  }
  var shipTask = loader.addMeshTask("ship", "", "models/", "ares.babylon");
  shipTask.onSuccess = function(task) {
    /*** Ship [ETAPE 1] ***/
    var goToRight = false, goToLeft = false;
    const maxRight = window.innerWidth/144;
    const minLeft = -maxRight;
    var ship = task.loadedMeshes[0];

    ship.position = new BABYLON.Vector3(0,0,0);
    ship.scaling = new BABYLON.Vector3(0.075,0.075,0.075);

    // Diriger le vaisseau
    window.addEventListener("keydown", (e) => {
      if (e.keyCode == 39 || e.keyCode == 68) {
        console.log("→ Right →");
        goToRight = true;
        goToLeft = !goToRight;
      } else if (e.keyCode == 37 || e.keyCode == 81) {
        console.log("← Left ←");
        goToLeft = true;
        goToRight = !goToLeft;
      }
    },false);

    window.addEventListener("keyup", (e) => {
      if (e.keyCode == 39 || e.keyCode == 68 || e.keyCode == 37 || e.keyCode == 81) {
        console.log("• Neutral •");
        goToLeft = goToRight = false;
      }
    },false);

    scene.registerBeforeRender(function () {
     if (goToRight && ship.position.x < maxRight) {
       ship.position.x += 0.5;
     } else if (goToLeft && ship.position.x > minLeft) {
       ship.position.x -= 0.5;
     }
    });

    // Animation du vaisseau au tir
    var barrelRoll = new BABYLON.Animation(
     "barrelRoll",
     "rotation.x",
     60,
     BABYLON.Animation.ANIMATIONTYPE_FLOAT,
     BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    var barrelKeys = new Array();
    barrelKeys.push({
      frame: 0,
      value: 0.0
    },{
      frame: 60,
      value: Math.degToRad(360)
    });

    barrelRoll.setKeys(barrelKeys);
    ship.animations = new Array();
    ship.animations.push(barrelRoll);

    /*** Aliens [ETAPE 2] ***/
    var aliens = new Array();
    const aliensPerLine = 10;
    const numberOfLines = 4;

    for (var i = 0; i < aliensPerLine; i++) {
      for (var j = 0; j < numberOfLines; j++) {
        /* ALIENS (lapins) */
        var alien = scene.getMeshByName('Rabbit').clone();
        alien.scaling = new BABYLON.Vector3(0.05,0.05,0.05);
        alien.rotation.y = Math.degToRad(180);
        alien.setEnabled(true);
        /* ALIENS (formes aléatoires)
        switch (Math.getRandInt(4)) {
          case 0:
            var alien = new BABYLON.Mesh.CreateSphere("alien_"+i, 4, 2, scene);
            break;
          case 1:
            var alien = new BABYLON.Mesh.CreateBox("alien_"+i, 1.5, scene);
            break;
          case 2:
            var alien = new BABYLON.Mesh.CreateCylinder("alien_"+i, 1.5, 1.5, 1.5, 10, scene);
            break;
          case 3:
            var alien = new BABYLON.Mesh.CreateTorus("alien_"+i, 1.5, 0.5, 10, scene);
            break;
          default:
            var alien = new BABYLON.Mesh.CreateSphere("alien_"+i, 4, 2, scene);
            break;
        }
        alien.rotation = new BABYLON.Vector3(Math.degToRad(Math.getRandInt(360)),Math.degToRad(Math.getRandInt(360)),Math.degToRad(Math.getRandInt(360)));
        */
        alien.position = new BABYLON.Vector3(minLeft+((maxRight*2)/aliensPerLine)*(i%10),0,20-(2.5*j));
        aliens.push(alien);
      }
    }

    /*** Lasers [ETAPE 3 & 4] ***/
    var lasers = new Array();
    var lasersParticles = new Array();
    window.addEventListener("keydown", (e) => {
      if (e.keyCode == 32) {
        console.log("Piou piou !");
        var laser = scene.getMeshByName('Missile').clone();
        laser.setEnabled(true);
        laser.scaling = new BABYLON.Vector3(0.0015,0.0015,0.0015);
        laser.position = new BABYLON.Vector3(ship.position.x,ship.position.y,ship.position.z);
        lasers.push(laser);
        scene.beginAnimation(ship, 0, 60, false);

        // Particules des lasers
        var laserParticles = new BABYLON.ParticleSystem("colParticles",50,scene);
        laserParticles.particleTexture = new BABYLON.Texture("Flare.png",scene);
        laserParticles.minSize = .5;
        laserParticles.maxSize = 1;
        laserParticles.updateSpeed = 0.08;
        laserParticles.color1 = new BABYLON.Color3.FromHexString("#cc2300");
        laserParticles.color2 = new BABYLON.Color3.FromHexString("#cc2300");
        laserParticles.colorDead = new BABYLON.Color3.FromHexString("#cc2300");
        laserParticles.start();
        lasersParticles.push(laserParticles);
      }
    },false);

    // Particules des explosions
    var colParticles = new BABYLON.ParticleSystem("colParticles",50,scene);
    colParticles.particleTexture = new BABYLON.Texture("Flare.png",scene);
    colParticles.minSize = .25;
    colParticles.maxSize = .75;
    colParticles.emitRate = 150;
    colParticles.direction1 = new BABYLON.Vector3(-1, -1, -1);
    colParticles.direction2 = new BABYLON.Vector3(1, 1, 1);
    colParticles.updateSpeed = 0.03;
    colParticles.color1 = new BABYLON.Color3.FromHexString("#cc2300");
    colParticles.color2 = new BABYLON.Color3.FromHexString("#ff7f00");
    colParticles.colorDead = new BABYLON.Color3.FromHexString("#ffa100");
    colParticles.targetStopDuration = 2/3;



    scene.registerBeforeRender(function () {

     for (var i = 0; i < lasers.length; i++) {
       lasersParticles[i].emitter = lasers[i];
       lasers[i].position.z++;
       if (lasers[i].position.z > 1000) {
         lasers[i].dispose();
         lasers.splice(i,1);
         return;
       }
       for (var j = 0; j < aliens.length; j++) {
         intersect = lasers[i].intersectsMesh(aliens[j],false);
         if (intersect) {
           var exlosionDummy = new BABYLON.Mesh.CreateSphere("exlosionDummy", 1, 1, scene);
           exlosionDummy.visibility = 0;
           exlosionDummy.position = aliens[j].position;
           colParticles.emitter = exlosionDummy;
           colParticles.start();
           lasers[i].dispose();
           lasers.splice(i,1);
           aliens[j].dispose();
           aliens.splice(j,1);
           console.log("Reste : "+aliens.length);
           if (aliens.length == 0) {
             alert("Bravo, vous avez sauv\u00E9 le monde !");
             console.log("Bravo, vous avez sauv\u00E9 le monde !");
           }
           return;
         }
       }
     }
    });


  } // Fin meshtask



  /*** Rendering ***/
  loader.onFinish = function (tasks) {render(engine,scene);};
  loader.load(); // Démarre le chargement
}

function render(engine,scene) {
  engine.runRenderLoop(function() {
   scene.render();
  });
}

function axis(scene,size) {
  // X
  var axisX = new BABYLON.Mesh.CreateCylinder("axisX", size, size/15, size/15, 3, scene);
  axisX.position = new BABYLON.Vector3(0,size/2,0);
  var materialX = new BABYLON.StandardMaterial("materialX", scene);
  materialX.diffuseColor = new BABYLON.Color3(0,1,0);
  axisX.material = materialX;

  // Y
  var axisY = new BABYLON.Mesh.CreateCylinder("axisY", size, size/15, size/15, 3, scene);
  axisY.rotation.x = Math.degToRad(90);
  axisY.rotation.z = Math.degToRad(90);
  axisY.position = new BABYLON.Vector3(size/2,0,0);
  var materialY = new BABYLON.StandardMaterial("materialY", scene);
  materialY.diffuseColor = new BABYLON.Color3(1,0,0);
  axisY.material = materialY;

  // Z
  var axisZ = new BABYLON.Mesh.CreateCylinder("axisZ", size, size/15, size/15, 3, scene);
  axisZ.position = new BABYLON.Vector3(0,0,size/2);
  axisZ.rotation.x = Math.degToRad(90);
  var materialZ = new BABYLON.StandardMaterial("materialZ", scene);
  materialZ.diffuseColor = new BABYLON.Color3(0,0,1);
  axisZ.material = materialZ;
}

Math.degToRad = function(deg) {return deg*Math.PI/180;}
Math.getRandInt = function(max) {return Math.floor(Math.random()*Math.floor(max));}
