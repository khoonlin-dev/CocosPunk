import { _decorator, Component, ParticleSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FxAutoRemove')
export class FxAutoRemove extends Component {

    @property
    delayTime = 0.5;

    start () {

        const particles = this.node?.getComponentsInChildren(ParticleSystem);

        for (let i = 0; i < particles.length; i++) {
            particles[i].play();
        }

    }

    update (deltaTime: number) {

        this.delayTime -= deltaTime;
        if (this.delayTime < 0) {
            deltaTime = 9999;
            this.node.destroy();
        }

    }
}

