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

import { _decorator, Component, Vec3, v3, random, randomRangeInt, Node, math, game, randomRange } from 'cc';
import { SensorRaysAngle } from '../../core/sensor/sensor-rays-angle';
import { UtilVec3 } from '../../core/util/util';
import { NavSystem } from '../navigation/navigation-system';
import { ActorInputBrain } from './actor-input-brain';
import { Level } from '../level/level';
import { Actor } from './actor';
import { DataLevelInst } from '../data/data-core';
import { Guide } from '../../core/guide/guide';
import { NavTest } from '../navigation/navigation-paths-test';
import { Msg } from '../../core/msg/msg';

const { ccclass } = _decorator;

let tempRotationSideVector = v3(0, 0, 0);
const tempAngle = v3(0, 0, 0);
const tempDistance = v3(0, 0, 0);

@ccclass('ActorBrain')
export class ActorBrain extends Component {

    // The character object to which the current equipment belongs.
    _actor: Actor | undefined;

    // The currently planned waypoint.
    _wayPoints = new Array<NavSystem.NavPointType>();

    // The direction the character moves.
    _moveDir: Vec3 = v3(0, 0, 0);

    // Target distance from my direction.
    targetDirection: Vec3 = v3(0, 0, 0);

    // Unified input management object for character.
    input: ActorInputBrain | undefined;

    // Sector sensor, used to detect the status in front of the character. 
    sensorRays: SensorRaysAngle | undefined;

    // Whether it is waypoint navigation.
    isFollowWayPointsMove = false;

    // current waypoint index.
    currentWaypointsIndex = 1;

    // The closest Navigation point marker to the character.
    closestNavigationPoint = -1;

    // The target object node.
    _targetNode: Node | undefined;

    // The position of the target node.
    targetPosition: Vec3 = v3(0, 0, 0);

    // Path node index of the current fire. 
    waypointsFireIndex = -1;

    // Open fire planning waypoints.
    waypointsFire = new Array<NavSystem.NavPointType>();

    // The direction of the open fire.
    fireDirection = v3(0, 0, 0);

    // The time it takes to replace ammunition.
    reloadTime = 0;

    // Path following direction, 1 means move forward, -1 means move backwards.
    followPathsDirection = 1;

    // Fire wait time.
    fireWaitTime = 2;

    // Hate time
    hateTime = 0;

    brainState: BrainState = BrainState.none;

    _actionUpdate = () => { };

    targetPos: Node | undefined;

    waitBrainTime = 1.5;

    pursuitIndex = 0;
    pursuitTimes = 1;

    eventPosition = v3(0, -1000, 0);

    ghostTime = 0;
    nextGhostTime = 0;

    start () {
        this._actor = this.getComponent(Actor)!;
        this.input = this.getComponent(ActorInputBrain)!;
        const sensorNode = this.node.getChildByName('sensor_target')!;
        this.sensorRays = sensorNode.getComponent(SensorRaysAngle)!;
        this.closestNavigationPoint = this._actor._data.nearest;

        this.targetPos = NavTest?.getTarget();

        Msg.on('msg_sound_position', this.heartGunshot.bind(this));

        if (this._actor === undefined || this.input === undefined || this.sensorRays === undefined) {
            throw new Error(`${this.node.name} node lose components : ActorBase or ActorInputBrain.`);
        }

        this.onNoneState();

    }

    onDestroy () {
        Msg.off('msg_sound_position', this.heartGunshot.bind(this));
    }

    onEnable () {
        this.waitBrainTime = 1.5;
    }

    onMove () {
        this.input!.onMove(this._moveDir);
        //this.input!.onRotation(this.targetDirection.x, this.targetDirection.z);
        this.input!.onDir(this.targetDirection.x, this.targetDirection.y, this.targetDirection.z);
        //this.input!.onRun(random() < 0.05);
    }

    onJump () {
        this.input?.onJump();
    }

    onCrouch () {
        this.input?.onCrouch();
    }

    onProne () {
        this.input?.onProne();
    }

    onFire () {
        this.input?.onFire();
    }

    update (deltaTime: number) {

        if (this.waitBrainTime > 0) {
            this.waitBrainTime -= deltaTime;
            return;
        }

        if (Guide.Instance.isGuide) return;

        if (DataLevelInst.stop) return;

        // Not ready returns do not execute the following logic.
        if (!this._actor!.isReady) return;

        // If you die, you will return without executing the logic of your brain.
        if (this._actor?._data.is_dead) return;

        // Returns without executing brain logic if the player dies.
        //const player = Level.Instance._player;
        //if (!player || Level.Instance._player?._data.is_dead) return;

        // check fire logic.
        this.checkFire();

        // Run state
        this._actionUpdate();

    }

