import { BasePass } from "./base-pass";
import { _decorator, renderer, gfx, builtinResMgr, Input, rendering, CCString, sys, director, Vec4 } from "cc";
import { getCameraUniqueID, getRenderArea, SRGBToLinear } from "../utils/utils";
import { settings } from "./setting";
import { EDITOR } from "cc/env";
import { passUtils } from "../utils/pass-utils";

const { type, property, ccclass } = _decorator;
const { RasterView, AttachmentType, AccessType, ResourceResidency, LightInfo, SceneFlags, QueueHint, ComputeView } = rendering;
const { Format, LoadOp, StoreOp, ClearFlagBit, Color, Viewport } = gfx

@ccclass('DeferredGBufferPass')
export class DeferredGBufferPass extends BasePass {
    _name = 'DeferredGBufferPass'
    _materialName = 'blit-screen';

    @property({ override: true })
    outputNames = ['gBufferColor', 'gBufferNormal', 'gBufferEmissive', 'gBufferPosition', 'gBufferDS']

    // uniquePass = true;

    public render (camera: renderer.scene.Camera, ppl: rendering.Pipeline): void {
        settings.gbufferPass = this;

        // hack: use fog uniform to set deferred pipeline
        director.root.pipeline.pipelineSceneData.fog.fogStart = 1;

        const area = this.getRenderArea(camera);
        const width = area.width;
        const height = area.height;

        passUtils.clearFlag = ClearFlagBit.COLOR | ClearFlagBit.DEPTH_STENCIL;
        Vec4.set(passUtils.clearColor, 0, 0, 0, 1);
        Vec4.set(passUtils.clearDepthColor, camera.clearDepth, camera.clearStencil, 0, 0);

        const colFormat = Format.RGBA16F;
        let posFormat = colFormat;
        if (!sys.isMobile) {
            posFormat = Format.RGBA32F
        }

        const slot0 = this.slotName(camera, 0);
        const slot1 = this.slotName(camera, 1);
        const slot2 = this.slotName(camera, 2);
        const slot3 = this.slotName(camera, 3);
        const slot4 = this.slotName(camera, 4);

        passUtils.addRasterPass(width, height, 'default', `${slot0}_Pass`)
            .setViewport(area.x, area.y, width, height)
            .addRasterView(slot0, colFormat, true)
            .addRasterView(slot1, colFormat, true)
            .addRasterView(slot2, colFormat, true)
            .addRasterView(slot3, posFormat, true)
            .addRasterView(slot4, Format.DEPTH_STENCIL, true)
            .version()

        passUtils.pass
            .addQueue(QueueHint.RENDER_OPAQUE)
            .addSceneOfCamera(camera, new LightInfo(), SceneFlags.OPAQUE_OBJECT | SceneFlags.CUTOUT_OBJECT | SceneFlags.DRAW_INSTANCING);

    }
}
