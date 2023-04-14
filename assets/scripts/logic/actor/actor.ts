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

import { _decorator, Vec3, v3, game, Node, math } from 'cc';
import { ActorBase } from '../../core/actor/actor-base';
import { IActorInput } from '../../core/input/IActorInput';
import { Local } from '../../core/localization/local';
import { Msg } from '../../core/msg/msg';
import { UtilNode, UtilVec3 } from '../../core/util/util';
import { ActorAnimationGraph } from './actor-animation-graph';
import { ActorBag } from './actor-bag';
import { ActorEquipment } from './actor-equipment';
import { ActorSensorDropItem } from './actor-sensor-drop-item';
import { ActorMove } from './actor-move';
import { SensorGround } from '../../core/sensor/sensor-ground';
import { ActorFace } from './actor-face';
import { Sound } from '../../core/audio/sound';
import { Guide } from '../../core/guide/guide';
const { ccclass, property } = _decorator;

let tempLinearVelocity = v3(0, 0, 0);
let tempAngleVelocity = v3(0, 0, 0);

@ccclass('Actor')
export class Actor extends ActorBase implements IActorInput {

    _move = v3(0, 0, 0);
    _actorBag: ActorBag | undefined;
    _actorEquipment: ActorEquipment | undefined;

    @property({ type: ActorSensorDropItem })
    actorSensorDropItem: ActorSensorDropItem | undefined;

    @property({ type: ActorFace })
    _actorFace: ActorFace | undefined;

    _actorSensorGround: SensorGround | undefined;
    _actorMove: ActorMove | undefined;
    _viewNoWeapon: Node = Object.create(null);
    _forwardNode: Node | undefined;
    _viewRoot: Node | undefined;

    _currentEquipIndex = 0;

    // forward
    forward: Vec3 = v3(0, 0, 0);
    _fps = 0;
    isReady = false;

    bulletBox = 2;

    recoverStrengthTime = 0;

    get noAction () {
        return this._data.is_dead || this._data.is_win;
    }

    initView () {

        super.initView();

        if (this._actorBag == undefined) this._actorBag = new ActorBag(this);
        if (this._actorEquipment == undefined) this._actorEquipment = new ActorEquipment(this);
        if (this._actorSensorGround == undefined) this._actorSensorGround = this.node.getComponent(SensorGround)!;
        if (this._actorMove == undefined) {
            this._actorMove = this.getComponent(ActorMove)!;
            this._actorMove.jumpForce.y = this._data.jump_force_y;
            this._actorMove.angleVerticalMax = this._data.angle_vertical_max;
            this._actorMove.angleVerticalMin = this._data.angle_vertical_min;
        }
        if (this._forwardNode == undefined) this._forwardNode = UtilNode.find(this.node, 'forwardNode');
        if (this._viewRoot == undefined) this._viewRoot = UtilNode.find(this.node, 'animation_view');
        if (this._animationGraph == undefined) this._animationGraph = this._viewRoot.getComponent(ActorAnimationGraph)!;

        if (!Guide.Instance.isGuide) this.do('play');
    }

    onUpdate () {
        super.onUpdate();
        this._updates.push(this.updateAction.bind(this));
    }

    do (name: string) {
        if (this.noAction) return;
        super.do(name);
    }

    updateAction (deltaTime: number) {

        this._fps = game.frameRate as number;

        if (this._data.hit_recover > 0 || this._data.hp <= 0) {
            this._data.hit_recover -= deltaTime;
            this._actorMove!.isStopMove = true;
            this._actorMove?.stop();
        } else {
            this._actorMove!.isStopMove = false;
        }

        // Check run strength
        const canRun = this.calculateRunStrength(deltaTime);

        this._actorMove!.speed = canRun ? -this._data.run_speed.z : -this._data.move_speed.z;

        if (this._data.is_crouch) this._actorMove!.speed *= this._data.crouch_speed_percent;

        const normalizeSpeed = Math.abs(this._actorMove!.velocity.length() / this._actorMove!.speed);
        this._actorEquipment?.updateAim(normalizeSpeed);
        this.recoverStrength();

        // Update forward info.
        if (this._forwardNode) UtilVec3.copy(this.forward, this._forwardNode?.forward);
    }

