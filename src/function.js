
function _currier (fn, arity, isRightCurry, slicer, argsHolder) {
    return function () {
        var args = argsHolder.concat(slicer(arguments));

        if (args.length >= arity) {
            return fn.apply(this, isRightCurry ? args.reverse() : args);
        } else {
            return _currier(fn, arity, isRightCurry, slicer, args);
        }
    };
}

function _curry (fn, arity, isRightCurry, isAutoCurry) {
    var slicer = isAutoCurry ? slice : function (a) {
        return a.length ? [a[0]] : [];
    };

    if ((arity | 0) !== arity) {
        arity = fn.length;
    }

    return _currier(fn, arity, isRightCurry, slicer, []);
}

/**
 * Applies the passed function to the given argument list.
 * @example
 * _.apply(_.add, [3, 4]) // => 7
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {ArrayLike} args
 * @returns {*}
 */
function apply (fn, args) {
    return fn.apply(fn, slice(args));
}

/**
 * A curried version of {@link module:lamb.apply|apply}. Expects an array-like object to use as arguments
 * and builds a function waiting for the target of the application.
 * @example
 * var data = [3, 4];
 * var applyDataTo = _.applyArgs(data);
 *
 * applyDataTo(_.add) // => 7
 * applyDataTo(_.multiply) // => 12
 *
 * @memberof module:lamb
 * @category Function
 * @function
 * @param {ArrayLike} args
 * @returns {Function}
 */
var applyArgs = _curry(apply, 2, true);

/**
 * Builds a function that passes only the specified amount of arguments to the given function.
 * @example
 * var data = ["1-2", "13-5", "6-23"];
 * var getDashIndex = _.invoker("indexOf", "-");
 *
 * data.map(getDashIndex) // => [1, 2, -1]
 * data.map(_.aritize(getDashIndex, 1)) // = > [1, 2, 1]
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {Number} arity
 * @returns {Function}
 */
function aritize (fn, arity) {
    return function () {
        return apply(fn, slice(arguments, 0, arity));
    };
}

/**
 * Transforms the evaluation of the given function in the evaluation of a sequence of functions
 * expecting only one argument. Each function of the sequence is a partial application of the
 * original one, which will be applied when the specified (or derived) arity is consumed.<br/>
 * Currying will start from the leftmost argument: use {@link module:lamb.curryRight|curryRight}
 * for right currying.<br/>
 * See also {@link module:lamb.curryable|curryable}, {@link module:lamb.curryableRight|curryableRight}
 * and {@link module:lamb.partial|partial}.
 * @example
 * var multiplyBy = _.curry(_.multiply);
 * var multiplyBy10 = multiplyBy(10);
 *
 * multiplyBy10(5) // => 50
 * multiplyBy10()(5) // => 50
 * multiplyBy10()()(2) // => 20
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {?Number} [arity=fn.length]
 * @returns {Function}
 */
function curry (fn, arity) {
    return _curry(fn, arity, false);
}

/**
 * Same as {@link module:lamb.curry|curry}, but currying starts from the rightmost argument.
 * @example
 * var divideBy = _.curryRight(_.divide, 2);
 * var halve = divideBy(2);
 * halve(3) // => 1.5
 * halve(3, 7) // => 1.5
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {?Number} [arity=fn.length]
 * @returns {Function}
 */
function curryRight (fn, arity) {
    return _curry(fn, arity, true);
}

/**
 * Builds an auto-curried function. The resulting function can be called multiple times with
 * any number of arguments, and the original function will be applied only when the specified
 * (or derived) arity is consumed.<br/>
 * Currying will start from the leftmost argument: use {@link module:lamb.curryableRight|curryableRight}
 * for right currying.<br/>
 * Note that you can pass undefined values as arguments explicitly, if you are so inclined, but empty
 * calls doesn't consume the arity.<br/>
 * See also {@link module:lamb.curry|curry}, {@link module:lamb.curryRight|curryRight} and
 * {@link module:lamb.partial|partial}.
 * @example
 * var collectFourElements = _.curryable(_.list, 4);
 *
 * collectFourElements(2)(3)(4)(5) // => [2, 3, 4, 5]
 * collectFourElements(2)(3, 4)(5) // => [2, 3, 4, 5]
 * collectFourElements(2, 3, 4, 5) // => [2, 3, 4, 5]
 * collectFourElements()(2)()(3, 4, 5) // => [2, 3, 4, 5]
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {?Number} [arity=fn.length]
 * @returns {Function}
 */
