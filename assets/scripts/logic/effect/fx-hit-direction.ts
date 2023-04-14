import { _decorator, Component, Node, Vec3 } from 'cc';
import { Msg } from '../../core/msg/msg';
import { Res } from '../../core/res/res';
const { ccclass, property } = _decorator;

@ccclass('FxHitDirection')
export class FxHitDirection extends Component {

    @property
    poolDeep = 5;

    list: Node[] = [];

    index = 0;

    onLoad () {

        const item = this.node.children[0];
        item.active = false;
        this.list.push(item);

        for (let i = 1; i < this.poolDeep; i++) {
            const newItem = Res.instNode(item!, this.node, Vec3.ZERO)!;
            this.list.push(newItem);
        }

        Msg.on('msg_hit_direction', this.onHit.bind(this));

        this.node.on('clear', this.clear, this);

    }

    onHit (angle: number) {

        const currentNode = this.list[this.index];
        currentNode.active = true;
        currentNode.setRotationFromEuler(0, 0, angle);
        this.index++;
        if (this.index >= this.poolDeep) this.index = 0;

    }

    clear () {
        for (let i = 0; i < this.poolDeep; i++) {
            this.list[i].active = false;
        }
    }

}

