import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/Textures/Loaders";

export class AppScene {
  engine;
  scene;

  constructor(canvas) {
    this.engine = new BABYLON.Engine(canvas);
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
    this.scene = createScene(this.engine, this.canvas);
  }

  debug(debugOn = true) {
    if (debugOn) {
      this.scene.debugLayer.show({ overlay: true, embedMode: true });
    } else {
      this.scene.debugLayer.hide();
    }
  }

  run() {
    this.debug(false);
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
}

let keyStates = {};
let carRoot;
let car;
let angularAcceleration = 0.001;
let angularDeceleration = 0.0005;
let angularSpeed = 0;
let movementAcceleration = 0.001;
let movementDeceleration = 0.001;
let movementSpeed = 0;
let carRotation = Math.PI;
let carMeshes;
const minMovementSpeedForTurn = 0.02;

const handleKeyDown = (event) => {
  const { key } = event;
  keyStates[key] = true;
};

async function loadCar(scene) {
  const result = await BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "./",
    "Car.glb",
    scene,
  );
  const root = scene.getMeshByName("__root__");

  for (const mesh of result.meshes) {
    mesh.scaling = new BABYLON.Vector3(1, 1, 1);
    mesh.rotation.y = Math.PI;
  }
  root.position.x = 5;
  window.addEventListener("keydown", (e) => {
    handleKeyDown(e);
  });
  window.addEventListener("keyup", (e) => {
    keyStates[e.key] = false;
  });
  car = BABYLON.Mesh.MergeMeshes(result.meshes, true, true);

  carRoot = root;
  carMeshes = result.meshes;
}

var createScene = function (engine, canvas) {
  // this is the default code from the playground:

  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);
  scene.registerBeforeRender(() => {
    if ((keyStates["ArrowLeft"] || keyStates["a"]) && movementSpeed > 0.001) {
      angularSpeed -= angularAcceleration;
    } else if (
      (keyStates["ArrowRight"] || keyStates["d"]) &&
      movementSpeed > 0.001
    ) {
      angularSpeed += angularAcceleration;
    } else {
      // If no rotation input, gradually slow down the angular speed to zero
      angularSpeed *= 0.95; // Adjust the factor for the desired deceleration rate
      if (Math.abs(angularSpeed) < 0.0001) {
        angularSpeed = 0;
      }
    }

    // Apply no limits to angular speed
    if (carRoot) {
      carRotation += angularSpeed;
      console.log(angularSpeed);
      for (const mesh of carMeshes) {
        mesh.rotation.y = carRotation;
      }
    }

    // Movement calculation remains the same

    if (keyStates["ArrowUp"] || keyStates["w"]) {
      movementSpeed += movementAcceleration;
    } else if (keyStates["ArrowDown"] || keyStates["s"]) {
      movementSpeed -= movementDeceleration * 5;
      if (movementSpeed < 0) movementSpeed = 0;
    } else {
      movementSpeed *= 0.95; // Adjust the factor for the desired deceleration rate
    }
    if (carRoot) {
      carRoot.position.x += Math.sin(carRotation) * movementSpeed * -1;
      carRoot.position.z += Math.cos(carRotation) * movementSpeed * -1;
    }
  });
  // scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new CannonJSPlugin());
  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera(
    "camera1",
    new BABYLON.Vector3(0, 5, -10),
    scene,
  );

  loadCar(scene);

  // BABYLON.SceneLoader.ImportMeshAsync("NormalCar2", "./", "scene.babylon");

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'sphere' shape.
  var sphere = BABYLON.MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene,
  );

  // Move the sphere upward 1/2 its height
  sphere.position.y = 1;

  // Our built-in 'ground' shape.
  const groundMat = new BABYLON.StandardMaterial("name", scene);
  groundMat.diffuseTexture = new BABYLON.Texture(
    "https://static.vecteezy.com/system/resources/previews/008/557/785/original/seamless-map-road-map-stock-illustration-map-top-view-vector.jpg",
    scene,
  );

  var ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 120, height: 120 },
    scene,
  );

  ground.material = groundMat;

  return scene;
};
