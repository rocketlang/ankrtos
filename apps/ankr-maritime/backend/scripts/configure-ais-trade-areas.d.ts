#!/usr/bin/env tsx
/**
 * AIS Trade Areas Configuration
 * Configures AISstream to track vessels in major global trade routes
 */
export interface TradeArea {
    name: string;
    description: string;
    boundingBox: [[number, number], [number, number]];
    priority: number;
}
export declare const MAJOR_TRADE_AREAS: TradeArea[];
export declare const AIS_PRESETS: {
    global: {
        name: string;
        boundingBoxes: number[][][];
    };
    major_hubs: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    high_priority: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    all_areas: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    asia_pacific: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    middle_east: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    europe: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    americas: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
    user_specified: {
        name: string;
        boundingBoxes: [[number, number], [number, number]][];
    };
};
export declare function printAreaConfig(preset: keyof typeof AIS_PRESETS): void;
//# sourceMappingURL=configure-ais-trade-areas.d.ts.map