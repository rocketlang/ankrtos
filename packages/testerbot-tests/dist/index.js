"use strict";
/**
 * @ankr/testerbot-tests
 * Test registry and test suites for TesterBot
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ankrshieldVisualTests = exports.ankrshieldMobileSmokeTests = exports.ankrshieldWebSmokeTests = exports.ankrshieldSmokeTests = void 0;
__exportStar(require("./ankrshield/smoke-tests"), exports);
__exportStar(require("./ankrshield/web-smoke-tests"), exports);
__exportStar(require("./ankrshield/mobile-smoke-tests"), exports);
__exportStar(require("./ankrshield/visual-tests"), exports);
var smoke_tests_1 = require("./ankrshield/smoke-tests");
Object.defineProperty(exports, "ankrshieldSmokeTests", { enumerable: true, get: function () { return smoke_tests_1.ankrshieldSmokeTests; } });
var web_smoke_tests_1 = require("./ankrshield/web-smoke-tests");
Object.defineProperty(exports, "ankrshieldWebSmokeTests", { enumerable: true, get: function () { return web_smoke_tests_1.ankrshieldWebSmokeTests; } });
var mobile_smoke_tests_1 = require("./ankrshield/mobile-smoke-tests");
Object.defineProperty(exports, "ankrshieldMobileSmokeTests", { enumerable: true, get: function () { return mobile_smoke_tests_1.ankrshieldMobileSmokeTests; } });
var visual_tests_1 = require("./ankrshield/visual-tests");
Object.defineProperty(exports, "ankrshieldVisualTests", { enumerable: true, get: function () { return visual_tests_1.ankrshieldVisualTests; } });
//# sourceMappingURL=index.js.map