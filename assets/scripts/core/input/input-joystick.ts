import { _decorator, Camera, Canvas, Component, Node, v2, Vec2, Vec3 } from 'cc';
import { InputBase } from './input-base';
import { Msg } from '../msg/msg';
import { ActorInput } from '../../logic/actor/actor-input';
const { ccclass, property } = _decorator;

@ccclass('InputJoystick')
export class InputJoystick extends InputBase {

    _isRun = false;

    _isChangeEquips: boolean | undefined = false;

    start () {
        this.node.on('onAutoFireStart', this.onAutoFireStart, this);
        this.node.on('onAutoFireEnd', this.onAutoFireEnd, this);
    }

    onEnable () {
        this._actorInput = ActorInput.inst;
    }

    onDestroy () {
        this.node.on('onAutoFireStart', this.onAutoFireStart, this);
        this.node.on('onAutoFireEnd', this.onAutoFireEnd, this);
    }

    onChangeEquips () {
        //this._isChangeEquips = this._actorInput?.onChangeEquips();
        Msg.emit('push', 'select_equips');
    }

    onMove (dir: Vec3) {
        this._actorInput?.onMove(dir);
    }

    onFire () {
        this._actorInput?.onFire();
    }

    onAutoFireStart () {
        this._actorInput?.onAutoFire(true);
    }

    onAutoFireEnd () {
        this._actorInput?.onAutoFire(false);
    }

    onFireStart () {

    }

    onFireEnd () {

    }

    onJump () {
        this._actorInput?.onJump();
    }

    onCrouch () {
        this._actorInput?.onCrouch();
    }

    onProne () {
        //this._actorInput?.onProne();
    }

    onAim () {
        this._actorInput?.onAim(undefined);
    }

    onPick () {
        this._actorInput?.onPick();
    }

    onDrop () {
        this._actorInput?.onDrop();
    }

    onReload () {
        this._actorInput?.onReload();
    }

    onRun () {
        this._isRun = !this._isRun;
        this._actorInput?.onRun(this._isRun);
    }

    onPause () {
        //this._actorInput?.onPause();
        Msg.emit('push', 'level_pause');
    }

    onSetRun (isRun: boolean) {
        this._isRun = isRun;
        this._actorInput?.onRun(isRun);
    }

    onRotation (deltaX: number, deltaY: number) {

        if (this._isChangeEquips) {
            Msg.emit('msg_select_equip', v2(deltaX, deltaY));
            return;
        }

        this._actorInput?.onRotation(deltaX / 5, -deltaY / 5);
    }
}

