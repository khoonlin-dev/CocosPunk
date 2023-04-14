import { _decorator, Camera, Component, Node, v3, Vec3 } from 'cc';
import { UI } from '../../core/ui/ui';
import { FilSmooth } from '../../core/ui/fil-smooth';
import { UIHpScore } from './ui-hp-score';
import { UIHitHead } from './ui-hit-head';
import { UtilVec3 } from '../../core/util/util';
import { CameraPlayer } from '../camera/camera-player';
import { Sound } from '../../core/audio/sound';
import { fun } from '../../core/util/fun';
const { ccclass, property } = _decorator;

@ccclass('UIBlood')
export class UIBlood extends Component {

    @property
    target: Node | undefined;

    @property({ type: FilSmooth })
    hpView: FilSmooth | undefined;

    @property({ type: Node })
    hpNode: Node | undefined;

    @property({ type: UIHpScore })
    scores: UIHpScore | undefined;

    @property({ type: UIHitHead })
    hitHead: UIHitHead | undefined;

    @property
    clearTime = 0;

    screenPos = v3(0, 0, 0);
    worldPos = v3(0, 0, 0);

    setTarget (_target: Node) {
        this.target = _target;
    }

    setHpPercent (value: number) {
        this.hpNode!.active = false;
        this.hpNode!.active = true;
        this.hpView?.setValue(value);
    }

    setDamageValue (value: number, hitPoint: Vec3) {
        this.clearTime = 3;
        this.scores?.setScore(value, hitPoint);
    }

    setHitHead () {
        this.hitHead?.showHead();
        fun.delay(() => {
            Sound.on('sfx_hit_head');
        }, 0.05);
    }

    update (deltaTime: number) {

        if (this.target != undefined) {
            UtilVec3.copy(this.worldPos, this.target.worldPosition);
        }

        const mainCamera = CameraPlayer.camera;
        if (!mainCamera) return;
        const uiCamera = UI.Instance.camera as Camera;
        mainCamera.worldToScreen(this.worldPos, this.screenPos);
        uiCamera.screenToWorld(this.screenPos, this.worldPos);
        this.node.setWorldPosition(this.worldPos);

        this.clearTime -= deltaTime;
        if (this.clearTime <= 0) {
            this.target = undefined;
            this.scores?.clear();
            this.node.active = false;
        }

    }
}

