const flatten = source => (start, sink) => {
  if (start !== 0) return;
  let outerEnded = false;
  let outerTalkback;
  let innerTalkback;
  function talkback(t, d) {
    if (t === 1) (innerTalkback || outerTalkback)(1, d);
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
        else if (t === 2 && d) sink(2, d);
        else if (t === 2) {
          if (outerEnded) sink(2);
          else {
            innerTalkback = void 0;
            outerTalkback(1);
          }
        }
      });
    } else if (T === 2 && D) sink(2, D);
    else if (T === 2) {
      if (!innerTalkback) sink(2);
      else outerEnded = true;
    }
  });
};

export default flatten;
