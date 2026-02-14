/**
 * Extended Tools for RocketLang
 *
 * New tools: explain, test, build, diff, undo, history
 *
 * @author ANKR Labs
 */
interface UndoAction {
    type: 'write' | 'delete' | 'create';
    path: string;
    previousContent?: string;
    timestamp: number;
    description: string;
}
export declare function pushUndoAction(action: UndoAction): void;
export declare function popUndoAction(): UndoAction | undefined;
export declare function registerExtendedTools(): void;
declare const _default: {
    registerExtendedTools: typeof registerExtendedTools;
    pushUndoAction: typeof pushUndoAction;
    popUndoAction: typeof popUndoAction;
};
export default _default;
//# sourceMappingURL=tools-extended.d.ts.map