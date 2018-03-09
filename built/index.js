'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const Debug = require("debug");
const Stream = require("stream");
const EventEmitter = require("events");
const debug = Debug('async-stream-reader');
const DATA = Symbol('READER DATA');
const END = Symbol('READER END');
const ERROR = Symbol('READER ERROR');
function isFunction(test) {
    return test && test instanceof Function;
}
class Reader {
    static get ERROR() {
        return ERROR;
    }
    static get END() {
        return END;
    }
    constructor(readable, options = {}) {
        debug('construct');
        assert(readable instanceof Stream.Readable || readable instanceof EventEmitter, 'Only support Stream.Readable or EventEmitter');
        this.readable = readable;
        this.eventHolder = [];
        this._pause = options.pause || 'pause';
        this._resume = options.resume || 'resume';
        this._isPaused = options.isPaused || 'isPaused';
        this._endArgument = options.end || undefined;
        this._emitter = new EventEmitter();
        const events = options.events || {};
        let dataEvents = events.data || 'data';
        let endEvents = events.end || 'end';
        let errorEvents = events.error || 'error';
        dataEvents = Array.isArray(dataEvents) ? dataEvents : [dataEvents];
        endEvents = Array.isArray(endEvents) ? endEvents : [endEvents];
        errorEvents = Array.isArray(errorEvents) ? errorEvents : [errorEvents];
        this.pause();
        for (const name of [...dataEvents, ...endEvents, ...errorEvents]) {
            this.readable.on(name, (...args) => this._emitter.emit('any', { name, args }));
        }
        for (const name of dataEvents) {
            this.readable.on(name, (...args) => this.eventHolder.push({ type: DATA, args }));
        }
        for (const name of endEvents) {
            this.readable.on(name, (...args) => this.eventHolder.push({ type: END, args }));
        }
        for (const name of errorEvents) {
            this.readable.on(name, (...args) => this.eventHolder.push({ type: ERROR, args }));
        }
    }
    isReadableMethod(methodName) {
        return isFunction(this.readable[methodName]);
    }
    callReadableMethod(methodName) {
        return this.readable[methodName]();
    }
    pause() {
        if (this._isPaused && this.isReadableMethod(this._isPaused) &&
            this.callReadableMethod(this._isPaused)) {
            return this;
        }
        if (this.isReadableMethod(this._pause)) {
            debug('pause');
            this.callReadableMethod(this._pause);
        }
        return this;
    }
    resume() {
        if (this._isPaused && this.isReadableMethod(this._isPaused) &&
            !this.callReadableMethod(this._isPaused)) {
            return this;
        }
        if (this.isReadableMethod(this._resume)) {
            debug('resume');
            this.callReadableMethod(this._resume);
        }
        return this;
    }
    _emitted() {
        return new Promise(resolve => this._emitter.once('any', resolve));
    }
    nextEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            debug('next event');
            if (this.eventHolder.length > 0) {
                this.pause();
                return this.eventHolder.shift();
            }
            this.resume();
            yield this._emitted();
            return yield this.nextEvent();
        });
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            const { args, type } = yield this.nextEvent();
            debug('next', args, type);
            const result = args[0];
            if (type === Reader.ERROR) {
                debug('error');
                throw result;
            }
            if (type === Reader.END) {
                debug('end');
                return this._endArgument;
            }
            return result;
        });
    }
}
module.exports = Reader;
