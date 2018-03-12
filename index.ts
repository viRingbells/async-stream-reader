'use strict';

import * as assert from 'assert';
import * as Debug from 'debug';
import * as Stream from 'stream';
import * as EventEmitter from 'events';

const debug = Debug('async-stream-reader');
const DATA = Symbol('READER DATA');
const END = Symbol('READER END');
const ERROR = Symbol('READER ERROR');

type Readable = Stream.Readable | EventEmitter;
type Options = {
    pause?: string,
    resume?: string,
    isPaused?: string,
    end?: string,
    events?: {
        data?: string | string[],
        end?: string | string[],
        error?: string | string[],
    }
}

type Event = {
    type: symbol,
    args: any[]
}

function isFunction(test: any): test is Function {
    return test && test instanceof Function;
}

class Reader {
    private readable: Readable;
    private eventHolder: Event[];
    private _pause: string;
    private _resume: string;
    private _isPaused: string;
    private _endArgument: any;
    private _emitter: EventEmitter;

    static get ERROR(): symbol {
        return ERROR;
    }

    static get END(): symbol {
        return END;
    }

    constructor(readable: Readable, options: Options = {}) {
        debug('construct');
        assert(readable instanceof Stream.Readable || readable instanceof EventEmitter,
            'Only support Stream.Readable or EventEmitter');
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
            this.readable.on(name, (...args: any[]) => this._emitter.emit('any', {name, args}));
        }
        for (const name of dataEvents) {
            this.readable.on(name, (...args: any[]) => this.eventHolder.push({type: DATA, args}));
        }
        for (const name of endEvents) {
            this.readable.on(name, (...args: any[]) => this.eventHolder.push({type: END, args}));
        }
        for (const name of errorEvents) {
            this.readable.on(name, (...args: any[]) => this.eventHolder.push({type: ERROR, args}));
        }
    }

    private isReadableMethod(methodName: string): boolean {
        return isFunction((this.readable as any)[methodName]);
    }

    private callReadableMethod<T = void>(methodName: string): T {
        return ((this.readable as any)[methodName] as () => T)();
    }

    pause(): Reader {
        if (this._isPaused && this.isReadableMethod(this._isPaused) &&
            this.callReadableMethod<boolean>(this._isPaused)) {
            return this;
        }

        if (this.isReadableMethod(this._pause)) {
            debug('pause');
            this.callReadableMethod(this._pause);
        }

        return this;
    }

    resume(): Reader {
        if (this._isPaused && this.isReadableMethod(this._isPaused) &&
            !this.callReadableMethod<boolean>(this._isPaused)) {
            return this;
        }

        if (this.isReadableMethod(this._resume)) {
            debug('resume');
            this.callReadableMethod(this._resume)
        }

        return this;
    }

    _emitted(): Promise<any> {
        return new Promise(resolve => this._emitter.once('any', resolve));
    }

    async nextEvent(): Promise<Event> {
        debug('next event');
        if (this.eventHolder.length > 0) {
            this.pause();
            return this.eventHolder.shift()!;
        }
        this.resume();
        await this._emitted();
        return this.nextEvent();
    }

    async next(): Promise<any> {
        const {args, type} = await this.nextEvent();
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
    }
}


module.exports = Reader;
