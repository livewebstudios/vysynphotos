/* Runs in <head>, not deferred. Marks JS as on, and arms the motion failsafe. */
document.documentElement.className = document.documentElement.className.replace('no-js', 'js');
setTimeout(function () { if (!window.__vsReady) document.documentElement.classList.add('motion-failed'); }, 3500);