    onJump () {

        if (this._data.is_crouch) return;
        if (this._data.is_jump) return;

        if (this._actorSensorGround!._isGround === false) return;

        if (this._data.strength >= this._data.cost_jump_strength) {
            this._data.strength -= this._data.cost_jump_strength;
        }

        if (this._actorMove!.currentSpeed >= 1) {
            this._actorMove!.jumpForce.y = this._data.jump_force_jog_y;
            this.do('jump_from_jog');
        } else {
            this._actorMove!.jumpForce.y = this._data.jump_force_y;
            this.do('jump_from_stand');
        }

    }

    onWin () { }

    jump () {
        this._actorMove?.jump();
        this._data.is_ground = false;
    }

    onMoveToPoint (point: Vec3) {
        this._actorMove.moveToPoint(point);
    }

    onMove (move: Vec3) {
        this._actorMove?.moveDirection(move);
    }

    onRotation (x: number, y: number) {
        this._actorMove?.onRotation(x, y);
    }

    onDir (x: number, y: number, z: number) {
        this._dir.z = z;
        this._dir.x = x;
        this._dir.y = 0;
        this._actorMove?.onDirection(x, y, z);
    }

    onPause () { }

    onRun (isRun: boolean) { this._data.is_run = isRun; }

    onPick () {

        var pickedNode = this.actorSensorDropItem?.getPicked();

        if (pickedNode !== undefined) {

            const pickedName = pickedNode.name;

            // Picked health.
            if (pickedName == 'medkit') {
                const recoverHP = this._data.max_hp - this._data.hp;
                if (recoverHP <= 0) {
                    Msg.emit(
                        'msg_tips',
                        `${Local.Instance.get('full_hp')}`
                    );
                    return;
                }

                this._data.hp = this._data.max_hp;
                Sound.on('sfx_recovery_hp')
                this.updateHP();
                Msg.emit(
                    'msg_tips',
                    `${Local.Instance.get('recovery_hp')}  ${recoverHP}`
                );
                pickedNode.emit('picked');
                return;
            }

            // Picked same weapon increase clip.
            if (this._actorBag?.pickedSameWeaponIncreaseClips(pickedName)) {
                pickedNode.emit('picked');
                Msg.emit(
                    'msg_tips',
                    `${Local.Instance.get('picked_clip')}`
                );
                Msg.emit('msg_update_bag');
                Msg.emit('msg_update_equip_info');
                return;
            }

            // Picked bullet box.
            if (pickedName === 'bullet_box') {
                this._actorBag?.pickedBulletBox()
                pickedNode.emit('picked');
                Msg.emit(
                    'msg_tips',
                    `${Local.Instance.get('picked_bullet_box')}`
                );
                Msg.emit('msg_update_equip_info');
                return;
            }

            // Picked items
            if (this._actorBag?.pickedItem(pickedName)) {
                pickedNode.emit('picked');
                Msg.emit(
                    'msg_tips',
                    `${Local.Instance.get(pickedName)} x1`
                );
                this.bulletBox++;
                Msg.emit('msg_update_bag');
                Msg.emit('msg_update_equip_info');
            } else {
                Msg.emit(
                    'msg_tips',
                    `${Local.Instance.get('bag_is_full')}`
                );
            }
        }

    }

    onDrop () {
        if (this._actorBag?.dropItem()) {
            Msg.emit('msg_update_bag');
        }
    }

    onCrouch () {

        if (this._data.is_jump) return;

        this._data.is_crouch = this._data.is_crouch ? false : true;

        // set view height.
        // set physic collider height.
        // set hit part height.
        this._animationGraph?.play('bool_crouch', this._data.is_crouch);
        const move_y = this._data.is_crouch ? this._data.stand_camera_height : this._data.crouch_camera_height;
        Msg.emit('msg_change_tps_camera_height', move_y);

    }

    onAim (isAim: boolean | undefined) {
        if (isAim === undefined) {
            this._data.is_aim = this._data.is_aim ? false : true;
        } else {
            if (isAim == this._data.is_aim) return;
            this._data.is_aim = isAim;
        }

        // Get aim state.
        this.do(this._data.is_aim ? 'on_aim' : 'off_aim');

        if (this.isPlayer) Msg.emit('msg_change_tps_camera_target', this._data.is_aim ? 1 : 0);
    }

