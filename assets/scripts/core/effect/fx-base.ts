import { _decorator, Component, ParticleSystem } from 'cc';
import { fun } from '../util/fun';
import { ResPool } from '../res/res-pool';
const { ccclass, property } = _decorator;

@ccclass('FxBase')
export class FxBase extends Component {

    @property
    destroyTime = 3;
    particles: ParticleSystem[] | undefined;

    @property
    autoRemove = false;

    delayTime = 3;

    __preload () {
        this.particles = this.node?.getComponentsInChildren(ParticleSystem);
        this.node.on('play', this.play, this);
        this.node.on('remove', this.remove, this);
        this.delayTime = this.destroyTime;
    }

    onDestroy () {
        this.node.off('play', this.play, this);
        this.node.off('remove', this.remove, this);
    }

    stop () {
        for (let i = 0; i < this.particles!.length; i++) {
            const particle = this.particles![i];
            particle.stop();
        }
    }

    clear () {
        for (let i = 0; i < this.particles!.length; i++) {
            const particle = this.particles![i];
            particle.stop();
            particle.clear();
        }
    }

    play () {
        this.delayTime = this.destroyTime;
        for (let i = 0; i < this.particles!.length; i++) {
            const particle = this.particles![i];
            particle.stop();
            particle.play();
        }
    }

    setLoop (isLoop: boolean = false) {
        for (let i = 0; i < this.particles!.length; i++) {
            const particle = this.particles![i];
            particle.loop = true;
        }
    }

    lateUpdate (deltaTime: number) {

        if (this.autoRemove) {
            this.delayTime -= deltaTime;
            if (this.delayTime < 0) {
                this.remove();
            }
        }
    }

    remove () {
        this.stop();
        this.clear();
        ResPool.Instance.push(this.node);
        this.delayTime = this.destroyTime;
    }
}