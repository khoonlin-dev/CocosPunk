import { _decorator, Component, Camera, find } from 'cc';
import { StaticOcclusionCulling } from '../../../../extensions/pipeline/pipeline/components/occlusion-culling/static/static-occlusion-culling';
const { ccclass, property } = _decorator;

@ccclass('CameraAutoBindOcclusion')
export class CameraAutoBindOcclusion extends Component {

    onEnable () {
        const culling = find('scene-root/static-occlusion-culling');
        if (culling === undefined || culling === null) {
            //console.warn(`Can not find static-occlusion-culling.`);
            return;
        }
        const occlusionCulling = culling.getComponent(StaticOcclusionCulling);
        if (occlusionCulling === null) throw new Error(`culling node not find 'StaticOcclusionCulling'`);
        occlusionCulling.camera = this.getComponent(Camera);
    }

}

