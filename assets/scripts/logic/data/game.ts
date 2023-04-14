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

import { Node, find, game } from "cc";
import { Action } from "../../core/action/action";
import { Singleton } from "../../core/pattern/singleton";
import { UI } from '../../core/ui/ui';
import { Bind } from './bind'
import { Local } from "../../core/localization/local";
import { Save } from "./save";
import { Msg } from "../../core/msg/msg";
import { Stack } from "../../core/util/data-structure";
import { Level } from "../level/level";
import { Sound } from "../../core/audio/sound";
import { Notify } from "../../core/io/notify";
import { GameQuality as GameQuality } from "./GameQuality";

import * as dataCore from "./data-core";
import { BindUI } from "../../core/ui/ui-base";
import { GameSet } from "./game-set";
import { ResPool } from "../../core/res/res-pool";
import { ExitPointerLock } from "../../core/input/exit-pointer-lock";
import { Guide } from "../../core/guide/guide";

export class Game extends Singleton {

    // Action objects are used to execute the current set of actions.
    _action: Action | undefined;

    // The stack collection is used to manage the current node order.
    _stack: Stack<string> = new Stack(5);

    // The key-value collection is used to store all the game node data.
    _nodes: { [key: string]: any } = {};

    // Game data object to store static game data.
    _data: { [key: string]: any } = {};

    // If or not the game is initialized, true is initialized, false is not initialized.
    _isInit = false;

    // Total game time, used to store the total time the game has been running. 
    _totalGameTime = 0;

    // The next storage time point is used to control the event interval control for automatic storage. 
    _nextSaveTime = 0;

    // The root node of all pool objects game runtime.
    _poolNode: Node | null | undefined;

    // Safe time for back
    backSafeTime = 0;

    public init (): void {

        // Find the root node of all pool objects.
        this._poolNode = find('init')?.getChildByName('objects-pool');

        // Support native pointer lock exit logic.
        this._poolNode?.addComponent(ExitPointerLock);

        // Initialize the data core.
        dataCore.Init();

        // Initialize pool.
        ResPool.Instance.initPool(this._poolNode);

        // Initialize local storage.
        Save.Instance.init();

        // Initialize guide.
        Guide.Instance.init();

        // Initialize game set.
        GameSet.Instance.init();

        // Initialize the game data.
        this._data = dataCore.DataGameInst._data;

        // Initialize game action data.
        this._action = new Action(this._data.action_data);

        // Get the game node data.
        this._nodes = this._data['nodes'];

        // Initialize the game quality.
        GameQuality.Instance.init();

        // Initialize the sound manager.
        Sound.init();

        // Initialize localization.
        Local.Instance.init();

        // Initialize the level object.
        Level.Instance.init();

        // Initialize the UI binding.
        BindUI.init();

        // Initialize the binder.
        Bind.Instance.initData(this._data['events']);

        // Initialize the UI management object.
        UI.Instance.init();

        // Register game node stack operation method.
        Msg.on('push', (key: string) => { Game.Instance.push(key); });
        Msg.on('root', (key: string) => { Game.Instance.root(key); });
        Msg.on('next', this.next.bind(this));
        Msg.on('back', this.back.bind(this));

        // Push the game initial node into the stack data.
        this.push(this._data['start_node']);

        //Set game initialization to true.
        this._isInit = true;

        // Check if a message currently exists. 
        // Why it is detected after initialization: because messages may not be displayed properly during initialization.
        Notify.Instance.check_notify();

    }

    /**
     * Jump to the next game node. 
     */
    public next (): void {
        var cur = this._stack.cur();
        const nextAction = this._nodes[cur].next;
        if (nextAction) this.push(nextAction);
    }

    /**
     * Return to the previous game node.
     */
    public back (): void {
        if (game.totalTime - this.backSafeTime < 50) return;
        this.backSafeTime = game.totalTime;
        const preNode = this._stack.pop();
        this._action!.off(preNode);
    }

    /**
     * Returns to the game root node corresponding to the name.
     * @param name 
     */
    public root (name: string): void {
        var size = this._stack.size() - 1;
        for (let i = 0; i < size - 1; i++) {
            let pre = this._stack.pop();
            this._action!.off(pre);
        }
    }

    /**
     * Pushes a new game node.
     * @param name node name.
     */
    public push (name: string) {
        dataCore.DataGameInst._currentGameNodeName = name;
        if (!this._nodes[name].is_pop && this._stack.size() > 0) {
            var pre = this._stack.pop();
            this._action!.off(pre);
        }
        this._stack.push(name);
        this._action!.on(name);
    }

    public update (deltaTime: number): void {

        // If initialization false returns, initialization success continues.
        if (!this._isInit) return;

        //Increase the game time, The accumulated time is the length of each frame.
        this._totalGameTime += deltaTime;

        // Update the game action logic every frame.
        Game.Instance._action.update(deltaTime);

        // Update the level logic every frame.
        Level.Instance.update(deltaTime);

        // Update the binder logic every frame.
        Bind.Instance.update(deltaTime);

        // Automatic save judgment: true is on, false is off
        if (this._data.auto_save) {
            // When the current total time of the game is greater than the next time node. 
            // true is to update the game storage logic. 
            // false is to wait.
            if (this._totalGameTime > this._nextSaveTime) {
                // Updates the current game time stats.
                Save.Instance.statisticsTime('game', Math.floor(this._data.next_save_time));
                this._nextSaveTime += this._data.next_save_time
            }
        }

    }

}