function curryable (fn, arity) {
    return _curry(fn, arity, false, true);
}

/**
 * Same as {@link module:lamb.curryable|curryable}, but currying starts from the rightmost argument.
 * @example
 * var collectFourElements = _.curryableRight(_.list, 4);
 *
 * collectFourElements(2)(3)(4)(5) // => [5, 4, 3, 2]
 * collectFourElements(2)(3, 4)(5) // => [5, 4, 3, 2]
 * collectFourElements(2, 3, 4, 5) // => [5, 4, 3, 2]
 * collectFourElements()(2)()(3, 4, 5) // => [5, 4, 3, 2]
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {?Number} [arity=fn.length]
 * @returns {Function}
 */
function curryableRight (fn, arity) {
    return _curry(fn, arity, true, true);
}

/**
 * Returns a function that will execute the given function only if it stops being called for the specified timespan.<br/>
 * See also {@link module:lamb.throttle|throttle} for a different behaviour where the first call happens immediately.
 * @example <caption>A common use case of <code>debounce</code> in a browser environment</caption>
 * var updateLayout = function () {
 *     // some heavy DOM operations here
 * };
 *
 * window.addEventListener("resize", _.debounce(updateLayout, 200), false);
 *
 * // The resize event is fired repeteadly until the user stops resizing the
 * // window, while the `updateLayout` function is called only once: 200 ms
 * // after he stopped.
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {Number} timespan - Expressed in milliseconds
 * @returns {Function}
 */
function debounce (fn, timespan) {
    var timeoutID;

    return function () {
        var context = this;
        var args = arguments;
        var debounced = function () {
            timeoutID = null;
            fn.apply(context, args);
        };

        clearTimeout(timeoutID);
        timeoutID = setTimeout(debounced, timespan);
    };
}

/**
 * Returns a function that applies its arguments to the original function in reverse order.
 * @example
 * _.list(1, 2, 3) // => [1, 2, 3]
 * _.flip(_.list)(1, 2, 3) // => [3, 2, 1]
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @returns {Function}
 */
function flip (fn) {
    return function () {
        var args = slice(arguments).reverse();
        return fn.apply(this, args);
    };
}

/**
 * Builds a function that will invoke the given method name on any received object and return
 * the result. If no method with such name is found the function will return <code>undefined</code>.
 * Along with the method name it's possible to supply some arguments that will be bound to the method call.<br/>
 * Further arguments can also be passed when the function is actually called, and they will be concatenated
 * to the bound ones.<br/>
 * If different objects share a method name it's possible to build polymorphic functions as you can see in
 * the example below.<br/>
 * {@link module:lamb.condition|Condition} can be used to wrap <code>invoker</code> to avoid this behaviour
 * by adding a predicate, while {@link module:lamb.adapter|adapter} can build more complex polymorphic functions
 * without the need of homonymy.<br/>
 * Returning <code>undefined</code> or checking for such value is meant to favor composition and interoperability
 * between the aforementioned functions: for a more standard behaviour see also {@link module:lamb.generic|generic}.
 * @example <caption>Basic polymorphism with <code>invoker</code></caption>
 * var polySlice = _.invoker("slice");
 *
 * polySlice([1, 2, 3, 4, 5], 1, 3) // => [2, 3]
 * polySlice("Hello world", 1, 3) // => "el"
 *
 * @example <caption>With bound arguments</caption>
 * var substrFrom2 = _.invoker("substr", 2);
 * substrFrom2("Hello world") // => "llo world"
 * substrFrom2("Hello world", 5) // => "llo w"
 *
 * @memberof module:lamb
 * @category Function
 * @param {String} methodName
 * @param {...*} [boundArg]
 * @returns {Function}
 */
function invoker (methodName) {
    var boundArgs = slice(arguments, 1);

    return function (target) {
        var args = slice(arguments, 1);
        var method = target[methodName];
        return type(method) === "Function" ? method.apply(target, boundArgs.concat(args)) : void 0;
    };
}

