import { _decorator, Component, Node, Vec3 } from 'cc';
import { Res } from '../../core/res/res';
import { UIBlood } from './ui-blood';
import { Msg } from '../../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('UIBloodManager')
export class UIBloodManager extends Component {

    @property
    poolDeep = 5;

    list: UIBlood[] = [];

    start () {

        const item = this.node.children[0];
        item.active = false;
        const blood = item.getComponent(UIBlood)!;
        this.list.push(blood);

        for (let i = 1; i < this.poolDeep; i++) {
            const newItem = Res.instNode(item!, this.node, Vec3.ZERO)!;
            const bloodItem = newItem.getComponent(UIBlood)!;
            this.list.push(bloodItem);
        }

        Msg.on('msg_show_hit_info', this.setBloodInfo.bind(this));

    }

    protected onDestroy (): void {
        Msg.off('msg_show_hit_info', this.setBloodInfo.bind(this));
    }

    setBloodInfo (data: { target: Node, hpPercent: number, damageValue: number, hitPoint: Vec3, isHead: boolean }) {

        let targetBlood: UIBlood | undefined;

        // Find target blood
        for (let i = 0; i < this.poolDeep; i++) {
            const current = this.list[i];
            if (current.target == data.target) {
                targetBlood = current;
            }
        }

        if (targetBlood == undefined) {
            targetBlood = this.getNullTarget();
            if (!targetBlood) return;
        }

        targetBlood.node.active = true;
        targetBlood.target = data.target;
        targetBlood.setHpPercent(data.hpPercent);
        targetBlood.setDamageValue(data.damageValue, data.hitPoint);
        if (data.isHead) targetBlood.setHitHead();

    }

    getNullTarget (): UIBlood | undefined {

        for (let i = 0; i < this.poolDeep; i++) {
            const current = this.list[i];
            if (current.target == undefined) {
                return current;
            }
        }

        return undefined;

    }

}

