import { BasePass, } from "./base-pass";
import { _decorator, renderer, gfx, builtinResMgr, Input, rendering, CCString, Vec4, game, Material, director } from "cc";
import { getCameraUniqueID } from "../utils/utils";
import { passUtils } from "../utils/pass-utils";
import { settings } from "./setting";
import { CameraSetting } from "../camera-setting";

const { type, property, ccclass } = _decorator;
const { RasterView, AttachmentType, AccessType, ResourceResidency, LightInfo, SceneFlags, QueueHint, ComputeView } = rendering;
const { Format, LoadOp, StoreOp, ClearFlagBit, Color, Viewport } = gfx

@ccclass('ForwardPostPass')
export class ForwardPostPass extends BasePass {
    _materialName = 'blit-screen';
    materialMap: Map<renderer.scene.Camera, Material> = new Map

    @property({ override: true })
    name = 'ForwardPostPass'

    @property({ override: true })
    outputNames = ['ForwardPostColor']

    public render (camera: renderer.scene.Camera, ppl: rendering.Pipeline): void {
        const cameraID = getCameraUniqueID(camera);
        const area = this.getRenderArea(camera);
        let width = area.width;
        let height = area.height;

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
        let isOffScreen = director.root.mainWindow !== camera.window;

        if (!isOffScreen) {
            width /= shadingScale;
            height /= shadingScale;
        }

        let outoutName = slot0
        let cs = camera.node.getComponent(CameraSetting)
        if (cs && cs.customOutPutName) {
            outoutName = cs.customOutPutName
        }

        passUtils.addRasterPass(width, height, 'post-process', `CameraPostprocessPass${cameraID}`)
            .setViewport(area.x, area.y, width, height)
            .setPassInput(input0, 'inputTexture')
            .addRasterView(outoutName, Format.RGBA8, isOffScreen)
            .blitScreen(0)
        // ppl.updateRenderWindow(slot0, camera.window);

        this.renderProfiler(camera);
    }
}
