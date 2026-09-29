// Concurrency limiter for tests/run.js.
//
// Extracted so it can be tested: `run.js` executes the whole suite on load, so
// nothing can require it, and the piece most likely to break is the scheduling
// — a limiter that leaks a slot runs unbounded (an OOM), and one that fails to
// release deadlocks (a hung CI job with no output).
//
// It is a LIMITER, not a worker pool, and that distinction is load-bearing.
// Every file is submitted up front and gets its promise immediately, so the
// reporting loop can await them in alphabetical order and stream each file's
// output as it lands. A pool that resolved everything before printing would
// hold minutes of output, emit it in one burst, and print NOTHING at all if the
// job hung or was killed.
function makeLimiter(n) {
  const width = Math.max(1, n | 0);
  let active = 0;
  const waiting = [];
  const pump = () => {
    while (active < width && waiting.length) {
      active++;
      waiting.shift()();
    }
  };
  return (fn) => new Promise((resolve, reject) => {
    waiting.push(() => {
      let p;
      // A synchronous throw inside fn() must not leak the slot — without this
      // the counter never decrements and everything after it waits for ever.
      try {
        p = Promise.resolve(fn());
      } catch (err) {
        p = Promise.reject(err);
      }
      p.then(resolve, reject).finally(() => { active--; pump(); });
    });
    pump();
  });
}

module.exports = { makeLimiter };