    /**
     * Open fire interface. 
     * @returns 
     */
    onFire () {

        if (this._data.is_equip || this._data.is_reload) return;

        // Determines if the current equipment is ready to fire.
        // Includes the number of rounds in the magazine and the firing cooldown.
        if (this._actorEquipment!.currentEquip?.checkUse() == false) return;

        // Execute the fir action.
        this._actorEquipment?.do('fire');

        // Sets the aim stable value to the maximum.
        this._actorEquipment?.updateAim(1, true);

        // Broadcast fire
        if (this.isPlayer) Msg.emit('msg_sound_position', this.node.worldPosition);

        /*
        const canUseEquip = this.calculateStrengthUseEquip();
        if (canUseEquip) {}
        */
    }

    /**
     * Set Auto fire state.
     * @param isAutoFire Auto fire state.
     */
    onAutoFire (isAutoFire: boolean) { this._data.is_auto_fire = isAutoFire; }

    onReload () {

        if (this._data.is_reload || this._data.is_equip) return;

        if (this._actorEquipment?.currentEquip?.checkFullBullet()) return;

        this._actorEquipment?.do('reload');
    }

    onEquip (index: number) {

        if (this._data.is_reload || this._data.is_equip) return;

        if (this._actorEquipment?.equip(index)) {
            if (this._data.has_multi_res) this._viewNoWeapon.active = false;
        } else {
            if (this._data.has_multi_res) this._viewNoWeapon.active = true;
        }
    }

    onChangeEquips (): boolean { return false; }

    calculateStrengthUseEquip (): boolean {

        const canUseEquip = this._data.strength >= this._data.cost_use_equip_strength;
        if (canUseEquip) {
            this._data.strength -= this._data.cost_use_equip_strength;
            this._data.strength = Math.max(this._data.strength, 0);
        }

        return canUseEquip;
    }

    calculateRunStrength (deltaTime: number): boolean {
        const canRun = this._data.is_run && this._data.strength >= this._data.cost_run_strength;
        if (canRun) {
            this._data.strength -= this._data.cost_run_strength * deltaTime;
            this._data.strength = Math.max(this._data.strength, 0);
            const percent_value = this._data.strength / this._data.max_strength;
            if (this.isPlayer) {
                Msg.emit('fil_strength', percent_value);
            }
        }
        return canRun;
    }

    recoverStrength () {

        //if (this._data.is_ground === false) return;
        if (this._data.is_run) return;

        this.recoverStrengthTime += game.deltaTime;

        if (this.recoverStrengthTime >= 2) {
            this._data.strength += this._data.recover_ground_strength * this.recoverStrengthTime;
            if (this._data.strength > this._data.max_strength) this._data.strength = this._data.max_strength;
            const percent_value = this._data.strength / this._data.max_strength;
            if (this.isPlayer) {
                Msg.emit('fil_strength', percent_value);
            }
            this.recoverStrengthTime = 0;
        }

    }

    lateUpdate (deltaTime: number) {

        if (this._actorMove == undefined) return;

        // Synchronize animation setup data.
        const rigidBody = this._actorMove?.rigid;
        rigidBody!.getLinearVelocity(tempLinearVelocity);

        tempLinearVelocity.y = 0;
        const linearVelocityLength = tempLinearVelocity.length();
        const eulerAnglesY = this.node.eulerAngles.y;

        //rotate y.
        Vec3.rotateY(tempLinearVelocity, tempLinearVelocity, Vec3.ZERO, math.toRadian(-eulerAnglesY));

        let num_velocity_x = tempLinearVelocity.x;
        let num_velocity_y = tempLinearVelocity.z;

        let moveSpeed = linearVelocityLength * this._data.linear_velocity_animation_rate;

        // Check rotation.
        const angleSpeed = this._actorMove!.angle;
        if (linearVelocityLength < 0.01 && angleSpeed > 2) {
            moveSpeed = angleSpeed * this._data.angle_velocity_animation_rate;
            num_velocity_x = angleSpeed / this._data.angle_velocity_animation_scale;
        }

        this._animationGraph?.setValue('num_velocity_x', num_velocity_x);
        this._animationGraph?.setValue('num_velocity_y', -num_velocity_y);
        this._animationGraph?.setValue('num_move_speed', moveSpeed);

    }

}