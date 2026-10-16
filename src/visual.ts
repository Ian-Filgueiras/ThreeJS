"use strict";

import powerbi from "powerbi-visuals-api";
import * as THREE from "three";
import "../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

export class Visual implements IVisual {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private geometry: THREE.BoxGeometry;
    private material: THREE.MeshStandardMaterial;
    private cube: THREE.Mesh;
    private animationFrameId = 0;

    constructor(options: VisualConstructorOptions) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.camera.position.z = 3;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(1, 1);
        this.renderer.domElement.style.display = "block";
        options.element.appendChild(this.renderer.domElement);

        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.material = new THREE.MeshStandardMaterial({
            color: 0x2589ff,
            roughness: 0.5
        });
        this.cube = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.cube);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.position.set(3, 4, 5);
        this.scene.add(directionalLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1));

        this.animate();
    }

    public update(options: VisualUpdateOptions): void {
        const width = Math.max(1, options.viewport.width);
        const height = Math.max(1, options.viewport.height);

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.position.z = 3 / Math.min(1, this.camera.aspect);
        this.camera.far = this.camera.position.z + 10;
        this.camera.updateProjectionMatrix();
    }

    private animate = (): void => {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.015;
        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = requestAnimationFrame(this.animate);
    };

    public destroy(): void {
        cancelAnimationFrame(this.animationFrameId);
        this.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();
        this.renderer.domElement.remove();
        this.scene.clear();
    }
}
