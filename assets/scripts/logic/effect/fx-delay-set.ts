import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FxDelaySet')
export class FxDelaySet extends Component {

    @property
    delay = 2;

    time = 0;

    onEnable () {
        this.time = this.delay;
    }

    update (deltaTime: number) {
        this.time -= deltaTime;
        if (this.time < 0) this.node.active = false;
    }
}

