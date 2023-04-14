import { _decorator, renderer, rendering, ReflectionProbeManager, ReflectionProbe, Node, CCObject, game, Game, Mat4, director, gfx } from 'cc';
import { BasePass } from './passes/base-pass';
import { CameraSetting } from './camera-setting';
import { EDITOR, JSB } from 'cc/env';
import { buildDeferred } from './test-custom';
import { passUtils } from './utils/pass-utils';
import { settings } from './passes/setting';
import { HrefSetting } from './settings/href-setting';
import { TAAPass } from './passes/taa-pass';
import { CustomShadowPass } from './passes/shadow-pass';
import { getCameraUniqueID } from './utils/utils';

let EditorCameras = [
    // 'scene:material-previewcamera',
    // 'Scene Gizmo Camera',
    // 'Editor UIGizmoCamera',

    // 'Main Camera'
]

export class CustomPipelineBuilder {
    static pipelines: Map<string, BasePass[]> = new Map

    static registerStages (name: string, stages: BasePass[]) {
        this.pipelines.set(name, stages);
    }

    static unregisterStages (name: string) {
        this.pipelines.set(name, null);
    }

    setupReflectionProbe (cameras: renderer.scene.Camera[], ppl: rendering.Pipeline) {
        if (ReflectionProbeManager === undefined) {
            return;
        }

        const probes = ReflectionProbeManager.probeManager.getProbes();
        for (let i = 0; i < probes.length; i++) {
            let probe = probes[i];

            if (probe.needRender) {
                settings.outputRGBE = true;
                settings.bakingReflection = true;

                let originCameraNode = probe.cameraNode;
                let originCamera = probe.camera;
                let originName = originCamera.name;
                if (!probe.cameras || !probe.cameras.length) {
                    probe.cameras = []
                    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
                        probe._camera = null;
                        const tempNode = new Node(probe.node.name + ' Camera ' + faceIdx);
                        tempNode.hideFlags |= CCObject.Flags.DontSave | CCObject.Flags.HideInHierarchy;
                        tempNode.parent = probe.node;

                        let camera = probe._createCamera(tempNode);
                        camera._name = originName + faceIdx;
                        probe.cameras.push(camera);
                    }
                }

                for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
                    let camera = probe.cameras[faceIdx];
                    camera.attachToScene(probe.node.scene.renderScene);

                    const window = probe.bakedCubeTextures[faceIdx].window;
                    camera.changeTargetWindow(window);
                    camera.setFixedSize(window.width, window.height);
                    camera.update();

                    passUtils.camera = camera;
                    probe._camera = camera;
                    probe.cameraNode = camera.node;

                    //update camera dirction
                    probe.updateCameraDir(faceIdx);

                    this.renderCamera(camera, ppl, 'main')

                    let index = cameras.indexOf(camera);
                    if (index !== -1) {
                        cameras.splice(index, 1);
                    }
                }

                probe._camera = originCamera;
                probe.cameraNode = originCameraNode;

                probe.needRender = false;
                settings.outputRGBE = false;
                settings.bakingReflection = false;
            }
        }
    }

    public setup (cameras: renderer.scene.Camera[], ppl: rendering.Pipeline): void {
        if (!globalThis.pipelineAssets) {
            return;
        }

        director.root.pipeline.pipelineSceneData.shadingScale = HrefSetting.shadingScale
        settings.renderProfiler = false;

        passUtils.ppl = ppl;

        if (EDITOR) {
            this.setupReflectionProbe(cameras, ppl);
        }

        for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (!camera.scene) {
                continue;
            }
            if (camera.node.getComponent(ReflectionProbe)) {
                continue;
            }
            // buildDeferred(camera, ppl);

            if (i === cameras.length - 1) {
                settings.renderProfiler = true;
            }

            passUtils.camera = camera;
            this.renderCamera(camera, ppl)
        }
    }
    renderCamera (camera: renderer.scene.Camera, ppl: rendering.Pipeline, pipelineName = '') {
        // const isGameView = camera.cameraUsage === renderer.scene.CameraUsage.GAME
        // || camera.cameraUsage === renderer.scene.CameraUsage.GAME_VIEW;

        if (EditorCameras.includes(camera.name)) {
            return
        }

        // reset states
        {
            settings.tonemapped = false;
            settings.shadowPass = undefined;
            settings.gbufferPass = false;
            settings.passPathName = '';

            // camera._submitInfo = null;
            // camera.culled = false;
        }

        let cameraSetting = camera.node.getComponent(CameraSetting);

        if (!pipelineName) {
            pipelineName = 'forward';
            if (cameraSetting) {
                pipelineName = cameraSetting.pipeline;
            }
            else if (camera.name === 'Editor Camera') {
                if (camera.projectionType === renderer.scene.CameraProjection.ORTHO) {
                    pipelineName = 'forward';
                }
                else {
                    pipelineName = 'main';
                }
            }
        }
        // else if (EDITOR && !EditorCameras.includes(camera.name)) {
        //     return;
        // }

        let passes = CustomPipelineBuilder.pipelines.get(pipelineName);
        if (!passes) {
            return;
        }

        let taaPass = passes.find(s => s instanceof TAAPass) as TAAPass;
        if (taaPass && taaPass.checkEnable()) {
            (camera as any)._isProjDirty = true
            camera.update(true)

            camera.matProj.m12 += globalThis.TAASetting.instance.sampleOffset.x;
            camera.matProj.m13 += globalThis.TAASetting.instance.sampleOffset.y;

            Mat4.invert(camera.matProjInv, camera.matProj);
            Mat4.multiply(camera.matViewProj, camera.matProj, camera.matView);
            Mat4.invert(camera.matViewProjInv, camera.matViewProj);
            camera.frustum.update(camera.matViewProj, camera.matViewProjInv);
        }

        settings.passPathName += getCameraUniqueID(camera);
        let lastPass: BasePass | undefined = undefined;
        for (let i = 0; i < passes.length; i++) {
            let pass = passes[i];
            if (!pass.checkEnable()) {
                continue;
            }
            pass.lastPass = lastPass;
            // settings.passPathName += '_' + Pass.name;
            pass.render(camera, ppl);

            lastPass = pass
        }
    }
}

// if (JSB) {
//     debugger;
// }

// if (!JSB) {
if (director.root && director.root.device && director.root.device.gfxAPI !== gfx.API.WEBGL) {
    rendering.setCustomPipeline('Deferred', new CustomPipelineBuilder)
}
// }

game.on(Game.EVENT_RENDERER_INITED, () => {
    director.root.pipeline.setMacroInt('CC_PIPELINE_TYPE', 1);
})
