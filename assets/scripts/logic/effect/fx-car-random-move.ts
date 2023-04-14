import { _decorator, Component, Node, randomRange } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FxCarRandomMove')
export class FxCarRandomMove extends Component {

    @property
    offsetY = 54;

    @property
    intervalTime = 0;

    @property
    count = 5;

    @property
    minTime = 3;

    @property
    maxTime = 10;

    start () {
        this.intervalTime = randomRange(this.minTime, this.maxTime);
        this.node.setPosition(0, this.offsetY, 0);
    }

    update (deltaTime: number) {

        this.intervalTime -= deltaTime;
        if (this.intervalTime < 0) {
            this.intervalTime = randomRange(this.minTime, this.maxTime);
            for (let i = 0; i < this.node.children.length; i++) {
                this.node.children[i].emit('msg_node_fly_car');
            }
        }

    }
}

