import { _decorator, Node, ParticleSystem, sys, Vec3 } from 'cc';
import { UtilNode } from '../util/util';
import { FxBase } from './fx-base';
import { ResPool } from '../res/res-pool';
import { DataGameInst } from '../../logic/data/data-core';
const { ccclass, property } = _decorator;

@ccclass('fx')
export class fx {

    public static node: Node;

    public static init (node: Node) {
        this.node = node;
    }

    public static on (name: string, pos: Vec3, direction: Vec3 | undefined = undefined) {

        /*
        if (sys.platform == sys.Platform.IOS && name.includes('fx_hit')) {
            return;
        }
        */

        if (DataGameInst._data.close_blood_fx)
            if (name == 'fx_hit_body') return;

        const newFx = ResPool.Instance.pop(name, pos) as Node;
        if (direction) {
            newFx.lookAt(direction);
        }
        newFx.emit('play');

    }

    public static play (node: Node, name: string) {
        const fxNode = UtilNode.find(node, name);
        const fx = fxNode.getComponent(FxBase);
        fx?.play();
    }

    public static playLoop (node: Node, name: string, isLoop: boolean) {
        const pNode = UtilNode.find(this.node, name);
        var particles = pNode?.getComponentsInChildren(ParticleSystem);
        if (particles === undefined) {
            console.warn(` effect can not find ${name}`);
            return;
        }
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.loop = isLoop;
            if (isLoop) p.play();
        }
    }

}