    heartGunshot (eventPosition: Vec3) {

        const newDistance = Vec3.distance(this.eventPosition, eventPosition);

        if (newDistance < 10) return;

        if (this.brainState == BrainState.free) {
            const distance = Vec3.distance(eventPosition, this.node.worldPosition);
            if (distance < this._actor?._data.ai_hear_range) {
                UtilVec3.copy(this.eventPosition, eventPosition);
                this._actor!._data.ai_hate += 1;
            }
        }
    }


    checkFire () {

        const player = Level.Instance._player;

        if (!player || Level.Instance._player?._data.is_dead) {
            this.onFreeState();
            return false;
        }

        const data = this._actor!._data;
        const distance = Vec3.distance(player.node.worldPosition, this._actor!.node.worldPosition);

        const checkDistance = data.ai_nearby_distance * (1 + data.ai_hate);

        if ((this.brainState != BrainState.fire && distance < checkDistance) ||
            (this.brainState == BrainState.fire && distance < checkDistance + 3)) {
            this._targetNode = player.node;
            this.onFireState();
            return;
        } else {
            this._targetNode = undefined;
            if (this._actor?._data.ai_hate > 0 || this.brainState == BrainState.fire) {
                this.onPursuitState();
            } else {
                if (this.brainState != BrainState.pursuit)
                    this.onFreeState();
            }
        }

        // Calculate hate
        if (data.ai_hate > 0) {
            this.hateTime -= game.deltaTime;
            if (this.hateTime < 0) {
                const data = this._actor!._data;
                data.ai_hate = data.ai_hate - 1;
                if (data.ai_hate <= 0) data.ai_hate = 0;
                this.hateTime = data.ai_hate_clear_time;
            }
        }

    }


    onNoneState () {
        if (this.brainState == BrainState.none) return;
        this._actionUpdate = this.noneState;
        this.brainState = BrainState.none;
    }

    noneState () { }

    onFreeState () {

        if (this.brainState == BrainState.free) return;

        //console.log('free state.');

        this.input?.onAim(false);
        this.isFollowWayPointsMove = false;
        this.waypointsFireIndex = -1;
        this._actionUpdate = this.freeState;
        this.brainState = BrainState.free;

    }

    freeState () {
        if (this.isFollowWayPointsMove) {
            this.PathsFollowing();
        } else {
            NavSystem.randomPaths(this._wayPoints, this._actor!.node.worldPosition, randomRangeInt(5, 10), -1);
            this.isFollowWayPointsMove = true;
            this.currentWaypointsIndex = 0;
        }
    }

    onFleeState () {

        if (this.brainState == BrainState.flee) return;

        this.input?.onAim(false);
        this.isFollowWayPointsMove = false;
        this._actionUpdate = this.fleeState;
        this.waypointsFireIndex = -1;
        this.brainState = BrainState.flee;
    }

    fleeState () {
        // calculate flee.
        if (this.isFollowWayPointsMove) {
            this.PathsFollowing();
        } else {
            // calculate target.
            NavSystem.findPaths(this._wayPoints, this._actor!.node.worldPosition, this.closestNavigationPoint, Level.Instance._player!.node.worldPosition);
            this.isFollowWayPointsMove = true;
            this.currentWaypointsIndex = 0;
        }

    }

    onPursuitState () {

        if (this.brainState == BrainState.pursuit) return;

        //console.log('pursuit state.');
        this.input?.onAim(false);
        this.isFollowWayPointsMove = false;
        this._actionUpdate = this.pursuitState;
        this.waypointsFireIndex = -1;
        this.hateTime = this._actor!._data.ai_hate_clear_time;
        this.brainState = BrainState.pursuit;
        this.pursuitIndex = 0;
    }

    pursuitState () {

        if (this.isFollowWayPointsMove) {
            this.PathsFollowing();
        } else {
            if (this.pursuitIndex >= this.pursuitTimes) {
                this.brainState = BrainState.none;
                return;
            }
            // calculate target.
            NavSystem.findPaths(this._wayPoints, this._actor!.node.worldPosition, this.closestNavigationPoint, Level.Instance._player!.node.worldPosition);
            if (!this._wayPoints || this._wayPoints.length <= 0) {
                console.warn('can not find way paths.');
                return;
            }
            this.isFollowWayPointsMove = true;
            this.currentWaypointsIndex = 0;
            this.pursuitIndex++;
        }

    }

