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

import { _decorator, Component, Node, v3, Vec3, CCFloat } from 'cc';
import { UtilVec3 } from '../../core/util/util';
import { Msg } from '../../core/msg/msg';
import { SensorRayNodeToNode } from '../../core/sensor/sensor-ray-node-to-node';
const { ccclass, property } = _decorator;

@ccclass('CameraMoveTarget')
export class CameraMoveTarget extends Component {

    @property({ type: Node, tooltip: 'Target Node' })
    targetNode: Node | undefined;

    @property({ type: CCFloat, tooltip: 'Smooth position move.' })
    smoothSlowMove = 5.0;

    @property({ type: CCFloat, tooltip: 'Smooth angle.' })
    smoothAngle = 5.0;

    @property({ type: CCFloat, tooltip: 'Smooth position move.' })
    smoothFastMove = 15;

    @property({ type: Node, tooltip: 'Camera Node.' })
    cameraNode: Node | undefined;

    @property({ type: [Node], tooltip: 'Target node list.' })
    targets: Node[] = [];

    @property({ type: CCFloat, tooltip: 'Start the waiting time.' })
    waitTime = 10;

    @property({ type: Node, tooltip: 'Look at target node.' })
    lookAtTarget: Node | undefined;

    currentPosition = v3(0, 0, 0);
    currentAngle = v3(0, 0, 0);

    sensor: SensorRayNodeToNode | undefined;

    movePosition = v3(0, 0, 0);

    smoothMove = 5.0;

    start () {
        Msg.on('msg_change_tps_camera_target', this.setTarget.bind(this));
        UtilVec3.copy(this.currentPosition, this.cameraNode!.position);
        UtilVec3.copy(this.currentAngle, this.cameraNode!.eulerAngles);
        this.sensor = this.getComponent(SensorRayNodeToNode)!;
    }

    onDestroy () {
        Msg.off('msg_change_tps_camera_target', this.setTarget.bind(this));
    }

    update (deltaTime: number) {

        if (this.waitTime > 0) {
            this.waitTime -= deltaTime;
            return;
        }

        if (!this.targetNode) return;

        // Calculate move position.
        if (this.sensor!.hitPoint.length() > 0) {
            UtilVec3.copy(this.movePosition, this.sensor!.hitPoint);
            this.movePosition.subtract(this.node!.worldPosition);
            const length = this.movePosition.length();
            UtilVec3.copy(this.movePosition, this.targetNode.position);
            this.movePosition.subtract(this.node.position).normalize().multiplyScalar(length);
            this.smoothMove = this.smoothFastMove;
        } else {
            UtilVec3.copy(this.movePosition, this.targetNode.position);
            this.smoothMove = this.smoothSlowMove;
        }
        //const targetPosition = this.sensor!.hitPoint.length() > 0 ? this.sensor!.hitPoint : this.targetNode.position;

        // Smooth move position.
        Vec3.lerp(this.currentPosition, this.currentPosition, this.movePosition, this.smoothMove * deltaTime);
        this.cameraNode?.setPosition(this.currentPosition);


        // Smooth move angle.
        //Vec3.lerp(this.currentAngle, this.currentAngle, this.targetNode.eulerAngles, this.smoothAngle * deltaTime);
        this.cameraNode?.setRotationFromEuler(this.targetNode.eulerAngles);//this.currentAngle);

        // Set Look at point.
        this.lookAtTarget?.setPosition(0, 0, -this.cameraNode!.position.z - 5);

    }

    setTarget (index: number) {
        this.targetNode = this.targets[index];
        this.sensor!.endNode = this.targetNode;
    }

}

