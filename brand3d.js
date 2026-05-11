/**
 * brand3d.js — Marca Conexinfinity em 3D usando Three.js
 *
 * Carrega o path do símbolo (mesmo do SVG sprite), extruda em 3D,
 * aplica materiais metálicos + ponto azul autoiluminado,
 * adiciona luzes cyan + azul-marca, anima rotação + flutuação + mouse parallax.
 *
 * Tudo procedural, zero arquivos externos além do Three.js (CDN).
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { SVGLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/SVGLoader.js";

/* SVG da marca (mesmo path do <symbol> usado no resto do site) */
const BRAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8704.52 4154.8">
  <path d="M4808.49 2105.46c55.19,-86.41 131.56,-138.38 199.28,-206.33 367,-368.31 959.49,-1099.21 1431.62,-1188.49 880.87,-166.59 1586.46,517.38 1607.87,1314.55 22.45,835.53 -702.04,1580.95 -1581.52,1417.76 -462.54,-85.83 -668.48,-369.57 -906.26,-598.19l-750.99 -739.3zm-467.32 490.51c214.33,120.16 932.88,943.4 1273.62,1198.25 993.02,742.75 2275.86,240.86 2783.37,-647.48 1069.54,-1872.11 -869.91,-3855.16 -2606.94,-2897.77 -232.74,128.27 -411.93,362.29 -646.8,570.07 -76.96,68.09 -127.31,148.52 -202.03,221.02l-1651.29 1629.02c-265.91,262.85 -524.18,649.09 -918.04,748.21 -1051.16,264.55 -1769.73,-609.78 -1695.61,-1488.51 57.86,-686.09 561.13,-1199.59 1205.09,-1240.32 347.62,-21.99 427.68,60.93 685.73,143.07 115.74,-151.38 331.84,-301.69 428.71,-471.9 -684.45,-625.38 -1935.67,-298.99 -2407.84,242.18 -262.15,300.46 -469.96,575.36 -557.7,1109.28 -314.95,1916.52 1811.94,3041.55 3012.19,2111.69l858.79 -807.17c124.21,-119.56 302.02,-319.93 438.75,-419.66z"/>
</svg>`;

class BrandScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.clock = new THREE.Clock();
    this._ready = false;

    this._setupScene();
    this._buildModel();
    this._bindEvents();
    this._animate();
  }

  _setupScene() {
    this.scene = new THREE.Scene();

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    /* Iluminação: cyan + azul-marca + fill suave */
    this.scene.add(new THREE.AmbientLight(0x1a1f2e, 0.45));

    const cyan = new THREE.PointLight(0x00e5ff, 28, 28, 1.6);
    cyan.position.set(4, 3, 5);
    this.scene.add(cyan);

    const blue = new THREE.PointLight(0x4d5cff, 22, 28, 1.6);
    blue.position.set(-4, -2, 4);
    this.scene.add(blue);

    const fill = new THREE.PointLight(0xffffff, 6, 18);
    fill.position.set(0, 0, 8);
    this.scene.add(fill);

    /* Grupo da marca — tudo dentro pra animar junto */
    this.markGroup = new THREE.Group();
    this.scene.add(this.markGroup);
  }

  _buildModel() {
    /* Extruda o path do SVG em fita 3D */
    const loader = new SVGLoader();
    const data = loader.parse(BRAND_SVG);

    const ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x080a14,
      metalness: 0.88,
      roughness: 0.16,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      reflectivity: 0.6,
    });

    const SCALE = 0.00095;

    data.paths.forEach((path) => {
      const shapes = SVGLoader.createShapes(path);
      shapes.forEach((shape) => {
        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: 220,
          bevelEnabled: true,
          bevelThickness: 60,
          bevelSize: 45,
          bevelSegments: 6,
          curveSegments: 36,
        });
        /* Centraliza */
        geom.computeBoundingBox();
        const c = new THREE.Vector3();
        geom.boundingBox.getCenter(c);
        geom.translate(-c.x, -c.y, -c.z);
        /* Escala + flip Y (SVG é Y-down, Three.js é Y-up) */
        geom.scale(SCALE, -SCALE, SCALE);

        const mesh = new THREE.Mesh(geom, ribbonMaterial);
        this.markGroup.add(mesh);
      });
    });

    /* Bolinha azul — esfera autoiluminada na posição original do logo */
    const dotGeom = new THREE.SphereGeometry(0.34, 48, 48);
    const dotMaterial = new THREE.MeshStandardMaterial({
      color: 0x1520bf,
      emissive: 0x4d5cff,
      emissiveIntensity: 1.6,
      metalness: 0.5,
      roughness: 0.25,
    });
    this.dot = new THREE.Mesh(dotGeom, dotMaterial);

    /* Posição (cx=3673.59 cy=1421.75 no SVG; centro do viewBox: 4352.26, 2077.4) */
    const offX = (3673.59 - 4352.26) * SCALE;        // -0.645
    const offY = -(1421.75 - 2077.4) * SCALE;        // +0.622 (Y invertido)
    this.dot.position.set(offX, offY, 0.55);
    this.markGroup.add(this.dot);

    /* Halo sutil em volta da bolinha (sprite com gradiente radial) */
    const haloTex = this._createGlowTexture();
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x4d5cff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.halo = new THREE.Sprite(haloMat);
    this.halo.scale.setScalar(2.4);
    this.halo.position.copy(this.dot.position);
    this.halo.position.z += 0.05;
    this.markGroup.add(this.halo);

    /* Tilt de descanso pra ficar mais cinematográfico */
    this.markGroup.rotation.x = -0.08;

    this._ready = true;
    this.container.classList.add("loaded");
  }

  _createGlowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(180,200,255,0.55)");
    g.addColorStop(0.6, "rgba(77,92,255,0.15)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _bindEvents() {
    window.addEventListener("pointermove", (e) => {
      this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => this._onResize());
      ro.observe(this.container);
    } else {
      window.addEventListener("resize", () => this._onResize());
    }
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const t = this.clock.getElapsedTime();

    if (this._ready) {
      /* Mouse smoothing (lerp) */
      this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.04;
      this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.04;

      /* Rotação contínua + influência do mouse */
      this.markGroup.rotation.y = t * 0.22 + this.mouse.x * 0.4;
      this.markGroup.rotation.x = -0.08 + this.mouse.y * -0.25;

      /* Flutuação vertical (efeito "respirar") */
      this.markGroup.position.y = Math.sin(t * 0.85) * 0.13;
      this.markGroup.position.x = Math.cos(t * 0.6) * 0.08;

      /* Bolinha pulsa de leve */
      if (this.dot) {
        this.dot.material.emissiveIntensity = 1.45 + Math.sin(t * 2.4) * 0.35;
      }
      if (this.halo) {
        this.halo.material.opacity = 0.65 + Math.sin(t * 2.4) * 0.2;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

/* Inicializa quando o canvas existir */
const canvas = document.getElementById("brand3d");
if (canvas) {
  /* Detecção mobile + WebGL */
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const hasWebGL = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (e) {
      return false;
    }
  })();

  if (!isMobile && hasWebGL) {
    try {
      new BrandScene(canvas);
    } catch (e) {
      console.warn("[brand3d] Falha ao iniciar cena 3D:", e);
      canvas.style.display = "none";
    }
  } else {
    /* Mobile ou sem WebGL: esconde canvas, deixa o fallback estático */
    canvas.style.display = "none";
  }
}
