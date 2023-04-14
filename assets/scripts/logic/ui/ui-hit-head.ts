import { _decorator, Component, Node, Vec3 } from 'cc';
import { Res } from '../../core/res/res';
const { ccclass, property } = _decorator;

@ccclass('UIHitHead')
export class UIHitHead extends Component {

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
    }

    showHead () {
        const currentNode = this.list[this.index];
        if (currentNode.active) {
            currentNode.active = false;
        }
        currentNode.active = true;
        this.index++;
        if (this.index >= this.poolDeep) this.index = 0;
    }

}

