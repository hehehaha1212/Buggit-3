(() => {
  const junk = Math.random().toString(36).slice(2);
  const base = {};
  Object.defineProperty(base, atob('aXNFbGlnaWJsZQ=='), {
    value: false,
    writable: true,
    enumerable: false
  });

  const role = Object.create(base);
  const user = Object.create(role);

  // expose in a non-obvious way
  Object.defineProperty(window, 'currentUser', {
    get() {
      return user;
    },
    configurable: false
  });

  let sent = false;

  function beacon() {
    if (sent) return;
    sent = true;

    fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
  }

  // deliberately ugly + indirect
  function audit() {
    try {
      const p1 = Object.getPrototypeOf(user);
      const p2 = Object.getPrototypeOf(p1);

      const key = Object.getOwnPropertyNames(p2).find(
        k => k.length === 10 && k.startsWith('is')
      );


      if (
        user[key] === true &&
        Object.prototype.hasOwnProperty.call(p2, key)
      ) {
        beacon();
      }
    } catch (_) {}
  }
  setInterval(audit, 300 + Math.floor(Math.random() * 400));
})();

