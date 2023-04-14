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

import { _decorator, Component, geometry, Node, PhysicsSystem, v3, Vec3, CCFloat } from 'cc';
import { UtilVec3 } from '../util/util';
const { ccclass, property } = _decorator;

@ccclass('SensorRayNodeToNode')
export class SensorRayNodeToNode extends Component {

    @property(Node)
    startNode: Node | undefined

    @property(Node)
    endNode: Node | undefined

    @property([CCFloat])
    masks = [];

    @property
    check_time = 0.5;

    _mask: number = 0;

    _time = 0;

    _direction = v3(0, 0, 0);

    _ray: geometry.Ray = new geometry.Ray();

    hitPoint = v3(0, 0, 0);

    start () {

        for (let i = 0; i < this.masks.length; i++)
            this._mask = this._mask | 1 << this.masks[i];

    }

    update (deltaTime: number) {

        this._time -= deltaTime;
        if (this._time < 0) {
            UtilVec3.copy(this._ray.o, this.startNode!.worldPosition);
            UtilVec3.copy(this._direction, this.endNode!.worldPosition);
            this._direction.subtract(this.startNode!.worldPosition)
            const distance = this._direction.length();

            this._direction.normalize();
            UtilVec3.copy(this._ray.d, this._direction);

            if (PhysicsSystem.instance.raycastClosest(this._ray, this._mask, distance)) {
                UtilVec3.copy(this.hitPoint, PhysicsSystem.instance.raycastClosestResult.hitPoint);
                this.hitPoint?.subtract(this._direction);

                //
                const hitDistance = this.hitPoint.clone().subtract(this.startNode!.worldPosition).length();

            } else {
                UtilVec3.copy(this.hitPoint, Vec3.ZERO);
            }
        }

    }
}

