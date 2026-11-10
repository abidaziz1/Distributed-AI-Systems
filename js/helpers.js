/* Small helpers for the content files. They fail loudly, so a typo in a lesson breaks the lint instead of showing wrong lines. */
(function () {
  var LAB = (window.LAB = window.LAB || {});
  LAB.get = {
    /* the 1-based number of the first line that matches a pattern, so lessons never count lines by hand */
    at: function (code, re) {
      var l = code.split('\n');
      for (var i = 0; i < l.length; i++) if (re.test(l[i])) return i + 1;
      throw new Error('no line matches ' + re + ' in ' + code.slice(0, 60));
    },
    /* [first, last] line numbers: from the first line that matches `a` to the first line at or after it that matches `b` */
    span: function (code, a, b) {
      var s = LAB.get.at(code, a);
      if (!b) return [s, s];
      var l = code.split('\n');
      for (var i = s - 1; i < l.length; i++) if (b.test(l[i])) return [s, i + 1];
      throw new Error('no line matches ' + b + ' after line ' + s);
    }
  };
})();
