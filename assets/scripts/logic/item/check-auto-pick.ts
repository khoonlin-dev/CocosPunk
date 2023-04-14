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

import { _decorator, Component, sys } from 'cc';
import { Actor } from '../actor/actor';
const { ccclass } = _decorator;

@ccclass('CheckAutoPick')
export class CheckAutoPick extends Component {

    _actor: Actor | undefined;

    // auto pick check time.
    checkAutoPickTime = 1;

    isAutoPick = false;

    start () {

        this._actor = this.getComponent(Actor)!;

        this.isAutoPick = sys.platform === sys.Platform.MOBILE_BROWSER ||
            sys.platform === sys.Platform.ANDROID ||
            sys.platform === sys.Platform.IOS;

    }

    update (deltaTime: number) {

        if (!this.isAutoPick) return;

        this.checkAutoPickTime -= deltaTime;

        if (this.checkAutoPickTime > 0) return;

        this.checkAutoPickTime = 1;

        this._actor?.onPick();

    }
}

