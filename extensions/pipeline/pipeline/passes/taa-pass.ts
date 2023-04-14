import { builtinResMgr, director, gfx, Mat4, Material, renderer, rendering, Texture2D, Vec2, Vec4, _decorator } from "cc";
import { EDITOR, JSB } from "cc/env";
import { TAAMask } from "../components/taa-mask";
import { HrefSetting } from "../settings/href-setting";
import { passUtils } from "../utils/pass-utils";
import { getCameraUniqueID, getRenderArea } from "../utils/utils";
import { BasePass } from "./base-pass";
import { settings } from "./setting";

const { ccclass, property } = _decorator

let tempVec4 = new Vec4
const slotNames = ['TAA_First', 'TAA_Second']

@ccclass('TAAPass')
export class TAAPass extends BasePass {
    _materialName = 'deferred-taa';
    materialMap: Map<renderer.scene.Camera, Material> = new Map
    prevMatViewProj = new Mat4;

    @property({ override: true })
    name = 'TAAPass'

    checkEnable (): boolean {
        if (settings.bakingReflection) {
            return false;
        }
        return this.enable &&
            globalThis.TAASetting && globalThis.TAASetting.instance && globalThis.TAASetting.instance.enable &&
            !!HrefSetting.taa;
    }

    slotName (camera: renderer.scene.Camera, index = 0) {
        if (!this.checkEnable()) {
            return this.lastPass.slotName(camera, index);
        }

        let taa = globalThis.TAASetting.instance;

        if (taa.taaTextureIndex < 0) {
            return slotNames[0];
        }

        return slotNames[(taa.taaTextureIndex + 1) % 2];
    }

    // public onResize () {
    //     this.taaTextureIndex = -1;
    //     this.sampleIndex = -1;
    // }

    firstRender = true;
    public render (camera: renderer.scene.Camera, ppl: rendering.Pipeline): void {
        if (!this.checkEnable()) {
            return;
        }
        let taa = globalThis.TAASetting.instance;

        const cameraID = getCameraUniqueID(camera);
        const area = this.getRenderArea(camera);
        const width = area.width;
        const height = area.height;

        passUtils.clearFlag = gfx.ClearFlagBit.COLOR;
        Vec4.set(passUtils.clearColor, 0, 0, 0, 1);

        // material
        let material = this.materialMap.get(camera);
        if (!material || material.parent !== this.material) {
            material = new renderer.MaterialInstance({
                parent: this.material
            })
            material.recompileShaders({
                USE_TAA_MASK: !EDITOR,
            })
            this.materialMap.set(camera, material);
        }

        passUtils.material = material;

        // material.setProperty('inputViewPort',
        //     new Vec4(
        //         width / game.canvas.width, height / game.canvas.height,
        //         0, 0
        //     )
        // );

        let firstRender = this.firstRender
        if (firstRender) {
            this.prevMatViewProj.set(camera.matViewProj);
            this.firstRender = false;
        }
        material.setProperty('taaParams1', tempVec4.set(taa.sampleOffset.x, taa.sampleOffset.y, taa.feedback, 0))
        material.setProperty('taaTextureSize', tempVec4.set(1 / width, 1 / height, 1 / width, 1 / height))
        material.setProperty('taaPrevViewProj', this.prevMatViewProj);
        this.prevMatViewProj.set(camera.matViewProj);

        // input output
        let input0 = this.lastPass.slotName(camera, 0);
        let historyTexture = slotNames[taa.taaTextureIndex % 2];

        if (firstRender) {
            historyTexture = input0;
        }

        let slot0 = this.slotName(camera, 0);

        let posTex = 'gBufferPosition'
        if (settings.gbufferPass) {
            posTex = settings.gbufferPass.slotName(camera, 3);
        }

        let layoutName = 'DeferredTAA' + (taa.taaTextureIndex < 0 ? -1 : (taa.taaTextureIndex % 2))
        passUtils.addRasterPass(width, height, layoutName, `CameraTAAPass${cameraID}`)
            .setViewport(area.x, area.y, width, height)
            .setPassInput(input0, 'inputTexture')
            .setPassInput(posTex, 'posTex')
            .setPassInput(historyTexture, 'taaPrevTexture')

        if (!EDITOR) {

            let setter = passUtils.pass as any;
            if (!JSB) {
                setter.addConstant('TaaUBO', layoutName);
            }
            if (!globalThis.taaMask) {
                let black = builtinResMgr.get('black-texture') as Texture2D
                setter.setTexture('motionMaskTex', black.getGFXTexture());
                setter.setSampler('motionMaskTex', black.getGFXSampler());
            }
            else {
                passUtils.setPassInput('TAA_MASK', 'motionMaskTex')
            }
        }

        passUtils.addRasterView(slot0, gfx.Format.RGBA16F, true, rendering.ResourceResidency.PERSISTENT)
            .blitScreen(0)
            .version()
    }
}

