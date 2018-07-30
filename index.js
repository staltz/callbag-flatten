const flatten = source => (start, sink) => {
  if (start !== 0) return;
  const exists = x => typeof x !== 'undefined';
  const absent = x => typeof x === 'undefined';
  let outerEnded = false;
  let outerTalkback;
  let innerTalkback;
  function talkback(t,d) {
    if (t === 1) (innerTalkback || outerTalkback)(1,d);
    if (t === 2) {
      innerTalkback && innerTalkback(2);
      outerTalkback && outerTalkback(2);
    }
  }
  source(0, (T, D) => {
    if (T === 0) {
      outerTalkback = D;
      sink(0, talkback);
    } else if (T === 1) {
      const innerSource = D;
      if (innerTalkback) innerTalkback(2);
      innerSource(0, (t, d) => {
        if (t === 0) {
          innerTalkback = d;
          innerTalkback(1);
        } else if (t === 1) sink(1, d);
        else if (t === 2 && absent(d)) {
          if (outerEnded) sink(2);
          else {
            innerTalkback = void 0;
            outerTalkback(1);
          }
        }
        else if (t === 2 && exists(d)) sink(2, d);
      });
    } else if (T === 2 && absent(D)) {
      if (!innerTalkback) sink(2);
      else outerEnded = true;
    } else if (T === 2 && exists(D)) sink(2, D);
  });
};

module.exports = flatten;