/**
 * Builds a function that allows to map over the received arguments before applying them to the original one.
 * @example
 * var sumArray = _.invoker("reduce", _.add);
 * var sum = _.compose(sumArray, _.list);
 *
 * sum(1, 2, 3, 4, 5) // => 15
 *
 * var square = _.partial(Math.pow, _, 2);
 * var sumSquares = _.mapArgs(sum, square);
 *
 * sumSquares(1, 2, 3, 4, 5) // => 55
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {ListIteratorCallback} mapper
 * @returns {Function}
 */
function mapArgs (fn, mapper) {
    return compose(partial(apply, fn), mapWith(mapper), list);
}

/**
 * Creates a pipeline of functions, where each function consumes the result of the previous one.<br/>
 * See also {@link module:lamb.compose|compose}.
 * @example
 * var square = _.partial(Math.pow, _, 2);
 * var getMaxAndSquare = _.pipe(Math.max, square);
 *
 * getMaxAndSquare(3, 5) // => 25
 *
 * @memberof module:lamb
 * @category Function
 * @function
 * @param {...Function} fn
 * @returns {Function}
 */
var pipe = flip(compose);

/**
 * Builds a function that allows to "tap" into the arguments of the original one.
 * This allows to extract simple values from complex ones, transform arguments or simply intercept them.
 * If a "tapper" isn't found the argument is passed as it is.
 * @example
 * var someObject = {count: 5};
 * var someArrayData = [2, 3, 123, 5, 6, 7, 54, 65, 76, 0];
 * var getDataAmount = _.tapArgs(_.add, _.getKey("count"), _.getKey("length"));
 *
 * getDataAmount(someObject, someArrayData); // => 15
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {...?Function} [tapper]
 * @returns {Function}
 */
function tapArgs (fn) {
    var readers = slice(arguments, 1);

    return function () {
        var len = arguments.length;
        var args = [];

        for (var i = 0; i < len; i++) {
            args.push(readers[i] ? readers[i](arguments[i]) : arguments[i]);
        }

        return fn.apply(this, args);
    };
}

/**
 * Returns a function that will invoke the passed function at most once in the given timespan.<br/>
 * The first call in this case happens as soon as the function is invoked; see also {@link module:lamb.debounce|debounce}
 * for a different behaviour where the first call is delayed.
 * @example
 * var log = _.throttle(console.log.bind(console), 5000);
 *
 * log("Hi"); // console logs "Hi"
 * log("Hi again"); // nothing happens
 * // after five seconds
 * log("Hello world"); // console logs "Hello world"
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {Number} timespan - Expressed in milliseconds.
 * @returns {Function}
 */
function throttle (fn, timespan) {
    var result;
    var lastCall = 0;

    return function () {
        var now = Date.now();

        if (now - lastCall >= timespan) {
            lastCall = now;
            result = fn.apply(this, arguments);
        }

        return result;
    };
}

/**
 * Wraps the function <code>fn</code> inside a <code>wrapper</code> function.<br/>
 * This allows to conditionally execute <code>fn</code>, to tamper with its arguments or return value
 * and to run code before and after its execution.<br/>
 * Being this nothing more than a "{@link module:lamb.flip|flipped}" [partial application]{@link module:lamb.partial},
 * you can also easily build new functions from existent ones.
 * @example
 * var arrayMax = _.wrap(Math.max, _.apply);
 *
 * arrayMax([4, 5, 2, 6, 1]) // => 6
 *
 * @memberof module:lamb
 * @category Function
 * @function
 * @param {Function} fn
 * @param {Function} wrapper
 * @returns {Function}
 */
var wrap = aritize(flip(partial), 2);

lamb.apply = apply;
lamb.applyArgs = applyArgs;
lamb.aritize = aritize;
lamb.curry = curry;
lamb.curryRight = curryRight;
lamb.curryable = curryable;
lamb.curryableRight = curryableRight;
lamb.debounce = debounce;
lamb.flip = flip;
lamb.invoker = invoker;
lamb.mapArgs = mapArgs;
lamb.pipe = pipe;
lamb.tapArgs = tapArgs;
lamb.throttle = throttle;
lamb.wrap = wrap;
