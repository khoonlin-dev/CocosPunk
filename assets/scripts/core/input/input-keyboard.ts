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

import { _decorator, EventKeyboard, input, Input, KeyCode, game, v3, EventMouse, math } from 'cc';
import { Msg } from '../msg/msg';
import { InputBase } from './input-base';
import { fun } from '../util/fun';
import { GameSet } from '../../logic/data/game-set';
import { DataLevelInst } from '../../logic/data/data-core';
const { ccclass, property } = _decorator;

let _pointerLock = false;

@ccclass('InputKeyboard')
export class InputKeyboard extends InputBase {

    move_a = 50;
    move_speed = 50;

    _dir = v3(0, 0, 0);
    key_count = 0;

    _pressQ = false;

    direction_up = 0;
    direction_down = 0;
    direction_left = 0;
    direction_right = 0;

    _isPause = false;

    accelerateRotation = 0;

    start () {

        // Register keyboard events.
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        // Register mouse events.
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);

        document.addEventListener('pointerlockchange', this.onPointerChange, false);

    }

    onPointerChange () {
        if (document.pointerLockElement === game.canvas) {
            _pointerLock = true;
        } else {
            fun.delay(() => {
                _pointerLock = false;
            }, 2);
        }
    }

    onDestroy () {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);

        document.removeEventListener('pointerlockchange', this.onPointerChange, false);
    }

    hasKey (event: EventKeyboard): boolean {
        return (event.keyCode === KeyCode.KEY_W ||
            event.keyCode === KeyCode.KEY_S ||
            event.keyCode === KeyCode.KEY_A ||
            event.keyCode === KeyCode.KEY_D ||
            event.keyCode === KeyCode.KEY_E ||
            event.keyCode === KeyCode.KEY_G ||
            event.keyCode === KeyCode.KEY_Q ||
            event.keyCode === KeyCode.KEY_C ||
            event.keyCode === KeyCode.KEY_N ||
            event.keyCode === KeyCode.KEY_R ||
            event.keyCode === KeyCode.SPACE ||
            event.keyCode === KeyCode.DIGIT_1 ||
            event.keyCode === KeyCode.DIGIT_2 ||
            event.keyCode === KeyCode.DIGIT_3 ||
            event.keyCode === KeyCode.DIGIT_4 ||
            event.keyCode === KeyCode.ARROW_UP ||
            event.keyCode === KeyCode.ARROW_LEFT ||
            event.keyCode === KeyCode.ARROW_RIGHT ||
            event.keyCode === KeyCode.ARROW_DOWN ||
            event.keyCode === KeyCode.SHIFT_LEFT ||
            event.keyCode === KeyCode.ESCAPE ||
            event.keyCode === KeyCode.KEY_T
        );
    }

    onKeyDown (event: EventKeyboard) {

        if (DataLevelInst.stop) {
            this.clear();
            return;
        }

        if (!this.hasKey(event)) return;

        this.key_count++;

        if (event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) this.direction_up = 1;
        if (event.keyCode === KeyCode.KEY_S || event.keyCode === KeyCode.ARROW_DOWN) this.direction_down = -1;
        if (event.keyCode === KeyCode.KEY_A || event.keyCode === KeyCode.ARROW_LEFT) this.direction_left = 1;
        if (event.keyCode === KeyCode.KEY_D || event.keyCode === KeyCode.ARROW_RIGHT) this.direction_right = -1;


        if (event.keyCode === KeyCode.KEY_Q) {
            this._actorInput?.onChangeEquips();
            document.exitPointerLock();

        }

        if (event.keyCode === KeyCode.SPACE) this._actorInput?.onJump();
        if (event.keyCode === KeyCode.KEY_C) this._actorInput?.onCrouch();
        if (event.keyCode === KeyCode.KEY_N) this._actorInput?.onAim(undefined);
        if (event.keyCode === KeyCode.KEY_E) this._actorInput?.onPick();
        if (event.keyCode === KeyCode.KEY_G) this._actorInput?.onDrop();
        if (event.keyCode === KeyCode.KEY_R) this._actorInput?.onReload();
        if (event.keyCode === KeyCode.SHIFT_LEFT) this._actorInput?.onRun(true);

        if (event.keyCode === KeyCode.DIGIT_1) this._actorInput?.onEquip(0);
        if (event.keyCode === KeyCode.DIGIT_2) this._actorInput?.onEquip(1);
        if (event.keyCode === KeyCode.DIGIT_3) this._actorInput?.onEquip(2);
        if (event.keyCode === KeyCode.DIGIT_4) this._actorInput?.onEquip(3);

        if (event.keyCode === KeyCode.KEY_T) Msg.emit('msg_change_tps_camera_target', 2);

    }

    onKeyUp (event: EventKeyboard) {

        if (DataLevelInst.stop) {
            this.clear();
            return;
        }

        if (event.keyCode === 0 || this.key_count <= 0) {
            this._pressQ = false;
            this.clear();
            return;
        }

        if (!this.hasKey(event)) return;

        this.key_count--;

        if (event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) this.direction_up = 0;
        if (event.keyCode === KeyCode.KEY_S || event.keyCode === KeyCode.ARROW_DOWN) this.direction_down = 0;
        if (event.keyCode === KeyCode.KEY_A || event.keyCode === KeyCode.ARROW_LEFT) this.direction_left = 0;
        if (event.keyCode === KeyCode.KEY_D || event.keyCode === KeyCode.ARROW_RIGHT) this.direction_right = 0;

        if (event.keyCode === KeyCode.SHIFT_LEFT) this._actorInput?.onRun(false);
        if (event.keyCode === KeyCode.ESCAPE) {
            this._actorInput?.onPause();
        }

    }

    onMouseDown (event: EventMouse) {

        if (DataLevelInst.stop) {
            this.clear();
            return;
        }

        if (event.getButton() === 0) {
            this._actorInput?.onAutoFire(true);
            this._actorInput?.onFire();
        }

    }

    onMouseUp (event: EventMouse) {

        if (event.getButton() === 0) {
            this._actorInput?.onAutoFire(false);
        }

        if (event.getButton() === 2) {
            this._actorInput?.onAim(undefined);
        }

    }

    pre_mouse_time = 0;
    pre_info = '';
    onMouseMove (event: EventMouse) {

        /*
        const deltaTime = game.totalTime - this.pre_mouse_time;

        const info = `time: ${game.totalTime} mouse move delta time:  ${deltaTime}  engine delta time: ${game.deltaTime}`;
        if (deltaTime > 20) {
            console.log('pre:', this.pre_info);
            console.log('cur:', info);
        }

        this.pre_info = info;
        this.pre_mouse_time = game.totalTime;
        */

        if (DataLevelInst.stop) {
            this.clear();
            return;
        }

        const screenXRate = event.movementX / game.canvas!.width * GameSet.Instance.screen_to_angle;
        const screenYRate = event.movementY / game.canvas!.width * GameSet.Instance.screen_to_angle;

        const distance = Math.sqrt(screenXRate * screenXRate + screenYRate * screenYRate);

        let accelerateDistance = 0;

        if (distance > GameSet.Instance.accelerate_point) accelerateDistance = distance;

        let index = 0;
        let move_value_list = GameSet.Instance.move_value_list;
        for (let i = 0; i < move_value_list.length; i++) {
            index = i;
            if (distance <= move_value_list[i]) break;
        }

        const accelerateRate = GameSet.Instance.move_accelerate_list[index];
        const rotationAccelerate = GameSet.Instance.sensitivity;

        this.accelerateRotation = math.lerp(this.accelerateRotation, accelerateRate, game.deltaTime * 10);

        const rate = GameSet.Instance.sensitivity_a * 3 * this.accelerateRotation;

        const rotateX = screenXRate * (1 + rotationAccelerate * accelerateDistance) * rate;
        const rotateY = screenYRate * (1 + rotationAccelerate * accelerateDistance) * rate;

        //console.log('GameSet.Instance.screen_to_angle:', GameSet.Instance.screen_to_angle, 'width:', game.canvas?.width, ' screenXRate:', screenXRate.toFixed(3), 'screenYRate:', screenYRate.toFixed(3), 'distance:', distance.toFixed(3), 'rotate x:', rotateX.toFixed(3), ' rotate y:', rotateY.toFixed(3));

        this._actorInput?.onRotation(rotateX, rotateY);
    }

    onMove () {
        //if (document.pointerLockElement === null && sys.isBrowser) return;
        this._dir.x = this.direction_left + this.direction_right;
        this._dir.z = this.direction_up + this.direction_down;
        this._dir.y = 0;
        this._actorInput?.onMove(this._dir.normalize());
    }

    clear () {
        this.direction_up = 0;
        this.direction_down = 0;
        this.direction_left = 0;
        this.direction_right = 0;
    }

    update (deltaTime: number) {
        this.onMove();
    }
}

