# async-stream-reader

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

An async way to read stream

## Why

Sometime you may want to read something from a stream, typically a file stream, in an async-await style. This tool may help you by providing an async read method for streams.

The `async-stream-reader` holds events and returns them one by one every time `async StreamReader#next` get called. If `async-stream-reader` has got some events in the holder, it will try to pause the input stream, and resume it if the holder get empty.

So as long as the input stream supports `pause` and `resume`, you can just do your work at each frame of data at ease, without worring missing something, or memory consumed in large quantities

## Usage

```
const fs            = require('fs');
const readline      = require('readline');
const StreamReader  = require('async-stream-reader');

const rl = readline.createInterface({
    input: fs.createReadStream("./foo.txt");
});
const reader = new StreamReader(rl, {
    events: { data: 'line', end: 'close' },
});

async function main() {
    let line;
    while (StreamReader.END !== (line = await reader.next())) {
        console.log(line);
    }
}

main().catch(error => console.log(error));
```

## API docs

### StreamReader#constructor(readableStream, options)

* readableStream: The stream you want to read data from. In fact it can be either a readable stream or an event emitter. the reaableStream should have method 'on' to listen to the data/end/error events, and methods 'pause' / 'resume' / 'isPaused' to control the input flow (but input flow control methods are not required, though missing them may cause events stacking in a large amount). 
* options: 'options.puase', 'options.resume' and 'options.isPuased' should be strings and refers to the method names to control the input stream, defaults are 'pause', 'resume' and 'isPaused'. options.events is an object with properties 'data', 'end' and 'error', each of them refers to the name of the event the stream should emit. Event name can be a string or an array of strings.

### async StreaReader#next() throws Error

* Returns the payload on the next event. If stream ended, `undefined` or `options.end` will be returned.
* Caution! Payloads are stored in a queue as well as errors. That means if an error occurred, it won't be thrown until `reader.next()` get called and consumes the error on the head of the queue.

## Contributors

Thanks [@Divvito](https://github.com/chris-divvito) for rewriting this in typescript version.

[npm-image]: https://img.shields.io/npm/v/async-stream-reader.svg?style=flat-square
[npm-url]: https://npmjs.org/package/async-stream-reader
[travis-image]: https://img.shields.io/travis/viRingbells/async-stream-reader/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/viRingbells/async-stream-reader
[coveralls-image]: https://img.shields.io/codecov/c/github/viRingbells/async-stream-reader.svg?style=flat-square
[coveralls-url]: https://codecov.io/github/viRingbells/async-stream-reader?branch=master
