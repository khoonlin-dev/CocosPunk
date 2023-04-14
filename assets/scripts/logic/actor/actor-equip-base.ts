/*
 Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

import { _decorator, Component, Node, game, Vec3, PhysicsRayResult, randomRange, v3, math } from 'cc';
import { ActionActorEquip, key_type_boolean } from '../../core/action/action';
import { Actor } from './actor';
import { BagItem } from './actor-bag';
import { UtilNode, UtilVec3 } from '../../core/util/util';
import { Msg } from '../../core/msg/msg';
import { ActorAnimationGraph } from './actor-animation-graph';
import { FxBase } from '../../core/effect/fx-base';
import { fx } from '../../core/effect/fx';
import { Local } from '../../core/localization/local';
const { ccclass, property } = _decorator;

let tracerEndPosition = v3(0, 0, 0);

@ccclass('ActorEquipBase')
export class ActorEquipBase extends Component {

    point_shoot: Node | undefined;

    _animationGraph: ActorAnimationGraph | undefined;

    _view: Node | undefined;

    _bagData: BagItem | undefined;

    _data: { [key: string]: any } = {};

    _action: ActionActorEquip | undefined;

    _actor: Actor | undefined;

    isPlayer = false;

    fxMuzzle: FxBase | undefined;

    isBulletEmpty = false;

    _recoilX = 0;
    _recoilY = 0;

    mask = 1 << 2 | 1 << 3 | 1 << 4;

    __preload () {
        this.point_shoot = this.node.getChildByName('point_shoot')!;
        this.fxMuzzle = UtilNode.find(this.node, 'fx_muzzle').getComponent(FxBase)!;
        this._view = this.node.getChildByName('view')!;
        this.node.on('do', this.do, this);
        this.node.on('init', this.init, this);
    }


    init (bagData: BagItem) {
        this._actor = bagData.actor;
        this._bagData = bagData;
        this._data = this._bagData.data;
        this._action = new ActionActorEquip(this._data.action, this);
        this._bagData.lastUseTime = game.totalTime / 1000;
        this.isPlayer = this._actor.isPlayer;
        this._animationGraph = this._actor._animationGraph;
    }

    onDestroy () {
        this.node.off('do', this.do, this);
        this.node.off('init', this.init, this);
    }

    do (name: string) {
        if (this._action) {
            if (name === 'fire' && !this.checkUse()) return;
            this._action.on(name);
        }
    }

    checkAutoFire () {
        if (this._actor?._data.is_auto_fire) {
            this.do("fire");
        }
    }

    update (deltaTime: number) {
        this._action?.update(deltaTime);
        this.updateRecoilBack(deltaTime);
    }



    setActive (data: key_type_boolean) {
        const activeNode = this.node.getChildByName(data.key);
        if (activeNode) activeNode.active = data.value;
        else console.warn(` You want set undefined node active. ${this.node?.name}/${data.key}`);
    }

    hiddenWeapon () {
        this.node.children[0].active = false;
        this.node.active = false;
    }

    showWeapon () {
        this.node.children[0].active = true;
    }

    setFx (data: key_type_boolean) {
        fx.playLoop(this.node, data.key, data.value);
    }

    showMuzzle () { this.fxMuzzle?.play(); }

    onFx (name: string) {
        fx.play(this.node, name);
    }

    /**
     * Weapon recoil back move.
     * @param deltaTime game delta time.
     */
    updateRecoilBack (deltaTime: number) {

        if (this._recoilX != 0 && this._recoilY != 0) {
            const preX = this._recoilX;
            const preY = this._recoilY;
            this._recoilX = math.lerp(this._recoilX, 0, deltaTime * this._data.recoil_back_smooth);
            this._recoilY = math.lerp(this._recoilY, 0, deltaTime * this._data.recoil_back_smooth);
            const increaseX = preX - this._recoilX;
            const increaseY = preY - this._recoilY;
            this._actor?.onRotation(-increaseX, -increaseY);
            if (Math.abs(this._recoilX) < 0.001) this._recoilX = 0;
            if (Math.abs(this._recoilY) < 0.001) this._recoilY = 0;
        }

    }

    public onEquip () { this._actor!._data.is_equip = true; }

    public offEquip () { this._actor!._data.is_equip = false; }

    /**
     * Weapon recoil method
     */
    onRecoil () {

        // Get the recoil ratio.
        // Aim state gets a specific value based on the gun's data, non-Aim state defaults to one.
        const recoil_rate = this._actor!._data.is_aim ? this._data.recoil_aim_rate : 1;

        // Random recoil offset is performed.
        this._recoilX = randomRange(this._data.recoil_x[0], this._data.recoil_x[1]) * recoil_rate;
        this._recoilY = randomRange(this._data.recoil_y[0], this._data.recoil_y[1]) * recoil_rate;

        // Set the offset of the recoil.
        this._actor?.onRotation(this._recoilX, this._recoilY);

        // Set camera shake.
        Msg.emit('msg_camera_shake', { time: this._data.fire_shake_time, size: this._data.fire_shake_range })

    }


    /**
     * Display the current infrared tracking path.
     * @param hit The location of the detection point.
     * @param dir The direction of the target point.
     */
    showTracer (hit: PhysicsRayResult | undefined, dir: Vec3) {

        // Get the world coordinates of the firing point.
        const origin = this.fxMuzzle!.node.worldPosition;

        // The physical hit point exists set as the end coordinate.
        if (hit?.hitPoint) {
            UtilVec3.copy(tracerEndPosition, hit.hitPoint);
        } else {  // If the physical hit point does not exist, the end point is extended by 100 units in the direction of fire.
            UtilVec3.copy(tracerEndPosition, origin);
            tracerEndPosition.add3f(dir.x * 100, dir.y * 100, dir.z * 100);
        }
        //console.log(origin, dir, tracerEndPosition);
        Msg.emit('msg_set_tracer', { start: origin, end: tracerEndPosition });
    }

    actionEnd () { }

    checkUse (): boolean {
        // Check bullet count.
        this.isBulletEmpty = this._bagData!.bulletCount <= 0 && this._bagData!.data.bullet_count !== -1;
        if (this.isBulletEmpty) {
            this.do('fire_empty');
            return false;
        }
        const lastUseTime = this._bagData!.lastUseTime;
        const timeSpace = (game.totalTime - lastUseTime) / 1000;
        return timeSpace >= this._data.damage.cooling;

    }

    updateCooling () {
        this._bagData!.lastUseTime = game.totalTime;
    }

    checkFullBullet (): boolean {

        if (this._bagData!.bulletCount == this._bagData?.data.bullet_count) {
            Msg.emit(
                'msg_tips',
                `${Local.Instance.get('bullet_is_full')}`
            );
            return true;
        }
        return false;
    }

    onReload () {

        if (!this._actor) return;

        this._actor!._data.is_reload = true;

        if (this._actor.bulletBox > 0) {
            //this._bagData!.bulletClipCount--;
            this._actor.bulletBox--;
            if (this._actor.bulletBox < 0) this._actor.bulletBox = 0;
            this._bagData!.bulletCount = this._bagData?.data.bullet_count;
            this.isBulletEmpty = false;
        } else {
            Msg.emit(
                'msg_tips',
                `${Local.Instance.get('clip_is_null')}`
            );
        }

    }

    offReload () { this._actor!._data.is_reload = false; }

    onUse () { }

}

