# babel-plugin-transform-modules-amd-deferred

> A plugin to work around circular dependencies by deferring the import of selected amd modules

Consider the following code:

```js
// a.js
import B from "b";
export default class A {
    foo() { console.log(B); }
}

// b.js
import A from "a";
export default class B extends A {}

// main.js
import A from "a";
new A().foo();
```

This transforms to (boilerplate redacted):

```js
// a.js
define("a", ["exports", "b"], function (_exports, _b) {
  var A =
  function () {
    function A() {
      _classCallCheck(this, A);
    }

    _createClass(A, [{
      key: "foo",
      value: function foo() {
        console.log(this, _b.default);
      }
    }]);

    return A;
  }();

  _exports.default = A;
});

// b.js
define("b", ["exports", "a"], function (_exports, _a) {
  var B =
  function (_A) {
    _inherits(B, _A);

    function B() {
      _classCallCheck(this, B);

      return _possibleConstructorReturn(this, _getPrototypeOf(B).apply(this, arguments));
    }

    return B;
  }(_a.default);

  _exports.default = B;
});

// main.js
define("main", ["a"], function (_a) {
  new _a.default().foo();
}
```

When `main.js` is executed, it will throw `Uncaught TypeError: Super expression must either be null or a function` due to the circular dependency in `a.js` and `b.js`.

This can be worked around by using this plugin and changing the code in `a.js` to:

```js
import B from "b"; // @deferred
export default class A {
    foo() { console.log(B); }
}
```

Now `a.js` transforms to (boilerplate redacted):

```js
define("a", ["exports"], function (_exports) {
  var B;

  require(["b"], function (_) {
    B = _.default;
  }); // @deferred

  var A =
  function () {
    function A() {
      _classCallCheck(this, A);
    }

    _createClass(A, [{
      key: "foo",
      value: function foo() {
        console.log(this, B);
      }
    }]);

    return A;
  }();

  _exports.default = A;
});
```

Instead of requiring `b.js` in the outer call to `define`, it is now required later in a separate `require` call.

## Install

Using npm:

```sh
npm install --save-dev babel-plugin-transform-modules-amd-deferred
```

## Configure

```js
{
  "plugins": [
      ["@babel/plugin-transform-modules-amd"],
      ["babel-plugin-transform-modules-amd-deferred"] // Add this line.
  ]
}
```
