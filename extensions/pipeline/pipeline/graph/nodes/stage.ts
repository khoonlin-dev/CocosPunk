import { gfx, js, Material, path, Vec2 } from 'cc';
import { LGraphNode } from '../@types/litegraph';
import { BasePass, } from '../../passes/base-pass';
import { BlitPass } from '../../passes/blit-pass';
import { liteGraph } from '../graph';
import { readPixels } from '../../utils/utils';
import { updateNextNodes } from '../utils/nodes';
import { loadResources } from '../../utils/npm';
import { ForwardPass } from '../../passes/forward-pass';
import { DeferredGBufferPass } from '../../passes/deferred-gbuffer-pass';
import { DeferredLightingPass } from '../../passes/deferred-lighting-pass';
import { DeferredPostPass } from '../../passes/deferred-post-pass';
import { BloomPass } from '../../passes/bloom-pass';
import { TAAPass } from '../../passes/taa-pass';
import { FSRPass } from '../../passes/fsr-pass';
import { ForwardPostPass } from '../../passes/forward-post-pass';
import { ZoomScreenPass } from '../../passes/zoom-screen-pass';
import { CustomShadowPass } from '../../passes/shadow-pass';

export function createStageGraph (sclass: typeof BasePass) {
    let name = js.getClassName(sclass);

    function Stage () {
        let self = this as LGraphNode;

        // input slots
        self.addInput('Camera Output', 'Camera Output');
        self.addInput('RenderTexture', 'RenderTexture');

        self.addInput('Custom Size', 'vec2');

        // output slots
        self.addOutput('RenderTexture', 'RenderTexture');

        let onPropertyChanges: Map<string, Function> = new Map;

        let pass = new sclass();
        this.pass = pass;

        self.addProperty('showResult', false, 'bool');

        function updateSize () {
            let originHeight = self.computeSize()[1];
            self.size[1] = originHeight;
            if (pass.outputTexture) {
                let width = self.size[0];
                let height = width * pass.outputTexture.height / pass.outputTexture.width;

                height *= pass.outputTexture.window.framebuffer.colorTextures.length;

                if (self.properties.showResult) {
                    self.size[1] = originHeight + height + 5;
                }
            }
        }

        onPropertyChanges.set('material', (v: string) => {
        })

        // if (globalThis.pipelineAssets) {
        //     let names = globalThis.pipelineAssets.materialNames;

        //     function setMaterial (effectName: string) {
        //         pass.material = globalThis.pipelineAssets.materialMap.get(effectName)
        //     }

        //     let name = 'material';
        //     let value = this.properties.material || pass.materialName || names[0];

        //     let widget = self.addWidget("combo", name, value, name, { values: names });
        //     self.addProperty(name, widget.value, widget.type);

        //     setMaterial(value);

        //     onPropertyChanges.set('material', (v: string) => {
        //         setMaterial(v);
        //     })

        //     self.addWidget('button', 'show result', null, () => {
        //         self.properties.showResult = !self.properties.showResult;
        //     });
        // }

        let props = (sclass as any).__props__;
        let attrs = (sclass as any).__attrs__;
        props.forEach(p => {
            if (p.startsWith('_')) {
                return;
            }
            if (p === 'inputType' || p === 'renderToScreen') {
                return;
            }

            let value = pass[p];
            let type = attrs[p + '$_$type'];
            let widget
            if (type === 'Enum') {
                let enumList = attrs[p + '$_$enumList'].map((e: any) => e.name);
                self.addWidget("combo", p, enumList[value], p, { values: enumList });

                onPropertyChanges.set(p, (v: string) => {
                    pass[p] = enumList.indexOf(v);
                })
            }
            else if (typeof value === 'string') {
                widget = self.addWidget("text", p, value, p);
            }
            else if (typeof value === 'number') {
                widget = self.addWidget("number", p, value, p);
            }
            else if (typeof value === 'boolean') {
                widget = self.addWidget("toggle", p, value, p);
            }

            if (widget) {
                self.addProperty(p, widget.value, widget.type);
            }
        })

        self.onPropertyChanged = function (name: string, value: string, prevalue: string) {
            let func = onPropertyChanges.get(name);
            if (func) {
                func(value, prevalue);
            }
            else {
                pass[name] = value;
            }
        }

        this.onUpdateStage = function updateStage (prev: LGraphNode, passes: BasePass[]) {
            pass.renderToScreen = false;
            // pass.outputName = ''

            if (pass.checkEnable()) {
                let customSize = self.getInputData(2);
                if (customSize) {
                    pass.useCustomSize = true;
                    pass.customSize.x = customSize[0];
                    pass.customSize.y = customSize[1];
                }
                else {
                    pass.useCustomSize = false;
                }

                passes.push(pass);
                updateNextNodes(self, passes);
            }
            else {
                updateNextNodes(prev, passes, 0, self.getOutputNodes(0));
            }

        }

        function createDrawFunc (index = 0) {
            let imgData: ImageData;
            let imgCanvas: HTMLCanvasElement;
            let imgCtx: CanvasRenderingContext2D;
            let buffer32f: Float32Array;

            return function draw (ctx: CanvasRenderingContext2D, tex: gfx.Texture) {
                let imgWidth = self.size[0];
                let imgHeight = imgWidth * pass.outputTexture.height / pass.outputTexture.width;

                let width = pass.outputTexture.width;
                let height = pass.outputTexture.height;

                if (!imgData) {
                    imgCanvas = document.createElement('canvas') as HTMLCanvasElement;
                    imgCanvas.width = width;
                    imgCanvas.height = height;

                    imgCtx = imgCanvas.getContext('2d');
                    imgData = imgCtx.getImageData(0, 0, width, height);
                }

                if (tex.format === gfx.Format.R32F) {
                    if (!buffer32f) {
                        buffer32f = new Float32Array(width * height);
                    }

                    readPixels(pass.outputTexture, buffer32f, index);

                    for (let x = 0; x < width; x++) {
                        for (let y = 0; y < height; y++) {

                            let dstIdx = (x + y * width) * 4;
                            imgData.data[dstIdx] = buffer32f[x + y * width] * 255;
                            imgData.data[dstIdx + 1] = 0
                            imgData.data[dstIdx + 2] = 0
                            imgData.data[dstIdx + 3] = 255
                        }
                    }
                }
                else if (tex.format === gfx.Format.RGBA32F) {
                    if (!buffer32f) {
                        buffer32f = new Float32Array(width * height * 4);
                    }

                    readPixels(pass.outputTexture, buffer32f, index);

                    for (let x = 0; x < width; x++) {
                        for (let y = 0; y < height; y++) {

                            let dstIdx = (x + y * width) * 4;
                            imgData.data[dstIdx] = buffer32f[dstIdx] * 255;
                            imgData.data[dstIdx + 1] = buffer32f[dstIdx + 1] * 255
                            imgData.data[dstIdx + 2] = buffer32f[dstIdx + 2] * 255
                            imgData.data[dstIdx + 3] = buffer32f[dstIdx + 3] * 255
                        }
                    }
                }
                else {
                    readPixels(pass.outputTexture, imgData.data as any, index);
                }

                imgCtx.putImageData(imgData, 0, 0);

                let colorTextures = pass.outputTexture.window.framebuffer.colorTextures;

                ctx.save();
                ctx.scale(1, -1);
                ctx.drawImage(imgCanvas, 0, 0, width, height, 0, -self.size[1] + imgHeight * (colorTextures.length - 1 - index), imgWidth, imgHeight);
                ctx.restore();
            }
        }

        self.onDrawBackground = (ctx, canvas) => {
            updateSize()

            if (self.properties.showResult && pass.outputTexture) {
                let colorTextures = pass.outputTexture.window.framebuffer.colorTextures;

                for (let i = 0; i < colorTextures.length; i++) {
                    let funcName = 'draw_color_' + i;
                    if (!self[funcName]) {
                        self[funcName] = createDrawFunc(i);
                    }

                    self[funcName](ctx, colorTextures[i]);
                }
            }
        }

        self.onRemoved = () => {
            pass.destroy();
        }

        self.size = self.computeSize();
    }
    Stage.title = name;

    delete liteGraph.registered_node_types[`pipeline/${name}`];
    liteGraph.registerNodeType(`pipeline/${name}`, Stage as any);
}


createStageGraph(BasePass);
createStageGraph(BlitPass);
createStageGraph(ForwardPass);
createStageGraph(ForwardPostPass);
createStageGraph(DeferredGBufferPass);
createStageGraph(DeferredLightingPass);
createStageGraph(DeferredPostPass);
createStageGraph(BloomPass);
createStageGraph(TAAPass);
createStageGraph(FSRPass);
createStageGraph(ZoomScreenPass);
createStageGraph(CustomShadowPass);
