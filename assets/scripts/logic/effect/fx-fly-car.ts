import { _decorator, Component, Animation, randomRange, randomRangeInt, random } from 'cc';
import { Sound } from '../../core/audio/sound';
const { ccclass, property } = _decorator;

@ccclass('FxFlyCar')
export class FxFlyCar extends Component {

    @property
    maxTime = 5;

    @property
    minTime = 1;

    animation: Animation | undefined | null;

    waitTime = 0;

    start () {
        this.animation = this.node.children[0].getComponent(Animation);
        this.node.on('msg_node_fly_car', () => {
            this.waitTime = randomRange(this.minTime, this.maxTime);
        })
    }

    update (deltaTime: number) {

        this.waitTime -= deltaTime;
        if (this.waitTime < 0) {
            this.waitTime = 9999999999;
            this.node.setRotationFromEuler(0, randomRange(0, 360), 0);
            const y = randomRangeInt(0, 5);
            this.node.setPosition(0, y, 0);
            this.animation?.stop();
            this.animation?.play();
            this.animation!.defaultClip!.speed = randomRange(0.2, 0.6);
            if (random() > 0.5 && y < 7) Sound.on('sfx_car_fly', randomRange(0.3, 1));
        }

    }

}