    PathsFollowing () {

        this._actor!._actorMove!.faceMove = true;

        const worldPosition = this._actor!.node.worldPosition;
        UtilVec3.copy(tempDistance, worldPosition);

        const target = this._wayPoints[this.currentWaypointsIndex];

        //UtilVec3.copy(this.targetPosition, target);
        this.targetPosition.x = target.x;
        this.targetPosition.y = target.y;
        this.targetPosition.z = target.z;

        tempDistance.y = target.y;

        this.targetPos?.setWorldPosition(target.x, target.y, target.z);

        // Calculate target distance.
        const target_distance = 0.1;

        // Detect distance to target point.
        if (Vec3.distance(tempDistance, this.targetPosition) <= target_distance) {

            // Arrive current node.
            this.currentWaypointsIndex += this.followPathsDirection;

            if (this.currentWaypointsIndex >= this._wayPoints.length || this.currentWaypointsIndex < 0) this.isFollowWayPointsMove = false;
            else {
                this.closestNavigationPoint = this._wayPoints[this.currentWaypointsIndex].id;

                const target = this._wayPoints[this.currentWaypointsIndex];

                //UtilVec3.copy(this.targetPosition, target);
                this.targetPosition.x = target.x;
                this.targetPosition.y = target.y;
                this.targetPosition.z = target.z;

                this.targetPos?.setWorldPosition(target.x, target.y, target.z);
            }

        } else {

            /*
            // Detects if there is a character ahead.
            if (this.sensorRays?.checkedNode) {
                //this.followPathsDirection = -1;

                //Calculate checked node direction.
                UtilVec3.copy(this.targetDirection, this.sensorRays.checkedNode.worldPosition);
                this.targetDirection.y = this.node.worldPosition.y;

                let checkDirection = this.targetDirection.clone();
                checkDirection.subtract(this.node.worldPosition);

                //Calculate checked node side.
                const side = -this.targetDirection.clone().cross(this.node.forward).y

                //Calculate normal vector.
                let normal = checkDirection.clone();
                normal.cross(side > 0 ? v3(0, -1, 0) : v3(0, 1, 0));

                //Calculate new target direction.
                this.targetDirection.add(normal);

            } else {

                // Calculate move direction.
                UtilVec3.copy(this.targetDirection, this.targetPosition);

                //this.followPathsDirection = 1;
            }
            */

            UtilVec3.copy(this.targetDirection, this.targetPosition);

            /*
            if (this._actor!._actorMove!.deltaMove <= 0.1) {
                this.isFollowWayPointsMove = false;
                this.targetDirection.z *= -1;
            }
            */

            //this.targetDirection.y = worldPosition.y;
            this.targetDirection.subtract(worldPosition).normalize();

            // Set target move.
            this._moveDir.x = this.targetDirection.x;
            this._moveDir.y = this.targetDirection.y;
            this._moveDir.z = this.targetDirection.z;

            // Calculates the rotation angle of the target.
            this.lookAtTarget(this._moveDir);

            this._moveDir.x = 0;
            this._moveDir.y = 0;
            this._moveDir.z = 1;

            // 
            this.onMove();

            const data = this._actor._data;
            if (data.is_ghost) {
                if ((game.totalTime - this.ghostTime) / 1000 > this.nextGhostTime) {
                    this.input.onMoveToPoint(this.targetPosition);
                    this.nextGhostTime = randomRange(data.ghost_min_time, data.ghost_max_time);
                    this.ghostTime = game.totalTime;
                }
            }

            // Random Jump.
            //if (random() < 0.05) this.onJump();
        }
    }

    onFireState () {

        if (this.brainState === BrainState.fire) return;

        //console.log('fire state');

        this._actionUpdate = this.fireState;
        this.brainState = BrainState.fire;
    }

