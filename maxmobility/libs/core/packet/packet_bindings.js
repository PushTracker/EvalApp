// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = true;
var ENVIRONMENT_IS_SHELL = false;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

/*
if (Module['ENVIRONMENT']) {
  if (Module['ENVIRONMENT'] === 'WEB') {
    ENVIRONMENT_IS_WEB = true;
  } else if (Module['ENVIRONMENT'] === 'WORKER') {
    ENVIRONMENT_IS_WORKER = true;
  } else if (Module['ENVIRONMENT'] === 'NODE') {
    ENVIRONMENT_IS_NODE = true;
  } else if (Module['ENVIRONMENT'] === 'SHELL') {
    ENVIRONMENT_IS_SHELL = true;
  } else {
    throw new Error('The provided Module[\'ENVIRONMENT\'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.');
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === 'object';
  ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}
*/

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = console.log;
  if (!Module['printErr']) Module['printErr'] = console.warn;

  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  /*
  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }
  Module['arguments'] = process['argv'].slice(2);
  */

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  /*
  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  */

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function shell_read() { throw 'no read() available' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status, toThrow) {
      quit(status);
    }
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function shell_read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
      } else {
        onerror();
      }
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function shell_print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function shell_printErr(x) {
      console.warn(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}
if (!Module['quit']) {
  Module['quit'] = function(status, toThrow) {
    throw toThrow;
  }
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
    return value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === 'double' || type === 'i64') {
      // move so the load is aligned
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    if (!func) return; // on null pointer, return undefined
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      // optimize away arguments usage in common cases
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func);
        };
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return Runtime.dynCall(sig, func, [arg]);
        };
      } else {
        // general case
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments));
        };
      }
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { assert(DYNAMICTOP_PTR);var ret = HEAP32[DYNAMICTOP_PTR>>2];var end = (((ret + size + 15)|0) & -16);HEAP32[DYNAMICTOP_PTR>>2] = end;if (end >= TOTAL_MEMORY) {var success = enlargeMemory();if (!success) {HEAP32[DYNAMICTOP_PTR>>2] = ret;return 0;}}return ret;},
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



Module["Runtime"] = Runtime;



//========================================
// Runtime essentials
//========================================

var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try { func = eval('_' + ident); } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = Runtime.stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface.
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if ((!opts || !opts.async) && typeof EmterpreterAsync === 'object') {
      assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling ccall');
    }
    if (opts && opts.async) assert(!returnType, 'async ccalls cannot return values');
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function() {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  }

  var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }

  // sources of useful functions. we create this lazily as it can trigger a source decompression on this entire file
  var JSsource = null;
  function ensureJSsource() {
    if (!JSsource) {
      JSsource = {};
      for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
          // Elements of toCsource are arrays of three items:
          // the code, and the return value
          JSsource[fun] = parseJSFunc(JSfuncs[fun]);
        }
      }
    }
  }

  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      ensureJSsource();
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=(' + convertCode.returnValue + ');';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    funcstr += "if (typeof EmterpreterAsync === 'object') { assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling cwrap') }";
    if (!numericArgs) {
      // If we had a stack, restore it
      ensureJSsource();
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module["setValue"] = setValue;

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module["getValue"] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module["allocate"] = allocate;

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;

/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;

    var str = '';
    while (1) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 0xF8) == 0xF0) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 0xFC) == 0xF8) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
          }
        }
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}
Module["UTF8ToString"] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}


// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}


function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}


// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}


function demangle(func) {
  var __cxa_demangle_func = Module['___cxa_demangle'] || Module['__cxa_demangle'];
  if (__cxa_demangle_func) {
    try {
      var s =
        func.substr(1);
      var len = lengthBytesUTF8(s)+1;
      var buf = _malloc(len);
      stringToUTF8(s, buf, len);
      var status = _malloc(4);
      var ret = __cxa_demangle_func(buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed
    } catch(e) {
      // ignore problems here
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
    // failure when using libcxxabi, don't demangle
    return func;
  }
  Runtime.warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (x + ' [' + y + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}
Module["stackTrace"] = stackTrace;

// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
  HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
  }
  // Also test the global address 0 for integrity. This check is not compatible with SAFE_SPLIT_MEMORY though, since that mode already tests all address 0 accesses on its own.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - Module['asm'].stackSave() + allocSize) + ' bytes available!');
}

function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}


function enlargeMemory() {
  abortOnCannotGrowMemory();
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
  assert(buffer.byteLength === TOTAL_MEMORY, 'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
} else {
  // Use a WebAssembly memory where available
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  assert(buffer.byteLength === TOTAL_MEMORY);
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 0x63736d65; /* 'emsc' */
HEAP16[1] = 0x6373;
if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;

// Tools

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module["intArrayToString"] = intArrayToString;

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  Runtime.warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

if (!Math['trunc']) Math['trunc'] = function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};
Math.trunc = Math['trunc'];

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;



var /* show errors on likely calls to FS when it was not included */ FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;



// === Body ===

var ASM_CONSTS = [];




STATIC_BASE = Runtime.GLOBAL_BASE;

STATICTOP = STATIC_BASE + 9920;
/* global initializers */  __ATINIT__.push({ func: function() { __GLOBAL__sub_I_packet_cpp() } }, { func: function() { __GLOBAL__sub_I_bind_cpp() } });


/* memory initializer */ allocate([112,5,0,0,12,12,0,0,80,6,0,0,224,11,0,0,0,0,0,0,1,0,0,0,8,0,0,0,0,0,0,0,80,6,0,0,188,11,0,0,0,0,0,0,1,0,0,0,16,0,0,0,0,0,0,0,24,6,0,0,49,12,0,0,0,0,0,0,40,0,0,0,24,6,0,0,86,12,0,0,1,0,0,0,40,0,0,0,112,5,0,0,147,12,0,0,52,6,0,0,177,12,0,0,52,6,0,0,192,12,0,0,52,6,0,0,213,12,0,0,112,5,0,0,241,12,0,0,52,6,0,0,20,13,0,0,52,6,0,0,37,13,0,0,52,6,0,0,52,13,0,0,112,5,0,0,67,13,0,0,112,5,0,0,90,13,0,0,112,5,0,0,110,13,0,0,112,5,0,0,133,13,0,0,112,5,0,0,153,13,0,0,52,6,0,0,173,13,0,0,112,5,0,0,194,13,0,0,52,6,0,0,216,13,0,0,52,6,0,0,234,13,0,0,112,5,0,0,248,13,0,0,24,6,0,0,0,14,0,0,0,0,0,0,232,0,0,0,24,6,0,0,9,14,0,0,1,0,0,0,232,0,0,0,112,5,0,0,82,14,0,0,80,6,0,0,19,14,0,0,0,0,0,0,1,0,0,0,16,1,0,0,0,0,0,0,112,5,0,0,124,14,0,0,112,5,0,0,143,14,0,0,112,5,0,0,195,17,0,0,112,5,0,0,226,17,0,0,112,5,0,0,1,18,0,0,112,5,0,0,32,18,0,0,112,5,0,0,63,18,0,0,112,5,0,0,94,18,0,0,112,5,0,0,125,18,0,0,112,5,0,0,156,18,0,0,112,5,0,0,187,18,0,0,112,5,0,0,218,18,0,0,112,5,0,0,249,18,0,0,112,5,0,0,24,19,0,0,80,6,0,0,55,19,0,0,0,0,0,0,1,0,0,0,16,1,0,0,0,0,0,0,80,6,0,0,118,19,0,0,0,0,0,0,1,0,0,0,16,1,0,0,0,0,0,0,112,5,0,0,212,29,0,0,152,5,0,0,52,30,0,0,232,1,0,0,0,0,0,0,152,5,0,0,225,29,0,0,248,1,0,0,0,0,0,0,112,5,0,0,2,30,0,0,152,5,0,0,15,30,0,0,216,1,0,0,0,0,0,0,152,5,0,0,87,31,0,0,208,1,0,0,0,0,0,0,152,5,0,0,100,31,0,0,208,1,0,0,0,0,0,0,152,5,0,0,116,31,0,0,32,2,0,0,0,0,0,0,152,5,0,0,169,31,0,0,232,1,0,0,0,0,0,0,152,5,0,0,133,31,0,0,64,2,0,0,0,0,0,0,152,5,0,0,203,31,0,0,232,1,0,0,0,0,0,0,252,5,0,0,243,31,0,0,252,5,0,0,245,31,0,0,252,5,0,0,248,31,0,0,252,5,0,0,250,31,0,0,252,5,0,0,252,31,0,0,252,5,0,0,254,31,0,0,252,5,0,0,0,32,0,0,252,5,0,0,2,32,0,0,252,5,0,0,4,32,0,0,252,5,0,0,6,32,0,0,252,5,0,0,8,32,0,0,252,5,0,0,10,32,0,0,252,5,0,0,12,32,0,0,252,5,0,0,14,32,0,0,152,5,0,0,16,32,0,0,232,1,0,0,0,0,0,0,152,5,0,0,49,32,0,0,216,1,0,0,0,0,0,0,64,0,0,0,112,2,0,0,64,0,0,0,144,2,0,0,112,2,0,0,64,0,0,0,184,2,0,0,144,2,0,0,184,2,0,0,80,0,0,0,96,0,0,0,40,0,0,0,184,2,0,0,128,2,0,0,40,0,0,0,184,2,0,0,144,2,0,0,240,0,0,0,128,2,0,0,240,0,0,0,128,2,0,0,240,0,0,0,24,1,0,0,112,2,0,0,240,0,0,0,40,0,0,0,240,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,170,34,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,3,0,0,228,4,0,0,5,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,178,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,203,29,0,0,0,0,0,0,216,1,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,0,0,0,0,0,2,0,0,6,0,0,0,14,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,0,0,0,0,16,2,0,0,18,0,0,0,19,0,0,0,20,0,0,0,0,0,0,0,32,2,0,0,21,0,0,0,22,0,0,0,23,0,0,0,0,0,0,0,48,2,0,0,21,0,0,0,24,0,0,0,23,0,0,0,0,0,0,0,96,2,0,0,6,0,0,0,25,0,0,0,8,0,0,0,9,0,0,0,26,0,0,0,0,0,0,0,80,2,0,0,6,0,0,0,27,0,0,0,8,0,0,0,9,0,0,0,28,0,0,0,0,0,0,0,224,2,0,0,6,0,0,0,29,0,0,0,8,0,0,0,9,0,0,0,30,0,0,0,0,0,0,0,240,2,0,0,6,0,0,0,31,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,86,101,99,116,111,114,73,110,116,0,77,111,116,111,114,83,116,97,116,101,0,79,102,102,0,79,110,0,69,114,114,111,114,0,85,110,105,116,115,0,69,110,103,108,105,115,104,0,77,101,116,114,105,99,0,83,109,97,114,116,68,114,105,118,101,67,111,110,116,114,111,108,77,111,100,101,0,66,101,103,105,110,110,101,114,0,73,110,116,101,114,109,101,100,105,97,116,101,0,65,100,118,97,110,99,101,100,0,83,109,97,114,116,68,114,105,118,101,83,101,116,116,105,110,103,115,0,67,111,110,116,114,111,108,77,111,100,101,0,70,108,97,103,115,0,80,97,100,100,105,110,103,0,84,97,112,83,101,110,115,105,116,105,118,105,116,121,0,65,99,99,101,108,101,114,97,116,105,111,110,0,77,97,120,83,112,101,101,100,0,68,101,118,105,99,101,0,83,109,97,114,116,68,114,105,118,101,0,83,109,97,114,116,68,114,105,118,101,66,108,117,101,116,111,111,116,104,0,80,117,115,104,84,114,97,99,107,101,114,0,80,97,99,107,101,116,84,121,112,101,0,78,111,110,101,0,68,97,116,97,0,67,111,109,109,97,110,100,0,79,84,65,0,80,97,99,107,101,116,68,97,116,97,84,121,112,101,0,77,111,116,111,114,68,105,115,116,97,110,99,101,0,83,112,101,101,100,0,67,111,97,115,116,84,105,109,101,0,80,117,115,104,101,115,0,66,97,116,116,101,114,121,76,101,118,101,108,0,86,101,114,115,105,111,110,73,110,102,111,0,68,97,105,108,121,73,110,102,111,0,74,111,117,114,110,101,121,73,110,102,111,0,77,111,116,111,114,73,110,102,111,0,68,101,118,105,99,101,73,110,102,111,0,82,101,97,100,121,0,69,114,114,111,114,73,110,102,111,0,112,117,115,104,84,114,97,99,107,101,114,0,115,109,97,114,116,68,114,105,118,101,0,115,109,97,114,116,68,114,105,118,101,66,108,117,101,116,111,111,116,104,0,121,101,97,114,0,109,111,110,116,104,0,100,97,121,0,112,117,115,104,101,115,87,105,116,104,0,112,117,115,104,101,115,87,105,116,104,111,117,116,0,99,111,97,115,116,87,105,116,104,0,99,111,97,115,116,87,105,116,104,111,117,116,0,100,105,115,116,97,110,99,101,0,115,112,101,101,100,0,112,116,66,97,116,116,101,114,121,0,115,100,66,97,116,116,101,114,121,0,112,117,115,104,101,115,0,115,116,97,116,101,0,98,97,116,116,101,114,121,76,101,118,101,108,0,118,101,114,115,105,111,110,0,112,97,100,100,105,110,103,0,100,114,105,118,101,84,105,109,101,0,104,111,117,114,0,109,105,110,117,116,101,0,115,101,99,111,110,100,0,109,111,115,116,82,101,99,101,110,116,69,114,114,111,114,0,110,117,109,66,97,116,116,101,114,121,86,111,108,116,97,103,101,69,114,114,111,114,115,0,110,117,109,79,118,101,114,67,117,114,114,101,110,116,69,114,114,111,114,115,0,110,117,109,77,111,116,111,114,80,104,97,115,101,69,114,114,111,114,115,0,110,117,109,71,121,114,111,82,97,110,103,101,69,114,114,111,114,115,0,110,117,109,79,118,101,114,84,101,109,112,101,114,97,116,117,114,101,69,114,114,111,114,115,0,110,117,109,66,76,69,68,105,115,99,111,110,110,101,99,116,69,114,114,111,114,115,0,100,101,118,105,99,101,0,80,97,99,107,101,116,67,111,109,109,97,110,100,84,121,112,101,0,83,101,116,65,99,99,101,108,101,114,97,116,105,111,110,0,83,101,116,77,97,120,83,112,101,101,100,0,84,97,112,0,68,111,117,98,108,101,84,97,112,0,83,101,116,67,111,110,116,114,111,108,77,111,100,101,0,83,101,116,83,101,116,116,105,110,103,115,0,84,117,114,110,79,102,102,77,111,116,111,114,0,83,116,97,114,116,74,111,117,114,110,101,121,0,83,116,111,112,74,111,117,114,110,101,121,0,80,97,117,115,101,74,111,117,114,110,101,121,0,83,101,116,84,105,109,101,0,83,116,97,114,116,79,84,65,0,83,116,111,112,79,84,65,0,79,84,65,82,101,97,100,121,0,67,97,110,99,101,108,79,84,65,0,87,97,107,101,0,83,116,97,114,116,71,97,109,101,0,83,116,111,112,71,97,109,101,0,67,111,110,110,101,99,116,77,80,71,97,109,101,0,68,105,115,99,111,110,110,101,99,116,77,80,71,97,109,101,0,80,97,99,107,101,116,79,84,65,84,121,112,101,0,80,97,99,107,101,116,69,114,114,111,114,84,121,112,101,0,78,111,69,114,114,111,114,0,66,97,116,116,101,114,121,86,111,108,116,97,103,101,0,77,111,116,111,114,80,104,97,115,101,115,0,79,118,101,114,67,117,114,114,101,110,116,0,79,118,101,114,84,101,109,112,101,114,97,116,117,114,101,0,71,121,114,111,82,97,110,103,101,0,79,84,65,85,110,97,118,97,105,108,97,98,108,101,0,66,76,69,68,105,115,99,111,110,110,101,99,116,0,80,97,99,107,101,116,0,118,97,108,105,100,0,112,114,111,99,101,115,115,80,97,99,107,101,116,0,110,101,119,80,97,99,107,101,116,0,102,111,114,109,97,116,0,108,101,110,103,116,104,0,84,121,112,101,0,115,101,116,116,105,110,103,115,0,118,101,114,115,105,111,110,73,110,102,111,0,100,97,105,108,121,73,110,102,111,0,106,111,117,114,110,101,121,73,110,102,111,0,109,111,116,111,114,73,110,102,111,0,116,105,109,101,73,110,102,111,0,100,101,118,105,99,101,73,110,102,111,0,101,114,114,111,114,73,110,102,111,0,98,97,116,116,101,114,121,73,110,102,111,0,79,84,65,68,101,118,105,99,101,0,109,111,116,111,114,68,105,115,116,97,110,99,101,0,98,121,116,101,115,0,112,117,115,104,95,98,97,99,107,0,114,101,115,105,122,101,0,115,105,122,101,0,103,101,116,0,115,101,116,0,78,83,116,51,95,95,50,54,118,101,99,116,111,114,73,104,78,83,95,57,97,108,108,111,99,97,116,111,114,73,104,69,69,69,69,0,78,83,116,51,95,95,50,49,51,95,95,118,101,99,116,111,114,95,98,97,115,101,73,104,78,83,95,57,97,108,108,111,99,97,116,111,114,73,104,69,69,69,69,0,78,83,116,51,95,95,50,50,48,95,95,118,101,99,116,111,114,95,98,97,115,101,95,99,111,109,109,111,110,73,76,98,49,69,69,69,0,80,78,83,116,51,95,95,50,54,118,101,99,116,111,114,73,104,78,83,95,57,97,108,108,111,99,97,116,111,114,73,104,69,69,69,69,0,80,75,78,83,116,51,95,95,50,54,118,101,99,116,111,114,73,104,78,83,95,57,97,108,108,111,99,97,116,111,114,73,104,69,69,69,69,0,105,105,0,118,0,118,105,0,118,105,105,105,0,118,105,105,105,105,0,105,105,105,0,78,49,48,101,109,115,99,114,105,112,116,101,110,51,118,97,108,69,0,105,105,105,105,0,105,105,105,105,105,0,78,53,77,111,116,111,114,53,83,116,97,116,101,69,0,78,49,48,83,109,97,114,116,68,114,105,118,101,53,85,110,105,116,115,69,0,78,49,48,83,109,97,114,116,68,114,105,118,101,49,49,67,111,110,116,114,111,108,77,111,100,101,69,0,78,49,48,83,109,97,114,116,68,114,105,118,101,56,83,101,116,116,105,110,103,115,69,0,105,0,102,105,105,0,118,105,105,102,0,78,54,80,97,99,107,101,116,54,68,101,118,105,99,101,69,0,78,54,80,97,99,107,101,116,52,84,121,112,101,69,0,78,54,80,97,99,107,101,116,52,68,97,116,97,69,0,78,54,80,97,99,107,101,116,49,49,86,101,114,115,105,111,110,73,110,102,111,69,0,78,54,80,97,99,107,101,116,57,68,97,105,108,121,73,110,102,111,69,0,78,54,80,97,99,107,101,116,49,49,74,111,117,114,110,101,121,73,110,102,111,69,0,78,54,80,97,99,107,101,116,57,77,111,116,111,114,73,110,102,111,69,0,78,54,80,97,99,107,101,116,57,69,114,114,111,114,73,110,102,111,69,0,78,49,48,83,109,97,114,116,68,114,105,118,101,53,69,114,114,111,114,69,0,78,54,80,97,99,107,101,116,49,48,68,101,118,105,99,101,73,110,102,111,69,0,78,54,80,97,99,107,101,116,55,67,111,109,109,97,110,100,69,0,78,54,80,97,99,107,101,116,51,79,84,65,69,0,54,80,97,99,107,101,116,0,80,54,80,97,99,107,101,116,0,80,75,54,80,97,99,107,101,116,0,78,83,116,51,95,95,50,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,78,83,116,51,95,95,50,50,49,95,95,98,97,115,105,99,95,115,116,114,105,110,103,95,99,111,109,109,111,110,73,76,98,49,69,69,69,0,118,105,105,0,78,54,80,97,99,107,101,116,56,84,105,109,101,73,110,102,111,69,0,78,54,80,97,99,107,101,116,49,49,66,97,116,116,101,114,121,73,110,102,111,69,0,118,111,105,100,0,98,111,111,108,0,99,104,97,114,0,115,105,103,110,101,100,32,99,104,97,114,0,117,110,115,105,103,110,101,100,32,99,104,97,114,0,115,104,111,114,116,0,117,110,115,105,103,110,101,100,32,115,104,111,114,116,0,105,110,116,0,117,110,115,105,103,110,101,100,32,105,110,116,0,108,111,110,103,0,117,110,115,105,103,110,101,100,32,108,111,110,103,0,102,108,111,97,116,0,100,111,117,98,108,101,0,115,116,100,58,58,115,116,114,105,110,103,0,115,116,100,58,58,98,97,115,105,99,95,115,116,114,105,110,103,60,117,110,115,105,103,110,101,100,32,99,104,97,114,62,0,115,116,100,58,58,119,115,116,114,105,110,103,0,101,109,115,99,114,105,112,116,101,110,58,58,118,97,108,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,99,104,97,114,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,115,105,103,110,101,100,32,99,104,97,114,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,110,115,105,103,110,101,100,32,99,104,97,114,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,115,104,111,114,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,110,115,105,103,110,101,100,32,115,104,111,114,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,105,110,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,110,115,105,103,110,101,100,32,105,110,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,108,111,110,103,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,110,115,105,103,110,101,100,32,108,111,110,103,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,105,110,116,56,95,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,105,110,116,56,95,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,105,110,116,49,54,95,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,105,110,116,49,54,95,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,105,110,116,51,50,95,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,117,105,110,116,51,50,95,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,102,108,111,97,116,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,100,111,117,98,108,101,62,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,60,108,111,110,103,32,100,111,117,98,108,101,62,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,101,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,100,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,102,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,109,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,108,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,106,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,105,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,116,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,115,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,104,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,97,69,69,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,73,99,69,69,0,78,83,116,51,95,95,50,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,119,69,69,69,69,0,78,83,116,51,95,95,50,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,104,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,104,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,104,69,69,69,69,0,17,0,10,0,17,17,17,0,0,0,0,5,0,0,0,0,0,0,9,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,15,10,17,17,17,3,10,7,0,1,19,9,11,11,0,0,9,6,11,0,0,11,0,6,17,0,0,0,17,17,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,10,10,17,17,17,0,10,0,0,2,0,9,11,0,0,0,9,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,13,0,0,0,0,9,14,0,0,0,0,0,14,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,15,0,0,0,0,9,16,0,0,0,0,0,16,0,0,16,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,10,0,0,0,0,9,11,0,0,0,0,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,45,43,32,32,32,48,88,48,120,0,40,110,117,108,108,41,0,45,48,88,43,48,88,32,48,88,45,48,120,43,48,120,32,48,120,0,105,110,102,0,73,78,70,0,110,97,110,0,78,65,78,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,46,0,84,33,34,25,13,1,2,3,17,75,28,12,16,4,11,29,18,30,39,104,110,111,112,113,98,32,5,6,15,19,20,21,26,8,22,7,40,36,23,24,9,10,14,27,31,37,35,131,130,125,38,42,43,60,61,62,63,67,71,74,77,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,105,106,107,108,114,115,116,121,122,123,124,0,73,108,108,101,103,97,108,32,98,121,116,101,32,115,101,113,117,101,110,99,101,0,68,111,109,97,105,110,32,101,114,114,111,114,0,82,101,115,117,108,116,32,110,111,116,32,114,101,112,114,101,115,101,110,116,97,98,108,101,0,78,111,116,32,97,32,116,116,121,0,80,101,114,109,105,115,115,105,111,110,32,100,101,110,105,101,100,0,79,112,101,114,97,116,105,111,110,32,110,111,116,32,112,101,114,109,105,116,116,101,100,0,78,111,32,115,117,99,104,32,102,105,108,101,32,111,114,32,100,105,114,101,99,116,111,114,121,0,78,111,32,115,117,99,104,32,112,114,111,99,101,115,115,0,70,105,108,101,32,101,120,105,115,116,115,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,100,97,116,97,32,116,121,112,101,0,78,111,32,115,112,97,99,101,32,108,101,102,116,32,111,110,32,100,101,118,105,99,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,82,101,115,111,117,114,99,101,32,98,117,115,121,0,73,110,116,101,114,114,117,112,116,101,100,32,115,121,115,116,101,109,32,99,97,108,108,0,82,101,115,111,117,114,99,101,32,116,101,109,112,111,114,97,114,105,108,121,32,117,110,97,118,97,105,108,97,98,108,101,0,73,110,118,97,108,105,100,32,115,101,101,107,0,67,114,111,115,115,45,100,101,118,105,99,101,32,108,105,110,107,0,82,101,97,100,45,111,110,108,121,32,102,105,108,101,32,115,121,115,116,101,109,0,68,105,114,101,99,116,111,114,121,32,110,111,116,32,101,109,112,116,121,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,112,101,101,114,0,79,112,101,114,97,116,105,111,110,32,116,105,109,101,100,32,111,117,116,0,67,111,110,110,101,99,116,105,111,110,32,114,101,102,117,115,101,100,0,72,111,115,116,32,105,115,32,100,111,119,110,0,72,111,115,116,32,105,115,32,117,110,114,101,97,99,104,97,98,108,101,0,65,100,100,114,101,115,115,32,105,110,32,117,115,101,0,66,114,111,107,101,110,32,112,105,112,101,0,73,47,79,32,101,114,114,111,114,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,32,111,114,32,97,100,100,114,101,115,115,0,66,108,111,99,107,32,100,101,118,105,99,101,32,114,101,113,117,105,114,101,100,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,0,78,111,116,32,97,32,100,105,114,101,99,116,111,114,121,0,73,115,32,97,32,100,105,114,101,99,116,111,114,121,0,84,101,120,116,32,102,105,108,101,32,98,117,115,121,0,69,120,101,99,32,102,111,114,109,97,116,32,101,114,114,111,114,0,73,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,0,65,114,103,117,109,101,110,116,32,108,105,115,116,32,116,111,111,32,108,111,110,103,0,83,121,109,98,111,108,105,99,32,108,105,110,107,32,108,111,111,112,0,70,105,108,101,110,97,109,101,32,116,111,111,32,108,111,110,103,0,84,111,111,32,109,97,110,121,32,111,112,101,110,32,102,105,108,101,115,32,105,110,32,115,121,115,116,101,109,0,78,111,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,115,32,97,118,97,105,108,97,98,108,101,0,66,97,100,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,0,78,111,32,99,104,105,108,100,32,112,114,111,99,101,115,115,0,66,97,100,32,97,100,100,114,101,115,115,0,70,105,108,101,32,116,111,111,32,108,97,114,103,101,0,84,111,111,32,109,97,110,121,32,108,105,110,107,115,0,78,111,32,108,111,99,107,115,32,97,118,97,105,108,97,98,108,101,0,82,101,115,111,117,114,99,101,32,100,101,97,100,108,111,99,107,32,119,111,117,108,100,32,111,99,99,117,114,0,83,116,97,116,101,32,110,111,116,32,114,101,99,111,118,101,114,97,98,108,101,0,80,114,101,118,105,111,117,115,32,111,119,110,101,114,32,100,105,101,100,0,79,112,101,114,97,116,105,111,110,32,99,97,110,99,101,108,101,100,0,70,117,110,99,116,105,111,110,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,78,111,32,109,101,115,115,97,103,101,32,111,102,32,100,101,115,105,114,101,100,32,116,121,112,101,0,73,100,101,110,116,105,102,105,101,114,32,114,101,109,111,118,101,100,0,68,101,118,105,99,101,32,110,111,116,32,97,32,115,116,114,101,97,109,0,78,111,32,100,97,116,97,32,97,118,97,105,108,97,98,108,101,0,68,101,118,105,99,101,32,116,105,109,101,111,117,116,0,79,117,116,32,111,102,32,115,116,114,101,97,109,115,32,114,101,115,111,117,114,99,101,115,0,76,105,110,107,32,104,97,115,32,98,101,101,110,32,115,101,118,101,114,101,100,0,80,114,111,116,111,99,111,108,32,101,114,114,111,114,0,66,97,100,32,109,101,115,115,97,103,101,0,70,105,108,101,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,98,97,100,32,115,116,97,116,101,0,78,111,116,32,97,32,115,111,99,107,101,116,0,68,101,115,116,105,110,97,116,105,111,110,32,97,100,100,114,101,115,115,32,114,101,113,117,105,114,101,100,0,77,101,115,115,97,103,101,32,116,111,111,32,108,97,114,103,101,0,80,114,111,116,111,99,111,108,32,119,114,111,110,103,32,116,121,112,101,32,102,111,114,32,115,111,99,107,101,116,0,80,114,111,116,111,99,111,108,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,80,114,111,116,111,99,111,108,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,83,111,99,107,101,116,32,116,121,112,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,78,111,116,32,115,117,112,112,111,114,116,101,100,0,80,114,111,116,111,99,111,108,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,65,100,100,114,101,115,115,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,112,114,111,116,111,99,111,108,0,65,100,100,114,101,115,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,78,101,116,119,111,114,107,32,105,115,32,100,111,119,110,0,78,101,116,119,111,114,107,32,117,110,114,101,97,99,104,97,98,108,101,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,110,101,116,119,111,114,107,0,67,111,110,110,101,99,116,105,111,110,32,97,98,111,114,116,101,100,0,78,111,32,98,117,102,102,101,114,32,115,112,97,99,101,32,97,118,97,105,108,97,98,108,101,0,83,111,99,107,101,116,32,105,115,32,99,111,110,110,101,99,116,101,100,0,83,111,99,107,101,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0,67,97,110,110,111,116,32,115,101,110,100,32,97,102,116,101,114,32,115,111,99,107,101,116,32,115,104,117,116,100,111,119,110,0,79,112,101,114,97,116,105,111,110,32,97,108,114,101,97,100,121,32,105,110,32,112,114,111,103,114,101,115,115,0,79,112,101,114,97,116,105,111,110,32,105,110,32,112,114,111,103,114,101,115,115,0,83,116,97,108,101,32,102,105,108,101,32,104,97,110,100,108,101,0,82,101,109,111,116,101,32,73,47,79,32,101,114,114,111,114,0,81,117,111,116,97,32,101,120,99,101,101,100,101,100,0,78,111,32,109,101,100,105,117,109,32,102,111,117,110,100,0,87,114,111,110,103,32,109,101,100,105,117,109,32,116,121,112,101,0,78,111,32,101,114,114,111,114,32,105,110,102,111,114,109,97,116,105,111,110,0,0,118,101,99,116,111,114,0,98,97,115,105,99,95,115,116,114,105,110,103,0,116,101,114,109,105,110,97,116,105,110,103,32,119,105,116,104,32,37,115,32,101,120,99,101,112,116,105,111,110,32,111,102,32,116,121,112,101,32,37,115,58,32,37,115,0,116,101,114,109,105,110,97,116,105,110,103,32,119,105,116,104,32,37,115,32,101,120,99,101,112,116,105,111,110,32,111,102,32,116,121,112,101,32,37,115,0,116,101,114,109,105,110,97,116,105,110,103,32,119,105,116,104,32,37,115,32,102,111,114,101,105,103,110,32,101,120,99,101,112,116,105,111,110,0,116,101,114,109,105,110,97,116,105,110,103,0,117,110,99,97,117,103,104,116,0,83,116,57,101,120,99,101,112,116,105,111,110,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,83,116,57,116,121,112,101,95,105,110,102,111,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,112,116,104,114,101,97,100,95,111,110,99,101,32,102,97,105,108,117,114,101,32,105,110,32,95,95,99,120,97,95,103,101,116,95,103,108,111,98,97,108,115,95,102,97,115,116,40,41,0,99,97,110,110,111,116,32,99,114,101,97,116,101,32,112,116,104,114,101,97,100,32,107,101,121,32,102,111,114,32,95,95,99,120,97,95,103,101,116,95,103,108,111,98,97,108,115,40,41,0,99,97,110,110,111,116,32,122,101,114,111,32,111,117,116,32,116,104,114,101,97,100,32,118,97,108,117,101,32,102,111,114,32,95,95,99,120,97,95,103,101,116,95,103,108,111,98,97,108,115,40,41,0,116,101,114,109,105,110,97,116,101,95,104,97,110,100,108,101,114,32,117,110,101,120,112,101,99,116,101,100,108,121,32,114,101,116,117,114,110,101,100,0,116,101,114,109,105,110,97,116,101,95,104,97,110,100,108,101,114,32,117,110,101,120,112,101,99,116,101,100,108,121,32,116,104,114,101,119,32,97,110,32,101,120,99,101,112,116,105,111,110,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,83,116,57,98,97,100,95,97,108,108,111,99,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,57,95,95,112,111,105,110,116,101,114,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,112,98,97,115,101,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,51,95,95,102,117,110,100,97,109,101,110,116,97,108,95,116,121,112,101,95,105,110,102,111,69,0,118,0,68,110,0,98,0,99,0,104,0,97,0,115,0,116,0,105,0,106,0,108,0,109,0,102,0,100,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,101,110,117,109,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);





/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


  
  var structRegistrations={};
  
  
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }var embind_charCodes=undefined;function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  
  
  
  
  
  
  var char_0=48;
  
  var char_9=57;function makeLegalFunctionName(name) {
      if (undefined === name) {
          return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
          return '_' + name;
      } else {
          return name;
      }
    }function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }var BindingError=undefined;function throwBindingError(message) {
      throw new BindingError(message);
    }function requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
  
      function makeDynCaller(dynCall) {
          var args = [];
          for (var i = 1; i < signature.length; ++i) {
              args.push('a' + i);
          }
  
          var name = 'dynCall_' + signature + '_' + rawFunction;
          var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
          body    += '    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n';
          body    += '};\n';
  
          return (new Function('dynCall', 'rawFunction', body))(dynCall, rawFunction);
      }
  
      var fp;
      if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
          fp = Module['FUNCTION_TABLE_' + signature][rawFunction];
      } else if (typeof FUNCTION_TABLE !== "undefined") {
          fp = FUNCTION_TABLE[rawFunction];
      } else {
          // asm.js does not give direct access to the function tables,
          // and thus we must go through the dynCall interface which allows
          // calling into a signature's function table by pointer value.
          //
          // https://github.com/dherman/asm.js/issues/83
          //
          // This has three main penalties:
          // - dynCall is another function call in the path from JavaScript to C++.
          // - JITs may not predict through the function table indirection at runtime.
          var dc = Module["asm"]['dynCall_' + signature];
          if (dc === undefined) {
              // We will always enter this branch if the signature
              // contains 'f' and PRECISE_F32 is not enabled.
              //
              // Try again, replacing 'f' with 'd'.
              dc = Module["asm"]['dynCall_' + signature.replace(/f/g, 'd')];
              if (dc === undefined) {
                  throwBindingError("No dynCall invoker for signature: " + signature);
              }
          }
          fp = makeDynCaller(dc);
      }
  
      if (typeof fp !== "function") {
          throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }function __embind_register_value_object(
      rawType,
      name,
      constructorSignature,
      rawConstructor,
      destructorSignature,
      rawDestructor
    ) {
      structRegistrations[rawType] = {
          name: readLatin1String(name),
          rawConstructor: requireFunction(constructorSignature, rawConstructor),
          rawDestructor: requireFunction(destructorSignature, rawDestructor),
          fields: [],
      };
    }

   

   

  
  
  var awaitingDependencies={};
  
  var registeredTypes={};
  
  var typeDependencies={};
  
  
  
  var InternalError=undefined;function throwInternalError(message) {
      throw new InternalError(message);
    }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
                  typeConverters[i] = registeredTypes[dt];
                  ++registered;
                  if (registered === unregisteredTypes.length) {
                      onComplete(typeConverters);
                  }
              });
          }
      });
      if (0 === unregisteredTypes.length) {
          onComplete(typeConverters);
      }
    }function registerType(rawType, registeredInstance, options) {
      options = options || {};
  
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
          var callbacks = awaitingDependencies[rawType];
          delete awaitingDependencies[rawType];
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:function (adjusted) {
        if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
        for (var ptr in EXCEPTIONS.infos) {
          var info = EXCEPTIONS.infos[ptr];
          if (info.adjusted === adjusted) {
            return ptr;
          }
        }
        return adjusted;
      },addRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount++;
      },decRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        assert(info.refcount > 0);
        info.refcount--;
        // A rethrown exception can reach refcount 0; it must not be discarded
        // Its next handler will clear the rethrown flag and addRef it, prior to
        // final decRef and destruction here
        if (info.refcount === 0 && !info.rethrown) {
          if (info.destructor) {
            Module['dynCall_vi'](info.destructor, ptr);
          }
          delete EXCEPTIONS.infos[ptr];
          ___cxa_free_exception(ptr);
        }
      },clearRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount = 0;
      }};
  function ___resumeException(ptr) {
      if (!EXCEPTIONS.last) { EXCEPTIONS.last = ptr; }
      throw ptr;
    }function ___cxa_find_matching_catch() {
      var thrown = EXCEPTIONS.last;
      if (!thrown) {
        // just pass through the null ptr
        return ((Runtime.setTempRet0(0),0)|0);
      }
      var info = EXCEPTIONS.infos[thrown];
      var throwntype = info.type;
      if (!throwntype) {
        // just pass through the thrown ptr
        return ((Runtime.setTempRet0(0),thrown)|0);
      }
      var typeArray = Array.prototype.slice.call(arguments);
  
      var pointer = Module['___cxa_is_pointer_type'](throwntype);
      // can_catch receives a **, add indirection
      if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
      HEAP32[((___cxa_find_matching_catch.buffer)>>2)]=thrown;
      thrown = ___cxa_find_matching_catch.buffer;
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
          thrown = HEAP32[((thrown)>>2)]; // undo indirection
          info.adjusted = thrown;
          return ((Runtime.setTempRet0(typeArray[i]),thrown)|0);
        }
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      thrown = HEAP32[((thrown)>>2)]; // undo indirection
      return ((Runtime.setTempRet0(throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      EXCEPTIONS.infos[ptr] = {
        ptr: ptr,
        adjusted: ptr,
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
      };
      EXCEPTIONS.last = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr;
    }

   

  
  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

   

  function _abort() {
      Module['abort']();
    }

  
  function runDestructors(destructors) {
      while (destructors.length) {
          var ptr = destructors.pop();
          var del = destructors.pop();
          del(ptr);
      }
    }
  
  
  var UnboundTypeError=undefined;
  
  function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
          if (seen[type]) {
              return;
          }
          if (registeredTypes[type]) {
              return;
          }
          if (typeDependencies[type]) {
              typeDependencies[type].forEach(visit);
              return;
          }
          unboundTypes.push(type);
          seen[type] = true;
      }
      types.forEach(visit);
  
      throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    }
  
  
  function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
          if (!ptrClass.upcast) {
              throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
          }
          ptr = ptrClass.upcast(ptr);
          ptrClass = ptrClass.baseClass;
      }
      return ptr;
    }function validateThis(this_, classType, humanName) {
      if (!(this_ instanceof Object)) {
          throwBindingError(humanName + ' with invalid "this": ' + this_);
      }
      if (!(this_ instanceof classType.registeredClass.constructor)) {
          throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
      }
      if (!this_.$$.ptr) {
          throwBindingError('cannot call emscripten binding method ' + humanName + ' on deleted object');
      }
  
      // todo: kill this
      return upcastPointer(
          this_.$$.ptr,
          this_.$$.ptrType.registeredClass,
          classType.registeredClass);
    }function __embind_register_class_property(
      classType,
      fieldName,
      getterReturnType,
      getterSignature,
      getter,
      getterContext,
      setterArgumentType,
      setterSignature,
      setter,
      setterContext
    ) {
      fieldName = readLatin1String(fieldName);
      getter = requireFunction(getterSignature, getter);
  
      whenDependentTypesAreResolved([], [classType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + fieldName;
          var desc = {
              get: function() {
                  throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
              },
              enumerable: true,
              configurable: true
          };
          if (setter) {
              desc.set = function() {
                  throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
              };
          } else {
              desc.set = function(v) {
                  throwBindingError(humanName + ' is a read-only property');
              };
          }
  
          Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
  
          whenDependentTypesAreResolved(
              [],
              (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
          function(types) {
              var getterReturnType = types[0];
              var desc = {
                  get: function() {
                      var ptr = validateThis(this, classType, humanName + ' getter');
                      return getterReturnType['fromWireType'](getter(getterContext, ptr));
                  },
                  enumerable: true
              };
  
              if (setter) {
                  setter = requireFunction(setterSignature, setter);
                  var setterArgumentType = types[1];
                  desc.set = function(v) {
                      var ptr = validateThis(this, classType, humanName + ' setter');
                      var destructors = [];
                      setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                      runDestructors(destructors);
                  };
              }
  
              Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
              return [];
          });
  
          return [];
      });
    }

  
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
        Module.printErr('exception during cxa_free_exception: ' + e);
      }
    }function ___cxa_end_catch() {
      // Clear state flag.
      Module['setThrew'](0);
      // Call destructor if one is registered then clear it.
      var ptr = EXCEPTIONS.caught.pop();
      if (ptr) {
        EXCEPTIONS.decRef(EXCEPTIONS.deAdjust(ptr));
        EXCEPTIONS.last = 0; // XXX in decRef?
      }
    }


  function _pthread_once(ptr, func) {
      if (!_pthread_once.seen) _pthread_once.seen = {};
      if (ptr in _pthread_once.seen) return;
      Module['dynCall_v'](func);
      _pthread_once.seen[ptr] = 1;
    }

  function __embind_register_value_object_field(
      structType,
      fieldName,
      getterReturnType,
      getterSignature,
      getter,
      getterContext,
      setterArgumentType,
      setterSignature,
      setter,
      setterContext
    ) {
      structRegistrations[structType].fields.push({
          fieldName: readLatin1String(fieldName),
          getterReturnType: getterReturnType,
          getter: requireFunction(getterSignature, getter),
          getterContext: getterContext,
          setterArgumentType: setterArgumentType,
          setter: requireFunction(setterSignature, setter),
          setterContext: setterContext,
      });
    }

  
  
  
  function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
          return false;
      }
      if (!(other instanceof ClassHandle)) {
          return false;
      }
  
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
  
      while (leftClass.baseClass) {
          left = leftClass.upcast(left);
          leftClass = leftClass.baseClass;
      }
  
      while (rightClass.baseClass) {
          right = rightClass.upcast(right);
          rightClass = rightClass.baseClass;
      }
  
      return leftClass === rightClass && left === right;
    }
  
  
  function shallowCopyInternalPointer(o) {
      return {
          count: o.count,
          deleteScheduled: o.deleteScheduled,
          preservePointerOnDelete: o.preservePointerOnDelete,
          ptr: o.ptr,
          ptrType: o.ptrType,
          smartPtr: o.smartPtr,
          smartPtrType: o.smartPtrType,
      };
    }
  
  function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    }function ClassHandle_clone() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.preservePointerOnDelete) {
          this.$$.count.value += 1;
          return this;
      } else {
          var clone = Object.create(Object.getPrototypeOf(this), {
              $$: {
                  value: shallowCopyInternalPointer(this.$$),
              }
          });
  
          clone.$$.count.value += 1;
          clone.$$.deleteScheduled = false;
          return clone;
      }
    }
  
  
  function runDestructor(handle) {
      var $$ = handle.$$;
      if ($$.smartPtr) {
          $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
          $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }function ClassHandle_delete() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
          throwBindingError('Object already scheduled for deletion');
      }
  
      this.$$.count.value -= 1;
      var toDelete = 0 === this.$$.count.value;
      if (toDelete) {
          runDestructor(this);
      }
      if (!this.$$.preservePointerOnDelete) {
          this.$$.smartPtr = undefined;
          this.$$.ptr = undefined;
      }
    }
  
  function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }
  
  
  var delayFunction=undefined;
  
  var deletionQueue=[];
  
  function flushPendingDeletes() {
      while (deletionQueue.length) {
          var obj = deletionQueue.pop();
          obj.$$.deleteScheduled = false;
          obj['delete']();
      }
    }function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
          throwBindingError('Object already scheduled for deletion');
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
          delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }function ClassHandle() {
    }
  
  var registeredPointers={};
  
  
  function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
          var prevFunc = proto[methodName];
          // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
          proto[methodName] = function() {
              // TODO This check can be removed in -O3 level "unsafe" optimizations.
              if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                  throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
              }
              return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
          };
          // Move the previous function into the overload table.
          proto[methodName].overloadTable = [];
          proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
          if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
              throwBindingError("Cannot register public name '" + name + "' twice");
          }
  
          // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
          // that routes between the two.
          ensureOverloadTable(Module, name, name);
          if (Module.hasOwnProperty(numArguments)) {
              throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
          }
          // Add the new function into the overload table.
          Module[name].overloadTable[numArguments] = value;
      }
      else {
          Module[name] = value;
          if (undefined !== numArguments) {
              Module[name].numArguments = numArguments;
          }
      }
    }
  
  function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast
    ) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
  
  
  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
          return 0;
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  function genericPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
  
          if (this.isSmartPointer) {
              var ptr = this.rawConstructor();
              if (destructors !== null) {
                  destructors.push(this.rawDestructor, ptr);
              }
              return ptr;
          } else {
              return 0;
          }
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  
      if (this.isSmartPointer) {
          // TODO: this is not strictly true
          // We could support BY_EMVAL conversions from raw pointers to smart pointers
          // because the smart pointer can hold a reference to the handle
          if (undefined === handle.$$.smartPtr) {
              throwBindingError('Passing raw pointer to smart pointer is illegal');
          }
  
          switch (this.sharingPolicy) {
              case 0: // NONE
                  // no upcasting
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                  }
                  break;
  
              case 1: // INTRUSIVE
                  ptr = handle.$$.smartPtr;
                  break;
  
              case 2: // BY_EMVAL
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      var clonedHandle = handle['clone']();
                      ptr = this.rawShare(
                          ptr,
                          __emval_register(function() {
                              clonedHandle['delete']();
                          })
                      );
                      if (destructors !== null) {
                          destructors.push(this.rawDestructor, ptr);
                      }
                  }
                  break;
  
              default:
                  throwBindingError('Unsupporting sharing policy');
          }
      }
      return ptr;
    }
  
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
          return 0;
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }
  
  function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
          ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }
  
  function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
          this.rawDestructor(ptr);
      }
    }
  
  function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
          handle['delete']();
      }
    }
  
  
  function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
          return ptr;
      }
      if (undefined === desiredClass.baseClass) {
          return null; // no conversion
      }
  
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
          return null;
      }
      return desiredClass.downcast(rv);
    }
  
  
  
  
  function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }
  
  function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
          if (registeredInstances.hasOwnProperty(k)) {
              rv.push(registeredInstances[k]);
          }
      }
      return rv;
    }
  
  function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
          delayFunction(flushPendingDeletes);
      }
    }function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }var registeredInstances={};
  
  function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    }function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }
  
  function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
          throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
          throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return Object.create(prototype, {
          $$: {
              value: record,
          },
      });
    }function RegisteredPointer_fromWireType(ptr) {
      // ptr is a raw pointer (or a raw smartpointer)
  
      // rawPointer is a maybe-null raw pointer
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
          this.destructor(ptr);
          return null;
      }
  
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
          // JS object has been neutered, time to repopulate it
          if (0 === registeredInstance.$$.count.value) {
              registeredInstance.$$.ptr = rawPointer;
              registeredInstance.$$.smartPtr = ptr;
              return registeredInstance['clone']();
          } else {
              // else, just increment reference count on existing object
              // it already has a reference to the smart pointer
              var rv = registeredInstance['clone']();
              this.destructor(ptr);
              return rv;
          }
      }
  
      function makeDefaultHandle() {
          if (this.isSmartPointer) {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this.pointeeType,
                  ptr: rawPointer,
                  smartPtrType: this,
                  smartPtr: ptr,
              });
          } else {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this,
                  ptr: ptr,
              });
          }
      }
  
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
          return makeDefaultHandle.call(this);
      }
  
      var toType;
      if (this.isConst) {
          toType = registeredPointerRecord.constPointerType;
      } else {
          toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
          rawPointer,
          this.registeredClass,
          toType.registeredClass);
      if (dp === null) {
          return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
              smartPtrType: this,
              smartPtr: ptr,
          });
      } else {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
          });
      }
    }function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
  
      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
  
      // smart pointer properties
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
  
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
          if (isConst) {
              this['toWireType'] = constNoSmartPtrRawPointerToWireType;
              this.destructorFunction = null;
          } else {
              this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
              this.destructorFunction = null;
          }
      } else {
          this['toWireType'] = genericPointerToWireType;
          // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
          // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
          // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
          //       craftInvokerFunction altogether.
      }
    }
  
  function replacePublicSymbol(name, value, numArguments) {
      if (!Module.hasOwnProperty(name)) {
          throwInternalError('Replacing nonexistant public symbol');
      }
      // If there's an overload table for this symbol, replace the symbol in the overload table instead.
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
          Module[name].overloadTable[numArguments] = value;
      }
      else {
          Module[name] = value;
          Module[name].argCount = numArguments;
      }
    }function __embind_register_class(
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor
    ) {
      name = readLatin1String(name);
      getActualType = requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
          upcast = requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
          downcast = requireFunction(downcastSignature, downcast);
      }
      rawDestructor = requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
  
      exposePublicSymbol(legalFunctionName, function() {
          // this code cannot run if baseClassRawType is zero
          throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
      });
  
      whenDependentTypesAreResolved(
          [rawType, rawPointerType, rawConstPointerType],
          baseClassRawType ? [baseClassRawType] : [],
          function(base) {
              base = base[0];
  
              var baseClass;
              var basePrototype;
              if (baseClassRawType) {
                  baseClass = base.registeredClass;
                  basePrototype = baseClass.instancePrototype;
              } else {
                  basePrototype = ClassHandle.prototype;
              }
  
              var constructor = createNamedFunction(legalFunctionName, function() {
                  if (Object.getPrototypeOf(this) !== instancePrototype) {
                      throw new BindingError("Use 'new' to construct " + name);
                  }
                  if (undefined === registeredClass.constructor_body) {
                      throw new BindingError(name + " has no accessible constructor");
                  }
                  var body = registeredClass.constructor_body[arguments.length];
                  if (undefined === body) {
                      throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                  }
                  return body.apply(this, arguments);
              });
  
              var instancePrototype = Object.create(basePrototype, {
                  constructor: { value: constructor },
              });
  
              constructor.prototype = instancePrototype;
  
              var registeredClass = new RegisteredClass(
                  name,
                  constructor,
                  instancePrototype,
                  rawDestructor,
                  baseClass,
                  getActualType,
                  upcast,
                  downcast);
  
              var referenceConverter = new RegisteredPointer(
                  name,
                  registeredClass,
                  true,
                  false,
                  false);
  
              var pointerConverter = new RegisteredPointer(
                  name + '*',
                  registeredClass,
                  false,
                  false,
                  false);
  
              var constPointerConverter = new RegisteredPointer(
                  name + ' const*',
                  registeredClass,
                  false,
                  true,
                  false);
  
              registeredPointers[rawType] = {
                  pointerType: pointerConverter,
                  constPointerType: constPointerConverter
              };
  
              replacePublicSymbol(legalFunctionName, constructor);
  
              return [referenceConverter, pointerConverter, constPointerConverter];
          }
      );
    }

  function ___lock() {}

  function ___unlock() {}

  
  var emval_free_list=[];
  
  var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
          emval_handle_array[handle] = undefined;
          emval_free_list.push(handle);
      }
    }

  
  var PTHREAD_SPECIFIC={};function _pthread_getspecific(key) {
      return PTHREAD_SPECIFIC[key] || 0;
    }

  function __embind_finalize_value_object(structType) {
      var reg = structRegistrations[structType];
      delete structRegistrations[structType];
  
      var rawConstructor = reg.rawConstructor;
      var rawDestructor = reg.rawDestructor;
      var fieldRecords = reg.fields;
      var fieldTypes = fieldRecords.map(function(field) { return field.getterReturnType; }).
                concat(fieldRecords.map(function(field) { return field.setterArgumentType; }));
      whenDependentTypesAreResolved([structType], fieldTypes, function(fieldTypes) {
          var fields = {};
          fieldRecords.forEach(function(field, i) {
              var fieldName = field.fieldName;
              var getterReturnType = fieldTypes[i];
              var getter = field.getter;
              var getterContext = field.getterContext;
              var setterArgumentType = fieldTypes[i + fieldRecords.length];
              var setter = field.setter;
              var setterContext = field.setterContext;
              fields[fieldName] = {
                  read: function(ptr) {
                      return getterReturnType['fromWireType'](
                          getter(getterContext, ptr));
                  },
                  write: function(ptr, o) {
                      var destructors = [];
                      setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                      runDestructors(destructors);
                  }
              };
          });
  
          return [{
              name: reg.name,
              'fromWireType': function(ptr) {
                  var rv = {};
                  for (var i in fields) {
                      rv[i] = fields[i].read(ptr);
                  }
                  rawDestructor(ptr);
                  return rv;
              },
              'toWireType': function(destructors, o) {
                  // todo: Here we have an opportunity for -O3 level "unsafe" optimizations:
                  // assume all fields are present without checking.
                  for (var fieldName in fields) {
                      if (!(fieldName in o)) {
                          throw new TypeError('Missing field');
                      }
                  }
                  var ptr = rawConstructor();
                  for (fieldName in fields) {
                      fields[fieldName].write(ptr, o[fieldName]);
                  }
                  if (destructors !== null) {
                      destructors.push(rawDestructor, ptr);
                  }
                  return ptr;
              },
              'argPackAdvance': 8,
              'readValueFromPointer': simpleReadValueFromPointer,
              destructorFunction: rawDestructor,
          }];
      });
    }

  
  var PTHREAD_SPECIFIC_NEXT_KEY=1;
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _pthread_key_create(key, destructor) {
      if (key == 0) {
        return ERRNO_CODES.EINVAL;
      }
      HEAP32[((key)>>2)]=PTHREAD_SPECIFIC_NEXT_KEY;
      // values start at 0
      PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
      PTHREAD_SPECIFIC_NEXT_KEY++;
      return 0;
    }

  
  
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              ++count;
          }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              return emval_handle_array[i];
          }
      }
      return null;
    }function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }function __emval_register(value) {
  
      switch(value){
        case undefined :{ return 1; }
        case null :{ return 2; }
        case true :{ return 3; }
        case false :{ return 4; }
        default:{
          var handle = emval_free_list.length ?
              emval_free_list.pop() :
              emval_handle_array.length;
  
          emval_handle_array[handle] = {refcount: 1, value: value};
          return handle;
          }
        }
    }
  
  function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
          throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
      }
      return impl;
    }function __emval_take_value(type, argv) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](argv);
      return __emval_register(v);
    }

  
  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
      
      var fromWireType = function(value) {
          return value;
      };
      
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.indexOf('unsigned') != -1);
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = emval_handle_array[handle].value;
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return __emval_register(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  function _pthread_setspecific(key, value) {
      if (!(key in PTHREAD_SPECIFIC)) {
        return ERRNO_CODES.EINVAL;
      }
      PTHREAD_SPECIFIC[key] = value;
      return 0;
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  var SYSCALLS={varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

   

  
  function heap32VectorToArray(count, firstElement) {
      var array = [];
      for (var i = 0; i < count; i++) {
          array.push(HEAP32[(firstElement >> 2) + i]);
      }
      return array;
    }function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = requireFunction(invokerSignature, invoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = 'constructor ' + classType.name;
  
          if (undefined === classType.registeredClass.constructor_body) {
              classType.registeredClass.constructor_body = [];
          }
          if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
              throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
          }
          classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
              throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
          };
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
              classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                  if (arguments.length !== argCount - 1) {
                      throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                  }
                  var destructors = [];
                  var args = new Array(argCount);
                  args[0] = rawConstructor;
                  for (var i = 1; i < argCount; ++i) {
                      args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                  }
  
                  var ptr = invoker.apply(null, args);
                  runDestructors(destructors);
  
                  return argTypes[0]['fromWireType'](ptr);
              };
              return [];
          });
          return [];
      });
    }

  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __emval_incref(handle) {
      if (handle > 4) {
          emval_handle_array[handle].refcount += 1;
      }
    }

  function ___cxa_find_matching_catch_2() {
          return ___cxa_find_matching_catch.apply(null, arguments);
        }

  function ___cxa_find_matching_catch_3() {
          return ___cxa_find_matching_catch.apply(null, arguments);
        }

  function ___cxa_begin_catch(ptr) {
      var info = EXCEPTIONS.infos[ptr];
      if (info && !info.caught) {
        info.caught = true;
        __ZSt18uncaught_exceptionv.uncaught_exception--;
      }
      if (info) info.rethrown = false;
      EXCEPTIONS.caught.push(ptr);
      EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
      return ptr;
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  
  var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_STATIC);   

  function __embind_register_enum_value(
      rawEnumType,
      name,
      enumValue
    ) {
      var enumType = requireRegisteredType(rawEnumType, 'enum');
      name = readLatin1String(name);
  
      var Enum = enumType.constructor;
  
      var Value = Object.create(enumType.constructor.prototype, {
          value: {value: enumValue},
          constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
      });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else Module.printErr('failed to set errno from JS');
      return value;
    } 

  function __embind_register_std_wstring(rawType, charSize, name) {
      // nb. do not cache HEAPU16 and HEAPU32, they may be destroyed by enlargeMemory().
      name = readLatin1String(name);
      var getHeap, shift;
      if (charSize === 2) {
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var HEAP = getHeap();
              var length = HEAPU32[value >> 2];
              var a = new Array(length);
              var start = (value + 4) >> shift;
              for (var i = 0; i < length; ++i) {
                  a[i] = String.fromCharCode(HEAP[start + i]);
              }
              _free(value);
              return a.join('');
          },
          'toWireType': function(destructors, value) {
              // assumes 4-byte alignment
              var HEAP = getHeap();
              var length = value.length;
              var ptr = _malloc(4 + length * charSize);
              HEAPU32[ptr >> 2] = length;
              var start = (ptr + 4) >> shift;
              for (var i = 0; i < length; ++i) {
                  HEAP[start + i] = value.charCodeAt(i);
              }
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function ___gxx_personality_v0() {
    }

   

   

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
          handle = handle >> 2;
          var heap = HEAPU32;
          var size = heap[handle]; // in elements
          var data = heap[handle + 1]; // byte offset into emscripten heap
          return new TA(heap['buffer'], data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': decodeMemoryView,
          'argPackAdvance': 8,
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }


  function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  
  function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
          throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
      }
  
      /*
       * Previously, the following line was just:
  
       function dummy() {};
  
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
       * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
       * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
       * to write a test for this behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructor.prototype;
      var obj = new dummy;
  
      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    }function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      var argCount = argTypes.length;
  
      if (argCount < 2) {
          throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  
  
      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = false;
  
      for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
          if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
              needsDestructorStack = true;
              break;
          }
      }
  
      var returns = (argTypes[0].name !== "void");
  
      var argsList = "";
      var argsListWired = "";
      for(var i = 0; i < argCount - 2; ++i) {
          argsList += (i!==0?", ":"")+"arg"+i;
          argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
      }
  
      var invokerFnBody =
          "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
          "if (arguments.length !== "+(argCount - 2)+") {\n" +
              "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
          "}\n";
  
  
      if (needsDestructorStack) {
          invokerFnBody +=
              "var destructors = [];\n";
      }
  
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  
  
      if (isClassMethodFunc) {
          invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
      }
  
      for(var i = 0; i < argCount - 2; ++i) {
          invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
          args1.push("argType"+i);
          args2.push(argTypes[i+2]);
      }
  
      if (isClassMethodFunc) {
          argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
      if (needsDestructorStack) {
          invokerFnBody += "runDestructors(destructors);\n";
      } else {
          for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
              var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
              if (argTypes[i].destructorFunction !== null) {
                  invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                  args1.push(paramName+"_dtor");
                  args2.push(argTypes[i].destructorFunction);
              }
          }
      }
  
      if (returns) {
          invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                           "return ret;\n";
      } else {
      }
      invokerFnBody += "}\n";
  
      args1.push(invokerFnBody);
  
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }function __embind_register_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + methodName;
  
          if (isPureVirtual) {
              classType.registeredClass.pureVirtualFunctions.push(methodName);
          }
  
          function unboundTypesHandler() {
              throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
          }
  
          var proto = classType.registeredClass.instancePrototype;
          var method = proto[methodName];
          if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
              // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
              unboundTypesHandler.argCount = argCount - 2;
              unboundTypesHandler.className = classType.name;
              proto[methodName] = unboundTypesHandler;
          } else {
              // There was an existing function with the same name registered. Set up a function overload routing table.
              ensureOverloadTable(proto, methodName, humanName);
              proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
          }
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
  
              var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
  
              // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
              // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
              if (undefined === proto[methodName].overloadTable) {
                  // Set argCount in case an overload is registered later
                  memberFunction.argCount = argCount - 2;
                  proto[methodName] = memberFunction;
              } else {
                  proto[methodName].overloadTable[argCount - 2] = memberFunction;
              }
  
              return [];
          });
          return [];
      });
    }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      // hack to support printf in NO_FILESYSTEM
      var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      var ret = 0;
      if (!___syscall146.buffer) {
        ___syscall146.buffers = [null, [], []]; // 1 => stdout, 2 => stderr
        ___syscall146.printChar = function(stream, curr) {
          var buffer = ___syscall146.buffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? Module['print'] : Module['printErr'])(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
      }
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          ___syscall146.printChar(stream, HEAPU8[ptr+j]);
        }
        ret += len;
      }
      return ret;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
          case 0: return function(pointer) {
              var heap = signed ? HEAP8 : HEAPU8;
              return this['fromWireType'](heap[pointer]);
          };
          case 1: return function(pointer) {
              var heap = signed ? HEAP16 : HEAPU16;
              return this['fromWireType'](heap[pointer >> 1]);
          };
          case 2: return function(pointer) {
              var heap = signed ? HEAP32 : HEAPU32;
              return this['fromWireType'](heap[pointer >> 2]);
          };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_enum(
      rawType,
      name,
      size,
      isSigned
    ) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
  
      function ctor() {
      }
      ctor.values = {};
  
      registerType(rawType, {
          name: name,
          constructor: ctor,
          'fromWireType': function(c) {
              return this.constructor.values[c];
          },
          'toWireType': function(destructors, c) {
              return c.value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
          destructorFunction: null,
      });
      exposePublicSymbol(name, ctor);
    }

  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
              var a = new Array(length);
              for (var i = 0; i < length; ++i) {
                  a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
              }
              _free(value);
              return a.join('');
          },
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              function getTAElement(ta, index) {
                  return ta[index];
              }
              function getStringElement(string, index) {
                  return string.charCodeAt(index);
              }
              var getElement;
              if (value instanceof Uint8Array) {
                  getElement = getTAElement;
              } else if (value instanceof Uint8ClampedArray) {
                  getElement = getTAElement;
              } else if (value instanceof Int8Array) {
                  getElement = getTAElement;
              } else if (typeof value === 'string') {
                  getElement = getStringElement;
              } else {
                  throwBindingError('Cannot pass non-string to std::string');
              }
  
              // assumes 4-byte alignment
              var length = value.length;
              var ptr = _malloc(4 + length);
              HEAPU32[ptr >> 2] = length;
              for (var i = 0; i < length; ++i) {
                  var charCode = getElement(value, i);
                  if (charCode > 255) {
                      _free(ptr);
                      throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                  }
                  HEAPU8[ptr + 4 + i] = charCode;
              }
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_ClassHandle();
init_RegisteredPointer();
init_embind();;
init_emval();;
/* flush anything remaining in the buffer during shutdown */ __ATEXIT__.push(function() { var fflush = Module["_fflush"]; if (fflush) fflush(0); var printChar = ___syscall146.printChar; if (!printChar) return; var buffers = ___syscall146.buffers; if (buffers[1].length) printChar(1, 10); if (buffers[2].length) printChar(2, 10); });;
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);

STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");


function nullFunc_iiiii(x) { Module["printErr"]("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_dii(x) { Module["printErr"]("Invalid function pointer called with signature 'dii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viiiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_i(x) { Module["printErr"]("Invalid function pointer called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vi(x) { Module["printErr"]("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vii(x) { Module["printErr"]("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_ii(x) { Module["printErr"]("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiii(x) { Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viii(x) { Module["printErr"]("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_v(x) { Module["printErr"]("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viid(x) { Module["printErr"]("Invalid function pointer called with signature 'viid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viiiiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iii(x) { Module["printErr"]("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_dii(index,a1,a2) {
  try {
    return Module["dynCall_dii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viid(index,a1,a2,a3) {
  try {
    Module["dynCall_viid"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "abortStackOverflow": abortStackOverflow, "nullFunc_iiiii": nullFunc_iiiii, "nullFunc_dii": nullFunc_dii, "nullFunc_viiiii": nullFunc_viiiii, "nullFunc_i": nullFunc_i, "nullFunc_vi": nullFunc_vi, "nullFunc_vii": nullFunc_vii, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_viii": nullFunc_viii, "nullFunc_v": nullFunc_v, "nullFunc_viid": nullFunc_viid, "nullFunc_viiiiii": nullFunc_viiiiii, "nullFunc_iii": nullFunc_iii, "nullFunc_viiii": nullFunc_viiii, "invoke_iiiii": invoke_iiiii, "invoke_dii": invoke_dii, "invoke_viiiii": invoke_viiiii, "invoke_i": invoke_i, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_viid": invoke_viid, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "floatReadValueFromPointer": floatReadValueFromPointer, "simpleReadValueFromPointer": simpleReadValueFromPointer, "throwInternalError": throwInternalError, "get_first_emval": get_first_emval, "getLiveInheritedInstances": getLiveInheritedInstances, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "ClassHandle": ClassHandle, "getShiftFromSize": getShiftFromSize, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "runDestructor": runDestructor, "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted, "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType, "init_RegisteredPointer": init_RegisteredPointer, "ClassHandle_isAliasOf": ClassHandle_isAliasOf, "flushPendingDeletes": flushPendingDeletes, "__embind_register_enum_value": __embind_register_enum_value, "makeClassHandle": makeClassHandle, "whenDependentTypesAreResolved": whenDependentTypesAreResolved, "__embind_register_class_constructor": __embind_register_class_constructor, "init_ClassHandle": init_ClassHandle, "___syscall140": ___syscall140, "ClassHandle_clone": ClassHandle_clone, "___syscall146": ___syscall146, "RegisteredClass": RegisteredClass, "___cxa_free_exception": ___cxa_free_exception, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "__embind_register_value_object_field": __embind_register_value_object_field, "embind_init_charCodes": embind_init_charCodes, "___setErrNo": ___setErrNo, "__embind_register_bool": __embind_register_bool, "___resumeException": ___resumeException, "createNamedFunction": createNamedFunction, "__embind_register_class_property": __embind_register_class_property, "__embind_register_emval": __embind_register_emval, "__embind_finalize_value_object": __embind_finalize_value_object, "__emval_decref": __emval_decref, "_pthread_once": _pthread_once, "__embind_register_class": __embind_register_class, "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType, "heap32VectorToArray": heap32VectorToArray, "ClassHandle_delete": ClassHandle_delete, "RegisteredPointer_destructor": RegisteredPointer_destructor, "___syscall6": ___syscall6, "ensureOverloadTable": ensureOverloadTable, "new_": new_, "downcastPointer": downcastPointer, "replacePublicSymbol": replacePublicSymbol, "init_embind": init_embind, "ClassHandle_deleteLater": ClassHandle_deleteLater, "integerReadValueFromPointer": integerReadValueFromPointer, "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject, "ClassHandle_isDeleted": ClassHandle_isDeleted, "__embind_register_integer": __embind_register_integer, "___cxa_allocate_exception": ___cxa_allocate_exception, "__emval_take_value": __emval_take_value, "___cxa_end_catch": ___cxa_end_catch, "__embind_register_value_object": __embind_register_value_object, "enumReadValueFromPointer": enumReadValueFromPointer, "_embind_repr": _embind_repr, "_pthread_getspecific": _pthread_getspecific, "RegisteredPointer": RegisteredPointer, "craftInvokerFunction": craftInvokerFunction, "runDestructors": runDestructors, "requireRegisteredType": requireRegisteredType, "makeLegalFunctionName": makeLegalFunctionName, "_pthread_key_create": _pthread_key_create, "upcastPointer": upcastPointer, "init_emval": init_emval, "shallowCopyInternalPointer": shallowCopyInternalPointer, "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType, "_abort": _abort, "throwBindingError": throwBindingError, "getTypeName": getTypeName, "validateThis": validateThis, "exposePublicSymbol": exposePublicSymbol, "__embind_register_std_string": __embind_register_std_string, "___lock": ___lock, "__embind_register_memory_view": __embind_register_memory_view, "getInheritedInstance": getInheritedInstance, "setDelayFunction": setDelayFunction, "___gxx_personality_v0": ___gxx_personality_v0, "extendError": extendError, "__embind_register_void": __embind_register_void, "___cxa_find_matching_catch_3": ___cxa_find_matching_catch_3, "RegisteredPointer_getPointee": RegisteredPointer_getPointee, "__emval_register": __emval_register, "___cxa_find_matching_catch_2": ___cxa_find_matching_catch_2, "__embind_register_class_function": __embind_register_class_function, "__emval_incref": __emval_incref, "throwUnboundTypeError": throwUnboundTypeError, "readLatin1String": readLatin1String, "getBasestPointer": getBasestPointer, "getInheritedInstanceCount": getInheritedInstanceCount, "__embind_register_float": __embind_register_float, "___syscall54": ___syscall54, "___unlock": ___unlock, "__embind_register_std_wstring": __embind_register_std_wstring, "_pthread_setspecific": _pthread_setspecific, "genericPointerToWireType": genericPointerToWireType, "registerType": registerType, "___cxa_throw": ___cxa_throw, "__embind_register_enum": __embind_register_enum, "count_emval_handles": count_emval_handles, "requireFunction": requireFunction, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "cttz_i8": cttz_i8 };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
'almost asm';


  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);

  var DYNAMICTOP_PTR=env.DYNAMICTOP_PTR|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntS = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;

  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var enlargeMemory=env.enlargeMemory;
  var getTotalMemory=env.getTotalMemory;
  var abortOnCannotGrowMemory=env.abortOnCannotGrowMemory;
  var abortStackOverflow=env.abortStackOverflow;
  var nullFunc_iiiii=env.nullFunc_iiiii;
  var nullFunc_dii=env.nullFunc_dii;
  var nullFunc_viiiii=env.nullFunc_viiiii;
  var nullFunc_i=env.nullFunc_i;
  var nullFunc_vi=env.nullFunc_vi;
  var nullFunc_vii=env.nullFunc_vii;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_viii=env.nullFunc_viii;
  var nullFunc_v=env.nullFunc_v;
  var nullFunc_viid=env.nullFunc_viid;
  var nullFunc_viiiiii=env.nullFunc_viiiiii;
  var nullFunc_iii=env.nullFunc_iii;
  var nullFunc_viiii=env.nullFunc_viiii;
  var invoke_iiiii=env.invoke_iiiii;
  var invoke_dii=env.invoke_dii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_i=env.invoke_i;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_ii=env.invoke_ii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viii=env.invoke_viii;
  var invoke_v=env.invoke_v;
  var invoke_viid=env.invoke_viid;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_iii=env.invoke_iii;
  var invoke_viiii=env.invoke_viiii;
  var floatReadValueFromPointer=env.floatReadValueFromPointer;
  var simpleReadValueFromPointer=env.simpleReadValueFromPointer;
  var throwInternalError=env.throwInternalError;
  var get_first_emval=env.get_first_emval;
  var getLiveInheritedInstances=env.getLiveInheritedInstances;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var ClassHandle=env.ClassHandle;
  var getShiftFromSize=env.getShiftFromSize;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var runDestructor=env.runDestructor;
  var throwInstanceAlreadyDeleted=env.throwInstanceAlreadyDeleted;
  var RegisteredPointer_fromWireType=env.RegisteredPointer_fromWireType;
  var init_RegisteredPointer=env.init_RegisteredPointer;
  var ClassHandle_isAliasOf=env.ClassHandle_isAliasOf;
  var flushPendingDeletes=env.flushPendingDeletes;
  var __embind_register_enum_value=env.__embind_register_enum_value;
  var makeClassHandle=env.makeClassHandle;
  var whenDependentTypesAreResolved=env.whenDependentTypesAreResolved;
  var __embind_register_class_constructor=env.__embind_register_class_constructor;
  var init_ClassHandle=env.init_ClassHandle;
  var ___syscall140=env.___syscall140;
  var ClassHandle_clone=env.ClassHandle_clone;
  var ___syscall146=env.___syscall146;
  var RegisteredClass=env.RegisteredClass;
  var ___cxa_free_exception=env.___cxa_free_exception;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var __embind_register_value_object_field=env.__embind_register_value_object_field;
  var embind_init_charCodes=env.embind_init_charCodes;
  var ___setErrNo=env.___setErrNo;
  var __embind_register_bool=env.__embind_register_bool;
  var ___resumeException=env.___resumeException;
  var createNamedFunction=env.createNamedFunction;
  var __embind_register_class_property=env.__embind_register_class_property;
  var __embind_register_emval=env.__embind_register_emval;
  var __embind_finalize_value_object=env.__embind_finalize_value_object;
  var __emval_decref=env.__emval_decref;
  var _pthread_once=env._pthread_once;
  var __embind_register_class=env.__embind_register_class;
  var constNoSmartPtrRawPointerToWireType=env.constNoSmartPtrRawPointerToWireType;
  var heap32VectorToArray=env.heap32VectorToArray;
  var ClassHandle_delete=env.ClassHandle_delete;
  var RegisteredPointer_destructor=env.RegisteredPointer_destructor;
  var ___syscall6=env.___syscall6;
  var ensureOverloadTable=env.ensureOverloadTable;
  var new_=env.new_;
  var downcastPointer=env.downcastPointer;
  var replacePublicSymbol=env.replacePublicSymbol;
  var init_embind=env.init_embind;
  var ClassHandle_deleteLater=env.ClassHandle_deleteLater;
  var integerReadValueFromPointer=env.integerReadValueFromPointer;
  var RegisteredPointer_deleteObject=env.RegisteredPointer_deleteObject;
  var ClassHandle_isDeleted=env.ClassHandle_isDeleted;
  var __embind_register_integer=env.__embind_register_integer;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var __emval_take_value=env.__emval_take_value;
  var ___cxa_end_catch=env.___cxa_end_catch;
  var __embind_register_value_object=env.__embind_register_value_object;
  var enumReadValueFromPointer=env.enumReadValueFromPointer;
  var _embind_repr=env._embind_repr;
  var _pthread_getspecific=env._pthread_getspecific;
  var RegisteredPointer=env.RegisteredPointer;
  var craftInvokerFunction=env.craftInvokerFunction;
  var runDestructors=env.runDestructors;
  var requireRegisteredType=env.requireRegisteredType;
  var makeLegalFunctionName=env.makeLegalFunctionName;
  var _pthread_key_create=env._pthread_key_create;
  var upcastPointer=env.upcastPointer;
  var init_emval=env.init_emval;
  var shallowCopyInternalPointer=env.shallowCopyInternalPointer;
  var nonConstNoSmartPtrRawPointerToWireType=env.nonConstNoSmartPtrRawPointerToWireType;
  var _abort=env._abort;
  var throwBindingError=env.throwBindingError;
  var getTypeName=env.getTypeName;
  var validateThis=env.validateThis;
  var exposePublicSymbol=env.exposePublicSymbol;
  var __embind_register_std_string=env.__embind_register_std_string;
  var ___lock=env.___lock;
  var __embind_register_memory_view=env.__embind_register_memory_view;
  var getInheritedInstance=env.getInheritedInstance;
  var setDelayFunction=env.setDelayFunction;
  var ___gxx_personality_v0=env.___gxx_personality_v0;
  var extendError=env.extendError;
  var __embind_register_void=env.__embind_register_void;
  var ___cxa_find_matching_catch_3=env.___cxa_find_matching_catch_3;
  var RegisteredPointer_getPointee=env.RegisteredPointer_getPointee;
  var __emval_register=env.__emval_register;
  var ___cxa_find_matching_catch_2=env.___cxa_find_matching_catch_2;
  var __embind_register_class_function=env.__embind_register_class_function;
  var __emval_incref=env.__emval_incref;
  var throwUnboundTypeError=env.throwUnboundTypeError;
  var readLatin1String=env.readLatin1String;
  var getBasestPointer=env.getBasestPointer;
  var getInheritedInstanceCount=env.getInheritedInstanceCount;
  var __embind_register_float=env.__embind_register_float;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var __embind_register_std_wstring=env.__embind_register_std_wstring;
  var _pthread_setspecific=env._pthread_setspecific;
  var genericPointerToWireType=env.genericPointerToWireType;
  var registerType=env.registerType;
  var ___cxa_throw=env.___cxa_throw;
  var __embind_register_enum=env.__embind_register_enum;
  var count_emval_handles=env.count_emval_handles;
  var requireFunction=env.requireFunction;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS

function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
  if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(size|0);

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function establishStackSpace(stackBase, stackMax) {
  stackBase = stackBase|0;
  stackMax = stackMax|0;
  STACKTOP = stackBase;
  STACK_MAX = stackMax;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function ___cxx_global_var_init() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN44EmscriptenBindingInitializer_packet_bindingsC2Ev(8864);
 return;
}
function __ZN44EmscriptenBindingInitializer_packet_bindingsC2Ev($0) {
 $0 = $0|0;
 var $$byval_copy = 0, $$byval_copy110 = 0, $$byval_copy111 = 0, $$byval_copy112 = 0, $$field = 0, $$field103 = 0, $$field106 = 0, $$field11 = 0, $$field14 = 0, $$field21 = 0, $$field24 = 0, $$field31 = 0, $$field34 = 0, $$field4 = 0, $$field43 = 0, $$field46 = 0, $$field49 = 0, $$field52 = 0, $$field59 = 0, $$field62 = 0;
 var $$field67 = 0, $$field70 = 0, $$field79 = 0, $$field82 = 0, $$field85 = 0, $$field88 = 0, $$field95 = 0, $$field98 = 0, $$index1 = 0, $$index101 = 0, $$index105 = 0, $$index109 = 0, $$index13 = 0, $$index17 = 0, $$index19 = 0, $$index23 = 0, $$index27 = 0, $$index29 = 0, $$index3 = 0, $$index33 = 0;
 var $$index37 = 0, $$index39 = 0, $$index41 = 0, $$index45 = 0, $$index51 = 0, $$index55 = 0, $$index57 = 0, $$index61 = 0, $$index65 = 0, $$index69 = 0, $$index7 = 0, $$index73 = 0, $$index75 = 0, $$index77 = 0, $$index81 = 0, $$index87 = 0, $$index9 = 0, $$index91 = 0, $$index93 = 0, $$index97 = 0;
 var $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0;
 var $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0;
 var $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0;
 var $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0;
 var $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0;
 var $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0;
 var $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0;
 var $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0;
 var $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0;
 var $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0;
 var $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0;
 var $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0;
 var $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0;
 var $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0;
 var $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0;
 var $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0;
 var $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0;
 var $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0;
 var $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0;
 var $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0;
 var $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0;
 var $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0;
 var $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0;
 var $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0;
 var $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0;
 var $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0;
 var $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0;
 var $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0;
 var $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0;
 var $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0;
 var $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0;
 var $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0;
 var $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 928|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(928|0);
 $$byval_copy112 = sp + 888|0;
 $$byval_copy111 = sp + 880|0;
 $$byval_copy110 = sp + 872|0;
 $$byval_copy = sp + 864|0;
 $5 = sp + 840|0;
 $6 = sp + 832|0;
 $9 = sp + 816|0;
 $10 = sp + 808|0;
 $11 = sp + 56|0;
 $12 = sp + 48|0;
 $17 = sp + 784|0;
 $18 = sp + 776|0;
 $21 = sp + 760|0;
 $22 = sp + 752|0;
 $23 = sp + 40|0;
 $24 = sp + 32|0;
 $29 = sp + 728|0;
 $36 = sp + 700|0;
 $43 = sp + 672|0;
 $50 = sp + 644|0;
 $57 = sp + 616|0;
 $64 = sp + 588|0;
 $71 = sp + 560|0;
 $78 = sp + 532|0;
 $85 = sp + 504|0;
 $92 = sp + 476|0;
 $99 = sp + 448|0;
 $106 = sp + 420|0;
 $113 = sp + 392|0;
 $120 = sp + 364|0;
 $127 = sp + 336|0;
 $134 = sp + 308|0;
 $140 = sp + 280|0;
 $142 = sp + 917|0;
 $143 = sp + 24|0;
 $147 = sp + 256|0;
 $149 = sp + 916|0;
 $150 = sp + 16|0;
 $154 = sp + 232|0;
 $156 = sp + 915|0;
 $157 = sp + 8|0;
 $161 = sp + 208|0;
 $163 = sp + 914|0;
 $164 = sp;
 $168 = sp + 913|0;
 $182 = sp + 912|0;
 $183 = sp + 911|0;
 $184 = sp + 910|0;
 $185 = sp + 909|0;
 $188 = sp + 908|0;
 $189 = sp + 907|0;
 $190 = sp + 906|0;
 $191 = sp + 905|0;
 $192 = sp + 904|0;
 $193 = sp + 903|0;
 $194 = sp + 902|0;
 $195 = sp + 901|0;
 $196 = sp + 900|0;
 $197 = sp + 899|0;
 $198 = sp + 898|0;
 $199 = sp + 897|0;
 $200 = sp + 896|0;
 $201 = sp + 120|0;
 $202 = sp + 112|0;
 $203 = sp + 104|0;
 $204 = sp + 96|0;
 $205 = sp + 88|0;
 $206 = sp + 80|0;
 $207 = sp + 72|0;
 $208 = sp + 64|0;
 $181 = $0;
 __ZN10emscripten15register_vectorIhEENS_6class_INSt3__26vectorIT_NS2_9allocatorIS4_EEEENS_8internal11NoBaseClassEEEPKc(1648);
 __ZN10emscripten5enum_IN5Motor5StateEEC2EPKc($182,1658);
 $209 = (__ZN10emscripten5enum_IN5Motor5StateEE5valueEPKcS2_($182,1669,0)|0);
 $210 = (__ZN10emscripten5enum_IN5Motor5StateEE5valueEPKcS2_($209,1673,1)|0);
 (__ZN10emscripten5enum_IN5Motor5StateEE5valueEPKcS2_($210,1676,2)|0);
 __ZN10emscripten5enum_IN10SmartDrive5UnitsEEC2EPKc($183,1682);
 $211 = (__ZN10emscripten5enum_IN10SmartDrive5UnitsEE5valueEPKcS2_($183,1688,0)|0);
 (__ZN10emscripten5enum_IN10SmartDrive5UnitsEE5valueEPKcS2_($211,1696,1)|0);
 __ZN10emscripten5enum_IN10SmartDrive11ControlModeEEC2EPKc($184,1703);
 $212 = (__ZN10emscripten5enum_IN10SmartDrive11ControlModeEE5valueEPKcS2_($184,1725,0)|0);
 $213 = (__ZN10emscripten5enum_IN10SmartDrive11ControlModeEE5valueEPKcS2_($212,1734,1)|0);
 $214 = (__ZN10emscripten5enum_IN10SmartDrive11ControlModeEE5valueEPKcS2_($213,1747,2)|0);
 (__ZN10emscripten5enum_IN10SmartDrive11ControlModeEE5valueEPKcS2_($214,1669,3)|0);
 __ZN10emscripten12value_objectIN10SmartDrive8SettingsEEC2EPKc($185,1756);
 __THREW__ = 0;
 $215 = (invoke_iiii(35,($185|0),(1775|0),0)|0);
 $216 = __THREW__; __THREW__ = 0;
 $217 = $216&1;
 if (!($217)) {
  __THREW__ = 0;
  $218 = (invoke_iiii(36,($215|0),(1682|0),1)|0);
  $219 = __THREW__; __THREW__ = 0;
  $220 = $219&1;
  if (!($220)) {
   __THREW__ = 0;
   $221 = (invoke_iiii(37,($218|0),(1787|0),2)|0);
   $222 = __THREW__; __THREW__ = 0;
   $223 = $222&1;
   if (!($223)) {
    __THREW__ = 0;
    $224 = (invoke_iiii(37,($221|0),(1793|0),3)|0);
    $225 = __THREW__; __THREW__ = 0;
    $226 = $225&1;
    if (!($226)) {
     __THREW__ = 0;
     $227 = (invoke_iiii(38,($224|0),(1801|0),4)|0);
     $228 = __THREW__; __THREW__ = 0;
     $229 = $228&1;
     if (!($229)) {
      __THREW__ = 0;
      $230 = (invoke_iiii(38,($227|0),(1816|0),8)|0);
      $231 = __THREW__; __THREW__ = 0;
      $232 = $231&1;
      if (!($232)) {
       __THREW__ = 0;
       (invoke_iiii(38,($230|0),(1829|0),12)|0);
       $233 = __THREW__; __THREW__ = 0;
       $234 = $233&1;
       if (!($234)) {
        __ZN10emscripten12value_objectIN10SmartDrive8SettingsEED2Ev($185);
        __ZN10emscripten5enum_IN6Packet6DeviceEEC2EPKc($188,1838);
        $235 = (__ZN10emscripten5enum_IN6Packet6DeviceEE5valueEPKcS2_($188,1845,0)|0);
        $236 = (__ZN10emscripten5enum_IN6Packet6DeviceEE5valueEPKcS2_($235,1856,1)|0);
        (__ZN10emscripten5enum_IN6Packet6DeviceEE5valueEPKcS2_($236,1876,2)|0);
        __ZN10emscripten5enum_IN6Packet4TypeEEC2EPKc($189,1888);
        $237 = (__ZN10emscripten5enum_IN6Packet4TypeEE5valueEPKcS2_($189,1899,0)|0);
        $238 = (__ZN10emscripten5enum_IN6Packet4TypeEE5valueEPKcS2_($237,1904,1)|0);
        $239 = (__ZN10emscripten5enum_IN6Packet4TypeEE5valueEPKcS2_($238,1909,2)|0);
        $240 = (__ZN10emscripten5enum_IN6Packet4TypeEE5valueEPKcS2_($239,1676,3)|0);
        (__ZN10emscripten5enum_IN6Packet4TypeEE5valueEPKcS2_($240,1917,4)|0);
        __ZN10emscripten5enum_IN6Packet4DataEEC2EPKc($190,1921);
        $241 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($190,1936,0)|0);
        $242 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($241,1950,1)|0);
        $243 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($242,1956,2)|0);
        $244 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($243,1966,3)|0);
        $245 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($244,1658,4)|0);
        $246 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($245,1973,5)|0);
        $247 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($246,1986,6)|0);
        $248 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($247,1998,7)|0);
        $249 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($248,2008,8)|0);
        $250 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($249,2020,9)|0);
        $251 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($250,2030,10)|0);
        $252 = (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($251,2041,11)|0);
        (__ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($252,2047,12)|0);
        __ZN10emscripten12value_objectIN6Packet11VersionInfoEEC2EPKc($191,1986);
        __THREW__ = 0;
        $253 = (invoke_iiii(39,($191|0),(2057|0),0)|0);
        $254 = __THREW__; __THREW__ = 0;
        $255 = $254&1;
        if (!($255)) {
         __THREW__ = 0;
         $256 = (invoke_iiii(39,($253|0),(2069|0),1)|0);
         $257 = __THREW__; __THREW__ = 0;
         $258 = $257&1;
         if (!($258)) {
          __THREW__ = 0;
          (invoke_iiii(39,($256|0),(2080|0),2)|0);
          $259 = __THREW__; __THREW__ = 0;
          $260 = $259&1;
          if (!($260)) {
           __ZN10emscripten12value_objectIN6Packet11VersionInfoEED2Ev($191);
           __ZN10emscripten12value_objectIN6Packet9DailyInfoEEC2EPKc($192,1998);
           __THREW__ = 0;
           $261 = (invoke_iiii(40,($192|0),(2100|0),0)|0);
           $262 = __THREW__; __THREW__ = 0;
           $263 = $262&1;
           do {
            if (!($263)) {
             __THREW__ = 0;
             $264 = (invoke_iiii(41,($261|0),(2105|0),2)|0);
             $265 = __THREW__; __THREW__ = 0;
             $266 = $265&1;
             if (!($266)) {
              __THREW__ = 0;
              $267 = (invoke_iiii(41,($264|0),(2111|0),3)|0);
              $268 = __THREW__; __THREW__ = 0;
              $269 = $268&1;
              if (!($269)) {
               __THREW__ = 0;
               $270 = (invoke_iiii(40,($267|0),(2115|0),4)|0);
               $271 = __THREW__; __THREW__ = 0;
               $272 = $271&1;
               if (!($272)) {
                __THREW__ = 0;
                $273 = (invoke_iiii(40,($270|0),(2126|0),6)|0);
                $274 = __THREW__; __THREW__ = 0;
                $275 = $274&1;
                if (!($275)) {
                 __THREW__ = 0;
                 $276 = (invoke_iiii(40,($273|0),(2140|0),8)|0);
                 $277 = __THREW__; __THREW__ = 0;
                 $278 = $277&1;
                 if (!($278)) {
                  __THREW__ = 0;
                  $279 = (invoke_iiii(40,($276|0),(2150|0),10)|0);
                  $280 = __THREW__; __THREW__ = 0;
                  $281 = $280&1;
                  if (!($281)) {
                   __THREW__ = 0;
                   $282 = (invoke_iiii(41,($279|0),(2163|0),12)|0);
                   $283 = __THREW__; __THREW__ = 0;
                   $284 = $283&1;
                   if ($284) {
                    break;
                   }
                   __THREW__ = 0;
                   $285 = (invoke_iiii(41,($282|0),(2172|0),13)|0);
                   $286 = __THREW__; __THREW__ = 0;
                   $287 = $286&1;
                   if ($287) {
                    break;
                   }
                   __THREW__ = 0;
                   $288 = (invoke_iiii(41,($285|0),(2178|0),14)|0);
                   $289 = __THREW__; __THREW__ = 0;
                   $290 = $289&1;
                   if ($290) {
                    break;
                   }
                   __THREW__ = 0;
                   (invoke_iiii(41,($288|0),(2188|0),15)|0);
                   $291 = __THREW__; __THREW__ = 0;
                   $292 = $291&1;
                   if ($292) {
                    break;
                   }
                   __ZN10emscripten12value_objectIN6Packet9DailyInfoEED2Ev($192);
                   __ZN10emscripten12value_objectIN6Packet11JourneyInfoEEC2EPKc($193,2008);
                   __THREW__ = 0;
                   $293 = (invoke_iiii(42,($193|0),(2198|0),0)|0);
                   $294 = __THREW__; __THREW__ = 0;
                   $295 = $294&1;
                   do {
                    if (!($295)) {
                     __THREW__ = 0;
                     $296 = (invoke_iiii(43,($293|0),(2163|0),2)|0);
                     $297 = __THREW__; __THREW__ = 0;
                     $298 = $297&1;
                     if ($298) {
                      break;
                     }
                     __THREW__ = 0;
                     (invoke_iiii(43,($296|0),(2172|0),3)|0);
                     $299 = __THREW__; __THREW__ = 0;
                     $300 = $299&1;
                     if ($300) {
                      break;
                     }
                     __ZN10emscripten12value_objectIN6Packet11JourneyInfoEED2Ev($193);
                     __ZN10emscripten12value_objectIN6Packet9MotorInfoEEC2EPKc($194,2020);
                     __THREW__ = 0;
                     $301 = (invoke_iiii(44,($194|0),(2205|0),0)|0);
                     $302 = __THREW__; __THREW__ = 0;
                     $303 = $302&1;
                     do {
                      if (!($303)) {
                       __THREW__ = 0;
                       $304 = (invoke_iiii(45,($301|0),(2211|0),1)|0);
                       $305 = __THREW__; __THREW__ = 0;
                       $306 = $305&1;
                       if ($306) {
                        break;
                       }
                       __THREW__ = 0;
                       $307 = (invoke_iiii(45,($304|0),(2224|0),2)|0);
                       $308 = __THREW__; __THREW__ = 0;
                       $309 = $308&1;
                       if ($309) {
                        break;
                       }
                       __THREW__ = 0;
                       $310 = (invoke_iiii(45,($307|0),(2232|0),3)|0);
                       $311 = __THREW__; __THREW__ = 0;
                       $312 = $311&1;
                       if ($312) {
                        break;
                       }
                       __THREW__ = 0;
                       $313 = (invoke_iiii(46,($310|0),(2163|0),4)|0);
                       $314 = __THREW__; __THREW__ = 0;
                       $315 = $314&1;
                       if ($315) {
                        break;
                       }
                       __THREW__ = 0;
                       $316 = (invoke_iiii(46,($313|0),(2172|0),8)|0);
                       $317 = __THREW__; __THREW__ = 0;
                       $318 = $317&1;
                       if ($318) {
                        break;
                       }
                       __THREW__ = 0;
                       (invoke_iiii(46,($316|0),(2240|0),12)|0);
                       $319 = __THREW__; __THREW__ = 0;
                       $320 = $319&1;
                       if ($320) {
                        break;
                       }
                       __ZN10emscripten12value_objectIN6Packet9MotorInfoEED2Ev($194);
                       __ZN10emscripten12value_objectIN6Packet9ErrorInfoEEC2EPKc($195,2047);
                       __THREW__ = 0;
                       $321 = (invoke_iiii(47,($195|0),(2100|0),0)|0);
                       $322 = __THREW__; __THREW__ = 0;
                       $323 = $322&1;
                       do {
                        if (!($323)) {
                         __THREW__ = 0;
                         $324 = (invoke_iiii(47,($321|0),(2105|0),0)|0);
                         $325 = __THREW__; __THREW__ = 0;
                         $326 = $325&1;
                         if ($326) {
                          break;
                         }
                         __THREW__ = 0;
                         $327 = (invoke_iiii(47,($324|0),(2111|0),0)|0);
                         $328 = __THREW__; __THREW__ = 0;
                         $329 = $328&1;
                         if ($329) {
                          break;
                         }
                         __THREW__ = 0;
                         $330 = (invoke_iiii(47,($327|0),(2250|0),0)|0);
                         $331 = __THREW__; __THREW__ = 0;
                         $332 = $331&1;
                         if ($332) {
                          break;
                         }
                         __THREW__ = 0;
                         $333 = (invoke_iiii(47,($330|0),(2255|0),0)|0);
                         $334 = __THREW__; __THREW__ = 0;
                         $335 = $334&1;
                         if ($335) {
                          break;
                         }
                         __THREW__ = 0;
                         $336 = (invoke_iiii(47,($333|0),(2262|0),0)|0);
                         $337 = __THREW__; __THREW__ = 0;
                         $338 = $337&1;
                         if ($338) {
                          break;
                         }
                         __THREW__ = 0;
                         $339 = (invoke_iiii(48,($336|0),(2269|0),7)|0);
                         $340 = __THREW__; __THREW__ = 0;
                         $341 = $340&1;
                         if ($341) {
                          break;
                         }
                         __THREW__ = 0;
                         $342 = (invoke_iiii(49,($339|0),(2285|0),8)|0);
                         $343 = __THREW__; __THREW__ = 0;
                         $344 = $343&1;
                         if ($344) {
                          break;
                         }
                         __THREW__ = 0;
                         $345 = (invoke_iiii(49,($342|0),(2309|0),9)|0);
                         $346 = __THREW__; __THREW__ = 0;
                         $347 = $346&1;
                         if ($347) {
                          break;
                         }
                         __THREW__ = 0;
                         $348 = (invoke_iiii(49,($345|0),(2330|0),10)|0);
                         $349 = __THREW__; __THREW__ = 0;
                         $350 = $349&1;
                         if ($350) {
                          break;
                         }
                         __THREW__ = 0;
                         $351 = (invoke_iiii(49,($348|0),(2350|0),11)|0);
                         $352 = __THREW__; __THREW__ = 0;
                         $353 = $352&1;
                         if ($353) {
                          break;
                         }
                         __THREW__ = 0;
                         $354 = (invoke_iiii(49,($351|0),(2369|0),12)|0);
                         $355 = __THREW__; __THREW__ = 0;
                         $356 = $355&1;
                         if ($356) {
                          break;
                         }
                         __THREW__ = 0;
                         (invoke_iiii(49,($354|0),(2394|0),13)|0);
                         $357 = __THREW__; __THREW__ = 0;
                         $358 = $357&1;
                         if ($358) {
                          break;
                         }
                         __ZN10emscripten12value_objectIN6Packet9ErrorInfoEED2Ev($195);
                         __ZN10emscripten12value_objectIN6Packet10DeviceInfoEEC2EPKc($196,2030);
                         __THREW__ = 0;
                         $359 = (invoke_iiii(50,($196|0),(2417|0),0)|0);
                         $360 = __THREW__; __THREW__ = 0;
                         $361 = $360&1;
                         do {
                          if (!($361)) {
                           __THREW__ = 0;
                           (invoke_iiii(51,($359|0),(2224|0),1)|0);
                           $362 = __THREW__; __THREW__ = 0;
                           $363 = $362&1;
                           if ($363) {
                            break;
                           }
                           __ZN10emscripten12value_objectIN6Packet10DeviceInfoEED2Ev($196);
                           __ZN10emscripten5enum_IN6Packet7CommandEEC2EPKc($197,2424);
                           $364 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($197,2442,0)|0);
                           $365 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($364,2458,1)|0);
                           $366 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($365,2470,2)|0);
                           $367 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($366,2474,3)|0);
                           $368 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($367,2484,4)|0);
                           $369 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($368,2499,5)|0);
                           $370 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($369,2511,6)|0);
                           $371 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($370,2524,7)|0);
                           $372 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($371,2537,8)|0);
                           $373 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($372,2549,9)|0);
                           $374 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($373,2562,10)|0);
                           $375 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($374,2570,11)|0);
                           $376 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($375,2579,12)|0);
                           $377 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($376,2587,13)|0);
                           $378 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($377,2596,14)|0);
                           $379 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($378,2606,15)|0);
                           $380 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($379,2611,16)|0);
                           $381 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($380,2621,17)|0);
                           $382 = (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($381,2630,18)|0);
                           (__ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($382,2644,19)|0);
                           __ZN10emscripten5enum_IN6Packet3OTAEEC2EPKc($198,2661);
                           $383 = (__ZN10emscripten5enum_IN6Packet3OTAEE5valueEPKcS2_($198,1845,0)|0);
                           $384 = (__ZN10emscripten5enum_IN6Packet3OTAEE5valueEPKcS2_($383,1856,1)|0);
                           (__ZN10emscripten5enum_IN6Packet3OTAEE5valueEPKcS2_($384,1876,2)|0);
                           __ZN10emscripten5enum_IN10SmartDrive5ErrorEEC2EPKc($199,2675);
                           $385 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($199,2691,0)|0);
                           $386 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($385,2699,1)|0);
                           $387 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($386,2714,2)|0);
                           $388 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($387,2726,3)|0);
                           $389 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($388,2738,4)|0);
                           $390 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($389,2754,5)|0);
                           $391 = (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($390,2764,6)|0);
                           (__ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($391,2779,7)|0);
                           $175 = $200;
                           $176 = 2793;
                           __ZN10emscripten8internal11NoBaseClass6verifyI6PacketEEvv();
                           $177 = 52;
                           $392 = (__ZN10emscripten8internal11NoBaseClass11getUpcasterI6PacketEEPFvvEv()|0);
                           $178 = $392;
                           $393 = (__ZN10emscripten8internal11NoBaseClass13getDowncasterI6PacketEEPFvvEv()|0);
                           $179 = $393;
                           $180 = 53;
                           $394 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $395 = (__ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerI6PacketEEE3getEv()|0);
                           $396 = (__ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerIK6PacketEEE3getEv()|0);
                           $397 = (__ZN10emscripten8internal11NoBaseClass3getEv()|0);
                           $398 = $177;
                           $174 = $398;
                           $399 = (__ZN10emscripten8internal19getGenericSignatureIJiiEEEPKcv()|0);
                           $400 = $177;
                           $401 = $178;
                           $173 = $401;
                           $402 = (__ZN10emscripten8internal19getGenericSignatureIJvEEEPKcv()|0);
                           $403 = $178;
                           $404 = $179;
                           $172 = $404;
                           $405 = (__ZN10emscripten8internal19getGenericSignatureIJvEEEPKcv()|0);
                           $406 = $179;
                           $407 = $176;
                           $408 = $180;
                           $171 = $408;
                           $409 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
                           $410 = $180;
                           __embind_register_class(($394|0),($395|0),($396|0),($397|0),($399|0),($400|0),($402|0),($403|0),($405|0),($406|0),($407|0),($409|0),($410|0));
                           $170 = $200;
                           $411 = $170;
                           $166 = $411;
                           $167 = 54;
                           $412 = $166;
                           $169 = 55;
                           $413 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $414 = (__ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJP6PacketEE8getCountEv($168)|0);
                           $415 = (__ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJP6PacketEE8getTypesEv($168)|0);
                           $416 = $169;
                           $165 = $416;
                           $417 = (__ZN10emscripten8internal19getGenericSignatureIJiiEEEPKcv()|0);
                           $418 = $169;
                           $419 = $167;
                           __embind_register_class_constructor(($413|0),($414|0),($415|0),($417|0),($418|0),($419|0));
                           HEAP32[$201>>2] = (56);
                           $$index1 = ((($201)) + 4|0);
                           HEAP32[$$index1>>2] = 0;
                           ;HEAP8[$164>>0]=HEAP8[$201>>0]|0;HEAP8[$164+1>>0]=HEAP8[$201+1>>0]|0;HEAP8[$164+2>>0]=HEAP8[$201+2>>0]|0;HEAP8[$164+3>>0]=HEAP8[$201+3>>0]|0;HEAP8[$164+4>>0]=HEAP8[$201+4>>0]|0;HEAP8[$164+5>>0]=HEAP8[$201+5>>0]|0;HEAP8[$164+6>>0]=HEAP8[$201+6>>0]|0;HEAP8[$164+7>>0]=HEAP8[$201+7>>0]|0;
                           $$field = HEAP32[$164>>2]|0;
                           $$index3 = ((($164)) + 4|0);
                           $$field4 = HEAP32[$$index3>>2]|0;
                           $159 = $412;
                           $160 = 2800;
                           HEAP32[$161>>2] = $$field;
                           $$index7 = ((($161)) + 4|0);
                           HEAP32[$$index7>>2] = $$field4;
                           $420 = $159;
                           $162 = 57;
                           $421 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $422 = $160;
                           $423 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEEEE8getCountEv($163)|0);
                           $424 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEEEE8getTypesEv($163)|0);
                           $425 = $162;
                           $158 = $425;
                           $426 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $427 = $162;
                           $428 = (__ZN10emscripten8internal10getContextIM6PacketFbvEEEPT_RKS5_($161)|0);
                           __embind_register_class_function(($421|0),($422|0),($423|0),($424|0),($426|0),($427|0),($428|0),0);
                           HEAP32[$202>>2] = (58);
                           $$index9 = ((($202)) + 4|0);
                           HEAP32[$$index9>>2] = 0;
                           ;HEAP8[$157>>0]=HEAP8[$202>>0]|0;HEAP8[$157+1>>0]=HEAP8[$202+1>>0]|0;HEAP8[$157+2>>0]=HEAP8[$202+2>>0]|0;HEAP8[$157+3>>0]=HEAP8[$202+3>>0]|0;HEAP8[$157+4>>0]=HEAP8[$202+4>>0]|0;HEAP8[$157+5>>0]=HEAP8[$202+5>>0]|0;HEAP8[$157+6>>0]=HEAP8[$202+6>>0]|0;HEAP8[$157+7>>0]=HEAP8[$202+7>>0]|0;
                           $$field11 = HEAP32[$157>>2]|0;
                           $$index13 = ((($157)) + 4|0);
                           $$field14 = HEAP32[$$index13>>2]|0;
                           $152 = $420;
                           $153 = 2806;
                           HEAP32[$154>>2] = $$field11;
                           $$index17 = ((($154)) + 4|0);
                           HEAP32[$$index17>>2] = $$field14;
                           $429 = $152;
                           $155 = 59;
                           $430 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $431 = $153;
                           $432 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEENSt3__212basic_stringIcNS7_11char_traitsIcEENS7_9allocatorIcEEEEEE8getCountEv($156)|0);
                           $433 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEENSt3__212basic_stringIcNS7_11char_traitsIcEENS7_9allocatorIcEEEEEE8getTypesEv($156)|0);
                           $434 = $155;
                           $151 = $434;
                           $435 = (__ZN10emscripten8internal19getGenericSignatureIJiiiiEEEPKcv()|0);
                           $436 = $155;
                           $437 = (__ZN10emscripten8internal10getContextIM6PacketFbNSt3__212basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEEEEPT_RKSC_($154)|0);
                           __embind_register_class_function(($430|0),($431|0),($432|0),($433|0),($435|0),($436|0),($437|0),0);
                           HEAP32[$203>>2] = (60);
                           $$index19 = ((($203)) + 4|0);
                           HEAP32[$$index19>>2] = 0;
                           ;HEAP8[$150>>0]=HEAP8[$203>>0]|0;HEAP8[$150+1>>0]=HEAP8[$203+1>>0]|0;HEAP8[$150+2>>0]=HEAP8[$203+2>>0]|0;HEAP8[$150+3>>0]=HEAP8[$203+3>>0]|0;HEAP8[$150+4>>0]=HEAP8[$203+4>>0]|0;HEAP8[$150+5>>0]=HEAP8[$203+5>>0]|0;HEAP8[$150+6>>0]=HEAP8[$203+6>>0]|0;HEAP8[$150+7>>0]=HEAP8[$203+7>>0]|0;
                           $$field21 = HEAP32[$150>>2]|0;
                           $$index23 = ((($150)) + 4|0);
                           $$field24 = HEAP32[$$index23>>2]|0;
                           $145 = $429;
                           $146 = 2820;
                           HEAP32[$147>>2] = $$field21;
                           $$index27 = ((($147)) + 4|0);
                           HEAP32[$$index27>>2] = $$field24;
                           $438 = $145;
                           $148 = 61;
                           $439 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $440 = $146;
                           $441 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerI6PacketEEEE8getCountEv($149)|0);
                           $442 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerI6PacketEEEE8getTypesEv($149)|0);
                           $443 = $148;
                           $144 = $443;
                           $444 = (__ZN10emscripten8internal19getGenericSignatureIJviiEEEPKcv()|0);
                           $445 = $148;
                           $446 = (__ZN10emscripten8internal10getContextIM6PacketFvvEEEPT_RKS5_($147)|0);
                           __embind_register_class_function(($439|0),($440|0),($441|0),($442|0),($444|0),($445|0),($446|0),0);
                           HEAP32[$204>>2] = (62);
                           $$index29 = ((($204)) + 4|0);
                           HEAP32[$$index29>>2] = 0;
                           ;HEAP8[$143>>0]=HEAP8[$204>>0]|0;HEAP8[$143+1>>0]=HEAP8[$204+1>>0]|0;HEAP8[$143+2>>0]=HEAP8[$204+2>>0]|0;HEAP8[$143+3>>0]=HEAP8[$204+3>>0]|0;HEAP8[$143+4>>0]=HEAP8[$204+4>>0]|0;HEAP8[$143+5>>0]=HEAP8[$204+5>>0]|0;HEAP8[$143+6>>0]=HEAP8[$204+6>>0]|0;HEAP8[$143+7>>0]=HEAP8[$204+7>>0]|0;
                           $$field31 = HEAP32[$143>>2]|0;
                           $$index33 = ((($143)) + 4|0);
                           $$field34 = HEAP32[$$index33>>2]|0;
                           $138 = $438;
                           $139 = 2830;
                           HEAP32[$140>>2] = $$field31;
                           $$index37 = ((($140)) + 4|0);
                           HEAP32[$$index37>>2] = $$field34;
                           $447 = $138;
                           $141 = 63;
                           $448 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $449 = $139;
                           $450 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNSt3__26vectorIhNS4_9allocatorIhEEEENS0_17AllowedRawPointerI6PacketEEEE8getCountEv($142)|0);
                           $451 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNSt3__26vectorIhNS4_9allocatorIhEEEENS0_17AllowedRawPointerI6PacketEEEE8getTypesEv($142)|0);
                           $452 = $141;
                           $137 = $452;
                           $453 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $454 = $141;
                           $455 = (__ZN10emscripten8internal10getContextIM6PacketFNSt3__26vectorIhNS3_9allocatorIhEEEEvEEEPT_RKSA_($140)|0);
                           __embind_register_class_function(($448|0),($449|0),($450|0),($451|0),($453|0),($454|0),($455|0),0);
                           $132 = $447;
                           $133 = 2837;
                           HEAP32[$134>>2] = 0;
                           $456 = $132;
                           $135 = 64;
                           $136 = 65;
                           $457 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $458 = $133;
                           $459 = (__ZN10emscripten8internal6TypeIDIiE3getEv()|0);
                           $460 = $135;
                           $131 = $460;
                           $461 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $462 = $135;
                           $463 = (__ZN10emscripten8internal10getContextIM6PacketiEEPT_RKS4_($134)|0);
                           $464 = (__ZN10emscripten8internal6TypeIDIiE3getEv()|0);
                           $465 = $136;
                           $130 = $465;
                           $466 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $467 = $136;
                           $468 = (__ZN10emscripten8internal10getContextIM6PacketiEEPT_RKS4_($134)|0);
                           __embind_register_class_property(($457|0),($458|0),($459|0),($461|0),($462|0),($463|0),($464|0),($466|0),($467|0),($468|0));
                           $125 = $456;
                           $126 = 2844;
                           HEAP32[$127>>2] = 4;
                           $469 = $125;
                           $128 = 66;
                           $129 = 67;
                           $470 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $471 = $126;
                           $472 = (__ZN10emscripten8internal6TypeIDIN6Packet4TypeEE3getEv()|0);
                           $473 = $128;
                           $124 = $473;
                           $474 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $475 = $128;
                           $476 = (__ZN10emscripten8internal10getContextIM6PacketNS2_4TypeEEEPT_RKS5_($127)|0);
                           $477 = (__ZN10emscripten8internal6TypeIDIN6Packet4TypeEE3getEv()|0);
                           $478 = $129;
                           $123 = $478;
                           $479 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $480 = $129;
                           $481 = (__ZN10emscripten8internal10getContextIM6PacketNS2_4TypeEEEPT_RKS5_($127)|0);
                           __embind_register_class_property(($470|0),($471|0),($472|0),($474|0),($475|0),($476|0),($477|0),($479|0),($480|0),($481|0));
                           $118 = $469;
                           $119 = 1904;
                           HEAP32[$120>>2] = 5;
                           $482 = $118;
                           $121 = 68;
                           $122 = 69;
                           $483 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $484 = $119;
                           $485 = (__ZN10emscripten8internal6TypeIDIN6Packet4DataEE3getEv()|0);
                           $486 = $121;
                           $117 = $486;
                           $487 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $488 = $121;
                           $489 = (__ZN10emscripten8internal10getContextIM6PacketNS2_4DataEEEPT_RKS5_($120)|0);
                           $490 = (__ZN10emscripten8internal6TypeIDIN6Packet4DataEE3getEv()|0);
                           $491 = $122;
                           $116 = $491;
                           $492 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $493 = $122;
                           $494 = (__ZN10emscripten8internal10getContextIM6PacketNS2_4DataEEEPT_RKS5_($120)|0);
                           __embind_register_class_property(($483|0),($484|0),($485|0),($487|0),($488|0),($489|0),($490|0),($492|0),($493|0),($494|0));
                           $111 = $482;
                           $112 = 1909;
                           HEAP32[$113>>2] = 5;
                           $495 = $111;
                           $114 = 70;
                           $115 = 71;
                           $496 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $497 = $112;
                           $498 = (__ZN10emscripten8internal6TypeIDIN6Packet7CommandEE3getEv()|0);
                           $499 = $114;
                           $110 = $499;
                           $500 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $501 = $114;
                           $502 = (__ZN10emscripten8internal10getContextIM6PacketNS2_7CommandEEEPT_RKS5_($113)|0);
                           $503 = (__ZN10emscripten8internal6TypeIDIN6Packet7CommandEE3getEv()|0);
                           $504 = $115;
                           $109 = $504;
                           $505 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $506 = $115;
                           $507 = (__ZN10emscripten8internal10getContextIM6PacketNS2_7CommandEEEPT_RKS5_($113)|0);
                           __embind_register_class_property(($496|0),($497|0),($498|0),($500|0),($501|0),($502|0),($503|0),($505|0),($506|0),($507|0));
                           $104 = $495;
                           $105 = 1676;
                           HEAP32[$106>>2] = 5;
                           $508 = $104;
                           $107 = 72;
                           $108 = 73;
                           $509 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $510 = $105;
                           $511 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv()|0);
                           $512 = $107;
                           $103 = $512;
                           $513 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $514 = $107;
                           $515 = (__ZN10emscripten8internal10getContextIM6PacketN10SmartDrive5ErrorEEEPT_RKS6_($106)|0);
                           $516 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv()|0);
                           $517 = $108;
                           $102 = $517;
                           $518 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $519 = $108;
                           $520 = (__ZN10emscripten8internal10getContextIM6PacketN10SmartDrive5ErrorEEEPT_RKS6_($106)|0);
                           __embind_register_class_property(($509|0),($510|0),($511|0),($513|0),($514|0),($515|0),($516|0),($518|0),($519|0),($520|0));
                           $97 = $508;
                           $98 = 1917;
                           HEAP32[$99>>2] = 5;
                           $521 = $97;
                           $100 = 74;
                           $101 = 75;
                           $522 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $523 = $98;
                           $524 = (__ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv()|0);
                           $525 = $100;
                           $96 = $525;
                           $526 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $527 = $100;
                           $528 = (__ZN10emscripten8internal10getContextIM6PacketNS2_3OTAEEEPT_RKS5_($99)|0);
                           $529 = (__ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv()|0);
                           $530 = $101;
                           $95 = $530;
                           $531 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $532 = $101;
                           $533 = (__ZN10emscripten8internal10getContextIM6PacketNS2_3OTAEEEPT_RKS5_($99)|0);
                           __embind_register_class_property(($522|0),($523|0),($524|0),($526|0),($527|0),($528|0),($529|0),($531|0),($532|0),($533|0));
                           $90 = $521;
                           $91 = 2849;
                           HEAP32[$92>>2] = 8;
                           $534 = $90;
                           $93 = 76;
                           $94 = 77;
                           $535 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $536 = $91;
                           $537 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv()|0);
                           $538 = $93;
                           $89 = $538;
                           $539 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $540 = $93;
                           $541 = (__ZN10emscripten8internal10getContextIM6PacketN10SmartDrive8SettingsEEEPT_RKS6_($92)|0);
                           $542 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv()|0);
                           $543 = $94;
                           $88 = $543;
                           $544 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $545 = $94;
                           $546 = (__ZN10emscripten8internal10getContextIM6PacketN10SmartDrive8SettingsEEEPT_RKS6_($92)|0);
                           __embind_register_class_property(($535|0),($536|0),($537|0),($539|0),($540|0),($541|0),($542|0),($544|0),($545|0),($546|0));
                           $83 = $534;
                           $84 = 2858;
                           HEAP32[$85>>2] = 8;
                           $547 = $83;
                           $86 = 78;
                           $87 = 79;
                           $548 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $549 = $84;
                           $550 = (__ZN10emscripten8internal6TypeIDIN6Packet11VersionInfoEE3getEv()|0);
                           $551 = $86;
                           $82 = $551;
                           $552 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $553 = $86;
                           $554 = (__ZN10emscripten8internal10getContextIM6PacketNS2_11VersionInfoEEEPT_RKS5_($85)|0);
                           $555 = (__ZN10emscripten8internal6TypeIDIN6Packet11VersionInfoEE3getEv()|0);
                           $556 = $87;
                           $81 = $556;
                           $557 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $558 = $87;
                           $559 = (__ZN10emscripten8internal10getContextIM6PacketNS2_11VersionInfoEEEPT_RKS5_($85)|0);
                           __embind_register_class_property(($548|0),($549|0),($550|0),($552|0),($553|0),($554|0),($555|0),($557|0),($558|0),($559|0));
                           $76 = $547;
                           $77 = 2870;
                           HEAP32[$78>>2] = 8;
                           $560 = $76;
                           $79 = 80;
                           $80 = 81;
                           $561 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $562 = $77;
                           $563 = (__ZN10emscripten8internal6TypeIDIN6Packet9DailyInfoEE3getEv()|0);
                           $564 = $79;
                           $75 = $564;
                           $565 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $566 = $79;
                           $567 = (__ZN10emscripten8internal10getContextIM6PacketNS2_9DailyInfoEEEPT_RKS5_($78)|0);
                           $568 = (__ZN10emscripten8internal6TypeIDIN6Packet9DailyInfoEE3getEv()|0);
                           $569 = $80;
                           $74 = $569;
                           $570 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $571 = $80;
                           $572 = (__ZN10emscripten8internal10getContextIM6PacketNS2_9DailyInfoEEEPT_RKS5_($78)|0);
                           __embind_register_class_property(($561|0),($562|0),($563|0),($565|0),($566|0),($567|0),($568|0),($570|0),($571|0),($572|0));
                           $69 = $560;
                           $70 = 2880;
                           HEAP32[$71>>2] = 8;
                           $573 = $69;
                           $72 = 82;
                           $73 = 83;
                           $574 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $575 = $70;
                           $576 = (__ZN10emscripten8internal6TypeIDIN6Packet11JourneyInfoEE3getEv()|0);
                           $577 = $72;
                           $68 = $577;
                           $578 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $579 = $72;
                           $580 = (__ZN10emscripten8internal10getContextIM6PacketNS2_11JourneyInfoEEEPT_RKS5_($71)|0);
                           $581 = (__ZN10emscripten8internal6TypeIDIN6Packet11JourneyInfoEE3getEv()|0);
                           $582 = $73;
                           $67 = $582;
                           $583 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $584 = $73;
                           $585 = (__ZN10emscripten8internal10getContextIM6PacketNS2_11JourneyInfoEEEPT_RKS5_($71)|0);
                           __embind_register_class_property(($574|0),($575|0),($576|0),($578|0),($579|0),($580|0),($581|0),($583|0),($584|0),($585|0));
                           $62 = $573;
                           $63 = 2892;
                           HEAP32[$64>>2] = 8;
                           $586 = $62;
                           $65 = 84;
                           $66 = 85;
                           $587 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $588 = $63;
                           $589 = (__ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv()|0);
                           $590 = $65;
                           $61 = $590;
                           $591 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $592 = $65;
                           $593 = (__ZN10emscripten8internal10getContextIM6PacketNS2_9MotorInfoEEEPT_RKS5_($64)|0);
                           $594 = (__ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv()|0);
                           $595 = $66;
                           $60 = $595;
                           $596 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $597 = $66;
                           $598 = (__ZN10emscripten8internal10getContextIM6PacketNS2_9MotorInfoEEEPT_RKS5_($64)|0);
                           __embind_register_class_property(($587|0),($588|0),($589|0),($591|0),($592|0),($593|0),($594|0),($596|0),($597|0),($598|0));
                           $55 = $586;
                           $56 = 2902;
                           HEAP32[$57>>2] = 8;
                           $599 = $55;
                           $58 = 86;
                           $59 = 87;
                           $600 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $601 = $56;
                           $602 = (__ZN10emscripten8internal6TypeIDIN6Packet8TimeInfoEE3getEv()|0);
                           $603 = $58;
                           $54 = $603;
                           $604 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $605 = $58;
                           $606 = (__ZN10emscripten8internal10getContextIM6PacketNS2_8TimeInfoEEEPT_RKS5_($57)|0);
                           $607 = (__ZN10emscripten8internal6TypeIDIN6Packet8TimeInfoEE3getEv()|0);
                           $608 = $59;
                           $53 = $608;
                           $609 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $610 = $59;
                           $611 = (__ZN10emscripten8internal10getContextIM6PacketNS2_8TimeInfoEEEPT_RKS5_($57)|0);
                           __embind_register_class_property(($600|0),($601|0),($602|0),($604|0),($605|0),($606|0),($607|0),($609|0),($610|0),($611|0));
                           $48 = $599;
                           $49 = 2911;
                           HEAP32[$50>>2] = 8;
                           $612 = $48;
                           $51 = 88;
                           $52 = 89;
                           $613 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $614 = $49;
                           $615 = (__ZN10emscripten8internal6TypeIDIN6Packet10DeviceInfoEE3getEv()|0);
                           $616 = $51;
                           $47 = $616;
                           $617 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $618 = $51;
                           $619 = (__ZN10emscripten8internal10getContextIM6PacketNS2_10DeviceInfoEEEPT_RKS5_($50)|0);
                           $620 = (__ZN10emscripten8internal6TypeIDIN6Packet10DeviceInfoEE3getEv()|0);
                           $621 = $52;
                           $46 = $621;
                           $622 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $623 = $52;
                           $624 = (__ZN10emscripten8internal10getContextIM6PacketNS2_10DeviceInfoEEEPT_RKS5_($50)|0);
                           __embind_register_class_property(($613|0),($614|0),($615|0),($617|0),($618|0),($619|0),($620|0),($622|0),($623|0),($624|0));
                           $41 = $612;
                           $42 = 2922;
                           HEAP32[$43>>2] = 8;
                           $625 = $41;
                           $44 = 90;
                           $45 = 91;
                           $626 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $627 = $42;
                           $628 = (__ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv()|0);
                           $629 = $44;
                           $40 = $629;
                           $630 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $631 = $44;
                           $632 = (__ZN10emscripten8internal10getContextIM6PacketNS2_9ErrorInfoEEEPT_RKS5_($43)|0);
                           $633 = (__ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv()|0);
                           $634 = $45;
                           $39 = $634;
                           $635 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $636 = $45;
                           $637 = (__ZN10emscripten8internal10getContextIM6PacketNS2_9ErrorInfoEEEPT_RKS5_($43)|0);
                           __embind_register_class_property(($626|0),($627|0),($628|0),($630|0),($631|0),($632|0),($633|0),($635|0),($636|0),($637|0));
                           $34 = $625;
                           $35 = 2932;
                           HEAP32[$36>>2] = 8;
                           $638 = $34;
                           $37 = 92;
                           $38 = 93;
                           $639 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $640 = $35;
                           $641 = (__ZN10emscripten8internal6TypeIDIN6Packet11BatteryInfoEE3getEv()|0);
                           $642 = $37;
                           $33 = $642;
                           $643 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $644 = $37;
                           $645 = (__ZN10emscripten8internal10getContextIM6PacketNS2_11BatteryInfoEEEPT_RKS5_($36)|0);
                           $646 = (__ZN10emscripten8internal6TypeIDIN6Packet11BatteryInfoEE3getEv()|0);
                           $647 = $38;
                           $32 = $647;
                           $648 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $649 = $38;
                           $650 = (__ZN10emscripten8internal10getContextIM6PacketNS2_11BatteryInfoEEEPT_RKS5_($36)|0);
                           __embind_register_class_property(($639|0),($640|0),($641|0),($643|0),($644|0),($645|0),($646|0),($648|0),($649|0),($650|0));
                           $27 = $638;
                           $28 = 2944;
                           HEAP32[$29>>2] = 8;
                           $651 = $27;
                           $30 = 74;
                           $31 = 75;
                           $652 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $653 = $28;
                           $654 = (__ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv()|0);
                           $655 = $30;
                           $26 = $655;
                           $656 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $657 = $30;
                           $658 = (__ZN10emscripten8internal10getContextIM6PacketNS2_3OTAEEEPT_RKS5_($29)|0);
                           $659 = (__ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv()|0);
                           $660 = $31;
                           $25 = $660;
                           $661 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $662 = $31;
                           $663 = (__ZN10emscripten8internal10getContextIM6PacketNS2_3OTAEEEPT_RKS5_($29)|0);
                           __embind_register_class_property(($652|0),($653|0),($654|0),($656|0),($657|0),($658|0),($659|0),($661|0),($662|0),($663|0));
                           HEAP32[$205>>2] = (94);
                           $$index39 = ((($205)) + 4|0);
                           HEAP32[$$index39>>2] = 0;
                           HEAP32[$206>>2] = (95);
                           $$index41 = ((($206)) + 4|0);
                           HEAP32[$$index41>>2] = 0;
                           ;HEAP8[$23>>0]=HEAP8[$206>>0]|0;HEAP8[$23+1>>0]=HEAP8[$206+1>>0]|0;HEAP8[$23+2>>0]=HEAP8[$206+2>>0]|0;HEAP8[$23+3>>0]=HEAP8[$206+3>>0]|0;HEAP8[$23+4>>0]=HEAP8[$206+4>>0]|0;HEAP8[$23+5>>0]=HEAP8[$206+5>>0]|0;HEAP8[$23+6>>0]=HEAP8[$206+6>>0]|0;HEAP8[$23+7>>0]=HEAP8[$206+7>>0]|0;
                           ;HEAP8[$24>>0]=HEAP8[$205>>0]|0;HEAP8[$24+1>>0]=HEAP8[$205+1>>0]|0;HEAP8[$24+2>>0]=HEAP8[$205+2>>0]|0;HEAP8[$24+3>>0]=HEAP8[$205+3>>0]|0;HEAP8[$24+4>>0]=HEAP8[$205+4>>0]|0;HEAP8[$24+5>>0]=HEAP8[$205+5>>0]|0;HEAP8[$24+6>>0]=HEAP8[$205+6>>0]|0;HEAP8[$24+7>>0]=HEAP8[$205+7>>0]|0;
                           $$field43 = HEAP32[$24>>2]|0;
                           $$index45 = ((($24)) + 4|0);
                           $$field46 = HEAP32[$$index45>>2]|0;
                           $$field49 = HEAP32[$23>>2]|0;
                           $$index51 = ((($23)) + 4|0);
                           $$field52 = HEAP32[$$index51>>2]|0;
                           $15 = $651;
                           $16 = 2954;
                           HEAP32[$17>>2] = $$field43;
                           $$index55 = ((($17)) + 4|0);
                           HEAP32[$$index55>>2] = $$field46;
                           HEAP32[$18>>2] = $$field49;
                           $$index57 = ((($18)) + 4|0);
                           HEAP32[$$index57>>2] = $$field52;
                           $664 = $15;
                           $19 = 96;
                           $20 = 97;
                           $665 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $666 = $16;
                           $667 = (__ZN10emscripten8internal6TypeIDIiE3getEv()|0);
                           $668 = $19;
                           $14 = $668;
                           $669 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $670 = $19;
                           $$field59 = HEAP32[$17>>2]|0;
                           $$index61 = ((($17)) + 4|0);
                           $$field62 = HEAP32[$$index61>>2]|0;
                           HEAP32[$21>>2] = $$field59;
                           $$index65 = ((($21)) + 4|0);
                           HEAP32[$$index65>>2] = $$field62;
                           ;HEAP32[$$byval_copy>>2]=HEAP32[$21>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$21+4>>2]|0;
                           $671 = (__ZN10emscripten8internal12GetterPolicyIM6PacketKFivEE10getContextES4_($$byval_copy)|0);
                           $672 = (__ZN10emscripten8internal6TypeIDIiE3getEv()|0);
                           $673 = $20;
                           $13 = $673;
                           $674 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $675 = $20;
                           $$field67 = HEAP32[$18>>2]|0;
                           $$index69 = ((($18)) + 4|0);
                           $$field70 = HEAP32[$$index69>>2]|0;
                           HEAP32[$22>>2] = $$field67;
                           $$index73 = ((($22)) + 4|0);
                           HEAP32[$$index73>>2] = $$field70;
                           ;HEAP32[$$byval_copy110>>2]=HEAP32[$22>>2]|0;HEAP32[$$byval_copy110+4>>2]=HEAP32[$22+4>>2]|0;
                           $676 = (__ZN10emscripten8internal12SetterPolicyIM6PacketFviEE10getContextES4_($$byval_copy110)|0);
                           __embind_register_class_property(($665|0),($666|0),($667|0),($669|0),($670|0),($671|0),($672|0),($674|0),($675|0),($676|0));
                           HEAP32[$207>>2] = (98);
                           $$index75 = ((($207)) + 4|0);
                           HEAP32[$$index75>>2] = 0;
                           HEAP32[$208>>2] = (99);
                           $$index77 = ((($208)) + 4|0);
                           HEAP32[$$index77>>2] = 0;
                           ;HEAP8[$11>>0]=HEAP8[$208>>0]|0;HEAP8[$11+1>>0]=HEAP8[$208+1>>0]|0;HEAP8[$11+2>>0]=HEAP8[$208+2>>0]|0;HEAP8[$11+3>>0]=HEAP8[$208+3>>0]|0;HEAP8[$11+4>>0]=HEAP8[$208+4>>0]|0;HEAP8[$11+5>>0]=HEAP8[$208+5>>0]|0;HEAP8[$11+6>>0]=HEAP8[$208+6>>0]|0;HEAP8[$11+7>>0]=HEAP8[$208+7>>0]|0;
                           ;HEAP8[$12>>0]=HEAP8[$207>>0]|0;HEAP8[$12+1>>0]=HEAP8[$207+1>>0]|0;HEAP8[$12+2>>0]=HEAP8[$207+2>>0]|0;HEAP8[$12+3>>0]=HEAP8[$207+3>>0]|0;HEAP8[$12+4>>0]=HEAP8[$207+4>>0]|0;HEAP8[$12+5>>0]=HEAP8[$207+5>>0]|0;HEAP8[$12+6>>0]=HEAP8[$207+6>>0]|0;HEAP8[$12+7>>0]=HEAP8[$207+7>>0]|0;
                           $$field79 = HEAP32[$12>>2]|0;
                           $$index81 = ((($12)) + 4|0);
                           $$field82 = HEAP32[$$index81>>2]|0;
                           $$field85 = HEAP32[$11>>2]|0;
                           $$index87 = ((($11)) + 4|0);
                           $$field88 = HEAP32[$$index87>>2]|0;
                           $3 = $664;
                           $4 = 2968;
                           HEAP32[$5>>2] = $$field79;
                           $$index91 = ((($5)) + 4|0);
                           HEAP32[$$index91>>2] = $$field82;
                           HEAP32[$6>>2] = $$field85;
                           $$index93 = ((($6)) + 4|0);
                           HEAP32[$$index93>>2] = $$field88;
                           $7 = 100;
                           $8 = 101;
                           $677 = (__ZN10emscripten8internal6TypeIDI6PacketE3getEv()|0);
                           $678 = $4;
                           $679 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
                           $680 = $7;
                           $2 = $680;
                           $681 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
                           $682 = $7;
                           $$field95 = HEAP32[$5>>2]|0;
                           $$index97 = ((($5)) + 4|0);
                           $$field98 = HEAP32[$$index97>>2]|0;
                           HEAP32[$9>>2] = $$field95;
                           $$index101 = ((($9)) + 4|0);
                           HEAP32[$$index101>>2] = $$field98;
                           ;HEAP32[$$byval_copy111>>2]=HEAP32[$9>>2]|0;HEAP32[$$byval_copy111+4>>2]=HEAP32[$9+4>>2]|0;
                           $683 = (__ZN10emscripten8internal12GetterPolicyIM6PacketKFNSt3__26vectorIhNS3_9allocatorIhEEEEvEE10getContextES9_($$byval_copy111)|0);
                           $684 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
                           $685 = $8;
                           $1 = $685;
                           $686 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
                           $687 = $8;
                           $$field103 = HEAP32[$6>>2]|0;
                           $$index105 = ((($6)) + 4|0);
                           $$field106 = HEAP32[$$index105>>2]|0;
                           HEAP32[$10>>2] = $$field103;
                           $$index109 = ((($10)) + 4|0);
                           HEAP32[$$index109>>2] = $$field106;
                           ;HEAP32[$$byval_copy112>>2]=HEAP32[$10>>2]|0;HEAP32[$$byval_copy112+4>>2]=HEAP32[$10+4>>2]|0;
                           $688 = (__ZN10emscripten8internal12SetterPolicyIM6PacketFvNSt3__26vectorIhNS3_9allocatorIhEEEEEE10getContextES9_($$byval_copy112)|0);
                           __embind_register_class_property(($677|0),($678|0),($679|0),($681|0),($682|0),($683|0),($684|0),($686|0),($687|0),($688|0));
                           STACKTOP = sp;return;
                          }
                         } while(0);
                         $701 = ___cxa_find_matching_catch_2()|0;
                         $702 = tempRet0;
                         $186 = $701;
                         $187 = $702;
                         __ZN10emscripten12value_objectIN6Packet10DeviceInfoEED2Ev($196);
                         $703 = $186;
                         $704 = $187;
                         ___resumeException($703|0);
                         // unreachable;
                        }
                       } while(0);
                       $699 = ___cxa_find_matching_catch_2()|0;
                       $700 = tempRet0;
                       $186 = $699;
                       $187 = $700;
                       __ZN10emscripten12value_objectIN6Packet9ErrorInfoEED2Ev($195);
                       $703 = $186;
                       $704 = $187;
                       ___resumeException($703|0);
                       // unreachable;
                      }
                     } while(0);
                     $697 = ___cxa_find_matching_catch_2()|0;
                     $698 = tempRet0;
                     $186 = $697;
                     $187 = $698;
                     __ZN10emscripten12value_objectIN6Packet9MotorInfoEED2Ev($194);
                     $703 = $186;
                     $704 = $187;
                     ___resumeException($703|0);
                     // unreachable;
                    }
                   } while(0);
                   $695 = ___cxa_find_matching_catch_2()|0;
                   $696 = tempRet0;
                   $186 = $695;
                   $187 = $696;
                   __ZN10emscripten12value_objectIN6Packet11JourneyInfoEED2Ev($193);
                   $703 = $186;
                   $704 = $187;
                   ___resumeException($703|0);
                   // unreachable;
                  }
                 }
                }
               }
              }
             }
            }
           } while(0);
           $693 = ___cxa_find_matching_catch_2()|0;
           $694 = tempRet0;
           $186 = $693;
           $187 = $694;
           __ZN10emscripten12value_objectIN6Packet9DailyInfoEED2Ev($192);
           $703 = $186;
           $704 = $187;
           ___resumeException($703|0);
           // unreachable;
          }
         }
        }
        $691 = ___cxa_find_matching_catch_2()|0;
        $692 = tempRet0;
        $186 = $691;
        $187 = $692;
        __ZN10emscripten12value_objectIN6Packet11VersionInfoEED2Ev($191);
        $703 = $186;
        $704 = $187;
        ___resumeException($703|0);
        // unreachable;
       }
      }
     }
    }
   }
  }
 }
 $689 = ___cxa_find_matching_catch_2()|0;
 $690 = tempRet0;
 $186 = $689;
 $187 = $690;
 __ZN10emscripten12value_objectIN10SmartDrive8SettingsEED2Ev($185);
 $703 = $186;
 $704 = $187;
 ___resumeException($703|0);
 // unreachable;
}
function __ZN10emscripten15register_vectorIhEENS_6class_INSt3__26vectorIT_NS2_9allocatorIS4_EEEENS_8internal11NoBaseClassEEEPKc($0) {
 $0 = $0|0;
 var $$field = 0, $$field11 = 0, $$field14 = 0, $$field19 = 0, $$field22 = 0, $$field27 = 0, $$field30 = 0, $$field37 = 0, $$field40 = 0, $$field6 = 0, $$index1 = 0, $$index13 = 0, $$index17 = 0, $$index21 = 0, $$index25 = 0, $$index29 = 0, $$index3 = 0, $$index33 = 0, $$index35 = 0, $$index39 = 0;
 var $$index43 = 0, $$index5 = 0, $$index9 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0;
 var $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $14 = 0, $15 = 0;
 var $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(256|0);
 $4 = sp + 228|0;
 $5 = sp + 250|0;
 $10 = sp + 208|0;
 $11 = sp + 249|0;
 $16 = sp + 184|0;
 $18 = sp + 248|0;
 $19 = sp + 16|0;
 $23 = sp + 160|0;
 $25 = sp + 247|0;
 $26 = sp + 8|0;
 $30 = sp + 136|0;
 $32 = sp + 246|0;
 $33 = sp;
 $37 = sp + 245|0;
 $51 = sp + 56|0;
 $52 = sp + 48|0;
 $53 = sp + 244|0;
 $54 = sp + 40|0;
 $55 = sp + 32|0;
 $56 = sp + 24|0;
 $50 = $0;
 HEAP32[$51>>2] = (102);
 $$index1 = ((($51)) + 4|0);
 HEAP32[$$index1>>2] = 0;
 HEAP32[$52>>2] = (103);
 $$index3 = ((($52)) + 4|0);
 HEAP32[$$index3>>2] = 0;
 $57 = $50;
 $44 = $53;
 $45 = $57;
 __ZN10emscripten8internal11NoBaseClass6verifyINSt3__26vectorIhNS3_9allocatorIhEEEEEEvv();
 $46 = 104;
 $58 = (__ZN10emscripten8internal11NoBaseClass11getUpcasterINSt3__26vectorIhNS3_9allocatorIhEEEEEEPFvvEv()|0);
 $47 = $58;
 $59 = (__ZN10emscripten8internal11NoBaseClass13getDowncasterINSt3__26vectorIhNS3_9allocatorIhEEEEEEPFvvEv()|0);
 $48 = $59;
 $49 = 105;
 $60 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $61 = (__ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerINSt3__26vectorIhNS3_9allocatorIhEEEEEEE3getEv()|0);
 $62 = (__ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerIKNSt3__26vectorIhNS3_9allocatorIhEEEEEEE3getEv()|0);
 $63 = (__ZN10emscripten8internal11NoBaseClass3getEv()|0);
 $64 = $46;
 $43 = $64;
 $65 = (__ZN10emscripten8internal19getGenericSignatureIJiiEEEPKcv()|0);
 $66 = $46;
 $67 = $47;
 $42 = $67;
 $68 = (__ZN10emscripten8internal19getGenericSignatureIJvEEEPKcv()|0);
 $69 = $47;
 $70 = $48;
 $41 = $70;
 $71 = (__ZN10emscripten8internal19getGenericSignatureIJvEEEPKcv()|0);
 $72 = $48;
 $73 = $45;
 $74 = $49;
 $40 = $74;
 $75 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
 $76 = $49;
 __embind_register_class(($60|0),($61|0),($62|0),($63|0),($65|0),($66|0),($68|0),($69|0),($71|0),($72|0),($73|0),($75|0),($76|0));
 $39 = $53;
 $77 = $39;
 $35 = $77;
 $36 = 106;
 $78 = $35;
 $38 = 107;
 $79 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $80 = (__ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJPNSt3__26vectorIhNS5_9allocatorIhEEEEEE8getCountEv($37)|0);
 $81 = (__ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJPNSt3__26vectorIhNS5_9allocatorIhEEEEEE8getTypesEv($37)|0);
 $82 = $38;
 $34 = $82;
 $83 = (__ZN10emscripten8internal19getGenericSignatureIJiiEEEPKcv()|0);
 $84 = $38;
 $85 = $36;
 __embind_register_class_constructor(($79|0),($80|0),($81|0),($83|0),($84|0),($85|0));
 $$field = HEAP32[$51>>2]|0;
 $$index5 = ((($51)) + 4|0);
 $$field6 = HEAP32[$$index5>>2]|0;
 HEAP32[$54>>2] = $$field;
 $$index9 = ((($54)) + 4|0);
 HEAP32[$$index9>>2] = $$field6;
 ;HEAP8[$33>>0]=HEAP8[$54>>0]|0;HEAP8[$33+1>>0]=HEAP8[$54+1>>0]|0;HEAP8[$33+2>>0]=HEAP8[$54+2>>0]|0;HEAP8[$33+3>>0]=HEAP8[$54+3>>0]|0;HEAP8[$33+4>>0]=HEAP8[$54+4>>0]|0;HEAP8[$33+5>>0]=HEAP8[$54+5>>0]|0;HEAP8[$33+6>>0]=HEAP8[$54+6>>0]|0;HEAP8[$33+7>>0]=HEAP8[$54+7>>0]|0;
 $$field11 = HEAP32[$33>>2]|0;
 $$index13 = ((($33)) + 4|0);
 $$field14 = HEAP32[$$index13>>2]|0;
 $28 = $78;
 $29 = 2974;
 HEAP32[$30>>2] = $$field11;
 $$index17 = ((($30)) + 4|0);
 HEAP32[$$index17>>2] = $$field14;
 $86 = $28;
 $31 = 108;
 $87 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $88 = $29;
 $89 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEERKhEE8getCountEv($32)|0);
 $90 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEERKhEE8getTypesEv($32)|0);
 $91 = $31;
 $27 = $91;
 $92 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $93 = $31;
 $94 = (__ZN10emscripten8internal10getContextIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvRKhEEEPT_RKSB_($30)|0);
 __embind_register_class_function(($87|0),($88|0),($89|0),($90|0),($92|0),($93|0),($94|0),0);
 $$field19 = HEAP32[$52>>2]|0;
 $$index21 = ((($52)) + 4|0);
 $$field22 = HEAP32[$$index21>>2]|0;
 HEAP32[$55>>2] = $$field19;
 $$index25 = ((($55)) + 4|0);
 HEAP32[$$index25>>2] = $$field22;
 ;HEAP8[$26>>0]=HEAP8[$55>>0]|0;HEAP8[$26+1>>0]=HEAP8[$55+1>>0]|0;HEAP8[$26+2>>0]=HEAP8[$55+2>>0]|0;HEAP8[$26+3>>0]=HEAP8[$55+3>>0]|0;HEAP8[$26+4>>0]=HEAP8[$55+4>>0]|0;HEAP8[$26+5>>0]=HEAP8[$55+5>>0]|0;HEAP8[$26+6>>0]=HEAP8[$55+6>>0]|0;HEAP8[$26+7>>0]=HEAP8[$55+7>>0]|0;
 $$field27 = HEAP32[$26>>2]|0;
 $$index29 = ((($26)) + 4|0);
 $$field30 = HEAP32[$$index29>>2]|0;
 $21 = $86;
 $22 = 2984;
 HEAP32[$23>>2] = $$field27;
 $$index33 = ((($23)) + 4|0);
 HEAP32[$$index33>>2] = $$field30;
 $95 = $21;
 $24 = 109;
 $96 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $97 = $22;
 $98 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEEjRKhEE8getCountEv($25)|0);
 $99 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEEjRKhEE8getTypesEv($25)|0);
 $100 = $24;
 $20 = $100;
 $101 = (__ZN10emscripten8internal19getGenericSignatureIJviiiiEEEPKcv()|0);
 $102 = $24;
 $103 = (__ZN10emscripten8internal10getContextIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvjRKhEEEPT_RKSB_($23)|0);
 __embind_register_class_function(($96|0),($97|0),($98|0),($99|0),($101|0),($102|0),($103|0),0);
 HEAP32[$56>>2] = (110);
 $$index35 = ((($56)) + 4|0);
 HEAP32[$$index35>>2] = 0;
 ;HEAP8[$19>>0]=HEAP8[$56>>0]|0;HEAP8[$19+1>>0]=HEAP8[$56+1>>0]|0;HEAP8[$19+2>>0]=HEAP8[$56+2>>0]|0;HEAP8[$19+3>>0]=HEAP8[$56+3>>0]|0;HEAP8[$19+4>>0]=HEAP8[$56+4>>0]|0;HEAP8[$19+5>>0]=HEAP8[$56+5>>0]|0;HEAP8[$19+6>>0]=HEAP8[$56+6>>0]|0;HEAP8[$19+7>>0]=HEAP8[$56+7>>0]|0;
 $$field37 = HEAP32[$19>>2]|0;
 $$index39 = ((($19)) + 4|0);
 $$field40 = HEAP32[$$index39>>2]|0;
 $14 = $95;
 $15 = 2991;
 HEAP32[$16>>2] = $$field37;
 $$index43 = ((($16)) + 4|0);
 HEAP32[$$index43>>2] = $$field40;
 $104 = $14;
 $17 = 111;
 $105 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $106 = $15;
 $107 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJjNS0_17AllowedRawPointerIKNSt3__26vectorIhNS5_9allocatorIhEEEEEEEE8getCountEv($18)|0);
 $108 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJjNS0_17AllowedRawPointerIKNSt3__26vectorIhNS5_9allocatorIhEEEEEEEE8getTypesEv($18)|0);
 $109 = $17;
 $13 = $109;
 $110 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $111 = $17;
 $112 = (__ZN10emscripten8internal10getContextIMNSt3__26vectorIhNS2_9allocatorIhEEEEKFjvEEEPT_RKS9_($16)|0);
 __embind_register_class_function(($105|0),($106|0),($107|0),($108|0),($110|0),($111|0),($112|0),0);
 $8 = $104;
 $9 = 2996;
 HEAP32[$10>>2] = 112;
 $113 = $8;
 $12 = 113;
 $114 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $115 = $9;
 $116 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNS_3valERKNSt3__26vectorIhNS5_9allocatorIhEEEEjEE8getCountEv($11)|0);
 $117 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNS_3valERKNSt3__26vectorIhNS5_9allocatorIhEEEEjEE8getTypesEv($11)|0);
 $118 = $12;
 $7 = $118;
 $119 = (__ZN10emscripten8internal19getGenericSignatureIJiiiiEEEPKcv()|0);
 $120 = $12;
 $121 = (__ZN10emscripten8internal10getContextIPFNS_3valERKNSt3__26vectorIhNS3_9allocatorIhEEEEjEEEPT_RKSC_($10)|0);
 __embind_register_class_function(($114|0),($115|0),($116|0),($117|0),($119|0),($120|0),($121|0),0);
 $2 = $113;
 $3 = 3000;
 HEAP32[$4>>2] = 114;
 $6 = 115;
 $122 = (__ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 $123 = $3;
 $124 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbRNSt3__26vectorIhNS4_9allocatorIhEEEEjRKhEE8getCountEv($5)|0);
 $125 = (__ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbRNSt3__26vectorIhNS4_9allocatorIhEEEEjRKhEE8getTypesEv($5)|0);
 $126 = $6;
 $1 = $126;
 $127 = (__ZN10emscripten8internal19getGenericSignatureIJiiiiiEEEPKcv()|0);
 $128 = $6;
 $129 = (__ZN10emscripten8internal10getContextIPFbRNSt3__26vectorIhNS2_9allocatorIhEEEEjRKhEEEPT_RKSC_($4)|0);
 __embind_register_class_function(($122|0),($123|0),($124|0),($125|0),($127|0),($128|0),($129|0),0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN5Motor5StateEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN5Motor5StateEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN5Motor5StateEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN5Motor5StateEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten5enum_IN10SmartDrive5UnitsEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5UnitsEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN10SmartDrive5UnitsEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5UnitsEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten5enum_IN10SmartDrive11ControlModeEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive11ControlModeEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN10SmartDrive11ControlModeEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive11ControlModeEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten12value_objectIN10SmartDrive8SettingsEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 116;
 $7 = 117;
 __THREW__ = 0;
 $11 = (invoke_i(118)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_NS1_11ControlModeEEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 120;
 $9 = 121;
 $11 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive11ControlModeEE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsENS2_11ControlModeEEEPT_RKS6_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive11ControlModeEE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsENS2_11ControlModeEEEPT_RKS6_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_NS1_5UnitsEEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 122;
 $9 = 123;
 $11 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5UnitsEE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsENS2_5UnitsEEEPT_RKS6_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5UnitsEE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsENS2_5UnitsEEEPT_RKS6_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 124;
 $9 = 125;
 $11 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_fEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 126;
 $9 = 127;
 $11 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIfE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJfiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsEfEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIfE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviifEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsEfEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN10SmartDrive8SettingsEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(118)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten5enum_IN6Packet6DeviceEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN6Packet6DeviceEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN6Packet6DeviceEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN6Packet6DeviceEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten5enum_IN6Packet4TypeEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN6Packet4TypeEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN6Packet4TypeEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN6Packet4TypeEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten5enum_IN6Packet4DataEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN6Packet4DataEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN6Packet4DataEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN6Packet4DataEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten12value_objectIN6Packet11VersionInfoEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 129;
 $7 = 130;
 __THREW__ = 0;
 $11 = (invoke_i(131)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet11VersionInfoEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 132;
 $9 = 133;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet11VersionInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet11VersionInfoEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet11VersionInfoEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet11VersionInfoEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(131)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet9DailyInfoEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 134;
 $7 = 135;
 __THREW__ = 0;
 $11 = (invoke_i(136)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet9DailyInfoEE5fieldIS2_tEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 137;
 $9 = 138;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9DailyInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9DailyInfoEtEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9DailyInfoEtEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9DailyInfoEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 139;
 $9 = 140;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9DailyInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9DailyInfoEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9DailyInfoEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9DailyInfoEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(136)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet11JourneyInfoEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 141;
 $7 = 142;
 __THREW__ = 0;
 $11 = (invoke_i(143)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet11JourneyInfoEE5fieldIS2_tEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 144;
 $9 = 145;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet11JourneyInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet11JourneyInfoEtEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet11JourneyInfoEtEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet11JourneyInfoEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 146;
 $9 = 147;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet11JourneyInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet11JourneyInfoEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet11JourneyInfoEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet11JourneyInfoEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(143)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet9MotorInfoEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 148;
 $7 = 149;
 __THREW__ = 0;
 $11 = (invoke_i(150)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet9MotorInfoEE5fieldIS2_N5Motor5StateEEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 151;
 $9 = 152;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIN5Motor5StateEE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEN5Motor5StateEEEPT_RKS7_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIN5Motor5StateEE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEN5Motor5StateEEEPT_RKS7_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9MotorInfoEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 153;
 $9 = 154;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9MotorInfoEE5fieldIS2_fEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 155;
 $9 = 156;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIfE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJfiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEfEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIfE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviifEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEfEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9MotorInfoEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(150)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet9ErrorInfoEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 157;
 $7 = 158;
 __THREW__ = 0;
 $11 = (invoke_i(159)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet9ErrorInfoEE5fieldIS2_tEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 160;
 $9 = 161;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEtEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEtEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9ErrorInfoEE5fieldIS2_N10SmartDrive5ErrorEEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 162;
 $9 = 163;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEN10SmartDrive5ErrorEEEPT_RKS7_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEN10SmartDrive5ErrorEEEPT_RKS7_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9ErrorInfoEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 164;
 $9 = 165;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet9ErrorInfoEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(159)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet10DeviceInfoEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $10 = $4;
 __ZN10emscripten8internal11noncopyableC2Ev($10);
 $6 = 166;
 $7 = 167;
 __THREW__ = 0;
 $11 = (invoke_i(168)|0);
 $12 = __THREW__; __THREW__ = 0;
 $13 = $12&1;
 if (!($13)) {
  $14 = $5;
  $15 = $6;
  $3 = $15;
  $16 = (__ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv()|0);
  $17 = $6;
  $18 = $7;
  $2 = $18;
  $19 = (__ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv()|0);
  $20 = $7;
  __THREW__ = 0;
  invoke_viiiiii(119,($11|0),($14|0),($16|0),($17|0),($19|0),($20|0));
  $21 = __THREW__; __THREW__ = 0;
  $22 = $21&1;
  if (!($22)) {
   STACKTOP = sp;return;
  }
 }
 $23 = ___cxa_find_matching_catch_2()|0;
 $24 = tempRet0;
 $8 = $23;
 $9 = $24;
 __ZN10emscripten8internal11noncopyableD2Ev($10);
 $25 = $8;
 $26 = $9;
 ___resumeException($25|0);
 // unreachable;
}
function __ZN10emscripten12value_objectIN6Packet10DeviceInfoEE5fieldIS2_NS1_6DeviceEEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 169;
 $9 = 170;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet10DeviceInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIN6Packet6DeviceEE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet10DeviceInfoENS2_6DeviceEEEPT_RKS6_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIN6Packet6DeviceEE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet10DeviceInfoENS2_6DeviceEEEPT_RKS6_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet10DeviceInfoEE5fieldIS2_hEERS3_PKcMT_T0_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $7 = sp + 8|0;
 $5 = $0;
 $6 = $1;
 HEAP32[$7>>2] = $2;
 $10 = $5;
 $8 = 171;
 $9 = 172;
 $11 = (__ZN10emscripten8internal6TypeIDIN6Packet10DeviceInfoEE3getEv()|0);
 $12 = $6;
 $13 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $14 = $8;
 $4 = $14;
 $15 = (__ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv()|0);
 $16 = $8;
 $17 = (__ZN10emscripten8internal10getContextIMN6Packet10DeviceInfoEhEEPT_RKS5_($7)|0);
 $18 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $19 = $9;
 $3 = $19;
 $20 = (__ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv()|0);
 $21 = $9;
 $22 = (__ZN10emscripten8internal10getContextIMN6Packet10DeviceInfoEhEEPT_RKS5_($7)|0);
 __embind_register_value_object_field(($11|0),($12|0),($13|0),($15|0),($16|0),($17|0),($18|0),($20|0),($21|0),($22|0));
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten12value_objectIN6Packet10DeviceInfoEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $4 = $1;
 __THREW__ = 0;
 $5 = (invoke_i(168)|0);
 $6 = __THREW__; __THREW__ = 0;
 $7 = $6&1;
 if (!($7)) {
  __THREW__ = 0;
  invoke_vi(128,($5|0));
  $8 = __THREW__; __THREW__ = 0;
  $9 = $8&1;
  if (!($9)) {
   __ZN10emscripten8internal11noncopyableD2Ev($4);
   STACKTOP = sp;return;
  }
 }
 $10 = ___cxa_find_matching_catch_3(0|0)|0;
 $11 = tempRet0;
 $2 = $10;
 $3 = $11;
 __ZN10emscripten8internal11noncopyableD2Ev($4);
 $12 = $2;
 ___clang_call_terminate($12);
 // unreachable;
}
function __ZN10emscripten5enum_IN6Packet7CommandEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN6Packet7CommandEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN6Packet7CommandEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN6Packet7CommandEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten5enum_IN6Packet3OTAEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN6Packet3OTAEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN10emscripten5enum_IN10SmartDrive5ErrorEEC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv()|0);
 $5 = $3;
 __embind_register_enum(($4|0),($5|0),1,0);
 STACKTOP = sp;return;
}
function __ZN10emscripten5enum_IN10SmartDrive5ErrorEE5valueEPKcS2_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3;
 $7 = (__ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv()|0);
 $8 = $4;
 $9 = $5;
 $10 = $9&255;
 __embind_register_enum_value(($7|0),($8|0),($10|0));
 STACKTOP = sp;return ($6|0);
}
function __ZN6Packet5validEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ((($2)) + 24|0);
 $4 = HEAP8[$3>>0]|0;
 $5 = $4&1;
 STACKTOP = sp;return ($5|0);
}
function __ZN6Packet13processPacketENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$expand_i1_val = 0, $$expand_i1_val6 = 0, $$expand_i1_val8 = 0, $$pre_trunc = 0, $$sink4 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0;
 var $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0;
 var $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0;
 var $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0;
 var $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0;
 var $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0;
 var $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0;
 var $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0;
 var $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0;
 var $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0;
 var $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0;
 var $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0;
 var $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 352|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(352|0);
 $82 = sp + 344|0;
 $83 = $0;
 $89 = $83;
 $81 = $1;
 $90 = $81;
 $80 = $90;
 $91 = $80;
 $79 = $91;
 $92 = $79;
 $78 = $92;
 $93 = $78;
 $94 = ((($93)) + 11|0);
 $95 = HEAP8[$94>>0]|0;
 $96 = $95&255;
 $97 = $96 & 128;
 $98 = ($97|0)!=(0);
 if ($98) {
  $74 = $90;
  $99 = $74;
  $73 = $99;
  $100 = $73;
  $72 = $100;
  $101 = $72;
  $102 = ((($101)) + 4|0);
  $103 = HEAP32[$102>>2]|0;
  $110 = $103;
 } else {
  $77 = $90;
  $104 = $77;
  $76 = $104;
  $105 = $76;
  $75 = $105;
  $106 = $75;
  $107 = ((($106)) + 11|0);
  $108 = HEAP8[$107>>0]|0;
  $109 = $108&255;
  $110 = $109;
 }
 $84 = $110;
 $111 = $84;
 $112 = ($111|0)<(2);
 $113 = $84;
 $114 = ($113|0)>(18);
 $or$cond = $112 | $114;
 if ($or$cond) {
  $$expand_i1_val = 0;
  HEAP8[$82>>0] = $$expand_i1_val;
  $$pre_trunc = HEAP8[$82>>0]|0;
  $249 = $$pre_trunc&1;
  STACKTOP = sp;return ($249|0);
 }
 $85 = 2;
 $86 = 1;
 $87 = 0;
 $115 = $87;
 $14 = $1;
 $15 = $115;
 $116 = $14;
 $13 = $116;
 $117 = $13;
 $12 = $117;
 $118 = $12;
 $11 = $118;
 $119 = $11;
 $10 = $119;
 $120 = $10;
 $121 = ((($120)) + 11|0);
 $122 = HEAP8[$121>>0]|0;
 $123 = $122&255;
 $124 = $123 & 128;
 $125 = ($124|0)!=(0);
 if ($125) {
  $4 = $117;
  $126 = $4;
  $3 = $126;
  $127 = $3;
  $2 = $127;
  $128 = $2;
  $129 = HEAP32[$128>>2]|0;
  $137 = $129;
 } else {
  $9 = $117;
  $130 = $9;
  $8 = $130;
  $131 = $8;
  $7 = $131;
  $132 = $7;
  $6 = $132;
  $133 = $6;
  $5 = $133;
  $134 = $5;
  $137 = $134;
 }
 $135 = $15;
 $136 = (($137) + ($135)|0);
 $138 = HEAP8[$136>>0]|0;
 $139 = ((($89)) + 4|0);
 HEAP8[$139>>0] = $138;
 $140 = ((($89)) + 4|0);
 $141 = HEAP8[$140>>0]|0;
 switch ($141<<24>>24) {
 case 1:  {
  $142 = $86;
  $28 = $1;
  $29 = $142;
  $143 = $28;
  $27 = $143;
  $144 = $27;
  $26 = $144;
  $145 = $26;
  $25 = $145;
  $146 = $25;
  $24 = $146;
  $147 = $24;
  $148 = ((($147)) + 11|0);
  $149 = HEAP8[$148>>0]|0;
  $150 = $149&255;
  $151 = $150 & 128;
  $152 = ($151|0)!=(0);
  if ($152) {
   $18 = $144;
   $153 = $18;
   $17 = $153;
   $154 = $17;
   $16 = $154;
   $155 = $16;
   $156 = HEAP32[$155>>2]|0;
   $164 = $156;
  } else {
   $23 = $144;
   $157 = $23;
   $22 = $157;
   $158 = $22;
   $21 = $158;
   $159 = $21;
   $20 = $159;
   $160 = $20;
   $19 = $160;
   $161 = $19;
   $164 = $161;
  }
  $162 = $29;
  $163 = (($164) + ($162)|0);
  $$sink4 = $163;
  label = 23;
  break;
 }
 case 2:  {
  $165 = $86;
  $42 = $1;
  $43 = $165;
  $166 = $42;
  $41 = $166;
  $167 = $41;
  $40 = $167;
  $168 = $40;
  $39 = $168;
  $169 = $39;
  $38 = $169;
  $170 = $38;
  $171 = ((($170)) + 11|0);
  $172 = HEAP8[$171>>0]|0;
  $173 = $172&255;
  $174 = $173 & 128;
  $175 = ($174|0)!=(0);
  if ($175) {
   $32 = $167;
   $176 = $32;
   $31 = $176;
   $177 = $31;
   $30 = $177;
   $178 = $30;
   $179 = HEAP32[$178>>2]|0;
   $187 = $179;
  } else {
   $37 = $167;
   $180 = $37;
   $36 = $180;
   $181 = $36;
   $35 = $181;
   $182 = $35;
   $34 = $182;
   $183 = $34;
   $33 = $183;
   $184 = $33;
   $187 = $184;
  }
  $185 = $43;
  $186 = (($187) + ($185)|0);
  $$sink4 = $186;
  label = 23;
  break;
 }
 case 3:  {
  $188 = $86;
  $56 = $1;
  $57 = $188;
  $189 = $56;
  $55 = $189;
  $190 = $55;
  $54 = $190;
  $191 = $54;
  $53 = $191;
  $192 = $53;
  $52 = $192;
  $193 = $52;
  $194 = ((($193)) + 11|0);
  $195 = HEAP8[$194>>0]|0;
  $196 = $195&255;
  $197 = $196 & 128;
  $198 = ($197|0)!=(0);
  if ($198) {
   $46 = $190;
   $199 = $46;
   $45 = $199;
   $200 = $45;
   $44 = $200;
   $201 = $44;
   $202 = HEAP32[$201>>2]|0;
   $210 = $202;
  } else {
   $51 = $190;
   $203 = $51;
   $50 = $203;
   $204 = $50;
   $49 = $204;
   $205 = $49;
   $48 = $205;
   $206 = $48;
   $47 = $206;
   $207 = $47;
   $210 = $207;
  }
  $208 = $57;
  $209 = (($210) + ($208)|0);
  $$sink4 = $209;
  label = 23;
  break;
 }
 case 4:  {
  break;
 }
 default: {
  $$expand_i1_val6 = 0;
  HEAP8[$82>>0] = $$expand_i1_val6;
  $$pre_trunc = HEAP8[$82>>0]|0;
  $249 = $$pre_trunc&1;
  STACKTOP = sp;return ($249|0);
 }
 }
 if ((label|0) == 23) {
  $211 = HEAP8[$$sink4>>0]|0;
  $212 = ((($89)) + 5|0);
  HEAP8[$212>>0] = $211;
 }
 $213 = $84;
 $214 = (($213) - 2)|0;
 HEAP32[$89>>2] = $214;
 $88 = 0;
 while(1) {
  $215 = $88;
  $216 = HEAP32[$89>>2]|0;
  $217 = ($215|0)<($216|0);
  if (!($217)) {
   break;
  }
  $218 = $85;
  $219 = $88;
  $220 = (($218) + ($219))|0;
  $70 = $1;
  $71 = $220;
  $221 = $70;
  $69 = $221;
  $222 = $69;
  $68 = $222;
  $223 = $68;
  $67 = $223;
  $224 = $67;
  $66 = $224;
  $225 = $66;
  $226 = ((($225)) + 11|0);
  $227 = HEAP8[$226>>0]|0;
  $228 = $227&255;
  $229 = $228 & 128;
  $230 = ($229|0)!=(0);
  if ($230) {
   $60 = $222;
   $231 = $60;
   $59 = $231;
   $232 = $59;
   $58 = $232;
   $233 = $58;
   $234 = HEAP32[$233>>2]|0;
   $242 = $234;
  } else {
   $65 = $222;
   $235 = $65;
   $64 = $235;
   $236 = $64;
   $63 = $236;
   $237 = $63;
   $62 = $237;
   $238 = $62;
   $61 = $238;
   $239 = $61;
   $242 = $239;
  }
  $240 = $71;
  $241 = (($242) + ($240)|0);
  $243 = HEAP8[$241>>0]|0;
  $244 = ((($89)) + 8|0);
  $245 = $88;
  $246 = (($244) + ($245)|0);
  HEAP8[$246>>0] = $243;
  $247 = $88;
  $248 = (($247) + 1)|0;
  $88 = $248;
 }
 $$expand_i1_val8 = 1;
 HEAP8[$82>>0] = $$expand_i1_val8;
 $$pre_trunc = HEAP8[$82>>0]|0;
 $249 = $$pre_trunc&1;
 STACKTOP = sp;return ($249|0);
}
function __ZN6Packet9newPacketEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 HEAP32[$2>>2] = 0;
 $3 = ((($2)) + 24|0);
 HEAP8[$3>>0] = 0;
 $4 = ((($2)) + 4|0);
 HEAP8[$4>>0] = 0;
 STACKTOP = sp;return;
}
function __ZN6Packet6formatEv($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$expand_i1_val = 0, $$expand_i1_val2 = 0, $$pre_trunc = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0;
 var $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0;
 var $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0;
 var $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0;
 var $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0;
 var $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0;
 var $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0;
 var $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0;
 var $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0;
 var $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0;
 var $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0;
 var $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0;
 var $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0;
 var $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0;
 var $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0;
 var $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0;
 var $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0;
 var $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0;
 var $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0;
 var $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0;
 var $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0;
 var $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0;
 var $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0;
 var $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 768|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(768|0);
 $14 = sp + 40|0;
 $19 = sp + 765|0;
 $29 = sp + 764|0;
 $43 = sp + 32|0;
 $48 = sp + 763|0;
 $59 = sp + 762|0;
 $73 = sp + 24|0;
 $78 = sp + 761|0;
 $89 = sp + 760|0;
 $103 = sp + 16|0;
 $108 = sp + 759|0;
 $119 = sp + 758|0;
 $133 = sp + 8|0;
 $138 = sp + 757|0;
 $149 = sp + 756|0;
 $163 = sp;
 $168 = sp + 755|0;
 $179 = sp + 754|0;
 $183 = sp + 92|0;
 $186 = sp + 80|0;
 $191 = sp + 753|0;
 $193 = sp + 752|0;
 $197 = sp + 751|0;
 $198 = sp + 750|0;
 $199 = sp + 749|0;
 $200 = sp + 748|0;
 $190 = $1;
 $202 = $190;
 $$expand_i1_val = 0;
 HEAP8[$191>>0] = $$expand_i1_val;
 $189 = $0;
 $203 = $189;
 $188 = $203;
 $204 = $188;
 $187 = $204;
 HEAP32[$204>>2] = 0;
 $205 = ((($204)) + 4|0);
 HEAP32[$205>>2] = 0;
 $206 = ((($204)) + 8|0);
 $185 = $206;
 HEAP32[$186>>2] = 0;
 $207 = $185;
 $184 = $186;
 $208 = $184;
 $209 = HEAP32[$208>>2]|0;
 $182 = $207;
 HEAP32[$183>>2] = $209;
 $210 = $182;
 $181 = $210;
 $180 = $183;
 $211 = $180;
 $212 = HEAP32[$211>>2]|0;
 HEAP32[$210>>2] = $212;
 $192 = 2;
 $213 = ((($202)) + 4|0);
 $214 = HEAP8[$213>>0]|0;
 HEAP8[$193>>0] = $214;
 $177 = $0;
 $178 = $193;
 $215 = $177;
 $216 = ((($215)) + 4|0);
 $217 = HEAP32[$216>>2]|0;
 $176 = $215;
 $218 = $176;
 $219 = ((($218)) + 8|0);
 $175 = $219;
 $220 = $175;
 $174 = $220;
 $221 = $174;
 $222 = HEAP32[$221>>2]|0;
 $223 = ($217>>>0)<($222>>>0);
 if ($223) {
  $171 = $179;
  $172 = $215;
  $173 = 1;
  $152 = $215;
  $224 = $152;
  $225 = ((($224)) + 8|0);
  $151 = $225;
  $226 = $151;
  $150 = $226;
  $227 = $150;
  $228 = ((($215)) + 4|0);
  $229 = HEAP32[$228>>2]|0;
  $153 = $229;
  $230 = $153;
  $231 = $178;
  $154 = $231;
  $232 = $154;
  $165 = $227;
  $166 = $230;
  $167 = $232;
  $233 = $165;
  $234 = $166;
  $235 = $167;
  $164 = $235;
  $236 = $164;
  ;HEAP8[$163>>0]=HEAP8[$168>>0]|0;
  $160 = $233;
  $161 = $234;
  $162 = $236;
  $237 = $160;
  $238 = $161;
  $239 = $162;
  $159 = $239;
  $240 = $159;
  $156 = $237;
  $157 = $238;
  $158 = $240;
  $241 = $157;
  $242 = $158;
  $155 = $242;
  $243 = $155;
  $244 = HEAP8[$243>>0]|0;
  HEAP8[$241>>0] = $244;
  $169 = $179;
  $245 = ((($215)) + 4|0);
  $246 = HEAP32[$245>>2]|0;
  $247 = ((($246)) + 1|0);
  HEAP32[$245>>2] = $247;
 } else {
  $248 = $178;
  $170 = $248;
  $249 = $170;
  __THREW__ = 0;
  invoke_vii(173,($215|0),($249|0));
  $250 = __THREW__; __THREW__ = 0;
  $251 = $250&1;
  if ($251) {
   $254 = ___cxa_find_matching_catch_2()|0;
   $255 = tempRet0;
   $194 = $254;
   $195 = $255;
   __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
   $256 = $194;
   $257 = $195;
   ___resumeException($256|0);
   // unreachable;
  }
 }
 $196 = 0;
 $252 = ((($202)) + 4|0);
 $253 = HEAP8[$252>>0]|0;
 L6: do {
  switch ($253<<24>>24) {
  case 1:  {
   $258 = ((($202)) + 5|0);
   $259 = HEAP8[$258>>0]|0;
   HEAP8[$197>>0] = $259;
   $147 = $0;
   $148 = $197;
   $260 = $147;
   $261 = ((($260)) + 4|0);
   $262 = HEAP32[$261>>2]|0;
   $146 = $260;
   $263 = $146;
   $264 = ((($263)) + 8|0);
   $145 = $264;
   $265 = $145;
   $144 = $265;
   $266 = $144;
   $267 = HEAP32[$266>>2]|0;
   $268 = ($262>>>0)<($267>>>0);
   if ($268) {
    $141 = $149;
    $142 = $260;
    $143 = 1;
    $122 = $260;
    $269 = $122;
    $270 = ((($269)) + 8|0);
    $121 = $270;
    $271 = $121;
    $120 = $271;
    $272 = $120;
    $273 = ((($260)) + 4|0);
    $274 = HEAP32[$273>>2]|0;
    $123 = $274;
    $275 = $123;
    $276 = $148;
    $124 = $276;
    $277 = $124;
    $135 = $272;
    $136 = $275;
    $137 = $277;
    $278 = $135;
    $279 = $136;
    $280 = $137;
    $134 = $280;
    $281 = $134;
    ;HEAP8[$133>>0]=HEAP8[$138>>0]|0;
    $130 = $278;
    $131 = $279;
    $132 = $281;
    $282 = $130;
    $283 = $131;
    $284 = $132;
    $129 = $284;
    $285 = $129;
    $126 = $282;
    $127 = $283;
    $128 = $285;
    $286 = $127;
    $287 = $128;
    $125 = $287;
    $288 = $125;
    $289 = HEAP8[$288>>0]|0;
    HEAP8[$286>>0] = $289;
    $139 = $149;
    $290 = ((($260)) + 4|0);
    $291 = HEAP32[$290>>2]|0;
    $292 = ((($291)) + 1|0);
    HEAP32[$290>>2] = $292;
   } else {
    $293 = $148;
    $140 = $293;
    $294 = $140;
    __THREW__ = 0;
    invoke_vii(173,($260|0),($294|0));
    $295 = __THREW__; __THREW__ = 0;
    $296 = $295&1;
    if ($296) {
     $254 = ___cxa_find_matching_catch_2()|0;
     $255 = tempRet0;
     $194 = $254;
     $195 = $255;
     __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
     $256 = $194;
     $257 = $195;
     ___resumeException($256|0);
     // unreachable;
    }
   }
   $297 = ((($202)) + 5|0);
   $298 = HEAP8[$297>>0]|0;
   do {
    switch ($298<<24>>24) {
    case 0:  {
     $196 = 8;
     break L6;
     break;
    }
    case 1:  {
     $196 = 4;
     break L6;
     break;
    }
    case 2:  {
     $196 = 4;
     break L6;
     break;
    }
    case 3:  {
     $196 = 2;
     break L6;
     break;
    }
    case 4:  {
     $196 = 1;
     break L6;
     break;
    }
    case 5:  {
     $196 = 1;
     break L6;
     break;
    }
    case 6:  {
     $196 = 3;
     break L6;
     break;
    }
    case 7:  {
     $196 = 16;
     break L6;
     break;
    }
    case 8:  {
     $196 = 4;
     break L6;
     break;
    }
    case 9:  {
     $196 = 16;
     break L6;
     break;
    }
    case 10:  {
     $196 = 2;
     break L6;
     break;
    }
    case 11:  {
     $196 = 0;
     break L6;
     break;
    }
    case 12:  {
     $196 = 14;
     break L6;
     break;
    }
    default: {
     break L6;
    }
    }
   } while(0);
   break;
  }
  case 2:  {
   $299 = ((($202)) + 5|0);
   $300 = HEAP8[$299>>0]|0;
   HEAP8[$198>>0] = $300;
   $117 = $0;
   $118 = $198;
   $301 = $117;
   $302 = ((($301)) + 4|0);
   $303 = HEAP32[$302>>2]|0;
   $116 = $301;
   $304 = $116;
   $305 = ((($304)) + 8|0);
   $115 = $305;
   $306 = $115;
   $114 = $306;
   $307 = $114;
   $308 = HEAP32[$307>>2]|0;
   $309 = ($303>>>0)<($308>>>0);
   if ($309) {
    $111 = $119;
    $112 = $301;
    $113 = 1;
    $92 = $301;
    $310 = $92;
    $311 = ((($310)) + 8|0);
    $91 = $311;
    $312 = $91;
    $90 = $312;
    $313 = $90;
    $314 = ((($301)) + 4|0);
    $315 = HEAP32[$314>>2]|0;
    $93 = $315;
    $316 = $93;
    $317 = $118;
    $94 = $317;
    $318 = $94;
    $105 = $313;
    $106 = $316;
    $107 = $318;
    $319 = $105;
    $320 = $106;
    $321 = $107;
    $104 = $321;
    $322 = $104;
    ;HEAP8[$103>>0]=HEAP8[$108>>0]|0;
    $100 = $319;
    $101 = $320;
    $102 = $322;
    $323 = $100;
    $324 = $101;
    $325 = $102;
    $99 = $325;
    $326 = $99;
    $96 = $323;
    $97 = $324;
    $98 = $326;
    $327 = $97;
    $328 = $98;
    $95 = $328;
    $329 = $95;
    $330 = HEAP8[$329>>0]|0;
    HEAP8[$327>>0] = $330;
    $109 = $119;
    $331 = ((($301)) + 4|0);
    $332 = HEAP32[$331>>2]|0;
    $333 = ((($332)) + 1|0);
    HEAP32[$331>>2] = $333;
   } else {
    $334 = $118;
    $110 = $334;
    $335 = $110;
    __THREW__ = 0;
    invoke_vii(173,($301|0),($335|0));
    $336 = __THREW__; __THREW__ = 0;
    $337 = $336&1;
    if ($337) {
     $254 = ___cxa_find_matching_catch_2()|0;
     $255 = tempRet0;
     $194 = $254;
     $195 = $255;
     __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
     $256 = $194;
     $257 = $195;
     ___resumeException($256|0);
     // unreachable;
    }
   }
   $338 = ((($202)) + 5|0);
   $339 = HEAP8[$338>>0]|0;
   switch ($339<<24>>24) {
   case 11:  {
    $196 = 1;
    break L6;
    break;
   }
   case 12:  {
    $196 = 1;
    break L6;
    break;
   }
   case 5:  {
    $196 = 16;
    break L6;
    break;
   }
   default: {
    break L6;
   }
   }
   break;
  }
  case 3:  {
   $340 = ((($202)) + 5|0);
   $341 = HEAP8[$340>>0]|0;
   HEAP8[$199>>0] = $341;
   $87 = $0;
   $88 = $199;
   $342 = $87;
   $343 = ((($342)) + 4|0);
   $344 = HEAP32[$343>>2]|0;
   $86 = $342;
   $345 = $86;
   $346 = ((($345)) + 8|0);
   $85 = $346;
   $347 = $85;
   $84 = $347;
   $348 = $84;
   $349 = HEAP32[$348>>2]|0;
   $350 = ($344>>>0)<($349>>>0);
   if ($350) {
    $81 = $89;
    $82 = $342;
    $83 = 1;
    $62 = $342;
    $351 = $62;
    $352 = ((($351)) + 8|0);
    $61 = $352;
    $353 = $61;
    $60 = $353;
    $354 = $60;
    $355 = ((($342)) + 4|0);
    $356 = HEAP32[$355>>2]|0;
    $63 = $356;
    $357 = $63;
    $358 = $88;
    $64 = $358;
    $359 = $64;
    $75 = $354;
    $76 = $357;
    $77 = $359;
    $360 = $75;
    $361 = $76;
    $362 = $77;
    $74 = $362;
    $363 = $74;
    ;HEAP8[$73>>0]=HEAP8[$78>>0]|0;
    $70 = $360;
    $71 = $361;
    $72 = $363;
    $364 = $70;
    $365 = $71;
    $366 = $72;
    $69 = $366;
    $367 = $69;
    $66 = $364;
    $67 = $365;
    $68 = $367;
    $368 = $67;
    $369 = $68;
    $65 = $369;
    $370 = $65;
    $371 = HEAP8[$370>>0]|0;
    HEAP8[$368>>0] = $371;
    $79 = $89;
    $372 = ((($342)) + 4|0);
    $373 = HEAP32[$372>>2]|0;
    $374 = ((($373)) + 1|0);
    HEAP32[$372>>2] = $374;
   } else {
    $375 = $88;
    $80 = $375;
    $376 = $80;
    __THREW__ = 0;
    invoke_vii(173,($342|0),($376|0));
    $377 = __THREW__; __THREW__ = 0;
    $378 = $377&1;
    if ($378) {
     $254 = ___cxa_find_matching_catch_2()|0;
     $255 = tempRet0;
     $194 = $254;
     $195 = $255;
     __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
     $256 = $194;
     $257 = $195;
     ___resumeException($256|0);
     // unreachable;
    }
   }
   $196 = 8;
   break;
  }
  case 4:  {
   $379 = ((($202)) + 5|0);
   $380 = HEAP8[$379>>0]|0;
   HEAP8[$200>>0] = $380;
   $57 = $0;
   $58 = $200;
   $381 = $57;
   $382 = ((($381)) + 4|0);
   $383 = HEAP32[$382>>2]|0;
   $56 = $381;
   $384 = $56;
   $385 = ((($384)) + 8|0);
   $55 = $385;
   $386 = $55;
   $54 = $386;
   $387 = $54;
   $388 = HEAP32[$387>>2]|0;
   $389 = ($383>>>0)<($388>>>0);
   if ($389) {
    $51 = $59;
    $52 = $381;
    $53 = 1;
    $32 = $381;
    $390 = $32;
    $391 = ((($390)) + 8|0);
    $31 = $391;
    $392 = $31;
    $30 = $392;
    $393 = $30;
    $394 = ((($381)) + 4|0);
    $395 = HEAP32[$394>>2]|0;
    $33 = $395;
    $396 = $33;
    $397 = $58;
    $34 = $397;
    $398 = $34;
    $45 = $393;
    $46 = $396;
    $47 = $398;
    $399 = $45;
    $400 = $46;
    $401 = $47;
    $44 = $401;
    $402 = $44;
    ;HEAP8[$43>>0]=HEAP8[$48>>0]|0;
    $40 = $399;
    $41 = $400;
    $42 = $402;
    $403 = $40;
    $404 = $41;
    $405 = $42;
    $39 = $405;
    $406 = $39;
    $36 = $403;
    $37 = $404;
    $38 = $406;
    $407 = $37;
    $408 = $38;
    $35 = $408;
    $409 = $35;
    $410 = HEAP8[$409>>0]|0;
    HEAP8[$407>>0] = $410;
    $49 = $59;
    $411 = ((($381)) + 4|0);
    $412 = HEAP32[$411>>2]|0;
    $413 = ((($412)) + 1|0);
    HEAP32[$411>>2] = $413;
   } else {
    $414 = $58;
    $50 = $414;
    $415 = $50;
    __THREW__ = 0;
    invoke_vii(173,($381|0),($415|0));
    $416 = __THREW__; __THREW__ = 0;
    $417 = $416&1;
    if ($417) {
     $254 = ___cxa_find_matching_catch_2()|0;
     $255 = tempRet0;
     $194 = $254;
     $195 = $255;
     __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
     $256 = $194;
     $257 = $195;
     ___resumeException($256|0);
     // unreachable;
    }
   }
   $418 = HEAP32[$202>>2]|0;
   $196 = $418;
   break;
  }
  default: {
  }
  }
 } while(0);
 $201 = 0;
 while(1) {
  $419 = $201;
  $420 = $196;
  $421 = ($419|0)<($420|0);
  if (!($421)) {
   break;
  }
  $422 = ((($202)) + 8|0);
  $423 = $201;
  $424 = (($422) + ($423)|0);
  $27 = $0;
  $28 = $424;
  $425 = $27;
  $426 = ((($425)) + 4|0);
  $427 = HEAP32[$426>>2]|0;
  $26 = $425;
  $428 = $26;
  $429 = ((($428)) + 8|0);
  $25 = $429;
  $430 = $25;
  $24 = $430;
  $431 = $24;
  $432 = HEAP32[$431>>2]|0;
  $433 = ($427|0)!=($432|0);
  if ($433) {
   $21 = $29;
   $22 = $425;
   $23 = 1;
   $4 = $425;
   $434 = $4;
   $435 = ((($434)) + 8|0);
   $3 = $435;
   $436 = $3;
   $2 = $436;
   $437 = $2;
   $438 = ((($425)) + 4|0);
   $439 = HEAP32[$438>>2]|0;
   $5 = $439;
   $440 = $5;
   $441 = $28;
   $16 = $437;
   $17 = $440;
   $18 = $441;
   $442 = $16;
   $443 = $17;
   $444 = $18;
   $15 = $444;
   $445 = $15;
   ;HEAP8[$14>>0]=HEAP8[$19>>0]|0;
   $11 = $442;
   $12 = $443;
   $13 = $445;
   $446 = $11;
   $447 = $12;
   $448 = $13;
   $10 = $448;
   $449 = $10;
   $7 = $446;
   $8 = $447;
   $9 = $449;
   $450 = $8;
   $451 = $9;
   $6 = $451;
   $452 = $6;
   $453 = HEAP8[$452>>0]|0;
   HEAP8[$450>>0] = $453;
   $20 = $29;
   $454 = ((($425)) + 4|0);
   $455 = HEAP32[$454>>2]|0;
   $456 = ((($455)) + 1|0);
   HEAP32[$454>>2] = $456;
  } else {
   $457 = $28;
   __THREW__ = 0;
   invoke_vii(174,($425|0),($457|0));
   $458 = __THREW__; __THREW__ = 0;
   $459 = $458&1;
   if ($459) {
    label = 5;
    break;
   }
  }
  $460 = $201;
  $461 = (($460) + 1)|0;
  $201 = $461;
 }
 if ((label|0) == 5) {
  $254 = ___cxa_find_matching_catch_2()|0;
  $255 = tempRet0;
  $194 = $254;
  $195 = $255;
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
  $256 = $194;
  $257 = $195;
  ___resumeException($256|0);
  // unreachable;
 }
 $462 = $196;
 $463 = $192;
 $464 = (($463) + ($462))|0;
 $192 = $464;
 __ZNSt3__26vectorIhNS_9allocatorIhEEE13shrink_to_fitEv($0);
 $$expand_i1_val2 = 1;
 HEAP8[$191>>0] = $$expand_i1_val2;
 $$pre_trunc = HEAP8[$191>>0]|0;
 $465 = $$pre_trunc&1;
 if ($465) {
  STACKTOP = sp;return;
 }
 __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
 STACKTOP = sp;return;
}
function __ZNK6Packet16getMotorDistanceEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ((($2)) + 8|0);
 $4 = $3;
 $5 = $4;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + 4)|0;
 $8 = $7;
 $9 = HEAP32[$8>>2]|0;
 STACKTOP = sp;return ($6|0);
}
function __ZN6Packet16setMotorDistanceEi($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $2;
 $5 = $3;
 $6 = ($5|0)<(0);
 $7 = $6 << 31 >> 31;
 $8 = ((($4)) + 8|0);
 $9 = $8;
 $10 = $9;
 HEAP32[$10>>2] = $5;
 $11 = (($9) + 4)|0;
 $12 = $11;
 HEAP32[$12>>2] = $7;
 STACKTOP = sp;return;
}
function __ZNK6Packet8getBytesEv($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$expand_i1_val = 0, $$expand_i1_val2 = 0, $$pre_trunc = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0;
 var $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0;
 var $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0;
 var $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0;
 var $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0;
 var $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 176|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(176|0);
 $15 = sp;
 $20 = sp + 171|0;
 $31 = sp + 170|0;
 $35 = sp + 44|0;
 $38 = sp + 32|0;
 $43 = sp + 169|0;
 $45 = sp + 168|0;
 $42 = $1;
 $48 = $42;
 $$expand_i1_val = 0;
 HEAP8[$43>>0] = $$expand_i1_val;
 $41 = $0;
 $49 = $41;
 $40 = $49;
 $50 = $40;
 $39 = $50;
 HEAP32[$50>>2] = 0;
 $51 = ((($50)) + 4|0);
 HEAP32[$51>>2] = 0;
 $52 = ((($50)) + 8|0);
 $37 = $52;
 HEAP32[$38>>2] = 0;
 $53 = $37;
 $36 = $38;
 $54 = $36;
 $55 = HEAP32[$54>>2]|0;
 $34 = $53;
 HEAP32[$35>>2] = $55;
 $56 = $34;
 $33 = $56;
 $32 = $35;
 $57 = $32;
 $58 = HEAP32[$57>>2]|0;
 HEAP32[$56>>2] = $58;
 $44 = 0;
 while(1) {
  $59 = $44;
  $60 = ($59|0)<(16);
  if (!($60)) {
   break;
  }
  $61 = ((($48)) + 8|0);
  $62 = $44;
  $63 = (($61) + ($62)|0);
  $64 = HEAP8[$63>>0]|0;
  HEAP8[$45>>0] = $64;
  $29 = $0;
  $30 = $45;
  $65 = $29;
  $66 = ((($65)) + 4|0);
  $67 = HEAP32[$66>>2]|0;
  $28 = $65;
  $68 = $28;
  $69 = ((($68)) + 8|0);
  $27 = $69;
  $70 = $27;
  $26 = $70;
  $71 = $26;
  $72 = HEAP32[$71>>2]|0;
  $73 = ($67>>>0)<($72>>>0);
  if ($73) {
   $23 = $31;
   $24 = $65;
   $25 = 1;
   $4 = $65;
   $74 = $4;
   $75 = ((($74)) + 8|0);
   $3 = $75;
   $76 = $3;
   $2 = $76;
   $77 = $2;
   $78 = ((($65)) + 4|0);
   $79 = HEAP32[$78>>2]|0;
   $5 = $79;
   $80 = $5;
   $81 = $30;
   $6 = $81;
   $82 = $6;
   $17 = $77;
   $18 = $80;
   $19 = $82;
   $83 = $17;
   $84 = $18;
   $85 = $19;
   $16 = $85;
   $86 = $16;
   ;HEAP8[$15>>0]=HEAP8[$20>>0]|0;
   $12 = $83;
   $13 = $84;
   $14 = $86;
   $87 = $12;
   $88 = $13;
   $89 = $14;
   $11 = $89;
   $90 = $11;
   $8 = $87;
   $9 = $88;
   $10 = $90;
   $91 = $9;
   $92 = $10;
   $7 = $92;
   $93 = $7;
   $94 = HEAP8[$93>>0]|0;
   HEAP8[$91>>0] = $94;
   $21 = $31;
   $95 = ((($65)) + 4|0);
   $96 = HEAP32[$95>>2]|0;
   $97 = ((($96)) + 1|0);
   HEAP32[$95>>2] = $97;
  } else {
   $98 = $30;
   $22 = $98;
   $99 = $22;
   __THREW__ = 0;
   invoke_vii(173,($65|0),($99|0));
   $100 = __THREW__; __THREW__ = 0;
   $101 = $100&1;
   if ($101) {
    label = 7;
    break;
   }
  }
  $102 = $44;
  $103 = (($102) + 1)|0;
  $44 = $103;
 }
 if ((label|0) == 7) {
  $104 = ___cxa_find_matching_catch_2()|0;
  $105 = tempRet0;
  $46 = $104;
  $47 = $105;
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
  $106 = $46;
  $107 = $47;
  ___resumeException($106|0);
  // unreachable;
 }
 $$expand_i1_val2 = 1;
 HEAP8[$43>>0] = $$expand_i1_val2;
 $$pre_trunc = HEAP8[$43>>0]|0;
 $108 = $$pre_trunc&1;
 if ($108) {
  STACKTOP = sp;return;
 }
 __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0);
 STACKTOP = sp;return;
}
function __ZN6Packet8setBytesENSt3__26vectorIhNS0_9allocatorIhEEEE($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $5 = $0;
 $7 = $5;
 $6 = 0;
 while(1) {
  $8 = $6;
  $4 = $1;
  $9 = $4;
  $10 = ((($9)) + 4|0);
  $11 = HEAP32[$10>>2]|0;
  $12 = HEAP32[$9>>2]|0;
  $13 = $11;
  $14 = $12;
  $15 = (($13) - ($14))|0;
  $16 = ($8>>>0)<($15>>>0);
  if (!($16)) {
   break;
  }
  $17 = $6;
  $2 = $1;
  $3 = $17;
  $18 = $2;
  $19 = HEAP32[$18>>2]|0;
  $20 = $3;
  $21 = (($19) + ($20)|0);
  $22 = HEAP8[$21>>0]|0;
  $23 = ((($7)) + 8|0);
  $24 = $6;
  $25 = (($23) + ($24)|0);
  HEAP8[$25>>0] = $22;
  $26 = $6;
  $27 = (($26) + 1)|0;
  $6 = $27;
 }
 STACKTOP = sp;return;
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE9push_backERKh($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(112|0);
 $14 = sp;
 $19 = sp + 105|0;
 $29 = sp + 104|0;
 $27 = $0;
 $28 = $1;
 $30 = $27;
 $31 = ((($30)) + 4|0);
 $32 = HEAP32[$31>>2]|0;
 $26 = $30;
 $33 = $26;
 $34 = ((($33)) + 8|0);
 $25 = $34;
 $35 = $25;
 $24 = $35;
 $36 = $24;
 $37 = HEAP32[$36>>2]|0;
 $38 = ($32|0)!=($37|0);
 if ($38) {
  $21 = $29;
  $22 = $30;
  $23 = 1;
  $4 = $30;
  $39 = $4;
  $40 = ((($39)) + 8|0);
  $3 = $40;
  $41 = $3;
  $2 = $41;
  $42 = $2;
  $43 = ((($30)) + 4|0);
  $44 = HEAP32[$43>>2]|0;
  $5 = $44;
  $45 = $5;
  $46 = $28;
  $16 = $42;
  $17 = $45;
  $18 = $46;
  $47 = $16;
  $48 = $17;
  $49 = $18;
  $15 = $49;
  $50 = $15;
  ;HEAP8[$14>>0]=HEAP8[$19>>0]|0;
  $11 = $47;
  $12 = $48;
  $13 = $50;
  $51 = $11;
  $52 = $12;
  $53 = $13;
  $10 = $53;
  $54 = $10;
  $7 = $51;
  $8 = $52;
  $9 = $54;
  $55 = $8;
  $56 = $9;
  $6 = $56;
  $57 = $6;
  $58 = HEAP8[$57>>0]|0;
  HEAP8[$55>>0] = $58;
  $20 = $29;
  $59 = ((($30)) + 4|0);
  $60 = HEAP32[$59>>2]|0;
  $61 = ((($60)) + 1|0);
  HEAP32[$59>>2] = $61;
  STACKTOP = sp;return;
 } else {
  $62 = $28;
  __ZNSt3__26vectorIhNS_9allocatorIhEEE21__push_back_slow_pathIRKhEEvOT_($30,$62);
  STACKTOP = sp;return;
 }
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE13shrink_to_fitEv($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(80|0);
 $14 = sp + 8|0;
 $12 = $0;
 $17 = $12;
 $11 = $17;
 $18 = $11;
 $10 = $18;
 $19 = $10;
 $9 = $19;
 $20 = $9;
 $21 = ((($20)) + 8|0);
 $8 = $21;
 $22 = $8;
 $7 = $22;
 $23 = $7;
 $24 = HEAP32[$23>>2]|0;
 $25 = HEAP32[$19>>2]|0;
 $26 = $24;
 $27 = $25;
 $28 = (($26) - ($27))|0;
 $6 = $17;
 $29 = $6;
 $30 = ((($29)) + 4|0);
 $31 = HEAP32[$30>>2]|0;
 $32 = HEAP32[$29>>2]|0;
 $33 = $31;
 $34 = $32;
 $35 = (($33) - ($34))|0;
 $36 = ($28>>>0)>($35>>>0);
 if (!($36)) {
  STACKTOP = sp;return;
 }
 $5 = $17;
 $37 = $5;
 $38 = ((($37)) + 8|0);
 $4 = $38;
 $39 = $4;
 $3 = $39;
 $40 = $3;
 $13 = $40;
 $2 = $17;
 $41 = $2;
 $42 = ((($41)) + 4|0);
 $43 = HEAP32[$42>>2]|0;
 $44 = HEAP32[$41>>2]|0;
 $45 = $43;
 $46 = $44;
 $47 = (($45) - ($46))|0;
 $1 = $17;
 $48 = $1;
 $49 = ((($48)) + 4|0);
 $50 = HEAP32[$49>>2]|0;
 $51 = HEAP32[$48>>2]|0;
 $52 = $50;
 $53 = $51;
 $54 = (($52) - ($53))|0;
 $55 = $13;
 __THREW__ = 0;
 invoke_viiii(175,($14|0),($47|0),($54|0),($55|0));
 $56 = __THREW__; __THREW__ = 0;
 $57 = $56&1;
 do {
  if ($57) {
   $60 = ___cxa_find_matching_catch_3(0|0)|0;
   $61 = tempRet0;
   $15 = $60;
   $16 = $61;
  } else {
   __THREW__ = 0;
   invoke_vii(176,($17|0),($14|0));
   $58 = __THREW__; __THREW__ = 0;
   $59 = $58&1;
   if ($59) {
    $62 = ___cxa_find_matching_catch_3(0|0)|0;
    $63 = tempRet0;
    $15 = $62;
    $16 = $63;
    __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($14);
    break;
   }
   __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($14);
   STACKTOP = sp;return;
  }
 } while(0);
 $64 = $15;
 (___cxa_begin_catch(($64|0))|0);
 __THREW__ = 0;
 invoke_v(177);
 $65 = __THREW__; __THREW__ = 0;
 $66 = $65&1;
 if ($66) {
  $67 = ___cxa_find_matching_catch_3(0|0)|0;
  $68 = tempRet0;
  ___clang_call_terminate($67);
  // unreachable;
 } else {
  STACKTOP = sp;return;
 }
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 __ZNSt3__213__vector_baseIhNS_9allocatorIhEEED2Ev($2);
 STACKTOP = sp;return;
}
function ___clang_call_terminate($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 (___cxa_begin_catch(($0|0))|0);
 __ZSt9terminatev();
 // unreachable;
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE21__push_back_slow_pathIhEEvOT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $14 = 0, $15 = 0;
 var $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 208|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(208|0);
 $10 = sp + 8|0;
 $15 = sp + 201|0;
 $24 = sp;
 $27 = sp + 200|0;
 $35 = sp + 80|0;
 $38 = sp + 68|0;
 $46 = sp + 20|0;
 $43 = $0;
 $44 = $1;
 $49 = $43;
 $42 = $49;
 $50 = $42;
 $51 = ((($50)) + 8|0);
 $41 = $51;
 $52 = $41;
 $40 = $52;
 $53 = $40;
 $45 = $53;
 $39 = $49;
 $54 = $39;
 $55 = ((($54)) + 4|0);
 $56 = HEAP32[$55>>2]|0;
 $57 = HEAP32[$54>>2]|0;
 $58 = $56;
 $59 = $57;
 $60 = (($58) - ($59))|0;
 $61 = (($60) + 1)|0;
 $34 = $49;
 HEAP32[$35>>2] = $61;
 $62 = $34;
 $63 = (__ZNKSt3__26vectorIhNS_9allocatorIhEEE8max_sizeEv($62)|0);
 $36 = $63;
 $64 = HEAP32[$35>>2]|0;
 $65 = $36;
 $66 = ($64>>>0)>($65>>>0);
 if ($66) {
  __ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv($62);
  // unreachable;
 }
 $32 = $62;
 $67 = $32;
 $31 = $67;
 $68 = $31;
 $30 = $68;
 $69 = $30;
 $70 = ((($69)) + 8|0);
 $29 = $70;
 $71 = $29;
 $28 = $71;
 $72 = $28;
 $73 = HEAP32[$72>>2]|0;
 $74 = HEAP32[$68>>2]|0;
 $75 = $73;
 $76 = $74;
 $77 = (($75) - ($76))|0;
 $37 = $77;
 $78 = $37;
 $79 = $36;
 $80 = (($79>>>0) / 2)&-1;
 $81 = ($78>>>0)>=($80>>>0);
 if ($81) {
  $82 = $36;
  $33 = $82;
 } else {
  $83 = $37;
  $84 = $83<<1;
  HEAP32[$38>>2] = $84;
  $25 = $38;
  $26 = $35;
  $85 = $25;
  $86 = $26;
  ;HEAP8[$24>>0]=HEAP8[$27>>0]|0;
  $22 = $85;
  $23 = $86;
  $87 = $22;
  $88 = $23;
  $19 = $24;
  $20 = $87;
  $21 = $88;
  $89 = $20;
  $90 = HEAP32[$89>>2]|0;
  $91 = $21;
  $92 = HEAP32[$91>>2]|0;
  $93 = ($90>>>0)<($92>>>0);
  $94 = $23;
  $95 = $22;
  $96 = $93 ? $94 : $95;
  $97 = HEAP32[$96>>2]|0;
  $33 = $97;
 }
 $98 = $33;
 $18 = $49;
 $99 = $18;
 $100 = ((($99)) + 4|0);
 $101 = HEAP32[$100>>2]|0;
 $102 = HEAP32[$99>>2]|0;
 $103 = $101;
 $104 = $102;
 $105 = (($103) - ($104))|0;
 $106 = $45;
 __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEEC2EjjS3_($46,$98,$105,$106);
 $107 = $45;
 $108 = ((($46)) + 8|0);
 $109 = HEAP32[$108>>2]|0;
 $17 = $109;
 $110 = $17;
 $111 = $44;
 $16 = $111;
 $112 = $16;
 $12 = $107;
 $13 = $110;
 $14 = $112;
 $113 = $12;
 $114 = $13;
 $115 = $14;
 $11 = $115;
 $116 = $11;
 ;HEAP8[$10>>0]=HEAP8[$15>>0]|0;
 $7 = $113;
 $8 = $114;
 $9 = $116;
 $117 = $7;
 $118 = $8;
 $119 = $9;
 $6 = $119;
 $120 = $6;
 $3 = $117;
 $4 = $118;
 $5 = $120;
 $121 = $4;
 $122 = $5;
 $2 = $122;
 $123 = $2;
 $124 = HEAP8[$123>>0]|0;
 HEAP8[$121>>0] = $124;
 $125 = ((($46)) + 8|0);
 $126 = HEAP32[$125>>2]|0;
 $127 = ((($126)) + 1|0);
 HEAP32[$125>>2] = $127;
 __THREW__ = 0;
 invoke_vii(176,($49|0),($46|0));
 $128 = __THREW__; __THREW__ = 0;
 $129 = $128&1;
 if ($129) {
  $130 = ___cxa_find_matching_catch_2()|0;
  $131 = tempRet0;
  $47 = $130;
  $48 = $131;
  __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($46);
  $132 = $47;
  $133 = $48;
  ___resumeException($132|0);
  // unreachable;
 } else {
  __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($46);
  STACKTOP = sp;return;
 }
}
function __ZNKSt3__26vectorIhNS_9allocatorIhEEE4sizeEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ((($2)) + 4|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = HEAP32[$2>>2]|0;
 $6 = $4;
 $7 = $5;
 $8 = (($6) - ($7))|0;
 STACKTOP = sp;return ($8|0);
}
function __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEEC2EjjS3_($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(112|0);
 $21 = sp + 36|0;
 $25 = sp + 20|0;
 $27 = $0;
 $28 = $1;
 $29 = $2;
 $30 = $3;
 $31 = $27;
 $32 = ((($31)) + 12|0);
 $33 = $30;
 $24 = $32;
 HEAP32[$25>>2] = 0;
 $26 = $33;
 $34 = $24;
 $23 = $25;
 $35 = $23;
 $36 = HEAP32[$35>>2]|0;
 $37 = $26;
 $17 = $37;
 $38 = $17;
 $20 = $34;
 HEAP32[$21>>2] = $36;
 $22 = $38;
 $39 = $20;
 $19 = $21;
 $40 = $19;
 $41 = HEAP32[$40>>2]|0;
 HEAP32[$39>>2] = $41;
 $42 = ((($39)) + 4|0);
 $43 = $22;
 $18 = $43;
 $44 = $18;
 HEAP32[$42>>2] = $44;
 $45 = $28;
 $46 = ($45|0)!=(0);
 if ($46) {
  $6 = $31;
  $47 = $6;
  $48 = ((($47)) + 12|0);
  $5 = $48;
  $49 = $5;
  $4 = $49;
  $50 = $4;
  $51 = ((($50)) + 4|0);
  $52 = HEAP32[$51>>2]|0;
  $53 = $28;
  $12 = $52;
  $13 = $53;
  $54 = $12;
  $55 = $13;
  $9 = $54;
  $10 = $55;
  $11 = 0;
  $56 = $9;
  $8 = $56;
  $57 = $10;
  $7 = $57;
  $58 = $7;
  $59 = (__Znwj($58)|0);
  $60 = $59;
 } else {
  $60 = 0;
 }
 HEAP32[$31>>2] = $60;
 $61 = HEAP32[$31>>2]|0;
 $62 = $29;
 $63 = (($61) + ($62)|0);
 $64 = ((($31)) + 8|0);
 HEAP32[$64>>2] = $63;
 $65 = ((($31)) + 4|0);
 HEAP32[$65>>2] = $63;
 $66 = HEAP32[$31>>2]|0;
 $67 = $28;
 $68 = (($66) + ($67)|0);
 $16 = $31;
 $69 = $16;
 $70 = ((($69)) + 12|0);
 $15 = $70;
 $71 = $15;
 $14 = $71;
 $72 = $14;
 HEAP32[$72>>2] = $68;
 STACKTOP = sp;return;
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE26__swap_out_circular_bufferERNS_14__split_bufferIhRS2_EE($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0;
 var $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0;
 var $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0;
 var $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0;
 var $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0;
 var $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0;
 var $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 352|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(352|0);
 $15 = sp + 288|0;
 $21 = sp + 264|0;
 $33 = sp + 216|0;
 $86 = $0;
 $87 = $1;
 $88 = $86;
 $85 = $88;
 $89 = $85;
 $84 = $89;
 $90 = $84;
 $91 = HEAP32[$90>>2]|0;
 $83 = $91;
 $92 = $83;
 $62 = $89;
 $93 = $62;
 $94 = HEAP32[$93>>2]|0;
 $61 = $94;
 $95 = $61;
 $67 = $89;
 $96 = $67;
 $66 = $96;
 $97 = $66;
 $65 = $97;
 $98 = $65;
 $99 = ((($98)) + 8|0);
 $64 = $99;
 $100 = $64;
 $63 = $100;
 $101 = $63;
 $102 = HEAP32[$101>>2]|0;
 $103 = HEAP32[$97>>2]|0;
 $104 = $102;
 $105 = $103;
 $106 = (($104) - ($105))|0;
 $107 = (($95) + ($106)|0);
 $69 = $89;
 $108 = $69;
 $109 = HEAP32[$108>>2]|0;
 $68 = $109;
 $110 = $68;
 $70 = $89;
 $111 = $70;
 $112 = ((($111)) + 4|0);
 $113 = HEAP32[$112>>2]|0;
 $114 = HEAP32[$111>>2]|0;
 $115 = $113;
 $116 = $114;
 $117 = (($115) - ($116))|0;
 $118 = (($110) + ($117)|0);
 $72 = $89;
 $119 = $72;
 $120 = HEAP32[$119>>2]|0;
 $71 = $120;
 $121 = $71;
 $77 = $89;
 $122 = $77;
 $76 = $122;
 $123 = $76;
 $75 = $123;
 $124 = $75;
 $125 = ((($124)) + 8|0);
 $74 = $125;
 $126 = $74;
 $73 = $126;
 $127 = $73;
 $128 = HEAP32[$127>>2]|0;
 $129 = HEAP32[$123>>2]|0;
 $130 = $128;
 $131 = $129;
 $132 = (($130) - ($131))|0;
 $133 = (($121) + ($132)|0);
 $78 = $89;
 $79 = $92;
 $80 = $107;
 $81 = $118;
 $82 = $133;
 $4 = $88;
 $134 = $4;
 $135 = ((($134)) + 8|0);
 $3 = $135;
 $136 = $3;
 $2 = $136;
 $137 = $2;
 $138 = HEAP32[$88>>2]|0;
 $139 = ((($88)) + 4|0);
 $140 = HEAP32[$139>>2]|0;
 $141 = $87;
 $142 = ((($141)) + 4|0);
 $5 = $137;
 $6 = $138;
 $7 = $140;
 $8 = $142;
 $143 = $7;
 $144 = $6;
 $145 = $143;
 $146 = $144;
 $147 = (($145) - ($146))|0;
 $9 = $147;
 $148 = $9;
 $149 = $8;
 $150 = HEAP32[$149>>2]|0;
 $151 = (0 - ($148))|0;
 $152 = (($150) + ($151)|0);
 HEAP32[$149>>2] = $152;
 $153 = $9;
 $154 = ($153|0)>(0);
 if ($154) {
  $155 = $8;
  $156 = HEAP32[$155>>2]|0;
  $157 = $6;
  $158 = $9;
  _memcpy(($156|0),($157|0),($158|0))|0;
 }
 $159 = $87;
 $160 = ((($159)) + 4|0);
 $13 = $88;
 $14 = $160;
 $161 = $13;
 $12 = $161;
 $162 = $12;
 $163 = HEAP32[$162>>2]|0;
 HEAP32[$15>>2] = $163;
 $164 = $14;
 $10 = $164;
 $165 = $10;
 $166 = HEAP32[$165>>2]|0;
 $167 = $13;
 HEAP32[$167>>2] = $166;
 $11 = $15;
 $168 = $11;
 $169 = HEAP32[$168>>2]|0;
 $170 = $14;
 HEAP32[$170>>2] = $169;
 $171 = ((($88)) + 4|0);
 $172 = $87;
 $173 = ((($172)) + 8|0);
 $19 = $171;
 $20 = $173;
 $174 = $19;
 $18 = $174;
 $175 = $18;
 $176 = HEAP32[$175>>2]|0;
 HEAP32[$21>>2] = $176;
 $177 = $20;
 $16 = $177;
 $178 = $16;
 $179 = HEAP32[$178>>2]|0;
 $180 = $19;
 HEAP32[$180>>2] = $179;
 $17 = $21;
 $181 = $17;
 $182 = HEAP32[$181>>2]|0;
 $183 = $20;
 HEAP32[$183>>2] = $182;
 $24 = $88;
 $184 = $24;
 $185 = ((($184)) + 8|0);
 $23 = $185;
 $186 = $23;
 $22 = $186;
 $187 = $22;
 $188 = $87;
 $27 = $188;
 $189 = $27;
 $190 = ((($189)) + 12|0);
 $26 = $190;
 $191 = $26;
 $25 = $191;
 $192 = $25;
 $31 = $187;
 $32 = $192;
 $193 = $31;
 $30 = $193;
 $194 = $30;
 $195 = HEAP32[$194>>2]|0;
 HEAP32[$33>>2] = $195;
 $196 = $32;
 $28 = $196;
 $197 = $28;
 $198 = HEAP32[$197>>2]|0;
 $199 = $31;
 HEAP32[$199>>2] = $198;
 $29 = $33;
 $200 = $29;
 $201 = HEAP32[$200>>2]|0;
 $202 = $32;
 HEAP32[$202>>2] = $201;
 $203 = $87;
 $204 = ((($203)) + 4|0);
 $205 = HEAP32[$204>>2]|0;
 $206 = $87;
 HEAP32[$206>>2] = $205;
 $34 = $88;
 $207 = $34;
 $208 = ((($207)) + 4|0);
 $209 = HEAP32[$208>>2]|0;
 $210 = HEAP32[$207>>2]|0;
 $211 = $209;
 $212 = $210;
 $213 = (($211) - ($212))|0;
 $58 = $88;
 $59 = $213;
 $214 = $58;
 $57 = $214;
 $215 = $57;
 $216 = HEAP32[$215>>2]|0;
 $56 = $216;
 $217 = $56;
 $36 = $214;
 $218 = $36;
 $219 = HEAP32[$218>>2]|0;
 $35 = $219;
 $220 = $35;
 $41 = $214;
 $221 = $41;
 $40 = $221;
 $222 = $40;
 $39 = $222;
 $223 = $39;
 $224 = ((($223)) + 8|0);
 $38 = $224;
 $225 = $38;
 $37 = $225;
 $226 = $37;
 $227 = HEAP32[$226>>2]|0;
 $228 = HEAP32[$222>>2]|0;
 $229 = $227;
 $230 = $228;
 $231 = (($229) - ($230))|0;
 $232 = (($220) + ($231)|0);
 $43 = $214;
 $233 = $43;
 $234 = HEAP32[$233>>2]|0;
 $42 = $234;
 $235 = $42;
 $48 = $214;
 $236 = $48;
 $47 = $236;
 $237 = $47;
 $46 = $237;
 $238 = $46;
 $239 = ((($238)) + 8|0);
 $45 = $239;
 $240 = $45;
 $44 = $240;
 $241 = $44;
 $242 = HEAP32[$241>>2]|0;
 $243 = HEAP32[$237>>2]|0;
 $244 = $242;
 $245 = $243;
 $246 = (($244) - ($245))|0;
 $247 = (($235) + ($246)|0);
 $50 = $214;
 $248 = $50;
 $249 = HEAP32[$248>>2]|0;
 $49 = $249;
 $250 = $49;
 $251 = $59;
 $252 = (($250) + ($251)|0);
 $51 = $214;
 $52 = $217;
 $53 = $232;
 $54 = $247;
 $55 = $252;
 $60 = $88;
 STACKTOP = sp;return;
}
function __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0;
 var $82 = 0, $83 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(144|0);
 $19 = sp + 8|0;
 $22 = sp + 133|0;
 $29 = sp;
 $32 = sp + 132|0;
 $34 = $0;
 $35 = $34;
 $33 = $35;
 $36 = $33;
 $37 = ((($36)) + 4|0);
 $38 = HEAP32[$37>>2]|0;
 $30 = $36;
 $31 = $38;
 $39 = $30;
 $40 = $31;
 ;HEAP8[$29>>0]=HEAP8[$32>>0]|0;
 $27 = $39;
 $28 = $40;
 $41 = $27;
 while(1) {
  $42 = $28;
  $43 = ((($41)) + 8|0);
  $44 = HEAP32[$43>>2]|0;
  $45 = ($42|0)!=($44|0);
  if (!($45)) {
   break;
  }
  $26 = $41;
  $46 = $26;
  $47 = ((($46)) + 12|0);
  $25 = $47;
  $48 = $25;
  $24 = $48;
  $49 = $24;
  $50 = ((($49)) + 4|0);
  $51 = HEAP32[$50>>2]|0;
  $52 = ((($41)) + 8|0);
  $53 = HEAP32[$52>>2]|0;
  $54 = ((($53)) + -1|0);
  HEAP32[$52>>2] = $54;
  $23 = $54;
  $55 = $23;
  $20 = $51;
  $21 = $55;
  $56 = $20;
  $57 = $21;
  ;HEAP8[$19>>0]=HEAP8[$22>>0]|0;
  $17 = $56;
  $18 = $57;
  $58 = $17;
  $59 = $18;
  $15 = $58;
  $16 = $59;
 }
 $60 = HEAP32[$35>>2]|0;
 $61 = ($60|0)!=(0|0);
 if (!($61)) {
  STACKTOP = sp;return;
 }
 $14 = $35;
 $62 = $14;
 $63 = ((($62)) + 12|0);
 $13 = $63;
 $64 = $13;
 $12 = $64;
 $65 = $12;
 $66 = ((($65)) + 4|0);
 $67 = HEAP32[$66>>2]|0;
 $68 = HEAP32[$35>>2]|0;
 $4 = $35;
 $69 = $4;
 $3 = $69;
 $70 = $3;
 $71 = ((($70)) + 12|0);
 $2 = $71;
 $72 = $2;
 $1 = $72;
 $73 = $1;
 $74 = HEAP32[$73>>2]|0;
 $75 = HEAP32[$69>>2]|0;
 $76 = $74;
 $77 = $75;
 $78 = (($76) - ($77))|0;
 $9 = $67;
 $10 = $68;
 $11 = $78;
 $79 = $9;
 $80 = $10;
 $81 = $11;
 $6 = $79;
 $7 = $80;
 $8 = $81;
 $82 = $7;
 $5 = $82;
 $83 = $5;
 __ZdlPv($83);
 STACKTOP = sp;return;
}
function __ZNKSt3__26vectorIhNS_9allocatorIhEEE8max_sizeEv($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(80|0);
 $6 = sp + 8|0;
 $9 = sp + 77|0;
 $12 = sp;
 $14 = sp + 76|0;
 $19 = sp + 16|0;
 $20 = sp + 12|0;
 $18 = $0;
 $21 = $18;
 $17 = $21;
 $22 = $17;
 $23 = ((($22)) + 8|0);
 $16 = $23;
 $24 = $16;
 $15 = $24;
 $25 = $15;
 $13 = $25;
 $26 = $13;
 ;HEAP8[$12>>0]=HEAP8[$14>>0]|0;
 $11 = $26;
 $27 = $11;
 $10 = $27;
 HEAP32[$19>>2] = -1;
 HEAP32[$20>>2] = 2147483647;
 $7 = $19;
 $8 = $20;
 $28 = $7;
 $29 = $8;
 ;HEAP8[$6>>0]=HEAP8[$9>>0]|0;
 $4 = $28;
 $5 = $29;
 $30 = $5;
 $31 = $4;
 $1 = $6;
 $2 = $30;
 $3 = $31;
 $32 = $2;
 $33 = HEAP32[$32>>2]|0;
 $34 = $3;
 $35 = HEAP32[$34>>2]|0;
 $36 = ($33>>>0)<($35>>>0);
 $37 = $5;
 $38 = $4;
 $39 = $36 ? $37 : $38;
 $40 = HEAP32[$39>>2]|0;
 STACKTOP = sp;return ($40|0);
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE21__push_back_slow_pathIRKhEEvOT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $14 = 0, $15 = 0;
 var $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 208|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(208|0);
 $10 = sp + 8|0;
 $15 = sp + 201|0;
 $24 = sp;
 $27 = sp + 200|0;
 $35 = sp + 80|0;
 $38 = sp + 68|0;
 $46 = sp + 20|0;
 $43 = $0;
 $44 = $1;
 $49 = $43;
 $42 = $49;
 $50 = $42;
 $51 = ((($50)) + 8|0);
 $41 = $51;
 $52 = $41;
 $40 = $52;
 $53 = $40;
 $45 = $53;
 $39 = $49;
 $54 = $39;
 $55 = ((($54)) + 4|0);
 $56 = HEAP32[$55>>2]|0;
 $57 = HEAP32[$54>>2]|0;
 $58 = $56;
 $59 = $57;
 $60 = (($58) - ($59))|0;
 $61 = (($60) + 1)|0;
 $34 = $49;
 HEAP32[$35>>2] = $61;
 $62 = $34;
 $63 = (__ZNKSt3__26vectorIhNS_9allocatorIhEEE8max_sizeEv($62)|0);
 $36 = $63;
 $64 = HEAP32[$35>>2]|0;
 $65 = $36;
 $66 = ($64>>>0)>($65>>>0);
 if ($66) {
  __ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv($62);
  // unreachable;
 }
 $32 = $62;
 $67 = $32;
 $31 = $67;
 $68 = $31;
 $30 = $68;
 $69 = $30;
 $70 = ((($69)) + 8|0);
 $29 = $70;
 $71 = $29;
 $28 = $71;
 $72 = $28;
 $73 = HEAP32[$72>>2]|0;
 $74 = HEAP32[$68>>2]|0;
 $75 = $73;
 $76 = $74;
 $77 = (($75) - ($76))|0;
 $37 = $77;
 $78 = $37;
 $79 = $36;
 $80 = (($79>>>0) / 2)&-1;
 $81 = ($78>>>0)>=($80>>>0);
 if ($81) {
  $82 = $36;
  $33 = $82;
 } else {
  $83 = $37;
  $84 = $83<<1;
  HEAP32[$38>>2] = $84;
  $25 = $38;
  $26 = $35;
  $85 = $25;
  $86 = $26;
  ;HEAP8[$24>>0]=HEAP8[$27>>0]|0;
  $22 = $85;
  $23 = $86;
  $87 = $22;
  $88 = $23;
  $19 = $24;
  $20 = $87;
  $21 = $88;
  $89 = $20;
  $90 = HEAP32[$89>>2]|0;
  $91 = $21;
  $92 = HEAP32[$91>>2]|0;
  $93 = ($90>>>0)<($92>>>0);
  $94 = $23;
  $95 = $22;
  $96 = $93 ? $94 : $95;
  $97 = HEAP32[$96>>2]|0;
  $33 = $97;
 }
 $98 = $33;
 $18 = $49;
 $99 = $18;
 $100 = ((($99)) + 4|0);
 $101 = HEAP32[$100>>2]|0;
 $102 = HEAP32[$99>>2]|0;
 $103 = $101;
 $104 = $102;
 $105 = (($103) - ($104))|0;
 $106 = $45;
 __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEEC2EjjS3_($46,$98,$105,$106);
 $107 = $45;
 $108 = ((($46)) + 8|0);
 $109 = HEAP32[$108>>2]|0;
 $17 = $109;
 $110 = $17;
 $111 = $44;
 $16 = $111;
 $112 = $16;
 $12 = $107;
 $13 = $110;
 $14 = $112;
 $113 = $12;
 $114 = $13;
 $115 = $14;
 $11 = $115;
 $116 = $11;
 ;HEAP8[$10>>0]=HEAP8[$15>>0]|0;
 $7 = $113;
 $8 = $114;
 $9 = $116;
 $117 = $7;
 $118 = $8;
 $119 = $9;
 $6 = $119;
 $120 = $6;
 $3 = $117;
 $4 = $118;
 $5 = $120;
 $121 = $4;
 $122 = $5;
 $2 = $122;
 $123 = $2;
 $124 = HEAP8[$123>>0]|0;
 HEAP8[$121>>0] = $124;
 $125 = ((($46)) + 8|0);
 $126 = HEAP32[$125>>2]|0;
 $127 = ((($126)) + 1|0);
 HEAP32[$125>>2] = $127;
 __THREW__ = 0;
 invoke_vii(176,($49|0),($46|0));
 $128 = __THREW__; __THREW__ = 0;
 $129 = $128&1;
 if ($129) {
  $130 = ___cxa_find_matching_catch_2()|0;
  $131 = tempRet0;
  $47 = $130;
  $48 = $131;
  __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($46);
  $132 = $47;
  $133 = $48;
  ___resumeException($132|0);
  // unreachable;
 } else {
  __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($46);
  STACKTOP = sp;return;
 }
}
function __ZNSt3__213__vector_baseIhNS_9allocatorIhEEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(128|0);
 $19 = sp;
 $22 = sp + 116|0;
 $30 = $0;
 $31 = $30;
 $32 = HEAP32[$31>>2]|0;
 $33 = ($32|0)!=(0|0);
 if (!($33)) {
  STACKTOP = sp;return;
 }
 $29 = $31;
 $34 = $29;
 $35 = HEAP32[$34>>2]|0;
 $27 = $34;
 $28 = $35;
 $36 = $27;
 while(1) {
  $37 = $28;
  $38 = ((($36)) + 4|0);
  $39 = HEAP32[$38>>2]|0;
  $40 = ($37|0)!=($39|0);
  if (!($40)) {
   break;
  }
  $26 = $36;
  $41 = $26;
  $42 = ((($41)) + 8|0);
  $25 = $42;
  $43 = $25;
  $24 = $43;
  $44 = $24;
  $45 = ((($36)) + 4|0);
  $46 = HEAP32[$45>>2]|0;
  $47 = ((($46)) + -1|0);
  HEAP32[$45>>2] = $47;
  $23 = $47;
  $48 = $23;
  $20 = $44;
  $21 = $48;
  $49 = $20;
  $50 = $21;
  ;HEAP8[$19>>0]=HEAP8[$22>>0]|0;
  $17 = $49;
  $18 = $50;
  $51 = $17;
  $52 = $18;
  $15 = $51;
  $16 = $52;
 }
 $7 = $31;
 $53 = $7;
 $54 = ((($53)) + 8|0);
 $6 = $54;
 $55 = $6;
 $5 = $55;
 $56 = $5;
 $57 = HEAP32[$31>>2]|0;
 $4 = $31;
 $58 = $4;
 $3 = $58;
 $59 = $3;
 $60 = ((($59)) + 8|0);
 $2 = $60;
 $61 = $2;
 $1 = $61;
 $62 = $1;
 $63 = HEAP32[$62>>2]|0;
 $64 = HEAP32[$58>>2]|0;
 $65 = $63;
 $66 = $64;
 $67 = (($65) - ($66))|0;
 $12 = $56;
 $13 = $57;
 $14 = $67;
 $68 = $12;
 $69 = $13;
 $70 = $14;
 $9 = $68;
 $10 = $69;
 $11 = $70;
 $71 = $10;
 $8 = $71;
 $72 = $8;
 __ZdlPv($72);
 STACKTOP = sp;return;
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE6resizeEjRKh($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $14 = 0, $15 = 0, $16 = 0;
 var $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0;
 var $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0;
 var $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0;
 var $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0;
 var $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 192|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(192|0);
 $7 = sp;
 $10 = sp + 180|0;
 $45 = $0;
 $46 = $1;
 $47 = $2;
 $49 = $45;
 $44 = $49;
 $50 = $44;
 $51 = ((($50)) + 4|0);
 $52 = HEAP32[$51>>2]|0;
 $53 = HEAP32[$50>>2]|0;
 $54 = $52;
 $55 = $53;
 $56 = (($54) - ($55))|0;
 $48 = $56;
 $57 = $48;
 $58 = $46;
 $59 = ($57>>>0)<($58>>>0);
 if ($59) {
  $60 = $46;
  $61 = $48;
  $62 = (($60) - ($61))|0;
  $63 = $47;
  __ZNSt3__26vectorIhNS_9allocatorIhEEE8__appendEjRKh($49,$62,$63);
  STACKTOP = sp;return;
 }
 $64 = $48;
 $65 = $46;
 $66 = ($64>>>0)>($65>>>0);
 if (!($66)) {
  STACKTOP = sp;return;
 }
 $67 = HEAP32[$49>>2]|0;
 $68 = $46;
 $69 = (($67) + ($68)|0);
 $41 = $49;
 $42 = $69;
 $70 = $41;
 $71 = $42;
 $39 = $70;
 $40 = $71;
 $38 = $70;
 $72 = $38;
 $73 = ((($72)) + 4|0);
 $74 = HEAP32[$73>>2]|0;
 $75 = HEAP32[$72>>2]|0;
 $76 = $74;
 $77 = $75;
 $78 = (($76) - ($77))|0;
 $43 = $78;
 $79 = $42;
 $15 = $70;
 $16 = $79;
 $80 = $15;
 while(1) {
  $81 = $16;
  $82 = ((($80)) + 4|0);
  $83 = HEAP32[$82>>2]|0;
  $84 = ($81|0)!=($83|0);
  if (!($84)) {
   break;
  }
  $14 = $80;
  $85 = $14;
  $86 = ((($85)) + 8|0);
  $13 = $86;
  $87 = $13;
  $12 = $87;
  $88 = $12;
  $89 = ((($80)) + 4|0);
  $90 = HEAP32[$89>>2]|0;
  $91 = ((($90)) + -1|0);
  HEAP32[$89>>2] = $91;
  $11 = $91;
  $92 = $11;
  $8 = $88;
  $9 = $92;
  $93 = $8;
  $94 = $9;
  ;HEAP8[$7>>0]=HEAP8[$10>>0]|0;
  $5 = $93;
  $6 = $94;
  $95 = $5;
  $96 = $6;
  $3 = $95;
  $4 = $96;
 }
 $97 = $43;
 $36 = $70;
 $37 = $97;
 $98 = $36;
 $35 = $98;
 $99 = $35;
 $100 = HEAP32[$99>>2]|0;
 $34 = $100;
 $101 = $34;
 $18 = $98;
 $102 = $18;
 $103 = HEAP32[$102>>2]|0;
 $17 = $103;
 $104 = $17;
 $23 = $98;
 $105 = $23;
 $22 = $105;
 $106 = $22;
 $21 = $106;
 $107 = $21;
 $108 = ((($107)) + 8|0);
 $20 = $108;
 $109 = $20;
 $19 = $109;
 $110 = $19;
 $111 = HEAP32[$110>>2]|0;
 $112 = HEAP32[$106>>2]|0;
 $113 = $111;
 $114 = $112;
 $115 = (($113) - ($114))|0;
 $116 = (($104) + ($115)|0);
 $25 = $98;
 $117 = $25;
 $118 = HEAP32[$117>>2]|0;
 $24 = $118;
 $119 = $24;
 $120 = $37;
 $121 = (($119) + ($120)|0);
 $27 = $98;
 $122 = $27;
 $123 = HEAP32[$122>>2]|0;
 $26 = $123;
 $124 = $26;
 $28 = $98;
 $125 = $28;
 $126 = ((($125)) + 4|0);
 $127 = HEAP32[$126>>2]|0;
 $128 = HEAP32[$125>>2]|0;
 $129 = $127;
 $130 = $128;
 $131 = (($129) - ($130))|0;
 $132 = (($124) + ($131)|0);
 $29 = $98;
 $30 = $101;
 $31 = $116;
 $32 = $121;
 $33 = $132;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal12VectorAccessINSt3__26vectorIhNS2_9allocatorIhEEEEE3getERKS6_j($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $6 = $1;
 $7 = $2;
 $8 = $7;
 $9 = $6;
 $5 = $9;
 $10 = $5;
 $11 = ((($10)) + 4|0);
 $12 = HEAP32[$11>>2]|0;
 $13 = HEAP32[$10>>2]|0;
 $14 = $12;
 $15 = $13;
 $16 = (($14) - ($15))|0;
 $17 = ($8>>>0)<($16>>>0);
 if ($17) {
  $18 = $6;
  $19 = $7;
  $3 = $18;
  $4 = $19;
  $20 = $3;
  $21 = HEAP32[$20>>2]|0;
  $22 = $4;
  $23 = (($21) + ($22)|0);
  __ZN10emscripten3valC2IRKhEEOT_($0,$23);
  STACKTOP = sp;return;
 } else {
  __ZN10emscripten3val9undefinedEv($0);
  STACKTOP = sp;return;
 }
}
function __ZN10emscripten8internal12VectorAccessINSt3__26vectorIhNS2_9allocatorIhEEEEE3setERS6_jRKh($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $5 = $0;
 $6 = $1;
 $7 = $2;
 $8 = $7;
 $9 = HEAP8[$8>>0]|0;
 $10 = $5;
 $11 = $6;
 $3 = $10;
 $4 = $11;
 $12 = $3;
 $13 = HEAP32[$12>>2]|0;
 $14 = $4;
 $15 = (($13) + ($14)|0);
 HEAP8[$15>>0] = $9;
 STACKTOP = sp;return 1;
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE8__appendEjRKh($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0;
 var $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 272|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(272|0);
 $9 = sp + 8|0;
 $12 = sp + 258|0;
 $20 = sp + 192|0;
 $23 = sp + 180|0;
 $40 = sp;
 $45 = sp + 257|0;
 $54 = sp + 256|0;
 $62 = sp + 20|0;
 $58 = $0;
 $59 = $1;
 $60 = $2;
 $65 = $58;
 $57 = $65;
 $66 = $57;
 $67 = ((($66)) + 8|0);
 $56 = $67;
 $68 = $56;
 $55 = $68;
 $69 = $55;
 $70 = HEAP32[$69>>2]|0;
 $71 = ((($65)) + 4|0);
 $72 = HEAP32[$71>>2]|0;
 $73 = $70;
 $74 = $72;
 $75 = (($73) - ($74))|0;
 $76 = $59;
 $77 = ($75>>>0)>=($76>>>0);
 if ($77) {
  $78 = $59;
  $79 = $60;
  $50 = $65;
  $51 = $78;
  $52 = $79;
  $80 = $50;
  $49 = $80;
  $81 = $49;
  $82 = ((($81)) + 8|0);
  $48 = $82;
  $83 = $48;
  $47 = $83;
  $84 = $47;
  $53 = $84;
  while(1) {
   $28 = $54;
   $29 = $80;
   $30 = 1;
   $85 = $53;
   $86 = ((($80)) + 4|0);
   $87 = HEAP32[$86>>2]|0;
   $31 = $87;
   $88 = $31;
   $89 = $52;
   $42 = $85;
   $43 = $88;
   $44 = $89;
   $90 = $42;
   $91 = $43;
   $92 = $44;
   $41 = $92;
   $93 = $41;
   ;HEAP8[$40>>0]=HEAP8[$45>>0]|0;
   $37 = $90;
   $38 = $91;
   $39 = $93;
   $94 = $37;
   $95 = $38;
   $96 = $39;
   $36 = $96;
   $97 = $36;
   $33 = $94;
   $34 = $95;
   $35 = $97;
   $98 = $34;
   $99 = $35;
   $32 = $99;
   $100 = $32;
   $101 = HEAP8[$100>>0]|0;
   HEAP8[$98>>0] = $101;
   $102 = ((($80)) + 4|0);
   $103 = HEAP32[$102>>2]|0;
   $104 = ((($103)) + 1|0);
   HEAP32[$102>>2] = $104;
   $105 = $51;
   $106 = (($105) + -1)|0;
   $51 = $106;
   $46 = $54;
   $107 = $51;
   $108 = ($107>>>0)>(0);
   if (!($108)) {
    break;
   }
  }
  STACKTOP = sp;return;
 }
 $27 = $65;
 $109 = $27;
 $110 = ((($109)) + 8|0);
 $26 = $110;
 $111 = $26;
 $25 = $111;
 $112 = $25;
 $61 = $112;
 $24 = $65;
 $113 = $24;
 $114 = ((($113)) + 4|0);
 $115 = HEAP32[$114>>2]|0;
 $116 = HEAP32[$113>>2]|0;
 $117 = $115;
 $118 = $116;
 $119 = (($117) - ($118))|0;
 $120 = $59;
 $121 = (($119) + ($120))|0;
 $19 = $65;
 HEAP32[$20>>2] = $121;
 $122 = $19;
 $123 = (__ZNKSt3__26vectorIhNS_9allocatorIhEEE8max_sizeEv($122)|0);
 $21 = $123;
 $124 = HEAP32[$20>>2]|0;
 $125 = $21;
 $126 = ($124>>>0)>($125>>>0);
 if ($126) {
  __ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv($122);
  // unreachable;
 }
 $17 = $122;
 $127 = $17;
 $16 = $127;
 $128 = $16;
 $15 = $128;
 $129 = $15;
 $130 = ((($129)) + 8|0);
 $14 = $130;
 $131 = $14;
 $13 = $131;
 $132 = $13;
 $133 = HEAP32[$132>>2]|0;
 $134 = HEAP32[$128>>2]|0;
 $135 = $133;
 $136 = $134;
 $137 = (($135) - ($136))|0;
 $22 = $137;
 $138 = $22;
 $139 = $21;
 $140 = (($139>>>0) / 2)&-1;
 $141 = ($138>>>0)>=($140>>>0);
 if ($141) {
  $142 = $21;
  $18 = $142;
 } else {
  $143 = $22;
  $144 = $143<<1;
  HEAP32[$23>>2] = $144;
  $10 = $23;
  $11 = $20;
  $145 = $10;
  $146 = $11;
  ;HEAP8[$9>>0]=HEAP8[$12>>0]|0;
  $7 = $145;
  $8 = $146;
  $147 = $7;
  $148 = $8;
  $4 = $9;
  $5 = $147;
  $6 = $148;
  $149 = $5;
  $150 = HEAP32[$149>>2]|0;
  $151 = $6;
  $152 = HEAP32[$151>>2]|0;
  $153 = ($150>>>0)<($152>>>0);
  $154 = $8;
  $155 = $7;
  $156 = $153 ? $154 : $155;
  $157 = HEAP32[$156>>2]|0;
  $18 = $157;
 }
 $158 = $18;
 $3 = $65;
 $159 = $3;
 $160 = ((($159)) + 4|0);
 $161 = HEAP32[$160>>2]|0;
 $162 = HEAP32[$159>>2]|0;
 $163 = $161;
 $164 = $162;
 $165 = (($163) - ($164))|0;
 $166 = $61;
 __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEEC2EjjS3_($62,$158,$165,$166);
 $167 = $59;
 $168 = $60;
 __THREW__ = 0;
 invoke_viii(178,($62|0),($167|0),($168|0));
 $169 = __THREW__; __THREW__ = 0;
 $170 = $169&1;
 if ($170) {
  $173 = ___cxa_find_matching_catch_2()|0;
  $174 = tempRet0;
  $63 = $173;
  $64 = $174;
  __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($62);
  $175 = $63;
  $176 = $64;
  ___resumeException($175|0);
  // unreachable;
 }
 __THREW__ = 0;
 invoke_vii(176,($65|0),($62|0));
 $171 = __THREW__; __THREW__ = 0;
 $172 = $171&1;
 if ($172) {
  $173 = ___cxa_find_matching_catch_2()|0;
  $174 = tempRet0;
  $63 = $173;
  $64 = $174;
  __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($62);
  $175 = $63;
  $176 = $64;
  ___resumeException($175|0);
  // unreachable;
 }
 __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEED2Ev($62);
 STACKTOP = sp;return;
}
function __ZNSt3__214__split_bufferIhRNS_9allocatorIhEEE18__construct_at_endEjRKh($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(96|0);
 $12 = sp;
 $17 = sp + 84|0;
 $21 = $0;
 $22 = $1;
 $23 = $2;
 $25 = $21;
 $20 = $25;
 $26 = $20;
 $27 = ((($26)) + 12|0);
 $19 = $27;
 $28 = $19;
 $18 = $28;
 $29 = $18;
 $30 = ((($29)) + 4|0);
 $31 = HEAP32[$30>>2]|0;
 $24 = $31;
 while(1) {
  $32 = $24;
  $33 = ((($25)) + 8|0);
  $34 = HEAP32[$33>>2]|0;
  $3 = $34;
  $35 = $3;
  $36 = $23;
  $14 = $32;
  $15 = $35;
  $16 = $36;
  $37 = $14;
  $38 = $15;
  $39 = $16;
  $13 = $39;
  $40 = $13;
  ;HEAP8[$12>>0]=HEAP8[$17>>0]|0;
  $9 = $37;
  $10 = $38;
  $11 = $40;
  $41 = $9;
  $42 = $10;
  $43 = $11;
  $8 = $43;
  $44 = $8;
  $5 = $41;
  $6 = $42;
  $7 = $44;
  $45 = $6;
  $46 = $7;
  $4 = $46;
  $47 = $4;
  $48 = HEAP8[$47>>0]|0;
  HEAP8[$45>>0] = $48;
  $49 = ((($25)) + 8|0);
  $50 = HEAP32[$49>>2]|0;
  $51 = ((($50)) + 1|0);
  HEAP32[$49>>2] = $51;
  $52 = $22;
  $53 = (($52) + -1)|0;
  $22 = $53;
  $54 = $22;
  $55 = ($54>>>0)>(0);
  if (!($55)) {
   break;
  }
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal11NoBaseClass6verifyINSt3__26vectorIhNS3_9allocatorIhEEEEEEvv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZN10emscripten8internal13getActualTypeINSt3__26vectorIhNS2_9allocatorIhEEEEEEPKvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = (__ZN10emscripten8internal14getLightTypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEEEPKvRKT_($2)|0);
 STACKTOP = sp;return ($3|0);
}
function __ZN10emscripten8internal11NoBaseClass11getUpcasterINSt3__26vectorIhNS3_9allocatorIhEEEEEEPFvvEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (0|0);
}
function __ZN10emscripten8internal11NoBaseClass13getDowncasterINSt3__26vectorIhNS3_9allocatorIhEEEEEEPFvvEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (0|0);
}
function __ZN10emscripten8internal14raw_destructorINSt3__26vectorIhNS2_9allocatorIhEEEEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if ($3) {
  STACKTOP = sp;return;
 }
 __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($2);
 __ZdlPv($2);
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerINSt3__26vectorIhNS3_9allocatorIhEEEEEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIPNSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerIKNSt3__26vectorIhNS3_9allocatorIhEEEEEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIPKNSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11NoBaseClass3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (0|0);
}
function __ZN10emscripten8internal14getLightTypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEEEPKvRKT_($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return (40|0);
}
function __ZN10emscripten8internal11LightTypeIDINSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (40|0);
}
function __ZN10emscripten8internal11LightTypeIDIPNSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (64|0);
}
function __ZN10emscripten8internal11LightTypeIDIPKNSt3__26vectorIhNS2_9allocatorIhEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (80|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3196|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJvEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3199|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJviEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3201|0);
}
function __ZN10emscripten8internal12operator_newINSt3__26vectorIhNS2_9allocatorIhEEEEJEEEPT_DpOT0_() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(48|0);
 $3 = sp + 24|0;
 $6 = sp + 12|0;
 $10 = (__Znwj(12)|0);
 $9 = $10;
 $11 = $9;
 $8 = $11;
 $12 = $8;
 $7 = $12;
 HEAP32[$12>>2] = 0;
 $13 = ((($12)) + 4|0);
 HEAP32[$13>>2] = 0;
 $14 = ((($12)) + 8|0);
 $5 = $14;
 HEAP32[$6>>2] = 0;
 $15 = $5;
 $4 = $6;
 $16 = $4;
 $17 = HEAP32[$16>>2]|0;
 $2 = $15;
 HEAP32[$3>>2] = $17;
 $18 = $2;
 $1 = $18;
 $0 = $3;
 $19 = $0;
 $20 = HEAP32[$19>>2]|0;
 HEAP32[$18>>2] = $20;
 STACKTOP = sp;return ($10|0);
}
function __ZN10emscripten8internal7InvokerIPNSt3__26vectorIhNS2_9allocatorIhEEEEJEE6invokeEPFS7_vE($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = (FUNCTION_TABLE_i[$2 & 255]()|0);
 $4 = (__ZN10emscripten8internal11BindingTypeIPNSt3__26vectorIhNS2_9allocatorIhEEEEE10toWireTypeES7_($3)|0);
 STACKTOP = sp;return ($4|0);
}
function __ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJPNSt3__26vectorIhNS5_9allocatorIhEEEEEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 1;
}
function __ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJPNSt3__26vectorIhNS5_9allocatorIhEEEEEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNS0_17AllowedRawPointerINSt3__26vectorIhNS4_9allocatorIhEEEEEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIPNSt3__26vectorIhNS2_9allocatorIhEEEEE10toWireTypeES7_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNS0_17AllowedRawPointerINSt3__26vectorIhNS4_9allocatorIhEEEEEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (768|0);
}
function __ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvRKhEvPS6_JS8_EE6invokeERKSA_SB_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $6 = sp + 8|0;
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $7 = $4;
 $8 = (__ZN10emscripten8internal11BindingTypeIPNSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeES7_($7)|0);
 $9 = $3;
 $$field = HEAP32[$9>>2]|0;
 $$index1 = ((($9)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $10 = $$field2 >> 1;
 $11 = (($8) + ($10)|0);
 $12 = $$field2 & 1;
 $13 = ($12|0)!=(0);
 if ($13) {
  $14 = HEAP32[$11>>2]|0;
  $15 = (($14) + ($$field)|0);
  $16 = HEAP32[$15>>2]|0;
  $20 = $16;
 } else {
  $17 = $$field;
  $20 = $17;
 }
 $18 = $5;
 $19 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($18)|0);
 HEAP8[$6>>0] = $19;
 FUNCTION_TABLE_vii[$20 & 255]($11,$6);
 STACKTOP = sp;return;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEERKhEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 3;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEERKhEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS4_9allocatorIhEEEEEERKhEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvRKhEEEPT_RKSB_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIPNSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeES7_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS4_9allocatorIhEEEEEERKhEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (772|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJviiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3204|0);
}
function __ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvjRKhEvPS6_JjS8_EE6invokeERKSA_SB_jh($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $8 = sp + 12|0;
 $4 = $0;
 $5 = $1;
 $6 = $2;
 $7 = $3;
 $9 = $5;
 $10 = (__ZN10emscripten8internal11BindingTypeIPNSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeES7_($9)|0);
 $11 = $4;
 $$field = HEAP32[$11>>2]|0;
 $$index1 = ((($11)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $12 = $$field2 >> 1;
 $13 = (($10) + ($12)|0);
 $14 = $$field2 & 1;
 $15 = ($14|0)!=(0);
 if ($15) {
  $16 = HEAP32[$13>>2]|0;
  $17 = (($16) + ($$field)|0);
  $18 = HEAP32[$17>>2]|0;
  $24 = $18;
 } else {
  $19 = $$field;
  $24 = $19;
 }
 $20 = $6;
 $21 = (__ZN10emscripten8internal11BindingTypeIjE12fromWireTypeEj($20)|0);
 $22 = $7;
 $23 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($22)|0);
 HEAP8[$8>>0] = $23;
 FUNCTION_TABLE_viii[$24 & 255]($13,$21,$8);
 STACKTOP = sp;return;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEEjRKhEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 4;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS5_9allocatorIhEEEEEEjRKhEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS4_9allocatorIhEEEEEEjRKhEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvjRKhEEEPT_RKSB_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIjE12fromWireTypeEj($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJvNS0_17AllowedRawPointerINSt3__26vectorIhNS4_9allocatorIhEEEEEEjRKhEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (784|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJviiiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3209|0);
}
function __ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIhNS2_9allocatorIhEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $4 = sp;
 $2 = $0;
 $3 = $1;
 $5 = $3;
 $6 = (__ZN10emscripten8internal11BindingTypeIPKNSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeES8_($5)|0);
 $7 = $2;
 $$field = HEAP32[$7>>2]|0;
 $$index1 = ((($7)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $8 = $$field2 >> 1;
 $9 = (($6) + ($8)|0);
 $10 = $$field2 & 1;
 $11 = ($10|0)!=(0);
 if ($11) {
  $12 = HEAP32[$9>>2]|0;
  $13 = (($12) + ($$field)|0);
  $14 = HEAP32[$13>>2]|0;
  $16 = $14;
 } else {
  $15 = $$field;
  $16 = $15;
 }
 $17 = (FUNCTION_TABLE_ii[$16 & 255]($9)|0);
 HEAP32[$4>>2] = $17;
 $18 = (__ZN10emscripten8internal11BindingTypeIjE10toWireTypeERKj($4)|0);
 STACKTOP = sp;return ($18|0);
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJjNS0_17AllowedRawPointerIKNSt3__26vectorIhNS5_9allocatorIhEEEEEEEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 2;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJjNS0_17AllowedRawPointerIKNSt3__26vectorIhNS5_9allocatorIhEEEEEEEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJjNS0_17AllowedRawPointerIKNSt3__26vectorIhNS4_9allocatorIhEEEEEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIMNSt3__26vectorIhNS2_9allocatorIhEEEEKFjvEEEPT_RKS9_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIjE10toWireTypeERKj($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = HEAP32[$2>>2]|0;
 STACKTOP = sp;return ($3|0);
}
function __ZN10emscripten8internal11BindingTypeIPKNSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeES8_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJjNS0_17AllowedRawPointerIKNSt3__26vectorIhNS4_9allocatorIhEEEEEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (800|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJiiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3215|0);
}
function __ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__26vectorIhNS3_9allocatorIhEEEEjES2_S9_JjEE6invokeEPSB_PS7_j($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $6 = sp + 8|0;
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = $4;
 $12 = (__ZN10emscripten8internal18GenericBindingTypeINSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeEPS6_($11)|0);
 $13 = $5;
 $14 = (__ZN10emscripten8internal11BindingTypeIjE12fromWireTypeEj($13)|0);
 FUNCTION_TABLE_viii[$10 & 255]($6,$12,$14);
 __THREW__ = 0;
 $15 = (invoke_ii(179,($6|0))|0);
 $16 = __THREW__; __THREW__ = 0;
 $17 = $16&1;
 if ($17) {
  $18 = ___cxa_find_matching_catch_2()|0;
  $19 = tempRet0;
  $7 = $18;
  $8 = $19;
  __ZN10emscripten3valD2Ev($6);
  $20 = $7;
  $21 = $8;
  ___resumeException($20|0);
  // unreachable;
 } else {
  __ZN10emscripten3valD2Ev($6);
  STACKTOP = sp;return ($15|0);
 }
 return (0)|0;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNS_3valERKNSt3__26vectorIhNS5_9allocatorIhEEEEjEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 3;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNS_3valERKNSt3__26vectorIhNS5_9allocatorIhEEEEjEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNS_3valERKNSt3__26vectorIhNS4_9allocatorIhEEEEjEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIPFNS_3valERKNSt3__26vectorIhNS3_9allocatorIhEEEEjEEEPT_RKSC_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeINS_3valEE10toWireTypeERKS2_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = HEAP32[$2>>2]|0;
 __emval_incref(($3|0));
 $4 = $1;
 $5 = HEAP32[$4>>2]|0;
 STACKTOP = sp;return ($5|0);
}
function __ZN10emscripten8internal18GenericBindingTypeINSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeEPS6_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten3valD2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = HEAP32[$2>>2]|0;
 __THREW__ = 0;
 invoke_vi(180,($3|0));
 $4 = __THREW__; __THREW__ = 0;
 $5 = $4&1;
 if ($5) {
  $6 = ___cxa_find_matching_catch_3(0|0)|0;
  $7 = tempRet0;
  ___clang_call_terminate($6);
  // unreachable;
 } else {
  STACKTOP = sp;return;
 }
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNS_3valERKNSt3__26vectorIhNS4_9allocatorIhEEEEjEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (808|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJiiiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3238|0);
}
function __ZN10emscripten3valC2IRKhEEOT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $5 = sp;
 $3 = $0;
 $4 = $1;
 $6 = $3;
 $7 = $4;
 $2 = $7;
 $8 = $2;
 __ZN10emscripten8internal12WireTypePackIJRKhEEC2ES3_($5,$8);
 $9 = (__ZN10emscripten8internal6TypeIDIRKhE3getEv()|0);
 $10 = (__ZNK10emscripten8internal12WireTypePackIJRKhEEcvPKvEv($5)|0);
 $11 = (__emval_take_value(($9|0),($10|0))|0);
 HEAP32[$6>>2] = $11;
 STACKTOP = sp;return;
}
function __ZN10emscripten3val9undefinedEv($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10emscripten3valC2EPNS_8internal7_EM_VALE($0,(1));
 return;
}
function __ZN10emscripten8internal12WireTypePackIJRKhEEC2ES3_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $9 = sp;
 $7 = $0;
 $8 = $1;
 $10 = $7;
 $6 = $10;
 $11 = $6;
 HEAP32[$9>>2] = $11;
 $12 = $8;
 $2 = $12;
 $13 = $2;
 $4 = $9;
 $5 = $13;
 $14 = $4;
 $15 = $5;
 $3 = $15;
 $16 = $3;
 $17 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($16)|0);
 __ZN10emscripten8internal20writeGenericWireTypeIhEEvRPNS0_15GenericWireTypeET_($14,$17);
 $18 = $4;
 __ZN10emscripten8internal21writeGenericWireTypesERPNS0_15GenericWireTypeE($18);
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIRKhE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIRKhE3getEv()|0);
 return ($0|0);
}
function __ZNK10emscripten8internal12WireTypePackIJRKhEEcvPKvEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $2;
 $1 = $3;
 $4 = $1;
 STACKTOP = sp;return ($4|0);
}
function __ZN10emscripten8internal20writeGenericWireTypeIhEEvRPNS0_15GenericWireTypeET_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $4&255;
 $6 = $2;
 $7 = HEAP32[$6>>2]|0;
 HEAP32[$7>>2] = $5;
 $8 = $2;
 $9 = HEAP32[$8>>2]|0;
 $10 = ((($9)) + 8|0);
 HEAP32[$8>>2] = $10;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = HEAP8[$2>>0]|0;
 STACKTOP = sp;return ($3|0);
}
function __ZN10emscripten8internal21writeGenericWireTypesERPNS0_15GenericWireTypeE($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal11LightTypeIDIRKhE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (656|0);
}
function __ZN10emscripten3valC2EPNS_8internal7_EM_VALE($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $2;
 $5 = $3;
 HEAP32[$4>>2] = $5;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__26vectorIhNS2_9allocatorIhEEEEjRKhEbS7_JjS9_EE6invokeEPSB_PS6_jh($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $8 = sp + 12|0;
 $4 = $0;
 $5 = $1;
 $6 = $2;
 $7 = $3;
 $9 = $4;
 $10 = HEAP32[$9>>2]|0;
 $11 = $5;
 $12 = (__ZN10emscripten8internal18GenericBindingTypeINSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeEPS6_($11)|0);
 $13 = $6;
 $14 = (__ZN10emscripten8internal11BindingTypeIjE12fromWireTypeEj($13)|0);
 $15 = $7;
 $16 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($15)|0);
 HEAP8[$8>>0] = $16;
 $17 = (FUNCTION_TABLE_iiii[$10 & 127]($12,$14,$8)|0);
 $18 = (__ZN10emscripten8internal11BindingTypeIbE10toWireTypeEb($17)|0);
 STACKTOP = sp;return ($18|0);
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbRNSt3__26vectorIhNS4_9allocatorIhEEEEjRKhEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 4;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbRNSt3__26vectorIhNS4_9allocatorIhEEEEjRKhEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJbRNSt3__26vectorIhNS3_9allocatorIhEEEEjRKhEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIPFbRNSt3__26vectorIhNS2_9allocatorIhEEEEjRKhEEEPT_RKSC_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIbE10toWireTypeEb($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0&1;
 $1 = $2;
 $3 = $1;
 $4 = $3&1;
 STACKTOP = sp;return ($4|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJbRNSt3__26vectorIhNS3_9allocatorIhEEEEjRKhEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (820|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJiiiiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3243|0);
}
function __ZN10emscripten8internal6TypeIDIN5Motor5StateEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN5Motor5StateEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN5Motor5StateEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (104|0);
}
function __ZN10emscripten8internal6TypeIDIN10SmartDrive5UnitsEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN10SmartDrive5UnitsEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN10SmartDrive5UnitsEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (112|0);
}
function __ZN10emscripten8internal6TypeIDIN10SmartDrive11ControlModeEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN10SmartDrive11ControlModeEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN10SmartDrive11ControlModeEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (120|0);
}
function __ZN10emscripten8internal11noncopyableC2Ev($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal15raw_constructorIN10SmartDrive8SettingsEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(16)|0);
 ;HEAP32[$0>>2]=0|0;HEAP32[$0+4>>2]=0|0;HEAP32[$0+8>>2]=0|0;HEAP32[$0+12>>2]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN10SmartDrive8SettingsEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN10SmartDrive8SettingsEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11noncopyableD2Ev($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal11LightTypeIDIN10SmartDrive8SettingsEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (128|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3337|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_11ControlModeEE7getWireIS3_EES4_RKMS3_S4_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive11ControlModeEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_11ControlModeEE7setWireIS3_EEvRKMS3_S4_RT_S4_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive11ControlModeEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsENS2_11ControlModeEEEPT_RKS6_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive11ControlModeEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive11ControlModeEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_5UnitsEE7getWireIS3_EES4_RKMS3_S4_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5UnitsEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_5UnitsEE7setWireIS3_EEvRKMS3_S4_RT_S4_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5UnitsEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsENS2_5UnitsEEEPT_RKS6_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5UnitsEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5UnitsEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIhE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIhE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11LightTypeIDIhE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (656|0);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEfE7getWireIS3_EEfRKMS3_fRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (+__ZN10emscripten8internal11BindingTypeIfE10toWireTypeERKf($7));
 STACKTOP = sp;return (+$8);
}
function __ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEfE7setWireIS3_EEvRKMS3_fRT_f($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = +$2;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0.0, $6 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (+__ZN10emscripten8internal11BindingTypeIfE12fromWireTypeEf($6));
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAPF32[$11>>2] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIfE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIfE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIMN10SmartDrive8SettingsEfEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIfE10toWireTypeERKf($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = +HEAPF32[$2>>2];
 STACKTOP = sp;return (+$3);
}
function __ZN10emscripten8internal11BindingTypeIfE12fromWireTypeEf($0) {
 $0 = +$0;
 var $1 = 0.0, $2 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return (+$2);
}
function __ZN10emscripten8internal11LightTypeIDIfE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (720|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJfiiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3339|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJviifEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3343|0);
}
function __ZN10emscripten8internal6TypeIDIN6Packet6DeviceEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet6DeviceEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet6DeviceEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (136|0);
}
function __ZN10emscripten8internal6TypeIDIN6Packet4TypeEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet4TypeEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet4TypeEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (144|0);
}
function __ZN10emscripten8internal6TypeIDIN6Packet4DataEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet4DataEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet4DataEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (152|0);
}
function __ZN10emscripten8internal15raw_constructorIN6Packet11VersionInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(3)|0);
 ;HEAP16[$0>>1]=0|0;HEAP8[$0+2>>0]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN6Packet11VersionInfoEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet11VersionInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet11VersionInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet11VersionInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (160|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet11VersionInfoEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet11VersionInfoEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet11VersionInfoEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15raw_constructorIN6Packet9DailyInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(16)|0);
 ;HEAP32[$0>>2]=0|0;HEAP32[$0+4>>2]=0|0;HEAP32[$0+8>>2]=0|0;HEAP32[$0+12>>2]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN6Packet9DailyInfoEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet9DailyInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet9DailyInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet9DailyInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (168|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEtE7getWireIS3_EEtRKMS3_tRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeItE10toWireTypeERKt($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEtE7setWireIS3_EEvRKMS3_tRT_t($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeItE12fromWireTypeEt($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP16[$11>>1] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDItE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDItE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIMN6Packet9DailyInfoEtEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeItE10toWireTypeERKt($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = HEAP16[$2>>1]|0;
 STACKTOP = sp;return ($3|0);
}
function __ZN10emscripten8internal11BindingTypeItE12fromWireTypeEt($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11LightTypeIDItE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (680|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet9DailyInfoEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15raw_constructorIN6Packet11JourneyInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(4)|0);
 ;HEAP32[$0>>2]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN6Packet11JourneyInfoEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet11JourneyInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet11JourneyInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet11JourneyInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (176|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEtE7getWireIS3_EEtRKMS3_tRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeItE10toWireTypeERKt($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEtE7setWireIS3_EEvRKMS3_tRT_t($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeItE12fromWireTypeEt($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP16[$11>>1] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet11JourneyInfoEtEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet11JourneyInfoEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15raw_constructorIN6Packet9MotorInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(16)|0);
 ;HEAP32[$0>>2]=0|0;HEAP32[$0+4>>2]=0|0;HEAP32[$0+8>>2]=0|0;HEAP32[$0+12>>2]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN6Packet9MotorInfoEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet9MotorInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet9MotorInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (184|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEN5Motor5StateEE7getWireIS3_EES5_RKMS3_S5_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN5Motor5StateEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEN5Motor5StateEE7setWireIS3_EEvRKMS3_S5_RT_S5_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN5Motor5StateEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEN5Motor5StateEEEPT_RKS7_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN5Motor5StateEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN5Motor5StateEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEfE7getWireIS3_EEfRKMS3_fRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (+__ZN10emscripten8internal11BindingTypeIfE10toWireTypeERKf($7));
 STACKTOP = sp;return (+$8);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEfE7setWireIS3_EEvRKMS3_fRT_f($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = +$2;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0.0, $6 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (+__ZN10emscripten8internal11BindingTypeIfE12fromWireTypeEf($6));
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAPF32[$11>>2] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet9MotorInfoEfEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15raw_constructorIN6Packet9ErrorInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(14)|0);
 ;HEAP32[$0>>2]=0|0;HEAP32[$0+4>>2]=0|0;HEAP32[$0+8>>2]=0|0;HEAP16[$0+12>>1]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN6Packet9ErrorInfoEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet9ErrorInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet9ErrorInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (192|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEtE7getWireIS3_EEtRKMS3_tRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeItE10toWireTypeERKt($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEtE7setWireIS3_EEvRKMS3_tRT_t($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeItE12fromWireTypeEt($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP16[$11>>1] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEtEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEN10SmartDrive5ErrorEE7getWireIS3_EES5_RKMS3_S5_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5ErrorEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEN10SmartDrive5ErrorEE7setWireIS3_EEvRKMS3_S5_RT_S5_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5ErrorEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN10SmartDrive5ErrorEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN10SmartDrive5ErrorEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEN10SmartDrive5ErrorEEEPT_RKS7_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5ErrorEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5ErrorEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11LightTypeIDIN10SmartDrive5ErrorEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (200|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet9ErrorInfoEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15raw_constructorIN6Packet10DeviceInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__Znwj(2)|0);
 ;HEAP16[$0>>1]=0|0;
 return ($0|0);
}
function __ZN10emscripten8internal14raw_destructorIN6Packet10DeviceInfoEEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet10DeviceInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet10DeviceInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet10DeviceInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (208|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoENS2_6DeviceEE7getWireIS3_EES4_RKMS3_S4_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet6DeviceEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoENS2_6DeviceEE7setWireIS3_EEvRKMS3_S4_RT_S4_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet6DeviceEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet10DeviceInfoENS2_6DeviceEEEPT_RKS6_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet6DeviceEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet6DeviceEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoEhE7getWireIS3_EEhRKMS3_hRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIhE10toWireTypeERKh($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoEhE7setWireIS3_EEvRKMS3_hRT_h($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIhE12fromWireTypeEh($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIMN6Packet10DeviceInfoEhEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal6TypeIDIN6Packet7CommandEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet7CommandEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet7CommandEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (216|0);
}
function __ZN10emscripten8internal6TypeIDIN6Packet3OTAEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet3OTAEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet3OTAEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (224|0);
}
function __ZN10emscripten8internal11NoBaseClass6verifyI6PacketEEvv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZN10emscripten8internal13getActualTypeI6PacketEEPKvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = (__ZN10emscripten8internal14getLightTypeIDI6PacketEEPKvRKT_($2)|0);
 STACKTOP = sp;return ($3|0);
}
function __ZN10emscripten8internal11NoBaseClass11getUpcasterI6PacketEEPFvvEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (0|0);
}
function __ZN10emscripten8internal11NoBaseClass13getDowncasterI6PacketEEPFvvEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (0|0);
}
function __ZN10emscripten8internal14raw_destructorI6PacketEEvPT_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = ($2|0)==(0|0);
 if (!($3)) {
  __ZN6PacketD2Ev($2);
  __ZdlPv($2);
 }
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDI6PacketE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDI6PacketE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerI6PacketEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIP6PacketE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINS0_17AllowedRawPointerIK6PacketEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIPK6PacketE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal14getLightTypeIDI6PacketEEPKvRKT_($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return (232|0);
}
function __ZN6PacketD2Ev($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal11LightTypeIDI6PacketE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (232|0);
}
function __ZN10emscripten8internal11LightTypeIDIP6PacketE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (240|0);
}
function __ZN10emscripten8internal11LightTypeIDIPK6PacketE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (256|0);
}
function __ZN10emscripten8internal12operator_newI6PacketJEEEPT_DpOT0_() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = (__Znwj(32)|0);
 __THREW__ = 0;
 invoke_vi(181,($2|0));
 $3 = __THREW__; __THREW__ = 0;
 $4 = $3&1;
 if ($4) {
  $5 = ___cxa_find_matching_catch_2()|0;
  $6 = tempRet0;
  $0 = $5;
  $1 = $6;
  __ZdlPv($2);
  $7 = $0;
  $8 = $1;
  ___resumeException($7|0);
  // unreachable;
 } else {
  STACKTOP = sp;return ($2|0);
 }
 return (0)|0;
}
function __ZN10emscripten8internal7InvokerIP6PacketJEE6invokeEPFS3_vE($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = (FUNCTION_TABLE_i[$2 & 255]()|0);
 $4 = (__ZN10emscripten8internal11BindingTypeIP6PacketE10toWireTypeES3_($3)|0);
 STACKTOP = sp;return ($4|0);
}
function __ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJP6PacketEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 1;
}
function __ZNK10emscripten8internal12WithPoliciesIJNS_18allow_raw_pointersEEE11ArgTypeListIJP6PacketEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNS0_17AllowedRawPointerI6PacketEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIP6PacketE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNS0_17AllowedRawPointerI6PacketEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (836|0);
}
function __ZN6PacketC2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 __ZN6Packet9newPacketEv($2);
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal13MethodInvokerIM6PacketFbvEbPS2_JEE6invokeERKS4_S5_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = (__ZN10emscripten8internal11BindingTypeIP6PacketE12fromWireTypeES3_($4)|0);
 $6 = $2;
 $$field = HEAP32[$6>>2]|0;
 $$index1 = ((($6)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $7 = $$field2 >> 1;
 $8 = (($5) + ($7)|0);
 $9 = $$field2 & 1;
 $10 = ($9|0)!=(0);
 if ($10) {
  $11 = HEAP32[$8>>2]|0;
  $12 = (($11) + ($$field)|0);
  $13 = HEAP32[$12>>2]|0;
  $15 = $13;
 } else {
  $14 = $$field;
  $15 = $14;
 }
 $16 = (FUNCTION_TABLE_ii[$15 & 255]($8)|0);
 $17 = (__ZN10emscripten8internal11BindingTypeIbE10toWireTypeEb($16)|0);
 STACKTOP = sp;return ($17|0);
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEEEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 2;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEEEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJbNS0_17AllowedRawPointerI6PacketEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketFbvEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIP6PacketE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJbNS0_17AllowedRawPointerI6PacketEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (840|0);
}
function __ZN10emscripten8internal13MethodInvokerIM6PacketFbNSt3__212basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEEbPS2_JS9_EE6invokeERKSB_SC_PNS0_11BindingTypeIS9_EUt_E($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $6 = sp + 8|0;
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $9 = $4;
 $10 = (__ZN10emscripten8internal11BindingTypeIP6PacketE12fromWireTypeES3_($9)|0);
 $11 = $3;
 $$field = HEAP32[$11>>2]|0;
 $$index1 = ((($11)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $12 = $$field2 >> 1;
 $13 = (($10) + ($12)|0);
 $14 = $$field2 & 1;
 $15 = ($14|0)!=(0);
 if ($15) {
  $16 = HEAP32[$13>>2]|0;
  $17 = (($16) + ($$field)|0);
  $18 = HEAP32[$17>>2]|0;
  $21 = $18;
 } else {
  $19 = $$field;
  $21 = $19;
 }
 $20 = $5;
 __ZN10emscripten8internal11BindingTypeINSt3__212basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEE12fromWireTypeEPNS9_Ut_E($6,$20);
 __THREW__ = 0;
 $22 = (invoke_iii($21|0,($13|0),($6|0))|0);
 $23 = __THREW__; __THREW__ = 0;
 $24 = $23&1;
 if ($24) {
  $28 = ___cxa_find_matching_catch_2()|0;
  $29 = tempRet0;
  $7 = $28;
  $8 = $29;
  __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev($6);
  $30 = $7;
  $31 = $8;
  ___resumeException($30|0);
  // unreachable;
 }
 __THREW__ = 0;
 $25 = (invoke_ii(182,($22|0))|0);
 $26 = __THREW__; __THREW__ = 0;
 $27 = $26&1;
 if ($27) {
  $28 = ___cxa_find_matching_catch_2()|0;
  $29 = tempRet0;
  $7 = $28;
  $8 = $29;
  __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev($6);
  $30 = $7;
  $31 = $8;
  ___resumeException($30|0);
  // unreachable;
 } else {
  __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev($6);
  STACKTOP = sp;return ($25|0);
 }
 return (0)|0;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEENSt3__212basic_stringIcNS7_11char_traitsIcEENS7_9allocatorIcEEEEEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 3;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJbNS0_17AllowedRawPointerI6PacketEENSt3__212basic_stringIcNS7_11char_traitsIcEENS7_9allocatorIcEEEEEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJbNS0_17AllowedRawPointerI6PacketEENSt3__212basic_stringIcNS6_11char_traitsIcEENS6_9allocatorIcEEEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketFbNSt3__212basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEEEEPT_RKSC_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeINSt3__212basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEE12fromWireTypeEPNS9_Ut_E($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0;
 var $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(224|0);
 $38 = sp;
 $40 = sp + 221|0;
 $51 = sp + 220|0;
 $58 = $1;
 $59 = $58;
 $60 = ((($59)) + 4|0);
 $61 = $58;
 $62 = HEAP32[$61>>2]|0;
 $55 = $0;
 $56 = $60;
 $57 = $62;
 $63 = $55;
 $54 = $63;
 $64 = $54;
 $53 = $64;
 $65 = $53;
 $52 = $65;
 ;HEAP32[$65>>2]=0|0;HEAP32[$65+4>>2]=0|0;HEAP32[$65+8>>2]=0|0;
 $66 = $56;
 $67 = $57;
 $46 = $63;
 $47 = $66;
 $48 = $67;
 $68 = $46;
 $69 = $48;
 $44 = $68;
 $70 = $44;
 $43 = $70;
 $71 = $43;
 $42 = $71;
 $72 = $42;
 $41 = $72;
 $73 = $41;
 $39 = $73;
 $74 = $39;
 ;HEAP8[$38>>0]=HEAP8[$40>>0]|0;
 $37 = $74;
 $75 = $37;
 $36 = $75;
 $45 = -1;
 $76 = $45;
 $77 = (($76) - 16)|0;
 $78 = ($69>>>0)>($77>>>0);
 if ($78) {
  __ZNKSt3__221__basic_string_commonILb1EE20__throw_length_errorEv($68);
  // unreachable;
 }
 $79 = $48;
 $80 = ($79>>>0)<(11);
 $81 = $48;
 if ($80) {
  $34 = $68;
  $35 = $81;
  $82 = $34;
  $83 = $35;
  $84 = $83&255;
  $33 = $82;
  $85 = $33;
  $32 = $85;
  $86 = $32;
  $87 = ((($86)) + 11|0);
  HEAP8[$87>>0] = $84;
  $31 = $68;
  $88 = $31;
  $30 = $88;
  $89 = $30;
  $29 = $89;
  $90 = $29;
  $28 = $90;
  $91 = $28;
  $27 = $91;
  $92 = $27;
  $49 = $92;
  $132 = $49;
  $26 = $132;
  $133 = $26;
  $134 = $47;
  $135 = $48;
  (__ZNSt3__211char_traitsIcE4copyEPcPKcj($133,$134,$135)|0);
  $136 = $49;
  $137 = $48;
  $138 = (($136) + ($137)|0);
  HEAP8[$51>>0] = 0;
  __ZNSt3__211char_traitsIcE6assignERcRKc($138,$51);
  STACKTOP = sp;return;
 }
 $6 = $81;
 $93 = $6;
 $94 = ($93>>>0)<(11);
 if ($94) {
  $101 = 11;
 } else {
  $95 = $6;
  $96 = (($95) + 1)|0;
  $5 = $96;
  $97 = $5;
  $98 = (($97) + 15)|0;
  $99 = $98 & -16;
  $101 = $99;
 }
 $100 = (($101) - 1)|0;
 $50 = $100;
 $4 = $68;
 $102 = $4;
 $3 = $102;
 $103 = $3;
 $2 = $103;
 $104 = $2;
 $105 = $50;
 $106 = (($105) + 1)|0;
 $12 = $104;
 $13 = $106;
 $107 = $12;
 $108 = $13;
 $9 = $107;
 $10 = $108;
 $11 = 0;
 $109 = $9;
 $8 = $109;
 $110 = $10;
 $7 = $110;
 $111 = $7;
 $112 = (__Znwj($111)|0);
 $49 = $112;
 $113 = $49;
 $16 = $68;
 $17 = $113;
 $114 = $16;
 $115 = $17;
 $15 = $114;
 $116 = $15;
 $14 = $116;
 $117 = $14;
 HEAP32[$117>>2] = $115;
 $118 = $50;
 $119 = (($118) + 1)|0;
 $20 = $68;
 $21 = $119;
 $120 = $20;
 $121 = $21;
 $122 = -2147483648 | $121;
 $19 = $120;
 $123 = $19;
 $18 = $123;
 $124 = $18;
 $125 = ((($124)) + 8|0);
 HEAP32[$125>>2] = $122;
 $126 = $48;
 $24 = $68;
 $25 = $126;
 $127 = $24;
 $128 = $25;
 $23 = $127;
 $129 = $23;
 $22 = $129;
 $130 = $22;
 $131 = ((($130)) + 4|0);
 HEAP32[$131>>2] = $128;
 $132 = $49;
 $26 = $132;
 $133 = $26;
 $134 = $47;
 $135 = $48;
 (__ZNSt3__211char_traitsIcE4copyEPcPKcj($133,$134,$135)|0);
 $136 = $49;
 $137 = $48;
 $138 = (($136) + ($137)|0);
 HEAP8[$51>>0] = 0;
 __ZNSt3__211char_traitsIcE6assignERcRKc($138,$51);
 STACKTOP = sp;return;
}
function __ZNSt3__211char_traitsIcE4copyEPcPKcj($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = ($6|0)==(0);
 $8 = $3;
 if ($7) {
  STACKTOP = sp;return ($8|0);
 }
 $9 = $4;
 $10 = $5;
 _memcpy(($8|0),($9|0),($10|0))|0;
 STACKTOP = sp;return ($8|0);
}
function __ZNSt3__211char_traitsIcE6assignERcRKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = HEAP8[$4>>0]|0;
 $6 = $2;
 HEAP8[$6>>0] = $5;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJbNS0_17AllowedRawPointerI6PacketEENSt3__212basic_stringIcNS6_11char_traitsIcEENS6_9allocatorIcEEEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (848|0);
}
function __ZN10emscripten8internal13MethodInvokerIM6PacketFvvEvPS2_JEE6invokeERKS4_S5_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = (__ZN10emscripten8internal11BindingTypeIP6PacketE12fromWireTypeES3_($4)|0);
 $6 = $2;
 $$field = HEAP32[$6>>2]|0;
 $$index1 = ((($6)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $7 = $$field2 >> 1;
 $8 = (($5) + ($7)|0);
 $9 = $$field2 & 1;
 $10 = ($9|0)!=(0);
 if ($10) {
  $11 = HEAP32[$8>>2]|0;
  $12 = (($11) + ($$field)|0);
  $13 = HEAP32[$12>>2]|0;
  $15 = $13;
  FUNCTION_TABLE_vi[$15 & 255]($8);
  STACKTOP = sp;return;
 } else {
  $14 = $$field;
  $15 = $14;
  FUNCTION_TABLE_vi[$15 & 255]($8);
  STACKTOP = sp;return;
 }
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerI6PacketEEEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 2;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJvNS0_17AllowedRawPointerI6PacketEEEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJvNS0_17AllowedRawPointerI6PacketEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketFvvEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJvNS0_17AllowedRawPointerI6PacketEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (860|0);
}
function __ZN10emscripten8internal19getGenericSignatureIJviiEEEPKcv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (3704|0);
}
function __ZN10emscripten8internal13MethodInvokerIM6PacketFNSt3__26vectorIhNS3_9allocatorIhEEEEvES7_PS2_JEE6invokeERKS9_SA_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = sp + 8|0;
 $2 = $0;
 $3 = $1;
 $7 = $3;
 $8 = (__ZN10emscripten8internal11BindingTypeIP6PacketE12fromWireTypeES3_($7)|0);
 $9 = $2;
 $$field = HEAP32[$9>>2]|0;
 $$index1 = ((($9)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $10 = $$field2 >> 1;
 $11 = (($8) + ($10)|0);
 $12 = $$field2 & 1;
 $13 = ($12|0)!=(0);
 if ($13) {
  $14 = HEAP32[$11>>2]|0;
  $15 = (($14) + ($$field)|0);
  $16 = HEAP32[$15>>2]|0;
  $18 = $16;
 } else {
  $17 = $$field;
  $18 = $17;
 }
 FUNCTION_TABLE_vii[$18 & 255]($4,$11);
 __THREW__ = 0;
 $19 = (invoke_ii(183,($4|0))|0);
 $20 = __THREW__; __THREW__ = 0;
 $21 = $20&1;
 if ($21) {
  $22 = ___cxa_find_matching_catch_2()|0;
  $23 = tempRet0;
  $5 = $22;
  $6 = $23;
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($4);
  $24 = $5;
  $25 = $6;
  ___resumeException($24|0);
  // unreachable;
 } else {
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($4);
  STACKTOP = sp;return ($19|0);
 }
 return (0)|0;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNSt3__26vectorIhNS4_9allocatorIhEEEENS0_17AllowedRawPointerI6PacketEEEE8getCountEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 STACKTOP = sp;return 2;
}
function __ZNK10emscripten8internal12WithPoliciesIJEE11ArgTypeListIJNSt3__26vectorIhNS4_9allocatorIhEEEENS0_17AllowedRawPointerI6PacketEEEE8getTypesEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNSt3__26vectorIhNS3_9allocatorIhEEEENS0_17AllowedRawPointerI6PacketEEEEEE3getEv()|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketFNSt3__26vectorIhNS3_9allocatorIhEEEEvEEEPT_RKSA_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeINSt3__26vectorIhNS2_9allocatorIhEEEEE10toWireTypeEOS6_($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(128|0);
 $5 = sp + 104|0;
 $6 = sp + 8|0;
 $9 = sp + 92|0;
 $10 = sp + 125|0;
 $11 = sp;
 $15 = sp + 124|0;
 $32 = $0;
 $33 = (__Znwj(12)|0);
 $34 = $32;
 $31 = $34;
 $35 = $31;
 $29 = $33;
 $30 = $35;
 $36 = $29;
 $37 = $30;
 $28 = $37;
 $38 = $28;
 $39 = ((($38)) + 8|0);
 $27 = $39;
 $40 = $27;
 $26 = $40;
 $41 = $26;
 $25 = $41;
 $42 = $25;
 $13 = $36;
 $14 = $42;
 $43 = $13;
 $12 = $43;
 HEAP32[$43>>2] = 0;
 $44 = ((($43)) + 4|0);
 HEAP32[$44>>2] = 0;
 $45 = ((($43)) + 8|0);
 ;HEAP8[$11>>0]=HEAP8[$15>>0]|0;
 $8 = $45;
 HEAP32[$9>>2] = 0;
 $46 = $8;
 $7 = $9;
 $47 = $7;
 $48 = HEAP32[$47>>2]|0;
 $1 = $11;
 ;HEAP8[$6>>0]=HEAP8[$10>>0]|0;
 $4 = $46;
 HEAP32[$5>>2] = $48;
 $49 = $4;
 $3 = $6;
 $2 = $5;
 $50 = $2;
 $51 = HEAP32[$50>>2]|0;
 HEAP32[$49>>2] = $51;
 $52 = $30;
 $53 = HEAP32[$52>>2]|0;
 HEAP32[$36>>2] = $53;
 $54 = $30;
 $55 = ((($54)) + 4|0);
 $56 = HEAP32[$55>>2]|0;
 $57 = ((($36)) + 4|0);
 HEAP32[$57>>2] = $56;
 $58 = $30;
 $18 = $58;
 $59 = $18;
 $60 = ((($59)) + 8|0);
 $17 = $60;
 $61 = $17;
 $16 = $61;
 $62 = $16;
 $63 = HEAP32[$62>>2]|0;
 $21 = $36;
 $64 = $21;
 $65 = ((($64)) + 8|0);
 $20 = $65;
 $66 = $20;
 $19 = $66;
 $67 = $19;
 HEAP32[$67>>2] = $63;
 $68 = $30;
 $24 = $68;
 $69 = $24;
 $70 = ((($69)) + 8|0);
 $23 = $70;
 $71 = $23;
 $22 = $71;
 $72 = $22;
 HEAP32[$72>>2] = 0;
 $73 = $30;
 $74 = ((($73)) + 4|0);
 HEAP32[$74>>2] = 0;
 $75 = $30;
 HEAP32[$75>>2] = 0;
 STACKTOP = sp;return ($33|0);
}
function __ZN10emscripten8internal14ArgArrayGetterINS0_8TypeListIJNSt3__26vectorIhNS3_9allocatorIhEEEENS0_17AllowedRawPointerI6PacketEEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (868|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketiE7getWireIS2_EEiRKMS2_iRKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal11BindingTypeIiE10toWireTypeERKi($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketiE7setWireIS2_EEvRKMS2_iRT_i($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal11BindingTypeIiE12fromWireTypeEi($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP32[$11>>2] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIiE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIiE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIM6PacketiEEPT_RKS4_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11BindingTypeIiE10toWireTypeERKi($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 $3 = HEAP32[$2>>2]|0;
 STACKTOP = sp;return ($3|0);
}
function __ZN10emscripten8internal11BindingTypeIiE12fromWireTypeEi($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11LightTypeIDIiE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (688|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_4TypeEE7getWireIS2_EES3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet4TypeEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_4TypeEE7setWireIS2_EEvRKMS2_S3_RT_S3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet4TypeEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_4TypeEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet4TypeEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet4TypeEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_4DataEE7getWireIS2_EES3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet4DataEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_4DataEE7setWireIS2_EEvRKMS2_S3_RT_S3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet4DataEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_4DataEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet4DataEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet4DataEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_7CommandEE7getWireIS2_EES3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet7CommandEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_7CommandEE7setWireIS2_EEvRKMS2_S3_RT_S3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet7CommandEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_7CommandEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet7CommandEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet7CommandEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive5ErrorEE7getWireIS2_EES4_RKMS2_S4_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5ErrorEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive5ErrorEE7setWireIS2_EEvRKMS2_S4_RT_S4_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN10SmartDrive5ErrorEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketN10SmartDrive5ErrorEEEPT_RKS6_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_3OTAEE7getWireIS2_EES3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet3OTAEE10toWireTypeES3_($8)|0);
 STACKTOP = sp;return ($9|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_3OTAEE7setWireIS2_EEvRKMS2_S3_RT_S3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal15EnumBindingTypeIN6Packet3OTAEE12fromWireTypeES3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 HEAP8[$11>>0] = $7;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_3OTAEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet3OTAEE10toWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal15EnumBindingTypeIN6Packet3OTAEE12fromWireTypeES3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive8SettingsEE7getWireIS2_EEPS4_RKMS2_S4_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN10SmartDrive8SettingsEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive8SettingsEE7setWireIS2_EEvRKMS2_S4_RT_PS4_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN10SmartDrive8SettingsEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP32[$11>>2]=HEAP32[$7>>2]|0;HEAP32[$11+4>>2]=HEAP32[$7+4>>2]|0;HEAP32[$11+8>>2]=HEAP32[$7+8>>2]|0;HEAP32[$11+12>>2]=HEAP32[$7+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketN10SmartDrive8SettingsEEEPT_RKS6_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN10SmartDrive8SettingsEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(16)|0);
 $3 = $1;
 ;HEAP32[$2>>2]=HEAP32[$3>>2]|0;HEAP32[$2+4>>2]=HEAP32[$3+4>>2]|0;HEAP32[$2+8>>2]=HEAP32[$3+8>>2]|0;HEAP32[$2+12>>2]=HEAP32[$3+12>>2]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN10SmartDrive8SettingsEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_11VersionInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet11VersionInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_11VersionInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet11VersionInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP8[$11>>0]=HEAP8[$7>>0]|0;HEAP8[$11+1>>0]=HEAP8[$7+1>>0]|0;HEAP8[$11+2>>0]=HEAP8[$7+2>>0]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_11VersionInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet11VersionInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(3)|0);
 $3 = $1;
 ;HEAP8[$2>>0]=HEAP8[$3>>0]|0;HEAP8[$2+1>>0]=HEAP8[$3+1>>0]|0;HEAP8[$2+2>>0]=HEAP8[$3+2>>0]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet11VersionInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_9DailyInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet9DailyInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_9DailyInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet9DailyInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP16[$11>>1]=HEAP16[$7>>1]|0;HEAP16[$11+2>>1]=HEAP16[$7+2>>1]|0;HEAP16[$11+4>>1]=HEAP16[$7+4>>1]|0;HEAP16[$11+6>>1]=HEAP16[$7+6>>1]|0;HEAP16[$11+8>>1]=HEAP16[$7+8>>1]|0;HEAP16[$11+10>>1]=HEAP16[$7+10>>1]|0;HEAP16[$11+12>>1]=HEAP16[$7+12>>1]|0;HEAP16[$11+14>>1]=HEAP16[$7+14>>1]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_9DailyInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet9DailyInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(16)|0);
 $3 = $1;
 ;HEAP16[$2>>1]=HEAP16[$3>>1]|0;HEAP16[$2+2>>1]=HEAP16[$3+2>>1]|0;HEAP16[$2+4>>1]=HEAP16[$3+4>>1]|0;HEAP16[$2+6>>1]=HEAP16[$3+6>>1]|0;HEAP16[$2+8>>1]=HEAP16[$3+8>>1]|0;HEAP16[$2+10>>1]=HEAP16[$3+10>>1]|0;HEAP16[$2+12>>1]=HEAP16[$3+12>>1]|0;HEAP16[$2+14>>1]=HEAP16[$3+14>>1]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet9DailyInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_11JourneyInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet11JourneyInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_11JourneyInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet11JourneyInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP16[$11>>1]=HEAP16[$7>>1]|0;HEAP16[$11+2>>1]=HEAP16[$7+2>>1]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_11JourneyInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet11JourneyInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 ;HEAP16[$2>>1]=HEAP16[$3>>1]|0;HEAP16[$2+2>>1]=HEAP16[$3+2>>1]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet11JourneyInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_9MotorInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet9MotorInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_9MotorInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet9MotorInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP32[$11>>2]=HEAP32[$7>>2]|0;HEAP32[$11+4>>2]=HEAP32[$7+4>>2]|0;HEAP32[$11+8>>2]=HEAP32[$7+8>>2]|0;HEAP32[$11+12>>2]=HEAP32[$7+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_9MotorInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet9MotorInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(16)|0);
 $3 = $1;
 ;HEAP32[$2>>2]=HEAP32[$3>>2]|0;HEAP32[$2+4>>2]=HEAP32[$3+4>>2]|0;HEAP32[$2+8>>2]=HEAP32[$3+8>>2]|0;HEAP32[$2+12>>2]=HEAP32[$3+12>>2]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet9MotorInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_8TimeInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet8TimeInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_8TimeInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet8TimeInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP16[$11>>1]=HEAP16[$7>>1]|0;HEAP16[$11+2>>1]=HEAP16[$7+2>>1]|0;HEAP16[$11+4>>1]=HEAP16[$7+4>>1]|0;HEAP16[$11+6>>1]=HEAP16[$7+6>>1]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet8TimeInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet8TimeInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_8TimeInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet8TimeInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 ;HEAP16[$2>>1]=HEAP16[$3>>1]|0;HEAP16[$2+2>>1]=HEAP16[$3+2>>1]|0;HEAP16[$2+4>>1]=HEAP16[$3+4>>1]|0;HEAP16[$2+6>>1]=HEAP16[$3+6>>1]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet8TimeInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet8TimeInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (304|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_10DeviceInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet10DeviceInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_10DeviceInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet10DeviceInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP8[$11>>0]=HEAP8[$7>>0]|0;HEAP8[$11+1>>0]=HEAP8[$7+1>>0]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_10DeviceInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet10DeviceInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(2)|0);
 $3 = $1;
 ;HEAP8[$2>>0]=HEAP8[$3>>0]|0;HEAP8[$2+1>>0]=HEAP8[$3+1>>0]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet10DeviceInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_9ErrorInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet9ErrorInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_9ErrorInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet9ErrorInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP16[$11>>1]=HEAP16[$7>>1]|0;HEAP16[$11+2>>1]=HEAP16[$7+2>>1]|0;HEAP16[$11+4>>1]=HEAP16[$7+4>>1]|0;HEAP16[$11+6>>1]=HEAP16[$7+6>>1]|0;HEAP16[$11+8>>1]=HEAP16[$7+8>>1]|0;HEAP16[$11+10>>1]=HEAP16[$7+10>>1]|0;HEAP16[$11+12>>1]=HEAP16[$7+12>>1]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_9ErrorInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet9ErrorInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(14)|0);
 $3 = $1;
 ;HEAP16[$2>>1]=HEAP16[$3>>1]|0;HEAP16[$2+2>>1]=HEAP16[$3+2>>1]|0;HEAP16[$2+4>>1]=HEAP16[$3+4>>1]|0;HEAP16[$2+6>>1]=HEAP16[$3+6>>1]|0;HEAP16[$2+8>>1]=HEAP16[$3+8>>1]|0;HEAP16[$2+10>>1]=HEAP16[$3+10>>1]|0;HEAP16[$2+12>>1]=HEAP16[$3+12>>1]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet9ErrorInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_11BatteryInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3;
 $5 = $2;
 $6 = HEAP32[$5>>2]|0;
 $7 = (($4) + ($6)|0);
 $8 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet11BatteryInfoEE10toWireTypeERKS3_($7)|0);
 STACKTOP = sp;return ($8|0);
}
function __ZN10emscripten8internal12MemberAccessI6PacketNS2_11BatteryInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5;
 $7 = (__ZN10emscripten8internal18GenericBindingTypeIN6Packet11BatteryInfoEE12fromWireTypeEPS3_($6)|0);
 $8 = $4;
 $9 = $3;
 $10 = HEAP32[$9>>2]|0;
 $11 = (($8) + ($10)|0);
 ;HEAP8[$11>>0]=HEAP8[$7>>0]|0;HEAP8[$11+1>>0]=HEAP8[$7+1>>0]|0;HEAP8[$11+2>>0]=HEAP8[$7+2>>0]|0;HEAP8[$11+3>>0]=HEAP8[$7+3>>0]|0;HEAP8[$11+4>>0]=HEAP8[$7+4>>0]|0;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIN6Packet11BatteryInfoEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIN6Packet11BatteryInfoEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal10getContextIM6PacketNS2_11BatteryInfoEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(4)|0);
 $3 = $1;
 $4 = HEAP32[$3>>2]|0;
 HEAP32[$2>>2] = $4;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet11BatteryInfoEE10toWireTypeERKS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(5)|0);
 $3 = $1;
 ;HEAP8[$2>>0]=HEAP8[$3>>0]|0;HEAP8[$2+1>>0]=HEAP8[$3+1>>0]|0;HEAP8[$2+2>>0]=HEAP8[$3+2>>0]|0;HEAP8[$2+3>>0]=HEAP8[$3+3>>0]|0;HEAP8[$2+4>>0]=HEAP8[$3+4>>0]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal18GenericBindingTypeIN6Packet11BatteryInfoEE12fromWireTypeEPS3_($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal11LightTypeIDIN6Packet11BatteryInfoEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (312|0);
}
function __ZN10emscripten8internal12GetterPolicyIM6PacketKFivEE3getIS2_EEiRKS4_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $4 = sp;
 $2 = $0;
 $3 = $1;
 $5 = $3;
 $6 = $2;
 $$field = HEAP32[$6>>2]|0;
 $$index1 = ((($6)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $7 = $$field2 >> 1;
 $8 = (($5) + ($7)|0);
 $9 = $$field2 & 1;
 $10 = ($9|0)!=(0);
 if ($10) {
  $11 = HEAP32[$8>>2]|0;
  $12 = (($11) + ($$field)|0);
  $13 = HEAP32[$12>>2]|0;
  $15 = $13;
 } else {
  $14 = $$field;
  $15 = $14;
 }
 $16 = (FUNCTION_TABLE_ii[$15 & 255]($8)|0);
 HEAP32[$4>>2] = $16;
 $17 = (__ZN10emscripten8internal11BindingTypeIiE10toWireTypeERKi($4)|0);
 STACKTOP = sp;return ($17|0);
}
function __ZN10emscripten8internal12SetterPolicyIM6PacketFviEE3setIS2_EEvRKS4_RT_i($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $4;
 $7 = $3;
 $$field = HEAP32[$7>>2]|0;
 $$index1 = ((($7)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $8 = $$field2 >> 1;
 $9 = (($6) + ($8)|0);
 $10 = $$field2 & 1;
 $11 = ($10|0)!=(0);
 if ($11) {
  $12 = HEAP32[$9>>2]|0;
  $13 = (($12) + ($$field)|0);
  $14 = HEAP32[$13>>2]|0;
  $18 = $14;
 } else {
  $15 = $$field;
  $18 = $15;
 }
 $16 = $5;
 $17 = (__ZN10emscripten8internal11BindingTypeIiE12fromWireTypeEi($16)|0);
 FUNCTION_TABLE_vii[$18 & 255]($9,$17);
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal12GetterPolicyIM6PacketKFivEE10getContextES4_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 $$field = HEAP32[$0>>2]|0;
 $$index1 = ((($0)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$1>>2] = $$field;
 $$index5 = ((($1)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 $2 = (__ZN10emscripten8internal10getContextIM6PacketKFivEEEPT_RKS5_($1)|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12SetterPolicyIM6PacketFviEE10getContextES4_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 $$field = HEAP32[$0>>2]|0;
 $$index1 = ((($0)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$1>>2] = $$field;
 $$index5 = ((($1)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 $2 = (__ZN10emscripten8internal10getContextIM6PacketFviEEEPT_RKS5_($1)|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketKFivEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketFviEEEPT_RKS5_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12GetterPolicyIM6PacketKFNSt3__26vectorIhNS3_9allocatorIhEEEEvEE3getIS2_EEPS7_RKS9_RKT_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = sp + 8|0;
 $2 = $0;
 $3 = $1;
 $7 = $3;
 $8 = $2;
 $$field = HEAP32[$8>>2]|0;
 $$index1 = ((($8)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $9 = $$field2 >> 1;
 $10 = (($7) + ($9)|0);
 $11 = $$field2 & 1;
 $12 = ($11|0)!=(0);
 if ($12) {
  $13 = HEAP32[$10>>2]|0;
  $14 = (($13) + ($$field)|0);
  $15 = HEAP32[$14>>2]|0;
  $17 = $15;
 } else {
  $16 = $$field;
  $17 = $16;
 }
 FUNCTION_TABLE_vii[$17 & 255]($4,$10);
 __THREW__ = 0;
 $18 = (invoke_ii(183,($4|0))|0);
 $19 = __THREW__; __THREW__ = 0;
 $20 = $19&1;
 if ($20) {
  $21 = ___cxa_find_matching_catch_2()|0;
  $22 = tempRet0;
  $5 = $21;
  $6 = $22;
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($4);
  $23 = $5;
  $24 = $6;
  ___resumeException($23|0);
  // unreachable;
 } else {
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($4);
  STACKTOP = sp;return ($18|0);
 }
 return (0)|0;
}
function __ZN10emscripten8internal12SetterPolicyIM6PacketFvNSt3__26vectorIhNS3_9allocatorIhEEEEEE3setIS2_EEvRKS9_RT_PS7_($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $6 = sp + 8|0;
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $9 = $4;
 $10 = $3;
 $$field = HEAP32[$10>>2]|0;
 $$index1 = ((($10)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 $11 = $$field2 >> 1;
 $12 = (($9) + ($11)|0);
 $13 = $$field2 & 1;
 $14 = ($13|0)!=(0);
 if ($14) {
  $15 = HEAP32[$12>>2]|0;
  $16 = (($15) + ($$field)|0);
  $17 = HEAP32[$16>>2]|0;
  $21 = $17;
 } else {
  $18 = $$field;
  $21 = $18;
 }
 $19 = $5;
 $20 = (__ZN10emscripten8internal18GenericBindingTypeINSt3__26vectorIhNS2_9allocatorIhEEEEE12fromWireTypeEPS6_($19)|0);
 __ZNSt3__26vectorIhNS_9allocatorIhEEEC2ERKS3_($6,$20);
 __THREW__ = 0;
 invoke_vii($21|0,($12|0),($6|0));
 $22 = __THREW__; __THREW__ = 0;
 $23 = $22&1;
 if ($23) {
  $24 = ___cxa_find_matching_catch_2()|0;
  $25 = tempRet0;
  $7 = $24;
  $8 = $25;
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($6);
  $26 = $7;
  $27 = $8;
  ___resumeException($26|0);
  // unreachable;
 } else {
  __ZNSt3__26vectorIhNS_9allocatorIhEEED2Ev($6);
  STACKTOP = sp;return;
 }
}
function __ZN10emscripten8internal12GetterPolicyIM6PacketKFNSt3__26vectorIhNS3_9allocatorIhEEEEvEE10getContextES9_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 $$field = HEAP32[$0>>2]|0;
 $$index1 = ((($0)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$1>>2] = $$field;
 $$index5 = ((($1)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 $2 = (__ZN10emscripten8internal10getContextIM6PacketKFNSt3__26vectorIhNS3_9allocatorIhEEEEvEEEPT_RKSA_($1)|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal12SetterPolicyIM6PacketFvNSt3__26vectorIhNS3_9allocatorIhEEEEEE10getContextES9_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 $$field = HEAP32[$0>>2]|0;
 $$index1 = ((($0)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$1>>2] = $$field;
 $$index5 = ((($1)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 $2 = (__ZN10emscripten8internal10getContextIM6PacketFvNSt3__26vectorIhNS3_9allocatorIhEEEEEEEPT_RKSA_($1)|0);
 STACKTOP = sp;return ($2|0);
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEEC2ERKS3_($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(112|0);
 $7 = sp + 84|0;
 $8 = sp + 16|0;
 $11 = sp + 72|0;
 $12 = sp + 111|0;
 $13 = sp + 8|0;
 $17 = sp + 110|0;
 $19 = sp;
 $21 = sp + 109|0;
 $27 = sp + 108|0;
 $25 = $0;
 $26 = $1;
 $31 = $25;
 $32 = $26;
 $24 = $32;
 $33 = $24;
 $34 = ((($33)) + 8|0);
 $23 = $34;
 $35 = $23;
 $22 = $35;
 $36 = $22;
 $20 = $36;
 $37 = $20;
 ;HEAP8[$19>>0]=HEAP8[$21>>0]|0;
 $18 = $37;
 $15 = $31;
 $16 = $27;
 $38 = $15;
 $14 = $38;
 HEAP32[$38>>2] = 0;
 $39 = ((($38)) + 4|0);
 HEAP32[$39>>2] = 0;
 $40 = ((($38)) + 8|0);
 ;HEAP8[$13>>0]=HEAP8[$17>>0]|0;
 $10 = $40;
 HEAP32[$11>>2] = 0;
 $41 = $10;
 $9 = $11;
 $42 = $9;
 $43 = HEAP32[$42>>2]|0;
 $3 = $13;
 ;HEAP8[$8>>0]=HEAP8[$12>>0]|0;
 $6 = $41;
 HEAP32[$7>>2] = $43;
 $44 = $6;
 $5 = $8;
 $4 = $7;
 $45 = $4;
 $46 = HEAP32[$45>>2]|0;
 HEAP32[$44>>2] = $46;
 $47 = $26;
 $2 = $47;
 $48 = $2;
 $49 = ((($48)) + 4|0);
 $50 = HEAP32[$49>>2]|0;
 $51 = HEAP32[$48>>2]|0;
 $52 = $50;
 $53 = $51;
 $54 = (($52) - ($53))|0;
 $28 = $54;
 $55 = $28;
 $56 = ($55>>>0)>(0);
 if (!($56)) {
  STACKTOP = sp;return;
 }
 $57 = $28;
 __THREW__ = 0;
 invoke_vii(184,($31|0),($57|0));
 $58 = __THREW__; __THREW__ = 0;
 $59 = $58&1;
 if ($59) {
  $68 = ___cxa_find_matching_catch_2()|0;
  $69 = tempRet0;
  $29 = $68;
  $30 = $69;
  __ZNSt3__213__vector_baseIhNS_9allocatorIhEEED2Ev($31);
  $70 = $29;
  $71 = $30;
  ___resumeException($70|0);
  // unreachable;
 }
 $60 = $26;
 $61 = HEAP32[$60>>2]|0;
 $62 = $26;
 $63 = ((($62)) + 4|0);
 $64 = HEAP32[$63>>2]|0;
 $65 = $28;
 __THREW__ = 0;
 invoke_viiii(185,($31|0),($61|0),($64|0),($65|0));
 $66 = __THREW__; __THREW__ = 0;
 $67 = $66&1;
 if ($67) {
  $68 = ___cxa_find_matching_catch_2()|0;
  $69 = tempRet0;
  $29 = $68;
  $30 = $69;
  __ZNSt3__213__vector_baseIhNS_9allocatorIhEEED2Ev($31);
  $70 = $29;
  $71 = $30;
  ___resumeException($70|0);
  // unreachable;
 } else {
  STACKTOP = sp;return;
 }
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE8allocateEj($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 160|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(160|0);
 $40 = $0;
 $41 = $1;
 $42 = $40;
 $43 = $41;
 $44 = (__ZNKSt3__26vectorIhNS_9allocatorIhEEE8max_sizeEv($42)|0);
 $45 = ($43>>>0)>($44>>>0);
 if ($45) {
  __ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv($42);
  // unreachable;
 } else {
  $39 = $42;
  $46 = $39;
  $47 = ((($46)) + 8|0);
  $38 = $47;
  $48 = $38;
  $37 = $48;
  $49 = $37;
  $50 = $41;
  $7 = $49;
  $8 = $50;
  $51 = $7;
  $52 = $8;
  $4 = $51;
  $5 = $52;
  $6 = 0;
  $53 = $4;
  $3 = $53;
  $54 = $5;
  $2 = $54;
  $55 = $2;
  $56 = (__Znwj($55)|0);
  $57 = ((($42)) + 4|0);
  HEAP32[$57>>2] = $56;
  HEAP32[$42>>2] = $56;
  $58 = HEAP32[$42>>2]|0;
  $59 = $41;
  $60 = (($58) + ($59)|0);
  $11 = $42;
  $61 = $11;
  $62 = ((($61)) + 8|0);
  $10 = $62;
  $63 = $10;
  $9 = $63;
  $64 = $9;
  HEAP32[$64>>2] = $60;
  $35 = $42;
  $36 = 0;
  $65 = $35;
  $34 = $65;
  $66 = $34;
  $67 = HEAP32[$66>>2]|0;
  $33 = $67;
  $68 = $33;
  $13 = $65;
  $69 = $13;
  $70 = HEAP32[$69>>2]|0;
  $12 = $70;
  $71 = $12;
  $18 = $65;
  $72 = $18;
  $17 = $72;
  $73 = $17;
  $16 = $73;
  $74 = $16;
  $75 = ((($74)) + 8|0);
  $15 = $75;
  $76 = $15;
  $14 = $76;
  $77 = $14;
  $78 = HEAP32[$77>>2]|0;
  $79 = HEAP32[$73>>2]|0;
  $80 = $78;
  $81 = $79;
  $82 = (($80) - ($81))|0;
  $83 = (($71) + ($82)|0);
  $20 = $65;
  $84 = $20;
  $85 = HEAP32[$84>>2]|0;
  $19 = $85;
  $86 = $19;
  $25 = $65;
  $87 = $25;
  $24 = $87;
  $88 = $24;
  $23 = $88;
  $89 = $23;
  $90 = ((($89)) + 8|0);
  $22 = $90;
  $91 = $22;
  $21 = $91;
  $92 = $21;
  $93 = HEAP32[$92>>2]|0;
  $94 = HEAP32[$88>>2]|0;
  $95 = $93;
  $96 = $94;
  $97 = (($95) - ($96))|0;
  $98 = (($86) + ($97)|0);
  $27 = $65;
  $99 = $27;
  $100 = HEAP32[$99>>2]|0;
  $26 = $100;
  $101 = $26;
  $102 = $36;
  $103 = (($101) + ($102)|0);
  $28 = $65;
  $29 = $68;
  $30 = $83;
  $31 = $98;
  $32 = $103;
  STACKTOP = sp;return;
 }
}
function __ZNSt3__26vectorIhNS_9allocatorIhEEE18__construct_at_endIPhEENS_9enable_ifIXsr21__is_forward_iteratorIT_EE5valueEvE4typeES7_S7_j($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(80|0);
 $21 = sp + 68|0;
 $16 = $0;
 $17 = $1;
 $18 = $2;
 $19 = $3;
 $22 = $16;
 $15 = $22;
 $23 = $15;
 $24 = ((($23)) + 8|0);
 $14 = $24;
 $25 = $14;
 $13 = $25;
 $26 = $13;
 $20 = $26;
 $27 = $19;
 $4 = $21;
 $5 = $22;
 $6 = $27;
 $28 = $20;
 $29 = $17;
 $30 = $18;
 $31 = ((($22)) + 4|0);
 $7 = $28;
 $8 = $29;
 $9 = $30;
 $10 = $31;
 $32 = $9;
 $33 = $8;
 $34 = $32;
 $35 = $33;
 $36 = (($34) - ($35))|0;
 $11 = $36;
 $37 = $11;
 $38 = ($37|0)>(0);
 if (!($38)) {
  $12 = $21;
  STACKTOP = sp;return;
 }
 $39 = $10;
 $40 = HEAP32[$39>>2]|0;
 $41 = $8;
 $42 = $11;
 _memcpy(($40|0),($41|0),($42|0))|0;
 $43 = $11;
 $44 = $10;
 $45 = HEAP32[$44>>2]|0;
 $46 = (($45) + ($43)|0);
 HEAP32[$44>>2] = $46;
 $12 = $21;
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal10getContextIM6PacketKFNSt3__26vectorIhNS3_9allocatorIhEEEEvEEEPT_RKSA_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __ZN10emscripten8internal10getContextIM6PacketFvNSt3__26vectorIhNS3_9allocatorIhEEEEEEEPT_RKSA_($0) {
 $0 = $0|0;
 var $$field = 0, $$field2 = 0, $$index1 = 0, $$index5 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__Znwj(8)|0);
 $3 = $1;
 $$field = HEAP32[$3>>2]|0;
 $$index1 = ((($3)) + 4|0);
 $$field2 = HEAP32[$$index1>>2]|0;
 HEAP32[$2>>2] = $$field;
 $$index5 = ((($2)) + 4|0);
 HEAP32[$$index5>>2] = $$field2;
 STACKTOP = sp;return ($2|0);
}
function __GLOBAL__sub_I_packet_cpp() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 ___cxx_global_var_init();
 return;
}
function __GLOBAL__sub_I_bind_cpp() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 ___cxx_global_var_init_2();
 return;
}
function ___cxx_global_var_init_2() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(8865);
 return;
}
function __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIvE3getEv()|0);
 __embind_register_void(($2|0),(3750|0));
 $3 = (__ZN10emscripten8internal6TypeIDIbE3getEv()|0);
 __embind_register_bool(($3|0),(3755|0),1,1,0);
 __ZN12_GLOBAL__N_1L16register_integerIcEEvPKc(3760);
 __ZN12_GLOBAL__N_1L16register_integerIaEEvPKc(3765);
 __ZN12_GLOBAL__N_1L16register_integerIhEEvPKc(3777);
 __ZN12_GLOBAL__N_1L16register_integerIsEEvPKc(3791);
 __ZN12_GLOBAL__N_1L16register_integerItEEvPKc(3797);
 __ZN12_GLOBAL__N_1L16register_integerIiEEvPKc(3812);
 __ZN12_GLOBAL__N_1L16register_integerIjEEvPKc(3816);
 __ZN12_GLOBAL__N_1L16register_integerIlEEvPKc(3829);
 __ZN12_GLOBAL__N_1L16register_integerImEEvPKc(3834);
 __ZN12_GLOBAL__N_1L14register_floatIfEEvPKc(3848);
 __ZN12_GLOBAL__N_1L14register_floatIdEEvPKc(3854);
 $4 = (__ZN10emscripten8internal6TypeIDINSt3__212basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEE3getEv()|0);
 __embind_register_std_string(($4|0),(3861|0));
 $5 = (__ZN10emscripten8internal6TypeIDINSt3__212basic_stringIhNS2_11char_traitsIhEENS2_9allocatorIhEEEEE3getEv()|0);
 __embind_register_std_string(($5|0),(3873|0));
 $6 = (__ZN10emscripten8internal6TypeIDINSt3__212basic_stringIwNS2_11char_traitsIwEENS2_9allocatorIwEEEEE3getEv()|0);
 __embind_register_std_wstring(($6|0),4,(3906|0));
 $7 = (__ZN10emscripten8internal6TypeIDINS_3valEE3getEv()|0);
 __embind_register_emval(($7|0),(3919|0));
 __ZN12_GLOBAL__N_1L20register_memory_viewIcEEvPKc(3935);
 __ZN12_GLOBAL__N_1L20register_memory_viewIaEEvPKc(3965);
 __ZN12_GLOBAL__N_1L20register_memory_viewIhEEvPKc(4002);
 __ZN12_GLOBAL__N_1L20register_memory_viewIsEEvPKc(4041);
 __ZN12_GLOBAL__N_1L20register_memory_viewItEEvPKc(4072);
 __ZN12_GLOBAL__N_1L20register_memory_viewIiEEvPKc(4112);
 __ZN12_GLOBAL__N_1L20register_memory_viewIjEEvPKc(4141);
 __ZN12_GLOBAL__N_1L20register_memory_viewIlEEvPKc(4179);
 __ZN12_GLOBAL__N_1L20register_memory_viewImEEvPKc(4209);
 __ZN12_GLOBAL__N_1L20register_memory_viewIaEEvPKc(4248);
 __ZN12_GLOBAL__N_1L20register_memory_viewIhEEvPKc(4280);
 __ZN12_GLOBAL__N_1L20register_memory_viewIsEEvPKc(4313);
 __ZN12_GLOBAL__N_1L20register_memory_viewItEEvPKc(4346);
 __ZN12_GLOBAL__N_1L20register_memory_viewIiEEvPKc(4380);
 __ZN12_GLOBAL__N_1L20register_memory_viewIjEEvPKc(4413);
 __ZN12_GLOBAL__N_1L20register_memory_viewIfEEvPKc(4447);
 __ZN12_GLOBAL__N_1L20register_memory_viewIdEEvPKc(4478);
 __ZN12_GLOBAL__N_1L20register_memory_viewIeEEvPKc(4510);
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDIvE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIvE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDIbE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIbE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_1L16register_integerIcEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIcE3getEv()|0);
 $3 = $1;
 $4 = -128 << 24 >> 24;
 $5 = 127 << 24 >> 24;
 __embind_register_integer(($2|0),($3|0),1,($4|0),($5|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerIaEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIaE3getEv()|0);
 $3 = $1;
 $4 = -128 << 24 >> 24;
 $5 = 127 << 24 >> 24;
 __embind_register_integer(($2|0),($3|0),1,($4|0),($5|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerIhEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIhE3getEv()|0);
 $3 = $1;
 $4 = 0;
 $5 = 255;
 __embind_register_integer(($2|0),($3|0),1,($4|0),($5|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerIsEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIsE3getEv()|0);
 $3 = $1;
 $4 = -32768 << 16 >> 16;
 $5 = 32767 << 16 >> 16;
 __embind_register_integer(($2|0),($3|0),2,($4|0),($5|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerItEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDItE3getEv()|0);
 $3 = $1;
 $4 = 0;
 $5 = 65535;
 __embind_register_integer(($2|0),($3|0),2,($4|0),($5|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerIiEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIiE3getEv()|0);
 $3 = $1;
 __embind_register_integer(($2|0),($3|0),4,-2147483648,2147483647);
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerIjEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIjE3getEv()|0);
 $3 = $1;
 __embind_register_integer(($2|0),($3|0),4,0,-1);
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerIlEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIlE3getEv()|0);
 $3 = $1;
 __embind_register_integer(($2|0),($3|0),4,-2147483648,2147483647);
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L16register_integerImEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDImE3getEv()|0);
 $3 = $1;
 __embind_register_integer(($2|0),($3|0),4,0,-1);
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L14register_floatIfEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIfE3getEv()|0);
 $3 = $1;
 __embind_register_float(($2|0),($3|0),4);
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L14register_floatIdEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDIdE3getEv()|0);
 $3 = $1;
 __embind_register_float(($2|0),($3|0),8);
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDINSt3__212basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINSt3__212basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINSt3__212basic_stringIhNS2_11char_traitsIhEENS2_9allocatorIhEEEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINSt3__212basic_stringIhNS2_11char_traitsIhEENS2_9allocatorIhEEEEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINSt3__212basic_stringIwNS2_11char_traitsIwEENS2_9allocatorIwEEEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINSt3__212basic_stringIwNS2_11char_traitsIwEENS2_9allocatorIwEEEEE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal6TypeIDINS_3valEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_3valEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIcEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIcEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIcEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIaEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIaEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIaEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIhEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIhEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIhEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIsEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIsEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIsEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewItEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewItEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexItEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIiEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIiEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIiEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIjEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIjEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIjEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIlEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIlEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIlEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewImEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewImEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexImEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIfEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIfEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIfEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIdEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIdEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIdEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN12_GLOBAL__N_1L20register_memory_viewIeEEvPKc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = (__ZN10emscripten8internal6TypeIDINS_11memory_viewIeEEE3getEv()|0);
 $3 = (__ZN12_GLOBAL__N_118getTypedArrayIndexIeEENS_15TypedArrayIndexEv()|0);
 $4 = $1;
 __embind_register_memory_view(($2|0),($3|0),($4|0));
 STACKTOP = sp;return;
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIeEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIeEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIeEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 7;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIeEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (320|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIdEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIdEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIdEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 7;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIdEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (328|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIfEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIfEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIfEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 6;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIfEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (336|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewImEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewImEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexImEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 5;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewImEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (344|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIlEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIlEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIlEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 4;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIlEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (352|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIjEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIjEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIjEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 5;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIjEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (360|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIiEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIiEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIiEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 4;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIiEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (368|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewItEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewItEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexItEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 3;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewItEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (376|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIsEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIsEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIsEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 2;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIsEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (384|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIhEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIhEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIhEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 1;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIhEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (392|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIaEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIaEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIaEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIaEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (400|0);
}
function __ZN10emscripten8internal6TypeIDINS_11memory_viewIcEEE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDINS_11memory_viewIcEEE3getEv()|0);
 return ($0|0);
}
function __ZN12_GLOBAL__N_118getTypedArrayIndexIcEENS_15TypedArrayIndexEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function __ZN10emscripten8internal11LightTypeIDINS_11memory_viewIcEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (408|0);
}
function __ZN10emscripten8internal11LightTypeIDINS_3valEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (96|0);
}
function __ZN10emscripten8internal11LightTypeIDINSt3__212basic_stringIwNS2_11char_traitsIwEENS2_9allocatorIwEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (416|0);
}
function __ZN10emscripten8internal11LightTypeIDINSt3__212basic_stringIhNS2_11char_traitsIhEENS2_9allocatorIhEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (440|0);
}
function __ZN10emscripten8internal11LightTypeIDINSt3__212basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (280|0);
}
function __ZN10emscripten8internal6TypeIDIdE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIdE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIdE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (728|0);
}
function __ZN10emscripten8internal6TypeIDImE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDImE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDImE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (712|0);
}
function __ZN10emscripten8internal6TypeIDIlE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIlE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIlE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (704|0);
}
function __ZN10emscripten8internal6TypeIDIjE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIjE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIjE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (696|0);
}
function __ZN10emscripten8internal6TypeIDIsE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIsE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIsE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (672|0);
}
function __ZN10emscripten8internal6TypeIDIaE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIaE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIaE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (664|0);
}
function __ZN10emscripten8internal6TypeIDIcE3getEv() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__ZN10emscripten8internal11LightTypeIDIcE3getEv()|0);
 return ($0|0);
}
function __ZN10emscripten8internal11LightTypeIDIcE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (648|0);
}
function __ZN10emscripten8internal11LightTypeIDIbE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (640|0);
}
function __ZN10emscripten8internal11LightTypeIDIvE3getEv() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (624|0);
}
function ___getTypeName($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $2;
 $1 = $3;
 $4 = $1;
 $5 = ((($4)) + 4|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = (___strdup($6)|0);
 STACKTOP = sp;return ($7|0);
}
function _malloc($0) {
 $0 = $0|0;
 var $$$0172$i = 0, $$$0173$i = 0, $$$4236$i = 0, $$$4329$i = 0, $$$i = 0, $$0 = 0, $$0$i = 0, $$0$i$i = 0, $$0$i$i$i = 0, $$0$i20$i = 0, $$01$i$i = 0, $$0172$lcssa$i = 0, $$01726$i = 0, $$0173$lcssa$i = 0, $$01735$i = 0, $$0192 = 0, $$0194 = 0, $$0201$i$i = 0, $$0202$i$i = 0, $$0206$i$i = 0;
 var $$0207$i$i = 0, $$024370$i = 0, $$0260$i$i = 0, $$0261$i$i = 0, $$0262$i$i = 0, $$0268$i$i = 0, $$0269$i$i = 0, $$0320$i = 0, $$0322$i = 0, $$0323$i = 0, $$0325$i = 0, $$0331$i = 0, $$0336$i = 0, $$0337$$i = 0, $$0337$i = 0, $$0339$i = 0, $$0340$i = 0, $$0345$i = 0, $$1176$i = 0, $$1178$i = 0;
 var $$124469$i = 0, $$1264$i$i = 0, $$1266$i$i = 0, $$1321$i = 0, $$1326$i = 0, $$1341$i = 0, $$1347$i = 0, $$1351$i = 0, $$2234243136$i = 0, $$2247$ph$i = 0, $$2253$ph$i = 0, $$2333$i = 0, $$3$i = 0, $$3$i$i = 0, $$3$i200 = 0, $$3328$i = 0, $$3349$i = 0, $$4$lcssa$i = 0, $$4$ph$i = 0, $$411$i = 0;
 var $$4236$i = 0, $$4329$lcssa$i = 0, $$432910$i = 0, $$4335$$4$i = 0, $$4335$ph$i = 0, $$43359$i = 0, $$723947$i = 0, $$748$i = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i17$i = 0, $$pre$i195 = 0, $$pre$i210 = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i18$iZ2D = 0, $$pre$phi$i211Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phiZ2D = 0, $$sink1$i = 0;
 var $$sink1$i$i = 0, $$sink14$i = 0, $$sink2$i = 0, $$sink2$i204 = 0, $$sink3$i = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0;
 var $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0;
 var $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0;
 var $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0;
 var $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0;
 var $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0;
 var $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0;
 var $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0;
 var $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0;
 var $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0;
 var $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0;
 var $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0;
 var $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0;
 var $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0;
 var $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0;
 var $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0;
 var $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0;
 var $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0;
 var $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0;
 var $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0;
 var $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0;
 var $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0;
 var $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0;
 var $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0;
 var $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0;
 var $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0;
 var $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0;
 var $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0;
 var $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0;
 var $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0;
 var $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0;
 var $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0;
 var $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0;
 var $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0;
 var $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0;
 var $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0;
 var $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0;
 var $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0;
 var $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0;
 var $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0;
 var $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0;
 var $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0;
 var $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0;
 var $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0;
 var $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0;
 var $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0;
 var $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0;
 var $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0;
 var $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $98 = 0, $99 = 0, $cond$i = 0, $cond$i$i = 0, $cond$i208 = 0, $exitcond$i$i = 0, $not$$i = 0;
 var $not$$i$i = 0, $not$$i197 = 0, $not$$i209 = 0, $not$1$i = 0, $not$1$i203 = 0, $not$3$i = 0, $not$5$i = 0, $or$cond$i = 0, $or$cond$i201 = 0, $or$cond1$i = 0, $or$cond10$i = 0, $or$cond11$i = 0, $or$cond11$not$i = 0, $or$cond12$i = 0, $or$cond2$i = 0, $or$cond2$i199 = 0, $or$cond49$i = 0, $or$cond5$i = 0, $or$cond50$i = 0, $or$cond7$i = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 $2 = ($0>>>0)<(245);
 do {
  if ($2) {
   $3 = ($0>>>0)<(11);
   $4 = (($0) + 11)|0;
   $5 = $4 & -8;
   $6 = $3 ? 16 : $5;
   $7 = $6 >>> 3;
   $8 = HEAP32[2070]|0;
   $9 = $8 >>> $7;
   $10 = $9 & 3;
   $11 = ($10|0)==(0);
   if (!($11)) {
    $12 = $9 & 1;
    $13 = $12 ^ 1;
    $14 = (($13) + ($7))|0;
    $15 = $14 << 1;
    $16 = (8320 + ($15<<2)|0);
    $17 = ((($16)) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ((($18)) + 8|0);
    $20 = HEAP32[$19>>2]|0;
    $21 = ($16|0)==($20|0);
    if ($21) {
     $22 = 1 << $14;
     $23 = $22 ^ -1;
     $24 = $8 & $23;
     HEAP32[2070] = $24;
    } else {
     $25 = ((($20)) + 12|0);
     HEAP32[$25>>2] = $16;
     HEAP32[$17>>2] = $20;
    }
    $26 = $14 << 3;
    $27 = $26 | 3;
    $28 = ((($18)) + 4|0);
    HEAP32[$28>>2] = $27;
    $29 = (($18) + ($26)|0);
    $30 = ((($29)) + 4|0);
    $31 = HEAP32[$30>>2]|0;
    $32 = $31 | 1;
    HEAP32[$30>>2] = $32;
    $$0 = $19;
    STACKTOP = sp;return ($$0|0);
   }
   $33 = HEAP32[(8288)>>2]|0;
   $34 = ($6>>>0)>($33>>>0);
   if ($34) {
    $35 = ($9|0)==(0);
    if (!($35)) {
     $36 = $9 << $7;
     $37 = 2 << $7;
     $38 = (0 - ($37))|0;
     $39 = $37 | $38;
     $40 = $36 & $39;
     $41 = (0 - ($40))|0;
     $42 = $40 & $41;
     $43 = (($42) + -1)|0;
     $44 = $43 >>> 12;
     $45 = $44 & 16;
     $46 = $43 >>> $45;
     $47 = $46 >>> 5;
     $48 = $47 & 8;
     $49 = $48 | $45;
     $50 = $46 >>> $48;
     $51 = $50 >>> 2;
     $52 = $51 & 4;
     $53 = $49 | $52;
     $54 = $50 >>> $52;
     $55 = $54 >>> 1;
     $56 = $55 & 2;
     $57 = $53 | $56;
     $58 = $54 >>> $56;
     $59 = $58 >>> 1;
     $60 = $59 & 1;
     $61 = $57 | $60;
     $62 = $58 >>> $60;
     $63 = (($61) + ($62))|0;
     $64 = $63 << 1;
     $65 = (8320 + ($64<<2)|0);
     $66 = ((($65)) + 8|0);
     $67 = HEAP32[$66>>2]|0;
     $68 = ((($67)) + 8|0);
     $69 = HEAP32[$68>>2]|0;
     $70 = ($65|0)==($69|0);
     if ($70) {
      $71 = 1 << $63;
      $72 = $71 ^ -1;
      $73 = $8 & $72;
      HEAP32[2070] = $73;
      $90 = $73;
     } else {
      $74 = ((($69)) + 12|0);
      HEAP32[$74>>2] = $65;
      HEAP32[$66>>2] = $69;
      $90 = $8;
     }
     $75 = $63 << 3;
     $76 = (($75) - ($6))|0;
     $77 = $6 | 3;
     $78 = ((($67)) + 4|0);
     HEAP32[$78>>2] = $77;
     $79 = (($67) + ($6)|0);
     $80 = $76 | 1;
     $81 = ((($79)) + 4|0);
     HEAP32[$81>>2] = $80;
     $82 = (($79) + ($76)|0);
     HEAP32[$82>>2] = $76;
     $83 = ($33|0)==(0);
     if (!($83)) {
      $84 = HEAP32[(8300)>>2]|0;
      $85 = $33 >>> 3;
      $86 = $85 << 1;
      $87 = (8320 + ($86<<2)|0);
      $88 = 1 << $85;
      $89 = $90 & $88;
      $91 = ($89|0)==(0);
      if ($91) {
       $92 = $90 | $88;
       HEAP32[2070] = $92;
       $$pre = ((($87)) + 8|0);
       $$0194 = $87;$$pre$phiZ2D = $$pre;
      } else {
       $93 = ((($87)) + 8|0);
       $94 = HEAP32[$93>>2]|0;
       $$0194 = $94;$$pre$phiZ2D = $93;
      }
      HEAP32[$$pre$phiZ2D>>2] = $84;
      $95 = ((($$0194)) + 12|0);
      HEAP32[$95>>2] = $84;
      $96 = ((($84)) + 8|0);
      HEAP32[$96>>2] = $$0194;
      $97 = ((($84)) + 12|0);
      HEAP32[$97>>2] = $87;
     }
     HEAP32[(8288)>>2] = $76;
     HEAP32[(8300)>>2] = $79;
     $$0 = $68;
     STACKTOP = sp;return ($$0|0);
    }
    $98 = HEAP32[(8284)>>2]|0;
    $99 = ($98|0)==(0);
    if ($99) {
     $$0192 = $6;
    } else {
     $100 = (0 - ($98))|0;
     $101 = $98 & $100;
     $102 = (($101) + -1)|0;
     $103 = $102 >>> 12;
     $104 = $103 & 16;
     $105 = $102 >>> $104;
     $106 = $105 >>> 5;
     $107 = $106 & 8;
     $108 = $107 | $104;
     $109 = $105 >>> $107;
     $110 = $109 >>> 2;
     $111 = $110 & 4;
     $112 = $108 | $111;
     $113 = $109 >>> $111;
     $114 = $113 >>> 1;
     $115 = $114 & 2;
     $116 = $112 | $115;
     $117 = $113 >>> $115;
     $118 = $117 >>> 1;
     $119 = $118 & 1;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = (($120) + ($121))|0;
     $123 = (8584 + ($122<<2)|0);
     $124 = HEAP32[$123>>2]|0;
     $125 = ((($124)) + 4|0);
     $126 = HEAP32[$125>>2]|0;
     $127 = $126 & -8;
     $128 = (($127) - ($6))|0;
     $129 = ((($124)) + 16|0);
     $130 = HEAP32[$129>>2]|0;
     $not$3$i = ($130|0)==(0|0);
     $$sink14$i = $not$3$i&1;
     $131 = (((($124)) + 16|0) + ($$sink14$i<<2)|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = ($132|0)==(0|0);
     if ($133) {
      $$0172$lcssa$i = $124;$$0173$lcssa$i = $128;
     } else {
      $$01726$i = $124;$$01735$i = $128;$135 = $132;
      while(1) {
       $134 = ((($135)) + 4|0);
       $136 = HEAP32[$134>>2]|0;
       $137 = $136 & -8;
       $138 = (($137) - ($6))|0;
       $139 = ($138>>>0)<($$01735$i>>>0);
       $$$0173$i = $139 ? $138 : $$01735$i;
       $$$0172$i = $139 ? $135 : $$01726$i;
       $140 = ((($135)) + 16|0);
       $141 = HEAP32[$140>>2]|0;
       $not$$i = ($141|0)==(0|0);
       $$sink1$i = $not$$i&1;
       $142 = (((($135)) + 16|0) + ($$sink1$i<<2)|0);
       $143 = HEAP32[$142>>2]|0;
       $144 = ($143|0)==(0|0);
       if ($144) {
        $$0172$lcssa$i = $$$0172$i;$$0173$lcssa$i = $$$0173$i;
        break;
       } else {
        $$01726$i = $$$0172$i;$$01735$i = $$$0173$i;$135 = $143;
       }
      }
     }
     $145 = (($$0172$lcssa$i) + ($6)|0);
     $146 = ($$0172$lcssa$i>>>0)<($145>>>0);
     if ($146) {
      $147 = ((($$0172$lcssa$i)) + 24|0);
      $148 = HEAP32[$147>>2]|0;
      $149 = ((($$0172$lcssa$i)) + 12|0);
      $150 = HEAP32[$149>>2]|0;
      $151 = ($150|0)==($$0172$lcssa$i|0);
      do {
       if ($151) {
        $156 = ((($$0172$lcssa$i)) + 20|0);
        $157 = HEAP32[$156>>2]|0;
        $158 = ($157|0)==(0|0);
        if ($158) {
         $159 = ((($$0172$lcssa$i)) + 16|0);
         $160 = HEAP32[$159>>2]|0;
         $161 = ($160|0)==(0|0);
         if ($161) {
          $$3$i = 0;
          break;
         } else {
          $$1176$i = $160;$$1178$i = $159;
         }
        } else {
         $$1176$i = $157;$$1178$i = $156;
        }
        while(1) {
         $162 = ((($$1176$i)) + 20|0);
         $163 = HEAP32[$162>>2]|0;
         $164 = ($163|0)==(0|0);
         if (!($164)) {
          $$1176$i = $163;$$1178$i = $162;
          continue;
         }
         $165 = ((($$1176$i)) + 16|0);
         $166 = HEAP32[$165>>2]|0;
         $167 = ($166|0)==(0|0);
         if ($167) {
          break;
         } else {
          $$1176$i = $166;$$1178$i = $165;
         }
        }
        HEAP32[$$1178$i>>2] = 0;
        $$3$i = $$1176$i;
       } else {
        $152 = ((($$0172$lcssa$i)) + 8|0);
        $153 = HEAP32[$152>>2]|0;
        $154 = ((($153)) + 12|0);
        HEAP32[$154>>2] = $150;
        $155 = ((($150)) + 8|0);
        HEAP32[$155>>2] = $153;
        $$3$i = $150;
       }
      } while(0);
      $168 = ($148|0)==(0|0);
      do {
       if (!($168)) {
        $169 = ((($$0172$lcssa$i)) + 28|0);
        $170 = HEAP32[$169>>2]|0;
        $171 = (8584 + ($170<<2)|0);
        $172 = HEAP32[$171>>2]|0;
        $173 = ($$0172$lcssa$i|0)==($172|0);
        if ($173) {
         HEAP32[$171>>2] = $$3$i;
         $cond$i = ($$3$i|0)==(0|0);
         if ($cond$i) {
          $174 = 1 << $170;
          $175 = $174 ^ -1;
          $176 = $98 & $175;
          HEAP32[(8284)>>2] = $176;
          break;
         }
        } else {
         $177 = ((($148)) + 16|0);
         $178 = HEAP32[$177>>2]|0;
         $not$1$i = ($178|0)!=($$0172$lcssa$i|0);
         $$sink2$i = $not$1$i&1;
         $179 = (((($148)) + 16|0) + ($$sink2$i<<2)|0);
         HEAP32[$179>>2] = $$3$i;
         $180 = ($$3$i|0)==(0|0);
         if ($180) {
          break;
         }
        }
        $181 = ((($$3$i)) + 24|0);
        HEAP32[$181>>2] = $148;
        $182 = ((($$0172$lcssa$i)) + 16|0);
        $183 = HEAP32[$182>>2]|0;
        $184 = ($183|0)==(0|0);
        if (!($184)) {
         $185 = ((($$3$i)) + 16|0);
         HEAP32[$185>>2] = $183;
         $186 = ((($183)) + 24|0);
         HEAP32[$186>>2] = $$3$i;
        }
        $187 = ((($$0172$lcssa$i)) + 20|0);
        $188 = HEAP32[$187>>2]|0;
        $189 = ($188|0)==(0|0);
        if (!($189)) {
         $190 = ((($$3$i)) + 20|0);
         HEAP32[$190>>2] = $188;
         $191 = ((($188)) + 24|0);
         HEAP32[$191>>2] = $$3$i;
        }
       }
      } while(0);
      $192 = ($$0173$lcssa$i>>>0)<(16);
      if ($192) {
       $193 = (($$0173$lcssa$i) + ($6))|0;
       $194 = $193 | 3;
       $195 = ((($$0172$lcssa$i)) + 4|0);
       HEAP32[$195>>2] = $194;
       $196 = (($$0172$lcssa$i) + ($193)|0);
       $197 = ((($196)) + 4|0);
       $198 = HEAP32[$197>>2]|0;
       $199 = $198 | 1;
       HEAP32[$197>>2] = $199;
      } else {
       $200 = $6 | 3;
       $201 = ((($$0172$lcssa$i)) + 4|0);
       HEAP32[$201>>2] = $200;
       $202 = $$0173$lcssa$i | 1;
       $203 = ((($145)) + 4|0);
       HEAP32[$203>>2] = $202;
       $204 = (($145) + ($$0173$lcssa$i)|0);
       HEAP32[$204>>2] = $$0173$lcssa$i;
       $205 = ($33|0)==(0);
       if (!($205)) {
        $206 = HEAP32[(8300)>>2]|0;
        $207 = $33 >>> 3;
        $208 = $207 << 1;
        $209 = (8320 + ($208<<2)|0);
        $210 = 1 << $207;
        $211 = $8 & $210;
        $212 = ($211|0)==(0);
        if ($212) {
         $213 = $8 | $210;
         HEAP32[2070] = $213;
         $$pre$i = ((($209)) + 8|0);
         $$0$i = $209;$$pre$phi$iZ2D = $$pre$i;
        } else {
         $214 = ((($209)) + 8|0);
         $215 = HEAP32[$214>>2]|0;
         $$0$i = $215;$$pre$phi$iZ2D = $214;
        }
        HEAP32[$$pre$phi$iZ2D>>2] = $206;
        $216 = ((($$0$i)) + 12|0);
        HEAP32[$216>>2] = $206;
        $217 = ((($206)) + 8|0);
        HEAP32[$217>>2] = $$0$i;
        $218 = ((($206)) + 12|0);
        HEAP32[$218>>2] = $209;
       }
       HEAP32[(8288)>>2] = $$0173$lcssa$i;
       HEAP32[(8300)>>2] = $145;
      }
      $219 = ((($$0172$lcssa$i)) + 8|0);
      $$0 = $219;
      STACKTOP = sp;return ($$0|0);
     } else {
      $$0192 = $6;
     }
    }
   } else {
    $$0192 = $6;
   }
  } else {
   $220 = ($0>>>0)>(4294967231);
   if ($220) {
    $$0192 = -1;
   } else {
    $221 = (($0) + 11)|0;
    $222 = $221 & -8;
    $223 = HEAP32[(8284)>>2]|0;
    $224 = ($223|0)==(0);
    if ($224) {
     $$0192 = $222;
    } else {
     $225 = (0 - ($222))|0;
     $226 = $221 >>> 8;
     $227 = ($226|0)==(0);
     if ($227) {
      $$0336$i = 0;
     } else {
      $228 = ($222>>>0)>(16777215);
      if ($228) {
       $$0336$i = 31;
      } else {
       $229 = (($226) + 1048320)|0;
       $230 = $229 >>> 16;
       $231 = $230 & 8;
       $232 = $226 << $231;
       $233 = (($232) + 520192)|0;
       $234 = $233 >>> 16;
       $235 = $234 & 4;
       $236 = $235 | $231;
       $237 = $232 << $235;
       $238 = (($237) + 245760)|0;
       $239 = $238 >>> 16;
       $240 = $239 & 2;
       $241 = $236 | $240;
       $242 = (14 - ($241))|0;
       $243 = $237 << $240;
       $244 = $243 >>> 15;
       $245 = (($242) + ($244))|0;
       $246 = $245 << 1;
       $247 = (($245) + 7)|0;
       $248 = $222 >>> $247;
       $249 = $248 & 1;
       $250 = $249 | $246;
       $$0336$i = $250;
      }
     }
     $251 = (8584 + ($$0336$i<<2)|0);
     $252 = HEAP32[$251>>2]|0;
     $253 = ($252|0)==(0|0);
     L74: do {
      if ($253) {
       $$2333$i = 0;$$3$i200 = 0;$$3328$i = $225;
       label = 57;
      } else {
       $254 = ($$0336$i|0)==(31);
       $255 = $$0336$i >>> 1;
       $256 = (25 - ($255))|0;
       $257 = $254 ? 0 : $256;
       $258 = $222 << $257;
       $$0320$i = 0;$$0325$i = $225;$$0331$i = $252;$$0337$i = $258;$$0340$i = 0;
       while(1) {
        $259 = ((($$0331$i)) + 4|0);
        $260 = HEAP32[$259>>2]|0;
        $261 = $260 & -8;
        $262 = (($261) - ($222))|0;
        $263 = ($262>>>0)<($$0325$i>>>0);
        if ($263) {
         $264 = ($262|0)==(0);
         if ($264) {
          $$411$i = $$0331$i;$$432910$i = 0;$$43359$i = $$0331$i;
          label = 61;
          break L74;
         } else {
          $$1321$i = $$0331$i;$$1326$i = $262;
         }
        } else {
         $$1321$i = $$0320$i;$$1326$i = $$0325$i;
        }
        $265 = ((($$0331$i)) + 20|0);
        $266 = HEAP32[$265>>2]|0;
        $267 = $$0337$i >>> 31;
        $268 = (((($$0331$i)) + 16|0) + ($267<<2)|0);
        $269 = HEAP32[$268>>2]|0;
        $270 = ($266|0)==(0|0);
        $271 = ($266|0)==($269|0);
        $or$cond2$i199 = $270 | $271;
        $$1341$i = $or$cond2$i199 ? $$0340$i : $266;
        $272 = ($269|0)==(0|0);
        $not$5$i = $272 ^ 1;
        $273 = $not$5$i&1;
        $$0337$$i = $$0337$i << $273;
        if ($272) {
         $$2333$i = $$1341$i;$$3$i200 = $$1321$i;$$3328$i = $$1326$i;
         label = 57;
         break;
        } else {
         $$0320$i = $$1321$i;$$0325$i = $$1326$i;$$0331$i = $269;$$0337$i = $$0337$$i;$$0340$i = $$1341$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 57) {
      $274 = ($$2333$i|0)==(0|0);
      $275 = ($$3$i200|0)==(0|0);
      $or$cond$i201 = $274 & $275;
      if ($or$cond$i201) {
       $276 = 2 << $$0336$i;
       $277 = (0 - ($276))|0;
       $278 = $276 | $277;
       $279 = $223 & $278;
       $280 = ($279|0)==(0);
       if ($280) {
        $$0192 = $222;
        break;
       }
       $281 = (0 - ($279))|0;
       $282 = $279 & $281;
       $283 = (($282) + -1)|0;
       $284 = $283 >>> 12;
       $285 = $284 & 16;
       $286 = $283 >>> $285;
       $287 = $286 >>> 5;
       $288 = $287 & 8;
       $289 = $288 | $285;
       $290 = $286 >>> $288;
       $291 = $290 >>> 2;
       $292 = $291 & 4;
       $293 = $289 | $292;
       $294 = $290 >>> $292;
       $295 = $294 >>> 1;
       $296 = $295 & 2;
       $297 = $293 | $296;
       $298 = $294 >>> $296;
       $299 = $298 >>> 1;
       $300 = $299 & 1;
       $301 = $297 | $300;
       $302 = $298 >>> $300;
       $303 = (($301) + ($302))|0;
       $304 = (8584 + ($303<<2)|0);
       $305 = HEAP32[$304>>2]|0;
       $$4$ph$i = 0;$$4335$ph$i = $305;
      } else {
       $$4$ph$i = $$3$i200;$$4335$ph$i = $$2333$i;
      }
      $306 = ($$4335$ph$i|0)==(0|0);
      if ($306) {
       $$4$lcssa$i = $$4$ph$i;$$4329$lcssa$i = $$3328$i;
      } else {
       $$411$i = $$4$ph$i;$$432910$i = $$3328$i;$$43359$i = $$4335$ph$i;
       label = 61;
      }
     }
     if ((label|0) == 61) {
      while(1) {
       label = 0;
       $307 = ((($$43359$i)) + 4|0);
       $308 = HEAP32[$307>>2]|0;
       $309 = $308 & -8;
       $310 = (($309) - ($222))|0;
       $311 = ($310>>>0)<($$432910$i>>>0);
       $$$4329$i = $311 ? $310 : $$432910$i;
       $$4335$$4$i = $311 ? $$43359$i : $$411$i;
       $312 = ((($$43359$i)) + 16|0);
       $313 = HEAP32[$312>>2]|0;
       $not$1$i203 = ($313|0)==(0|0);
       $$sink2$i204 = $not$1$i203&1;
       $314 = (((($$43359$i)) + 16|0) + ($$sink2$i204<<2)|0);
       $315 = HEAP32[$314>>2]|0;
       $316 = ($315|0)==(0|0);
       if ($316) {
        $$4$lcssa$i = $$4335$$4$i;$$4329$lcssa$i = $$$4329$i;
        break;
       } else {
        $$411$i = $$4335$$4$i;$$432910$i = $$$4329$i;$$43359$i = $315;
        label = 61;
       }
      }
     }
     $317 = ($$4$lcssa$i|0)==(0|0);
     if ($317) {
      $$0192 = $222;
     } else {
      $318 = HEAP32[(8288)>>2]|0;
      $319 = (($318) - ($222))|0;
      $320 = ($$4329$lcssa$i>>>0)<($319>>>0);
      if ($320) {
       $321 = (($$4$lcssa$i) + ($222)|0);
       $322 = ($$4$lcssa$i>>>0)<($321>>>0);
       if (!($322)) {
        $$0 = 0;
        STACKTOP = sp;return ($$0|0);
       }
       $323 = ((($$4$lcssa$i)) + 24|0);
       $324 = HEAP32[$323>>2]|0;
       $325 = ((($$4$lcssa$i)) + 12|0);
       $326 = HEAP32[$325>>2]|0;
       $327 = ($326|0)==($$4$lcssa$i|0);
       do {
        if ($327) {
         $332 = ((($$4$lcssa$i)) + 20|0);
         $333 = HEAP32[$332>>2]|0;
         $334 = ($333|0)==(0|0);
         if ($334) {
          $335 = ((($$4$lcssa$i)) + 16|0);
          $336 = HEAP32[$335>>2]|0;
          $337 = ($336|0)==(0|0);
          if ($337) {
           $$3349$i = 0;
           break;
          } else {
           $$1347$i = $336;$$1351$i = $335;
          }
         } else {
          $$1347$i = $333;$$1351$i = $332;
         }
         while(1) {
          $338 = ((($$1347$i)) + 20|0);
          $339 = HEAP32[$338>>2]|0;
          $340 = ($339|0)==(0|0);
          if (!($340)) {
           $$1347$i = $339;$$1351$i = $338;
           continue;
          }
          $341 = ((($$1347$i)) + 16|0);
          $342 = HEAP32[$341>>2]|0;
          $343 = ($342|0)==(0|0);
          if ($343) {
           break;
          } else {
           $$1347$i = $342;$$1351$i = $341;
          }
         }
         HEAP32[$$1351$i>>2] = 0;
         $$3349$i = $$1347$i;
        } else {
         $328 = ((($$4$lcssa$i)) + 8|0);
         $329 = HEAP32[$328>>2]|0;
         $330 = ((($329)) + 12|0);
         HEAP32[$330>>2] = $326;
         $331 = ((($326)) + 8|0);
         HEAP32[$331>>2] = $329;
         $$3349$i = $326;
        }
       } while(0);
       $344 = ($324|0)==(0|0);
       do {
        if ($344) {
         $426 = $223;
        } else {
         $345 = ((($$4$lcssa$i)) + 28|0);
         $346 = HEAP32[$345>>2]|0;
         $347 = (8584 + ($346<<2)|0);
         $348 = HEAP32[$347>>2]|0;
         $349 = ($$4$lcssa$i|0)==($348|0);
         if ($349) {
          HEAP32[$347>>2] = $$3349$i;
          $cond$i208 = ($$3349$i|0)==(0|0);
          if ($cond$i208) {
           $350 = 1 << $346;
           $351 = $350 ^ -1;
           $352 = $223 & $351;
           HEAP32[(8284)>>2] = $352;
           $426 = $352;
           break;
          }
         } else {
          $353 = ((($324)) + 16|0);
          $354 = HEAP32[$353>>2]|0;
          $not$$i209 = ($354|0)!=($$4$lcssa$i|0);
          $$sink3$i = $not$$i209&1;
          $355 = (((($324)) + 16|0) + ($$sink3$i<<2)|0);
          HEAP32[$355>>2] = $$3349$i;
          $356 = ($$3349$i|0)==(0|0);
          if ($356) {
           $426 = $223;
           break;
          }
         }
         $357 = ((($$3349$i)) + 24|0);
         HEAP32[$357>>2] = $324;
         $358 = ((($$4$lcssa$i)) + 16|0);
         $359 = HEAP32[$358>>2]|0;
         $360 = ($359|0)==(0|0);
         if (!($360)) {
          $361 = ((($$3349$i)) + 16|0);
          HEAP32[$361>>2] = $359;
          $362 = ((($359)) + 24|0);
          HEAP32[$362>>2] = $$3349$i;
         }
         $363 = ((($$4$lcssa$i)) + 20|0);
         $364 = HEAP32[$363>>2]|0;
         $365 = ($364|0)==(0|0);
         if ($365) {
          $426 = $223;
         } else {
          $366 = ((($$3349$i)) + 20|0);
          HEAP32[$366>>2] = $364;
          $367 = ((($364)) + 24|0);
          HEAP32[$367>>2] = $$3349$i;
          $426 = $223;
         }
        }
       } while(0);
       $368 = ($$4329$lcssa$i>>>0)<(16);
       do {
        if ($368) {
         $369 = (($$4329$lcssa$i) + ($222))|0;
         $370 = $369 | 3;
         $371 = ((($$4$lcssa$i)) + 4|0);
         HEAP32[$371>>2] = $370;
         $372 = (($$4$lcssa$i) + ($369)|0);
         $373 = ((($372)) + 4|0);
         $374 = HEAP32[$373>>2]|0;
         $375 = $374 | 1;
         HEAP32[$373>>2] = $375;
        } else {
         $376 = $222 | 3;
         $377 = ((($$4$lcssa$i)) + 4|0);
         HEAP32[$377>>2] = $376;
         $378 = $$4329$lcssa$i | 1;
         $379 = ((($321)) + 4|0);
         HEAP32[$379>>2] = $378;
         $380 = (($321) + ($$4329$lcssa$i)|0);
         HEAP32[$380>>2] = $$4329$lcssa$i;
         $381 = $$4329$lcssa$i >>> 3;
         $382 = ($$4329$lcssa$i>>>0)<(256);
         if ($382) {
          $383 = $381 << 1;
          $384 = (8320 + ($383<<2)|0);
          $385 = HEAP32[2070]|0;
          $386 = 1 << $381;
          $387 = $385 & $386;
          $388 = ($387|0)==(0);
          if ($388) {
           $389 = $385 | $386;
           HEAP32[2070] = $389;
           $$pre$i210 = ((($384)) + 8|0);
           $$0345$i = $384;$$pre$phi$i211Z2D = $$pre$i210;
          } else {
           $390 = ((($384)) + 8|0);
           $391 = HEAP32[$390>>2]|0;
           $$0345$i = $391;$$pre$phi$i211Z2D = $390;
          }
          HEAP32[$$pre$phi$i211Z2D>>2] = $321;
          $392 = ((($$0345$i)) + 12|0);
          HEAP32[$392>>2] = $321;
          $393 = ((($321)) + 8|0);
          HEAP32[$393>>2] = $$0345$i;
          $394 = ((($321)) + 12|0);
          HEAP32[$394>>2] = $384;
          break;
         }
         $395 = $$4329$lcssa$i >>> 8;
         $396 = ($395|0)==(0);
         if ($396) {
          $$0339$i = 0;
         } else {
          $397 = ($$4329$lcssa$i>>>0)>(16777215);
          if ($397) {
           $$0339$i = 31;
          } else {
           $398 = (($395) + 1048320)|0;
           $399 = $398 >>> 16;
           $400 = $399 & 8;
           $401 = $395 << $400;
           $402 = (($401) + 520192)|0;
           $403 = $402 >>> 16;
           $404 = $403 & 4;
           $405 = $404 | $400;
           $406 = $401 << $404;
           $407 = (($406) + 245760)|0;
           $408 = $407 >>> 16;
           $409 = $408 & 2;
           $410 = $405 | $409;
           $411 = (14 - ($410))|0;
           $412 = $406 << $409;
           $413 = $412 >>> 15;
           $414 = (($411) + ($413))|0;
           $415 = $414 << 1;
           $416 = (($414) + 7)|0;
           $417 = $$4329$lcssa$i >>> $416;
           $418 = $417 & 1;
           $419 = $418 | $415;
           $$0339$i = $419;
          }
         }
         $420 = (8584 + ($$0339$i<<2)|0);
         $421 = ((($321)) + 28|0);
         HEAP32[$421>>2] = $$0339$i;
         $422 = ((($321)) + 16|0);
         $423 = ((($422)) + 4|0);
         HEAP32[$423>>2] = 0;
         HEAP32[$422>>2] = 0;
         $424 = 1 << $$0339$i;
         $425 = $426 & $424;
         $427 = ($425|0)==(0);
         if ($427) {
          $428 = $426 | $424;
          HEAP32[(8284)>>2] = $428;
          HEAP32[$420>>2] = $321;
          $429 = ((($321)) + 24|0);
          HEAP32[$429>>2] = $420;
          $430 = ((($321)) + 12|0);
          HEAP32[$430>>2] = $321;
          $431 = ((($321)) + 8|0);
          HEAP32[$431>>2] = $321;
          break;
         }
         $432 = HEAP32[$420>>2]|0;
         $433 = ($$0339$i|0)==(31);
         $434 = $$0339$i >>> 1;
         $435 = (25 - ($434))|0;
         $436 = $433 ? 0 : $435;
         $437 = $$4329$lcssa$i << $436;
         $$0322$i = $437;$$0323$i = $432;
         while(1) {
          $438 = ((($$0323$i)) + 4|0);
          $439 = HEAP32[$438>>2]|0;
          $440 = $439 & -8;
          $441 = ($440|0)==($$4329$lcssa$i|0);
          if ($441) {
           label = 97;
           break;
          }
          $442 = $$0322$i >>> 31;
          $443 = (((($$0323$i)) + 16|0) + ($442<<2)|0);
          $444 = $$0322$i << 1;
          $445 = HEAP32[$443>>2]|0;
          $446 = ($445|0)==(0|0);
          if ($446) {
           label = 96;
           break;
          } else {
           $$0322$i = $444;$$0323$i = $445;
          }
         }
         if ((label|0) == 96) {
          HEAP32[$443>>2] = $321;
          $447 = ((($321)) + 24|0);
          HEAP32[$447>>2] = $$0323$i;
          $448 = ((($321)) + 12|0);
          HEAP32[$448>>2] = $321;
          $449 = ((($321)) + 8|0);
          HEAP32[$449>>2] = $321;
          break;
         }
         else if ((label|0) == 97) {
          $450 = ((($$0323$i)) + 8|0);
          $451 = HEAP32[$450>>2]|0;
          $452 = ((($451)) + 12|0);
          HEAP32[$452>>2] = $321;
          HEAP32[$450>>2] = $321;
          $453 = ((($321)) + 8|0);
          HEAP32[$453>>2] = $451;
          $454 = ((($321)) + 12|0);
          HEAP32[$454>>2] = $$0323$i;
          $455 = ((($321)) + 24|0);
          HEAP32[$455>>2] = 0;
          break;
         }
        }
       } while(0);
       $456 = ((($$4$lcssa$i)) + 8|0);
       $$0 = $456;
       STACKTOP = sp;return ($$0|0);
      } else {
       $$0192 = $222;
      }
     }
    }
   }
  }
 } while(0);
 $457 = HEAP32[(8288)>>2]|0;
 $458 = ($457>>>0)<($$0192>>>0);
 if (!($458)) {
  $459 = (($457) - ($$0192))|0;
  $460 = HEAP32[(8300)>>2]|0;
  $461 = ($459>>>0)>(15);
  if ($461) {
   $462 = (($460) + ($$0192)|0);
   HEAP32[(8300)>>2] = $462;
   HEAP32[(8288)>>2] = $459;
   $463 = $459 | 1;
   $464 = ((($462)) + 4|0);
   HEAP32[$464>>2] = $463;
   $465 = (($462) + ($459)|0);
   HEAP32[$465>>2] = $459;
   $466 = $$0192 | 3;
   $467 = ((($460)) + 4|0);
   HEAP32[$467>>2] = $466;
  } else {
   HEAP32[(8288)>>2] = 0;
   HEAP32[(8300)>>2] = 0;
   $468 = $457 | 3;
   $469 = ((($460)) + 4|0);
   HEAP32[$469>>2] = $468;
   $470 = (($460) + ($457)|0);
   $471 = ((($470)) + 4|0);
   $472 = HEAP32[$471>>2]|0;
   $473 = $472 | 1;
   HEAP32[$471>>2] = $473;
  }
  $474 = ((($460)) + 8|0);
  $$0 = $474;
  STACKTOP = sp;return ($$0|0);
 }
 $475 = HEAP32[(8292)>>2]|0;
 $476 = ($475>>>0)>($$0192>>>0);
 if ($476) {
  $477 = (($475) - ($$0192))|0;
  HEAP32[(8292)>>2] = $477;
  $478 = HEAP32[(8304)>>2]|0;
  $479 = (($478) + ($$0192)|0);
  HEAP32[(8304)>>2] = $479;
  $480 = $477 | 1;
  $481 = ((($479)) + 4|0);
  HEAP32[$481>>2] = $480;
  $482 = $$0192 | 3;
  $483 = ((($478)) + 4|0);
  HEAP32[$483>>2] = $482;
  $484 = ((($478)) + 8|0);
  $$0 = $484;
  STACKTOP = sp;return ($$0|0);
 }
 $485 = HEAP32[2188]|0;
 $486 = ($485|0)==(0);
 if ($486) {
  HEAP32[(8760)>>2] = 4096;
  HEAP32[(8756)>>2] = 4096;
  HEAP32[(8764)>>2] = -1;
  HEAP32[(8768)>>2] = -1;
  HEAP32[(8772)>>2] = 0;
  HEAP32[(8724)>>2] = 0;
  $487 = $1;
  $488 = $487 & -16;
  $489 = $488 ^ 1431655768;
  HEAP32[$1>>2] = $489;
  HEAP32[2188] = $489;
  $493 = 4096;
 } else {
  $$pre$i195 = HEAP32[(8760)>>2]|0;
  $493 = $$pre$i195;
 }
 $490 = (($$0192) + 48)|0;
 $491 = (($$0192) + 47)|0;
 $492 = (($493) + ($491))|0;
 $494 = (0 - ($493))|0;
 $495 = $492 & $494;
 $496 = ($495>>>0)>($$0192>>>0);
 if (!($496)) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $497 = HEAP32[(8720)>>2]|0;
 $498 = ($497|0)==(0);
 if (!($498)) {
  $499 = HEAP32[(8712)>>2]|0;
  $500 = (($499) + ($495))|0;
  $501 = ($500>>>0)<=($499>>>0);
  $502 = ($500>>>0)>($497>>>0);
  $or$cond1$i = $501 | $502;
  if ($or$cond1$i) {
   $$0 = 0;
   STACKTOP = sp;return ($$0|0);
  }
 }
 $503 = HEAP32[(8724)>>2]|0;
 $504 = $503 & 4;
 $505 = ($504|0)==(0);
 L167: do {
  if ($505) {
   $506 = HEAP32[(8304)>>2]|0;
   $507 = ($506|0)==(0|0);
   L169: do {
    if ($507) {
     label = 118;
    } else {
     $$0$i20$i = (8728);
     while(1) {
      $508 = HEAP32[$$0$i20$i>>2]|0;
      $509 = ($508>>>0)>($506>>>0);
      if (!($509)) {
       $510 = ((($$0$i20$i)) + 4|0);
       $511 = HEAP32[$510>>2]|0;
       $512 = (($508) + ($511)|0);
       $513 = ($512>>>0)>($506>>>0);
       if ($513) {
        break;
       }
      }
      $514 = ((($$0$i20$i)) + 8|0);
      $515 = HEAP32[$514>>2]|0;
      $516 = ($515|0)==(0|0);
      if ($516) {
       label = 118;
       break L169;
      } else {
       $$0$i20$i = $515;
      }
     }
     $539 = (($492) - ($475))|0;
     $540 = $539 & $494;
     $541 = ($540>>>0)<(2147483647);
     if ($541) {
      $542 = (_sbrk(($540|0))|0);
      $543 = HEAP32[$$0$i20$i>>2]|0;
      $544 = HEAP32[$510>>2]|0;
      $545 = (($543) + ($544)|0);
      $546 = ($542|0)==($545|0);
      if ($546) {
       $547 = ($542|0)==((-1)|0);
       if ($547) {
        $$2234243136$i = $540;
       } else {
        $$723947$i = $540;$$748$i = $542;
        label = 135;
        break L167;
       }
      } else {
       $$2247$ph$i = $542;$$2253$ph$i = $540;
       label = 126;
      }
     } else {
      $$2234243136$i = 0;
     }
    }
   } while(0);
   do {
    if ((label|0) == 118) {
     $517 = (_sbrk(0)|0);
     $518 = ($517|0)==((-1)|0);
     if ($518) {
      $$2234243136$i = 0;
     } else {
      $519 = $517;
      $520 = HEAP32[(8756)>>2]|0;
      $521 = (($520) + -1)|0;
      $522 = $521 & $519;
      $523 = ($522|0)==(0);
      $524 = (($521) + ($519))|0;
      $525 = (0 - ($520))|0;
      $526 = $524 & $525;
      $527 = (($526) - ($519))|0;
      $528 = $523 ? 0 : $527;
      $$$i = (($528) + ($495))|0;
      $529 = HEAP32[(8712)>>2]|0;
      $530 = (($$$i) + ($529))|0;
      $531 = ($$$i>>>0)>($$0192>>>0);
      $532 = ($$$i>>>0)<(2147483647);
      $or$cond$i = $531 & $532;
      if ($or$cond$i) {
       $533 = HEAP32[(8720)>>2]|0;
       $534 = ($533|0)==(0);
       if (!($534)) {
        $535 = ($530>>>0)<=($529>>>0);
        $536 = ($530>>>0)>($533>>>0);
        $or$cond2$i = $535 | $536;
        if ($or$cond2$i) {
         $$2234243136$i = 0;
         break;
        }
       }
       $537 = (_sbrk(($$$i|0))|0);
       $538 = ($537|0)==($517|0);
       if ($538) {
        $$723947$i = $$$i;$$748$i = $517;
        label = 135;
        break L167;
       } else {
        $$2247$ph$i = $537;$$2253$ph$i = $$$i;
        label = 126;
       }
      } else {
       $$2234243136$i = 0;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 126) {
     $548 = (0 - ($$2253$ph$i))|0;
     $549 = ($$2247$ph$i|0)!=((-1)|0);
     $550 = ($$2253$ph$i>>>0)<(2147483647);
     $or$cond7$i = $550 & $549;
     $551 = ($490>>>0)>($$2253$ph$i>>>0);
     $or$cond10$i = $551 & $or$cond7$i;
     if (!($or$cond10$i)) {
      $561 = ($$2247$ph$i|0)==((-1)|0);
      if ($561) {
       $$2234243136$i = 0;
       break;
      } else {
       $$723947$i = $$2253$ph$i;$$748$i = $$2247$ph$i;
       label = 135;
       break L167;
      }
     }
     $552 = HEAP32[(8760)>>2]|0;
     $553 = (($491) - ($$2253$ph$i))|0;
     $554 = (($553) + ($552))|0;
     $555 = (0 - ($552))|0;
     $556 = $554 & $555;
     $557 = ($556>>>0)<(2147483647);
     if (!($557)) {
      $$723947$i = $$2253$ph$i;$$748$i = $$2247$ph$i;
      label = 135;
      break L167;
     }
     $558 = (_sbrk(($556|0))|0);
     $559 = ($558|0)==((-1)|0);
     if ($559) {
      (_sbrk(($548|0))|0);
      $$2234243136$i = 0;
      break;
     } else {
      $560 = (($556) + ($$2253$ph$i))|0;
      $$723947$i = $560;$$748$i = $$2247$ph$i;
      label = 135;
      break L167;
     }
    }
   } while(0);
   $562 = HEAP32[(8724)>>2]|0;
   $563 = $562 | 4;
   HEAP32[(8724)>>2] = $563;
   $$4236$i = $$2234243136$i;
   label = 133;
  } else {
   $$4236$i = 0;
   label = 133;
  }
 } while(0);
 if ((label|0) == 133) {
  $564 = ($495>>>0)<(2147483647);
  if ($564) {
   $565 = (_sbrk(($495|0))|0);
   $566 = (_sbrk(0)|0);
   $567 = ($565|0)!=((-1)|0);
   $568 = ($566|0)!=((-1)|0);
   $or$cond5$i = $567 & $568;
   $569 = ($565>>>0)<($566>>>0);
   $or$cond11$i = $569 & $or$cond5$i;
   $570 = $566;
   $571 = $565;
   $572 = (($570) - ($571))|0;
   $573 = (($$0192) + 40)|0;
   $574 = ($572>>>0)>($573>>>0);
   $$$4236$i = $574 ? $572 : $$4236$i;
   $or$cond11$not$i = $or$cond11$i ^ 1;
   $575 = ($565|0)==((-1)|0);
   $not$$i197 = $574 ^ 1;
   $576 = $575 | $not$$i197;
   $or$cond49$i = $576 | $or$cond11$not$i;
   if (!($or$cond49$i)) {
    $$723947$i = $$$4236$i;$$748$i = $565;
    label = 135;
   }
  }
 }
 if ((label|0) == 135) {
  $577 = HEAP32[(8712)>>2]|0;
  $578 = (($577) + ($$723947$i))|0;
  HEAP32[(8712)>>2] = $578;
  $579 = HEAP32[(8716)>>2]|0;
  $580 = ($578>>>0)>($579>>>0);
  if ($580) {
   HEAP32[(8716)>>2] = $578;
  }
  $581 = HEAP32[(8304)>>2]|0;
  $582 = ($581|0)==(0|0);
  do {
   if ($582) {
    $583 = HEAP32[(8296)>>2]|0;
    $584 = ($583|0)==(0|0);
    $585 = ($$748$i>>>0)<($583>>>0);
    $or$cond12$i = $584 | $585;
    if ($or$cond12$i) {
     HEAP32[(8296)>>2] = $$748$i;
    }
    HEAP32[(8728)>>2] = $$748$i;
    HEAP32[(8732)>>2] = $$723947$i;
    HEAP32[(8740)>>2] = 0;
    $586 = HEAP32[2188]|0;
    HEAP32[(8316)>>2] = $586;
    HEAP32[(8312)>>2] = -1;
    $$01$i$i = 0;
    while(1) {
     $587 = $$01$i$i << 1;
     $588 = (8320 + ($587<<2)|0);
     $589 = ((($588)) + 12|0);
     HEAP32[$589>>2] = $588;
     $590 = ((($588)) + 8|0);
     HEAP32[$590>>2] = $588;
     $591 = (($$01$i$i) + 1)|0;
     $exitcond$i$i = ($591|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $$01$i$i = $591;
     }
    }
    $592 = (($$723947$i) + -40)|0;
    $593 = ((($$748$i)) + 8|0);
    $594 = $593;
    $595 = $594 & 7;
    $596 = ($595|0)==(0);
    $597 = (0 - ($594))|0;
    $598 = $597 & 7;
    $599 = $596 ? 0 : $598;
    $600 = (($$748$i) + ($599)|0);
    $601 = (($592) - ($599))|0;
    HEAP32[(8304)>>2] = $600;
    HEAP32[(8292)>>2] = $601;
    $602 = $601 | 1;
    $603 = ((($600)) + 4|0);
    HEAP32[$603>>2] = $602;
    $604 = (($600) + ($601)|0);
    $605 = ((($604)) + 4|0);
    HEAP32[$605>>2] = 40;
    $606 = HEAP32[(8768)>>2]|0;
    HEAP32[(8308)>>2] = $606;
   } else {
    $$024370$i = (8728);
    while(1) {
     $607 = HEAP32[$$024370$i>>2]|0;
     $608 = ((($$024370$i)) + 4|0);
     $609 = HEAP32[$608>>2]|0;
     $610 = (($607) + ($609)|0);
     $611 = ($$748$i|0)==($610|0);
     if ($611) {
      label = 145;
      break;
     }
     $612 = ((($$024370$i)) + 8|0);
     $613 = HEAP32[$612>>2]|0;
     $614 = ($613|0)==(0|0);
     if ($614) {
      break;
     } else {
      $$024370$i = $613;
     }
    }
    if ((label|0) == 145) {
     $615 = ((($$024370$i)) + 12|0);
     $616 = HEAP32[$615>>2]|0;
     $617 = $616 & 8;
     $618 = ($617|0)==(0);
     if ($618) {
      $619 = ($581>>>0)>=($607>>>0);
      $620 = ($581>>>0)<($$748$i>>>0);
      $or$cond50$i = $620 & $619;
      if ($or$cond50$i) {
       $621 = (($609) + ($$723947$i))|0;
       HEAP32[$608>>2] = $621;
       $622 = HEAP32[(8292)>>2]|0;
       $623 = ((($581)) + 8|0);
       $624 = $623;
       $625 = $624 & 7;
       $626 = ($625|0)==(0);
       $627 = (0 - ($624))|0;
       $628 = $627 & 7;
       $629 = $626 ? 0 : $628;
       $630 = (($581) + ($629)|0);
       $631 = (($$723947$i) - ($629))|0;
       $632 = (($622) + ($631))|0;
       HEAP32[(8304)>>2] = $630;
       HEAP32[(8292)>>2] = $632;
       $633 = $632 | 1;
       $634 = ((($630)) + 4|0);
       HEAP32[$634>>2] = $633;
       $635 = (($630) + ($632)|0);
       $636 = ((($635)) + 4|0);
       HEAP32[$636>>2] = 40;
       $637 = HEAP32[(8768)>>2]|0;
       HEAP32[(8308)>>2] = $637;
       break;
      }
     }
    }
    $638 = HEAP32[(8296)>>2]|0;
    $639 = ($$748$i>>>0)<($638>>>0);
    if ($639) {
     HEAP32[(8296)>>2] = $$748$i;
    }
    $640 = (($$748$i) + ($$723947$i)|0);
    $$124469$i = (8728);
    while(1) {
     $641 = HEAP32[$$124469$i>>2]|0;
     $642 = ($641|0)==($640|0);
     if ($642) {
      label = 153;
      break;
     }
     $643 = ((($$124469$i)) + 8|0);
     $644 = HEAP32[$643>>2]|0;
     $645 = ($644|0)==(0|0);
     if ($645) {
      break;
     } else {
      $$124469$i = $644;
     }
    }
    if ((label|0) == 153) {
     $646 = ((($$124469$i)) + 12|0);
     $647 = HEAP32[$646>>2]|0;
     $648 = $647 & 8;
     $649 = ($648|0)==(0);
     if ($649) {
      HEAP32[$$124469$i>>2] = $$748$i;
      $650 = ((($$124469$i)) + 4|0);
      $651 = HEAP32[$650>>2]|0;
      $652 = (($651) + ($$723947$i))|0;
      HEAP32[$650>>2] = $652;
      $653 = ((($$748$i)) + 8|0);
      $654 = $653;
      $655 = $654 & 7;
      $656 = ($655|0)==(0);
      $657 = (0 - ($654))|0;
      $658 = $657 & 7;
      $659 = $656 ? 0 : $658;
      $660 = (($$748$i) + ($659)|0);
      $661 = ((($640)) + 8|0);
      $662 = $661;
      $663 = $662 & 7;
      $664 = ($663|0)==(0);
      $665 = (0 - ($662))|0;
      $666 = $665 & 7;
      $667 = $664 ? 0 : $666;
      $668 = (($640) + ($667)|0);
      $669 = $668;
      $670 = $660;
      $671 = (($669) - ($670))|0;
      $672 = (($660) + ($$0192)|0);
      $673 = (($671) - ($$0192))|0;
      $674 = $$0192 | 3;
      $675 = ((($660)) + 4|0);
      HEAP32[$675>>2] = $674;
      $676 = ($668|0)==($581|0);
      do {
       if ($676) {
        $677 = HEAP32[(8292)>>2]|0;
        $678 = (($677) + ($673))|0;
        HEAP32[(8292)>>2] = $678;
        HEAP32[(8304)>>2] = $672;
        $679 = $678 | 1;
        $680 = ((($672)) + 4|0);
        HEAP32[$680>>2] = $679;
       } else {
        $681 = HEAP32[(8300)>>2]|0;
        $682 = ($668|0)==($681|0);
        if ($682) {
         $683 = HEAP32[(8288)>>2]|0;
         $684 = (($683) + ($673))|0;
         HEAP32[(8288)>>2] = $684;
         HEAP32[(8300)>>2] = $672;
         $685 = $684 | 1;
         $686 = ((($672)) + 4|0);
         HEAP32[$686>>2] = $685;
         $687 = (($672) + ($684)|0);
         HEAP32[$687>>2] = $684;
         break;
        }
        $688 = ((($668)) + 4|0);
        $689 = HEAP32[$688>>2]|0;
        $690 = $689 & 3;
        $691 = ($690|0)==(1);
        if ($691) {
         $692 = $689 & -8;
         $693 = $689 >>> 3;
         $694 = ($689>>>0)<(256);
         L237: do {
          if ($694) {
           $695 = ((($668)) + 8|0);
           $696 = HEAP32[$695>>2]|0;
           $697 = ((($668)) + 12|0);
           $698 = HEAP32[$697>>2]|0;
           $699 = ($698|0)==($696|0);
           if ($699) {
            $700 = 1 << $693;
            $701 = $700 ^ -1;
            $702 = HEAP32[2070]|0;
            $703 = $702 & $701;
            HEAP32[2070] = $703;
            break;
           } else {
            $704 = ((($696)) + 12|0);
            HEAP32[$704>>2] = $698;
            $705 = ((($698)) + 8|0);
            HEAP32[$705>>2] = $696;
            break;
           }
          } else {
           $706 = ((($668)) + 24|0);
           $707 = HEAP32[$706>>2]|0;
           $708 = ((($668)) + 12|0);
           $709 = HEAP32[$708>>2]|0;
           $710 = ($709|0)==($668|0);
           do {
            if ($710) {
             $715 = ((($668)) + 16|0);
             $716 = ((($715)) + 4|0);
             $717 = HEAP32[$716>>2]|0;
             $718 = ($717|0)==(0|0);
             if ($718) {
              $719 = HEAP32[$715>>2]|0;
              $720 = ($719|0)==(0|0);
              if ($720) {
               $$3$i$i = 0;
               break;
              } else {
               $$1264$i$i = $719;$$1266$i$i = $715;
              }
             } else {
              $$1264$i$i = $717;$$1266$i$i = $716;
             }
             while(1) {
              $721 = ((($$1264$i$i)) + 20|0);
              $722 = HEAP32[$721>>2]|0;
              $723 = ($722|0)==(0|0);
              if (!($723)) {
               $$1264$i$i = $722;$$1266$i$i = $721;
               continue;
              }
              $724 = ((($$1264$i$i)) + 16|0);
              $725 = HEAP32[$724>>2]|0;
              $726 = ($725|0)==(0|0);
              if ($726) {
               break;
              } else {
               $$1264$i$i = $725;$$1266$i$i = $724;
              }
             }
             HEAP32[$$1266$i$i>>2] = 0;
             $$3$i$i = $$1264$i$i;
            } else {
             $711 = ((($668)) + 8|0);
             $712 = HEAP32[$711>>2]|0;
             $713 = ((($712)) + 12|0);
             HEAP32[$713>>2] = $709;
             $714 = ((($709)) + 8|0);
             HEAP32[$714>>2] = $712;
             $$3$i$i = $709;
            }
           } while(0);
           $727 = ($707|0)==(0|0);
           if ($727) {
            break;
           }
           $728 = ((($668)) + 28|0);
           $729 = HEAP32[$728>>2]|0;
           $730 = (8584 + ($729<<2)|0);
           $731 = HEAP32[$730>>2]|0;
           $732 = ($668|0)==($731|0);
           do {
            if ($732) {
             HEAP32[$730>>2] = $$3$i$i;
             $cond$i$i = ($$3$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $733 = 1 << $729;
             $734 = $733 ^ -1;
             $735 = HEAP32[(8284)>>2]|0;
             $736 = $735 & $734;
             HEAP32[(8284)>>2] = $736;
             break L237;
            } else {
             $737 = ((($707)) + 16|0);
             $738 = HEAP32[$737>>2]|0;
             $not$$i$i = ($738|0)!=($668|0);
             $$sink1$i$i = $not$$i$i&1;
             $739 = (((($707)) + 16|0) + ($$sink1$i$i<<2)|0);
             HEAP32[$739>>2] = $$3$i$i;
             $740 = ($$3$i$i|0)==(0|0);
             if ($740) {
              break L237;
             }
            }
           } while(0);
           $741 = ((($$3$i$i)) + 24|0);
           HEAP32[$741>>2] = $707;
           $742 = ((($668)) + 16|0);
           $743 = HEAP32[$742>>2]|0;
           $744 = ($743|0)==(0|0);
           if (!($744)) {
            $745 = ((($$3$i$i)) + 16|0);
            HEAP32[$745>>2] = $743;
            $746 = ((($743)) + 24|0);
            HEAP32[$746>>2] = $$3$i$i;
           }
           $747 = ((($742)) + 4|0);
           $748 = HEAP32[$747>>2]|0;
           $749 = ($748|0)==(0|0);
           if ($749) {
            break;
           }
           $750 = ((($$3$i$i)) + 20|0);
           HEAP32[$750>>2] = $748;
           $751 = ((($748)) + 24|0);
           HEAP32[$751>>2] = $$3$i$i;
          }
         } while(0);
         $752 = (($668) + ($692)|0);
         $753 = (($692) + ($673))|0;
         $$0$i$i = $752;$$0260$i$i = $753;
        } else {
         $$0$i$i = $668;$$0260$i$i = $673;
        }
        $754 = ((($$0$i$i)) + 4|0);
        $755 = HEAP32[$754>>2]|0;
        $756 = $755 & -2;
        HEAP32[$754>>2] = $756;
        $757 = $$0260$i$i | 1;
        $758 = ((($672)) + 4|0);
        HEAP32[$758>>2] = $757;
        $759 = (($672) + ($$0260$i$i)|0);
        HEAP32[$759>>2] = $$0260$i$i;
        $760 = $$0260$i$i >>> 3;
        $761 = ($$0260$i$i>>>0)<(256);
        if ($761) {
         $762 = $760 << 1;
         $763 = (8320 + ($762<<2)|0);
         $764 = HEAP32[2070]|0;
         $765 = 1 << $760;
         $766 = $764 & $765;
         $767 = ($766|0)==(0);
         if ($767) {
          $768 = $764 | $765;
          HEAP32[2070] = $768;
          $$pre$i17$i = ((($763)) + 8|0);
          $$0268$i$i = $763;$$pre$phi$i18$iZ2D = $$pre$i17$i;
         } else {
          $769 = ((($763)) + 8|0);
          $770 = HEAP32[$769>>2]|0;
          $$0268$i$i = $770;$$pre$phi$i18$iZ2D = $769;
         }
         HEAP32[$$pre$phi$i18$iZ2D>>2] = $672;
         $771 = ((($$0268$i$i)) + 12|0);
         HEAP32[$771>>2] = $672;
         $772 = ((($672)) + 8|0);
         HEAP32[$772>>2] = $$0268$i$i;
         $773 = ((($672)) + 12|0);
         HEAP32[$773>>2] = $763;
         break;
        }
        $774 = $$0260$i$i >>> 8;
        $775 = ($774|0)==(0);
        do {
         if ($775) {
          $$0269$i$i = 0;
         } else {
          $776 = ($$0260$i$i>>>0)>(16777215);
          if ($776) {
           $$0269$i$i = 31;
           break;
          }
          $777 = (($774) + 1048320)|0;
          $778 = $777 >>> 16;
          $779 = $778 & 8;
          $780 = $774 << $779;
          $781 = (($780) + 520192)|0;
          $782 = $781 >>> 16;
          $783 = $782 & 4;
          $784 = $783 | $779;
          $785 = $780 << $783;
          $786 = (($785) + 245760)|0;
          $787 = $786 >>> 16;
          $788 = $787 & 2;
          $789 = $784 | $788;
          $790 = (14 - ($789))|0;
          $791 = $785 << $788;
          $792 = $791 >>> 15;
          $793 = (($790) + ($792))|0;
          $794 = $793 << 1;
          $795 = (($793) + 7)|0;
          $796 = $$0260$i$i >>> $795;
          $797 = $796 & 1;
          $798 = $797 | $794;
          $$0269$i$i = $798;
         }
        } while(0);
        $799 = (8584 + ($$0269$i$i<<2)|0);
        $800 = ((($672)) + 28|0);
        HEAP32[$800>>2] = $$0269$i$i;
        $801 = ((($672)) + 16|0);
        $802 = ((($801)) + 4|0);
        HEAP32[$802>>2] = 0;
        HEAP32[$801>>2] = 0;
        $803 = HEAP32[(8284)>>2]|0;
        $804 = 1 << $$0269$i$i;
        $805 = $803 & $804;
        $806 = ($805|0)==(0);
        if ($806) {
         $807 = $803 | $804;
         HEAP32[(8284)>>2] = $807;
         HEAP32[$799>>2] = $672;
         $808 = ((($672)) + 24|0);
         HEAP32[$808>>2] = $799;
         $809 = ((($672)) + 12|0);
         HEAP32[$809>>2] = $672;
         $810 = ((($672)) + 8|0);
         HEAP32[$810>>2] = $672;
         break;
        }
        $811 = HEAP32[$799>>2]|0;
        $812 = ($$0269$i$i|0)==(31);
        $813 = $$0269$i$i >>> 1;
        $814 = (25 - ($813))|0;
        $815 = $812 ? 0 : $814;
        $816 = $$0260$i$i << $815;
        $$0261$i$i = $816;$$0262$i$i = $811;
        while(1) {
         $817 = ((($$0262$i$i)) + 4|0);
         $818 = HEAP32[$817>>2]|0;
         $819 = $818 & -8;
         $820 = ($819|0)==($$0260$i$i|0);
         if ($820) {
          label = 194;
          break;
         }
         $821 = $$0261$i$i >>> 31;
         $822 = (((($$0262$i$i)) + 16|0) + ($821<<2)|0);
         $823 = $$0261$i$i << 1;
         $824 = HEAP32[$822>>2]|0;
         $825 = ($824|0)==(0|0);
         if ($825) {
          label = 193;
          break;
         } else {
          $$0261$i$i = $823;$$0262$i$i = $824;
         }
        }
        if ((label|0) == 193) {
         HEAP32[$822>>2] = $672;
         $826 = ((($672)) + 24|0);
         HEAP32[$826>>2] = $$0262$i$i;
         $827 = ((($672)) + 12|0);
         HEAP32[$827>>2] = $672;
         $828 = ((($672)) + 8|0);
         HEAP32[$828>>2] = $672;
         break;
        }
        else if ((label|0) == 194) {
         $829 = ((($$0262$i$i)) + 8|0);
         $830 = HEAP32[$829>>2]|0;
         $831 = ((($830)) + 12|0);
         HEAP32[$831>>2] = $672;
         HEAP32[$829>>2] = $672;
         $832 = ((($672)) + 8|0);
         HEAP32[$832>>2] = $830;
         $833 = ((($672)) + 12|0);
         HEAP32[$833>>2] = $$0262$i$i;
         $834 = ((($672)) + 24|0);
         HEAP32[$834>>2] = 0;
         break;
        }
       }
      } while(0);
      $959 = ((($660)) + 8|0);
      $$0 = $959;
      STACKTOP = sp;return ($$0|0);
     }
    }
    $$0$i$i$i = (8728);
    while(1) {
     $835 = HEAP32[$$0$i$i$i>>2]|0;
     $836 = ($835>>>0)>($581>>>0);
     if (!($836)) {
      $837 = ((($$0$i$i$i)) + 4|0);
      $838 = HEAP32[$837>>2]|0;
      $839 = (($835) + ($838)|0);
      $840 = ($839>>>0)>($581>>>0);
      if ($840) {
       break;
      }
     }
     $841 = ((($$0$i$i$i)) + 8|0);
     $842 = HEAP32[$841>>2]|0;
     $$0$i$i$i = $842;
    }
    $843 = ((($839)) + -47|0);
    $844 = ((($843)) + 8|0);
    $845 = $844;
    $846 = $845 & 7;
    $847 = ($846|0)==(0);
    $848 = (0 - ($845))|0;
    $849 = $848 & 7;
    $850 = $847 ? 0 : $849;
    $851 = (($843) + ($850)|0);
    $852 = ((($581)) + 16|0);
    $853 = ($851>>>0)<($852>>>0);
    $854 = $853 ? $581 : $851;
    $855 = ((($854)) + 8|0);
    $856 = ((($854)) + 24|0);
    $857 = (($$723947$i) + -40)|0;
    $858 = ((($$748$i)) + 8|0);
    $859 = $858;
    $860 = $859 & 7;
    $861 = ($860|0)==(0);
    $862 = (0 - ($859))|0;
    $863 = $862 & 7;
    $864 = $861 ? 0 : $863;
    $865 = (($$748$i) + ($864)|0);
    $866 = (($857) - ($864))|0;
    HEAP32[(8304)>>2] = $865;
    HEAP32[(8292)>>2] = $866;
    $867 = $866 | 1;
    $868 = ((($865)) + 4|0);
    HEAP32[$868>>2] = $867;
    $869 = (($865) + ($866)|0);
    $870 = ((($869)) + 4|0);
    HEAP32[$870>>2] = 40;
    $871 = HEAP32[(8768)>>2]|0;
    HEAP32[(8308)>>2] = $871;
    $872 = ((($854)) + 4|0);
    HEAP32[$872>>2] = 27;
    ;HEAP32[$855>>2]=HEAP32[(8728)>>2]|0;HEAP32[$855+4>>2]=HEAP32[(8728)+4>>2]|0;HEAP32[$855+8>>2]=HEAP32[(8728)+8>>2]|0;HEAP32[$855+12>>2]=HEAP32[(8728)+12>>2]|0;
    HEAP32[(8728)>>2] = $$748$i;
    HEAP32[(8732)>>2] = $$723947$i;
    HEAP32[(8740)>>2] = 0;
    HEAP32[(8736)>>2] = $855;
    $874 = $856;
    while(1) {
     $873 = ((($874)) + 4|0);
     HEAP32[$873>>2] = 7;
     $875 = ((($874)) + 8|0);
     $876 = ($875>>>0)<($839>>>0);
     if ($876) {
      $874 = $873;
     } else {
      break;
     }
    }
    $877 = ($854|0)==($581|0);
    if (!($877)) {
     $878 = $854;
     $879 = $581;
     $880 = (($878) - ($879))|0;
     $881 = HEAP32[$872>>2]|0;
     $882 = $881 & -2;
     HEAP32[$872>>2] = $882;
     $883 = $880 | 1;
     $884 = ((($581)) + 4|0);
     HEAP32[$884>>2] = $883;
     HEAP32[$854>>2] = $880;
     $885 = $880 >>> 3;
     $886 = ($880>>>0)<(256);
     if ($886) {
      $887 = $885 << 1;
      $888 = (8320 + ($887<<2)|0);
      $889 = HEAP32[2070]|0;
      $890 = 1 << $885;
      $891 = $889 & $890;
      $892 = ($891|0)==(0);
      if ($892) {
       $893 = $889 | $890;
       HEAP32[2070] = $893;
       $$pre$i$i = ((($888)) + 8|0);
       $$0206$i$i = $888;$$pre$phi$i$iZ2D = $$pre$i$i;
      } else {
       $894 = ((($888)) + 8|0);
       $895 = HEAP32[$894>>2]|0;
       $$0206$i$i = $895;$$pre$phi$i$iZ2D = $894;
      }
      HEAP32[$$pre$phi$i$iZ2D>>2] = $581;
      $896 = ((($$0206$i$i)) + 12|0);
      HEAP32[$896>>2] = $581;
      $897 = ((($581)) + 8|0);
      HEAP32[$897>>2] = $$0206$i$i;
      $898 = ((($581)) + 12|0);
      HEAP32[$898>>2] = $888;
      break;
     }
     $899 = $880 >>> 8;
     $900 = ($899|0)==(0);
     if ($900) {
      $$0207$i$i = 0;
     } else {
      $901 = ($880>>>0)>(16777215);
      if ($901) {
       $$0207$i$i = 31;
      } else {
       $902 = (($899) + 1048320)|0;
       $903 = $902 >>> 16;
       $904 = $903 & 8;
       $905 = $899 << $904;
       $906 = (($905) + 520192)|0;
       $907 = $906 >>> 16;
       $908 = $907 & 4;
       $909 = $908 | $904;
       $910 = $905 << $908;
       $911 = (($910) + 245760)|0;
       $912 = $911 >>> 16;
       $913 = $912 & 2;
       $914 = $909 | $913;
       $915 = (14 - ($914))|0;
       $916 = $910 << $913;
       $917 = $916 >>> 15;
       $918 = (($915) + ($917))|0;
       $919 = $918 << 1;
       $920 = (($918) + 7)|0;
       $921 = $880 >>> $920;
       $922 = $921 & 1;
       $923 = $922 | $919;
       $$0207$i$i = $923;
      }
     }
     $924 = (8584 + ($$0207$i$i<<2)|0);
     $925 = ((($581)) + 28|0);
     HEAP32[$925>>2] = $$0207$i$i;
     $926 = ((($581)) + 20|0);
     HEAP32[$926>>2] = 0;
     HEAP32[$852>>2] = 0;
     $927 = HEAP32[(8284)>>2]|0;
     $928 = 1 << $$0207$i$i;
     $929 = $927 & $928;
     $930 = ($929|0)==(0);
     if ($930) {
      $931 = $927 | $928;
      HEAP32[(8284)>>2] = $931;
      HEAP32[$924>>2] = $581;
      $932 = ((($581)) + 24|0);
      HEAP32[$932>>2] = $924;
      $933 = ((($581)) + 12|0);
      HEAP32[$933>>2] = $581;
      $934 = ((($581)) + 8|0);
      HEAP32[$934>>2] = $581;
      break;
     }
     $935 = HEAP32[$924>>2]|0;
     $936 = ($$0207$i$i|0)==(31);
     $937 = $$0207$i$i >>> 1;
     $938 = (25 - ($937))|0;
     $939 = $936 ? 0 : $938;
     $940 = $880 << $939;
     $$0201$i$i = $940;$$0202$i$i = $935;
     while(1) {
      $941 = ((($$0202$i$i)) + 4|0);
      $942 = HEAP32[$941>>2]|0;
      $943 = $942 & -8;
      $944 = ($943|0)==($880|0);
      if ($944) {
       label = 216;
       break;
      }
      $945 = $$0201$i$i >>> 31;
      $946 = (((($$0202$i$i)) + 16|0) + ($945<<2)|0);
      $947 = $$0201$i$i << 1;
      $948 = HEAP32[$946>>2]|0;
      $949 = ($948|0)==(0|0);
      if ($949) {
       label = 215;
       break;
      } else {
       $$0201$i$i = $947;$$0202$i$i = $948;
      }
     }
     if ((label|0) == 215) {
      HEAP32[$946>>2] = $581;
      $950 = ((($581)) + 24|0);
      HEAP32[$950>>2] = $$0202$i$i;
      $951 = ((($581)) + 12|0);
      HEAP32[$951>>2] = $581;
      $952 = ((($581)) + 8|0);
      HEAP32[$952>>2] = $581;
      break;
     }
     else if ((label|0) == 216) {
      $953 = ((($$0202$i$i)) + 8|0);
      $954 = HEAP32[$953>>2]|0;
      $955 = ((($954)) + 12|0);
      HEAP32[$955>>2] = $581;
      HEAP32[$953>>2] = $581;
      $956 = ((($581)) + 8|0);
      HEAP32[$956>>2] = $954;
      $957 = ((($581)) + 12|0);
      HEAP32[$957>>2] = $$0202$i$i;
      $958 = ((($581)) + 24|0);
      HEAP32[$958>>2] = 0;
      break;
     }
    }
   }
  } while(0);
  $960 = HEAP32[(8292)>>2]|0;
  $961 = ($960>>>0)>($$0192>>>0);
  if ($961) {
   $962 = (($960) - ($$0192))|0;
   HEAP32[(8292)>>2] = $962;
   $963 = HEAP32[(8304)>>2]|0;
   $964 = (($963) + ($$0192)|0);
   HEAP32[(8304)>>2] = $964;
   $965 = $962 | 1;
   $966 = ((($964)) + 4|0);
   HEAP32[$966>>2] = $965;
   $967 = $$0192 | 3;
   $968 = ((($963)) + 4|0);
   HEAP32[$968>>2] = $967;
   $969 = ((($963)) + 8|0);
   $$0 = $969;
   STACKTOP = sp;return ($$0|0);
  }
 }
 $970 = (___errno_location()|0);
 HEAP32[$970>>2] = 12;
 $$0 = 0;
 STACKTOP = sp;return ($$0|0);
}
function _free($0) {
 $0 = $0|0;
 var $$0195$i = 0, $$0195$in$i = 0, $$0348 = 0, $$0349 = 0, $$0361 = 0, $$0368 = 0, $$1 = 0, $$1347 = 0, $$1352 = 0, $$1355 = 0, $$1363 = 0, $$1367 = 0, $$2 = 0, $$3 = 0, $$3365 = 0, $$pre = 0, $$pre$phiZ2D = 0, $$sink3 = 0, $$sink5 = 0, $1 = 0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0;
 var $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0;
 var $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $cond374 = 0, $cond375 = 0, $not$ = 0, $not$370 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0|0)==(0|0);
 if ($1) {
  return;
 }
 $2 = ((($0)) + -8|0);
 $3 = HEAP32[(8296)>>2]|0;
 $4 = ((($0)) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & -8;
 $7 = (($2) + ($6)|0);
 $8 = $5 & 1;
 $9 = ($8|0)==(0);
 do {
  if ($9) {
   $10 = HEAP32[$2>>2]|0;
   $11 = $5 & 3;
   $12 = ($11|0)==(0);
   if ($12) {
    return;
   }
   $13 = (0 - ($10))|0;
   $14 = (($2) + ($13)|0);
   $15 = (($10) + ($6))|0;
   $16 = ($14>>>0)<($3>>>0);
   if ($16) {
    return;
   }
   $17 = HEAP32[(8300)>>2]|0;
   $18 = ($14|0)==($17|0);
   if ($18) {
    $78 = ((($7)) + 4|0);
    $79 = HEAP32[$78>>2]|0;
    $80 = $79 & 3;
    $81 = ($80|0)==(3);
    if (!($81)) {
     $$1 = $14;$$1347 = $15;$86 = $14;
     break;
    }
    $82 = (($14) + ($15)|0);
    $83 = ((($14)) + 4|0);
    $84 = $15 | 1;
    $85 = $79 & -2;
    HEAP32[(8288)>>2] = $15;
    HEAP32[$78>>2] = $85;
    HEAP32[$83>>2] = $84;
    HEAP32[$82>>2] = $15;
    return;
   }
   $19 = $10 >>> 3;
   $20 = ($10>>>0)<(256);
   if ($20) {
    $21 = ((($14)) + 8|0);
    $22 = HEAP32[$21>>2]|0;
    $23 = ((($14)) + 12|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = ($24|0)==($22|0);
    if ($25) {
     $26 = 1 << $19;
     $27 = $26 ^ -1;
     $28 = HEAP32[2070]|0;
     $29 = $28 & $27;
     HEAP32[2070] = $29;
     $$1 = $14;$$1347 = $15;$86 = $14;
     break;
    } else {
     $30 = ((($22)) + 12|0);
     HEAP32[$30>>2] = $24;
     $31 = ((($24)) + 8|0);
     HEAP32[$31>>2] = $22;
     $$1 = $14;$$1347 = $15;$86 = $14;
     break;
    }
   }
   $32 = ((($14)) + 24|0);
   $33 = HEAP32[$32>>2]|0;
   $34 = ((($14)) + 12|0);
   $35 = HEAP32[$34>>2]|0;
   $36 = ($35|0)==($14|0);
   do {
    if ($36) {
     $41 = ((($14)) + 16|0);
     $42 = ((($41)) + 4|0);
     $43 = HEAP32[$42>>2]|0;
     $44 = ($43|0)==(0|0);
     if ($44) {
      $45 = HEAP32[$41>>2]|0;
      $46 = ($45|0)==(0|0);
      if ($46) {
       $$3 = 0;
       break;
      } else {
       $$1352 = $45;$$1355 = $41;
      }
     } else {
      $$1352 = $43;$$1355 = $42;
     }
     while(1) {
      $47 = ((($$1352)) + 20|0);
      $48 = HEAP32[$47>>2]|0;
      $49 = ($48|0)==(0|0);
      if (!($49)) {
       $$1352 = $48;$$1355 = $47;
       continue;
      }
      $50 = ((($$1352)) + 16|0);
      $51 = HEAP32[$50>>2]|0;
      $52 = ($51|0)==(0|0);
      if ($52) {
       break;
      } else {
       $$1352 = $51;$$1355 = $50;
      }
     }
     HEAP32[$$1355>>2] = 0;
     $$3 = $$1352;
    } else {
     $37 = ((($14)) + 8|0);
     $38 = HEAP32[$37>>2]|0;
     $39 = ((($38)) + 12|0);
     HEAP32[$39>>2] = $35;
     $40 = ((($35)) + 8|0);
     HEAP32[$40>>2] = $38;
     $$3 = $35;
    }
   } while(0);
   $53 = ($33|0)==(0|0);
   if ($53) {
    $$1 = $14;$$1347 = $15;$86 = $14;
   } else {
    $54 = ((($14)) + 28|0);
    $55 = HEAP32[$54>>2]|0;
    $56 = (8584 + ($55<<2)|0);
    $57 = HEAP32[$56>>2]|0;
    $58 = ($14|0)==($57|0);
    if ($58) {
     HEAP32[$56>>2] = $$3;
     $cond374 = ($$3|0)==(0|0);
     if ($cond374) {
      $59 = 1 << $55;
      $60 = $59 ^ -1;
      $61 = HEAP32[(8284)>>2]|0;
      $62 = $61 & $60;
      HEAP32[(8284)>>2] = $62;
      $$1 = $14;$$1347 = $15;$86 = $14;
      break;
     }
    } else {
     $63 = ((($33)) + 16|0);
     $64 = HEAP32[$63>>2]|0;
     $not$370 = ($64|0)!=($14|0);
     $$sink3 = $not$370&1;
     $65 = (((($33)) + 16|0) + ($$sink3<<2)|0);
     HEAP32[$65>>2] = $$3;
     $66 = ($$3|0)==(0|0);
     if ($66) {
      $$1 = $14;$$1347 = $15;$86 = $14;
      break;
     }
    }
    $67 = ((($$3)) + 24|0);
    HEAP32[$67>>2] = $33;
    $68 = ((($14)) + 16|0);
    $69 = HEAP32[$68>>2]|0;
    $70 = ($69|0)==(0|0);
    if (!($70)) {
     $71 = ((($$3)) + 16|0);
     HEAP32[$71>>2] = $69;
     $72 = ((($69)) + 24|0);
     HEAP32[$72>>2] = $$3;
    }
    $73 = ((($68)) + 4|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = ($74|0)==(0|0);
    if ($75) {
     $$1 = $14;$$1347 = $15;$86 = $14;
    } else {
     $76 = ((($$3)) + 20|0);
     HEAP32[$76>>2] = $74;
     $77 = ((($74)) + 24|0);
     HEAP32[$77>>2] = $$3;
     $$1 = $14;$$1347 = $15;$86 = $14;
    }
   }
  } else {
   $$1 = $2;$$1347 = $6;$86 = $2;
  }
 } while(0);
 $87 = ($86>>>0)<($7>>>0);
 if (!($87)) {
  return;
 }
 $88 = ((($7)) + 4|0);
 $89 = HEAP32[$88>>2]|0;
 $90 = $89 & 1;
 $91 = ($90|0)==(0);
 if ($91) {
  return;
 }
 $92 = $89 & 2;
 $93 = ($92|0)==(0);
 if ($93) {
  $94 = HEAP32[(8304)>>2]|0;
  $95 = ($7|0)==($94|0);
  $96 = HEAP32[(8300)>>2]|0;
  if ($95) {
   $97 = HEAP32[(8292)>>2]|0;
   $98 = (($97) + ($$1347))|0;
   HEAP32[(8292)>>2] = $98;
   HEAP32[(8304)>>2] = $$1;
   $99 = $98 | 1;
   $100 = ((($$1)) + 4|0);
   HEAP32[$100>>2] = $99;
   $101 = ($$1|0)==($96|0);
   if (!($101)) {
    return;
   }
   HEAP32[(8300)>>2] = 0;
   HEAP32[(8288)>>2] = 0;
   return;
  }
  $102 = ($7|0)==($96|0);
  if ($102) {
   $103 = HEAP32[(8288)>>2]|0;
   $104 = (($103) + ($$1347))|0;
   HEAP32[(8288)>>2] = $104;
   HEAP32[(8300)>>2] = $86;
   $105 = $104 | 1;
   $106 = ((($$1)) + 4|0);
   HEAP32[$106>>2] = $105;
   $107 = (($86) + ($104)|0);
   HEAP32[$107>>2] = $104;
   return;
  }
  $108 = $89 & -8;
  $109 = (($108) + ($$1347))|0;
  $110 = $89 >>> 3;
  $111 = ($89>>>0)<(256);
  do {
   if ($111) {
    $112 = ((($7)) + 8|0);
    $113 = HEAP32[$112>>2]|0;
    $114 = ((($7)) + 12|0);
    $115 = HEAP32[$114>>2]|0;
    $116 = ($115|0)==($113|0);
    if ($116) {
     $117 = 1 << $110;
     $118 = $117 ^ -1;
     $119 = HEAP32[2070]|0;
     $120 = $119 & $118;
     HEAP32[2070] = $120;
     break;
    } else {
     $121 = ((($113)) + 12|0);
     HEAP32[$121>>2] = $115;
     $122 = ((($115)) + 8|0);
     HEAP32[$122>>2] = $113;
     break;
    }
   } else {
    $123 = ((($7)) + 24|0);
    $124 = HEAP32[$123>>2]|0;
    $125 = ((($7)) + 12|0);
    $126 = HEAP32[$125>>2]|0;
    $127 = ($126|0)==($7|0);
    do {
     if ($127) {
      $132 = ((($7)) + 16|0);
      $133 = ((($132)) + 4|0);
      $134 = HEAP32[$133>>2]|0;
      $135 = ($134|0)==(0|0);
      if ($135) {
       $136 = HEAP32[$132>>2]|0;
       $137 = ($136|0)==(0|0);
       if ($137) {
        $$3365 = 0;
        break;
       } else {
        $$1363 = $136;$$1367 = $132;
       }
      } else {
       $$1363 = $134;$$1367 = $133;
      }
      while(1) {
       $138 = ((($$1363)) + 20|0);
       $139 = HEAP32[$138>>2]|0;
       $140 = ($139|0)==(0|0);
       if (!($140)) {
        $$1363 = $139;$$1367 = $138;
        continue;
       }
       $141 = ((($$1363)) + 16|0);
       $142 = HEAP32[$141>>2]|0;
       $143 = ($142|0)==(0|0);
       if ($143) {
        break;
       } else {
        $$1363 = $142;$$1367 = $141;
       }
      }
      HEAP32[$$1367>>2] = 0;
      $$3365 = $$1363;
     } else {
      $128 = ((($7)) + 8|0);
      $129 = HEAP32[$128>>2]|0;
      $130 = ((($129)) + 12|0);
      HEAP32[$130>>2] = $126;
      $131 = ((($126)) + 8|0);
      HEAP32[$131>>2] = $129;
      $$3365 = $126;
     }
    } while(0);
    $144 = ($124|0)==(0|0);
    if (!($144)) {
     $145 = ((($7)) + 28|0);
     $146 = HEAP32[$145>>2]|0;
     $147 = (8584 + ($146<<2)|0);
     $148 = HEAP32[$147>>2]|0;
     $149 = ($7|0)==($148|0);
     if ($149) {
      HEAP32[$147>>2] = $$3365;
      $cond375 = ($$3365|0)==(0|0);
      if ($cond375) {
       $150 = 1 << $146;
       $151 = $150 ^ -1;
       $152 = HEAP32[(8284)>>2]|0;
       $153 = $152 & $151;
       HEAP32[(8284)>>2] = $153;
       break;
      }
     } else {
      $154 = ((($124)) + 16|0);
      $155 = HEAP32[$154>>2]|0;
      $not$ = ($155|0)!=($7|0);
      $$sink5 = $not$&1;
      $156 = (((($124)) + 16|0) + ($$sink5<<2)|0);
      HEAP32[$156>>2] = $$3365;
      $157 = ($$3365|0)==(0|0);
      if ($157) {
       break;
      }
     }
     $158 = ((($$3365)) + 24|0);
     HEAP32[$158>>2] = $124;
     $159 = ((($7)) + 16|0);
     $160 = HEAP32[$159>>2]|0;
     $161 = ($160|0)==(0|0);
     if (!($161)) {
      $162 = ((($$3365)) + 16|0);
      HEAP32[$162>>2] = $160;
      $163 = ((($160)) + 24|0);
      HEAP32[$163>>2] = $$3365;
     }
     $164 = ((($159)) + 4|0);
     $165 = HEAP32[$164>>2]|0;
     $166 = ($165|0)==(0|0);
     if (!($166)) {
      $167 = ((($$3365)) + 20|0);
      HEAP32[$167>>2] = $165;
      $168 = ((($165)) + 24|0);
      HEAP32[$168>>2] = $$3365;
     }
    }
   }
  } while(0);
  $169 = $109 | 1;
  $170 = ((($$1)) + 4|0);
  HEAP32[$170>>2] = $169;
  $171 = (($86) + ($109)|0);
  HEAP32[$171>>2] = $109;
  $172 = HEAP32[(8300)>>2]|0;
  $173 = ($$1|0)==($172|0);
  if ($173) {
   HEAP32[(8288)>>2] = $109;
   return;
  } else {
   $$2 = $109;
  }
 } else {
  $174 = $89 & -2;
  HEAP32[$88>>2] = $174;
  $175 = $$1347 | 1;
  $176 = ((($$1)) + 4|0);
  HEAP32[$176>>2] = $175;
  $177 = (($86) + ($$1347)|0);
  HEAP32[$177>>2] = $$1347;
  $$2 = $$1347;
 }
 $178 = $$2 >>> 3;
 $179 = ($$2>>>0)<(256);
 if ($179) {
  $180 = $178 << 1;
  $181 = (8320 + ($180<<2)|0);
  $182 = HEAP32[2070]|0;
  $183 = 1 << $178;
  $184 = $182 & $183;
  $185 = ($184|0)==(0);
  if ($185) {
   $186 = $182 | $183;
   HEAP32[2070] = $186;
   $$pre = ((($181)) + 8|0);
   $$0368 = $181;$$pre$phiZ2D = $$pre;
  } else {
   $187 = ((($181)) + 8|0);
   $188 = HEAP32[$187>>2]|0;
   $$0368 = $188;$$pre$phiZ2D = $187;
  }
  HEAP32[$$pre$phiZ2D>>2] = $$1;
  $189 = ((($$0368)) + 12|0);
  HEAP32[$189>>2] = $$1;
  $190 = ((($$1)) + 8|0);
  HEAP32[$190>>2] = $$0368;
  $191 = ((($$1)) + 12|0);
  HEAP32[$191>>2] = $181;
  return;
 }
 $192 = $$2 >>> 8;
 $193 = ($192|0)==(0);
 if ($193) {
  $$0361 = 0;
 } else {
  $194 = ($$2>>>0)>(16777215);
  if ($194) {
   $$0361 = 31;
  } else {
   $195 = (($192) + 1048320)|0;
   $196 = $195 >>> 16;
   $197 = $196 & 8;
   $198 = $192 << $197;
   $199 = (($198) + 520192)|0;
   $200 = $199 >>> 16;
   $201 = $200 & 4;
   $202 = $201 | $197;
   $203 = $198 << $201;
   $204 = (($203) + 245760)|0;
   $205 = $204 >>> 16;
   $206 = $205 & 2;
   $207 = $202 | $206;
   $208 = (14 - ($207))|0;
   $209 = $203 << $206;
   $210 = $209 >>> 15;
   $211 = (($208) + ($210))|0;
   $212 = $211 << 1;
   $213 = (($211) + 7)|0;
   $214 = $$2 >>> $213;
   $215 = $214 & 1;
   $216 = $215 | $212;
   $$0361 = $216;
  }
 }
 $217 = (8584 + ($$0361<<2)|0);
 $218 = ((($$1)) + 28|0);
 HEAP32[$218>>2] = $$0361;
 $219 = ((($$1)) + 16|0);
 $220 = ((($$1)) + 20|0);
 HEAP32[$220>>2] = 0;
 HEAP32[$219>>2] = 0;
 $221 = HEAP32[(8284)>>2]|0;
 $222 = 1 << $$0361;
 $223 = $221 & $222;
 $224 = ($223|0)==(0);
 do {
  if ($224) {
   $225 = $221 | $222;
   HEAP32[(8284)>>2] = $225;
   HEAP32[$217>>2] = $$1;
   $226 = ((($$1)) + 24|0);
   HEAP32[$226>>2] = $217;
   $227 = ((($$1)) + 12|0);
   HEAP32[$227>>2] = $$1;
   $228 = ((($$1)) + 8|0);
   HEAP32[$228>>2] = $$1;
  } else {
   $229 = HEAP32[$217>>2]|0;
   $230 = ($$0361|0)==(31);
   $231 = $$0361 >>> 1;
   $232 = (25 - ($231))|0;
   $233 = $230 ? 0 : $232;
   $234 = $$2 << $233;
   $$0348 = $234;$$0349 = $229;
   while(1) {
    $235 = ((($$0349)) + 4|0);
    $236 = HEAP32[$235>>2]|0;
    $237 = $236 & -8;
    $238 = ($237|0)==($$2|0);
    if ($238) {
     label = 73;
     break;
    }
    $239 = $$0348 >>> 31;
    $240 = (((($$0349)) + 16|0) + ($239<<2)|0);
    $241 = $$0348 << 1;
    $242 = HEAP32[$240>>2]|0;
    $243 = ($242|0)==(0|0);
    if ($243) {
     label = 72;
     break;
    } else {
     $$0348 = $241;$$0349 = $242;
    }
   }
   if ((label|0) == 72) {
    HEAP32[$240>>2] = $$1;
    $244 = ((($$1)) + 24|0);
    HEAP32[$244>>2] = $$0349;
    $245 = ((($$1)) + 12|0);
    HEAP32[$245>>2] = $$1;
    $246 = ((($$1)) + 8|0);
    HEAP32[$246>>2] = $$1;
    break;
   }
   else if ((label|0) == 73) {
    $247 = ((($$0349)) + 8|0);
    $248 = HEAP32[$247>>2]|0;
    $249 = ((($248)) + 12|0);
    HEAP32[$249>>2] = $$1;
    HEAP32[$247>>2] = $$1;
    $250 = ((($$1)) + 8|0);
    HEAP32[$250>>2] = $248;
    $251 = ((($$1)) + 12|0);
    HEAP32[$251>>2] = $$0349;
    $252 = ((($$1)) + 24|0);
    HEAP32[$252>>2] = 0;
    break;
   }
  }
 } while(0);
 $253 = HEAP32[(8312)>>2]|0;
 $254 = (($253) + -1)|0;
 HEAP32[(8312)>>2] = $254;
 $255 = ($254|0)==(0);
 if ($255) {
  $$0195$in$i = (8736);
 } else {
  return;
 }
 while(1) {
  $$0195$i = HEAP32[$$0195$in$i>>2]|0;
  $256 = ($$0195$i|0)==(0|0);
  $257 = ((($$0195$i)) + 8|0);
  if ($256) {
   break;
  } else {
   $$0195$in$i = $257;
  }
 }
 HEAP32[(8312)>>2] = -1;
 return;
}
function ___stdio_close($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer = sp;
 $1 = ((($0)) + 60|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = (_dummy($2)|0);
 HEAP32[$vararg_buffer>>2] = $3;
 $4 = (___syscall6(6,($vararg_buffer|0))|0);
 $5 = (___syscall_ret($4)|0);
 STACKTOP = sp;return ($5|0);
}
function ___stdout_write($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $vararg_buffer = sp;
 $3 = sp + 16|0;
 $4 = ((($0)) + 36|0);
 HEAP32[$4>>2] = 4;
 $5 = HEAP32[$0>>2]|0;
 $6 = $5 & 64;
 $7 = ($6|0)==(0);
 if ($7) {
  $8 = ((($0)) + 60|0);
  $9 = HEAP32[$8>>2]|0;
  $10 = $3;
  HEAP32[$vararg_buffer>>2] = $9;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = 21523;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = $10;
  $11 = (___syscall54(54,($vararg_buffer|0))|0);
  $12 = ($11|0)==(0);
  if (!($12)) {
   $13 = ((($0)) + 75|0);
   HEAP8[$13>>0] = -1;
  }
 }
 $14 = (___stdio_write($0,$1,$2)|0);
 STACKTOP = sp;return ($14|0);
}
function ___stdio_seek($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$pre = 0, $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr3 = 0, $vararg_ptr4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $vararg_buffer = sp;
 $3 = sp + 20|0;
 $4 = ((($0)) + 60|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $3;
 HEAP32[$vararg_buffer>>2] = $5;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = 0;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $1;
 $vararg_ptr3 = ((($vararg_buffer)) + 12|0);
 HEAP32[$vararg_ptr3>>2] = $6;
 $vararg_ptr4 = ((($vararg_buffer)) + 16|0);
 HEAP32[$vararg_ptr4>>2] = $2;
 $7 = (___syscall140(140,($vararg_buffer|0))|0);
 $8 = (___syscall_ret($7)|0);
 $9 = ($8|0)<(0);
 if ($9) {
  HEAP32[$3>>2] = -1;
  $10 = -1;
 } else {
  $$pre = HEAP32[$3>>2]|0;
  $10 = $$pre;
 }
 STACKTOP = sp;return ($10|0);
}
function ___syscall_ret($0) {
 $0 = $0|0;
 var $$0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0>>>0)>(4294963200);
 if ($1) {
  $2 = (0 - ($0))|0;
  $3 = (___errno_location()|0);
  HEAP32[$3>>2] = $2;
  $$0 = -1;
 } else {
  $$0 = $0;
 }
 return ($$0|0);
}
function ___errno_location() {
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (___pthread_self_615()|0);
 $1 = ((($0)) + 64|0);
 return ($1|0);
}
function ___pthread_self_615() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_pthread_self()|0);
 return ($0|0);
}
function _pthread_self() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (1000|0);
}
function ___stdio_write($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $$04756 = 0, $$04855 = 0, $$04954 = 0, $$051 = 0, $$1 = 0, $$150 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0;
 var $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(48|0);
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $3 = sp + 32|0;
 $4 = ((($0)) + 28|0);
 $5 = HEAP32[$4>>2]|0;
 HEAP32[$3>>2] = $5;
 $6 = ((($3)) + 4|0);
 $7 = ((($0)) + 20|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = (($8) - ($5))|0;
 HEAP32[$6>>2] = $9;
 $10 = ((($3)) + 8|0);
 HEAP32[$10>>2] = $1;
 $11 = ((($3)) + 12|0);
 HEAP32[$11>>2] = $2;
 $12 = (($9) + ($2))|0;
 $13 = ((($0)) + 60|0);
 $14 = HEAP32[$13>>2]|0;
 $15 = $3;
 HEAP32[$vararg_buffer>>2] = $14;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $15;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = 2;
 $16 = (___syscall146(146,($vararg_buffer|0))|0);
 $17 = (___syscall_ret($16)|0);
 $18 = ($12|0)==($17|0);
 L1: do {
  if ($18) {
   label = 3;
  } else {
   $$04756 = 2;$$04855 = $12;$$04954 = $3;$25 = $17;
   while(1) {
    $26 = ($25|0)<(0);
    if ($26) {
     break;
    }
    $34 = (($$04855) - ($25))|0;
    $35 = ((($$04954)) + 4|0);
    $36 = HEAP32[$35>>2]|0;
    $37 = ($25>>>0)>($36>>>0);
    $38 = ((($$04954)) + 8|0);
    $$150 = $37 ? $38 : $$04954;
    $39 = $37 << 31 >> 31;
    $$1 = (($39) + ($$04756))|0;
    $40 = $37 ? $36 : 0;
    $$0 = (($25) - ($40))|0;
    $41 = HEAP32[$$150>>2]|0;
    $42 = (($41) + ($$0)|0);
    HEAP32[$$150>>2] = $42;
    $43 = ((($$150)) + 4|0);
    $44 = HEAP32[$43>>2]|0;
    $45 = (($44) - ($$0))|0;
    HEAP32[$43>>2] = $45;
    $46 = HEAP32[$13>>2]|0;
    $47 = $$150;
    HEAP32[$vararg_buffer3>>2] = $46;
    $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
    HEAP32[$vararg_ptr6>>2] = $47;
    $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
    HEAP32[$vararg_ptr7>>2] = $$1;
    $48 = (___syscall146(146,($vararg_buffer3|0))|0);
    $49 = (___syscall_ret($48)|0);
    $50 = ($34|0)==($49|0);
    if ($50) {
     label = 3;
     break L1;
    } else {
     $$04756 = $$1;$$04855 = $34;$$04954 = $$150;$25 = $49;
    }
   }
   $27 = ((($0)) + 16|0);
   HEAP32[$27>>2] = 0;
   HEAP32[$4>>2] = 0;
   HEAP32[$7>>2] = 0;
   $28 = HEAP32[$0>>2]|0;
   $29 = $28 | 32;
   HEAP32[$0>>2] = $29;
   $30 = ($$04756|0)==(2);
   if ($30) {
    $$051 = 0;
   } else {
    $31 = ((($$04954)) + 4|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = (($2) - ($32))|0;
    $$051 = $33;
   }
  }
 } while(0);
 if ((label|0) == 3) {
  $19 = ((($0)) + 44|0);
  $20 = HEAP32[$19>>2]|0;
  $21 = ((($0)) + 48|0);
  $22 = HEAP32[$21>>2]|0;
  $23 = (($20) + ($22)|0);
  $24 = ((($0)) + 16|0);
  HEAP32[$24>>2] = $23;
  HEAP32[$4>>2] = $20;
  HEAP32[$7>>2] = $20;
  $$051 = $2;
 }
 STACKTOP = sp;return ($$051|0);
}
function _dummy($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return ($0|0);
}
function _emscripten_get_global_libc() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (8776|0);
}
function ___fwritex($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$038 = 0, $$042 = 0, $$1 = 0, $$139 = 0, $$141 = 0, $$143 = 0, $$pre = 0, $$pre47 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ((($2)) + 16|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = ($4|0)==(0|0);
 if ($5) {
  $7 = (___towrite($2)|0);
  $8 = ($7|0)==(0);
  if ($8) {
   $$pre = HEAP32[$3>>2]|0;
   $12 = $$pre;
   label = 5;
  } else {
   $$1 = 0;
  }
 } else {
  $6 = $4;
  $12 = $6;
  label = 5;
 }
 L5: do {
  if ((label|0) == 5) {
   $9 = ((($2)) + 20|0);
   $10 = HEAP32[$9>>2]|0;
   $11 = (($12) - ($10))|0;
   $13 = ($11>>>0)<($1>>>0);
   $14 = $10;
   if ($13) {
    $15 = ((($2)) + 36|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = (FUNCTION_TABLE_iiii[$16 & 127]($2,$0,$1)|0);
    $$1 = $17;
    break;
   }
   $18 = ((($2)) + 75|0);
   $19 = HEAP8[$18>>0]|0;
   $20 = ($19<<24>>24)>(-1);
   L10: do {
    if ($20) {
     $$038 = $1;
     while(1) {
      $21 = ($$038|0)==(0);
      if ($21) {
       $$139 = 0;$$141 = $0;$$143 = $1;$31 = $14;
       break L10;
      }
      $22 = (($$038) + -1)|0;
      $23 = (($0) + ($22)|0);
      $24 = HEAP8[$23>>0]|0;
      $25 = ($24<<24>>24)==(10);
      if ($25) {
       break;
      } else {
       $$038 = $22;
      }
     }
     $26 = ((($2)) + 36|0);
     $27 = HEAP32[$26>>2]|0;
     $28 = (FUNCTION_TABLE_iiii[$27 & 127]($2,$0,$$038)|0);
     $29 = ($28>>>0)<($$038>>>0);
     if ($29) {
      $$1 = $28;
      break L5;
     }
     $30 = (($0) + ($$038)|0);
     $$042 = (($1) - ($$038))|0;
     $$pre47 = HEAP32[$9>>2]|0;
     $$139 = $$038;$$141 = $30;$$143 = $$042;$31 = $$pre47;
    } else {
     $$139 = 0;$$141 = $0;$$143 = $1;$31 = $14;
    }
   } while(0);
   _memcpy(($31|0),($$141|0),($$143|0))|0;
   $32 = HEAP32[$9>>2]|0;
   $33 = (($32) + ($$143)|0);
   HEAP32[$9>>2] = $33;
   $34 = (($$139) + ($$143))|0;
   $$1 = $34;
  }
 } while(0);
 return ($$1|0);
}
function ___towrite($0) {
 $0 = $0|0;
 var $$0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 74|0);
 $2 = HEAP8[$1>>0]|0;
 $3 = $2 << 24 >> 24;
 $4 = (($3) + 255)|0;
 $5 = $4 | $3;
 $6 = $5&255;
 HEAP8[$1>>0] = $6;
 $7 = HEAP32[$0>>2]|0;
 $8 = $7 & 8;
 $9 = ($8|0)==(0);
 if ($9) {
  $11 = ((($0)) + 8|0);
  HEAP32[$11>>2] = 0;
  $12 = ((($0)) + 4|0);
  HEAP32[$12>>2] = 0;
  $13 = ((($0)) + 44|0);
  $14 = HEAP32[$13>>2]|0;
  $15 = ((($0)) + 28|0);
  HEAP32[$15>>2] = $14;
  $16 = ((($0)) + 20|0);
  HEAP32[$16>>2] = $14;
  $17 = ((($0)) + 48|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = (($14) + ($18)|0);
  $20 = ((($0)) + 16|0);
  HEAP32[$20>>2] = $19;
  $$0 = 0;
 } else {
  $10 = $7 | 32;
  HEAP32[$0>>2] = $10;
  $$0 = -1;
 }
 return ($$0|0);
}
function ___lockfile($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function ___unlockfile($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function _wctomb($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$0 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($0|0)==(0|0);
 if ($2) {
  $$0 = 0;
 } else {
  $3 = (_wcrtomb($0,$1,0)|0);
  $$0 = $3;
 }
 return ($$0|0);
}
function _vfprintf($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$ = 0, $$0 = 0, $$1 = 0, $$1$ = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $vacopy_currentptr = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(224|0);
 $3 = sp + 120|0;
 $4 = sp + 80|0;
 $5 = sp;
 $6 = sp + 136|0;
 dest=$4; stop=dest+40|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
 $vacopy_currentptr = HEAP32[$2>>2]|0;
 HEAP32[$3>>2] = $vacopy_currentptr;
 $7 = (_printf_core(0,$1,$3,$5,$4)|0);
 $8 = ($7|0)<(0);
 if ($8) {
  $$0 = -1;
 } else {
  $9 = ((($0)) + 76|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = ($10|0)>(-1);
  if ($11) {
   $12 = (___lockfile($0)|0);
   $39 = $12;
  } else {
   $39 = 0;
  }
  $13 = HEAP32[$0>>2]|0;
  $14 = $13 & 32;
  $15 = ((($0)) + 74|0);
  $16 = HEAP8[$15>>0]|0;
  $17 = ($16<<24>>24)<(1);
  if ($17) {
   $18 = $13 & -33;
   HEAP32[$0>>2] = $18;
  }
  $19 = ((($0)) + 48|0);
  $20 = HEAP32[$19>>2]|0;
  $21 = ($20|0)==(0);
  if ($21) {
   $23 = ((($0)) + 44|0);
   $24 = HEAP32[$23>>2]|0;
   HEAP32[$23>>2] = $6;
   $25 = ((($0)) + 28|0);
   HEAP32[$25>>2] = $6;
   $26 = ((($0)) + 20|0);
   HEAP32[$26>>2] = $6;
   HEAP32[$19>>2] = 80;
   $27 = ((($6)) + 80|0);
   $28 = ((($0)) + 16|0);
   HEAP32[$28>>2] = $27;
   $29 = (_printf_core($0,$1,$3,$5,$4)|0);
   $30 = ($24|0)==(0|0);
   if ($30) {
    $$1 = $29;
   } else {
    $31 = ((($0)) + 36|0);
    $32 = HEAP32[$31>>2]|0;
    (FUNCTION_TABLE_iiii[$32 & 127]($0,0,0)|0);
    $33 = HEAP32[$26>>2]|0;
    $34 = ($33|0)==(0|0);
    $$ = $34 ? -1 : $29;
    HEAP32[$23>>2] = $24;
    HEAP32[$19>>2] = 0;
    HEAP32[$28>>2] = 0;
    HEAP32[$25>>2] = 0;
    HEAP32[$26>>2] = 0;
    $$1 = $$;
   }
  } else {
   $22 = (_printf_core($0,$1,$3,$5,$4)|0);
   $$1 = $22;
  }
  $35 = HEAP32[$0>>2]|0;
  $36 = $35 & 32;
  $37 = ($36|0)==(0);
  $$1$ = $37 ? $$1 : -1;
  $38 = $35 | $14;
  HEAP32[$0>>2] = $38;
  $40 = ($39|0)==(0);
  if (!($40)) {
   ___unlockfile($0);
  }
  $$0 = $$1$;
 }
 STACKTOP = sp;return ($$0|0);
}
function _printf_core($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$ = 0, $$$ = 0, $$$0259 = 0, $$$0262 = 0, $$$0269 = 0, $$$4266 = 0, $$$5 = 0, $$0 = 0, $$0228 = 0, $$0228$ = 0, $$0229322 = 0, $$0232 = 0, $$0235 = 0, $$0237 = 0, $$0240$lcssa = 0, $$0240$lcssa357 = 0, $$0240321 = 0, $$0243 = 0, $$0247 = 0, $$0249$lcssa = 0;
 var $$0249306 = 0, $$0252 = 0, $$0253 = 0, $$0254 = 0, $$0254$$0254$ = 0, $$0259 = 0, $$0262$lcssa = 0, $$0262311 = 0, $$0269 = 0, $$0269$phi = 0, $$1 = 0, $$1230333 = 0, $$1233 = 0, $$1236 = 0, $$1238 = 0, $$1241332 = 0, $$1244320 = 0, $$1248 = 0, $$1250 = 0, $$1255 = 0;
 var $$1260 = 0, $$1263 = 0, $$1263$ = 0, $$1270 = 0, $$2 = 0, $$2234 = 0, $$2239 = 0, $$2242305 = 0, $$2245 = 0, $$2251 = 0, $$2256 = 0, $$2256$ = 0, $$2256$$$2256 = 0, $$2261 = 0, $$2271 = 0, $$284$ = 0, $$289 = 0, $$290 = 0, $$3257 = 0, $$3265 = 0;
 var $$3272 = 0, $$3303 = 0, $$377 = 0, $$4258355 = 0, $$4266 = 0, $$5 = 0, $$6268 = 0, $$lcssa295 = 0, $$pre = 0, $$pre346 = 0, $$pre347 = 0, $$pre347$pre = 0, $$pre349 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0;
 var $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0;
 var $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0;
 var $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0;
 var $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0;
 var $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0;
 var $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0;
 var $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0;
 var $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0;
 var $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0;
 var $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0;
 var $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0;
 var $306 = 0.0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0;
 var $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0;
 var $arglist_current = 0, $arglist_current2 = 0, $arglist_next = 0, $arglist_next3 = 0, $expanded = 0, $expanded10 = 0, $expanded11 = 0, $expanded13 = 0, $expanded14 = 0, $expanded15 = 0, $expanded4 = 0, $expanded6 = 0, $expanded7 = 0, $expanded8 = 0, $isdigit = 0, $isdigit275 = 0, $isdigit277 = 0, $isdigittmp = 0, $isdigittmp$ = 0, $isdigittmp274 = 0;
 var $isdigittmp276 = 0, $narrow = 0, $or$cond = 0, $or$cond281 = 0, $or$cond283 = 0, $or$cond286 = 0, $storemerge = 0, $storemerge273310 = 0, $storemerge278 = 0, $trunc = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $5 = sp + 16|0;
 $6 = sp;
 $7 = sp + 24|0;
 $8 = sp + 8|0;
 $9 = sp + 20|0;
 HEAP32[$5>>2] = $1;
 $10 = ($0|0)!=(0|0);
 $11 = ((($7)) + 40|0);
 $12 = $11;
 $13 = ((($7)) + 39|0);
 $14 = ((($8)) + 4|0);
 $$0243 = 0;$$0247 = 0;$$0269 = 0;$21 = $1;
 L1: while(1) {
  $15 = ($$0247|0)>(-1);
  do {
   if ($15) {
    $16 = (2147483647 - ($$0247))|0;
    $17 = ($$0243|0)>($16|0);
    if ($17) {
     $18 = (___errno_location()|0);
     HEAP32[$18>>2] = 75;
     $$1248 = -1;
     break;
    } else {
     $19 = (($$0243) + ($$0247))|0;
     $$1248 = $19;
     break;
    }
   } else {
    $$1248 = $$0247;
   }
  } while(0);
  $20 = HEAP8[$21>>0]|0;
  $22 = ($20<<24>>24)==(0);
  if ($22) {
   label = 87;
   break;
  } else {
   $23 = $20;$25 = $21;
  }
  L9: while(1) {
   switch ($23<<24>>24) {
   case 37:  {
    $$0249306 = $25;$27 = $25;
    label = 9;
    break L9;
    break;
   }
   case 0:  {
    $$0249$lcssa = $25;$39 = $25;
    break L9;
    break;
   }
   default: {
   }
   }
   $24 = ((($25)) + 1|0);
   HEAP32[$5>>2] = $24;
   $$pre = HEAP8[$24>>0]|0;
   $23 = $$pre;$25 = $24;
  }
  L12: do {
   if ((label|0) == 9) {
    while(1) {
     label = 0;
     $26 = ((($27)) + 1|0);
     $28 = HEAP8[$26>>0]|0;
     $29 = ($28<<24>>24)==(37);
     if (!($29)) {
      $$0249$lcssa = $$0249306;$39 = $27;
      break L12;
     }
     $30 = ((($$0249306)) + 1|0);
     $31 = ((($27)) + 2|0);
     HEAP32[$5>>2] = $31;
     $32 = HEAP8[$31>>0]|0;
     $33 = ($32<<24>>24)==(37);
     if ($33) {
      $$0249306 = $30;$27 = $31;
      label = 9;
     } else {
      $$0249$lcssa = $30;$39 = $31;
      break;
     }
    }
   }
  } while(0);
  $34 = $$0249$lcssa;
  $35 = $21;
  $36 = (($34) - ($35))|0;
  if ($10) {
   _out($0,$21,$36);
  }
  $37 = ($36|0)==(0);
  if (!($37)) {
   $$0269$phi = $$0269;$$0243 = $36;$$0247 = $$1248;$21 = $39;$$0269 = $$0269$phi;
   continue;
  }
  $38 = ((($39)) + 1|0);
  $40 = HEAP8[$38>>0]|0;
  $41 = $40 << 24 >> 24;
  $isdigittmp = (($41) + -48)|0;
  $isdigit = ($isdigittmp>>>0)<(10);
  if ($isdigit) {
   $42 = ((($39)) + 2|0);
   $43 = HEAP8[$42>>0]|0;
   $44 = ($43<<24>>24)==(36);
   $45 = ((($39)) + 3|0);
   $$377 = $44 ? $45 : $38;
   $$$0269 = $44 ? 1 : $$0269;
   $isdigittmp$ = $44 ? $isdigittmp : -1;
   $$0253 = $isdigittmp$;$$1270 = $$$0269;$storemerge = $$377;
  } else {
   $$0253 = -1;$$1270 = $$0269;$storemerge = $38;
  }
  HEAP32[$5>>2] = $storemerge;
  $46 = HEAP8[$storemerge>>0]|0;
  $47 = $46 << 24 >> 24;
  $48 = (($47) + -32)|0;
  $49 = ($48>>>0)<(32);
  L24: do {
   if ($49) {
    $$0262311 = 0;$329 = $46;$51 = $48;$storemerge273310 = $storemerge;
    while(1) {
     $50 = 1 << $51;
     $52 = $50 & 75913;
     $53 = ($52|0)==(0);
     if ($53) {
      $$0262$lcssa = $$0262311;$$lcssa295 = $329;$62 = $storemerge273310;
      break L24;
     }
     $54 = $50 | $$0262311;
     $55 = ((($storemerge273310)) + 1|0);
     HEAP32[$5>>2] = $55;
     $56 = HEAP8[$55>>0]|0;
     $57 = $56 << 24 >> 24;
     $58 = (($57) + -32)|0;
     $59 = ($58>>>0)<(32);
     if ($59) {
      $$0262311 = $54;$329 = $56;$51 = $58;$storemerge273310 = $55;
     } else {
      $$0262$lcssa = $54;$$lcssa295 = $56;$62 = $55;
      break;
     }
    }
   } else {
    $$0262$lcssa = 0;$$lcssa295 = $46;$62 = $storemerge;
   }
  } while(0);
  $60 = ($$lcssa295<<24>>24)==(42);
  if ($60) {
   $61 = ((($62)) + 1|0);
   $63 = HEAP8[$61>>0]|0;
   $64 = $63 << 24 >> 24;
   $isdigittmp276 = (($64) + -48)|0;
   $isdigit277 = ($isdigittmp276>>>0)<(10);
   if ($isdigit277) {
    $65 = ((($62)) + 2|0);
    $66 = HEAP8[$65>>0]|0;
    $67 = ($66<<24>>24)==(36);
    if ($67) {
     $68 = (($4) + ($isdigittmp276<<2)|0);
     HEAP32[$68>>2] = 10;
     $69 = HEAP8[$61>>0]|0;
     $70 = $69 << 24 >> 24;
     $71 = (($70) + -48)|0;
     $72 = (($3) + ($71<<3)|0);
     $73 = $72;
     $74 = $73;
     $75 = HEAP32[$74>>2]|0;
     $76 = (($73) + 4)|0;
     $77 = $76;
     $78 = HEAP32[$77>>2]|0;
     $79 = ((($62)) + 3|0);
     $$0259 = $75;$$2271 = 1;$storemerge278 = $79;
    } else {
     label = 23;
    }
   } else {
    label = 23;
   }
   if ((label|0) == 23) {
    label = 0;
    $80 = ($$1270|0)==(0);
    if (!($80)) {
     $$0 = -1;
     break;
    }
    if ($10) {
     $arglist_current = HEAP32[$2>>2]|0;
     $81 = $arglist_current;
     $82 = ((0) + 4|0);
     $expanded4 = $82;
     $expanded = (($expanded4) - 1)|0;
     $83 = (($81) + ($expanded))|0;
     $84 = ((0) + 4|0);
     $expanded8 = $84;
     $expanded7 = (($expanded8) - 1)|0;
     $expanded6 = $expanded7 ^ -1;
     $85 = $83 & $expanded6;
     $86 = $85;
     $87 = HEAP32[$86>>2]|0;
     $arglist_next = ((($86)) + 4|0);
     HEAP32[$2>>2] = $arglist_next;
     $$0259 = $87;$$2271 = 0;$storemerge278 = $61;
    } else {
     $$0259 = 0;$$2271 = 0;$storemerge278 = $61;
    }
   }
   HEAP32[$5>>2] = $storemerge278;
   $88 = ($$0259|0)<(0);
   $89 = $$0262$lcssa | 8192;
   $90 = (0 - ($$0259))|0;
   $$$0262 = $88 ? $89 : $$0262$lcssa;
   $$$0259 = $88 ? $90 : $$0259;
   $$1260 = $$$0259;$$1263 = $$$0262;$$3272 = $$2271;$94 = $storemerge278;
  } else {
   $91 = (_getint($5)|0);
   $92 = ($91|0)<(0);
   if ($92) {
    $$0 = -1;
    break;
   }
   $$pre346 = HEAP32[$5>>2]|0;
   $$1260 = $91;$$1263 = $$0262$lcssa;$$3272 = $$1270;$94 = $$pre346;
  }
  $93 = HEAP8[$94>>0]|0;
  $95 = ($93<<24>>24)==(46);
  do {
   if ($95) {
    $96 = ((($94)) + 1|0);
    $97 = HEAP8[$96>>0]|0;
    $98 = ($97<<24>>24)==(42);
    if (!($98)) {
     $125 = ((($94)) + 1|0);
     HEAP32[$5>>2] = $125;
     $126 = (_getint($5)|0);
     $$pre347$pre = HEAP32[$5>>2]|0;
     $$0254 = $126;$$pre347 = $$pre347$pre;
     break;
    }
    $99 = ((($94)) + 2|0);
    $100 = HEAP8[$99>>0]|0;
    $101 = $100 << 24 >> 24;
    $isdigittmp274 = (($101) + -48)|0;
    $isdigit275 = ($isdigittmp274>>>0)<(10);
    if ($isdigit275) {
     $102 = ((($94)) + 3|0);
     $103 = HEAP8[$102>>0]|0;
     $104 = ($103<<24>>24)==(36);
     if ($104) {
      $105 = (($4) + ($isdigittmp274<<2)|0);
      HEAP32[$105>>2] = 10;
      $106 = HEAP8[$99>>0]|0;
      $107 = $106 << 24 >> 24;
      $108 = (($107) + -48)|0;
      $109 = (($3) + ($108<<3)|0);
      $110 = $109;
      $111 = $110;
      $112 = HEAP32[$111>>2]|0;
      $113 = (($110) + 4)|0;
      $114 = $113;
      $115 = HEAP32[$114>>2]|0;
      $116 = ((($94)) + 4|0);
      HEAP32[$5>>2] = $116;
      $$0254 = $112;$$pre347 = $116;
      break;
     }
    }
    $117 = ($$3272|0)==(0);
    if (!($117)) {
     $$0 = -1;
     break L1;
    }
    if ($10) {
     $arglist_current2 = HEAP32[$2>>2]|0;
     $118 = $arglist_current2;
     $119 = ((0) + 4|0);
     $expanded11 = $119;
     $expanded10 = (($expanded11) - 1)|0;
     $120 = (($118) + ($expanded10))|0;
     $121 = ((0) + 4|0);
     $expanded15 = $121;
     $expanded14 = (($expanded15) - 1)|0;
     $expanded13 = $expanded14 ^ -1;
     $122 = $120 & $expanded13;
     $123 = $122;
     $124 = HEAP32[$123>>2]|0;
     $arglist_next3 = ((($123)) + 4|0);
     HEAP32[$2>>2] = $arglist_next3;
     $330 = $124;
    } else {
     $330 = 0;
    }
    HEAP32[$5>>2] = $99;
    $$0254 = $330;$$pre347 = $99;
   } else {
    $$0254 = -1;$$pre347 = $94;
   }
  } while(0);
  $$0252 = 0;$128 = $$pre347;
  while(1) {
   $127 = HEAP8[$128>>0]|0;
   $129 = $127 << 24 >> 24;
   $130 = (($129) + -65)|0;
   $131 = ($130>>>0)>(57);
   if ($131) {
    $$0 = -1;
    break L1;
   }
   $132 = ((($128)) + 1|0);
   HEAP32[$5>>2] = $132;
   $133 = HEAP8[$128>>0]|0;
   $134 = $133 << 24 >> 24;
   $135 = (($134) + -65)|0;
   $136 = ((5045 + (($$0252*58)|0)|0) + ($135)|0);
   $137 = HEAP8[$136>>0]|0;
   $138 = $137&255;
   $139 = (($138) + -1)|0;
   $140 = ($139>>>0)<(8);
   if ($140) {
    $$0252 = $138;$128 = $132;
   } else {
    break;
   }
  }
  $141 = ($137<<24>>24)==(0);
  if ($141) {
   $$0 = -1;
   break;
  }
  $142 = ($137<<24>>24)==(19);
  $143 = ($$0253|0)>(-1);
  do {
   if ($142) {
    if ($143) {
     $$0 = -1;
     break L1;
    } else {
     label = 49;
    }
   } else {
    if ($143) {
     $144 = (($4) + ($$0253<<2)|0);
     HEAP32[$144>>2] = $138;
     $145 = (($3) + ($$0253<<3)|0);
     $146 = $145;
     $147 = $146;
     $148 = HEAP32[$147>>2]|0;
     $149 = (($146) + 4)|0;
     $150 = $149;
     $151 = HEAP32[$150>>2]|0;
     $152 = $6;
     $153 = $152;
     HEAP32[$153>>2] = $148;
     $154 = (($152) + 4)|0;
     $155 = $154;
     HEAP32[$155>>2] = $151;
     label = 49;
     break;
    }
    if (!($10)) {
     $$0 = 0;
     break L1;
    }
    _pop_arg($6,$138,$2);
   }
  } while(0);
  if ((label|0) == 49) {
   label = 0;
   if (!($10)) {
    $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
    continue;
   }
  }
  $156 = HEAP8[$128>>0]|0;
  $157 = $156 << 24 >> 24;
  $158 = ($$0252|0)!=(0);
  $159 = $157 & 15;
  $160 = ($159|0)==(3);
  $or$cond281 = $158 & $160;
  $161 = $157 & -33;
  $$0235 = $or$cond281 ? $161 : $157;
  $162 = $$1263 & 8192;
  $163 = ($162|0)==(0);
  $164 = $$1263 & -65537;
  $$1263$ = $163 ? $$1263 : $164;
  L71: do {
   switch ($$0235|0) {
   case 110:  {
    $trunc = $$0252&255;
    switch ($trunc<<24>>24) {
    case 0:  {
     $171 = HEAP32[$6>>2]|0;
     HEAP32[$171>>2] = $$1248;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    case 1:  {
     $172 = HEAP32[$6>>2]|0;
     HEAP32[$172>>2] = $$1248;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    case 2:  {
     $173 = ($$1248|0)<(0);
     $174 = $173 << 31 >> 31;
     $175 = HEAP32[$6>>2]|0;
     $176 = $175;
     $177 = $176;
     HEAP32[$177>>2] = $$1248;
     $178 = (($176) + 4)|0;
     $179 = $178;
     HEAP32[$179>>2] = $174;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    case 3:  {
     $180 = $$1248&65535;
     $181 = HEAP32[$6>>2]|0;
     HEAP16[$181>>1] = $180;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    case 4:  {
     $182 = $$1248&255;
     $183 = HEAP32[$6>>2]|0;
     HEAP8[$183>>0] = $182;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    case 6:  {
     $184 = HEAP32[$6>>2]|0;
     HEAP32[$184>>2] = $$1248;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    case 7:  {
     $185 = ($$1248|0)<(0);
     $186 = $185 << 31 >> 31;
     $187 = HEAP32[$6>>2]|0;
     $188 = $187;
     $189 = $188;
     HEAP32[$189>>2] = $$1248;
     $190 = (($188) + 4)|0;
     $191 = $190;
     HEAP32[$191>>2] = $186;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
     break;
    }
    default: {
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
     continue L1;
    }
    }
    break;
   }
   case 112:  {
    $192 = ($$0254>>>0)>(8);
    $193 = $192 ? $$0254 : 8;
    $194 = $$1263$ | 8;
    $$1236 = 120;$$1255 = $193;$$3265 = $194;
    label = 61;
    break;
   }
   case 88: case 120:  {
    $$1236 = $$0235;$$1255 = $$0254;$$3265 = $$1263$;
    label = 61;
    break;
   }
   case 111:  {
    $210 = $6;
    $211 = $210;
    $212 = HEAP32[$211>>2]|0;
    $213 = (($210) + 4)|0;
    $214 = $213;
    $215 = HEAP32[$214>>2]|0;
    $216 = (_fmt_o($212,$215,$11)|0);
    $217 = $$1263$ & 8;
    $218 = ($217|0)==(0);
    $219 = $216;
    $220 = (($12) - ($219))|0;
    $221 = ($$0254|0)>($220|0);
    $222 = (($220) + 1)|0;
    $223 = $218 | $221;
    $$0254$$0254$ = $223 ? $$0254 : $222;
    $$0228 = $216;$$1233 = 0;$$1238 = 5509;$$2256 = $$0254$$0254$;$$4266 = $$1263$;$247 = $212;$249 = $215;
    label = 67;
    break;
   }
   case 105: case 100:  {
    $224 = $6;
    $225 = $224;
    $226 = HEAP32[$225>>2]|0;
    $227 = (($224) + 4)|0;
    $228 = $227;
    $229 = HEAP32[$228>>2]|0;
    $230 = ($229|0)<(0);
    if ($230) {
     $231 = (_i64Subtract(0,0,($226|0),($229|0))|0);
     $232 = tempRet0;
     $233 = $6;
     $234 = $233;
     HEAP32[$234>>2] = $231;
     $235 = (($233) + 4)|0;
     $236 = $235;
     HEAP32[$236>>2] = $232;
     $$0232 = 1;$$0237 = 5509;$242 = $231;$243 = $232;
     label = 66;
     break L71;
    } else {
     $237 = $$1263$ & 2048;
     $238 = ($237|0)==(0);
     $239 = $$1263$ & 1;
     $240 = ($239|0)==(0);
     $$ = $240 ? 5509 : (5511);
     $$$ = $238 ? $$ : (5510);
     $241 = $$1263$ & 2049;
     $narrow = ($241|0)!=(0);
     $$284$ = $narrow&1;
     $$0232 = $$284$;$$0237 = $$$;$242 = $226;$243 = $229;
     label = 66;
     break L71;
    }
    break;
   }
   case 117:  {
    $165 = $6;
    $166 = $165;
    $167 = HEAP32[$166>>2]|0;
    $168 = (($165) + 4)|0;
    $169 = $168;
    $170 = HEAP32[$169>>2]|0;
    $$0232 = 0;$$0237 = 5509;$242 = $167;$243 = $170;
    label = 66;
    break;
   }
   case 99:  {
    $259 = $6;
    $260 = $259;
    $261 = HEAP32[$260>>2]|0;
    $262 = (($259) + 4)|0;
    $263 = $262;
    $264 = HEAP32[$263>>2]|0;
    $265 = $261&255;
    HEAP8[$13>>0] = $265;
    $$2 = $13;$$2234 = 0;$$2239 = 5509;$$2251 = $11;$$5 = 1;$$6268 = $164;
    break;
   }
   case 109:  {
    $266 = (___errno_location()|0);
    $267 = HEAP32[$266>>2]|0;
    $268 = (_strerror($267)|0);
    $$1 = $268;
    label = 71;
    break;
   }
   case 115:  {
    $269 = HEAP32[$6>>2]|0;
    $270 = ($269|0)!=(0|0);
    $271 = $270 ? $269 : 5519;
    $$1 = $271;
    label = 71;
    break;
   }
   case 67:  {
    $278 = $6;
    $279 = $278;
    $280 = HEAP32[$279>>2]|0;
    $281 = (($278) + 4)|0;
    $282 = $281;
    $283 = HEAP32[$282>>2]|0;
    HEAP32[$8>>2] = $280;
    HEAP32[$14>>2] = 0;
    HEAP32[$6>>2] = $8;
    $$4258355 = -1;$331 = $8;
    label = 75;
    break;
   }
   case 83:  {
    $$pre349 = HEAP32[$6>>2]|0;
    $284 = ($$0254|0)==(0);
    if ($284) {
     _pad($0,32,$$1260,0,$$1263$);
     $$0240$lcssa357 = 0;
     label = 84;
    } else {
     $$4258355 = $$0254;$331 = $$pre349;
     label = 75;
    }
    break;
   }
   case 65: case 71: case 70: case 69: case 97: case 103: case 102: case 101:  {
    $306 = +HEAPF64[$6>>3];
    $307 = (_fmt_fp($0,$306,$$1260,$$0254,$$1263$,$$0235)|0);
    $$0243 = $307;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
    continue L1;
    break;
   }
   default: {
    $$2 = $21;$$2234 = 0;$$2239 = 5509;$$2251 = $11;$$5 = $$0254;$$6268 = $$1263$;
   }
   }
  } while(0);
  L95: do {
   if ((label|0) == 61) {
    label = 0;
    $195 = $6;
    $196 = $195;
    $197 = HEAP32[$196>>2]|0;
    $198 = (($195) + 4)|0;
    $199 = $198;
    $200 = HEAP32[$199>>2]|0;
    $201 = $$1236 & 32;
    $202 = (_fmt_x($197,$200,$11,$201)|0);
    $203 = ($197|0)==(0);
    $204 = ($200|0)==(0);
    $205 = $203 & $204;
    $206 = $$3265 & 8;
    $207 = ($206|0)==(0);
    $or$cond283 = $207 | $205;
    $208 = $$1236 >> 4;
    $209 = (5509 + ($208)|0);
    $$289 = $or$cond283 ? 5509 : $209;
    $$290 = $or$cond283 ? 0 : 2;
    $$0228 = $202;$$1233 = $$290;$$1238 = $$289;$$2256 = $$1255;$$4266 = $$3265;$247 = $197;$249 = $200;
    label = 67;
   }
   else if ((label|0) == 66) {
    label = 0;
    $244 = (_fmt_u($242,$243,$11)|0);
    $$0228 = $244;$$1233 = $$0232;$$1238 = $$0237;$$2256 = $$0254;$$4266 = $$1263$;$247 = $242;$249 = $243;
    label = 67;
   }
   else if ((label|0) == 71) {
    label = 0;
    $272 = (_memchr($$1,0,$$0254)|0);
    $273 = ($272|0)==(0|0);
    $274 = $272;
    $275 = $$1;
    $276 = (($274) - ($275))|0;
    $277 = (($$1) + ($$0254)|0);
    $$3257 = $273 ? $$0254 : $276;
    $$1250 = $273 ? $277 : $272;
    $$2 = $$1;$$2234 = 0;$$2239 = 5509;$$2251 = $$1250;$$5 = $$3257;$$6268 = $164;
   }
   else if ((label|0) == 75) {
    label = 0;
    $$0229322 = $331;$$0240321 = 0;$$1244320 = 0;
    while(1) {
     $285 = HEAP32[$$0229322>>2]|0;
     $286 = ($285|0)==(0);
     if ($286) {
      $$0240$lcssa = $$0240321;$$2245 = $$1244320;
      break;
     }
     $287 = (_wctomb($9,$285)|0);
     $288 = ($287|0)<(0);
     $289 = (($$4258355) - ($$0240321))|0;
     $290 = ($287>>>0)>($289>>>0);
     $or$cond286 = $288 | $290;
     if ($or$cond286) {
      $$0240$lcssa = $$0240321;$$2245 = $287;
      break;
     }
     $291 = ((($$0229322)) + 4|0);
     $292 = (($287) + ($$0240321))|0;
     $293 = ($$4258355>>>0)>($292>>>0);
     if ($293) {
      $$0229322 = $291;$$0240321 = $292;$$1244320 = $287;
     } else {
      $$0240$lcssa = $292;$$2245 = $287;
      break;
     }
    }
    $294 = ($$2245|0)<(0);
    if ($294) {
     $$0 = -1;
     break L1;
    }
    _pad($0,32,$$1260,$$0240$lcssa,$$1263$);
    $295 = ($$0240$lcssa|0)==(0);
    if ($295) {
     $$0240$lcssa357 = 0;
     label = 84;
    } else {
     $$1230333 = $331;$$1241332 = 0;
     while(1) {
      $296 = HEAP32[$$1230333>>2]|0;
      $297 = ($296|0)==(0);
      if ($297) {
       $$0240$lcssa357 = $$0240$lcssa;
       label = 84;
       break L95;
      }
      $298 = (_wctomb($9,$296)|0);
      $299 = (($298) + ($$1241332))|0;
      $300 = ($299|0)>($$0240$lcssa|0);
      if ($300) {
       $$0240$lcssa357 = $$0240$lcssa;
       label = 84;
       break L95;
      }
      $301 = ((($$1230333)) + 4|0);
      _out($0,$9,$298);
      $302 = ($299>>>0)<($$0240$lcssa>>>0);
      if ($302) {
       $$1230333 = $301;$$1241332 = $299;
      } else {
       $$0240$lcssa357 = $$0240$lcssa;
       label = 84;
       break;
      }
     }
    }
   }
  } while(0);
  if ((label|0) == 67) {
   label = 0;
   $245 = ($$2256|0)>(-1);
   $246 = $$4266 & -65537;
   $$$4266 = $245 ? $246 : $$4266;
   $248 = ($247|0)!=(0);
   $250 = ($249|0)!=(0);
   $251 = $248 | $250;
   $252 = ($$2256|0)!=(0);
   $or$cond = $252 | $251;
   $253 = $$0228;
   $254 = (($12) - ($253))|0;
   $255 = $251 ^ 1;
   $256 = $255&1;
   $257 = (($256) + ($254))|0;
   $258 = ($$2256|0)>($257|0);
   $$2256$ = $258 ? $$2256 : $257;
   $$2256$$$2256 = $or$cond ? $$2256$ : $$2256;
   $$0228$ = $or$cond ? $$0228 : $11;
   $$2 = $$0228$;$$2234 = $$1233;$$2239 = $$1238;$$2251 = $11;$$5 = $$2256$$$2256;$$6268 = $$$4266;
  }
  else if ((label|0) == 84) {
   label = 0;
   $303 = $$1263$ ^ 8192;
   _pad($0,32,$$1260,$$0240$lcssa357,$303);
   $304 = ($$1260|0)>($$0240$lcssa357|0);
   $305 = $304 ? $$1260 : $$0240$lcssa357;
   $$0243 = $305;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
   continue;
  }
  $308 = $$2251;
  $309 = $$2;
  $310 = (($308) - ($309))|0;
  $311 = ($$5|0)<($310|0);
  $$$5 = $311 ? $310 : $$5;
  $312 = (($$$5) + ($$2234))|0;
  $313 = ($$1260|0)<($312|0);
  $$2261 = $313 ? $312 : $$1260;
  _pad($0,32,$$2261,$312,$$6268);
  _out($0,$$2239,$$2234);
  $314 = $$6268 ^ 65536;
  _pad($0,48,$$2261,$312,$314);
  _pad($0,48,$$$5,$310,0);
  _out($0,$$2,$310);
  $315 = $$6268 ^ 8192;
  _pad($0,32,$$2261,$312,$315);
  $$0243 = $$2261;$$0247 = $$1248;$$0269 = $$3272;$21 = $132;
 }
 L114: do {
  if ((label|0) == 87) {
   $316 = ($0|0)==(0|0);
   if ($316) {
    $317 = ($$0269|0)==(0);
    if ($317) {
     $$0 = 0;
    } else {
     $$2242305 = 1;
     while(1) {
      $318 = (($4) + ($$2242305<<2)|0);
      $319 = HEAP32[$318>>2]|0;
      $320 = ($319|0)==(0);
      if ($320) {
       $$3303 = $$2242305;
       break;
      }
      $321 = (($3) + ($$2242305<<3)|0);
      _pop_arg($321,$319,$2);
      $322 = (($$2242305) + 1)|0;
      $323 = ($322|0)<(10);
      if ($323) {
       $$2242305 = $322;
      } else {
       $$0 = 1;
       break L114;
      }
     }
     while(1) {
      $326 = (($4) + ($$3303<<2)|0);
      $327 = HEAP32[$326>>2]|0;
      $328 = ($327|0)==(0);
      $324 = (($$3303) + 1)|0;
      if (!($328)) {
       $$0 = -1;
       break L114;
      }
      $325 = ($324|0)<(10);
      if ($325) {
       $$3303 = $324;
      } else {
       $$0 = 1;
       break;
      }
     }
    }
   } else {
    $$0 = $$1248;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function _out($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = HEAP32[$0>>2]|0;
 $4 = $3 & 32;
 $5 = ($4|0)==(0);
 if ($5) {
  (___fwritex($1,$2,$0)|0);
 }
 return;
}
function _getint($0) {
 $0 = $0|0;
 var $$0$lcssa = 0, $$06 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $isdigit = 0, $isdigit5 = 0, $isdigittmp = 0, $isdigittmp4 = 0, $isdigittmp7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = HEAP32[$0>>2]|0;
 $2 = HEAP8[$1>>0]|0;
 $3 = $2 << 24 >> 24;
 $isdigittmp4 = (($3) + -48)|0;
 $isdigit5 = ($isdigittmp4>>>0)<(10);
 if ($isdigit5) {
  $$06 = 0;$7 = $1;$isdigittmp7 = $isdigittmp4;
  while(1) {
   $4 = ($$06*10)|0;
   $5 = (($isdigittmp7) + ($4))|0;
   $6 = ((($7)) + 1|0);
   HEAP32[$0>>2] = $6;
   $8 = HEAP8[$6>>0]|0;
   $9 = $8 << 24 >> 24;
   $isdigittmp = (($9) + -48)|0;
   $isdigit = ($isdigittmp>>>0)<(10);
   if ($isdigit) {
    $$06 = $5;$7 = $6;$isdigittmp7 = $isdigittmp;
   } else {
    $$0$lcssa = $5;
    break;
   }
  }
 } else {
  $$0$lcssa = 0;
 }
 return ($$0$lcssa|0);
}
function _pop_arg($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$mask = 0, $$mask31 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0.0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0.0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $arglist_current = 0, $arglist_current11 = 0, $arglist_current14 = 0, $arglist_current17 = 0;
 var $arglist_current2 = 0, $arglist_current20 = 0, $arglist_current23 = 0, $arglist_current26 = 0, $arglist_current5 = 0, $arglist_current8 = 0, $arglist_next = 0, $arglist_next12 = 0, $arglist_next15 = 0, $arglist_next18 = 0, $arglist_next21 = 0, $arglist_next24 = 0, $arglist_next27 = 0, $arglist_next3 = 0, $arglist_next6 = 0, $arglist_next9 = 0, $expanded = 0, $expanded28 = 0, $expanded30 = 0, $expanded31 = 0;
 var $expanded32 = 0, $expanded34 = 0, $expanded35 = 0, $expanded37 = 0, $expanded38 = 0, $expanded39 = 0, $expanded41 = 0, $expanded42 = 0, $expanded44 = 0, $expanded45 = 0, $expanded46 = 0, $expanded48 = 0, $expanded49 = 0, $expanded51 = 0, $expanded52 = 0, $expanded53 = 0, $expanded55 = 0, $expanded56 = 0, $expanded58 = 0, $expanded59 = 0;
 var $expanded60 = 0, $expanded62 = 0, $expanded63 = 0, $expanded65 = 0, $expanded66 = 0, $expanded67 = 0, $expanded69 = 0, $expanded70 = 0, $expanded72 = 0, $expanded73 = 0, $expanded74 = 0, $expanded76 = 0, $expanded77 = 0, $expanded79 = 0, $expanded80 = 0, $expanded81 = 0, $expanded83 = 0, $expanded84 = 0, $expanded86 = 0, $expanded87 = 0;
 var $expanded88 = 0, $expanded90 = 0, $expanded91 = 0, $expanded93 = 0, $expanded94 = 0, $expanded95 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($1>>>0)>(20);
 L1: do {
  if (!($3)) {
   do {
    switch ($1|0) {
    case 9:  {
     $arglist_current = HEAP32[$2>>2]|0;
     $4 = $arglist_current;
     $5 = ((0) + 4|0);
     $expanded28 = $5;
     $expanded = (($expanded28) - 1)|0;
     $6 = (($4) + ($expanded))|0;
     $7 = ((0) + 4|0);
     $expanded32 = $7;
     $expanded31 = (($expanded32) - 1)|0;
     $expanded30 = $expanded31 ^ -1;
     $8 = $6 & $expanded30;
     $9 = $8;
     $10 = HEAP32[$9>>2]|0;
     $arglist_next = ((($9)) + 4|0);
     HEAP32[$2>>2] = $arglist_next;
     HEAP32[$0>>2] = $10;
     break L1;
     break;
    }
    case 10:  {
     $arglist_current2 = HEAP32[$2>>2]|0;
     $11 = $arglist_current2;
     $12 = ((0) + 4|0);
     $expanded35 = $12;
     $expanded34 = (($expanded35) - 1)|0;
     $13 = (($11) + ($expanded34))|0;
     $14 = ((0) + 4|0);
     $expanded39 = $14;
     $expanded38 = (($expanded39) - 1)|0;
     $expanded37 = $expanded38 ^ -1;
     $15 = $13 & $expanded37;
     $16 = $15;
     $17 = HEAP32[$16>>2]|0;
     $arglist_next3 = ((($16)) + 4|0);
     HEAP32[$2>>2] = $arglist_next3;
     $18 = ($17|0)<(0);
     $19 = $18 << 31 >> 31;
     $20 = $0;
     $21 = $20;
     HEAP32[$21>>2] = $17;
     $22 = (($20) + 4)|0;
     $23 = $22;
     HEAP32[$23>>2] = $19;
     break L1;
     break;
    }
    case 11:  {
     $arglist_current5 = HEAP32[$2>>2]|0;
     $24 = $arglist_current5;
     $25 = ((0) + 4|0);
     $expanded42 = $25;
     $expanded41 = (($expanded42) - 1)|0;
     $26 = (($24) + ($expanded41))|0;
     $27 = ((0) + 4|0);
     $expanded46 = $27;
     $expanded45 = (($expanded46) - 1)|0;
     $expanded44 = $expanded45 ^ -1;
     $28 = $26 & $expanded44;
     $29 = $28;
     $30 = HEAP32[$29>>2]|0;
     $arglist_next6 = ((($29)) + 4|0);
     HEAP32[$2>>2] = $arglist_next6;
     $31 = $0;
     $32 = $31;
     HEAP32[$32>>2] = $30;
     $33 = (($31) + 4)|0;
     $34 = $33;
     HEAP32[$34>>2] = 0;
     break L1;
     break;
    }
    case 12:  {
     $arglist_current8 = HEAP32[$2>>2]|0;
     $35 = $arglist_current8;
     $36 = ((0) + 8|0);
     $expanded49 = $36;
     $expanded48 = (($expanded49) - 1)|0;
     $37 = (($35) + ($expanded48))|0;
     $38 = ((0) + 8|0);
     $expanded53 = $38;
     $expanded52 = (($expanded53) - 1)|0;
     $expanded51 = $expanded52 ^ -1;
     $39 = $37 & $expanded51;
     $40 = $39;
     $41 = $40;
     $42 = $41;
     $43 = HEAP32[$42>>2]|0;
     $44 = (($41) + 4)|0;
     $45 = $44;
     $46 = HEAP32[$45>>2]|0;
     $arglist_next9 = ((($40)) + 8|0);
     HEAP32[$2>>2] = $arglist_next9;
     $47 = $0;
     $48 = $47;
     HEAP32[$48>>2] = $43;
     $49 = (($47) + 4)|0;
     $50 = $49;
     HEAP32[$50>>2] = $46;
     break L1;
     break;
    }
    case 13:  {
     $arglist_current11 = HEAP32[$2>>2]|0;
     $51 = $arglist_current11;
     $52 = ((0) + 4|0);
     $expanded56 = $52;
     $expanded55 = (($expanded56) - 1)|0;
     $53 = (($51) + ($expanded55))|0;
     $54 = ((0) + 4|0);
     $expanded60 = $54;
     $expanded59 = (($expanded60) - 1)|0;
     $expanded58 = $expanded59 ^ -1;
     $55 = $53 & $expanded58;
     $56 = $55;
     $57 = HEAP32[$56>>2]|0;
     $arglist_next12 = ((($56)) + 4|0);
     HEAP32[$2>>2] = $arglist_next12;
     $58 = $57&65535;
     $59 = $58 << 16 >> 16;
     $60 = ($59|0)<(0);
     $61 = $60 << 31 >> 31;
     $62 = $0;
     $63 = $62;
     HEAP32[$63>>2] = $59;
     $64 = (($62) + 4)|0;
     $65 = $64;
     HEAP32[$65>>2] = $61;
     break L1;
     break;
    }
    case 14:  {
     $arglist_current14 = HEAP32[$2>>2]|0;
     $66 = $arglist_current14;
     $67 = ((0) + 4|0);
     $expanded63 = $67;
     $expanded62 = (($expanded63) - 1)|0;
     $68 = (($66) + ($expanded62))|0;
     $69 = ((0) + 4|0);
     $expanded67 = $69;
     $expanded66 = (($expanded67) - 1)|0;
     $expanded65 = $expanded66 ^ -1;
     $70 = $68 & $expanded65;
     $71 = $70;
     $72 = HEAP32[$71>>2]|0;
     $arglist_next15 = ((($71)) + 4|0);
     HEAP32[$2>>2] = $arglist_next15;
     $$mask31 = $72 & 65535;
     $73 = $0;
     $74 = $73;
     HEAP32[$74>>2] = $$mask31;
     $75 = (($73) + 4)|0;
     $76 = $75;
     HEAP32[$76>>2] = 0;
     break L1;
     break;
    }
    case 15:  {
     $arglist_current17 = HEAP32[$2>>2]|0;
     $77 = $arglist_current17;
     $78 = ((0) + 4|0);
     $expanded70 = $78;
     $expanded69 = (($expanded70) - 1)|0;
     $79 = (($77) + ($expanded69))|0;
     $80 = ((0) + 4|0);
     $expanded74 = $80;
     $expanded73 = (($expanded74) - 1)|0;
     $expanded72 = $expanded73 ^ -1;
     $81 = $79 & $expanded72;
     $82 = $81;
     $83 = HEAP32[$82>>2]|0;
     $arglist_next18 = ((($82)) + 4|0);
     HEAP32[$2>>2] = $arglist_next18;
     $84 = $83&255;
     $85 = $84 << 24 >> 24;
     $86 = ($85|0)<(0);
     $87 = $86 << 31 >> 31;
     $88 = $0;
     $89 = $88;
     HEAP32[$89>>2] = $85;
     $90 = (($88) + 4)|0;
     $91 = $90;
     HEAP32[$91>>2] = $87;
     break L1;
     break;
    }
    case 16:  {
     $arglist_current20 = HEAP32[$2>>2]|0;
     $92 = $arglist_current20;
     $93 = ((0) + 4|0);
     $expanded77 = $93;
     $expanded76 = (($expanded77) - 1)|0;
     $94 = (($92) + ($expanded76))|0;
     $95 = ((0) + 4|0);
     $expanded81 = $95;
     $expanded80 = (($expanded81) - 1)|0;
     $expanded79 = $expanded80 ^ -1;
     $96 = $94 & $expanded79;
     $97 = $96;
     $98 = HEAP32[$97>>2]|0;
     $arglist_next21 = ((($97)) + 4|0);
     HEAP32[$2>>2] = $arglist_next21;
     $$mask = $98 & 255;
     $99 = $0;
     $100 = $99;
     HEAP32[$100>>2] = $$mask;
     $101 = (($99) + 4)|0;
     $102 = $101;
     HEAP32[$102>>2] = 0;
     break L1;
     break;
    }
    case 17:  {
     $arglist_current23 = HEAP32[$2>>2]|0;
     $103 = $arglist_current23;
     $104 = ((0) + 8|0);
     $expanded84 = $104;
     $expanded83 = (($expanded84) - 1)|0;
     $105 = (($103) + ($expanded83))|0;
     $106 = ((0) + 8|0);
     $expanded88 = $106;
     $expanded87 = (($expanded88) - 1)|0;
     $expanded86 = $expanded87 ^ -1;
     $107 = $105 & $expanded86;
     $108 = $107;
     $109 = +HEAPF64[$108>>3];
     $arglist_next24 = ((($108)) + 8|0);
     HEAP32[$2>>2] = $arglist_next24;
     HEAPF64[$0>>3] = $109;
     break L1;
     break;
    }
    case 18:  {
     $arglist_current26 = HEAP32[$2>>2]|0;
     $110 = $arglist_current26;
     $111 = ((0) + 8|0);
     $expanded91 = $111;
     $expanded90 = (($expanded91) - 1)|0;
     $112 = (($110) + ($expanded90))|0;
     $113 = ((0) + 8|0);
     $expanded95 = $113;
     $expanded94 = (($expanded95) - 1)|0;
     $expanded93 = $expanded94 ^ -1;
     $114 = $112 & $expanded93;
     $115 = $114;
     $116 = +HEAPF64[$115>>3];
     $arglist_next27 = ((($115)) + 8|0);
     HEAP32[$2>>2] = $arglist_next27;
     HEAPF64[$0>>3] = $116;
     break L1;
     break;
    }
    default: {
     break L1;
    }
    }
   } while(0);
  }
 } while(0);
 return;
}
function _fmt_x($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $$05$lcssa = 0, $$056 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $4 = ($0|0)==(0);
 $5 = ($1|0)==(0);
 $6 = $4 & $5;
 if ($6) {
  $$05$lcssa = $2;
 } else {
  $$056 = $2;$15 = $1;$8 = $0;
  while(1) {
   $7 = $8 & 15;
   $9 = (5561 + ($7)|0);
   $10 = HEAP8[$9>>0]|0;
   $11 = $10&255;
   $12 = $11 | $3;
   $13 = $12&255;
   $14 = ((($$056)) + -1|0);
   HEAP8[$14>>0] = $13;
   $16 = (_bitshift64Lshr(($8|0),($15|0),4)|0);
   $17 = tempRet0;
   $18 = ($16|0)==(0);
   $19 = ($17|0)==(0);
   $20 = $18 & $19;
   if ($20) {
    $$05$lcssa = $14;
    break;
   } else {
    $$056 = $14;$15 = $17;$8 = $16;
   }
  }
 }
 return ($$05$lcssa|0);
}
function _fmt_o($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0$lcssa = 0, $$06 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($0|0)==(0);
 $4 = ($1|0)==(0);
 $5 = $3 & $4;
 if ($5) {
  $$0$lcssa = $2;
 } else {
  $$06 = $2;$11 = $1;$7 = $0;
  while(1) {
   $6 = $7&255;
   $8 = $6 & 7;
   $9 = $8 | 48;
   $10 = ((($$06)) + -1|0);
   HEAP8[$10>>0] = $9;
   $12 = (_bitshift64Lshr(($7|0),($11|0),3)|0);
   $13 = tempRet0;
   $14 = ($12|0)==(0);
   $15 = ($13|0)==(0);
   $16 = $14 & $15;
   if ($16) {
    $$0$lcssa = $10;
    break;
   } else {
    $$06 = $10;$11 = $13;$7 = $12;
   }
  }
 }
 return ($$0$lcssa|0);
}
function _fmt_u($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$010$lcssa$off0 = 0, $$012 = 0, $$09$lcssa = 0, $$0914 = 0, $$1$lcssa = 0, $$111 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($1>>>0)>(0);
 $4 = ($0>>>0)>(4294967295);
 $5 = ($1|0)==(0);
 $6 = $5 & $4;
 $7 = $3 | $6;
 if ($7) {
  $$0914 = $2;$8 = $0;$9 = $1;
  while(1) {
   $10 = (___uremdi3(($8|0),($9|0),10,0)|0);
   $11 = tempRet0;
   $12 = $10&255;
   $13 = $12 | 48;
   $14 = ((($$0914)) + -1|0);
   HEAP8[$14>>0] = $13;
   $15 = (___udivdi3(($8|0),($9|0),10,0)|0);
   $16 = tempRet0;
   $17 = ($9>>>0)>(9);
   $18 = ($8>>>0)>(4294967295);
   $19 = ($9|0)==(9);
   $20 = $19 & $18;
   $21 = $17 | $20;
   if ($21) {
    $$0914 = $14;$8 = $15;$9 = $16;
   } else {
    break;
   }
  }
  $$010$lcssa$off0 = $15;$$09$lcssa = $14;
 } else {
  $$010$lcssa$off0 = $0;$$09$lcssa = $2;
 }
 $22 = ($$010$lcssa$off0|0)==(0);
 if ($22) {
  $$1$lcssa = $$09$lcssa;
 } else {
  $$012 = $$010$lcssa$off0;$$111 = $$09$lcssa;
  while(1) {
   $23 = (($$012>>>0) % 10)&-1;
   $24 = $23 | 48;
   $25 = $24&255;
   $26 = ((($$111)) + -1|0);
   HEAP8[$26>>0] = $25;
   $27 = (($$012>>>0) / 10)&-1;
   $28 = ($$012>>>0)<(10);
   if ($28) {
    $$1$lcssa = $26;
    break;
   } else {
    $$012 = $27;$$111 = $26;
   }
  }
 }
 return ($$1$lcssa|0);
}
function _strerror($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = (___pthread_self_612()|0);
 $2 = ((($1)) + 188|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = (___strerror_l($0,$3)|0);
 return ($4|0);
}
function _memchr($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0$lcssa = 0, $$035$lcssa = 0, $$035$lcssa65 = 0, $$03555 = 0, $$036$lcssa = 0, $$036$lcssa64 = 0, $$03654 = 0, $$046 = 0, $$137$lcssa = 0, $$13745 = 0, $$140 = 0, $$2 = 0, $$23839 = 0, $$3 = 0, $$lcssa = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
 var $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond53 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = $1 & 255;
 $4 = $0;
 $5 = $4 & 3;
 $6 = ($5|0)!=(0);
 $7 = ($2|0)!=(0);
 $or$cond53 = $7 & $6;
 L1: do {
  if ($or$cond53) {
   $8 = $1&255;
   $$03555 = $0;$$03654 = $2;
   while(1) {
    $9 = HEAP8[$$03555>>0]|0;
    $10 = ($9<<24>>24)==($8<<24>>24);
    if ($10) {
     $$035$lcssa65 = $$03555;$$036$lcssa64 = $$03654;
     label = 6;
     break L1;
    }
    $11 = ((($$03555)) + 1|0);
    $12 = (($$03654) + -1)|0;
    $13 = $11;
    $14 = $13 & 3;
    $15 = ($14|0)!=(0);
    $16 = ($12|0)!=(0);
    $or$cond = $16 & $15;
    if ($or$cond) {
     $$03555 = $11;$$03654 = $12;
    } else {
     $$035$lcssa = $11;$$036$lcssa = $12;$$lcssa = $16;
     label = 5;
     break;
    }
   }
  } else {
   $$035$lcssa = $0;$$036$lcssa = $2;$$lcssa = $7;
   label = 5;
  }
 } while(0);
 if ((label|0) == 5) {
  if ($$lcssa) {
   $$035$lcssa65 = $$035$lcssa;$$036$lcssa64 = $$036$lcssa;
   label = 6;
  } else {
   $$2 = $$035$lcssa;$$3 = 0;
  }
 }
 L8: do {
  if ((label|0) == 6) {
   $17 = HEAP8[$$035$lcssa65>>0]|0;
   $18 = $1&255;
   $19 = ($17<<24>>24)==($18<<24>>24);
   if ($19) {
    $$2 = $$035$lcssa65;$$3 = $$036$lcssa64;
   } else {
    $20 = Math_imul($3, 16843009)|0;
    $21 = ($$036$lcssa64>>>0)>(3);
    L11: do {
     if ($21) {
      $$046 = $$035$lcssa65;$$13745 = $$036$lcssa64;
      while(1) {
       $22 = HEAP32[$$046>>2]|0;
       $23 = $22 ^ $20;
       $24 = (($23) + -16843009)|0;
       $25 = $23 & -2139062144;
       $26 = $25 ^ -2139062144;
       $27 = $26 & $24;
       $28 = ($27|0)==(0);
       if (!($28)) {
        break;
       }
       $29 = ((($$046)) + 4|0);
       $30 = (($$13745) + -4)|0;
       $31 = ($30>>>0)>(3);
       if ($31) {
        $$046 = $29;$$13745 = $30;
       } else {
        $$0$lcssa = $29;$$137$lcssa = $30;
        label = 11;
        break L11;
       }
      }
      $$140 = $$046;$$23839 = $$13745;
     } else {
      $$0$lcssa = $$035$lcssa65;$$137$lcssa = $$036$lcssa64;
      label = 11;
     }
    } while(0);
    if ((label|0) == 11) {
     $32 = ($$137$lcssa|0)==(0);
     if ($32) {
      $$2 = $$0$lcssa;$$3 = 0;
      break;
     } else {
      $$140 = $$0$lcssa;$$23839 = $$137$lcssa;
     }
    }
    while(1) {
     $33 = HEAP8[$$140>>0]|0;
     $34 = ($33<<24>>24)==($18<<24>>24);
     if ($34) {
      $$2 = $$140;$$3 = $$23839;
      break L8;
     }
     $35 = ((($$140)) + 1|0);
     $36 = (($$23839) + -1)|0;
     $37 = ($36|0)==(0);
     if ($37) {
      $$2 = $35;$$3 = 0;
      break;
     } else {
      $$140 = $35;$$23839 = $36;
     }
    }
   }
  }
 } while(0);
 $38 = ($$3|0)!=(0);
 $39 = $38 ? $$2 : 0;
 return ($39|0);
}
function _pad($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$0$lcssa = 0, $$011 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(256|0);
 $5 = sp;
 $6 = $4 & 73728;
 $7 = ($6|0)==(0);
 $8 = ($2|0)>($3|0);
 $or$cond = $8 & $7;
 if ($or$cond) {
  $9 = (($2) - ($3))|0;
  $10 = ($9>>>0)<(256);
  $11 = $10 ? $9 : 256;
  _memset(($5|0),($1|0),($11|0))|0;
  $12 = ($9>>>0)>(255);
  if ($12) {
   $13 = (($2) - ($3))|0;
   $$011 = $9;
   while(1) {
    _out($0,$5,256);
    $14 = (($$011) + -256)|0;
    $15 = ($14>>>0)>(255);
    if ($15) {
     $$011 = $14;
    } else {
     break;
    }
   }
   $16 = $13 & 255;
   $$0$lcssa = $16;
  } else {
   $$0$lcssa = $9;
  }
  _out($0,$5,$$0$lcssa);
 }
 STACKTOP = sp;return;
}
function _fmt_fp($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = +$1;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $$ = 0, $$$ = 0, $$$$559 = 0.0, $$$3484 = 0, $$$3484691 = 0, $$$3484692 = 0, $$$3501 = 0, $$$4502 = 0, $$$542 = 0.0, $$$559 = 0.0, $$0 = 0, $$0463$lcssa = 0, $$0463584 = 0, $$0464594 = 0, $$0471 = 0.0, $$0479 = 0, $$0487642 = 0, $$0488 = 0, $$0488653 = 0, $$0488655 = 0;
 var $$0496$$9 = 0, $$0497654 = 0, $$0498 = 0, $$0509582 = 0.0, $$0510 = 0, $$0511 = 0, $$0514637 = 0, $$0520 = 0, $$0521 = 0, $$0521$ = 0, $$0523 = 0, $$0525 = 0, $$0527 = 0, $$0527629 = 0, $$0527631 = 0, $$0530636 = 0, $$1465 = 0, $$1467 = 0.0, $$1469 = 0.0, $$1472 = 0.0;
 var $$1480 = 0, $$1482$lcssa = 0, $$1482661 = 0, $$1489641 = 0, $$1499$lcssa = 0, $$1499660 = 0, $$1508583 = 0, $$1512$lcssa = 0, $$1512607 = 0, $$1515 = 0, $$1524 = 0, $$1526 = 0, $$1528614 = 0, $$1531$lcssa = 0, $$1531630 = 0, $$1598 = 0, $$2 = 0, $$2473 = 0.0, $$2476 = 0, $$2476$$547 = 0;
 var $$2476$$549 = 0, $$2483$ph = 0, $$2500 = 0, $$2513 = 0, $$2516618 = 0, $$2529 = 0, $$2532617 = 0, $$3 = 0.0, $$3477 = 0, $$3484$lcssa = 0, $$3484648 = 0, $$3501$lcssa = 0, $$3501647 = 0, $$3533613 = 0, $$4 = 0.0, $$4478$lcssa = 0, $$4478590 = 0, $$4492 = 0, $$4502 = 0, $$4518 = 0;
 var $$5$lcssa = 0, $$534$ = 0, $$539 = 0, $$539$ = 0, $$542 = 0.0, $$546 = 0, $$548 = 0, $$5486$lcssa = 0, $$5486623 = 0, $$5493597 = 0, $$5519$ph = 0, $$555 = 0, $$556 = 0, $$559 = 0.0, $$5602 = 0, $$6 = 0, $$6494589 = 0, $$7495601 = 0, $$7505 = 0, $$7505$ = 0;
 var $$7505$ph = 0, $$8 = 0, $$9$ph = 0, $$lcssa673 = 0, $$neg = 0, $$neg567 = 0, $$pn = 0, $$pn566 = 0, $$pr = 0, $$pr564 = 0, $$pre = 0, $$pre$phi690Z2D = 0, $$pre689 = 0, $$sink545$lcssa = 0, $$sink545622 = 0, $$sink562 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0;
 var $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0.0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0.0, $117 = 0.0, $118 = 0.0, $119 = 0, $12 = 0, $120 = 0;
 var $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0;
 var $14 = 0.0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0;
 var $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0;
 var $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0;
 var $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0;
 var $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0.0, $229 = 0.0, $23 = 0;
 var $230 = 0, $231 = 0.0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0;
 var $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0;
 var $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0;
 var $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0;
 var $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0;
 var $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0;
 var $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0.0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0;
 var $358 = 0, $359 = 0, $36 = 0.0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0;
 var $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $50 = 0, $51 = 0.0, $52 = 0, $53 = 0, $54 = 0, $55 = 0.0, $56 = 0.0, $57 = 0.0, $58 = 0.0, $59 = 0.0, $6 = 0, $60 = 0.0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0;
 var $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0.0, $88 = 0.0, $89 = 0.0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $exitcond = 0;
 var $narrow = 0, $not$ = 0, $notlhs = 0, $notrhs = 0, $or$cond = 0, $or$cond3$not = 0, $or$cond537 = 0, $or$cond541 = 0, $or$cond544 = 0, $or$cond554 = 0, $or$cond6 = 0, $scevgep684 = 0, $scevgep684685 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 560|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(560|0);
 $6 = sp + 8|0;
 $7 = sp;
 $8 = sp + 524|0;
 $9 = $8;
 $10 = sp + 512|0;
 HEAP32[$7>>2] = 0;
 $11 = ((($10)) + 12|0);
 (___DOUBLE_BITS($1)|0);
 $12 = tempRet0;
 $13 = ($12|0)<(0);
 if ($13) {
  $14 = -$1;
  $$0471 = $14;$$0520 = 1;$$0521 = 5526;
 } else {
  $15 = $4 & 2048;
  $16 = ($15|0)==(0);
  $17 = $4 & 1;
  $18 = ($17|0)==(0);
  $$ = $18 ? (5527) : (5532);
  $$$ = $16 ? $$ : (5529);
  $19 = $4 & 2049;
  $narrow = ($19|0)!=(0);
  $$534$ = $narrow&1;
  $$0471 = $1;$$0520 = $$534$;$$0521 = $$$;
 }
 (___DOUBLE_BITS($$0471)|0);
 $20 = tempRet0;
 $21 = $20 & 2146435072;
 $22 = ($21>>>0)<(2146435072);
 $23 = (0)<(0);
 $24 = ($21|0)==(2146435072);
 $25 = $24 & $23;
 $26 = $22 | $25;
 do {
  if ($26) {
   $35 = (+_frexpl($$0471,$7));
   $36 = $35 * 2.0;
   $37 = $36 != 0.0;
   if ($37) {
    $38 = HEAP32[$7>>2]|0;
    $39 = (($38) + -1)|0;
    HEAP32[$7>>2] = $39;
   }
   $40 = $5 | 32;
   $41 = ($40|0)==(97);
   if ($41) {
    $42 = $5 & 32;
    $43 = ($42|0)==(0);
    $44 = ((($$0521)) + 9|0);
    $$0521$ = $43 ? $$0521 : $44;
    $45 = $$0520 | 2;
    $46 = ($3>>>0)>(11);
    $47 = (12 - ($3))|0;
    $48 = ($47|0)==(0);
    $49 = $46 | $48;
    do {
     if ($49) {
      $$1472 = $36;
     } else {
      $$0509582 = 8.0;$$1508583 = $47;
      while(1) {
       $50 = (($$1508583) + -1)|0;
       $51 = $$0509582 * 16.0;
       $52 = ($50|0)==(0);
       if ($52) {
        break;
       } else {
        $$0509582 = $51;$$1508583 = $50;
       }
      }
      $53 = HEAP8[$$0521$>>0]|0;
      $54 = ($53<<24>>24)==(45);
      if ($54) {
       $55 = -$36;
       $56 = $55 - $51;
       $57 = $51 + $56;
       $58 = -$57;
       $$1472 = $58;
       break;
      } else {
       $59 = $36 + $51;
       $60 = $59 - $51;
       $$1472 = $60;
       break;
      }
     }
    } while(0);
    $61 = HEAP32[$7>>2]|0;
    $62 = ($61|0)<(0);
    $63 = (0 - ($61))|0;
    $64 = $62 ? $63 : $61;
    $65 = ($64|0)<(0);
    $66 = $65 << 31 >> 31;
    $67 = (_fmt_u($64,$66,$11)|0);
    $68 = ($67|0)==($11|0);
    if ($68) {
     $69 = ((($10)) + 11|0);
     HEAP8[$69>>0] = 48;
     $$0511 = $69;
    } else {
     $$0511 = $67;
    }
    $70 = $61 >> 31;
    $71 = $70 & 2;
    $72 = (($71) + 43)|0;
    $73 = $72&255;
    $74 = ((($$0511)) + -1|0);
    HEAP8[$74>>0] = $73;
    $75 = (($5) + 15)|0;
    $76 = $75&255;
    $77 = ((($$0511)) + -2|0);
    HEAP8[$77>>0] = $76;
    $notrhs = ($3|0)<(1);
    $78 = $4 & 8;
    $79 = ($78|0)==(0);
    $$0523 = $8;$$2473 = $$1472;
    while(1) {
     $80 = (~~(($$2473)));
     $81 = (5561 + ($80)|0);
     $82 = HEAP8[$81>>0]|0;
     $83 = $82&255;
     $84 = $83 | $42;
     $85 = $84&255;
     $86 = ((($$0523)) + 1|0);
     HEAP8[$$0523>>0] = $85;
     $87 = (+($80|0));
     $88 = $$2473 - $87;
     $89 = $88 * 16.0;
     $90 = $86;
     $91 = (($90) - ($9))|0;
     $92 = ($91|0)==(1);
     if ($92) {
      $notlhs = $89 == 0.0;
      $or$cond3$not = $notrhs & $notlhs;
      $or$cond = $79 & $or$cond3$not;
      if ($or$cond) {
       $$1524 = $86;
      } else {
       $93 = ((($$0523)) + 2|0);
       HEAP8[$86>>0] = 46;
       $$1524 = $93;
      }
     } else {
      $$1524 = $86;
     }
     $94 = $89 != 0.0;
     if ($94) {
      $$0523 = $$1524;$$2473 = $89;
     } else {
      break;
     }
    }
    $95 = ($3|0)!=(0);
    $96 = $77;
    $97 = $11;
    $98 = $$1524;
    $99 = (($98) - ($9))|0;
    $100 = (($97) - ($96))|0;
    $101 = (($99) + -2)|0;
    $102 = ($101|0)<($3|0);
    $or$cond537 = $95 & $102;
    $103 = (($3) + 2)|0;
    $$pn = $or$cond537 ? $103 : $99;
    $$0525 = (($100) + ($45))|0;
    $104 = (($$0525) + ($$pn))|0;
    _pad($0,32,$2,$104,$4);
    _out($0,$$0521$,$45);
    $105 = $4 ^ 65536;
    _pad($0,48,$2,$104,$105);
    _out($0,$8,$99);
    $106 = (($$pn) - ($99))|0;
    _pad($0,48,$106,0,0);
    _out($0,$77,$100);
    $107 = $4 ^ 8192;
    _pad($0,32,$2,$104,$107);
    $$sink562 = $104;
    break;
   }
   $108 = ($3|0)<(0);
   $$539 = $108 ? 6 : $3;
   if ($37) {
    $109 = $36 * 268435456.0;
    $110 = HEAP32[$7>>2]|0;
    $111 = (($110) + -28)|0;
    HEAP32[$7>>2] = $111;
    $$3 = $109;$$pr = $111;
   } else {
    $$pre = HEAP32[$7>>2]|0;
    $$3 = $36;$$pr = $$pre;
   }
   $112 = ($$pr|0)<(0);
   $113 = ((($6)) + 288|0);
   $$556 = $112 ? $6 : $113;
   $$0498 = $$556;$$4 = $$3;
   while(1) {
    $114 = (~~(($$4))>>>0);
    HEAP32[$$0498>>2] = $114;
    $115 = ((($$0498)) + 4|0);
    $116 = (+($114>>>0));
    $117 = $$4 - $116;
    $118 = $117 * 1.0E+9;
    $119 = $118 != 0.0;
    if ($119) {
     $$0498 = $115;$$4 = $118;
    } else {
     break;
    }
   }
   $120 = ($$pr|0)>(0);
   if ($120) {
    $$1482661 = $$556;$$1499660 = $115;$121 = $$pr;
    while(1) {
     $122 = ($121|0)<(29);
     $123 = $122 ? $121 : 29;
     $$0488653 = ((($$1499660)) + -4|0);
     $124 = ($$0488653>>>0)<($$1482661>>>0);
     if ($124) {
      $$2483$ph = $$1482661;
     } else {
      $$0488655 = $$0488653;$$0497654 = 0;
      while(1) {
       $125 = HEAP32[$$0488655>>2]|0;
       $126 = (_bitshift64Shl(($125|0),0,($123|0))|0);
       $127 = tempRet0;
       $128 = (_i64Add(($126|0),($127|0),($$0497654|0),0)|0);
       $129 = tempRet0;
       $130 = (___uremdi3(($128|0),($129|0),1000000000,0)|0);
       $131 = tempRet0;
       HEAP32[$$0488655>>2] = $130;
       $132 = (___udivdi3(($128|0),($129|0),1000000000,0)|0);
       $133 = tempRet0;
       $$0488 = ((($$0488655)) + -4|0);
       $134 = ($$0488>>>0)<($$1482661>>>0);
       if ($134) {
        break;
       } else {
        $$0488655 = $$0488;$$0497654 = $132;
       }
      }
      $135 = ($132|0)==(0);
      if ($135) {
       $$2483$ph = $$1482661;
      } else {
       $136 = ((($$1482661)) + -4|0);
       HEAP32[$136>>2] = $132;
       $$2483$ph = $136;
      }
     }
     $$2500 = $$1499660;
     while(1) {
      $137 = ($$2500>>>0)>($$2483$ph>>>0);
      if (!($137)) {
       break;
      }
      $138 = ((($$2500)) + -4|0);
      $139 = HEAP32[$138>>2]|0;
      $140 = ($139|0)==(0);
      if ($140) {
       $$2500 = $138;
      } else {
       break;
      }
     }
     $141 = HEAP32[$7>>2]|0;
     $142 = (($141) - ($123))|0;
     HEAP32[$7>>2] = $142;
     $143 = ($142|0)>(0);
     if ($143) {
      $$1482661 = $$2483$ph;$$1499660 = $$2500;$121 = $142;
     } else {
      $$1482$lcssa = $$2483$ph;$$1499$lcssa = $$2500;$$pr564 = $142;
      break;
     }
    }
   } else {
    $$1482$lcssa = $$556;$$1499$lcssa = $115;$$pr564 = $$pr;
   }
   $144 = ($$pr564|0)<(0);
   if ($144) {
    $145 = (($$539) + 25)|0;
    $146 = (($145|0) / 9)&-1;
    $147 = (($146) + 1)|0;
    $148 = ($40|0)==(102);
    $$3484648 = $$1482$lcssa;$$3501647 = $$1499$lcssa;$150 = $$pr564;
    while(1) {
     $149 = (0 - ($150))|0;
     $151 = ($149|0)<(9);
     $152 = $151 ? $149 : 9;
     $153 = ($$3484648>>>0)<($$3501647>>>0);
     if ($153) {
      $157 = 1 << $152;
      $158 = (($157) + -1)|0;
      $159 = 1000000000 >>> $152;
      $$0487642 = 0;$$1489641 = $$3484648;
      while(1) {
       $160 = HEAP32[$$1489641>>2]|0;
       $161 = $160 & $158;
       $162 = $160 >>> $152;
       $163 = (($162) + ($$0487642))|0;
       HEAP32[$$1489641>>2] = $163;
       $164 = Math_imul($161, $159)|0;
       $165 = ((($$1489641)) + 4|0);
       $166 = ($165>>>0)<($$3501647>>>0);
       if ($166) {
        $$0487642 = $164;$$1489641 = $165;
       } else {
        break;
       }
      }
      $167 = HEAP32[$$3484648>>2]|0;
      $168 = ($167|0)==(0);
      $169 = ((($$3484648)) + 4|0);
      $$$3484 = $168 ? $169 : $$3484648;
      $170 = ($164|0)==(0);
      if ($170) {
       $$$3484692 = $$$3484;$$4502 = $$3501647;
      } else {
       $171 = ((($$3501647)) + 4|0);
       HEAP32[$$3501647>>2] = $164;
       $$$3484692 = $$$3484;$$4502 = $171;
      }
     } else {
      $154 = HEAP32[$$3484648>>2]|0;
      $155 = ($154|0)==(0);
      $156 = ((($$3484648)) + 4|0);
      $$$3484691 = $155 ? $156 : $$3484648;
      $$$3484692 = $$$3484691;$$4502 = $$3501647;
     }
     $172 = $148 ? $$556 : $$$3484692;
     $173 = $$4502;
     $174 = $172;
     $175 = (($173) - ($174))|0;
     $176 = $175 >> 2;
     $177 = ($176|0)>($147|0);
     $178 = (($172) + ($147<<2)|0);
     $$$4502 = $177 ? $178 : $$4502;
     $179 = HEAP32[$7>>2]|0;
     $180 = (($179) + ($152))|0;
     HEAP32[$7>>2] = $180;
     $181 = ($180|0)<(0);
     if ($181) {
      $$3484648 = $$$3484692;$$3501647 = $$$4502;$150 = $180;
     } else {
      $$3484$lcssa = $$$3484692;$$3501$lcssa = $$$4502;
      break;
     }
    }
   } else {
    $$3484$lcssa = $$1482$lcssa;$$3501$lcssa = $$1499$lcssa;
   }
   $182 = ($$3484$lcssa>>>0)<($$3501$lcssa>>>0);
   $183 = $$556;
   if ($182) {
    $184 = $$3484$lcssa;
    $185 = (($183) - ($184))|0;
    $186 = $185 >> 2;
    $187 = ($186*9)|0;
    $188 = HEAP32[$$3484$lcssa>>2]|0;
    $189 = ($188>>>0)<(10);
    if ($189) {
     $$1515 = $187;
    } else {
     $$0514637 = $187;$$0530636 = 10;
     while(1) {
      $190 = ($$0530636*10)|0;
      $191 = (($$0514637) + 1)|0;
      $192 = ($188>>>0)<($190>>>0);
      if ($192) {
       $$1515 = $191;
       break;
      } else {
       $$0514637 = $191;$$0530636 = $190;
      }
     }
    }
   } else {
    $$1515 = 0;
   }
   $193 = ($40|0)!=(102);
   $194 = $193 ? $$1515 : 0;
   $195 = (($$539) - ($194))|0;
   $196 = ($40|0)==(103);
   $197 = ($$539|0)!=(0);
   $198 = $197 & $196;
   $$neg = $198 << 31 >> 31;
   $199 = (($195) + ($$neg))|0;
   $200 = $$3501$lcssa;
   $201 = (($200) - ($183))|0;
   $202 = $201 >> 2;
   $203 = ($202*9)|0;
   $204 = (($203) + -9)|0;
   $205 = ($199|0)<($204|0);
   if ($205) {
    $206 = ((($$556)) + 4|0);
    $207 = (($199) + 9216)|0;
    $208 = (($207|0) / 9)&-1;
    $209 = (($208) + -1024)|0;
    $210 = (($206) + ($209<<2)|0);
    $211 = (($207|0) % 9)&-1;
    $$0527629 = (($211) + 1)|0;
    $212 = ($$0527629|0)<(9);
    if ($212) {
     $$0527631 = $$0527629;$$1531630 = 10;
     while(1) {
      $213 = ($$1531630*10)|0;
      $$0527 = (($$0527631) + 1)|0;
      $exitcond = ($$0527|0)==(9);
      if ($exitcond) {
       $$1531$lcssa = $213;
       break;
      } else {
       $$0527631 = $$0527;$$1531630 = $213;
      }
     }
    } else {
     $$1531$lcssa = 10;
    }
    $214 = HEAP32[$210>>2]|0;
    $215 = (($214>>>0) % ($$1531$lcssa>>>0))&-1;
    $216 = ($215|0)==(0);
    $217 = ((($210)) + 4|0);
    $218 = ($217|0)==($$3501$lcssa|0);
    $or$cond541 = $218 & $216;
    if ($or$cond541) {
     $$4492 = $210;$$4518 = $$1515;$$8 = $$3484$lcssa;
    } else {
     $219 = (($214>>>0) / ($$1531$lcssa>>>0))&-1;
     $220 = $219 & 1;
     $221 = ($220|0)==(0);
     $$542 = $221 ? 9007199254740992.0 : 9007199254740994.0;
     $222 = (($$1531$lcssa|0) / 2)&-1;
     $223 = ($215>>>0)<($222>>>0);
     $224 = ($215|0)==($222|0);
     $or$cond544 = $218 & $224;
     $$559 = $or$cond544 ? 1.0 : 1.5;
     $$$559 = $223 ? 0.5 : $$559;
     $225 = ($$0520|0)==(0);
     if ($225) {
      $$1467 = $$$559;$$1469 = $$542;
     } else {
      $226 = HEAP8[$$0521>>0]|0;
      $227 = ($226<<24>>24)==(45);
      $228 = -$$542;
      $229 = -$$$559;
      $$$542 = $227 ? $228 : $$542;
      $$$$559 = $227 ? $229 : $$$559;
      $$1467 = $$$$559;$$1469 = $$$542;
     }
     $230 = (($214) - ($215))|0;
     HEAP32[$210>>2] = $230;
     $231 = $$1469 + $$1467;
     $232 = $231 != $$1469;
     if ($232) {
      $233 = (($230) + ($$1531$lcssa))|0;
      HEAP32[$210>>2] = $233;
      $234 = ($233>>>0)>(999999999);
      if ($234) {
       $$5486623 = $$3484$lcssa;$$sink545622 = $210;
       while(1) {
        $235 = ((($$sink545622)) + -4|0);
        HEAP32[$$sink545622>>2] = 0;
        $236 = ($235>>>0)<($$5486623>>>0);
        if ($236) {
         $237 = ((($$5486623)) + -4|0);
         HEAP32[$237>>2] = 0;
         $$6 = $237;
        } else {
         $$6 = $$5486623;
        }
        $238 = HEAP32[$235>>2]|0;
        $239 = (($238) + 1)|0;
        HEAP32[$235>>2] = $239;
        $240 = ($239>>>0)>(999999999);
        if ($240) {
         $$5486623 = $$6;$$sink545622 = $235;
        } else {
         $$5486$lcssa = $$6;$$sink545$lcssa = $235;
         break;
        }
       }
      } else {
       $$5486$lcssa = $$3484$lcssa;$$sink545$lcssa = $210;
      }
      $241 = $$5486$lcssa;
      $242 = (($183) - ($241))|0;
      $243 = $242 >> 2;
      $244 = ($243*9)|0;
      $245 = HEAP32[$$5486$lcssa>>2]|0;
      $246 = ($245>>>0)<(10);
      if ($246) {
       $$4492 = $$sink545$lcssa;$$4518 = $244;$$8 = $$5486$lcssa;
      } else {
       $$2516618 = $244;$$2532617 = 10;
       while(1) {
        $247 = ($$2532617*10)|0;
        $248 = (($$2516618) + 1)|0;
        $249 = ($245>>>0)<($247>>>0);
        if ($249) {
         $$4492 = $$sink545$lcssa;$$4518 = $248;$$8 = $$5486$lcssa;
         break;
        } else {
         $$2516618 = $248;$$2532617 = $247;
        }
       }
      }
     } else {
      $$4492 = $210;$$4518 = $$1515;$$8 = $$3484$lcssa;
     }
    }
    $250 = ((($$4492)) + 4|0);
    $251 = ($$3501$lcssa>>>0)>($250>>>0);
    $$$3501 = $251 ? $250 : $$3501$lcssa;
    $$5519$ph = $$4518;$$7505$ph = $$$3501;$$9$ph = $$8;
   } else {
    $$5519$ph = $$1515;$$7505$ph = $$3501$lcssa;$$9$ph = $$3484$lcssa;
   }
   $$7505 = $$7505$ph;
   while(1) {
    $252 = ($$7505>>>0)>($$9$ph>>>0);
    if (!($252)) {
     $$lcssa673 = 0;
     break;
    }
    $253 = ((($$7505)) + -4|0);
    $254 = HEAP32[$253>>2]|0;
    $255 = ($254|0)==(0);
    if ($255) {
     $$7505 = $253;
    } else {
     $$lcssa673 = 1;
     break;
    }
   }
   $256 = (0 - ($$5519$ph))|0;
   do {
    if ($196) {
     $not$ = $197 ^ 1;
     $257 = $not$&1;
     $$539$ = (($257) + ($$539))|0;
     $258 = ($$539$|0)>($$5519$ph|0);
     $259 = ($$5519$ph|0)>(-5);
     $or$cond6 = $258 & $259;
     if ($or$cond6) {
      $260 = (($5) + -1)|0;
      $$neg567 = (($$539$) + -1)|0;
      $261 = (($$neg567) - ($$5519$ph))|0;
      $$0479 = $260;$$2476 = $261;
     } else {
      $262 = (($5) + -2)|0;
      $263 = (($$539$) + -1)|0;
      $$0479 = $262;$$2476 = $263;
     }
     $264 = $4 & 8;
     $265 = ($264|0)==(0);
     if ($265) {
      if ($$lcssa673) {
       $266 = ((($$7505)) + -4|0);
       $267 = HEAP32[$266>>2]|0;
       $268 = ($267|0)==(0);
       if ($268) {
        $$2529 = 9;
       } else {
        $269 = (($267>>>0) % 10)&-1;
        $270 = ($269|0)==(0);
        if ($270) {
         $$1528614 = 0;$$3533613 = 10;
         while(1) {
          $271 = ($$3533613*10)|0;
          $272 = (($$1528614) + 1)|0;
          $273 = (($267>>>0) % ($271>>>0))&-1;
          $274 = ($273|0)==(0);
          if ($274) {
           $$1528614 = $272;$$3533613 = $271;
          } else {
           $$2529 = $272;
           break;
          }
         }
        } else {
         $$2529 = 0;
        }
       }
      } else {
       $$2529 = 9;
      }
      $275 = $$0479 | 32;
      $276 = ($275|0)==(102);
      $277 = $$7505;
      $278 = (($277) - ($183))|0;
      $279 = $278 >> 2;
      $280 = ($279*9)|0;
      $281 = (($280) + -9)|0;
      if ($276) {
       $282 = (($281) - ($$2529))|0;
       $283 = ($282|0)>(0);
       $$546 = $283 ? $282 : 0;
       $284 = ($$2476|0)<($$546|0);
       $$2476$$547 = $284 ? $$2476 : $$546;
       $$1480 = $$0479;$$3477 = $$2476$$547;$$pre$phi690Z2D = 0;
       break;
      } else {
       $285 = (($281) + ($$5519$ph))|0;
       $286 = (($285) - ($$2529))|0;
       $287 = ($286|0)>(0);
       $$548 = $287 ? $286 : 0;
       $288 = ($$2476|0)<($$548|0);
       $$2476$$549 = $288 ? $$2476 : $$548;
       $$1480 = $$0479;$$3477 = $$2476$$549;$$pre$phi690Z2D = 0;
       break;
      }
     } else {
      $$1480 = $$0479;$$3477 = $$2476;$$pre$phi690Z2D = $264;
     }
    } else {
     $$pre689 = $4 & 8;
     $$1480 = $5;$$3477 = $$539;$$pre$phi690Z2D = $$pre689;
    }
   } while(0);
   $289 = $$3477 | $$pre$phi690Z2D;
   $290 = ($289|0)!=(0);
   $291 = $290&1;
   $292 = $$1480 | 32;
   $293 = ($292|0)==(102);
   if ($293) {
    $294 = ($$5519$ph|0)>(0);
    $295 = $294 ? $$5519$ph : 0;
    $$2513 = 0;$$pn566 = $295;
   } else {
    $296 = ($$5519$ph|0)<(0);
    $297 = $296 ? $256 : $$5519$ph;
    $298 = ($297|0)<(0);
    $299 = $298 << 31 >> 31;
    $300 = (_fmt_u($297,$299,$11)|0);
    $301 = $11;
    $302 = $300;
    $303 = (($301) - ($302))|0;
    $304 = ($303|0)<(2);
    if ($304) {
     $$1512607 = $300;
     while(1) {
      $305 = ((($$1512607)) + -1|0);
      HEAP8[$305>>0] = 48;
      $306 = $305;
      $307 = (($301) - ($306))|0;
      $308 = ($307|0)<(2);
      if ($308) {
       $$1512607 = $305;
      } else {
       $$1512$lcssa = $305;
       break;
      }
     }
    } else {
     $$1512$lcssa = $300;
    }
    $309 = $$5519$ph >> 31;
    $310 = $309 & 2;
    $311 = (($310) + 43)|0;
    $312 = $311&255;
    $313 = ((($$1512$lcssa)) + -1|0);
    HEAP8[$313>>0] = $312;
    $314 = $$1480&255;
    $315 = ((($$1512$lcssa)) + -2|0);
    HEAP8[$315>>0] = $314;
    $316 = $315;
    $317 = (($301) - ($316))|0;
    $$2513 = $315;$$pn566 = $317;
   }
   $318 = (($$0520) + 1)|0;
   $319 = (($318) + ($$3477))|0;
   $$1526 = (($319) + ($291))|0;
   $320 = (($$1526) + ($$pn566))|0;
   _pad($0,32,$2,$320,$4);
   _out($0,$$0521,$$0520);
   $321 = $4 ^ 65536;
   _pad($0,48,$2,$320,$321);
   if ($293) {
    $322 = ($$9$ph>>>0)>($$556>>>0);
    $$0496$$9 = $322 ? $$556 : $$9$ph;
    $323 = ((($8)) + 9|0);
    $324 = $323;
    $325 = ((($8)) + 8|0);
    $$5493597 = $$0496$$9;
    while(1) {
     $326 = HEAP32[$$5493597>>2]|0;
     $327 = (_fmt_u($326,0,$323)|0);
     $328 = ($$5493597|0)==($$0496$$9|0);
     if ($328) {
      $334 = ($327|0)==($323|0);
      if ($334) {
       HEAP8[$325>>0] = 48;
       $$1465 = $325;
      } else {
       $$1465 = $327;
      }
     } else {
      $329 = ($327>>>0)>($8>>>0);
      if ($329) {
       $330 = $327;
       $331 = (($330) - ($9))|0;
       _memset(($8|0),48,($331|0))|0;
       $$0464594 = $327;
       while(1) {
        $332 = ((($$0464594)) + -1|0);
        $333 = ($332>>>0)>($8>>>0);
        if ($333) {
         $$0464594 = $332;
        } else {
         $$1465 = $332;
         break;
        }
       }
      } else {
       $$1465 = $327;
      }
     }
     $335 = $$1465;
     $336 = (($324) - ($335))|0;
     _out($0,$$1465,$336);
     $337 = ((($$5493597)) + 4|0);
     $338 = ($337>>>0)>($$556>>>0);
     if ($338) {
      break;
     } else {
      $$5493597 = $337;
     }
    }
    $339 = ($289|0)==(0);
    if (!($339)) {
     _out($0,5577,1);
    }
    $340 = ($337>>>0)<($$7505>>>0);
    $341 = ($$3477|0)>(0);
    $342 = $340 & $341;
    if ($342) {
     $$4478590 = $$3477;$$6494589 = $337;
     while(1) {
      $343 = HEAP32[$$6494589>>2]|0;
      $344 = (_fmt_u($343,0,$323)|0);
      $345 = ($344>>>0)>($8>>>0);
      if ($345) {
       $346 = $344;
       $347 = (($346) - ($9))|0;
       _memset(($8|0),48,($347|0))|0;
       $$0463584 = $344;
       while(1) {
        $348 = ((($$0463584)) + -1|0);
        $349 = ($348>>>0)>($8>>>0);
        if ($349) {
         $$0463584 = $348;
        } else {
         $$0463$lcssa = $348;
         break;
        }
       }
      } else {
       $$0463$lcssa = $344;
      }
      $350 = ($$4478590|0)<(9);
      $351 = $350 ? $$4478590 : 9;
      _out($0,$$0463$lcssa,$351);
      $352 = ((($$6494589)) + 4|0);
      $353 = (($$4478590) + -9)|0;
      $354 = ($352>>>0)<($$7505>>>0);
      $355 = ($$4478590|0)>(9);
      $356 = $354 & $355;
      if ($356) {
       $$4478590 = $353;$$6494589 = $352;
      } else {
       $$4478$lcssa = $353;
       break;
      }
     }
    } else {
     $$4478$lcssa = $$3477;
    }
    $357 = (($$4478$lcssa) + 9)|0;
    _pad($0,48,$357,9,0);
   } else {
    $358 = ((($$9$ph)) + 4|0);
    $$7505$ = $$lcssa673 ? $$7505 : $358;
    $359 = ($$3477|0)>(-1);
    if ($359) {
     $360 = ((($8)) + 9|0);
     $361 = ($$pre$phi690Z2D|0)==(0);
     $362 = $360;
     $363 = (0 - ($9))|0;
     $364 = ((($8)) + 8|0);
     $$5602 = $$3477;$$7495601 = $$9$ph;
     while(1) {
      $365 = HEAP32[$$7495601>>2]|0;
      $366 = (_fmt_u($365,0,$360)|0);
      $367 = ($366|0)==($360|0);
      if ($367) {
       HEAP8[$364>>0] = 48;
       $$0 = $364;
      } else {
       $$0 = $366;
      }
      $368 = ($$7495601|0)==($$9$ph|0);
      do {
       if ($368) {
        $372 = ((($$0)) + 1|0);
        _out($0,$$0,1);
        $373 = ($$5602|0)<(1);
        $or$cond554 = $361 & $373;
        if ($or$cond554) {
         $$2 = $372;
         break;
        }
        _out($0,5577,1);
        $$2 = $372;
       } else {
        $369 = ($$0>>>0)>($8>>>0);
        if (!($369)) {
         $$2 = $$0;
         break;
        }
        $scevgep684 = (($$0) + ($363)|0);
        $scevgep684685 = $scevgep684;
        _memset(($8|0),48,($scevgep684685|0))|0;
        $$1598 = $$0;
        while(1) {
         $370 = ((($$1598)) + -1|0);
         $371 = ($370>>>0)>($8>>>0);
         if ($371) {
          $$1598 = $370;
         } else {
          $$2 = $370;
          break;
         }
        }
       }
      } while(0);
      $374 = $$2;
      $375 = (($362) - ($374))|0;
      $376 = ($$5602|0)>($375|0);
      $377 = $376 ? $375 : $$5602;
      _out($0,$$2,$377);
      $378 = (($$5602) - ($375))|0;
      $379 = ((($$7495601)) + 4|0);
      $380 = ($379>>>0)<($$7505$>>>0);
      $381 = ($378|0)>(-1);
      $382 = $380 & $381;
      if ($382) {
       $$5602 = $378;$$7495601 = $379;
      } else {
       $$5$lcssa = $378;
       break;
      }
     }
    } else {
     $$5$lcssa = $$3477;
    }
    $383 = (($$5$lcssa) + 18)|0;
    _pad($0,48,$383,18,0);
    $384 = $11;
    $385 = $$2513;
    $386 = (($384) - ($385))|0;
    _out($0,$$2513,$386);
   }
   $387 = $4 ^ 8192;
   _pad($0,32,$2,$320,$387);
   $$sink562 = $320;
  } else {
   $27 = $5 & 32;
   $28 = ($27|0)!=(0);
   $29 = $28 ? 5545 : 5549;
   $30 = ($$0471 != $$0471) | (0.0 != 0.0);
   $31 = $28 ? 5553 : 5557;
   $$0510 = $30 ? $31 : $29;
   $32 = (($$0520) + 3)|0;
   $33 = $4 & -65537;
   _pad($0,32,$2,$32,$33);
   _out($0,$$0521,$$0520);
   _out($0,$$0510,3);
   $34 = $4 ^ 8192;
   _pad($0,32,$2,$32,$34);
   $$sink562 = $32;
  }
 } while(0);
 $388 = ($$sink562|0)<($2|0);
 $$555 = $388 ? $2 : $$sink562;
 STACKTOP = sp;return ($$555|0);
}
function ___DOUBLE_BITS($0) {
 $0 = +$0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $0;$1 = HEAP32[tempDoublePtr>>2]|0;
 $2 = HEAP32[tempDoublePtr+4>>2]|0;
 tempRet0 = ($2);
 return ($1|0);
}
function _frexpl($0,$1) {
 $0 = +$0;
 $1 = $1|0;
 var $2 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = (+_frexp($0,$1));
 return (+$2);
}
function _frexp($0,$1) {
 $0 = +$0;
 $1 = $1|0;
 var $$0 = 0.0, $$016 = 0.0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0.0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0.0, $9 = 0.0, $storemerge = 0, $trunc$clear = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $0;$2 = HEAP32[tempDoublePtr>>2]|0;
 $3 = HEAP32[tempDoublePtr+4>>2]|0;
 $4 = (_bitshift64Lshr(($2|0),($3|0),52)|0);
 $5 = tempRet0;
 $6 = $4&65535;
 $trunc$clear = $6 & 2047;
 switch ($trunc$clear<<16>>16) {
 case 0:  {
  $7 = $0 != 0.0;
  if ($7) {
   $8 = $0 * 1.8446744073709552E+19;
   $9 = (+_frexp($8,$1));
   $10 = HEAP32[$1>>2]|0;
   $11 = (($10) + -64)|0;
   $$016 = $9;$storemerge = $11;
  } else {
   $$016 = $0;$storemerge = 0;
  }
  HEAP32[$1>>2] = $storemerge;
  $$0 = $$016;
  break;
 }
 case 2047:  {
  $$0 = $0;
  break;
 }
 default: {
  $12 = $4 & 2047;
  $13 = (($12) + -1022)|0;
  HEAP32[$1>>2] = $13;
  $14 = $3 & -2146435073;
  $15 = $14 | 1071644672;
  HEAP32[tempDoublePtr>>2] = $2;HEAP32[tempDoublePtr+4>>2] = $15;$16 = +HEAPF64[tempDoublePtr>>3];
  $$0 = $16;
 }
 }
 return (+$$0);
}
function ___pthread_self_612() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_pthread_self()|0);
 return ($0|0);
}
function ___strerror_l($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$012$lcssa = 0, $$01214 = 0, $$016 = 0, $$113 = 0, $$115 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $$016 = 0;
 while(1) {
  $3 = (5579 + ($$016)|0);
  $4 = HEAP8[$3>>0]|0;
  $5 = $4&255;
  $6 = ($5|0)==($0|0);
  if ($6) {
   label = 2;
   break;
  }
  $7 = (($$016) + 1)|0;
  $8 = ($7|0)==(87);
  if ($8) {
   $$01214 = 5667;$$115 = 87;
   label = 5;
   break;
  } else {
   $$016 = $7;
  }
 }
 if ((label|0) == 2) {
  $2 = ($$016|0)==(0);
  if ($2) {
   $$012$lcssa = 5667;
  } else {
   $$01214 = 5667;$$115 = $$016;
   label = 5;
  }
 }
 if ((label|0) == 5) {
  while(1) {
   label = 0;
   $$113 = $$01214;
   while(1) {
    $9 = HEAP8[$$113>>0]|0;
    $10 = ($9<<24>>24)==(0);
    $11 = ((($$113)) + 1|0);
    if ($10) {
     break;
    } else {
     $$113 = $11;
    }
   }
   $12 = (($$115) + -1)|0;
   $13 = ($12|0)==(0);
   if ($13) {
    $$012$lcssa = $11;
    break;
   } else {
    $$01214 = $11;$$115 = $12;
    label = 5;
   }
  }
 }
 $14 = ((($1)) + 20|0);
 $15 = HEAP32[$14>>2]|0;
 $16 = (___lctrans($$012$lcssa,$15)|0);
 return ($16|0);
}
function ___lctrans($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = (___lctrans_impl($0,$1)|0);
 return ($2|0);
}
function ___lctrans_impl($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$0 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($1|0)==(0|0);
 if ($2) {
  $$0 = 0;
 } else {
  $3 = HEAP32[$1>>2]|0;
  $4 = ((($1)) + 4|0);
  $5 = HEAP32[$4>>2]|0;
  $6 = (___mo_lookup($3,$5,$0)|0);
  $$0 = $6;
 }
 $7 = ($$0|0)!=(0|0);
 $8 = $7 ? $$0 : $0;
 return ($8|0);
}
function ___mo_lookup($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$ = 0, $$090 = 0, $$094 = 0, $$191 = 0, $$195 = 0, $$4 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond102 = 0, $or$cond104 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = HEAP32[$0>>2]|0;
 $4 = (($3) + 1794895138)|0;
 $5 = ((($0)) + 8|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = (_swapc($6,$4)|0);
 $8 = ((($0)) + 12|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = (_swapc($9,$4)|0);
 $11 = ((($0)) + 16|0);
 $12 = HEAP32[$11>>2]|0;
 $13 = (_swapc($12,$4)|0);
 $14 = $1 >>> 2;
 $15 = ($7>>>0)<($14>>>0);
 L1: do {
  if ($15) {
   $16 = $7 << 2;
   $17 = (($1) - ($16))|0;
   $18 = ($10>>>0)<($17>>>0);
   $19 = ($13>>>0)<($17>>>0);
   $or$cond = $18 & $19;
   if ($or$cond) {
    $20 = $13 | $10;
    $21 = $20 & 3;
    $22 = ($21|0)==(0);
    if ($22) {
     $23 = $10 >>> 2;
     $24 = $13 >>> 2;
     $$090 = 0;$$094 = $7;
     while(1) {
      $25 = $$094 >>> 1;
      $26 = (($$090) + ($25))|0;
      $27 = $26 << 1;
      $28 = (($27) + ($23))|0;
      $29 = (($0) + ($28<<2)|0);
      $30 = HEAP32[$29>>2]|0;
      $31 = (_swapc($30,$4)|0);
      $32 = (($28) + 1)|0;
      $33 = (($0) + ($32<<2)|0);
      $34 = HEAP32[$33>>2]|0;
      $35 = (_swapc($34,$4)|0);
      $36 = ($35>>>0)<($1>>>0);
      $37 = (($1) - ($35))|0;
      $38 = ($31>>>0)<($37>>>0);
      $or$cond102 = $36 & $38;
      if (!($or$cond102)) {
       $$4 = 0;
       break L1;
      }
      $39 = (($35) + ($31))|0;
      $40 = (($0) + ($39)|0);
      $41 = HEAP8[$40>>0]|0;
      $42 = ($41<<24>>24)==(0);
      if (!($42)) {
       $$4 = 0;
       break L1;
      }
      $43 = (($0) + ($35)|0);
      $44 = (_strcmp($2,$43)|0);
      $45 = ($44|0)==(0);
      if ($45) {
       break;
      }
      $62 = ($$094|0)==(1);
      $63 = ($44|0)<(0);
      $64 = (($$094) - ($25))|0;
      $$195 = $63 ? $25 : $64;
      $$191 = $63 ? $$090 : $26;
      if ($62) {
       $$4 = 0;
       break L1;
      } else {
       $$090 = $$191;$$094 = $$195;
      }
     }
     $46 = (($27) + ($24))|0;
     $47 = (($0) + ($46<<2)|0);
     $48 = HEAP32[$47>>2]|0;
     $49 = (_swapc($48,$4)|0);
     $50 = (($46) + 1)|0;
     $51 = (($0) + ($50<<2)|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = (_swapc($52,$4)|0);
     $54 = ($53>>>0)<($1>>>0);
     $55 = (($1) - ($53))|0;
     $56 = ($49>>>0)<($55>>>0);
     $or$cond104 = $54 & $56;
     if ($or$cond104) {
      $57 = (($0) + ($53)|0);
      $58 = (($53) + ($49))|0;
      $59 = (($0) + ($58)|0);
      $60 = HEAP8[$59>>0]|0;
      $61 = ($60<<24>>24)==(0);
      $$ = $61 ? $57 : 0;
      $$4 = $$;
     } else {
      $$4 = 0;
     }
    } else {
     $$4 = 0;
    }
   } else {
    $$4 = 0;
   }
  } else {
   $$4 = 0;
  }
 } while(0);
 return ($$4|0);
}
function _swapc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$ = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($1|0)==(0);
 $3 = (_llvm_bswap_i32(($0|0))|0);
 $$ = $2 ? $0 : $3;
 return ($$|0);
}
function _strcmp($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$011 = 0, $$0710 = 0, $$lcssa = 0, $$lcssa8 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $2 = HEAP8[$0>>0]|0;
 $3 = HEAP8[$1>>0]|0;
 $4 = ($2<<24>>24)!=($3<<24>>24);
 $5 = ($2<<24>>24)==(0);
 $or$cond9 = $5 | $4;
 if ($or$cond9) {
  $$lcssa = $3;$$lcssa8 = $2;
 } else {
  $$011 = $1;$$0710 = $0;
  while(1) {
   $6 = ((($$0710)) + 1|0);
   $7 = ((($$011)) + 1|0);
   $8 = HEAP8[$6>>0]|0;
   $9 = HEAP8[$7>>0]|0;
   $10 = ($8<<24>>24)!=($9<<24>>24);
   $11 = ($8<<24>>24)==(0);
   $or$cond = $11 | $10;
   if ($or$cond) {
    $$lcssa = $9;$$lcssa8 = $8;
    break;
   } else {
    $$011 = $7;$$0710 = $6;
   }
  }
 }
 $12 = $$lcssa8&255;
 $13 = $$lcssa&255;
 $14 = (($12) - ($13))|0;
 return ($14|0);
}
function _wcrtomb($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $not$ = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($0|0)==(0|0);
 do {
  if ($3) {
   $$0 = 1;
  } else {
   $4 = ($1>>>0)<(128);
   if ($4) {
    $5 = $1&255;
    HEAP8[$0>>0] = $5;
    $$0 = 1;
    break;
   }
   $6 = (___pthread_self_292()|0);
   $7 = ((($6)) + 188|0);
   $8 = HEAP32[$7>>2]|0;
   $9 = HEAP32[$8>>2]|0;
   $not$ = ($9|0)==(0|0);
   if ($not$) {
    $10 = $1 & -128;
    $11 = ($10|0)==(57216);
    if ($11) {
     $13 = $1&255;
     HEAP8[$0>>0] = $13;
     $$0 = 1;
     break;
    } else {
     $12 = (___errno_location()|0);
     HEAP32[$12>>2] = 84;
     $$0 = -1;
     break;
    }
   }
   $14 = ($1>>>0)<(2048);
   if ($14) {
    $15 = $1 >>> 6;
    $16 = $15 | 192;
    $17 = $16&255;
    $18 = ((($0)) + 1|0);
    HEAP8[$0>>0] = $17;
    $19 = $1 & 63;
    $20 = $19 | 128;
    $21 = $20&255;
    HEAP8[$18>>0] = $21;
    $$0 = 2;
    break;
   }
   $22 = ($1>>>0)<(55296);
   $23 = $1 & -8192;
   $24 = ($23|0)==(57344);
   $or$cond = $22 | $24;
   if ($or$cond) {
    $25 = $1 >>> 12;
    $26 = $25 | 224;
    $27 = $26&255;
    $28 = ((($0)) + 1|0);
    HEAP8[$0>>0] = $27;
    $29 = $1 >>> 6;
    $30 = $29 & 63;
    $31 = $30 | 128;
    $32 = $31&255;
    $33 = ((($0)) + 2|0);
    HEAP8[$28>>0] = $32;
    $34 = $1 & 63;
    $35 = $34 | 128;
    $36 = $35&255;
    HEAP8[$33>>0] = $36;
    $$0 = 3;
    break;
   }
   $37 = (($1) + -65536)|0;
   $38 = ($37>>>0)<(1048576);
   if ($38) {
    $39 = $1 >>> 18;
    $40 = $39 | 240;
    $41 = $40&255;
    $42 = ((($0)) + 1|0);
    HEAP8[$0>>0] = $41;
    $43 = $1 >>> 12;
    $44 = $43 & 63;
    $45 = $44 | 128;
    $46 = $45&255;
    $47 = ((($0)) + 2|0);
    HEAP8[$42>>0] = $46;
    $48 = $1 >>> 6;
    $49 = $48 & 63;
    $50 = $49 | 128;
    $51 = $50&255;
    $52 = ((($0)) + 3|0);
    HEAP8[$47>>0] = $51;
    $53 = $1 & 63;
    $54 = $53 | 128;
    $55 = $54&255;
    HEAP8[$52>>0] = $55;
    $$0 = 4;
    break;
   } else {
    $56 = (___errno_location()|0);
    HEAP32[$56>>2] = 84;
    $$0 = -1;
    break;
   }
  }
 } while(0);
 return ($$0|0);
}
function ___pthread_self_292() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_pthread_self()|0);
 return ($0|0);
}
function ___overflow($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$0 = 0, $$pre = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = sp;
 $3 = $1&255;
 HEAP8[$2>>0] = $3;
 $4 = ((($0)) + 16|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = ($5|0)==(0|0);
 if ($6) {
  $7 = (___towrite($0)|0);
  $8 = ($7|0)==(0);
  if ($8) {
   $$pre = HEAP32[$4>>2]|0;
   $12 = $$pre;
   label = 4;
  } else {
   $$0 = -1;
  }
 } else {
  $12 = $5;
  label = 4;
 }
 do {
  if ((label|0) == 4) {
   $9 = ((($0)) + 20|0);
   $10 = HEAP32[$9>>2]|0;
   $11 = ($10>>>0)<($12>>>0);
   if ($11) {
    $13 = $1 & 255;
    $14 = ((($0)) + 75|0);
    $15 = HEAP8[$14>>0]|0;
    $16 = $15 << 24 >> 24;
    $17 = ($13|0)==($16|0);
    if (!($17)) {
     $18 = ((($10)) + 1|0);
     HEAP32[$9>>2] = $18;
     HEAP8[$10>>0] = $3;
     $$0 = $13;
     break;
    }
   }
   $19 = ((($0)) + 36|0);
   $20 = HEAP32[$19>>2]|0;
   $21 = (FUNCTION_TABLE_iiii[$20 & 127]($0,$2,1)|0);
   $22 = ($21|0)==(1);
   if ($22) {
    $23 = HEAP8[$2>>0]|0;
    $24 = $23&255;
    $$0 = $24;
   } else {
    $$0 = -1;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function ___ofl_lock() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 ___lock((8840|0));
 return (8848|0);
}
function ___ofl_unlock() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 ___unlock((8840|0));
 return;
}
function _fflush($0) {
 $0 = $0|0;
 var $$0 = 0, $$023 = 0, $$02325 = 0, $$02327 = 0, $$024$lcssa = 0, $$02426 = 0, $$1 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0|0)==(0|0);
 do {
  if ($1) {
   $8 = HEAP32[311]|0;
   $9 = ($8|0)==(0|0);
   if ($9) {
    $29 = 0;
   } else {
    $10 = HEAP32[311]|0;
    $11 = (_fflush($10)|0);
    $29 = $11;
   }
   $12 = (___ofl_lock()|0);
   $$02325 = HEAP32[$12>>2]|0;
   $13 = ($$02325|0)==(0|0);
   if ($13) {
    $$024$lcssa = $29;
   } else {
    $$02327 = $$02325;$$02426 = $29;
    while(1) {
     $14 = ((($$02327)) + 76|0);
     $15 = HEAP32[$14>>2]|0;
     $16 = ($15|0)>(-1);
     if ($16) {
      $17 = (___lockfile($$02327)|0);
      $25 = $17;
     } else {
      $25 = 0;
     }
     $18 = ((($$02327)) + 20|0);
     $19 = HEAP32[$18>>2]|0;
     $20 = ((($$02327)) + 28|0);
     $21 = HEAP32[$20>>2]|0;
     $22 = ($19>>>0)>($21>>>0);
     if ($22) {
      $23 = (___fflush_unlocked($$02327)|0);
      $24 = $23 | $$02426;
      $$1 = $24;
     } else {
      $$1 = $$02426;
     }
     $26 = ($25|0)==(0);
     if (!($26)) {
      ___unlockfile($$02327);
     }
     $27 = ((($$02327)) + 56|0);
     $$023 = HEAP32[$27>>2]|0;
     $28 = ($$023|0)==(0|0);
     if ($28) {
      $$024$lcssa = $$1;
      break;
     } else {
      $$02327 = $$023;$$02426 = $$1;
     }
    }
   }
   ___ofl_unlock();
   $$0 = $$024$lcssa;
  } else {
   $2 = ((($0)) + 76|0);
   $3 = HEAP32[$2>>2]|0;
   $4 = ($3|0)>(-1);
   if (!($4)) {
    $5 = (___fflush_unlocked($0)|0);
    $$0 = $5;
    break;
   }
   $6 = (___lockfile($0)|0);
   $phitmp = ($6|0)==(0);
   $7 = (___fflush_unlocked($0)|0);
   if ($phitmp) {
    $$0 = $7;
   } else {
    ___unlockfile($0);
    $$0 = $7;
   }
  }
 } while(0);
 return ($$0|0);
}
function ___fflush_unlocked($0) {
 $0 = $0|0;
 var $$0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 20|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ((($0)) + 28|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = ($2>>>0)>($4>>>0);
 if ($5) {
  $6 = ((($0)) + 36|0);
  $7 = HEAP32[$6>>2]|0;
  (FUNCTION_TABLE_iiii[$7 & 127]($0,0,0)|0);
  $8 = HEAP32[$1>>2]|0;
  $9 = ($8|0)==(0|0);
  if ($9) {
   $$0 = -1;
  } else {
   label = 3;
  }
 } else {
  label = 3;
 }
 if ((label|0) == 3) {
  $10 = ((($0)) + 4|0);
  $11 = HEAP32[$10>>2]|0;
  $12 = ((($0)) + 8|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ($11>>>0)<($13>>>0);
  if ($14) {
   $15 = $11;
   $16 = $13;
   $17 = (($15) - ($16))|0;
   $18 = ((($0)) + 40|0);
   $19 = HEAP32[$18>>2]|0;
   (FUNCTION_TABLE_iiii[$19 & 127]($0,$17,1)|0);
  }
  $20 = ((($0)) + 16|0);
  HEAP32[$20>>2] = 0;
  HEAP32[$3>>2] = 0;
  HEAP32[$1>>2] = 0;
  HEAP32[$12>>2] = 0;
  HEAP32[$10>>2] = 0;
  $$0 = 0;
 }
 return ($$0|0);
}
function _strlen($0) {
 $0 = $0|0;
 var $$0 = 0, $$015$lcssa = 0, $$01519 = 0, $$1$lcssa = 0, $$pn = 0, $$pre = 0, $$sink = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = $0;
 $2 = $1 & 3;
 $3 = ($2|0)==(0);
 L1: do {
  if ($3) {
   $$015$lcssa = $0;
   label = 4;
  } else {
   $$01519 = $0;$23 = $1;
   while(1) {
    $4 = HEAP8[$$01519>>0]|0;
    $5 = ($4<<24>>24)==(0);
    if ($5) {
     $$sink = $23;
     break L1;
    }
    $6 = ((($$01519)) + 1|0);
    $7 = $6;
    $8 = $7 & 3;
    $9 = ($8|0)==(0);
    if ($9) {
     $$015$lcssa = $6;
     label = 4;
     break;
    } else {
     $$01519 = $6;$23 = $7;
    }
   }
  }
 } while(0);
 if ((label|0) == 4) {
  $$0 = $$015$lcssa;
  while(1) {
   $10 = HEAP32[$$0>>2]|0;
   $11 = (($10) + -16843009)|0;
   $12 = $10 & -2139062144;
   $13 = $12 ^ -2139062144;
   $14 = $13 & $11;
   $15 = ($14|0)==(0);
   $16 = ((($$0)) + 4|0);
   if ($15) {
    $$0 = $16;
   } else {
    break;
   }
  }
  $17 = $10&255;
  $18 = ($17<<24>>24)==(0);
  if ($18) {
   $$1$lcssa = $$0;
  } else {
   $$pn = $$0;
   while(1) {
    $19 = ((($$pn)) + 1|0);
    $$pre = HEAP8[$19>>0]|0;
    $20 = ($$pre<<24>>24)==(0);
    if ($20) {
     $$1$lcssa = $19;
     break;
    } else {
     $$pn = $19;
    }
   }
  }
  $21 = $$1$lcssa;
  $$sink = $21;
 }
 $22 = (($$sink) - ($1))|0;
 return ($22|0);
}
function _fputc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ((($1)) + 76|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ($3|0)<(0);
 $5 = $0&255;
 $6 = $0 & 255;
 if ($4) {
  label = 3;
 } else {
  $7 = (___lockfile($1)|0);
  $8 = ($7|0)==(0);
  if ($8) {
   label = 3;
  } else {
   $20 = ((($1)) + 75|0);
   $21 = HEAP8[$20>>0]|0;
   $22 = $21 << 24 >> 24;
   $23 = ($6|0)==($22|0);
   if ($23) {
    label = 10;
   } else {
    $24 = ((($1)) + 20|0);
    $25 = HEAP32[$24>>2]|0;
    $26 = ((($1)) + 16|0);
    $27 = HEAP32[$26>>2]|0;
    $28 = ($25>>>0)<($27>>>0);
    if ($28) {
     $29 = ((($25)) + 1|0);
     HEAP32[$24>>2] = $29;
     HEAP8[$25>>0] = $5;
     $31 = $6;
    } else {
     label = 10;
    }
   }
   if ((label|0) == 10) {
    $30 = (___overflow($1,$0)|0);
    $31 = $30;
   }
   ___unlockfile($1);
   $$0 = $31;
  }
 }
 do {
  if ((label|0) == 3) {
   $9 = ((($1)) + 75|0);
   $10 = HEAP8[$9>>0]|0;
   $11 = $10 << 24 >> 24;
   $12 = ($6|0)==($11|0);
   if (!($12)) {
    $13 = ((($1)) + 20|0);
    $14 = HEAP32[$13>>2]|0;
    $15 = ((($1)) + 16|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ($14>>>0)<($16>>>0);
    if ($17) {
     $18 = ((($14)) + 1|0);
     HEAP32[$13>>2] = $18;
     HEAP8[$14>>0] = $5;
     $$0 = $6;
     break;
    }
   }
   $19 = (___overflow($1,$0)|0);
   $$0 = $19;
  }
 } while(0);
 return ($$0|0);
}
function ___strdup($0) {
 $0 = $0|0;
 var $$0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = (_strlen($0)|0);
 $2 = (($1) + 1)|0;
 $3 = (_malloc($2)|0);
 $4 = ($3|0)==(0|0);
 if ($4) {
  $$0 = 0;
 } else {
  _memcpy(($3|0),($0|0),($2|0))|0;
  $$0 = $3;
 }
 return ($$0|0);
}
function __ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = (___cxa_allocate_exception(8)|0);
 __THREW__ = 0;
 invoke_vii(186,($1|0),(7471|0));
 $2 = __THREW__; __THREW__ = 0;
 $3 = $2&1;
 if ($3) {
  $4 = ___cxa_find_matching_catch_2()|0;
  $5 = tempRet0;
  ___cxa_free_exception(($1|0));
  ___resumeException($4|0);
  // unreachable;
 } else {
  HEAP32[$1>>2] = (1512);
  ___cxa_throw(($1|0),(560|0),(21|0));
  // unreachable;
 }
}
function __Znwj($0) {
 $0 = $0|0;
 var $$ = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0|0)==(0);
 $$ = $1 ? 1 : $0;
 while(1) {
  $2 = (_malloc($$)|0);
  $3 = ($2|0)==(0|0);
  if (!($3)) {
   label = 6;
   break;
  }
  $4 = (__ZSt15get_new_handlerv()|0);
  $5 = ($4|0)==(0|0);
  if ($5) {
   label = 5;
   break;
  }
  FUNCTION_TABLE_v[$4 & 255]();
 }
 if ((label|0) == 5) {
  $6 = (___cxa_allocate_exception(4)|0);
  __ZNSt9bad_allocC2Ev($6);
  ___cxa_throw(($6|0),(528|0),(18|0));
  // unreachable;
 }
 else if ((label|0) == 6) {
  return ($2|0);
 }
 return (0)|0;
}
function __ZdlPv($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 _free($0);
 return;
}
function __ZNSt3__218__libcpp_refstringC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = (_strlen($1)|0);
 $3 = (($2) + 13)|0;
 $4 = (__Znwj($3)|0);
 HEAP32[$4>>2] = $2;
 $5 = ((($4)) + 4|0);
 HEAP32[$5>>2] = $2;
 $6 = ((($4)) + 8|0);
 HEAP32[$6>>2] = 0;
 $7 = (__ZNSt3__215__refstring_imp12_GLOBAL__N_113data_from_repEPNS1_9_Rep_baseE($4)|0);
 $8 = (($2) + 1)|0;
 _memcpy(($7|0),($1|0),($8|0))|0;
 HEAP32[$0>>2] = $7;
 return;
}
function __ZNSt3__215__refstring_imp12_GLOBAL__N_113data_from_repEPNS1_9_Rep_baseE($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 12|0);
 return ($1|0);
}
function __ZNSt11logic_errorC2EPKc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAP32[$0>>2] = (1492);
 $2 = ((($0)) + 4|0);
 __THREW__ = 0;
 invoke_vii(187,($2|0),($1|0));
 $3 = __THREW__; __THREW__ = 0;
 $4 = $3&1;
 if ($4) {
  $5 = ___cxa_find_matching_catch_2()|0;
  $6 = tempRet0;
  ___resumeException($5|0);
  // unreachable;
 } else {
  return;
 }
}
function __ZNKSt3__218__libcpp_refstring15__uses_refcountEv($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 1;
}
function __ZNKSt3__221__basic_string_commonILb1EE20__throw_length_errorEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = (___cxa_allocate_exception(8)|0);
 __THREW__ = 0;
 invoke_vii(186,($1|0),(7478|0));
 $2 = __THREW__; __THREW__ = 0;
 $3 = $2&1;
 if ($3) {
  $4 = ___cxa_find_matching_catch_2()|0;
  $5 = tempRet0;
  ___cxa_free_exception(($1|0));
  ___resumeException($4|0);
  // unreachable;
 } else {
  HEAP32[$1>>2] = (1512);
  ___cxa_throw(($1|0),(560|0),(21|0));
  // unreachable;
 }
}
function __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 11|0);
 $2 = HEAP8[$1>>0]|0;
 $3 = ($2<<24>>24)<(0);
 if ($3) {
  $4 = HEAP32[$0>>2]|0;
  __ZdlPv($4);
 }
 return;
}
function __ZL25default_terminate_handlerv() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_buffer10 = 0, $vararg_buffer3 = 0;
 var $vararg_buffer7 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(48|0);
 $vararg_buffer10 = sp + 32|0;
 $vararg_buffer7 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $0 = sp + 36|0;
 $1 = (___cxa_get_globals_fast()|0);
 $2 = ($1|0)==(0|0);
 if (!($2)) {
  $3 = HEAP32[$1>>2]|0;
  $4 = ($3|0)==(0|0);
  if (!($4)) {
   $5 = ((($3)) + 80|0);
   $6 = ((($3)) + 48|0);
   $7 = $6;
   $8 = $7;
   $9 = HEAP32[$8>>2]|0;
   $10 = (($7) + 4)|0;
   $11 = $10;
   $12 = HEAP32[$11>>2]|0;
   $13 = $9 & -256;
   $14 = ($13|0)==(1126902528);
   $15 = ($12|0)==(1129074247);
   $16 = $14 & $15;
   if (!($16)) {
    $36 = HEAP32[345]|0;
    HEAP32[$vararg_buffer7>>2] = $36;
    _abort_message(7577,$vararg_buffer7);
    // unreachable;
   }
   $17 = ($9|0)==(1126902529);
   $18 = ($12|0)==(1129074247);
   $19 = $17 & $18;
   if ($19) {
    $20 = ((($3)) + 44|0);
    $21 = HEAP32[$20>>2]|0;
    $22 = $21;
   } else {
    $22 = $5;
   }
   HEAP32[$0>>2] = $22;
   $23 = HEAP32[$3>>2]|0;
   $24 = ((($23)) + 4|0);
   $25 = HEAP32[$24>>2]|0;
   $26 = HEAP32[116]|0;
   $27 = ((($26)) + 16|0);
   $28 = HEAP32[$27>>2]|0;
   $29 = (FUNCTION_TABLE_iiii[$28 & 127](464,$23,$0)|0);
   $30 = HEAP32[345]|0;
   if ($29) {
    $31 = HEAP32[$0>>2]|0;
    $32 = HEAP32[$31>>2]|0;
    $33 = ((($32)) + 8|0);
    $34 = HEAP32[$33>>2]|0;
    $35 = (FUNCTION_TABLE_ii[$34 & 255]($31)|0);
    HEAP32[$vararg_buffer>>2] = $30;
    $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
    HEAP32[$vararg_ptr1>>2] = $25;
    $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
    HEAP32[$vararg_ptr2>>2] = $35;
    _abort_message(7491,$vararg_buffer);
    // unreachable;
   } else {
    HEAP32[$vararg_buffer3>>2] = $30;
    $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
    HEAP32[$vararg_ptr6>>2] = $25;
    _abort_message(7536,$vararg_buffer3);
    // unreachable;
   }
  }
 }
 _abort_message(7615,$vararg_buffer10);
 // unreachable;
}
function ___cxa_get_globals_fast() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer = sp;
 $0 = (_pthread_once((8852|0),(188|0))|0);
 $1 = ($0|0)==(0);
 if ($1) {
  $2 = HEAP32[2214]|0;
  $3 = (_pthread_getspecific(($2|0))|0);
  STACKTOP = sp;return ($3|0);
 } else {
  _abort_message(7766,$vararg_buffer);
  // unreachable;
 }
 return (0)|0;
}
function _abort_message($0,$varargs) {
 $0 = $0|0;
 $varargs = $varargs|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 HEAP32[$1>>2] = $varargs;
 $2 = HEAP32[312]|0;
 (_vfprintf($2,$0,$1)|0);
 (_fputc(10,$2)|0);
 _abort();
 // unreachable;
}
function __ZN10__cxxabiv116__shim_type_infoD2Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZN10__cxxabiv117__class_type_infoD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNK10__cxxabiv116__shim_type_info5noop1Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZNK10__cxxabiv116__shim_type_info5noop2Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $$2 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $3 = sp;
 $4 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$1,0)|0);
 if ($4) {
  $$2 = 1;
 } else {
  $5 = ($1|0)==(0|0);
  if ($5) {
   $$2 = 0;
  } else {
   $6 = (___dynamic_cast($1,488,472,0)|0);
   $7 = ($6|0)==(0|0);
   if ($7) {
    $$2 = 0;
   } else {
    $8 = ((($3)) + 4|0);
    dest=$8; stop=dest+52|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
    HEAP32[$3>>2] = $6;
    $9 = ((($3)) + 8|0);
    HEAP32[$9>>2] = $0;
    $10 = ((($3)) + 12|0);
    HEAP32[$10>>2] = -1;
    $11 = ((($3)) + 48|0);
    HEAP32[$11>>2] = 1;
    $12 = HEAP32[$6>>2]|0;
    $13 = ((($12)) + 28|0);
    $14 = HEAP32[$13>>2]|0;
    $15 = HEAP32[$2>>2]|0;
    FUNCTION_TABLE_viiii[$14 & 255]($6,$3,$15,1);
    $16 = ((($3)) + 24|0);
    $17 = HEAP32[$16>>2]|0;
    $18 = ($17|0)==(1);
    if ($18) {
     $19 = ((($3)) + 16|0);
     $20 = HEAP32[$19>>2]|0;
     HEAP32[$2>>2] = $20;
     $$0 = 1;
    } else {
     $$0 = 0;
    }
    $$2 = $$0;
   }
  }
 }
 STACKTOP = sp;return ($$2|0);
}
function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $6 = ((($1)) + 8|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$7,$5)|0);
 if ($8) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0,$1,$2,$3,$4);
 }
 return;
}
function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $5 = ((($1)) + 8|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$6,$4)|0);
 do {
  if ($7) {
   __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(0,$1,$2,$3);
  } else {
   $8 = HEAP32[$1>>2]|0;
   $9 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$8,$4)|0);
   if ($9) {
    $10 = ((($1)) + 16|0);
    $11 = HEAP32[$10>>2]|0;
    $12 = ($11|0)==($2|0);
    $13 = ((($1)) + 32|0);
    if (!($12)) {
     $14 = ((($1)) + 20|0);
     $15 = HEAP32[$14>>2]|0;
     $16 = ($15|0)==($2|0);
     if (!($16)) {
      HEAP32[$13>>2] = $3;
      HEAP32[$14>>2] = $2;
      $18 = ((($1)) + 40|0);
      $19 = HEAP32[$18>>2]|0;
      $20 = (($19) + 1)|0;
      HEAP32[$18>>2] = $20;
      $21 = ((($1)) + 36|0);
      $22 = HEAP32[$21>>2]|0;
      $23 = ($22|0)==(1);
      if ($23) {
       $24 = ((($1)) + 24|0);
       $25 = HEAP32[$24>>2]|0;
       $26 = ($25|0)==(2);
       if ($26) {
        $27 = ((($1)) + 54|0);
        HEAP8[$27>>0] = 1;
       }
      }
      $28 = ((($1)) + 44|0);
      HEAP32[$28>>2] = 4;
      break;
     }
    }
    $17 = ($3|0)==(1);
    if ($17) {
     HEAP32[$13>>2] = 1;
    }
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $4 = ((($1)) + 8|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$5,0)|0);
 if ($6) {
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0,$1,$2,$3);
 }
 return;
}
function __ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($0|0)==($1|0);
 return ($3|0);
}
function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $4 = ((($1)) + 16|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = ($5|0)==(0|0);
 $7 = ((($1)) + 36|0);
 $8 = ((($1)) + 24|0);
 do {
  if ($6) {
   HEAP32[$4>>2] = $2;
   HEAP32[$8>>2] = $3;
   HEAP32[$7>>2] = 1;
  } else {
   $9 = ($5|0)==($2|0);
   if (!($9)) {
    $12 = HEAP32[$7>>2]|0;
    $13 = (($12) + 1)|0;
    HEAP32[$7>>2] = $13;
    HEAP32[$8>>2] = 2;
    $14 = ((($1)) + 54|0);
    HEAP8[$14>>0] = 1;
    break;
   }
   $10 = HEAP32[$8>>2]|0;
   $11 = ($10|0)==(2);
   if ($11) {
    HEAP32[$8>>2] = $3;
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $4 = ((($1)) + 4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = ($5|0)==($2|0);
 if ($6) {
  $7 = ((($1)) + 28|0);
  $8 = HEAP32[$7>>2]|0;
  $9 = ($8|0)==(1);
  if (!($9)) {
   HEAP32[$7>>2] = $3;
  }
 }
 return;
}
function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond22 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $5 = ((($1)) + 53|0);
 HEAP8[$5>>0] = 1;
 $6 = ((($1)) + 4|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = ($7|0)==($3|0);
 do {
  if ($8) {
   $9 = ((($1)) + 52|0);
   HEAP8[$9>>0] = 1;
   $10 = ((($1)) + 16|0);
   $11 = HEAP32[$10>>2]|0;
   $12 = ($11|0)==(0|0);
   $13 = ((($1)) + 54|0);
   $14 = ((($1)) + 48|0);
   $15 = ((($1)) + 24|0);
   $16 = ((($1)) + 36|0);
   if ($12) {
    HEAP32[$10>>2] = $2;
    HEAP32[$15>>2] = $4;
    HEAP32[$16>>2] = 1;
    $17 = HEAP32[$14>>2]|0;
    $18 = ($17|0)==(1);
    $19 = ($4|0)==(1);
    $or$cond = $18 & $19;
    if (!($or$cond)) {
     break;
    }
    HEAP8[$13>>0] = 1;
    break;
   }
   $20 = ($11|0)==($2|0);
   if (!($20)) {
    $27 = HEAP32[$16>>2]|0;
    $28 = (($27) + 1)|0;
    HEAP32[$16>>2] = $28;
    HEAP8[$13>>0] = 1;
    break;
   }
   $21 = HEAP32[$15>>2]|0;
   $22 = ($21|0)==(2);
   if ($22) {
    HEAP32[$15>>2] = $4;
    $25 = $4;
   } else {
    $25 = $21;
   }
   $23 = HEAP32[$14>>2]|0;
   $24 = ($23|0)==(1);
   $26 = ($25|0)==(1);
   $or$cond22 = $24 & $26;
   if ($or$cond22) {
    HEAP8[$13>>0] = 1;
   }
  }
 } while(0);
 return;
}
function ___dynamic_cast($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $$ = 0, $$0 = 0, $$33 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond28 = 0, $or$cond30 = 0, $or$cond32 = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $4 = sp;
 $5 = HEAP32[$0>>2]|0;
 $6 = ((($5)) + -8|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = (($0) + ($7)|0);
 $9 = ((($5)) + -4|0);
 $10 = HEAP32[$9>>2]|0;
 HEAP32[$4>>2] = $2;
 $11 = ((($4)) + 4|0);
 HEAP32[$11>>2] = $0;
 $12 = ((($4)) + 8|0);
 HEAP32[$12>>2] = $1;
 $13 = ((($4)) + 12|0);
 HEAP32[$13>>2] = $3;
 $14 = ((($4)) + 16|0);
 $15 = ((($4)) + 20|0);
 $16 = ((($4)) + 24|0);
 $17 = ((($4)) + 28|0);
 $18 = ((($4)) + 32|0);
 $19 = ((($4)) + 40|0);
 dest=$14; stop=dest+36|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));HEAP16[$14+36>>1]=0|0;HEAP8[$14+38>>0]=0|0;
 $20 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($10,$2,0)|0);
 L1: do {
  if ($20) {
   $21 = ((($4)) + 48|0);
   HEAP32[$21>>2] = 1;
   $22 = HEAP32[$10>>2]|0;
   $23 = ((($22)) + 20|0);
   $24 = HEAP32[$23>>2]|0;
   FUNCTION_TABLE_viiiiii[$24 & 127]($10,$4,$8,$8,1,0);
   $25 = HEAP32[$16>>2]|0;
   $26 = ($25|0)==(1);
   $$ = $26 ? $8 : 0;
   $$0 = $$;
  } else {
   $27 = ((($4)) + 36|0);
   $28 = HEAP32[$10>>2]|0;
   $29 = ((($28)) + 24|0);
   $30 = HEAP32[$29>>2]|0;
   FUNCTION_TABLE_viiiii[$30 & 63]($10,$4,$8,1,0);
   $31 = HEAP32[$27>>2]|0;
   switch ($31|0) {
   case 0:  {
    $32 = HEAP32[$19>>2]|0;
    $33 = ($32|0)==(1);
    $34 = HEAP32[$17>>2]|0;
    $35 = ($34|0)==(1);
    $or$cond = $33 & $35;
    $36 = HEAP32[$18>>2]|0;
    $37 = ($36|0)==(1);
    $or$cond28 = $or$cond & $37;
    $38 = HEAP32[$15>>2]|0;
    $$33 = $or$cond28 ? $38 : 0;
    $$0 = $$33;
    break L1;
    break;
   }
   case 1:  {
    break;
   }
   default: {
    $$0 = 0;
    break L1;
   }
   }
   $39 = HEAP32[$16>>2]|0;
   $40 = ($39|0)==(1);
   if (!($40)) {
    $41 = HEAP32[$19>>2]|0;
    $42 = ($41|0)==(0);
    $43 = HEAP32[$17>>2]|0;
    $44 = ($43|0)==(1);
    $or$cond30 = $42 & $44;
    $45 = HEAP32[$18>>2]|0;
    $46 = ($45|0)==(1);
    $or$cond32 = $or$cond30 & $46;
    if (!($or$cond32)) {
     $$0 = 0;
     break;
    }
   }
   $47 = HEAP32[$14>>2]|0;
   $$0 = $47;
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function __ZN10__cxxabiv120__si_class_type_infoD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $6 = ((($1)) + 8|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$7,$5)|0);
 if ($8) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0,$1,$2,$3,$4);
 } else {
  $9 = ((($0)) + 8|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = HEAP32[$10>>2]|0;
  $12 = ((($11)) + 20|0);
  $13 = HEAP32[$12>>2]|0;
  FUNCTION_TABLE_viiiiii[$13 & 127]($10,$1,$2,$3,$4,$5);
 }
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$037$off038 = 0, $$037$off039 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $not$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $5 = ((($1)) + 8|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$6,$4)|0);
 do {
  if ($7) {
   __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(0,$1,$2,$3);
  } else {
   $8 = HEAP32[$1>>2]|0;
   $9 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$8,$4)|0);
   $10 = ((($0)) + 8|0);
   if (!($9)) {
    $41 = HEAP32[$10>>2]|0;
    $42 = HEAP32[$41>>2]|0;
    $43 = ((($42)) + 24|0);
    $44 = HEAP32[$43>>2]|0;
    FUNCTION_TABLE_viiiii[$44 & 63]($41,$1,$2,$3,$4);
    break;
   }
   $11 = ((($1)) + 16|0);
   $12 = HEAP32[$11>>2]|0;
   $13 = ($12|0)==($2|0);
   $14 = ((($1)) + 32|0);
   if (!($13)) {
    $15 = ((($1)) + 20|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ($16|0)==($2|0);
    if (!($17)) {
     HEAP32[$14>>2] = $3;
     $19 = ((($1)) + 44|0);
     $20 = HEAP32[$19>>2]|0;
     $21 = ($20|0)==(4);
     if ($21) {
      break;
     }
     $22 = ((($1)) + 52|0);
     HEAP8[$22>>0] = 0;
     $23 = ((($1)) + 53|0);
     HEAP8[$23>>0] = 0;
     $24 = HEAP32[$10>>2]|0;
     $25 = HEAP32[$24>>2]|0;
     $26 = ((($25)) + 20|0);
     $27 = HEAP32[$26>>2]|0;
     FUNCTION_TABLE_viiiiii[$27 & 127]($24,$1,$2,$2,1,$4);
     $28 = HEAP8[$23>>0]|0;
     $29 = ($28<<24>>24)==(0);
     if ($29) {
      $$037$off038 = 4;
      label = 11;
     } else {
      $30 = HEAP8[$22>>0]|0;
      $not$ = ($30<<24>>24)==(0);
      if ($not$) {
       $$037$off038 = 3;
       label = 11;
      } else {
       $$037$off039 = 3;
      }
     }
     if ((label|0) == 11) {
      HEAP32[$15>>2] = $2;
      $31 = ((($1)) + 40|0);
      $32 = HEAP32[$31>>2]|0;
      $33 = (($32) + 1)|0;
      HEAP32[$31>>2] = $33;
      $34 = ((($1)) + 36|0);
      $35 = HEAP32[$34>>2]|0;
      $36 = ($35|0)==(1);
      if ($36) {
       $37 = ((($1)) + 24|0);
       $38 = HEAP32[$37>>2]|0;
       $39 = ($38|0)==(2);
       if ($39) {
        $40 = ((($1)) + 54|0);
        HEAP8[$40>>0] = 1;
        $$037$off039 = $$037$off038;
       } else {
        $$037$off039 = $$037$off038;
       }
      } else {
       $$037$off039 = $$037$off038;
      }
     }
     HEAP32[$19>>2] = $$037$off039;
     break;
    }
   }
   $18 = ($3|0)==(1);
   if ($18) {
    HEAP32[$14>>2] = 1;
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $4 = ((($1)) + 8|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$5,0)|0);
 if ($6) {
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0,$1,$2,$3);
 } else {
  $7 = ((($0)) + 8|0);
  $8 = HEAP32[$7>>2]|0;
  $9 = HEAP32[$8>>2]|0;
  $10 = ((($9)) + 28|0);
  $11 = HEAP32[$10>>2]|0;
  FUNCTION_TABLE_viiii[$11 & 255]($8,$1,$2,$3);
 }
 return;
}
function __ZNSt9type_infoD2Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZN10__cxxabiv112_GLOBAL__N_110construct_Ev() {
 var $0 = 0, $1 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer = sp;
 $0 = (_pthread_key_create((8856|0),(189|0))|0);
 $1 = ($0|0)==(0);
 if ($1) {
  STACKTOP = sp;return;
 } else {
  _abort_message(7815,$vararg_buffer);
  // unreachable;
 }
}
function __ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer = sp;
 _free($0);
 $1 = HEAP32[2214]|0;
 $2 = (_pthread_setspecific(($1|0),(0|0))|0);
 $3 = ($2|0)==(0);
 if ($3) {
  STACKTOP = sp;return;
 } else {
  _abort_message(7865,$vararg_buffer);
  // unreachable;
 }
}
function __ZSt9terminatev() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 __THREW__ = 0;
 $0 = (invoke_i(190)|0);
 $1 = __THREW__; __THREW__ = 0;
 $2 = $1&1;
 if ($2) {
  $20 = ___cxa_find_matching_catch_3(0|0)|0;
  $21 = tempRet0;
  ___clang_call_terminate($20);
  // unreachable;
 }
 $3 = ($0|0)==(0|0);
 if (!($3)) {
  $4 = HEAP32[$0>>2]|0;
  $5 = ($4|0)==(0|0);
  if (!($5)) {
   $6 = ((($4)) + 48|0);
   $7 = $6;
   $8 = $7;
   $9 = HEAP32[$8>>2]|0;
   $10 = (($7) + 4)|0;
   $11 = $10;
   $12 = HEAP32[$11>>2]|0;
   $13 = $9 & -256;
   $14 = ($13|0)==(1126902528);
   $15 = ($12|0)==(1129074247);
   $16 = $14 & $15;
   if ($16) {
    $17 = ((($4)) + 12|0);
    $18 = HEAP32[$17>>2]|0;
    __ZSt11__terminatePFvvE($18);
    // unreachable;
   }
  }
 }
 $19 = (__ZSt13get_terminatev()|0);
 __ZSt11__terminatePFvvE($19);
 // unreachable;
}
function __ZSt11__terminatePFvvE($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 __THREW__ = 0;
 invoke_v($0|0);
 $1 = __THREW__; __THREW__ = 0;
 $2 = $1&1;
 if (!($2)) {
  __THREW__ = 0;
  invoke_vii(191,(7918|0),($vararg_buffer|0));
  $3 = __THREW__; __THREW__ = 0;
 }
 $4 = ___cxa_find_matching_catch_3(0|0)|0;
 $5 = tempRet0;
 (___cxa_begin_catch(($4|0))|0);
 __THREW__ = 0;
 invoke_vii(191,(7958|0),($vararg_buffer1|0));
 $6 = __THREW__; __THREW__ = 0;
 $7 = ___cxa_find_matching_catch_3(0|0)|0;
 $8 = tempRet0;
 __THREW__ = 0;
 invoke_v(177);
 $9 = __THREW__; __THREW__ = 0;
 $10 = $9&1;
 if ($10) {
  $11 = ___cxa_find_matching_catch_3(0|0)|0;
  $12 = tempRet0;
  ___clang_call_terminate($11);
  // unreachable;
 } else {
  ___clang_call_terminate($7);
  // unreachable;
 }
}
function __ZSt13get_terminatev() {
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[344]|0;HEAP32[344] = (($0+0)|0);
 $1 = $0;
 return ($1|0);
}
function __ZNSt9bad_allocD2Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZNSt9bad_allocD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZNSt9bad_allocD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNKSt9bad_alloc4whatEv($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return (8008|0);
}
function __ZNSt9exceptionD2Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZNSt11logic_errorD2Ev($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAP32[$0>>2] = (1492);
 $1 = ((($0)) + 4|0);
 __ZNSt3__218__libcpp_refstringD2Ev($1);
 return;
}
function __ZNSt11logic_errorD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZNSt11logic_errorD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNKSt11logic_error4whatEv($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 4|0);
 $2 = (__ZNKSt3__218__libcpp_refstring5c_strEv($1)|0);
 return ($2|0);
}
function __ZNKSt3__218__libcpp_refstring5c_strEv($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = HEAP32[$0>>2]|0;
 return ($1|0);
}
function __ZNSt3__218__libcpp_refstringD2Ev($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = (__ZNKSt3__218__libcpp_refstring15__uses_refcountEv($0)|0);
 if ($1) {
  $2 = HEAP32[$0>>2]|0;
  $3 = (__ZNSt3__215__refstring_imp12_GLOBAL__N_113rep_from_dataEPKc_511($2)|0);
  $4 = ((($3)) + 8|0);
  $5 = HEAP32[$4>>2]|0;HEAP32[$4>>2] = (($5+-1)|0);
  $6 = (($5) + -1)|0;
  $7 = ($6|0)<(0);
  if ($7) {
   __ZdlPv($3);
  }
 }
 return;
}
function __ZNSt3__215__refstring_imp12_GLOBAL__N_113rep_from_dataEPKc_511($0) {
 $0 = $0|0;
 var $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + -12|0);
 return ($1|0);
}
function __ZNSt12length_errorD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZNSt11logic_errorD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZN10__cxxabiv123__fundamental_type_infoD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$1,0)|0);
 return ($3|0);
}
function __ZN10__cxxabiv119__pointer_type_infoD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $$4 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $3 = sp;
 $4 = HEAP32[$2>>2]|0;
 $5 = HEAP32[$4>>2]|0;
 HEAP32[$2>>2] = $5;
 $6 = (__ZNK10__cxxabiv117__pbase_type_info9can_catchEPKNS_16__shim_type_infoERPv($0,$1,0)|0);
 if ($6) {
  $$4 = 1;
 } else {
  $7 = ($1|0)==(0|0);
  if ($7) {
   $$4 = 0;
  } else {
   $8 = (___dynamic_cast($1,488,592,0)|0);
   $9 = ($8|0)==(0|0);
   if ($9) {
    $$4 = 0;
   } else {
    $10 = ((($8)) + 8|0);
    $11 = HEAP32[$10>>2]|0;
    $12 = ((($0)) + 8|0);
    $13 = HEAP32[$12>>2]|0;
    $14 = $13 ^ -1;
    $15 = $11 & $14;
    $16 = ($15|0)==(0);
    if ($16) {
     $17 = ((($0)) + 12|0);
     $18 = HEAP32[$17>>2]|0;
     $19 = ((($8)) + 12|0);
     $20 = HEAP32[$19>>2]|0;
     $21 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($18,$20,0)|0);
     if ($21) {
      $$4 = 1;
     } else {
      $22 = HEAP32[$17>>2]|0;
      $23 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($22,624,0)|0);
      if ($23) {
       $$4 = 1;
      } else {
       $24 = HEAP32[$17>>2]|0;
       $25 = ($24|0)==(0|0);
       if ($25) {
        $$4 = 0;
       } else {
        $26 = (___dynamic_cast($24,488,472,0)|0);
        $27 = ($26|0)==(0|0);
        if ($27) {
         $$4 = 0;
        } else {
         $28 = HEAP32[$19>>2]|0;
         $29 = ($28|0)==(0|0);
         if ($29) {
          $$4 = 0;
         } else {
          $30 = (___dynamic_cast($28,488,472,0)|0);
          $31 = ($30|0)==(0|0);
          if ($31) {
           $$4 = 0;
          } else {
           $32 = ((($3)) + 4|0);
           dest=$32; stop=dest+52|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
           HEAP32[$3>>2] = $30;
           $33 = ((($3)) + 8|0);
           HEAP32[$33>>2] = $26;
           $34 = ((($3)) + 12|0);
           HEAP32[$34>>2] = -1;
           $35 = ((($3)) + 48|0);
           HEAP32[$35>>2] = 1;
           $36 = HEAP32[$30>>2]|0;
           $37 = ((($36)) + 28|0);
           $38 = HEAP32[$37>>2]|0;
           $39 = HEAP32[$2>>2]|0;
           FUNCTION_TABLE_viiii[$38 & 255]($30,$3,$39,1);
           $40 = ((($3)) + 24|0);
           $41 = HEAP32[$40>>2]|0;
           $42 = ($41|0)==(1);
           if ($42) {
            $43 = ((($3)) + 16|0);
            $44 = HEAP32[$43>>2]|0;
            HEAP32[$2>>2] = $44;
            $$0 = 1;
           } else {
            $$0 = 0;
           }
           $$4 = $$0;
          }
         }
        }
       }
      }
     }
    } else {
     $$4 = 0;
    }
   }
  }
 }
 STACKTOP = sp;return ($$4|0);
}
function __ZNK10__cxxabiv117__pbase_type_info9can_catchEPKNS_16__shim_type_infoERPv($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$1,0)|0);
 if ($3) {
  $$0 = 1;
 } else {
  $4 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($1,632,0)|0);
  $$0 = $4;
 }
 return ($$0|0);
}
function __ZN10__cxxabiv116__enum_type_infoD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNK10__cxxabiv116__enum_type_info9can_catchEPKNS_16__shim_type_infoERPv($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$1,0)|0);
 return ($3|0);
}
function __ZN10__cxxabiv121__vmi_class_type_infoD0Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0);
 __ZdlPv($0);
 return;
}
function __ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $6 = ((($1)) + 8|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$7,$5)|0);
 if ($8) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0,$1,$2,$3,$4);
 } else {
  $9 = ((($1)) + 52|0);
  $10 = HEAP8[$9>>0]|0;
  $11 = ((($1)) + 53|0);
  $12 = HEAP8[$11>>0]|0;
  $13 = ((($0)) + 16|0);
  $14 = ((($0)) + 12|0);
  $15 = HEAP32[$14>>2]|0;
  $16 = (((($0)) + 16|0) + ($15<<3)|0);
  HEAP8[$9>>0] = 0;
  HEAP8[$11>>0] = 0;
  __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($13,$1,$2,$3,$4,$5);
  $17 = ($15|0)>(1);
  L4: do {
   if ($17) {
    $18 = ((($0)) + 24|0);
    $19 = ((($1)) + 24|0);
    $20 = ((($1)) + 54|0);
    $21 = ((($0)) + 8|0);
    $$0 = $18;
    while(1) {
     $22 = HEAP8[$20>>0]|0;
     $23 = ($22<<24>>24)==(0);
     if (!($23)) {
      break L4;
     }
     $24 = HEAP8[$9>>0]|0;
     $25 = ($24<<24>>24)==(0);
     if ($25) {
      $31 = HEAP8[$11>>0]|0;
      $32 = ($31<<24>>24)==(0);
      if (!($32)) {
       $33 = HEAP32[$21>>2]|0;
       $34 = $33 & 1;
       $35 = ($34|0)==(0);
       if ($35) {
        break L4;
       }
      }
     } else {
      $26 = HEAP32[$19>>2]|0;
      $27 = ($26|0)==(1);
      if ($27) {
       break L4;
      }
      $28 = HEAP32[$21>>2]|0;
      $29 = $28 & 2;
      $30 = ($29|0)==(0);
      if ($30) {
       break L4;
      }
     }
     HEAP8[$9>>0] = 0;
     HEAP8[$11>>0] = 0;
     __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($$0,$1,$2,$3,$4,$5);
     $36 = ((($$0)) + 8|0);
     $37 = ($36>>>0)<($16>>>0);
     if ($37) {
      $$0 = $36;
     } else {
      break;
     }
    }
   }
  } while(0);
  HEAP8[$9>>0] = $10;
  HEAP8[$11>>0] = $12;
 }
 return;
}
function __ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$0 = 0, $$081$off0 = 0, $$084 = 0, $$085$off0 = 0, $$1 = 0, $$182$off0 = 0, $$186$off0 = 0, $$2 = 0, $$283$off0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $5 = ((($1)) + 8|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$6,$4)|0);
 L1: do {
  if ($7) {
   __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(0,$1,$2,$3);
  } else {
   $8 = HEAP32[$1>>2]|0;
   $9 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$8,$4)|0);
   $10 = ((($0)) + 12|0);
   $11 = ((($1)) + 24|0);
   $12 = ((($1)) + 36|0);
   $13 = ((($1)) + 54|0);
   $14 = ((($0)) + 8|0);
   $15 = ((($0)) + 16|0);
   if (!($9)) {
    $55 = HEAP32[$10>>2]|0;
    $56 = (((($0)) + 16|0) + ($55<<3)|0);
    __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($15,$1,$2,$3,$4);
    $57 = ((($0)) + 24|0);
    $58 = ($55|0)>(1);
    if (!($58)) {
     break;
    }
    $59 = HEAP32[$14>>2]|0;
    $60 = $59 & 2;
    $61 = ($60|0)==(0);
    if ($61) {
     $62 = HEAP32[$12>>2]|0;
     $63 = ($62|0)==(1);
     if ($63) {
      $$0 = $57;
     } else {
      $68 = $59 & 1;
      $69 = ($68|0)==(0);
      if ($69) {
       $$2 = $57;
       while(1) {
        $78 = HEAP8[$13>>0]|0;
        $79 = ($78<<24>>24)==(0);
        if (!($79)) {
         break L1;
        }
        $80 = HEAP32[$12>>2]|0;
        $81 = ($80|0)==(1);
        if ($81) {
         break L1;
        }
        __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($$2,$1,$2,$3,$4);
        $82 = ((($$2)) + 8|0);
        $83 = ($82>>>0)<($56>>>0);
        if ($83) {
         $$2 = $82;
        } else {
         break L1;
        }
       }
      } else {
       $$1 = $57;
      }
      while(1) {
       $70 = HEAP8[$13>>0]|0;
       $71 = ($70<<24>>24)==(0);
       if (!($71)) {
        break L1;
       }
       $72 = HEAP32[$12>>2]|0;
       $73 = ($72|0)==(1);
       if ($73) {
        $74 = HEAP32[$11>>2]|0;
        $75 = ($74|0)==(1);
        if ($75) {
         break L1;
        }
       }
       __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($$1,$1,$2,$3,$4);
       $76 = ((($$1)) + 8|0);
       $77 = ($76>>>0)<($56>>>0);
       if ($77) {
        $$1 = $76;
       } else {
        break L1;
       }
      }
     }
    } else {
     $$0 = $57;
    }
    while(1) {
     $64 = HEAP8[$13>>0]|0;
     $65 = ($64<<24>>24)==(0);
     if (!($65)) {
      break L1;
     }
     __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($$0,$1,$2,$3,$4);
     $66 = ((($$0)) + 8|0);
     $67 = ($66>>>0)<($56>>>0);
     if ($67) {
      $$0 = $66;
     } else {
      break L1;
     }
    }
   }
   $16 = ((($1)) + 16|0);
   $17 = HEAP32[$16>>2]|0;
   $18 = ($17|0)==($2|0);
   $19 = ((($1)) + 32|0);
   if (!($18)) {
    $20 = ((($1)) + 20|0);
    $21 = HEAP32[$20>>2]|0;
    $22 = ($21|0)==($2|0);
    if (!($22)) {
     HEAP32[$19>>2] = $3;
     $24 = ((($1)) + 44|0);
     $25 = HEAP32[$24>>2]|0;
     $26 = ($25|0)==(4);
     if ($26) {
      break;
     }
     $27 = HEAP32[$10>>2]|0;
     $28 = (((($0)) + 16|0) + ($27<<3)|0);
     $29 = ((($1)) + 52|0);
     $30 = ((($1)) + 53|0);
     $$081$off0 = 0;$$084 = $15;$$085$off0 = 0;
     L29: while(1) {
      $31 = ($$084>>>0)<($28>>>0);
      if (!($31)) {
       $$283$off0 = $$081$off0;
       label = 18;
       break;
      }
      HEAP8[$29>>0] = 0;
      HEAP8[$30>>0] = 0;
      __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($$084,$1,$2,$2,1,$4);
      $32 = HEAP8[$13>>0]|0;
      $33 = ($32<<24>>24)==(0);
      if (!($33)) {
       $$283$off0 = $$081$off0;
       label = 18;
       break;
      }
      $34 = HEAP8[$30>>0]|0;
      $35 = ($34<<24>>24)==(0);
      do {
       if ($35) {
        $$182$off0 = $$081$off0;$$186$off0 = $$085$off0;
       } else {
        $36 = HEAP8[$29>>0]|0;
        $37 = ($36<<24>>24)==(0);
        if ($37) {
         $43 = HEAP32[$14>>2]|0;
         $44 = $43 & 1;
         $45 = ($44|0)==(0);
         if ($45) {
          $$283$off0 = 1;
          label = 18;
          break L29;
         } else {
          $$182$off0 = 1;$$186$off0 = $$085$off0;
          break;
         }
        }
        $38 = HEAP32[$11>>2]|0;
        $39 = ($38|0)==(1);
        if ($39) {
         label = 23;
         break L29;
        }
        $40 = HEAP32[$14>>2]|0;
        $41 = $40 & 2;
        $42 = ($41|0)==(0);
        if ($42) {
         label = 23;
         break L29;
        } else {
         $$182$off0 = 1;$$186$off0 = 1;
        }
       }
      } while(0);
      $46 = ((($$084)) + 8|0);
      $$081$off0 = $$182$off0;$$084 = $46;$$085$off0 = $$186$off0;
     }
     do {
      if ((label|0) == 18) {
       if (!($$085$off0)) {
        HEAP32[$20>>2] = $2;
        $47 = ((($1)) + 40|0);
        $48 = HEAP32[$47>>2]|0;
        $49 = (($48) + 1)|0;
        HEAP32[$47>>2] = $49;
        $50 = HEAP32[$12>>2]|0;
        $51 = ($50|0)==(1);
        if ($51) {
         $52 = HEAP32[$11>>2]|0;
         $53 = ($52|0)==(2);
         if ($53) {
          HEAP8[$13>>0] = 1;
          if ($$283$off0) {
           label = 23;
           break;
          } else {
           $54 = 4;
           break;
          }
         }
        }
       }
       if ($$283$off0) {
        label = 23;
       } else {
        $54 = 4;
       }
      }
     } while(0);
     if ((label|0) == 23) {
      $54 = 3;
     }
     HEAP32[$24>>2] = $54;
     break;
    }
   }
   $23 = ($3|0)==(1);
   if ($23) {
    HEAP32[$19>>2] = 1;
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $4 = ((($1)) + 8|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0,$5,0)|0);
 L1: do {
  if ($6) {
   __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0,$1,$2,$3);
  } else {
   $7 = ((($0)) + 16|0);
   $8 = ((($0)) + 12|0);
   $9 = HEAP32[$8>>2]|0;
   $10 = (((($0)) + 16|0) + ($9<<3)|0);
   __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($7,$1,$2,$3);
   $11 = ($9|0)>(1);
   if ($11) {
    $12 = ((($0)) + 24|0);
    $13 = ((($1)) + 54|0);
    $$0 = $12;
    while(1) {
     __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($$0,$1,$2,$3);
     $14 = HEAP8[$13>>0]|0;
     $15 = ($14<<24>>24)==(0);
     if (!($15)) {
      break L1;
     }
     $16 = ((($$0)) + 8|0);
     $17 = ($16>>>0)<($10>>>0);
     if ($17) {
      $$0 = $16;
     } else {
      break;
     }
    }
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $4 = ((($0)) + 4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 >> 8;
 $7 = $5 & 1;
 $8 = ($7|0)==(0);
 if ($8) {
  $$0 = $6;
 } else {
  $9 = HEAP32[$2>>2]|0;
  $10 = (($9) + ($6)|0);
  $11 = HEAP32[$10>>2]|0;
  $$0 = $11;
 }
 $12 = HEAP32[$0>>2]|0;
 $13 = HEAP32[$12>>2]|0;
 $14 = ((($13)) + 28|0);
 $15 = HEAP32[$14>>2]|0;
 $16 = (($2) + ($$0)|0);
 $17 = $5 & 2;
 $18 = ($17|0)!=(0);
 $19 = $18 ? $3 : 2;
 FUNCTION_TABLE_viiii[$15 & 255]($12,$1,$16,$19);
 return;
}
function __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $6 = ((($0)) + 4|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = $7 >> 8;
 $9 = $7 & 1;
 $10 = ($9|0)==(0);
 if ($10) {
  $$0 = $8;
 } else {
  $11 = HEAP32[$3>>2]|0;
  $12 = (($11) + ($8)|0);
  $13 = HEAP32[$12>>2]|0;
  $$0 = $13;
 }
 $14 = HEAP32[$0>>2]|0;
 $15 = HEAP32[$14>>2]|0;
 $16 = ((($15)) + 20|0);
 $17 = HEAP32[$16>>2]|0;
 $18 = (($3) + ($$0)|0);
 $19 = $7 & 2;
 $20 = ($19|0)!=(0);
 $21 = $20 ? $4 : 2;
 FUNCTION_TABLE_viiiiii[$17 & 127]($14,$1,$2,$18,$21,$5);
 return;
}
function __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $5 = ((($0)) + 4|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = $6 >> 8;
 $8 = $6 & 1;
 $9 = ($8|0)==(0);
 if ($9) {
  $$0 = $7;
 } else {
  $10 = HEAP32[$2>>2]|0;
  $11 = (($10) + ($7)|0);
  $12 = HEAP32[$11>>2]|0;
  $$0 = $12;
 }
 $13 = HEAP32[$0>>2]|0;
 $14 = HEAP32[$13>>2]|0;
 $15 = ((($14)) + 24|0);
 $16 = HEAP32[$15>>2]|0;
 $17 = (($2) + ($$0)|0);
 $18 = $6 & 2;
 $19 = ($18|0)!=(0);
 $20 = $19 ? $3 : 2;
 FUNCTION_TABLE_viiiii[$16 & 63]($13,$1,$17,$20,$4);
 return;
}
function __ZNSt9bad_allocC2Ev($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 HEAP32[$0>>2] = (1472);
 return;
}
function __ZSt15get_new_handlerv() {
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[2215]|0;HEAP32[2215] = (($0+0)|0);
 $1 = $0;
 return ($1|0);
}
function ___cxa_can_catch($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = sp;
 $4 = HEAP32[$2>>2]|0;
 HEAP32[$3>>2] = $4;
 $5 = HEAP32[$0>>2]|0;
 $6 = ((($5)) + 16|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = (FUNCTION_TABLE_iiii[$7 & 127]($0,$1,$3)|0);
 $9 = $8&1;
 if ($8) {
  $10 = HEAP32[$3>>2]|0;
  HEAP32[$2>>2] = $10;
 }
 STACKTOP = sp;return ($9|0);
}
function ___cxa_is_pointer_type($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0|0)==(0|0);
 if ($1) {
  $4 = 0;
 } else {
  $2 = (___dynamic_cast($0,488,592,0)|0);
  $phitmp = ($2|0)!=(0|0);
  $4 = $phitmp;
 }
 $3 = $4&1;
 return ($3|0);
}
function runPostSets() {
}
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
}
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
    end = (ptr + num)|0;

    value = value & 0xff;
    if ((num|0) >= 67 /* 64 bytes for an unrolled loop + 3 bytes for unaligned head*/) {
      while ((ptr&3) != 0) {
        HEAP8[((ptr)>>0)]=value;
        ptr = (ptr+1)|0;
      }

      aligned_end = (end & -4)|0;
      block_aligned_end = (aligned_end - 64)|0;
      value4 = value | (value << 8) | (value << 16) | (value << 24);

      while((ptr|0) <= (block_aligned_end|0)) {
        HEAP32[((ptr)>>2)]=value4;
        HEAP32[(((ptr)+(4))>>2)]=value4;
        HEAP32[(((ptr)+(8))>>2)]=value4;
        HEAP32[(((ptr)+(12))>>2)]=value4;
        HEAP32[(((ptr)+(16))>>2)]=value4;
        HEAP32[(((ptr)+(20))>>2)]=value4;
        HEAP32[(((ptr)+(24))>>2)]=value4;
        HEAP32[(((ptr)+(28))>>2)]=value4;
        HEAP32[(((ptr)+(32))>>2)]=value4;
        HEAP32[(((ptr)+(36))>>2)]=value4;
        HEAP32[(((ptr)+(40))>>2)]=value4;
        HEAP32[(((ptr)+(44))>>2)]=value4;
        HEAP32[(((ptr)+(48))>>2)]=value4;
        HEAP32[(((ptr)+(52))>>2)]=value4;
        HEAP32[(((ptr)+(56))>>2)]=value4;
        HEAP32[(((ptr)+(60))>>2)]=value4;
        ptr = (ptr + 64)|0;
      }

      while ((ptr|0) < (aligned_end|0) ) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    // The remaining bytes.
    while ((ptr|0) < (end|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (end-num)|0;
}
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
}
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    var aligned_dest_end = 0;
    var block_aligned_dest_end = 0;
    var dest_end = 0;
    // Test against a benchmarked cutoff limit for when HEAPU8.set() becomes faster to use.
    if ((num|0) >=
      8192
    ) {
      return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    }

    ret = dest|0;
    dest_end = (dest + num)|0;
    if ((dest&3) == (src&3)) {
      // The initial unaligned < 4-byte front.
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      aligned_dest_end = (dest_end & -4)|0;
      block_aligned_dest_end = (aligned_dest_end - 64)|0;
      while ((dest|0) <= (block_aligned_dest_end|0) ) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        HEAP32[(((dest)+(4))>>2)]=((HEAP32[(((src)+(4))>>2)])|0);
        HEAP32[(((dest)+(8))>>2)]=((HEAP32[(((src)+(8))>>2)])|0);
        HEAP32[(((dest)+(12))>>2)]=((HEAP32[(((src)+(12))>>2)])|0);
        HEAP32[(((dest)+(16))>>2)]=((HEAP32[(((src)+(16))>>2)])|0);
        HEAP32[(((dest)+(20))>>2)]=((HEAP32[(((src)+(20))>>2)])|0);
        HEAP32[(((dest)+(24))>>2)]=((HEAP32[(((src)+(24))>>2)])|0);
        HEAP32[(((dest)+(28))>>2)]=((HEAP32[(((src)+(28))>>2)])|0);
        HEAP32[(((dest)+(32))>>2)]=((HEAP32[(((src)+(32))>>2)])|0);
        HEAP32[(((dest)+(36))>>2)]=((HEAP32[(((src)+(36))>>2)])|0);
        HEAP32[(((dest)+(40))>>2)]=((HEAP32[(((src)+(40))>>2)])|0);
        HEAP32[(((dest)+(44))>>2)]=((HEAP32[(((src)+(44))>>2)])|0);
        HEAP32[(((dest)+(48))>>2)]=((HEAP32[(((src)+(48))>>2)])|0);
        HEAP32[(((dest)+(52))>>2)]=((HEAP32[(((src)+(52))>>2)])|0);
        HEAP32[(((dest)+(56))>>2)]=((HEAP32[(((src)+(56))>>2)])|0);
        HEAP32[(((dest)+(60))>>2)]=((HEAP32[(((src)+(60))>>2)])|0);
        dest = (dest+64)|0;
        src = (src+64)|0;
      }
      while ((dest|0) < (aligned_dest_end|0) ) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
      }
    } else {
      // In the unaligned copy case, unroll a bit as well.
      aligned_dest_end = (dest_end - 4)|0;
      while ((dest|0) < (aligned_dest_end|0) ) {
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        HEAP8[(((dest)+(1))>>0)]=((HEAP8[(((src)+(1))>>0)])|0);
        HEAP8[(((dest)+(2))>>0)]=((HEAP8[(((src)+(2))>>0)])|0);
        HEAP8[(((dest)+(3))>>0)]=((HEAP8[(((src)+(3))>>0)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
      }
    }
    // The remaining unaligned < 4 byte tail.
    while ((dest|0) < (dest_end|0)) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
    }
    return ret|0;
}
function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))>>0)])|0) + 24)|0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
    $a$0 = $a$0 | 0;
    $a$1 = $a$1 | 0;
    $b$0 = $b$0 | 0;
    $b$1 = $b$1 | 0;
    $rem = $rem | 0;
    var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
    $n_sroa_0_0_extract_trunc = $a$0;
    $n_sroa_1_4_extract_shift$0 = $a$1;
    $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
    $d_sroa_0_0_extract_trunc = $b$0;
    $d_sroa_1_4_extract_shift$0 = $b$1;
    $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
    if (($n_sroa_1_4_extract_trunc | 0) == 0) {
      $4 = ($rem | 0) != 0;
      if (($d_sroa_1_4_extract_trunc | 0) == 0) {
        if ($4) {
          HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        if (!$4) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
    $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
    do {
      if (($d_sroa_0_0_extract_trunc | 0) == 0) {
        if ($17) {
          if (($rem | 0) != 0) {
            HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
            HEAP32[$rem + 4 >> 2] = 0;
          }
          $_0$1 = 0;
          $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        if (($n_sroa_0_0_extract_trunc | 0) == 0) {
          if (($rem | 0) != 0) {
            HEAP32[$rem >> 2] = 0;
            HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
          }
          $_0$1 = 0;
          $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
        if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
          if (($rem | 0) != 0) {
            HEAP32[$rem >> 2] = 0 | $a$0 & -1;
            HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
          }
          $_0$1 = 0;
          $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        $49 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
        $51 = $49 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($51 >>> 0 <= 30) {
          $57 = $51 + 1 | 0;
          $58 = 31 - $51 | 0;
          $sr_1_ph = $57;
          $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        if (!$17) {
          $117 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
          $119 = $117 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
          if ($119 >>> 0 <= 31) {
            $125 = $119 + 1 | 0;
            $126 = 31 - $119 | 0;
            $130 = $119 - 31 >> 31;
            $sr_1_ph = $125;
            $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
            $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
            $q_sroa_0_1_ph = 0;
            $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
            break;
          }
          if (($rem | 0) == 0) {
            $_0$1 = 0;
            $_0$0 = 0;
            return (tempRet0 = $_0$1, $_0$0) | 0;
          }
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
        if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
          $86 = (Math_clz32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
          $88 = $86 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
          $89 = 64 - $88 | 0;
          $91 = 32 - $88 | 0;
          $92 = $91 >> 31;
          $95 = $88 - 32 | 0;
          $105 = $95 >> 31;
          $sr_1_ph = $88;
          $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
          $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
          $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
          $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
          break;
        }
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
          HEAP32[$rem + 4 >> 2] = 0;
        }
        if (($d_sroa_0_0_extract_trunc | 0) == 1) {
          $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
          $_0$0 = 0 | $a$0 & -1;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        } else {
          $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
          $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
          $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
      }
    } while (0);
    if (($sr_1_ph | 0) == 0) {
      $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
      $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
      $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
      $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
      $carry_0_lcssa$1 = 0;
      $carry_0_lcssa$0 = 0;
    } else {
      $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
      $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
      $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0 | 0, $d_sroa_0_0_insert_insert99$1 | 0, -1, -1) | 0;
      $137$1 = tempRet0;
      $q_sroa_1_1198 = $q_sroa_1_1_ph;
      $q_sroa_0_1199 = $q_sroa_0_1_ph;
      $r_sroa_1_1200 = $r_sroa_1_1_ph;
      $r_sroa_0_1201 = $r_sroa_0_1_ph;
      $sr_1202 = $sr_1_ph;
      $carry_0203 = 0;
      while (1) {
        $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
        $149 = $carry_0203 | $q_sroa_0_1199 << 1;
        $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
        $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
        _i64Subtract($137$0 | 0, $137$1 | 0, $r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0) | 0;
        $150$1 = tempRet0;
        $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
        $152 = $151$0 & 1;
        $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0, $151$0 & $d_sroa_0_0_insert_insert99$0 | 0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1 | 0) | 0;
        $r_sroa_0_0_extract_trunc = $154$0;
        $r_sroa_1_4_extract_trunc = tempRet0;
        $155 = $sr_1202 - 1 | 0;
        if (($155 | 0) == 0) {
          break;
        } else {
          $q_sroa_1_1198 = $147;
          $q_sroa_0_1199 = $149;
          $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
          $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
          $sr_1202 = $155;
          $carry_0203 = $152;
        }
      }
      $q_sroa_1_1_lcssa = $147;
      $q_sroa_0_1_lcssa = $149;
      $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
      $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
      $carry_0_lcssa$1 = 0;
      $carry_0_lcssa$0 = $152;
    }
    $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
    $q_sroa_0_0_insert_ext75$1 = 0;
    $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
    if (($rem | 0) != 0) {
      HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
      HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
    }
    $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
    $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
    $a$0 = $a$0 | 0;
    $a$1 = $a$1 | 0;
    $b$0 = $b$0 | 0;
    $b$1 = $b$1 | 0;
    var $1$0 = 0;
    $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
    return $1$0 | 0;
}
function _sbrk(increment) {
    increment = increment|0;
    var oldDynamicTop = 0;
    var oldDynamicTopOnChange = 0;
    var newDynamicTop = 0;
    var totalMemory = 0;
    increment = ((increment + 15) & -16)|0;
    oldDynamicTop = HEAP32[DYNAMICTOP_PTR>>2]|0;
    newDynamicTop = oldDynamicTop + increment | 0;

    if (((increment|0) > 0 & (newDynamicTop|0) < (oldDynamicTop|0)) // Detect and fail if we would wrap around signed 32-bit int.
      | (newDynamicTop|0) < 0) { // Also underflow, sbrk() should be able to be used to subtract.
      abortOnCannotGrowMemory()|0;
      ___setErrNo(12);
      return -1;
    }

    HEAP32[DYNAMICTOP_PTR>>2] = newDynamicTop;
    totalMemory = getTotalMemory()|0;
    if ((newDynamicTop|0) > (totalMemory|0)) {
      if ((enlargeMemory()|0) == 0) {
        HEAP32[DYNAMICTOP_PTR>>2] = oldDynamicTop;
        ___setErrNo(12);
        return -1;
      }
    }
    return oldDynamicTop|0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
    $a$0 = $a$0 | 0;
    $a$1 = $a$1 | 0;
    $b$0 = $b$0 | 0;
    $b$1 = $b$1 | 0;
    var $rem = 0, __stackBase__ = 0;
    __stackBase__ = STACKTOP;
    STACKTOP = STACKTOP + 16 | 0;
    $rem = __stackBase__ | 0;
    ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
    STACKTOP = __stackBase__;
    return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function _llvm_bswap_i32(x) {
    x = x|0;
    return (((x&0xff)<<24) | (((x>>8)&0xff)<<16) | (((x>>16)&0xff)<<8) | (x>>>24))|0;
}

  
function dynCall_iiiii(index,a1,a2,a3,a4) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0;
  return FUNCTION_TABLE_iiiii[index&127](a1|0,a2|0,a3|0,a4|0)|0;
}


function dynCall_dii(index,a1,a2) {
  index = index|0;
  a1=a1|0; a2=a2|0;
  return +FUNCTION_TABLE_dii[index&255](a1|0,a2|0);
}


function dynCall_viiiii(index,a1,a2,a3,a4,a5) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0; a5=a5|0;
  FUNCTION_TABLE_viiiii[index&63](a1|0,a2|0,a3|0,a4|0,a5|0);
}


function dynCall_i(index) {
  index = index|0;
  
  return FUNCTION_TABLE_i[index&255]()|0;
}


function dynCall_vi(index,a1) {
  index = index|0;
  a1=a1|0;
  FUNCTION_TABLE_vi[index&255](a1|0);
}


function dynCall_vii(index,a1,a2) {
  index = index|0;
  a1=a1|0; a2=a2|0;
  FUNCTION_TABLE_vii[index&255](a1|0,a2|0);
}


function dynCall_ii(index,a1) {
  index = index|0;
  a1=a1|0;
  return FUNCTION_TABLE_ii[index&255](a1|0)|0;
}


function dynCall_iiii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  return FUNCTION_TABLE_iiii[index&127](a1|0,a2|0,a3|0)|0;
}


function dynCall_viii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  FUNCTION_TABLE_viii[index&255](a1|0,a2|0,a3|0);
}


function dynCall_v(index) {
  index = index|0;
  
  FUNCTION_TABLE_v[index&255]();
}


function dynCall_viid(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=+a3;
  FUNCTION_TABLE_viid[index&255](a1|0,a2|0,+a3);
}


function dynCall_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0; a5=a5|0; a6=a6|0;
  FUNCTION_TABLE_viiiiii[index&127](a1|0,a2|0,a3|0,a4|0,a5|0,a6|0);
}


function dynCall_iii(index,a1,a2) {
  index = index|0;
  a1=a1|0; a2=a2|0;
  return FUNCTION_TABLE_iii[index&255](a1|0,a2|0)|0;
}


function dynCall_viiii(index,a1,a2,a3,a4) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0;
  FUNCTION_TABLE_viiii[index&255](a1|0,a2|0,a3|0,a4|0);
}

function b0(p0,p1,p2,p3) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0; nullFunc_iiiii(0);return 0;
}
function b1(p0,p1) {
 p0 = p0|0;p1 = p1|0; nullFunc_dii(1);return +0;
}
function b2(p0,p1,p2,p3,p4) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0; nullFunc_viiiii(2);
}
function b3() {
 ; nullFunc_i(3);return 0;
}
function b4(p0) {
 p0 = p0|0; nullFunc_vi(4);
}
function __embind_finalize_value_object__wrapper(p0) {
 p0 = p0|0; __embind_finalize_value_object(p0|0);
}
function __emval_decref__wrapper(p0) {
 p0 = p0|0; __emval_decref(p0|0);
}
function b5(p0,p1) {
 p0 = p0|0;p1 = p1|0; nullFunc_vii(5);
}
function b6(p0) {
 p0 = p0|0; nullFunc_ii(6);return 0;
}
function b7(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(7);return 0;
}
function b8(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_viii(8);
}
function b9() {
 ; nullFunc_v(9);
}
function ___cxa_end_catch__wrapper() {
 ; ___cxa_end_catch();
}
function b10(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = +p2; nullFunc_viid(10);
}
function b11(p0,p1,p2,p3,p4,p5) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0;p5 = p5|0; nullFunc_viiiiii(11);
}
function __embind_register_value_object__wrapper(p0,p1,p2,p3,p4,p5) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0;p5 = p5|0; __embind_register_value_object(p0|0,p1|0,p2|0,p3|0,p4|0,p5|0);
}
function b12(p0,p1) {
 p0 = p0|0;p1 = p1|0; nullFunc_iii(12);return 0;
}
function b13(p0,p1,p2,p3) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0; nullFunc_viiii(13);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_iiiii = [b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__26vectorIhNS2_9allocatorIhEEEEjRKhEbS7_JjS9_EE6invokeEPSB_PS6_jh,b0,b0,b0
,b0,b0,b0,b0,b0,b0,b0,b0,b0];
var FUNCTION_TABLE_dii = [b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEfE7getWireIS3_EEfRKMS3_fRKT_,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,__ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEfE7getWireIS3_EEfRKMS3_fRKT_,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1];
var FUNCTION_TABLE_viiiii = [b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,b2,b2,b2,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2
,b2,b2,b2,b2,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2
,b2,b2,b2,b2,b2];
var FUNCTION_TABLE_i = [b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,__ZN10emscripten8internal12operator_newI6PacketJEEEPT_DpOT0_,b3,b3,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,__ZN10emscripten8internal12operator_newINSt3__26vectorIhNS2_9allocatorIhEEEEJEEEPT_DpOT0_,b3,b3,b3,b3,b3,b3,b3,b3,b3,__ZN10emscripten8internal15raw_constructorIN10SmartDrive8SettingsEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,b3,__ZN10emscripten8internal6TypeIDIN10SmartDrive8SettingsEE3getEv
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,__ZN10emscripten8internal15raw_constructorIN6Packet11VersionInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,b3,__ZN10emscripten8internal6TypeIDIN6Packet11VersionInfoEE3getEv,b3,b3,__ZN10emscripten8internal15raw_constructorIN6Packet9DailyInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,b3,__ZN10emscripten8internal6TypeIDIN6Packet9DailyInfoEE3getEv,b3,b3,b3,b3,__ZN10emscripten8internal15raw_constructorIN6Packet11JourneyInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,b3,__ZN10emscripten8internal6TypeIDIN6Packet11JourneyInfoEE3getEv,b3,b3,b3,b3,__ZN10emscripten8internal15raw_constructorIN6Packet9MotorInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE
,b3,__ZN10emscripten8internal6TypeIDIN6Packet9MotorInfoEE3getEv,b3,b3,b3,b3,b3,b3,__ZN10emscripten8internal15raw_constructorIN6Packet9ErrorInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,b3,__ZN10emscripten8internal6TypeIDIN6Packet9ErrorInfoEE3getEv,b3,b3,b3,b3,b3,b3,__ZN10emscripten8internal15raw_constructorIN6Packet10DeviceInfoEJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,b3,__ZN10emscripten8internal6TypeIDIN6Packet10DeviceInfoEE3getEv,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,___cxa_get_globals_fast,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3];
var FUNCTION_TABLE_vi = [b4,b4,b4,b4,b4,b4,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,b4,b4,b4,b4,__ZN10__cxxabiv120__si_class_type_infoD0Ev,b4,b4,b4,__ZNSt9bad_allocD2Ev,__ZNSt9bad_allocD0Ev,b4,__ZNSt11logic_errorD2Ev,__ZNSt11logic_errorD0Ev,b4,__ZNSt12length_errorD0Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,b4,__ZN10__cxxabiv119__pointer_type_infoD0Ev,b4
,__ZN10__cxxabiv116__enum_type_infoD0Ev,b4,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorI6PacketEEvPT_,b4,b4,b4,b4,b4
,b4,__ZN6Packet9newPacketEv,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4
,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorINSt3__26vectorIhNS2_9allocatorIhEEEEEEvPT_,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorIN10SmartDrive8SettingsEEEvPT_,b4
,b4,b4,b4,b4,b4,b4,b4,b4,b4,__embind_finalize_value_object__wrapper,b4,__ZN10emscripten8internal14raw_destructorIN6Packet11VersionInfoEEEvPT_,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorIN6Packet9DailyInfoEEEvPT_,b4,b4,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorIN6Packet11JourneyInfoEEEvPT_,b4,b4,b4,b4,b4,b4
,__ZN10emscripten8internal14raw_destructorIN6Packet9MotorInfoEEEvPT_,b4,b4,b4,b4,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorIN6Packet9ErrorInfoEEEvPT_,b4,b4,b4,b4,b4,b4,b4,b4,__ZN10emscripten8internal14raw_destructorIN6Packet10DeviceInfoEEEvPT_,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4
,b4,__emval_decref__wrapper,__ZN6PacketC2Ev,b4,b4,b4,b4,b4,b4,b4,__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4
,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4
,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4];
var FUNCTION_TABLE_vii = [b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,__ZN10emscripten8internal13MethodInvokerIM6PacketFvvEvPS2_JEE6invokeERKS4_S5_,__ZN6Packet6formatEv,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5,b5,__ZN6Packet16setMotorDistanceEi,b5,b5,__ZNK6Packet8getBytesEv,__ZN6Packet8setBytesENSt3__26vectorIhNS0_9allocatorIhEEEE,b5,b5,__ZNSt3__26vectorIhNS_9allocatorIhEEE9push_backERKh,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,__ZNSt3__26vectorIhNS_9allocatorIhEEE21__push_back_slow_pathIhEEvOT_,__ZNSt3__26vectorIhNS_9allocatorIhEEE21__push_back_slow_pathIRKhEEvOT_,b5,__ZNSt3__26vectorIhNS_9allocatorIhEEE26__swap_out_circular_bufferERNS_14__split_bufferIhRS2_EE,b5,b5
,b5,b5,b5,b5,b5,__ZNSt3__26vectorIhNS_9allocatorIhEEE8allocateEj,b5,__ZNSt11logic_errorC2EPKc,__ZNSt3__218__libcpp_refstringC2EPKc,b5,b5,b5,_abort_message,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5];
var FUNCTION_TABLE_ii = [b6,___stdio_close,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,__ZNKSt9bad_alloc4whatEv,b6,b6,__ZNKSt11logic_error4whatEv,b6,b6,b6,b6,b6
,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,__ZN10emscripten8internal13getActualTypeI6PacketEEPKvPT_,b6,b6,__ZN10emscripten8internal7InvokerIP6PacketJEE6invokeEPFS3_vE,__ZN6Packet5validEv,b6,b6
,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6
,b6,b6,b6,b6,b6,__ZNK6Packet16getMotorDistanceEv,b6,b6,b6,b6,b6,b6,b6,b6,b6,__ZN10emscripten8internal13getActualTypeINSt3__26vectorIhNS2_9allocatorIhEEEEEEPKvPT_,b6,b6,__ZN10emscripten8internal7InvokerIPNSt3__26vectorIhNS2_9allocatorIhEEEEJEE6invokeEPFS7_vE,b6,b6,__ZNKSt3__26vectorIhNS_9allocatorIhEEE4sizeEv,b6,b6,b6,b6,b6,b6,b6,b6
,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6
,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6
,__ZN10emscripten8internal11BindingTypeINS_3valEE10toWireTypeERKS2_,b6,b6,__ZN10emscripten8internal11BindingTypeIbE10toWireTypeEb,__ZN10emscripten8internal18GenericBindingTypeINSt3__26vectorIhNS2_9allocatorIhEEEEE10toWireTypeEOS6_,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6
,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6
,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6];
var FUNCTION_TABLE_iiii = [b7,b7,___stdout_write,___stdio_seek,___stdio_write,b7,b7,b7,b7,b7,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,b7,__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv
,b7,__ZNK10__cxxabiv116__enum_type_info9can_catchEPKNS_16__shim_type_infoERPv,b7,b7,b7,b7,__ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_NS1_11ControlModeEEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_NS1_5UnitsEEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_hEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN10SmartDrive8SettingsEE5fieldIS2_fEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet11VersionInfoEE5fieldIS2_hEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9DailyInfoEE5fieldIS2_tEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9DailyInfoEE5fieldIS2_hEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet11JourneyInfoEE5fieldIS2_tEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet11JourneyInfoEE5fieldIS2_hEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9MotorInfoEE5fieldIS2_N5Motor5StateEEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9MotorInfoEE5fieldIS2_hEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9MotorInfoEE5fieldIS2_fEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9ErrorInfoEE5fieldIS2_tEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9ErrorInfoEE5fieldIS2_N10SmartDrive5ErrorEEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet9ErrorInfoEE5fieldIS2_hEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet10DeviceInfoEE5fieldIS2_NS1_6DeviceEEERS3_PKcMT_T0_,__ZN10emscripten12value_objectIN6Packet10DeviceInfoEE5fieldIS2_hEERS3_PKcMT_T0_,b7,b7,b7,b7,b7,b7,b7
,__ZN10emscripten8internal13MethodInvokerIM6PacketFbNSt3__212basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEEbPS2_JS9_EE6invokeERKSB_SC_PNS0_11BindingTypeIS9_EUt_E,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7
,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__26vectorIhNS3_9allocatorIhEEEEjES2_S9_JjEE6invokeEPSB_PS7_j,__ZN10emscripten8internal12VectorAccessINSt3__26vectorIhNS2_9allocatorIhEEEEE3setERS6_jRKh,b7,b7,b7,b7
,b7,b7,b7,b7,b7,b7,b7,b7,b7];
var FUNCTION_TABLE_viii = [b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8
,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8
,b8,b8,b8,b8,b8,b8,__ZN10emscripten8internal12MemberAccessI6PacketiE7setWireIS2_EEvRKMS2_iRT_i,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_4TypeEE7setWireIS2_EEvRKMS2_S3_RT_S3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_4DataEE7setWireIS2_EEvRKMS2_S3_RT_S3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_7CommandEE7setWireIS2_EEvRKMS2_S3_RT_S3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive5ErrorEE7setWireIS2_EEvRKMS2_S4_RT_S4_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_3OTAEE7setWireIS2_EEvRKMS2_S3_RT_S3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive8SettingsEE7setWireIS2_EEvRKMS2_S4_RT_PS4_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_11VersionInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_9DailyInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_11JourneyInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_9MotorInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_8TimeInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8
,__ZN10emscripten8internal12MemberAccessI6PacketNS2_10DeviceInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_9ErrorInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,__ZN10emscripten8internal12MemberAccessI6PacketNS2_11BatteryInfoEE7setWireIS2_EEvRKMS2_S3_RT_PS3_,b8,b8,b8,__ZN10emscripten8internal12SetterPolicyIM6PacketFviEE3setIS2_EEvRKS4_RT_i,b8,b8,b8,__ZN10emscripten8internal12SetterPolicyIM6PacketFvNSt3__26vectorIhNS3_9allocatorIhEEEEEE3setIS2_EEvRKS9_RT_PS7_,b8,__ZNSt3__26vectorIhNS_9allocatorIhEEE6resizeEjRKh,b8,b8,b8,b8,__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvRKhEvPS6_JS8_EE6invokeERKSA_SB_h,b8,b8,b8,__ZN10emscripten8internal12VectorAccessINSt3__26vectorIhNS2_9allocatorIhEEEEE3getERKS6_j,b8,b8,b8,b8,b8,b8
,b8,b8,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_11ControlModeEE7setWireIS3_EEvRKMS3_S4_RT_S4_,b8,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_5UnitsEE7setWireIS3_EEvRKMS3_S4_RT_S4_,b8,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEhE7setWireIS3_EEvRKMS3_hRT_h,b8,b8,b8,b8,b8,b8,b8,__ZN10emscripten8internal12MemberAccessIN6Packet11VersionInfoEhE7setWireIS3_EEvRKMS3_hRT_h,b8,b8,b8,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEtE7setWireIS3_EEvRKMS3_tRT_t,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEhE7setWireIS3_EEvRKMS3_hRT_h,b8,b8,b8,b8,__ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEtE7setWireIS3_EEvRKMS3_tRT_t,b8,__ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEhE7setWireIS3_EEvRKMS3_hRT_h,b8
,b8,b8,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEN5Motor5StateEE7setWireIS3_EEvRKMS3_S5_RT_S5_,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEhE7setWireIS3_EEvRKMS3_hRT_h,b8,b8,b8,b8,b8,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEtE7setWireIS3_EEvRKMS3_tRT_t,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEN10SmartDrive5ErrorEE7setWireIS3_EEvRKMS3_S5_RT_S5_,b8,__ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEhE7setWireIS3_EEvRKMS3_hRT_h,b8,b8,b8,b8,__ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoENS2_6DeviceEE7setWireIS3_EEvRKMS3_S4_RT_S4_,b8,__ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoEhE7setWireIS3_EEvRKMS3_hRT_h,b8,b8,b8,b8,b8,__ZNSt3__214__split_bufferIhRNS_9allocatorIhEEE18__construct_at_endEjRKh
,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8
,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8
,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8];
var FUNCTION_TABLE_v = [b9,b9,b9,b9,b9,__ZL25default_terminate_handlerv,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,___cxa_end_catch__wrapper,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9
,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9,b9];
var FUNCTION_TABLE_viid = [b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEfE7setWireIS3_EEvRKMS3_fRT_f,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,__ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEfE7setWireIS3_EEvRKMS3_fRT_f,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10
,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10,b10];
var FUNCTION_TABLE_viiiiii = [b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,b11,b11,b11,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11
,b11,b11,b11,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11
,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11
,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11,b11
,__embind_register_value_object__wrapper,b11,b11,b11,b11,b11,b11,b11,b11];
var FUNCTION_TABLE_iii = [b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12
,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,__ZN10emscripten8internal13MethodInvokerIM6PacketFbvEbPS2_JEE6invokeERKS4_S5_,__ZN6Packet13processPacketENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE
,b12,b12,b12,b12,__ZN10emscripten8internal13MethodInvokerIM6PacketFNSt3__26vectorIhNS3_9allocatorIhEEEEvES7_PS2_JEE6invokeERKS9_SA_,__ZN10emscripten8internal12MemberAccessI6PacketiE7getWireIS2_EEiRKMS2_iRKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_4TypeEE7getWireIS2_EES3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_4DataEE7getWireIS2_EES3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_7CommandEE7getWireIS2_EES3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive5ErrorEE7getWireIS2_EES4_RKMS2_S4_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_3OTAEE7getWireIS2_EES3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketN10SmartDrive8SettingsEE7getWireIS2_EEPS4_RKMS2_S4_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_11VersionInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_9DailyInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_11JourneyInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_9MotorInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_8TimeInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_10DeviceInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_
,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_9ErrorInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,__ZN10emscripten8internal12MemberAccessI6PacketNS2_11BatteryInfoEE7getWireIS2_EEPS3_RKMS2_S3_RKT_,b12,b12,b12,__ZN10emscripten8internal12GetterPolicyIM6PacketKFivEE3getIS2_EEiRKS4_RKT_,b12,b12,b12,__ZN10emscripten8internal12GetterPolicyIM6PacketKFNSt3__26vectorIhNS3_9allocatorIhEEEEvEE3getIS2_EEPS7_RKS9_RKT_,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIhNS2_9allocatorIhEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_,b12,b12,b12,b12,b12,b12,b12
,b12,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_11ControlModeEE7getWireIS3_EES4_RKMS3_S4_RKT_,b12,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsENS2_5UnitsEE7getWireIS3_EES4_RKMS3_S4_RKT_,b12,__ZN10emscripten8internal12MemberAccessIN10SmartDrive8SettingsEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12,b12,b12,b12,b12,b12,__ZN10emscripten8internal12MemberAccessIN6Packet11VersionInfoEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12,b12,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEtE7getWireIS3_EEtRKMS3_tRKT_,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9DailyInfoEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12,b12,b12,__ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEtE7getWireIS3_EEtRKMS3_tRKT_,b12,__ZN10emscripten8internal12MemberAccessIN6Packet11JourneyInfoEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12
,b12,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEN5Motor5StateEE7getWireIS3_EES5_RKMS3_S5_RKT_,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9MotorInfoEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12,b12,b12,b12,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEtE7getWireIS3_EEtRKMS3_tRKT_,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEN10SmartDrive5ErrorEE7getWireIS3_EES5_RKMS3_S5_RKT_,b12,__ZN10emscripten8internal12MemberAccessIN6Packet9ErrorInfoEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12,b12,b12,__ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoENS2_6DeviceEE7getWireIS3_EES4_RKMS3_S4_RKT_,b12,__ZN10emscripten8internal12MemberAccessIN6Packet10DeviceInfoEhE7getWireIS3_EEhRKMS3_hRKT_,b12,b12,b12,b12,b12,b12,b12
,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12
,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12
,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12,b12];
var FUNCTION_TABLE_viiii = [b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b13,b13,b13,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIhNS2_9allocatorIhEEEEFvjRKhEvPS6_JjS8_EE6invokeERKSA_SB_jh,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,__ZNSt3__214__split_bufferIhRNS_9allocatorIhEEEC2EjjS3_,b13,b13,b13
,b13,b13,b13,b13,b13,b13,__ZNSt3__26vectorIhNS_9allocatorIhEEE18__construct_at_endIPhEENS_9enable_ifIXsr21__is_forward_iteratorIT_EE5valueEvE4typeES7_S7_j,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13];

  return { _llvm_bswap_i32: _llvm_bswap_i32, dynCall_i: dynCall_i, stackSave: stackSave, _i64Subtract: _i64Subtract, ___udivdi3: ___udivdi3, setThrew: setThrew, dynCall_viii: dynCall_viii, _bitshift64Lshr: _bitshift64Lshr, dynCall_viid: dynCall_viid, _bitshift64Shl: _bitshift64Shl, _fflush: _fflush, ___cxa_is_pointer_type: ___cxa_is_pointer_type, dynCall_iii: dynCall_iii, _memset: _memset, _sbrk: _sbrk, _memcpy: _memcpy, stackAlloc: stackAlloc, dynCall_vii: dynCall_vii, ___uremdi3: ___uremdi3, dynCall_vi: dynCall_vi, getTempRet0: getTempRet0, __GLOBAL__sub_I_bind_cpp: __GLOBAL__sub_I_bind_cpp, setTempRet0: setTempRet0, _i64Add: _i64Add, dynCall_iiii: dynCall_iiii, dynCall_ii: dynCall_ii, _emscripten_get_global_libc: _emscripten_get_global_libc, __GLOBAL__sub_I_packet_cpp: __GLOBAL__sub_I_packet_cpp, dynCall_dii: dynCall_dii, dynCall_iiiii: dynCall_iiiii, dynCall_viiii: dynCall_viiii, ___errno_location: ___errno_location, dynCall_viiiii: dynCall_viiiii, ___cxa_can_catch: ___cxa_can_catch, _free: _free, runPostSets: runPostSets, dynCall_viiiiii: dynCall_viiiiii, establishStackSpace: establishStackSpace, stackRestore: stackRestore, _malloc: _malloc, ___getTypeName: ___getTypeName, dynCall_v: dynCall_v };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"]; asm["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__llvm_bswap_i32.apply(null, arguments);
};

var real_stackSave = asm["stackSave"]; asm["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackSave.apply(null, arguments);
};

var real_getTempRet0 = asm["getTempRet0"]; asm["getTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_getTempRet0.apply(null, arguments);
};

var real____udivdi3 = asm["___udivdi3"]; asm["___udivdi3"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____udivdi3.apply(null, arguments);
};

var real_setThrew = asm["setThrew"]; asm["setThrew"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setThrew.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__bitshift64Lshr.apply(null, arguments);
};

var real__bitshift64Shl = asm["_bitshift64Shl"]; asm["_bitshift64Shl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__bitshift64Shl.apply(null, arguments);
};

var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fflush.apply(null, arguments);
};

var real____cxa_is_pointer_type = asm["___cxa_is_pointer_type"]; asm["___cxa_is_pointer_type"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____cxa_is_pointer_type.apply(null, arguments);
};

var real__sbrk = asm["_sbrk"]; asm["_sbrk"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrk.apply(null, arguments);
};

var real_stackAlloc = asm["stackAlloc"]; asm["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackAlloc.apply(null, arguments);
};

var real____uremdi3 = asm["___uremdi3"]; asm["___uremdi3"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____uremdi3.apply(null, arguments);
};

var real__i64Subtract = asm["_i64Subtract"]; asm["_i64Subtract"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__i64Subtract.apply(null, arguments);
};

var real___GLOBAL__sub_I_bind_cpp = asm["__GLOBAL__sub_I_bind_cpp"]; asm["__GLOBAL__sub_I_bind_cpp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___GLOBAL__sub_I_bind_cpp.apply(null, arguments);
};

var real_setTempRet0 = asm["setTempRet0"]; asm["setTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setTempRet0.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__i64Add.apply(null, arguments);
};

var real__emscripten_get_global_libc = asm["_emscripten_get_global_libc"]; asm["_emscripten_get_global_libc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__emscripten_get_global_libc.apply(null, arguments);
};

var real___GLOBAL__sub_I_packet_cpp = asm["__GLOBAL__sub_I_packet_cpp"]; asm["__GLOBAL__sub_I_packet_cpp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___GLOBAL__sub_I_packet_cpp.apply(null, arguments);
};

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____errno_location.apply(null, arguments);
};

var real____cxa_can_catch = asm["___cxa_can_catch"]; asm["___cxa_can_catch"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____cxa_can_catch.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__free.apply(null, arguments);
};

var real_establishStackSpace = asm["establishStackSpace"]; asm["establishStackSpace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_establishStackSpace.apply(null, arguments);
};

var real_stackRestore = asm["stackRestore"]; asm["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackRestore.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__malloc.apply(null, arguments);
};

var real____getTypeName = asm["___getTypeName"]; asm["___getTypeName"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____getTypeName.apply(null, arguments);
};
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];
var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var _memset = Module["_memset"] = asm["_memset"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var ___uremdi3 = Module["___uremdi3"] = asm["___uremdi3"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = asm["_emscripten_get_global_libc"];
var __GLOBAL__sub_I_packet_cpp = Module["__GLOBAL__sub_I_packet_cpp"] = asm["__GLOBAL__sub_I_packet_cpp"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_dii = Module["dynCall_dii"] = asm["dynCall_dii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viid = Module["dynCall_viid"] = asm["dynCall_viid"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
;
Runtime.stackAlloc = Module['stackAlloc'];
Runtime.stackSave = Module['stackSave'];
Runtime.stackRestore = Module['stackRestore'];
Runtime.establishStackSpace = Module['establishStackSpace'];
Runtime.setTempRet0 = Module['setTempRet0'];
Runtime.getTempRet0 = Module['getTempRet0'];


// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;







/**
 * @constructor
 * @extends {Error}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack];
      }
      Module.printErr('exception thrown: ' + toLog);
      Module['quit'](1, e);
    }
  } finally {
    calledMain = true;
  }
}




/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') implicitly called by end of main(), but noExitRuntime, so not exiting the runtime (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)');
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  if (ENVIRONMENT_IS_NODE) {
    process['exit'](status);
  }
  Module['quit'](status, new ExitStatus(status));
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}





// {{MODULE_ADDITIONS}}



