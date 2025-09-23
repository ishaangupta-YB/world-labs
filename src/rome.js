/**
 * Rome Demo - Three.js + Rapier Physics + Gaussian Splats
 *
 * Experience the ancient city of Rome featuring:
 * - Spark library for Gaussian Splat rendering (@sparkjsdev/spark)
 * - Rapier physics engine for realistic collision detection
 * - Three.js for 3D graphics and scene management
 * - First-person controls with pointer lock
 * - Physics-based movement and exploration
 *
 * Controls:
 * - Click to enter first-person mode
 * - WASD: Move around
 * - R/F: Fly up/down
 * - Space: Jump
 * - M: Toggle debug mode (shows collision mesh instead of splats)
 */

import * as RAPIER from "@dimforge/rapier3d-compat";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { getAssetUrl, ASSETS } from "./config.js";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

// ===================================================================================================
// CONFIGURATION
// ===================================================================================================

const GLOBAL_SCALE = 0.7;

const CONFIG = {
	// Physics
	GRAVITY: { x: 0, y: -9.81 * GLOBAL_SCALE, z: 0 },
	RAPIER_INIT_TIMEOUT: 10000,

	// Movement
	MOVE_SPEED: 3 * GLOBAL_SCALE,

	// Physics Objects
	ENVIRONMENT_RESTITUTION: 0.0,

	// Assets - Using rome.spz
	ENVIRONMENT: {
		SPLATS: getAssetUrl(ASSETS.MODELS.ROME),
		SPLAT_SCALE: 3,
	},
};

// Player collider constants
const PLAYER_RADIUS = 0.1 * GLOBAL_SCALE;
const PLAYER_HALF_HEIGHT = 0.5 * GLOBAL_SCALE;
const PLAYER_EYE_HEIGHT = 1.0 * GLOBAL_SCALE;
const PLAYER_JUMP_SPEED = 8.0 * GLOBAL_SCALE;

// ===================================================================================================
// UTILITY FUNCTIONS
// ===================================================================================================

/**
 * Configures materials to respond properly to lighting
 */
function setupMaterialsForLighting(object, brightnessMultiplier = 1.0) {
	object.traverse((child) => {
		if (child.isMesh && child.material) {
			const materials = Array.isArray(child.material)
				? child.material
				: [child.material];
			const newMaterials = [];

			for (const material of materials) {
				// Remove emissive properties
				if (material.emissive) material.emissive.setHex(0x000000);
				if (material.emissiveIntensity !== undefined)
					material.emissiveIntensity = 0;

				// Convert basic materials to standard materials for lighting
				if (material.type === "MeshBasicMaterial") {
					const newMaterial = new THREE.MeshStandardMaterial({
						color: material.color,
						map: material.map,
						normalMap: material.normalMap,
						roughness: 0.8,
						metalness: 0.1,
					});
					newMaterials.push(newMaterial);
				} else {
					// Adjust existing material properties
					if (material.roughness !== undefined) material.roughness = 0.8;
					if (material.metalness !== undefined) material.metalness = 0.1;

					// Apply brightness multiplier
					if (material.color && brightnessMultiplier !== 1.0) {
						const currentColor = material.color.clone();
						currentColor.multiplyScalar(brightnessMultiplier);
						material.color = currentColor;
					}

					// Fix transparency issues
					if (material.transparent && material.opacity === 1) {
						material.transparent = false;
					}

					newMaterials.push(material);
				}
			}

			// Update mesh material reference
			child.material = Array.isArray(child.material)
				? newMaterials
				: newMaterials[0];
		}
	});
}

// Fixed physics timestep (decouple physics from framerate)
const FIXED_TIME_STEP = 1 / 60;
const MAX_SUBSTEPS = 5;

// Global mute flag and helper
window.__MUTED__ = false;
function setMuted(m) {
	window.__MUTED__ = !!m;
	// Update UI icon if present
	const btn = document.getElementById("volumeToggle");
	if (btn) btn.textContent = window.__MUTED__ ? "🔇" : "🔊";
}

// ===================================================================================================
// MAIN APPLICATION
// ===================================================================================================

