interface Config {
    container: HTMLElement;
    keyboard: [number, number];
    errorDuration: number;
    onResult: (result: number[]) => void | null;
    onChange: (result: number[]) => void | null;
}
declare class Lock {
    private _container;
    private _errorDuration;
    private _errorTimer;
    private _keyboard;
    private _config;
    private _onResult;
    private _onChange;
    private _resultCoordinates;
    private _numberMap;
    private _bodyOldOverflow;
    private _width;
    private _height;
    private _radius;
    private _bgCanvas;
    private _interactionCanvas;
    private _bgCtx;
    private _interactionCtx;
    constructor(config: Config);
    _drawBg(): void;
    _calculateRelativeCoordinate(clientX: number, clientY: number): {
        relativeX: number;
        relativeY: number;
    };
    _clearInteraction(): void;
    _drawInteraction(clientX: number, clientY: number, color?: string): void;
    _calculateResult(relativeX: number, relativeY: number): void;
    _drawInteractionNotLastLine(color?: string): void;
    _drawInteractionCircle(fillStyle?: string): void;
    _drawInteractionConnectingLine(strokeStyle?: string): void;
    _drawInteractionLastLine(relativeX: number, relativeY: number): void;
    _feedback(): void;
    _bindEvent(): void;
    _touchmove(e: TouchEvent): void;
    loading(text?: string): void;
    error(): void;
    success(): void;
}
export default Lock;
