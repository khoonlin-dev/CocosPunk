import { _decorator, Component, Node, v3 } from 'cc';
import { Res } from '../../core/res/res';
const { ccclass, property } = _decorator;

export let NavTest: NavigationPathsTest | undefined;

@ccclass('NavigationPathsTest')
export class NavigationPathsTest extends Component {

    @property
    targetNodes = [];

    @property
    targetDeep = 5;

    index = 0;

    start () {

        NavTest = this;

        const item = this.node.children[0];
        for (let i = 0; i < this.targetDeep; i++) {
            Res.instNode(item, this.node, v3(1000, 1000, 0));
        }

    }

    getTarget () {
        this.index++;
        if (this.index > this.node.children.length) this.index = 0;
        return this.node.children[this.index];
    }

}

