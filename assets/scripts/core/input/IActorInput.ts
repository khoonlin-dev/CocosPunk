import { Vec3 } from "cc"

export interface IActorInput {
    onMove (point: Vec3): void;
    onMoveToPoint (move: Vec3): void;
    onRotation (x: number, y: number): void;
    onDir (x: number, y: number, z: number): void;
    onJump (): void;
    onCrouch (): void;
    onAim (isAim: boolean | undefined): void;
    onFire (): void;
    onAutoFire (isAutoFire: boolean): void;
    onReload (): void;
    onPick (): void;
    onDrop (): void;
    onRun (isRun: boolean): void;
    onEquip (index: number): void;
    onPause (): void;
    onChangeEquips (): boolean;
}