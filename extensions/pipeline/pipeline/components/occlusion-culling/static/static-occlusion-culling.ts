import { Camera, Component, director, geometry, gfx, MeshRenderer, Node, Quat, renderer, Vec2, Vec3, _decorator, ccenum, Color, Mat4, InstancedBuffer } from 'cc';
import { EDITOR } from 'cc/env';
import { Pool } from './utils/pool';
import raycast from './utils/raycast';
import raycastGpu from './utils/raycast-gpu';
import { StaticOcclusionArea } from './static-occlusion-area';
import { CullingBlock } from './static-occlusion-block';
import { modelPoints, sphereDirections } from './utils/utils';
import { getGeometryRenderer } from '../../../utils/debug';
import { Editor } from '../../../utils/npm';

const { ccclass, property, type, executeInEditMode } = _decorator;

let _tempOBB = new geometry.OBB();
let _tempRay = new geometry.Ray();

let _cornerResults: Map<string, renderer.scene.Model[]> = new Map

enum CornerType {
    Center,
    Corner8_Center,
    Seprate_Corner8_Center,
}
ccenum(CornerType);

@ccclass('sync.StaticOcclusionCulling')
@executeInEditMode
export class StaticOcclusionCulling extends Component {
    static instance: StaticOcclusionCulling | undefined;

    @type(Node)
    root: Node | null = null;

    @type(Camera)
    camera: Camera | null = null;

    @property
    _blockSize = 3;
    @property
    get blockSize () {
        return this._blockSize;
    }
    set blockSize (v) {
        this._blockSize = v;
        this.initBlocks();
    }

    @property
    rendererCount = 0;

    @property
    get bake () {
        return false;
    }
    set bake (v) {
        this._startBake(this.areas.concat());
    }

    @property
    get bakeEmpty () {
        return false;
    }
    set bakeEmpty (v) {
        let areas = []
        this.areas.forEach(a => {
            if (a.isEmpty) {
                areas.push(a)
            }
        })
        this._startBake(areas);
    }

    @property
    get stop () {
        return false;
    }
    set stop (v) {
        this._isBaking = false;
    }

    @property
    get checkEmptyArea () {
        return false
    }
    set checkEmptyArea (v) {
        console.log('--------------')
        this._updateAreas()
        this.areas.forEach(a => {
            if (a.isEmpty) {
                console.log(`Area [${a.node.name}] is empty`)
            }
        })
    }

    @property
    renderBlocks = false;
    @property
    renderRaycast = false;
    @property
    renderRaycastLength = 3;

    @property
    _enabledCulling = true;
    @property
    get enabledCulling () {
        return this._enabledCulling;
    }
    set enabledCulling (v) {
        this._enabledCulling = v;

        if (!v) {
            let renderers = this.renderers;
            for (let i = 0; i < renderers.length; i++) {
                renderers[i].model!.enabled = true;
            }
        }

        this._lastLocatedBlock = null;
    }
    @property
    useGpu = true;

    _cornerType = CornerType.Corner8_Center;
    @type(CornerType)
    get cornerType () {
        return this._cornerType;
    }
    set cornerType (v) {
        this._cornerType = v;
        this._gpuKernelDirty = true;
    }

    @property
    bakeInstances = false;

    @property
    _renderers: MeshRenderer[] = []
    get renderers () {
        return this._renderers;
    }
    models: renderer.scene.Model[] = []

    _loadCompeleted = false;
    _currentLocatedBlock: CullingBlock | null = null
    _lastLocatedBlock: CullingBlock | null = null

    areas: StaticOcclusionArea[] = []
    _updateAreas () {
        this.areas = this.getComponentsInChildren(StaticOcclusionArea);
        for (let i = 0; i < this.areas.length; i++) {
            this.areas[i].culling = this;
        }
    }

    onEnable () {
        StaticOcclusionCulling.instance = this;
    }

    onDisable () {
        let renderers = this.renderers;
        for (let i = 0; i < renderers.length; i++) {
            if (renderers[i] && renderers[i].model) {
                renderers[i].model.enabled = true;
            }
        }
        this._lastLocatedBlock = null;

        if (StaticOcclusionCulling.instance === this) {
            StaticOcclusionCulling.instance = undefined;
        }
    }

