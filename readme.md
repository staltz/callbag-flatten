# callbag-flatten

Callbag operator that flattens a higher-order callbag source. Like RxJS "switch" or xstream "flatten". Use it with `map` to get behavior equivalent to "switchMap". Works on either pullable or listenable sources.

`npm install callbag-flatten`

## examples

### listenables

On each mouse click, start a stopwatch ticking every second:

```js
const fromEvent = require('callbag-from-event');
const interval = require('callbag-interval');
const flatten = require('callbag-flatten');
const observe = require('callbag-observe');
const pipe = require('callbag-pipe');
const map = require('callbag-map');

const source = pipe(
  fromEvent(document, 'click'),
  map(() => interval(1000)),
  flatten,
  observe(x => console.log(x))
);
```

### pullables

Loop over two iterables (such as arrays) and combine their values together:

```js
const fromIter = require('callbag-from-iter');
const iterate = require('callbag-iterate');
const flatten = require('callbag-flatten');
const pipe = require('callbag-pipe');
const map = require('callbag-map');

const source = pipe(
  fromIter('hi'),
  map(char => pipe(
    fromIter([10, 20, 30]),
    map(num => char + num)
  )),
  flatten,
  iterate(x => console.log(x))
);

// h10
// h20
// h30
// i10
// i20
// i30
```
