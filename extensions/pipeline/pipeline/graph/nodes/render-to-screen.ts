import { LGraphNode } from '../@types/litegraph';
import { BaseStage } from '../../passes/base-pass';
import { liteGraph } from '../graph';

export function RenderToScreen () {
    let self = this as LGraphNode;
    self.addInput('RenderTexture', 'RenderTexture');

    this.onUpdateStage = function updateStage (prev: LGraphNode) {
        let stage = (prev as any).stage as BaseStage
        if (stage) {
            stage.renderToScreen = true
        }
    }

    self.size = self.computeSize();
}

delete liteGraph.registered_node_types[`pipeline/RenderToScreen`];
liteGraph.registerNodeType(`pipeline/RenderToScreen`, RenderToScreen as any);