    start () {
        this._init();
    }
    _init () {
        this._updateAreas();

        if (this.root) {
            this.models = this.renderers.map(r => r && r.model!);

            this.areas.forEach(area => {
                area.blocks.forEach(block => {
                    block.renderers = block.modelIndices.map(index => this.renderers[index])
                })
            })

        }

        let renderers = this.renderers;
        if (this._enabledCulling && this.bakeInstances) {
            for (let i = 0; i < renderers.length; i++) {
                let model = renderers[i].model;
                if (model) {
                    model.enabled = false;
                }
            }
        }

        renderers.forEach(r => {
            if (r && r.model && !r.model._originUpdateUBOs) {
                r.model._originUpdateUBOs = r.model.updateUBOs
                r.model._uboDirty = true
                r.model.updateUBOs = function (stamp: number) {
                    if (r.model && !r.model._uboDirty) {
                        return;
                    }
                    this._originUpdateUBOs(stamp)

                    if (r.model) {
                        r.model._uboDirty = false;
                    }
                }
            }

        })

        this._loadCompeleted = true;
    }

    instances: Set<InstancedBuffer> | undefined;

    calcCulling () {
        if (!this.camera || !this._loadCompeleted || this._isBaking || !this.camera.node) {
            return
        }

        this._currentLocatedBlock = null;

        let renderers = this.renderers;
        let worldPos = this.camera.node.worldPosition;
        let areas = this.areas;
        for (let i = 0; i < areas.length; i++) {
            let area = areas[i];
            if (!area.enabledInHierarchy) {
                continue;
            }

            _tempOBB.center.set(area.node.worldPosition);
            let worldScale = area.node.getWorldScale();
            _tempOBB.halfExtents.set(worldScale.x / 2, worldScale.y / 2, worldScale.z / 2);

            if (!geometry.intersect.obbPoint(_tempOBB, worldPos as Vec3)) {
                continue;
            }

            if (area.discardCulling) {
                this._currentLocatedBlock = null;
                for (let i = 0; i < renderers.length; i++) {
                    let model = renderers[i] && renderers[i].model;
                    if (model) {
                        model.enabled = true;
                    }
                }
                return;
            }

            let blockSize = this.blockSize;
            if (area.useSelfBlockSize) {
                blockSize = area.blockSize;
            }
            let x = Math.floor((worldPos.x - (_tempOBB.center.x - _tempOBB.halfExtents.x)) / blockSize);
            let y = Math.floor((worldPos.y - (_tempOBB.center.y - _tempOBB.halfExtents.y)) / blockSize);
            let z = Math.floor((worldPos.z - (_tempOBB.center.z - _tempOBB.halfExtents.z)) / blockSize);

            let xCount = Math.floor(worldScale.x / blockSize);
            let yCount = Math.floor(worldScale.y / blockSize);
            let zCount = Math.floor(worldScale.z / blockSize);

            let blocks = area.blocks;
            let index = x * yCount * zCount + y * zCount + z;
            let block = blocks[index];
            if (!block) {
                continue;
            }

            this._currentLocatedBlock = block;

            break;
        }

        if (this._lastLocatedBlock === this._currentLocatedBlock) {
            return;
        }

        if (!this._currentLocatedBlock) {
            for (let i = 0; i < renderers.length; i++) {
                let model = renderers[i] && renderers[i].model;
                if (model) {
                    model.enabled = true;
                }
            }
        }
        else {
            let block = this._currentLocatedBlock;

            if (this.bakeInstances) {
                block.bakeInstances();
                this.instances = block.instances;

                (this.camera.camera as any).instances = this.instances;
            }
            else {
                for (let i = 0; i < renderers.length; i++) {
                    let model = renderers[i] && renderers[i].model;
                    if (model) {
                        model.enabled = false;
                    }
                }
                for (let i = 0; i < block.renderers.length; i++) {
                    let model = block.renderers[i] && block.renderers[i].model;
                    if (model) {
                        if (!model.enabled) {
                            model._uboDirty = true
                        }
                        model.enabled = true;
                    }
                }
            }

        }

        this._lastLocatedBlock = this._currentLocatedBlock;
    }

    update () {
        this._updateAreas();

        if (this._enabledCulling) {
            this.calcCulling();
        }

        if (EDITOR) {
            if (this._isBaking) {
                this._bake();
            }
            if (this.renderBlocks) {
                this.debugDraw();
            }
        }
    }

    _isBaking = false;
    _bakingBlockIndex = new Vec3;
    _bakingDirections: Vec3[] = [];

