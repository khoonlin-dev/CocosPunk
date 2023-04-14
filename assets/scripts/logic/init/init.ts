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

import { _decorator, Component, director, find, gfx, sys } from 'cc';
import { Game } from '../data/game'
import { ResCache } from '../../core/res/res-cache';
import { loadTextures } from '../../core/res/res-texture';

const { ccclass } = _decorator;

@ccclass('Init')
export class Init extends Component {

    start () {

        if (sys.isBrowser && director?.root?.device.gfxAPI == gfx?.API.WEBGL) {
            // Find the root node of all pool objects.
            const panelNotSupport = find('init')?.getChildByName('canvas')?.getChildByName('ui_not_support');
            if (panelNotSupport) panelNotSupport.active = true;
            return;
        }

        // Set the change node not to be destroyed.
        director.addPersistRootNode(this.node);

        // Load the resource cache data and execute the initialize game function.
        ResCache.Instance.load(async () => {
            console.time('loadTextures')
            await loadTextures();
            console.timeEnd('loadTextures')
            Game.Instance.init();
        });

    }

    update (deltaTime: number) {

        // Update the main game logic with every frame.
        Game.Instance.update(deltaTime);

    }

}
