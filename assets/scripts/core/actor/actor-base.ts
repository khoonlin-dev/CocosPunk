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

import { _decorator, Component, Node, SkeletalAnimation, ParticleSystem, Vec3, utils } from 'cc';
import { ActorAnimationGraph } from '../../logic/actor/actor-animation-graph';
import { ActionActor, key_type_boolean, key_type_number } from '../action/action';
import { KeyAnyType } from '../../logic/data/game-type';
import { Local } from '../localization/local';
import { Msg } from '../msg/msg';
import { ResCache } from '../res/res-cache';
import { Util, UtilNode, UtilVec3 } from '../util/util';
import { ResPool } from '../res/res-pool';
const { ccclass } = _decorator;

@ccclass('ActorBase')
export class ActorBase extends Component {

    _action: ActionActor | undefined;
    _data: KeyAnyType = {};
    _updates: Function[] = [];

    _dir = new Vec3(0, 0, 0);
    _curDir = new Vec3(0, 0, 0);

    _angleVertical = 0;
    _groupIndex = -1;

    isPlayer = false;

    _anim: SkeletalAnimation | undefined;
    _animationGraph: ActorAnimationGraph | undefined;

    // The View node of the role.
    _view: Node | undefined;

    viewPointHead: Node | undefined | null;

    _actionUpdate = () => { };

    __preload (): void {
        this.onBind();
    }

    init (actionName: string) {

        this._data = Util.deepCopy(ResCache.Instance.getJson(actionName).json);

        if (this._action == undefined) this._action = new ActionActor(this._data.action, this);
        if (this._view == undefined) this._view = UtilNode.find(this.node, 'view');
        if (this.viewPointHead == undefined) this.viewPointHead = UtilNode.find(this.node, 'view_point_head');

        this.initView();
    }

    initView () { }

    onBind () {
        this.node.on('do', this.do, this);
        this.node.on('onGround', this.onGround, this);
        this.node.on('offGround', this.offGround, this);
        this.node.on('moveToSky', this.moveToSky, this);
        Msg.on('guide_end', this.onGuideEnd.bind(this));
    }

    offBind () {
        this.node.off('do', this.do, this);
        this.node.off('onGround', this.onGround, this);
        this.node.off('offGround', this.offGround, this);
        this.node.off('moveToSky', this.moveToSky, this);
        Msg.on('guide_end', this.onGuideEnd.bind(this));
    }

    onGuideEnd () {
        this.do('play');
    }

    moveToSky () {
        if (this._data.is_jump) return;
        this.do('move_to_sky');
    }

    onGround () {
        if (this._data.is_jump) this.do('jump_to_ground');
        this.do('on_ground');
    }

    offGround () {
        this.do('off_ground');
    }

    onUpdate () { }

    offUpdate () {
        this._updates = [];
    }

    updateAttribute () { }

    onDestroy () {
        this.offBind();
    }

    do (name: string) {
        if (this._action) this._action.on(name);
    }

    update (deltaTime: number) {
        if (this._action) this._action.update(deltaTime);
        var count = this._updates.length;
        for (let i = 0; i < count; i++)
            this._updates[i](deltaTime);

        if (this._data.jumping && this._data.is_ground) {
            this.do('jump_to_ground');
        }

    }

    setActive (data: key_type_boolean) {
        const activeNode = this.node.getChildByName(data.key);
        if (activeNode) activeNode.active = data.value;
        else console.warn(` You want set undefined node active. ${this.node?.name}/${data.key}`);
    }

    /*
    setFx (data: key_type_boolean) {
        const pNode = UtilNode.find(this.node, data.key);//this.node.getChildByName(data.key);
        const particles = pNode?.getComponentsInChildren(ParticleSystem);
        if (particles === undefined) return;
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.loop = data.value;
            if (data.value) p.play();
        }
    }

    onFx (data: string) {
        const pNode = UtilNode.find(this.node, data);//this.node.getChildByName(data);
        const particles = pNode?.getComponentsInChildren(ParticleSystem);
        if (particles === undefined) return;
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.play();
        }
    }
    */

    actionEnd () { }

    setDir (dir: Vec3) {
        UtilVec3.copy(this._dir, dir);
    }

    updateHP () {
        const percent_hp = this._data.hp / this._data.max_hp;
        this._data.is_low_hp = percent_hp < this._data.low_hp_percent;
        Msg.emit('fil_hp', percent_hp);
    }

    onDead () {

        if (!this.isPlayer) {
            if (this._groupIndex !== -1) {
                Msg.emit('msg_remove_level_enemy', this.node);
                Msg.emit('msg_remove_enemy', this._groupIndex);
                Msg.emit(
                    'msg_tips',
                    `${Local.Instance.get('killed_one')}`
                );
            }
            //this.node?.destroy();
            ResPool.Instance.push(this.node);
        }

    }

}