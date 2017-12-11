'use strict';

const assert        = require('assert');
const debug         = require('debug')('async-stream-reader');
const stream        = require('stream');
const EventEmitter  = require('events');


const DATA  = Symbol('READER DATA');
const END   = Symbol('READER END');
const ERROR = Symbol('READER ERROR');

class Reader {

    static get ERROR() { return ERROR; }
    static get END() { return END; }

    constructor(readable, options = {}) {
        debug('construct');
        assert(readable instanceof stream.Readable || readable instanceof EventEmitter,
            'Only support stream.Readable or EventEmitter');
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

    pause() {
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
    }

    resume() {
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
    }

    async _emitted() {
        return new Promise(resolve => this._emitter.once('any', resolve));
    }

    async nextEvent() {
        debug('next event');
        if (this.eventHolder.length > 0) {
            this.pause();
            return this.eventHolder.shift();
        }
        this.resume();
        await this._emitted();
        return await this.nextEvent();
    }

    async next() {
        const { args, type } = await this.nextEvent();
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
