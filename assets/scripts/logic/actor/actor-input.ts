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

import { _decorator, Component, Vec3, sys } from 'cc';
const { ccclass } = _decorator;
import { IActorInput } from '../../core/input/IActorInput';
import { Level } from '../level/level';
import { Msg } from '../../core/msg/msg';
import { UI } from '../../core/ui/ui';

@ccclass('ActorInput')
export class ActorInput extends Component implements IActorInput {

    _actor: IActorInput | undefined | null;
    _isPause = false;

    _isOpenEquips = false;

    public static inst: ActorInput | undefined;

    start () {
        Msg.on('msg_set_input_active', this.setActive.bind(this));
        ActorInput.inst = this;
        Msg.on('msg_exit_pointer', this.exitPointer.bind(this));
    }

    exitPointer () {
        document.exitPointerLock();
    }

    onDestroy () {
        Msg.off('msg_set_input_active', this.setActive.bind(this));
        Msg.off('msg_exit_pointer', this.exitPointer.bind(this));

        if (sys.platform === sys.Platform.MOBILE_BROWSER ||
            sys.platform === sys.Platform.ANDROID ||
            sys.platform === sys.Platform.IOS) {
            UI.Instance.off('ui_joystick');
        }
    }

    setActive (isShow: boolean) {
        if (isShow) {
            this.initInput();
        } else {
            for (let i = 0; i < this.node.children.length; i++) this.node.children[i].active = false;
            UI.Instance.off('ui_joystick');
        }
    }

    initInput () {

        this._actor = Level.Instance._player;

        // Select the type of input device enabled based on the platform.
        if (sys.platform === sys.Platform.MOBILE_BROWSER ||
            sys.platform === sys.Platform.ANDROID ||
            sys.platform === sys.Platform.IOS) {
            UI.Instance.on('ui_joystick');
        } else {
            this.node.children[1].active = true;
            this.node.children[0].active = true;
            //UI.Instance.on('ui_joystick');
        }


    }

    onMove (move: Vec3) {
        this._actor?.onMove(move);
    }

    onRotation (x: number, y: number) {
        this._actor?.onRotation(x, y);
    }

    onJump () {
        this._actor?.onJump();
    }

    onRun (isRun: boolean) {
        this._actor?.onRun(isRun);
    }

    onCrouch () {
        this._actor?.onCrouch();
    }

    onAim () {
        this._actor?.onAim(undefined);
    }

    onFire () {
        this._actor?.onFire();
    }

    onAutoFire (isAutoFire: boolean) {
        this._actor?.onAutoFire(isAutoFire);
    }

    onEquip (index: number) {
        this._actor?.onEquip(index);
    }

    onPick () {
        this._actor?.onPick();
    }

    onReload () {
        this._actor?.onReload();
    }

    onDrop () {
        this._actor?.onDrop();
    }

    onDir (x: number, y: number) {
    }

    onPause () {

        this._isPause = !this._isPause;
        Msg.emit('push', 'level_pause');

    }

    onChangeEquips () {
        Msg.emit('push', 'select_equips');
        return true;
    }


}