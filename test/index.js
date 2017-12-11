'use itrict';

const fs            = require('fs');
const readline      = require('readline');
const EventEmitter  = require('events');
const LineByLine    = require('line-by-line');
const StreamReader  = require('async-stream-reader');


function generateReader(before, after) {
    const emitter = new EventEmitter();
    const intervals = [];
    const reader = new StreamReader(emitter);
    before(() => {
        intervals.push(setInterval(() => emitter.emit('data', 'NEW DATA ARRIVES'), 100));
    });
    after(() => intervals.forEach(interval => clearInterval(interval)));
    return { reader, emitter };
}


describe('read from events', () => {
    const { reader, emitter } = generateReader(before, after);
    before(() => setTimeout(() => emitter.emit('end'), 550));

    it('should read new data every 100ms', async () => {
        const records = [];
        let tried = 0;
        while (tried <= 10) {
            let message = await reader.next();
            if (!message) break;
            message.should.be.exactly('NEW DATA ARRIVES');
            records.push(Date.now());
        }
        tried.should.not.be.above(5);
        records.length.should.be.exactly(5);
        for (let i = 0; i < records.length - 2; i++) {
            Math.abs(records[i + 1] - records[i]).should.be.below(120).and.above(80);
        }
    });
});


describe('errors occurs', () => {
    const { reader, emitter } = generateReader(before, after);
    before(() => setTimeout(() => emitter.emit('error', new Error('FAKE ERROR FOR TEST')), 150));

    it('should throw the error', async () => {
        let message = await reader.next();
        message.should.be.exactly('NEW DATA ARRIVES');
        try {
            message = await reader.next();
        }
        catch (error) {
            message = error;
        }
        message.should.be.an.instanceOf(Error).with.property('message', 'FAKE ERROR FOR TEST');
    });
});


let tmpFileName = null;
function prepareLargeFile() {
    if (tmpFileName) {
        return tmpFileName;
    }
    tmpFileName = `/tmp/test-async-stream-reader-fake-file`;
    fs.writeFileSync(tmpFileName, '');
    for (let i = 0; i < 1000; i++) {
        let line = [i];
        for (let j = 0; j < 1024; j++){
            line.push((i + j) % 10);
        };
        line = line.join(',');
        fs.appendFileSync(tmpFileName, line + '\n');
    }
    process.on('exit', () => fs.unlinkSync(tmpFileName));
    return tmpFileName;
}


describe('fast input and slow consume[readline], may take several seconds...', () => {
    let reader;
    before(() => {
        const tmpFileName = prepareLargeFile();
        const rl = readline.createInterface({ input: fs.createReadStream(tmpFileName) });
        reader = new StreamReader(rl, { events: { data: 'line', end: 'close' }});
    });

    it('should read line one by one', async function () {
        this.timeout(20000);
        let index = 0;
        let line;
        let startTime = Date.now();
        while (line = await reader.next()) {
            line = line.split(',');
            Number.parseInt(line[0], 10).should.be.exactly(index++);
            await new Promise(resolve => setTimeout(resolve, 10));
        };
        (Date.now() - startTime).should.be.above(10000);
    });
});


describe('fast input and slow consume[line-by-line], may take several seconds...', () => {
    let reader;
    before(() => {
        const tmpFileName = prepareLargeFile();
        const lineByLineReader = new LineByLine(tmpFileName);
        reader = new StreamReader(lineByLineReader, { events: { data: 'line' }});
    });

    it('should read line one by one', async function () {
        this.timeout(20000);
        let index = 0;
        let line;
        let startTime = Date.now();
        while (line = await reader.next()) {
            line = line.split(',');
            Number.parseInt(line[0], 10).should.be.exactly(index++);
            await new Promise(resolve => setTimeout(resolve, 10));
        };
        (Date.now() - startTime).should.be.above(10000);
    });
});
