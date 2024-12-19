import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Initialize constants
const parentDiv = document.querySelector('.app');
const parentWidth = parentDiv.clientWidth;
const parentHeight = parentDiv.clientHeight * 1.05;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f9f9f9');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(
  95,
  parentWidth / parentHeight,
  0.01,
  20
);

// Materials
const material = new THREE.MeshStandardMaterial({
  color: '#007aff',
  flatShading: true,
  metalness: 0.5,
  roughness: 0.2,
});
const wireMaterial = new THREE.MeshBasicMaterial({
  color: '#005bb5',
  wireframe: true,
  transparent: true,
  opacity: 0.1,
});

// Create geometry function
function createGeometry(width, height) {
  return new THREE.IcosahedronGeometry(Math.max(width, height) / 600, 2);
}

// Setup scene function
function setupScene() {
  renderer.setSize(parentWidth, parentHeight);
  parentDiv.appendChild(renderer.domElement);
  camera.position.z = 5;

  const geometry = createGeometry(parentWidth, parentHeight);
  const mesh = new THREE.Mesh(geometry, material);
  const wireMesh = new THREE.Mesh(geometry, wireMaterial);

  wireMesh.scale.setScalar(1.001);
  mesh.add(wireMesh);
  mesh.position.y -= 1; // Move the main shape down by 1 unit
  scene.add(mesh);

  // Update lighting
  const hemiLight = new THREE.HemisphereLight('#ffffff', '#f9f9f9', 0.6);
  const dirLight = new THREE.DirectionalLight('#ffffff', 1);
  dirLight.position.set(5, 5, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;

  scene.add(hemiLight);
  scene.add(dirLight);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, wireMesh };
}

// Setup controls
function setupControls() {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.03;
  controls.enableZoom = false; // Disable zoom by default
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  // Enable pinch-to-zoom on mobile devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    controls.enableZoom = true;
  }

  return controls;
}

// Initialize scene
const { mesh, wireMesh } = setupScene();
const controls = setupControls();

// Add mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED;

// Add more lights
const pointLight = new THREE.PointLight('#ffffff', 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const spotLight = new THREE.SpotLight('#ffffff', 1);
spotLight.position.set(-10, -10, -10);
spotLight.castShadow = true;
scene.add(spotLight);

// Create multiple geometries with different shapes and animations
const geometries = [];
const meshes = [];
const wireMeshes = [];
const numGeometries = 20;

const shapes = [
  new THREE.IcosahedronGeometry(0.5, 1),
  new THREE.TorusGeometry(0.5, 0.2, 16, 10),
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.SphereGeometry(0.5, 32, 100),
];

const colors = [
  '#007aff',
  '#005bb5',
  '#003f7f',
  '#001f3f',
  '#004080',
  '#0066cc',
  '#3399ff',
  '#66ccff',
  '#99ccff',
  '#cce6ff',
];

function isPositionValid(position, radius) {
  for (let i = 0; i < meshes.length; i++) {
    const distance = position.distanceTo(meshes[i].position);
    if (distance < radius * 2) {
      return false;
    }
  }
  return true;
}

for (let i = 0; i < numGeometries; i++) {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: color,
    flatShading: true,
    metalness: 0.5,
    roughness: 0.8,
  });
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });

  const mesh = new THREE.Mesh(shape, meshMaterial);
  const wireMesh = new THREE.Mesh(shape, wireMaterial);

  wireMesh.scale.setScalar(1.001);
  mesh.add(wireMesh);

  let position;
  do {
    position = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
  } while (!isPositionValid(position, 0.5));

  mesh.position.copy(position);

  scene.add(mesh);
  geometries.push(shape);
  meshes.push(mesh);
  wireMeshes.push(wireMesh);
}

// Add particle system
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 500;
const particlesPositions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  particlesPositions[i] = (Math.random() - 0.5) * 20;
}

particlesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(particlesPositions, 3)
);
const particlesMaterial = new THREE.PointsMaterial({
  color: '#99ccff',
  size: 0.05,
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Handle mouse move
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove);

// Handle click event
function onClick(event) {
  if (INTERSECTED) {
    INTERSECTED.material.color.set(Math.random() * 0xffffff);
  }
}

window.addEventListener('click', onClick);

// Handle window resize
function handleResize() {
  const newWidth = parentDiv.clientWidth;
  const newHeight = parentDiv.clientHeight;

  renderer.setSize(newWidth, newHeight);
  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
}

window.addEventListener('resize', handleResize);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED && INTERSECTED.material.emissive) {
        INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      }
      INTERSECTED = intersects[0].object;
      if (INTERSECTED.material.emissive) {
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        INTERSECTED.material.emissive.setHex(0xff0000);
      }
    }
  } else {
    if (INTERSECTED && INTERSECTED.material.emissive) {
      INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    }
    INTERSECTED = null;
  }

  // Animate geometries
  meshes.forEach((mesh, index) => {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
    mesh.position.x += Math.sin(Date.now() * 0.001 + index) * 0.01;
    mesh.position.y += Math.cos(Date.now() * 0.001 + index) * 0.01;
  });

  renderer.render(scene, camera);
}

animate();
