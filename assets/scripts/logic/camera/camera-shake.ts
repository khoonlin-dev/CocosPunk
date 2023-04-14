import { _decorator, Component, Node, randomRange } from 'cc';
import { Msg } from '../../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('CameraShake')
export class CameraShake extends Component {

    size = 5;
    time = -0.1;

    start () {

        Msg.on('msg_camera_shake', this.onShakeCamera.bind(this));

    }

    onDestroy () {
        Msg.off('msg_camera_shake', this.onShakeCamera.bind(this));
    }

    onShakeCamera (data: { time: number, size: number }) {

        this.time = data.time;
        this.size = data.size;

    }

    update (deltaTime: number) {

        this.time -= deltaTime;
        if (this.time > 0) {
            this.node.setRotationFromEuler(0, 0, randomRange(-this.size, this.size));
        }

    }
}

