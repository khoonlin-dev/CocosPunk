import { _decorator, Component, Node } from 'cc';
import { Msg } from '../../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('ActorEquipView')
export class ActorEquipView extends Component {

    @property({ type: [Node] })
    slots: Node[] = [];

    @property
    msg = 'msg_player_equip';

    __preload () {
        this.node.on('equip', this.set, this);
        Msg.on(this.msg + '_on', this.on.bind(this));
        Msg.on(this.msg + '_off', this.off.bind(this));
    }

    onDestroy (): void {
        this.node.off('equip', this.set, this);
        Msg.off(this.msg + '_on', this.on.bind(this));
        Msg.off(this.msg + '_off', this.off.bind(this));
    }

    on (id: number) {
        this.set(id, true);
    }

    off (id: number) {
        this.set(id, false);
    }

    set (id: number, isShow: boolean = false) {
        this.slots[id].active = isShow;
    }

}

