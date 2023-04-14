import { Component, geometry, Vec3, _decorator } from "cc";
import { CullingBlock } from "./static-occlusion-block";
import { StaticOcclusionCulling } from "./static-occlusion-culling";
const { ccclass, type, property } = _decorator

@ccclass('sync.StaticOcclusionArea')
export class StaticOcclusionArea extends Component {
    culling: StaticOcclusionCulling | null = null;

    @property
    blockCells = new Vec3();

    @property(({ type: CullingBlock, visible: false }))
    blocks: CullingBlock[] = []

    @property
    get blockCount () {
        return this.blocks.length;
    }

    @property
    get isEmpty () {
        for (let i = 0; i < this.blocks.length; i++) {
            if (!this.blocks[i].rendererCount) {
                return true
            }
        }
        return false;
    }

    @property
    get bake () {
        return false
    }
    set bake (v) {
        if (this.culling) {
            let index = this.culling.areas.indexOf(this)
            if (index !== -1) {
                this.culling._startBake([this])
            }
        }
    }

    @property
    blockSize = 3
    @property
    useSelfBlockSize = false

    @property
    discardCulling = false

    initBlocks () {
        let culling = this.culling;
        let blockSize = culling.blockSize;
        if (this.useSelfBlockSize) {
            blockSize = this.blockSize;
        }
        let halfBlockSize = blockSize / 2;
        let blocks = this.blocks;
        blocks.length = 0;

        if (this.discardCulling) {
            this.blockCells.set(0, 0, 0);
            return;
        }

        let wolrdPos = this.node.worldPosition;
        let worldScale = this.node.getWorldScale();

        let xCount = Math.floor(worldScale.x / blockSize);
        let yCount = Math.floor(worldScale.y / blockSize);
        let zCount = Math.floor(worldScale.z / blockSize);

        this.blockCells.set(xCount, yCount, zCount);

        for (let x = 0; x < xCount; x++) {
            for (let y = 0; y < yCount; y++) {
                for (let z = 0; z < zCount; z++) {
                    let blockIdx = x * yCount * zCount + y * zCount + z;

                    let block = blocks[blockIdx] = new CullingBlock;
                    block.blockIdx = blockIdx;
                    block.center
                        .set(wolrdPos)
                        .add3f(x * blockSize, y * blockSize, z * blockSize)
                        .add3f(halfBlockSize, halfBlockSize, halfBlockSize)
                        .subtract3f(worldScale.x / 2, worldScale.y / 2, worldScale.z / 2);
                    block.halfExtents.set(halfBlockSize, halfBlockSize, halfBlockSize);
                }
            }
        }
    }
}