async function init() {
	// ===== RAPIER PHYSICS INITIALIZATION =====
	try {
		const initPromise = RAPIER.init();
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error("Rapier initialization timeout")),
				CONFIG.RAPIER_INIT_TIMEOUT,
			),
		);
		await Promise.race([initPromise, timeoutPromise]);
		console.log("✓ Rapier physics initialized");
	} catch (error) {
		console.error("Failed to initialize Rapier:", error);
		// Continue without physics - the demo will still show the environment
	}

	// ===== THREE.JS SCENE SETUP =====
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x202020);

	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000,
	);
	camera.rotation.y = Math.PI; // Start facing opposite direction

	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(1);
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	// Spark renderer for splats (explicit), enable 32-bit sorting
	const sparkRenderer = new SparkRenderer({ renderer });
	console.log("created spark renderer");
	// Set sort32 on the default SparkViewpoint (per Spark docs), and enable radial sorting
	if (sparkRenderer.defaultView) {
		console.log("setting sort32");
		sparkRenderer.defaultView.sort32 = true;
		sparkRenderer.defaultView.sortRadial = true;
	}
	// Attach to camera to maintain precision and viewpoint alignment
	camera.add(sparkRenderer);

	document.body.appendChild(renderer.domElement);

	// ===== LIGHTING SETUP =====
	// Warm hemisphere lighting
	const hemiLight = new THREE.HemisphereLight(0xfff4e6, 0x2a1a0a, 1.0);
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	// Warm directional lighting
	const dirLight = new THREE.DirectionalLight(0xffe6cc, 0.3);
	dirLight.position.set(3, 10, -5);
	scene.add(dirLight);

	// Atmospheric point light
	const pointLight = new THREE.PointLight(0xffa500, 2.0, 10);
	pointLight.position.set(-3.2, -1, 4.5);
	scene.add(pointLight);

	// ===== PHYSICS WORLD =====
	const world = new RAPIER.World(CONFIG.GRAVITY);

	// Create FPS player capsule body
	let playerBody = null;
	{
		const startY = 1.2;
		const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
			.setTranslation(0, startY, 0)
			.lockRotations(true)
			.setLinearDamping(4.0)
			.setCcdEnabled(true);
		playerBody = world.createRigidBody(bodyDesc);
		const colliderDesc = RAPIER.ColliderDesc.capsule(
			PLAYER_HALF_HEIGHT,
			PLAYER_RADIUS,
		)
			.setFriction(0.8)
			.setRestitution(0.0);
		world.createCollider(colliderDesc, playerBody);
	}

	// ===== CONTROLS SETUP =====
	const controls = new PointerLockControls(camera, document.body);

	// UI elements
	const startButton = document.getElementById("start");
	const infoElement = document.getElementById("info");
	const loadingElement = document.getElementById("loading");

	startButton.addEventListener("click", () => controls.lock());
	controls.addEventListener("lock", () => {
		infoElement.style.display = "none";
		const r = document.getElementById("reticle");
		if (r) r.style.display = "block";
	});
	controls.addEventListener("unlock", () => {
		infoElement.style.display = "";
		const r = document.getElementById("reticle");
		if (r) r.style.display = "none";
	});

	// Wire volume button (even though no audio in this simplified version)
	const volumeBtn = document.getElementById("volumeToggle");
	if (volumeBtn) {
		volumeBtn.addEventListener("click", () => {
			setMuted(!window.__MUTED__);
		});
		// Initialize icon state
		setMuted(window.__MUTED__);
	}

	// ===== ENVIRONMENT LOADING =====
	let environment = null;
	let splatMesh = null;
	let splatsLoaded = false;
	// Debug material handling for environment
	const envDebugMaterial = new THREE.MeshNormalMaterial();
	const originalEnvMaterials = new Map(); // mesh.uuid -> material or material[]

	loadingElement.style.display = "block";

	// Load Gaussian splats
	splatMesh = new SplatMesh({
		url: CONFIG.ENVIRONMENT.SPLATS,
		onLoad: () => {
			console.log(`✓ Gaussian splats loaded (${splatMesh.numSplats} splats)`);

			splatsLoaded = true;
			if (environment) environment.visible = false; // Hide collision mesh
			scene.add(splatMesh);
			loadingElement.style.display = "none";
		},
	});

	// Configure splat mesh
	const { SPLAT_SCALE } = CONFIG.ENVIRONMENT;
	splatMesh.scale.set(SPLAT_SCALE, -SPLAT_SCALE, SPLAT_SCALE);
	splatMesh.position.set(0, 0, 0);

	// Create a simple ground plane for physics if no collision mesh is provided
	// This ensures the player doesn't fall through the world
	const groundSize = 50;
	const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
	const groundCollider = RAPIER.ColliderDesc.cuboid(groundSize, 0.1, groundSize)
		.setTranslation(0, -1, 0)
		.setRestitution(CONFIG.ENVIRONMENT_RESTITUTION);
	world.createCollider(groundCollider, groundBody);

	// ===== INPUT HANDLING =====
	const keyState = {};
	let debugMode = false;

	// Keyboard input
	window.addEventListener("keydown", (e) => {
		keyState[e.code] = true;

		// Debug mode toggle → remapped to 'M'
		if (e.code === "KeyM") {
			debugMode = !debugMode;
			toggleDebugMode();
		}

		// Jump on Space if grounded
		if (e.code === "Space" && playerBody) {
			if (isPlayerGrounded()) {
				const v = playerBody.linvel();
				playerBody.setLinvel({ x: v.x, y: PLAYER_JUMP_SPEED, z: v.z }, true);
			}
		}

		// Print player position and orientation (yaw/pitch) on 'P'
		if (e.code === "KeyP") {
			if (playerBody) {
				const p = playerBody.translation();
				const posStr = `pos=(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`;
				const forward = new THREE.Vector3();
				camera.getWorldDirection(forward);
				forward.normalize();
				// yaw around Y, pitch around X
				const yaw = Math.atan2(forward.x, forward.z) * 180 / Math.PI;
				const pitch = Math.asin(THREE.MathUtils.clamp(forward.y, -1, 1)) * 180 / Math.PI;
				const rot = playerBody.rotation?.();
				const rotStr = rot ? `quat=(${rot.x.toFixed(3)}, ${rot.y.toFixed(3)}, ${rot.z.toFixed(3)}, ${rot.w.toFixed(3)})` : "";
				console.log(`[Player] ${posStr}  yaw=${yaw.toFixed(1)}°  pitch=${pitch.toFixed(1)}°  ${rotStr}`);
			} else {
				console.log("[Player] body not initialized yet");
			}
		}
	});

	window.addEventListener("keyup", (e) => {
		keyState[e.code] = false;
	});

	function isPlayerGrounded() {
		if (!playerBody) return false;
		const p = playerBody.translation();
		// Cast from body center straight down well past the feet
		const origin = { x: p.x, y: p.y, z: p.z };
		const dir = { x: 0, y: -1, z: 0 };
		const ray = new RAPIER.Ray(origin, dir);
		const footOffset = PLAYER_HALF_HEIGHT + PLAYER_RADIUS;
		const hit = world.castRayAndGetNormal(ray, footOffset + 0.6, true);
		if (!hit) return false;
		const normalY = hit.normal ? hit.normal.y : 1.0;
		// Consider grounded if the ground is within a small margin below feet and not a steep wall
		const nearGround = hit.toi <= footOffset + 0.12 && normalY > 0.3;
		const vy = playerBody.linvel().y;
		return nearGround && vy <= 0.6;
	}

	function toggleDebugMode() {
		if (!splatMesh || !splatsLoaded) return;

		if (debugMode) {
			// Hide splats, show wireframe
			scene.remove(splatMesh);
			// Create a simple wireframe representation
			if (!environment) {
				const wireGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
				environment = new THREE.Mesh(wireGeometry, envDebugMaterial);
				environment.rotation.x = -Math.PI / 2;
				scene.add(environment);
			}
			environment.visible = true;
		} else {
			// Show splats, hide wireframe
			if (environment) environment.visible = false;
			scene.add(splatMesh);
		}
	}

	// Movement
	function updateMovement(deltaTime) {
		if (!controls.isLocked || !playerBody) return;

		// Compute desired horizontal velocity from camera look
		const forward = new THREE.Vector3();
		camera.getWorldDirection(forward);
		forward.y = 0;
		forward.normalize();

		const right = new THREE.Vector3();
		right.crossVectors(forward, camera.up).normalize();

		const moveDir = new THREE.Vector3();
		if (keyState.KeyW) moveDir.add(forward);
		if (keyState.KeyS) moveDir.sub(forward);
		if (keyState.KeyD) moveDir.add(right);
		if (keyState.KeyA) moveDir.sub(right);

		let targetX = 0;
		let targetZ = 0;
		if (moveDir.lengthSq() > 0) {
			moveDir.normalize().multiplyScalar(CONFIG.MOVE_SPEED);
			// Project desired movement to slide along walls using a short forward ray
			const desired = moveDir.clone();
			const adjusted = adjustVelocityForWalls(desired);
			targetX = adjusted.x;
			targetZ = adjusted.z;
		}

		const current = playerBody.linvel();
		let targetY = current.y; // preserve vertical velocity (gravity)
		if (keyState.KeyR) targetY += CONFIG.MOVE_SPEED; // optional fly up
		if (keyState.KeyF) targetY -= CONFIG.MOVE_SPEED; // optional fly down

		playerBody.setLinvel({ x: targetX, y: targetY, z: targetZ }, true);
	}

	function adjustVelocityForWalls(desiredVel) {
		const v = desiredVel.clone();
		if (v.lengthSq() === 0) return v;
		const p = playerBody.translation();
		const horiz = new THREE.Vector3(v.x, 0, v.z);
		const len = horiz.length();
		if (len === 0) return v;
		horiz.normalize();
		// Raycast a small distance ahead at mid-body height
		const origin = { x: p.x, y: p.y, z: p.z };
		const dir = { x: horiz.x, y: 0, z: horiz.z };
		const ray = new RAPIER.Ray(origin, dir);
		const lookahead = PLAYER_RADIUS + 0.1;
		const hit = world.castRayAndGetNormal(ray, lookahead, true);
		const normal = hit?.normal;
		if (normal) {
			// Remove into-wall component: slide along wall
			const n = new THREE.Vector3(normal.x, normal.y, normal.z);
			n.y = 0; // only consider horizontal wall normal
			if (n.lengthSq() > 0.0001) {
				n.normalize();
				const vn = v.dot(n);
				if (vn > 0) v.addScaledVector(n, -vn);
			}
		}
		return v;
	}


	// ===== ANIMATION LOOP =====
	let previousTime = performance.now();
	let physicsAccumulator = 0;

	function animate(currentTime) {
		requestAnimationFrame(animate);
		const frameTime = Math.min((currentTime - previousTime) / 1000, 0.1);
		previousTime = currentTime;

		// Update movement controls → affects player body velocity
		updateMovement(frameTime);

		// Step physics simulation with fixed timestep
		physicsAccumulator += frameTime;
		const steps = Math.min(
			Math.floor(physicsAccumulator / FIXED_TIME_STEP),
			MAX_SUBSTEPS,
		);
		for (let i = 0; i < steps; i++) {
			world.step();

			physicsAccumulator -= FIXED_TIME_STEP;
		}

		// Sync camera to player body (FPS view)
		if (playerBody) {
			const p = playerBody.translation();
			const feetY = p.y - (PLAYER_HALF_HEIGHT + PLAYER_RADIUS);
			camera.position.set(p.x, feetY + PLAYER_EYE_HEIGHT, p.z);
		}

		// Update Spark accumulation/sorting if autoUpdate path misses it
		sparkRenderer?.update({ scene });

		renderer.render(scene, camera);
	}

	// ===== WINDOW RESIZE HANDLING =====
	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	// Start the animation loop
	animate(previousTime);
	console.log("🚀 Rome world initialized successfully!");
}

// Initialize the application
init();
