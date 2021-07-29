export default interface WakeLock {
    readonly enabled: boolean;
    enable(timeout?: Number): Promise<void>;
    disable(timeout?: Number): Promise<void>;
    destroy(): void;
}