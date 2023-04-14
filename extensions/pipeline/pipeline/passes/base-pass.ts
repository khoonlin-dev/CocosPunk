import { director, game, gfx, Material, PipelineStateManager, renderer, RenderStage, RenderTexture, Vec2, _decorator, pipeline, Enum, Node, rendering, CCString, } from 'cc';
import { EDITOR, JSB } from 'cc/env';
import { HrefSetting } from '../settings/href-setting';
import { passUtils } from '../utils/pass-utils';
import { getCameraUniqueID, getQuadIA, getRenderArea } from '../utils/utils';
import { settings } from './setting';

const { ccclass, type, property } = _decorator;

let _BasePassID = 0

@ccclass('BasePass')
export class BasePass {
    static outputMap: Map<string, RenderTexture> = new Map
    static stages: Map<string, BasePass> = new Map

    _id = 0
    constructor () {
        this._id = _BasePassID++;
    }

    // auto load material name
    _materialName = 'blit-screen';
    get materialName () {
        return this._materialName;
    }

    get material () {
        return globalThis.pipelineAssets.getMaterial(this._materialName);
    }


    @property
    enable = true;

    @property
    name = 'BasePass';

    @property
    shadingScale = 1;

    @property
    customSize = new Vec2(1024, 1024);

    @property(CCString)
    outputNames = []

    @type(Node)
    targetStageNode: Node;

    useCustomSize = false;
    renderToScreen = false;

    rtCount = 1;
    renderTextures: RenderTexture[] = [];

    protected _rect = new gfx.Rect(0, 0, 1, 1);
    clearColors = [new gfx.Color(0, 0, 0, 1)];

    requestDepth = false;

    lastPass: BasePass | undefined;

    uniqueStage = false
    slotName (camera: renderer.scene.Camera, index = 0) {
        let name = this.outputNames[index] + this.name
        if (this.uniqueStage) {
            return name
        }
        return `${name}_${this._id}_${getCameraUniqueID(camera)}`
    }

    finalShadingScale () {
        return this.shadingScale * director.root.pipeline.pipelineSceneData.shadingScale;
    }

    checkEnable () {
        return this.enable;
    }

    renderProfiler (camera) {
        if (HrefSetting.showFps && settings.renderProfiler && !EDITOR) {
            passUtils.pass.showStatistics = true
            settings.renderProfiler = false;
        }
    }

    // protected _finalShadingSize = new Vec2;
    // finalShadingSize (camera: renderer.scene.Camera) {
    //     let shadingScale = this.finalShadingScale();

    //     let width = game.canvas!.width;
    //     let height = game.canvas!.height;

    //     if (this.useCustomSize) {
    //         width = this.customSize.x;
    //         height = this.customSize.y;
    //     }

    //     this._finalShadingSize.set(
    //         Math.floor(width * shadingScale),
    //         Math.floor(height * shadingScale)
    //     )

    //     return this._finalShadingSize;
    // }

    _renderArea = new gfx.Rect()
    getRenderArea (camera) {
        let shadingScale = this.finalShadingScale();
        let area = getRenderArea(this._renderArea, camera, camera.window.width * shadingScale, camera.window.height * shadingScale)
        area.width = Math.floor(area.width)
        area.height = Math.floor(area.height)
        return area
    }

    destroy () {

    }

    get outputTexture (): RenderTexture | null {
        return null
    }

    public render (camera: renderer.scene.Camera, ppl: rendering.Pipeline) {

    }
}
