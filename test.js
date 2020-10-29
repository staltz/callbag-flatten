const test = require('tape');
const map = require('callbag-map');
const never = require('callbag-never');
const flatten = require('.');

test('it flattens a two-layer async infinite listenable sources', t => {
  t.plan(23);

  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [2, 'undefined']
  ];
  const downwardsExpected = ['a1', 'a2', 'b1', 'b2', 'b3', 'b4'];

  function sourceOuter(type, data) {
    if (type === 0) {
      const sink = data;
      setTimeout(() => { sink(1, 'a'); }, 230);
      setTimeout(() => { sink(1, 'b'); }, 460);
      setTimeout(() => { sink(2); }, 690);
      sink(0, sourceOuter);
    }
  }

  function sourceInner(type, data) {
    if (type === 0) {
      const sink = data;
      let i = 0;
      const id = setInterval(() => {
        i++;
        sink(1, i);
        if (i === 4) {
          clearInterval(id);
          sink(2);
        }
      }, 100);
      sink(0, (t, d) => {
        if (t === 2) clearInterval(id);
      });
    }
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + JSON.stringify(e));
    }
  };

  const source = flatten(
    map(str =>
      map(num => str + num)(sourceInner)
    )(sourceOuter)
  );
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 1200);
});

test('it flattens a two-layer finite pullable sources', t => {
  t.plan(45);

  const upwardsExpectedOuter = [1,1,1];
  const upwardsExpectedInner = [1,1,1,1,1,1,1,1];

  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [2, 'undefined'],
  ];
  const downwardsExpected = ['a10','a20','a30','b10','b20','b30'];

  let outerSent = 0;
  let outerSink;
  function outerSource(type, data) {
    if (type === 0) {
      outerSink = data;
      data(0, outerSource);
      return;
    }
    t.true(upwardsExpectedOuter.length > 0, 'outer source should be pulled');
    const e = upwardsExpectedOuter.shift();
    t.equals(type, e, 'outer upwards type is expected: ' + e);
    if (outerSent === 0) {
      outerSent++;
      outerSink(1, 'a');
      return;
    }
    if (outerSent === 1) {
      outerSent++;
      outerSink(1, 'b');
      return;
    }
    if (outerSent === 2) {
      outerSink(2);
      return;
    }
  };

  function makeInnerSource() {
    let innerSent = 0;
    let innerSink;
    return function innerSource(type, data) {
      if (type === 0) {
        innerSink = data;
        innerSink(0, innerSource);
        return;
      }
      t.true(upwardsExpectedInner.length > 0, 'inner source should be pulled');
      const e = upwardsExpectedInner.shift();
      t.equals(type, e, 'inner upwards type is expected: ' + e);
      if (innerSent === 0) {
        innerSent++;
        innerSink(1, 10);
        return;
      }
      if (innerSent === 1) {
        innerSent++;
        innerSink(1, 20);
        return;
      }
      if (innerSent === 2) {
        innerSent++;
        innerSink(1, 30);
        return;
      }
      if (innerSent === 3) {
        innerSink(2);
        return;
      }
    };
  }

  let talkback;
  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 0) {
      talkback = data;
      talkback(1);
      return;
    }
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + JSON.stringify(e));
      talkback(1);
    }
  }

  const source = flatten(
    map(str =>
      map(num => str + num)(makeInnerSource())
    )(outerSource)
  );
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 200);
});

test('it should not treat falsy values as errors', t => {
  t.plan(23);

  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [2, 'undefined']
  ];
  const downwardsExpected = ['a1', 'a2', 'b1', 'b2', 'b3', 'b4'];

  function sourceOuter(type, data) {
    if (type === 0) {
      const sink = data;
      setTimeout(() => { sink(1, 'a'); }, 230);
      setTimeout(() => { sink(1, 'b'); }, 460);
      setTimeout(() => { sink(2, null); }, 690);
      sink(0, sourceOuter);
    }
  }

  function sourceInner(type, data) {
    if (type === 0) {
      const sink = data;
      let i = 0;
      const id = setInterval(() => {
        i++;
        sink(1, i);
        if (i === 4) {
          clearInterval(id);
          sink(2);
        }
      }, 100);
      sink(0, (t, d) => {
        if (t === 2) clearInterval(id);
      });
    }
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + JSON.stringify(e));
    }
  };

  const source = flatten(
    map(str =>
      map(num => str + num)(sourceInner)
    )(sourceOuter)
  );
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 1200);
});