    @property
    _maxDirectionsOneFrame = 10000;
    @property
    get maxDirectionsOneFrame () {
        return this._maxDirectionsOneFrame;
    }
    set maxDirectionsOneFrame (v) {
        this._maxDirectionsOneFrame = v;
        this._gpuKernelDirty = true;
    }

    @property
    _maxModelCount = 10000;
    @property
    get maxModelCount () {
        return this._maxModelCount;
    }
    set maxModelCount (v) {
        this._maxModelCount = v;
        this._gpuKernelDirty = true;
    }

    @property
    _modelRange = new Vec2(0, 100000);
    @property
    get modelRange () {
        return this._modelRange;
    }
    set modelRange (v) {
        this._modelRange = v;
        this._gpuKernelDirty = true;
    }

    _gpuKernelDirty = true;

    _startTime = 0;

    _areasToBake = []

    _startBake (areasToBake: StaticOcclusionArea[]) {
        if (this._isBaking) {
            return;
        }

        this._startTime = Date.now();

        _cornerResults.clear();

        this._isBaking = true;
        this._bakingBlockIndex = new Vec3;

        this._areasToBake = areasToBake

        let oldRenderers = this._renderers;
        this._renderers = this.root!.getComponentsInChildren(MeshRenderer);
        this._renderers = this._renderers.filter(r => { return r.enabledInHierarchy; });
        this.renderers.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })

        this.models = this.renderers.map(r => r.model!);

        let renderers = this._renderers
        this.areas.forEach(a => {
            a.blocks.forEach(b => {
                let newIndices = []
                b.modelIndices.forEach(i => {
                    let newI = renderers.indexOf(oldRenderers[i])
                    if (newI !== -1) {
                        newIndices.push(newI);
                    }

                })
                b.modelIndices = newIndices
            })
        })

        let newArray = []
        for (let i = Math.max(0, this._modelRange.x), l = Math.min(this._modelRange.y, this.models.length); i < l; i++) {
            newArray.push(this.models[i]);
        }
        this.models = newArray;
        this.models.length = Math.min(this.models.length, this.maxModelCount);
        this.rendererCount = this.renderers.length;

        this._areasToBake.forEach(a => {
            a.initBlocks()
        })

        console.log('--------------------------------');


        console.time('create bakingDirections')

        this._bakingDirections = modelPoints(this.models);

        console.timeEnd('create bakingDirections')

        if (this.useGpu) {
            console.time('raycastGpu.createKernel')

            let cornersCount = 1;
            if (this._cornerType === CornerType.Corner8_Center) {
                cornersCount = 2 * 2 * 2 + 1
            }

            if (this._gpuKernelDirty) {
                let maxDirectionsOneFrame = Math.min(this.maxDirectionsOneFrame, this._bakingDirections.length);
                raycastGpu.createKernel(this.models, maxDirectionsOneFrame, cornersCount);
                this._gpuKernelDirty = false;
            }

            console.timeEnd('raycastGpu.createKernel')
        }
    }

    initBlocks () {
        for (let i = 0; i < this.areas.length; i++) {
            let area = this.areas[i];
            area.initBlocks();
        }
    }

    _bake () {
        if (!this.root) {
            return;
        }


        if (EDITOR) {
            setTimeout(() => {
                (window as any).cce.Engine.repaintInEditMode();
            }, 0)
        }


        if (!this._areasToBake.length) {
            return;
        }

        const maxBakeBlockCountPerFrame = 1;
        let bakedBlockCount = 0;

        let area = this._areasToBake[this._areasToBake.length - 1]
        let blocks = area.blocks;

        let xCount = area.blockCells.x;
        let yCount = area.blockCells.y;
        let zCount = area.blockCells.z;

        let totalCount = area.blockCount;

        for (let x = this._bakingBlockIndex.x; x < xCount;) {
            for (let y = this._bakingBlockIndex.y; y < yCount;) {
                for (let z = this._bakingBlockIndex.z; z < zCount;) {
                    if (bakedBlockCount >= maxBakeBlockCountPerFrame) {
                        return;
                    }

                    let index = x * yCount * zCount + y * zCount + z;

                    let block = blocks[index];

                    if (!block.bakingProcess) {
                        block.bakingDirections = this._bakingDirections.concat();
                        block.bakingTotalCount = block.bakingDirections.length;
                    }

                    console.time('do raycasting')

                    let directions = block.bakingDirections.splice(0, this.maxDirectionsOneFrame);
                    this._raycastPoints(block, directions);

                    console.timeEnd('do raycasting')

                    let totalProcess = (index + block.bakingProcess) / totalCount;
                    console.log(`baking process : area - ${area.node.name},  block ${index} - ${block.bakingProcess}, total - ${totalProcess}`)

                    let costTime = (Date.now() - this._startTime) / 1000;
                    let leftTime = (costTime / totalProcess) * (1 - totalProcess);
                    console.log(`left time : ${leftTime} s`)

                    // recycle
                    for (let i = 0; i < directions.length; i++) {
                        Pool.Vec3.put(directions[i]);
                    }

                    if (block.bakingDirections.length) {
                        return;
                    }

                    this._bakingBlockIndex.z = ++z;
                    bakedBlockCount++;
                }
                this._bakingBlockIndex.z = 0;
                this._bakingBlockIndex.y = ++y;
            }
            this._bakingBlockIndex.y = 0;
            this._bakingBlockIndex.z = 0;
            this._bakingBlockIndex.x = ++x;
        }

        this._areasToBake.length -= 1;
        this._bakingBlockIndex.set(0, 0, 0);

        if (this._areasToBake.length <= 0) {
            this._isBaking = false;
            console.log(`bake static culling : ${(Date.now() - this._startTime) / 1000} s`)
        }
        else {
            let areasToBake = this._areasToBake.concat()
            // wait 2s
            setTimeout(async () => {
                this._startTime = Date.now()
                this._areasToBake = areasToBake

                await Editor.Message.request('scene', 'save-scene');

                if (EDITOR) {
                    setTimeout(() => {
                        (window as any).cce.Engine.repaintInEditMode();
                    }, 0)
                }
            }, 2000)
        }

    }

    _raycastDirections (block: CullingBlock, directions: Vec3[]) {
        let models = this.models;

        _tempRay.o.set(block.center);
        for (let i = 0; i < directions.length; i++) {
            _tempRay.d.set(directions[i]);
            let results = raycast.raycastModels(models, _tempRay, undefined, undefined, true);
            if (results.length > 0) {
                let r = results[0].node.getComponent(MeshRenderer)!;
                if (r && block.renderers.indexOf(r) === -1) {
                    block.renderers.push(r);
                }
            }
        }

        block.modelIndices = block.renderers.map(r => {
            return this.models.indexOf(r.model!);
        })
    }

    _forEachCorner (block: CullingBlock, func: Function) {
        let corners: Vec3[] = [block.center];
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    corners.push(new Vec3(block.center).add3f(block.halfExtents.x * x, block.halfExtents.y * y, block.halfExtents.z * z));
                }
            }
        }

        for (let i = 0; i < corners.length; i++) {
            func(corners[i]);
        }
    }

    _raycastPoints (block: CullingBlock, points: Vec3[]) {
        let models = this.models;

        let corners: Vec3[] = [block.center];
        if (this._cornerType === CornerType.Corner8_Center || this._cornerType === CornerType.Seprate_Corner8_Center) {
            for (let x = -1; x <= 1; x += 2) {
                for (let y = -1; y <= 1; y += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        corners.push(new Vec3(block.center).add3f(block.halfExtents.x * x, block.halfExtents.y * y, block.halfExtents.z * z));
                    }
                }
            }
        }

        if (!this.useGpu) {
            for (let i = 0; i < corners.length; i++) {
                for (let j = 0; j < points.length; j++) {
                    _tempRay.o.set(corners[i]);
                    (_tempRay.d.set(points[j]) as Vec3).subtract(_tempRay.o).normalize();

                    let results = raycast.raycastModels(models, _tempRay, undefined, undefined, true);

                    if (results.length > 0) {
                        let r = results[0].node.getComponent(MeshRenderer)!;
                        if (r && block.renderers.indexOf(r) === -1) {
                            block.renderers.push(r);
                        }
                    }
                }
            }
        }
        else {
            if (this._cornerType === CornerType.Seprate_Corner8_Center) {
                for (let i = 0; i < corners.length; i++) {
                    let corner = corners[i];
                    let key = `${corner.x}_${corner.y}_${corner.z}`;
                    let bakedResults = _cornerResults.get(key);

                    let finalResults: renderer.scene.Model[]
                    if (!bakedResults || !(bakedResults as any)._baked) {
                        if (!bakedResults) {
                            bakedResults = [];
                            _cornerResults.set(key, bakedResults);
                        }
                        if (block.bakingProcess >= 1) {
                            (bakedResults as any)._baked = true;
                        }
                        finalResults = raycastGpu.raycastModels(models, [corner], points);
                        for (let i = 0; i < finalResults.length; i++) {
                            if (bakedResults!.indexOf(finalResults[i]) === -1) {
                                bakedResults!.push(finalResults[i]);
                            }
                        }
                    }
                    else {
                        finalResults = bakedResults;
                    }
                    finalResults.forEach(m => {
                        let r = m.node.getComponent(MeshRenderer);
                        if (r && block.renderers.indexOf(r) === -1) {
                            block.renderers.push(r);
                        }
                    })
                }
            }
            else {
                let finalResults = raycastGpu.raycastModels(models, corners, points);
                finalResults.forEach(m => {
                    let r = m.node.getComponent(MeshRenderer);
                    if (r && block.renderers.indexOf(r) === -1) {
                        block.renderers.push(r);
                    }
                })
            }
        }

        block.modelIndices = block.renderers.map(r => {
            return this.models.indexOf(r.model!);
        })
    }

    debugDraw () {
        let geometryRenderer = getGeometryRenderer();
        if (!geometryRenderer) {
            return;
        }

        let areaColor = new Color(0, 0, 0, 100);
        let blockColor = new Color(255, 0, 0, 20);
        let locateBlockColor = new Color(0, 0, 255, 20);
        let tempMatrix = new Mat4();
        let identityAABB = new geometry.AABB(0, 0, 0, 0.5, 0.5, 0.5);

        for (let i = 0; i < this.areas.length; i++) {
            let area = this.areas[i];
            if (!area.enabledInHierarchy) continue;
            geometryRenderer.addBoundingBox(identityAABB, areaColor, false, false, undefined, true, area.node.worldMatrix);
        }

        // this.areas.forEach(area => {
        //     let blocks = area.blocks;
        //     for (let i = 0; i < blocks.length; i++) {
        //         let block = blocks[i];

        //         let tempScale = Pool.Vec3.get().set(block.halfExtents.x * 2, block.halfExtents.y * 2, block.halfExtents.z * 2 * block.bakingProcess);
        //         tempMatrix.fromRTS(Quat.IDENTITY as Quat, block.center as Vec3, tempScale);
        //         Pool.Vec3.put(tempScale);

        //         let color = blockColor;
        //         if (block === this._currentLocatedBlock) {
        //             color = locateBlockColor;
        //         }

        //         geometryRenderer.addBoundingBox(identityAABB, color, false, false, undefined, true, tempMatrix);

        //         // if (this.renderRaycast /*&& block === this._currentLocatedBlock*/) {
        //         //     drawer.type = DrawType.Line;
        //         //     drawer.matrix.fromRTS(Quat.IDENTITY as Quat, Vec3.ZERO as Vec3, Vec3.ONE as Vec3);

        //         //     let lines: Vec3[][] = []
        //         //     if (this.shouldFastBack) {
        //         //         let directions = sphereDirections(this.sphereBakeCount)
        //         //         for (let i = 0; i < directions.length; i++) {
        //         //             directions[i].multiplyScalar(this.renderRaycastLength).add(block.center)
        //         //             lines.push([block.center, directions[i]])
        //         //         }
        //         //     }
        //         //     else {
        //         //         let corners: Vec3[] = [block.center];
        //         //         // for (let x = -1; x <= 1; x += 2) {
        //         //         //     for (let y = -1; y <= 1; y += 2) {
        //         //         //         for (let z = -1; z <= 1; z += 2) {
        //         //         //             corners.push(new Vec3(block.center).add3f(block.halfExtents.x * x, block.halfExtents.y * y, block.halfExtents.z * z));
        //         //         //         }
        //         //         //     }
        //         //         // }

        //         //         if (!this.useGpu) {
        //         //             for (let i = 0; i < corners.length; i++) {
        //         //                 let points = modelPoints(this.models);
        //         //                 points.forEach(p => {
        //         //                     lines.push([corners[i], p])
        //         //                 })
        //         //             }
        //         //         }
        //         //         else {
        //         //             // let results = raycastGpu.raycastModels(models, corners, points);
        //         //             // results.forEach(m => {
        //         //             //     let r = m.node.getComponent(MeshRenderer);
        //         //             //     if (r && block.renderers.indexOf(r) === -1) {
        //         //             //         block.renderers.push(r);
        //         //             //     }
        //         //             // })
        //         //         }
        //         //     }

        //         //     drawer.line(...lines)
        //         // }
        //     }
        // })
    }
}
