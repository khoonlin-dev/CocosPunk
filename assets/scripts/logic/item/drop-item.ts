import { _decorator, Component, Node, Vec3, v3, randomRangeInt } from 'cc';
import { Res } from '../../core/res/res';
import { ResCache } from '../../core/res/res-cache';
import { Msg } from '../../core/msg/msg';
import { ResPool } from '../../core/res/res-pool';
const { ccclass, property } = _decorator;

@ccclass('DropItem')
export class DropItem extends Component {

    itemName: string = '';
    groupIndex = 0;

    itemNode: Node | undefined;
    effectNode: Node | undefined;

    start () {
        this.node.on('picked', this.picked, this);
    }

    onDestroy () {
        this.node.off('picked', this.picked, this);
    }

    public init (name: string, effectIndex: number, _groupIndex: number) {

        this.itemName = name;
        this.node.name = name;
        this.groupIndex = _groupIndex;

        // Get drop item prefab from pool.
        const itemRoot = this.node.children[0];
        const pickName = name + '_pickup';
        this.itemNode = ResPool.Instance.pop(pickName, itemRoot.worldPosition, itemRoot);

        // Add effect.
        const effectName = `fx_drop_lv_${effectIndex}`;
        this.effectNode = ResPool.Instance.pop(effectName, this.node.worldPosition, this.node);

    }

    public picked () {

        Msg.emit('msg_remove_item', this.groupIndex);

        ResPool.Instance.push(this.itemNode);
        this.effectNode?.emit('remove');

        this.node.name = 'drop_item';
        ResPool.Instance.push(this.node);

    }

}

