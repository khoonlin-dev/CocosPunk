import { _decorator, Component, Node } from 'cc';
import AimIK from '../../core/ik/aim-ik';
import { Msg } from '../../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('MsgAimIK')
export class MsgAimIK extends Component {

    @property
    msg = 'msg_player_ik';

    @property({ type: AimIK })
    aimIK: AimIK | undefined;

    start () {
        Msg.on(this.msg + '_on', this.onIK.bind(this));
        Msg.on(this.msg + '_off', this.offIK.bind(this));
    }

    onDestroy (): void {
        Msg.off(this.msg + '_on', this.onIK.bind(this));
        Msg.off(this.msg + '_off', this.offIK.bind(this));
    }

    onIK () {
        this.setActive(true);
    }

    offIK () {
        this.setActive(false);
    }

    setActive (isActive: boolean) {
        this.aimIK!.enableAim = isActive;
    }

}

