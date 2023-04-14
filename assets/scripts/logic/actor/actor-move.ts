import { _decorator, Component, math, Node, RigidBody, v3, Vec3, CCFloat } from 'cc';
import { UtilVec3 } from '../../core/util/util';
import { SensorSlope } from '../../core/sensor/sensor-slope';
import { SensorGround } from '../../core/sensor/sensor-ground';
import { DataLevelInst } from '../data/data-core';
const { ccclass, property } = _decorator;

let tempRotationSideVector = v3(0, 0, 0);

@ccclass('ActorMove')
export class ActorMove extends Component {

    @property({ type: CCFloat, tooltip: 'Move Speed. ' })
    speed = 1;

    @property({ tooltip: 'Jump Force.' })
    jumpForce = v3(0, 6.0, 0);

    @property({ type: CCFloat, tooltip: 'Move smooth value.' })
    smoothMove = 5;

    @property({ type: CCFloat, tooltip: 'Default angle value' })
    angleVertical = 0;

    @property({ type: SensorSlope, tooltip: ' Sensor slope.' })
    sensorSlop: SensorSlope | undefined;

    @property({ type: SensorGround, tooltip: ' Sensor ground.' })
    sensorGround: SensorGround | undefined;

    velocity = v3(0, 0, 0);
    velocityLocal = v3(0, 0, 0);
    currentVelocity: Vec3 = v3(0, 0, 0);
    moveVec3 = new Vec3(0, 0, 0);

    currentSpeed = 0;
    speedY = 0;

    currentDirection = v3(0, 0, 0);
    direction = v3(0, 0, 0);
    angleHead = 0;

    rigid: RigidBody | undefined;

    @property
    angleVerticalMax = 30;

    @property
    angleVerticalMin = -30;

    @property
    faceMove = true;

    angle = 0;

    isJump = false;

    isStopMove = false;

    // Previous position.
    previousPosition = v3(0, 0, 0);

    deltaMove = 0;

    start () {

        this.sensorSlop = this.getComponent(SensorSlope)!;
        this.sensorGround = this.getComponent(SensorGround)!;

        this.node.setRotationFromEuler(0, 180, 0);
        this.onRotation(180, 0);
    }

    onEnable () {
        if (!this.rigid) this.rigid = this.getComponent(RigidBody)!;
        this.rigid?.setLinearVelocity(Vec3.ZERO);
    }

    lateUpdate (deltaTime: number) {

        if (DataLevelInst.stop || this.isStopMove) {
            this.stop();
            return;
        }

        this.movePosition(deltaTime);
        this.moveRotation();
        //this.directionRotation();
    }

    movePosition (deltaTime: number) {

        this.deltaMove = Vec3.distance(this.previousPosition, this.node.worldPosition);
        UtilVec3.copy(this.previousPosition, this.node.worldPosition);

        //Lerp velocity.
        Vec3.lerp(this.velocityLocal, this.velocityLocal, this.moveVec3, deltaTime * this.smoothMove);
        UtilVec3.copy(this.velocity, this.velocityLocal);

        //rotate y.
        if (this.faceMove)
            Vec3.rotateY(this.velocity, this.velocity, Vec3.ZERO, math.toRadian(this.node.eulerAngles.y));

        this.rigid?.getLinearVelocity(this.currentVelocity);
        this.speedY = this.currentVelocity.y;
        this.velocity.y = this.speedY;

        this.currentSpeed = Math.sqrt(this.currentVelocity.x * this.currentDirection.x + this.currentVelocity.z * this.currentVelocity.z);

        if (this.sensorGround?._isGround && this.sensorSlop!.checkSlope(this.velocity)) {
            const moveLength = this.velocity.length();
            UtilVec3.copy(this.velocity, this.sensorSlop!.vectorSlop);
            this.velocity.normalize().multiplyScalar(moveLength);
        } else {
            this.velocity.y = this.currentVelocity.y;
        }

        this.rigid?.setLinearVelocity(this.velocity);

    }

    moveToPoint (position: Vec3) {
        this.node.setWorldPosition(position);
    }

    moveRotation () {
        UtilVec3.copy(this.currentDirection, this.direction);
        this.angle = math.toDegree(Math.abs(Vec3.angle(this.currentDirection, this.node.forward)));
        if (this.angle > 0.001) {
            UtilVec3.copy(tempRotationSideVector, this.currentDirection);
            const side = Math.sign(-tempRotationSideVector.cross(this.node.forward).y);
            const angle = side * this.angle + this.node.eulerAngles.y;
            this.node.setRotationFromEuler(0, angle, 0);
        }
    }

    directionRotation () {
        UtilVec3.copy(this.currentDirection, this.direction);
        this.angle = math.toDegree(Math.abs(Vec3.angle(this.currentDirection, this.node.forward)));
        if (this.angle > 0.001) {
            UtilVec3.copy(tempRotationSideVector, this.currentDirection);
            const side = Math.sign(-tempRotationSideVector.cross(this.node.forward).y);
            const angle = side * this.angle + this.node.eulerAngles.y;
            //console.log('current angle:', this.node.eulerAngles.y, ' side:', side, ' angle:', angle);
            this.node.setRotationFromEuler(0, angle, 0);
        }
    }

    moveDirection (direction: Vec3) {
        UtilVec3.copy(this.moveVec3, direction);
        this.moveVec3.multiplyScalar(this.speed);
    }

    jump () {
        //this.rigid?.applyImpulse(this.jumpForce);
        this.rigid?.getLinearVelocity(this.currentVelocity);
        this.currentVelocity.y = this.jumpForce.y;
        this.rigid?.setLinearVelocity(this.currentVelocity);
    }

    onRotation (x: number, y: number) {
        this.angleHead += x;
        this.direction.z = -Math.cos(Math.PI / 180.0 * this.angleHead);
        this.direction.x = Math.sin(Math.PI / 180.0 * this.angleHead);
        this.angleVertical -= y;
        if (this.angleVertical >= this.angleVerticalMax)
            this.angleVertical = this.angleVerticalMax;

        if (this.angleVertical <= this.angleVerticalMin)
            this.angleVertical = this.angleVerticalMin;

        //this.directionRotation();
    }

    onDirection (x: number, y: number, z: number) {

        this.direction.x = x;
        this.direction.z = z;

        this.angleVertical = y;

        if (this.angleVertical >= this.angleVerticalMax)
            this.angleVertical = this.angleVerticalMax;

        if (this.angleVertical <= this.angleVerticalMin)
            this.angleVertical = this.angleVerticalMin;

        //this.directionRotation();

    }

    stop () {
        this.rigid!.getLinearVelocity(this.velocity);
        this.velocity.x = 0;
        this.velocity.z = 0;
        this.velocity.y = 0;
        this.rigid!.setLinearVelocity(this.velocity);
    }


}

