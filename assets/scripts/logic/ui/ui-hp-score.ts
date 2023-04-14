import { _decorator, Camera, Component, Node, v3, Vec3 } from 'cc';
import { Res } from '../../core/res/res';
import { UI } from '../../core/ui/ui';
import { CameraPlayer } from '../camera/camera-player';
const { ccclass, property } = _decorator;

@ccclass('UIHpScore')
export class UIHpScore extends Component {

    @property
    poolDeep = 5;

    list: Node[] = [];

    index = 0;

    screenPos = v3(0, 0, 0);
    worldPos = v3(0, 0, 0);

    onLoad () {

        const item = this.node.children[0];
        item.active = false;
        this.list.push(item);

        for (let i = 1; i < this.poolDeep; i++) {
            const newItem = Res.instNode(item!, this.node, Vec3.ZERO)!;
            this.list.push(newItem);
        }

    }

    setScore (value: number, hitPoint: Vec3) {

        const currentNode = this.list[this.index];
        currentNode.active = true;
        currentNode.emit('set_score', value);

        // Set hp position.
        const mainCamera = CameraPlayer.camera;
        if (!mainCamera) return;
        const uiCamera = UI.Instance.camera as Camera;
        mainCamera.worldToScreen(hitPoint, this.screenPos);
        uiCamera.screenToWorld(this.screenPos, this.worldPos);
        currentNode.setWorldPosition(this.worldPos);

        this.index++;

        if (this.index >= this.poolDeep) this.index = 0;
    }
    clear () {

        for (let i = 0; i < this.poolDeep; i++) {
            const item = this.list[i];
            item.active = false;
        }

    }

}

