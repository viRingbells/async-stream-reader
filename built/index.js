'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var assert = require('assert');
var debug = require('debug')('async-stream-reader');
var stream = require('stream');
var EventEmitter = require('events');
var DATA = Symbol('READER DATA');
var END = Symbol('READER END');
var ERROR = Symbol('READER ERROR');
var Reader = /** @class */ (function () {
    function Reader(readable, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        debug('construct');
        assert(readable instanceof stream.Readable || readable instanceof EventEmitter, 'Only support stream.Readable or EventEmitter');
        this.readable = readable;
        this.eventHolder = [];
        this._pause = options.pause || 'pause';
        this._resume = options.resume || 'resume';
        this._isPaused = options.isPaused || 'isPaused';
        this._endArgument = options.end || undefined;
        this._emitter = new EventEmitter();
        var events = options.events || {};
        var dataEvents = events.data || 'data';
        var endEvents = events.end || 'end';
        var errorEvents = events.error || 'error';
        dataEvents = Array.isArray(dataEvents) ? dataEvents : [dataEvents];
        endEvents = Array.isArray(endEvents) ? endEvents : [endEvents];
        errorEvents = Array.isArray(errorEvents) ? errorEvents : [errorEvents];
        this.pause();
        var _loop_1 = function (name_1) {
            this_1.readable.on(name_1, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this._emitter.emit('any', { name: name_1, args: args });
            });
        };
        var this_1 = this;
        for (var _i = 0, _a = dataEvents.concat(endEvents, errorEvents); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            _loop_1(name_1);
        }
        for (var _b = 0, dataEvents_1 = dataEvents; _b < dataEvents_1.length; _b++) {
            var name_2 = dataEvents_1[_b];
            this.readable.on(name_2, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.eventHolder.push({ type: DATA, args: args });
            });
        }
        for (var _c = 0, endEvents_1 = endEvents; _c < endEvents_1.length; _c++) {
            var name_3 = endEvents_1[_c];
            this.readable.on(name_3, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.eventHolder.push({ type: END, args: args });
            });
        }
        for (var _d = 0, errorEvents_1 = errorEvents; _d < errorEvents_1.length; _d++) {
            var name_4 = errorEvents_1[_d];
            this.readable.on(name_4, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.eventHolder.push({ type: ERROR, args: args });
            });
        }
    }
    Object.defineProperty(Reader, "ERROR", {
        get: function () { return ERROR; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Reader, "END", {
        get: function () { return END; },
        enumerable: true,
        configurable: true
    });
    Reader.prototype.pause = function () {
        if (this._isPaused && this.readable[this._isPaused] instanceof Function &&
            this.readable[this._isPaused]()) {
            return this;
        }
        if (!(this.readable[this._pause] instanceof Function)) {
            return this;
        }
        debug('pause');
        this.readable[this._pause]();
        return this;
    };
    Reader.prototype.resume = function () {
        if (this._isPaused && this.readable[this._isPaused] instanceof Function &&
            !this.readable[this._isPaused]()) {
            return this;
        }
        if (!(this.readable[this._resume] instanceof Function)) {
            return this;
        }
        debug('resume');
        this.readable[this._resume]();
        return this;
    };
    Reader.prototype._emitted = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return _this._emitter.once('any', resolve); })];
            });
        });
    };
    Reader.prototype.nextEvent = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debug('next event');
                        if (this.eventHolder.length > 0) {
                            this.pause();
                            return [2 /*return*/, this.eventHolder.shift()];
                        }
                        this.resume();
                        return [4 /*yield*/, this._emitted()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.nextEvent()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Reader.prototype.next = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, args, type, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.nextEvent()];
                    case 1:
                        _a = _b.sent(), args = _a.args, type = _a.type;
                        debug('next', args, type);
                        result = args[0];
                        if (type === Reader.ERROR) {
                            debug('error');
                            throw result;
                        }
                        if (type === Reader.END) {
                            debug('end');
                            return [2 /*return*/, this._endArgument];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return Reader;
}());
module.exports = Reader;
