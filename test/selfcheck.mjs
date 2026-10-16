import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import * as THREE from "three";

const instances = [];
class MockRenderer {
    constructor(options) {
        assert.equal(options.antialias, true);
        assert.equal(options.alpha, true);
        this.domElement = { style: {}, remove: () => { this.removed = true; } };
        this.renderCalls = 0;
        instances.push(this);
    }
    setSize(width, height) {
        this.domElement.width = width;
        this.domElement.height = height;
    }
    render(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.renderCalls++;
    }
    dispose() { this.disposed = true; }
}

let nextFrame = 0;
const pendingFrames = new Map();
const moduleObject = { exports: {} };
const source = fs.readFileSync(path.join(process.cwd(), "src/visual.ts"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
});
vm.runInNewContext(compiled.outputText, {
    exports: moduleObject.exports,
    module: moduleObject,
    require: name => {
        if (name === "three") return { ...THREE, WebGLRenderer: MockRenderer };
        if (name.endsWith(".less")) return {};
        throw new Error("Unexpected runtime import: " + name);
    },
    requestAnimationFrame: callback => {
        const id = ++nextFrame;
        pendingFrames.set(id, callback);
        return id;
    },
    cancelAnimationFrame: id => pendingFrames.delete(id)
});

const canvases = [];
const visual = new moduleObject.exports.Visual({
    element: { appendChild: canvas => canvases.push(canvas) }
});
const renderer = instances[0];
const scene = renderer.scene;
const camera = renderer.camera;
const cube = scene.children.find(child => child.isMesh);
assert.ok(cube);
assert.equal(canvases.length, 1);
assert.equal(pendingFrames.size, 1);
assert.equal(cube.position.length(), 0);
assert.ok(scene.children.some(child => child.isDirectionalLight));
assert.ok(scene.children.some(child => child.isAmbientLight));

for (const [width, height] of [[640, 360], [160, 400], [0, 0], [1, 4000]]) {
    visual.update({ viewport: { width, height } });
    assert.equal(renderer.domElement.width, Math.max(1, width));
    assert.equal(renderer.domElement.height, Math.max(1, height));
    assert.equal(camera.aspect, Math.max(1, width) / Math.max(1, height));
    assert.ok(camera.projectionMatrix.elements.every(Number.isFinite));
    camera.updateMatrixWorld();
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
        new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    );
    for (const angle of [0, Math.PI / 4, Math.PI / 2]) {
        cube.rotation.set(angle, angle * 0.7, 0);
        scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(cube);
        for (const x of [bounds.min.x, bounds.max.x])
            for (const y of [bounds.min.y, bounds.max.y])
                for (const z of [bounds.min.z, bounds.max.z])
                    assert.ok(frustum.containsPoint(new THREE.Vector3(x, y, z)));
    }
}
assert.equal(instances.length, 1);
assert.equal(renderer.scene, scene);
assert.equal(renderer.camera, camera);
assert.equal(renderer.scene.children.find(child => child.isMesh), cube);
const beforeX = cube.rotation.x;
const beforeY = cube.rotation.y;
const [frameId, callback] = pendingFrames.entries().next().value;
pendingFrames.delete(frameId);
callback(16);
assert.ok(cube.rotation.x > beforeX);
assert.ok(cube.rotation.y > beforeY);
assert.equal(pendingFrames.size, 1);

let geometryDisposed = false;
let materialDisposed = false;
cube.geometry.addEventListener("dispose", () => { geometryDisposed = true; });
cube.material.addEventListener("dispose", () => { materialDisposed = true; });
visual.destroy();
assert.equal(pendingFrames.size, 0);
assert.ok(geometryDisposed && materialDisposed && renderer.disposed && renderer.removed);
assert.equal(scene.children.length, 0);
console.log("PASS: animation, resize, zero size, portrait framing, object reuse, disposal.");
