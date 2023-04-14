import { BasePass } from "./base-pass";
import { _decorator, renderer, gfx, builtinResMgr, Input, rendering, CCString, Vec4, game, Material } from "cc";
import { getCameraUniqueID } from "../utils/utils";
import { passUtils } from "../utils/pass-utils";
import { settings } from "./setting";
import { EDITOR } from "cc/env";
import { HrefSetting } from "../settings/href-setting";

const { type, property, ccclass } = _decorator;
const { RasterView, AttachmentType, AccessType, ResourceResidency, LightInfo, SceneFlags, QueueHint, ComputeView } = rendering;
const { Format, LoadOp, StoreOp, ClearFlagBit, Color, Viewport } = gfx

@ccclass('DeferredPostPass')
export class DeferredPostPass extends BasePass {
    _materialName = 'final-post';
    materialMap: Map<renderer.scene.Camera, Material> = new Map

    @property({ override: true })
    name = 'DeferredPostPass'

    @property({ override: true })
    outputNames = ['DeferredPostColor', 'DeferredPostDS']

    params1 = new Vec4
    params2 = new Vec4

    public render (camera: renderer.scene.Camera, ppl: rendering.Pipeline): void {
        const cameraID = getCameraUniqueID(camera);
        const area = this.getRenderArea(camera);

        const input0 = this.lastPass.slotName(camera, 0);
        const slot0 = this.slotName(camera, 0);

        passUtils.clearFlag = camera.clearFlag & gfx.ClearFlagBit.COLOR;
        Vec4.set(passUtils.clearColor, 0, 0, 0, 1);

        let material = this.materialMap.get(camera);
        if (!material || material.parent !== this.material) {
            material = new renderer.MaterialInstance({
                parent: this.material
            })
            this.materialMap.set(camera, material);
        }

        passUtils.material = material;

        let shadingScale = this.finalShadingScale()
        material.setProperty('params1',
            this.params1.set(
                game.canvas.width, game.canvas.height,
                settings.outputRGBE ? 1 : 0,
                settings.tonemapped ? 0 : 1
            )
        );

        material.setProperty('params2',
            this.params2.set(
                HrefSetting.fxaa, 0, 0, 0
            )
        );

        let width = area.width / shadingScale;
        let height = area.height / shadingScale;
        passUtils.addRasterPass(width, height, 'post-process', `CameraPostprocessPass${cameraID}`)
            .setViewport(area.x, area.y, width, height)
            .setPassInput(input0, 'inputTexture')
            .addRasterView(slot0, Format.RGBA8, false)
            .blitScreen(0)
            .version()

        this.renderProfiler(camera);
    }
}