    fireState () {

        // Check shoot angle.
        const player = Level.Instance._player;
        const forward = this._actor?.node.forward!;//this._actor?._forwardNode!.forward!;
        UtilVec3.copy(this.fireDirection, player.node!.worldPosition);
        this.fireDirection.subtract(this._actor!.node.worldPosition);
        const angle = math.toDegree(Vec3.angle(forward, this.fireDirection));

        // Fire move.
        this.followPathFire(angle);

        // Wait reload weapon.
        if (this.reloadTime > 0) {
            this.reloadTime -= game.deltaTime;
            return;
        }

        // Check bullet empty.
        if (this._actor?._actorEquipment?.currentEquip?.isBulletEmpty) {
            // Reload Bullet.
            this.input?.onReload();
            this.reloadTime = 3;
            return;
        }

        this.input?.onAim(true);

        // Brain wait fire logic.
        this.fireWaitTime -= game.deltaTime;
        if (this.fireWaitTime > 0) return;
        const weaponData = this._actor?._actorEquipment?.currentEquip?._data!;
        this.fireWaitTime = randomRange(weaponData.ai_fire_wait_time_min, weaponData.ai_fire_wait_time_max);

        this.onFire();

    }

    followPathFire (angle: number) {

        this._actor!._actorMove!.faceMove = false;

        if (this.waypointsFireIndex === -1) {
            this.closestNavigationPoint = NavSystem.findNearest(this._actor!.node.worldPosition);
            NavSystem.randomFirePath(this.waypointsFire, this.closestNavigationPoint);
            this.waypointsFireIndex = 0;
        }

        const worldPosition = this._actor!.node.worldPosition;
        let target = this.waypointsFire![this.waypointsFireIndex];

        UtilVec3.copy(tempDistance, worldPosition);
        UtilVec3.copy(this.targetPosition, target);

        tempDistance.y = target.y;

        const targetDistance = Vec3.distance(tempDistance, this.targetPosition);

        if (targetDistance <= 0.5) {

            // Next way
            this.waypointsFireIndex++;

            if (this.waypointsFireIndex >= this.waypointsFire!.length) {

                this.closestNavigationPoint = NavSystem.findNearest(this._actor!.node.worldPosition);
                NavSystem.randomFirePath(this.waypointsFire, this.closestNavigationPoint);
                this.waypointsFireIndex = 0;
                target = this.waypointsFire![this.waypointsFireIndex];
            }
        }

        // Calculate move direction.
        UtilVec3.copy(this.targetDirection, this.targetPosition);

        this.targetPos?.setWorldPosition(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);
        this.targetDirection.y = worldPosition.y;
        this.targetDirection.subtract(worldPosition).normalize();

        this._moveDir.x = -this.targetDirection.x;
        this._moveDir.y = 0;
        this._moveDir.z = -this.targetDirection.z;

        // Look at direction.
        const player = Level.Instance._player;
        UtilVec3.copy(this.targetDirection, player.node.worldPosition);
        this.targetDirection.subtract(this.node.worldPosition).normalize();

        // Calculate angle.
        UtilVec3.copy(tempAngle, player.node.worldPosition);
        tempAngle.subtract(this.node.worldPosition);
        const angleHead = math.toDegree(Vec3.angle(tempAngle, this.node.forward));
        const side = player.node.worldPosition.y < this.node.worldPosition.y ? -1 : 1;
        this.targetDirection.y = angleHead * side;
        //this.targetDirection.y = angleHead; //player._data.is_crouch ? 0.3 : 1;
        //console.log('angle head:', angleHead);
        //this.lookAtTarget(this.targetDirection);
        this.onMove();

        const data = this._actor._data;
        if (data.is_ghost) {
            if ((game.totalTime - this.ghostTime) / 1000 > this.nextGhostTime) {
                this.input.onMoveToPoint(this.targetPosition);
                this.nextGhostTime = randomRange(data.ghost_min_time, data.ghost_max_time);
                this.ghostTime = game.totalTime;
            }
        }

        //if (random() < 0.1) this.onJump();

    }

    /**
     * Look at target action.
     * @param lookAtDirection 
     */
    lookAtTarget (lookAtDirection: Vec3) {

        UtilVec3.copy(this.targetDirection, lookAtDirection);

        /*
        UtilVec3.copy(tempRotationSideVector, lookAtDirection);
        const angle = math.toDegree(Math.abs(Vec3.angle(lookAtDirection, this.node.forward)));
        const side = Math.sign(-tempRotationSideVector.cross(this.node.forward).y);
        this.targetDirection.x = side * angle;
        this.targetDirection.z = 0;
        */

    }

}

enum BrainState {

    none,
    free,
    flee,
    pursuit,
    fire,

}