test('it errors sink & unsubscribe from inner when outer throws', t => {
  t.plan(21);

  const innerExpectedType = [
    [0, 'function'],
    [0, 'function'],
    [2, 'undefined'],
  ];
  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [2, 'number']
  ];
  const downwardsExpected = ['a1', 'a2', 'b1', 'b2'];

  function sourceOuter(type, data) {
    if (type === 0) {
      const sink = data;
      setTimeout(() => { sink(1, 'a'); }, 230);
      setTimeout(() => { sink(1, 'b'); }, 460);
      setTimeout(() => { sink(2, 42); }, 690);
      sink(0, sourceOuter);
    }
  }

  function sourceInner(type, data) {
    const et = innerExpectedType.shift();
    t.equals(type, et[0], 'inner type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'inner data type is expected: ' + et[1]);

    if (type === 0) {
      const sink = data;
      let i = 0;
      const id = setInterval(() => {
        i++;
        sink(1, i);
        if (i === 4) {
          clearInterval(id);
          sink(2);
        }
      }, 100);
      sink(0, (t, d) => {
        if (t === 2) clearInterval(id);
      });
    }
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + JSON.stringify(e));
    }
  };

  const source = flatten(
    map(str =>
      map(num => str + num)(sourceInner)
    )(sourceOuter)
  );
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 1200);
});

test('it errors sink & unsubscribe from outer when inner throws', t => {
  t.plan(27);

  const outerExpectedType = [
    [0, 'function'],
    [2, 'undefined'],
  ];
  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [1, 'string'],
    [2, 'number']
  ];
  const downwardsExpected = ['a1', 'a2', 'b1', 'b2', 'b3', 'b4'];

  function sourceOuter(type, data) {
    const et = outerExpectedType.shift();
    t.equals(type, et[0], 'outer type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'outer data type is expected: ' + et[1]);

    if (type === 0) {
      const sink = data;
      setTimeout(() => { sink(1, 'a'); }, 230);
      setTimeout(() => { sink(1, 'b'); }, 460);
      sink(0, sourceOuter);
    }
  }

  function sourceInner(type, data) {
    if (type === 0) {
      const sink = data;
      let i = 0;
      const id = setInterval(() => {
        i++;
        sink(1, i);
        if (i === 4) {
          clearInterval(id);
          sink(2, 42);
        }
      }, 100);
      sink(0, (t, d) => {
        if (t === 2) clearInterval(id);
      });
    }
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + JSON.stringify(e));
    }
  };

  const source = flatten(
    map(str =>
      map(num => str + num)(sourceInner)
    )(sourceOuter)
  );
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 1200);
});

test('it should not try to unsubscribe from completed source when waiting for inner completion', t => {
  t.plan(5);

  const outerExpectedType = [
    [0, 'function'],
  ];
  const downwardsExpectedType = [
    [0, 'function'],
  ];

  function sourceOuter(type, data) {
    const et = outerExpectedType.shift();
    t.equals(type, et[0], 'outer type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'outer data type is expected: ' + et[1]);

    if (type === 0) {
      const sink = data;
      sink(0, sourceOuter);
      sink(1, true);
      sink(2);
    }
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 0) {
      const talkback = data;
      setTimeout(() => talkback(2), 0);
    }
  };

  const source = flatten(map(() => never)(sourceOuter));
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 100);
});

test('it should not try to unsubscribe from completed source when for inner errors', t => {
  t.plan(7);

  const outerExpectedType = [
    [0, 'function'],
  ];
  const downwardsExpectedType = [
    [0, 'function'],
    [2, 'boolean'],
  ];

  function sourceOuter(type, data) {
    const et = outerExpectedType.shift();
    t.equals(type, et[0], 'outer type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'outer data type is expected: ' + et[1]);

    if (type === 0) {
      const sink = data;
      sink(0, sourceOuter);
      sink(1, true);
      sink(2);
    }
  }

  function sourceInner(type, data) {
    if (type === 0) {
      const sink = data;
      sink(0, sourceInner);
      setTimeout(() => sink(2, true), 0);
    }
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
  };

  const source = flatten(map(() => sourceInner)(sourceOuter));
  source(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 100);
});
