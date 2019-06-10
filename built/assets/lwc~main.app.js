(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["lwc~main"],{

/***/ "./node_modules/@lwc/engine/lib/3rdparty/snabbdom/snabbdom.js":
/*!********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/3rdparty/snabbdom/snabbdom.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
@license
Copyright (c) 2015 Simon Friis Vindum.
This code may only be used under the MIT License found at
https://github.com/snabbdom/snabbdom/blob/master/LICENSE
Code distributed by Snabbdom as part of the Snabbdom project at
https://github.com/snabbdom/snabbdom/
*/

Object.defineProperty(exports, "__esModule", {
  value: true
});

function isUndef(s) {
  return s === undefined;
}

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function isVNode(vnode) {
  return vnode != null;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  const map = {};
  let j, key, ch; // TODO: simplify this by assuming that all vnodes has keys

  for (j = beginIdx; j <= endIdx; ++j) {
    ch = children[j];

    if (isVNode(ch)) {
      key = ch.key;

      if (key !== undefined) {
        map[key] = j;
      }
    }
  }

  return map;
}

function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];

    if (isVNode(ch)) {
      ch.hook.create(ch);
      ch.hook.insert(ch, parentElm, before);
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]; // text nodes do not have logic associated to them

    if (isVNode(ch)) {
      ch.hook.remove(ch, parentElm);
    }
  }
}

function updateDynamicChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let elmToMove;
  let before;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (!isVNode(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
    } else if (!isVNode(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (!isVNode(newStartVnode)) {
      newStartVnode = newCh[++newStartIdx];
    } else if (!isVNode(newEndVnode)) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode);
      newEndVnode.hook.move(oldStartVnode, parentElm, // TODO: resolve this, but using dot notation for nextSibling for now
      oldEndVnode.elm.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode);
      newStartVnode.hook.move(oldEndVnode, parentElm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }

      idxInOld = oldKeyToIdx[newStartVnode.key];

      if (isUndef(idxInOld)) {
        // New element
        newStartVnode.hook.create(newStartVnode);
        newStartVnode.hook.insert(newStartVnode, parentElm, oldStartVnode.elm);
        newStartVnode = newCh[++newStartIdx];
      } else {
        elmToMove = oldCh[idxInOld];

        if (isVNode(elmToMove)) {
          if (elmToMove.sel !== newStartVnode.sel) {
            // New element
            newStartVnode.hook.create(newStartVnode);
            newStartVnode.hook.insert(newStartVnode, parentElm, oldStartVnode.elm);
          } else {
            patchVnode(elmToMove, newStartVnode);
            oldCh[idxInOld] = undefined;
            newStartVnode.hook.move(elmToMove, parentElm, oldStartVnode.elm);
          }
        }

        newStartVnode = newCh[++newStartIdx];
      }
    }
  }

  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      const n = newCh[newEndIdx + 1];
      before = isVNode(n) ? n.elm : null;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}

exports.updateDynamicChildren = updateDynamicChildren;

function updateStaticChildren(parentElm, oldCh, newCh) {
  const {
    length
  } = newCh;

  if (oldCh.length === 0) {
    // the old list is empty, we can directly insert anything new
    addVnodes(parentElm, null, newCh, 0, length);
    return;
  } // if the old list is not empty, the new list MUST have the same
  // amount of nodes, that's why we call this static children


  let referenceElm = null;

  for (let i = length - 1; i >= 0; i -= 1) {
    const vnode = newCh[i];
    const oldVNode = oldCh[i];

    if (vnode !== oldVNode) {
      if (isVNode(oldVNode)) {
        if (isVNode(vnode)) {
          // both vnodes must be equivalent, and se just need to patch them
          patchVnode(oldVNode, vnode);
          referenceElm = vnode.elm;
        } else {
          // removing the old vnode since the new one is null
          oldVNode.hook.remove(oldVNode, parentElm);
        }
      } else if (isVNode(vnode)) {
        // this condition is unnecessary
        vnode.hook.create(vnode); // insert the new node one since the old one is null

        vnode.hook.insert(vnode, parentElm, referenceElm);
        referenceElm = vnode.elm;
      }
    }
  }
}

exports.updateStaticChildren = updateStaticChildren;

function patchVnode(oldVnode, vnode) {
  if (oldVnode !== vnode) {
    vnode.elm = oldVnode.elm;
    vnode.hook.update(oldVnode, vnode);
  }
}

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/env/dom.js":
/*!*************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/env/dom.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const ShadowRootHostGetter = language_1.getOwnPropertyDescriptor(window.ShadowRoot.prototype, 'host').get;
exports.ShadowRootHostGetter = ShadowRootHostGetter;
const ShadowRootInnerHTMLSetter = language_1.getOwnPropertyDescriptor(window.ShadowRoot.prototype, 'innerHTML').set;
exports.ShadowRootInnerHTMLSetter = ShadowRootInnerHTMLSetter;
const dispatchEvent = 'EventTarget' in window ? EventTarget.prototype.dispatchEvent : Node.prototype.dispatchEvent; // IE11
exports.dispatchEvent = dispatchEvent;
//# sourceMappingURL=dom.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/env/element.js":
/*!*****************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/env/element.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const { hasAttribute, getAttribute, setAttribute, setAttributeNS, removeAttribute, removeAttributeNS, } = Element.prototype;
exports.hasAttribute = hasAttribute;
exports.getAttribute = getAttribute;
exports.setAttribute = setAttribute;
exports.setAttributeNS = setAttributeNS;
exports.removeAttribute = removeAttribute;
exports.removeAttributeNS = removeAttributeNS;
const tagNameGetter = language_1.getOwnPropertyDescriptor(Element.prototype, 'tagName').get;
exports.tagNameGetter = tagNameGetter;
//# sourceMappingURL=element.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/env/node.js":
/*!**************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/env/node.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const { appendChild, insertBefore, removeChild, replaceChild } = Node.prototype;
exports.appendChild = appendChild;
exports.insertBefore = insertBefore;
exports.removeChild = removeChild;
exports.replaceChild = replaceChild;
const parentNodeGetter = language_1.getOwnPropertyDescriptor(Node.prototype, 'parentNode').get;
exports.parentNodeGetter = parentNodeGetter;
const parentElementGetter = language_1.hasOwnProperty.call(Node.prototype, 'parentElement')
    ? language_1.getOwnPropertyDescriptor(Node.prototype, 'parentElement').get
    : language_1.getOwnPropertyDescriptor(HTMLElement.prototype, 'parentElement').get; // IE11
exports.parentElementGetter = parentElementGetter;
//# sourceMappingURL=node.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/api.js":
/*!*******************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/api.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const invoker_1 = __webpack_require__(/*! ./invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const hooks_1 = __webpack_require__(/*! ./hooks */ "./node_modules/@lwc/engine/lib/framework/hooks.js");
const patch_1 = __webpack_require__(/*! ./patch */ "./node_modules/@lwc/engine/lib/framework/patch.js");
const services_1 = __webpack_require__(/*! ./services */ "./node_modules/@lwc/engine/lib/framework/services.js");
const restrictions_1 = __webpack_require__(/*! ./restrictions */ "./node_modules/@lwc/engine/lib/framework/restrictions.js");
const CHAR_S = 115;
const CHAR_V = 118;
const CHAR_G = 103;
const NamespaceAttributeForSVG = 'http://www.w3.org/2000/svg';
const SymbolIterator = Symbol.iterator;
const TextHook = {
    create: (vnode) => {
        if (language_1.isUndefined(vnode.elm)) {
            // supporting the ability to inject an element via a vnode
            // this is used mostly for caching in compiler
            vnode.elm = document.createTextNode(vnode.text);
        }
        linkNodeToShadow(vnode);
        if (undefined !== 'production') {
            restrictions_1.markNodeFromVNode(vnode.elm);
        }
        hooks_1.createTextHook(vnode);
    },
    update: hooks_1.updateNodeHook,
    insert: hooks_1.insertNodeHook,
    move: hooks_1.insertNodeHook,
    remove: hooks_1.removeNodeHook,
};
const CommentHook = {
    create: (vnode) => {
        if (language_1.isUndefined(vnode.elm)) {
            // supporting the ability to inject an element via a vnode
            // this is used mostly for caching in compiler
            vnode.elm = document.createComment(vnode.text);
        }
        linkNodeToShadow(vnode);
        if (undefined !== 'production') {
            restrictions_1.markNodeFromVNode(vnode.elm);
        }
        hooks_1.createCommentHook(vnode);
    },
    update: hooks_1.updateNodeHook,
    insert: hooks_1.insertNodeHook,
    move: hooks_1.insertNodeHook,
    remove: hooks_1.removeNodeHook,
};
// insert is called after update, which is used somewhere else (via a module)
// to mark the vm as inserted, that means we cannot use update as the main channel
// to rehydrate when dirty, because sometimes the element is not inserted just yet,
// which breaks some invariants. For that reason, we have the following for any
// Custom Element that is inserted via a template.
const ElementHook = {
    create: (vnode) => {
        const { data, sel, elm } = vnode;
        const { ns } = data;
        if (language_1.isUndefined(elm)) {
            // supporting the ability to inject an element via a vnode
            // this is used mostly for caching in compiler and style tags
            vnode.elm = language_1.isUndefined(ns)
                ? document.createElement(sel)
                : document.createElementNS(ns, sel);
        }
        linkNodeToShadow(vnode);
        if (undefined !== 'production') {
            restrictions_1.markNodeFromVNode(vnode.elm);
        }
        hooks_1.fallbackElmHook(vnode);
        hooks_1.createElmHook(vnode);
    },
    update: (oldVnode, vnode) => {
        hooks_1.updateElmHook(oldVnode, vnode);
        hooks_1.updateChildrenHook(oldVnode, vnode);
    },
    insert: (vnode, parentNode, referenceNode) => {
        hooks_1.insertNodeHook(vnode, parentNode, referenceNode);
        hooks_1.createChildrenHook(vnode);
    },
    move: (vnode, parentNode, referenceNode) => {
        hooks_1.insertNodeHook(vnode, parentNode, referenceNode);
    },
    remove: (vnode, parentNode) => {
        hooks_1.removeNodeHook(vnode, parentNode);
        hooks_1.removeElmHook(vnode);
    },
};
const CustomElementHook = {
    create: (vnode) => {
        const { sel, elm } = vnode;
        if (language_1.isUndefined(elm)) {
            // supporting the ability to inject an element via a vnode
            // this is used mostly for caching in compiler and style tags
            vnode.elm = document.createElement(sel);
        }
        linkNodeToShadow(vnode);
        if (undefined !== 'production') {
            restrictions_1.markNodeFromVNode(vnode.elm);
        }
        hooks_1.createViewModelHook(vnode);
        hooks_1.allocateChildrenHook(vnode);
        hooks_1.createCustomElmHook(vnode);
    },
    update: (oldVnode, vnode) => {
        hooks_1.updateCustomElmHook(oldVnode, vnode);
        // in fallback mode, the allocation will always the children to
        // empty and delegate the real allocation to the slot elements
        hooks_1.allocateChildrenHook(vnode);
        // in fallback mode, the children will be always empty, so, nothing
        // will happen, but in native, it does allocate the light dom
        hooks_1.updateChildrenHook(oldVnode, vnode);
        // this will update the shadowRoot
        hooks_1.rerenderCustomElmHook(vnode);
    },
    insert: (vnode, parentNode, referenceNode) => {
        hooks_1.insertNodeHook(vnode, parentNode, referenceNode);
        hooks_1.createChildrenHook(vnode);
        hooks_1.insertCustomElmHook(vnode);
    },
    move: (vnode, parentNode, referenceNode) => {
        hooks_1.insertNodeHook(vnode, parentNode, referenceNode);
    },
    remove: (vnode, parentNode) => {
        hooks_1.removeNodeHook(vnode, parentNode);
        hooks_1.removeCustomElmHook(vnode);
    },
};
function linkNodeToShadow(vnode) {
    // TODO: #1164 - this should eventually be done by the polyfill directly
    vnode.elm.$shadowResolver$ = vnode.owner.cmpRoot.$shadowResolver$;
}
// TODO: #1136 - this should be done by the compiler, adding ns to every sub-element
function addNS(vnode) {
    const { data, children, sel } = vnode;
    data.ns = NamespaceAttributeForSVG;
    // TODO: #1275 - review why `sel` equal `foreignObject` should get this `ns`
    if (language_1.isArray(children) && sel !== 'foreignObject') {
        for (let j = 0, n = children.length; j < n; ++j) {
            const childNode = children[j];
            if (childNode != null && childNode.hook === ElementHook) {
                addNS(childNode);
            }
        }
    }
}
function addVNodeToChildLWC(vnode) {
    language_1.ArrayPush.call(invoker_1.vmBeingRendered.velements, vnode);
}
// [h]tml node
function h(sel, data, children) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isString(sel), `h() 1st argument sel must be a string.`);
        assert_1.default.isTrue(language_1.isObject(data), `h() 2nd argument data must be an object.`);
        assert_1.default.isTrue(language_1.isArray(children), `h() 3rd argument children must be an array.`);
        assert_1.default.isTrue('key' in data, ` <${sel}> "key" attribute is invalid or missing for ${invoker_1.vmBeingRendered}. Key inside iterator is either undefined or null.`);
        // checking reserved internal data properties
        assert_1.default.isFalse(data.className && data.classMap, `vnode.data.className and vnode.data.classMap ambiguous declaration.`);
        assert_1.default.isFalse(data.styleMap && data.style, `vnode.data.styleMap and vnode.data.style ambiguous declaration.`);
        if (data.style && !language_1.isString(data.style)) {
            assert_1.default.logError(`Invalid 'style' attribute passed to <${sel}> is ignored. This attribute must be a string value.`, invoker_1.vmBeingRendered.elm);
        }
        language_1.forEach.call(children, (childVnode) => {
            if (childVnode != null) {
                assert_1.default.isTrue(childVnode &&
                    'sel' in childVnode &&
                    'data' in childVnode &&
                    'children' in childVnode &&
                    'text' in childVnode &&
                    'elm' in childVnode &&
                    'key' in childVnode, `${childVnode} is not a vnode.`);
            }
        });
    }
    const { key } = data;
    let text, elm;
    const vnode = {
        sel,
        data,
        children,
        text,
        elm,
        key,
        hook: ElementHook,
        owner: invoker_1.vmBeingRendered,
    };
    if (sel.length === 3 &&
        language_1.StringCharCodeAt.call(sel, 0) === CHAR_S &&
        language_1.StringCharCodeAt.call(sel, 1) === CHAR_V &&
        language_1.StringCharCodeAt.call(sel, 2) === CHAR_G) {
        addNS(vnode);
    }
    return vnode;
}
exports.h = h;
// [t]ab[i]ndex function
function ti(value) {
    // if value is greater than 0, we normalize to 0
    // If value is an invalid tabIndex value (null, undefined, string, etc), we let that value pass through
    // If value is less than -1, we don't care
    const shouldNormalize = value > 0 && !(language_1.isTrue(value) || language_1.isFalse(value));
    if (undefined !== 'production') {
        if (shouldNormalize) {
            assert_1.default.logError(`Invalid tabindex value \`${language_1.toString(value)}\` in template for ${invoker_1.vmBeingRendered}. This attribute must be set to 0 or -1.`, invoker_1.vmBeingRendered.elm);
        }
    }
    return shouldNormalize ? 0 : value;
}
exports.ti = ti;
// [s]lot element node
function s(slotName, data, children, slotset) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isString(slotName), `s() 1st argument slotName must be a string.`);
        assert_1.default.isTrue(language_1.isObject(data), `s() 2nd argument data must be an object.`);
        assert_1.default.isTrue(language_1.isArray(children), `h() 3rd argument children must be an array.`);
    }
    if (!language_1.isUndefined(slotset) &&
        !language_1.isUndefined(slotset[slotName]) &&
        slotset[slotName].length !== 0) {
        children = slotset[slotName];
    }
    const vnode = h('slot', data, children);
    if (utils_1.useSyntheticShadow) {
        // the content of the slot has to be dynamic when in synthetic shadow mode because
        // the `vnode.children` might be the slotted content vs default content, in which case
        // the size and the keys are not matching.
        patch_1.markAsDynamicChildren(children);
    }
    return vnode;
}
exports.s = s;
// [c]ustom element node
function c(sel, Ctor, data, children) {
    if (utils_1.isCircularModuleDependency(Ctor)) {
        Ctor = utils_1.resolveCircularModuleDependency(Ctor);
    }
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isString(sel), `c() 1st argument sel must be a string.`);
        assert_1.default.isTrue(language_1.isFunction(Ctor), `c() 2nd argument Ctor must be a function.`);
        assert_1.default.isTrue(language_1.isObject(data), `c() 3nd argument data must be an object.`);
        assert_1.default.isTrue(arguments.length === 3 || language_1.isArray(children), `c() 4nd argument data must be an array.`);
        // checking reserved internal data properties
        assert_1.default.isFalse(data.className && data.classMap, `vnode.data.className and vnode.data.classMap ambiguous declaration.`);
        assert_1.default.isFalse(data.styleMap && data.style, `vnode.data.styleMap and vnode.data.style ambiguous declaration.`);
        if (data.style && !language_1.isString(data.style)) {
            assert_1.default.logError(`Invalid 'style' attribute passed to <${sel}> is ignored. This attribute must be a string value.`, invoker_1.vmBeingRendered.elm);
        }
        if (arguments.length === 4) {
            language_1.forEach.call(children, (childVnode) => {
                if (childVnode != null) {
                    assert_1.default.isTrue(childVnode &&
                        'sel' in childVnode &&
                        'data' in childVnode &&
                        'children' in childVnode &&
                        'text' in childVnode &&
                        'elm' in childVnode &&
                        'key' in childVnode, `${childVnode} is not a vnode.`);
                }
            });
        }
    }
    const { key } = data;
    let text, elm;
    children = arguments.length === 3 ? utils_1.EmptyArray : children;
    const vnode = {
        sel,
        data,
        children,
        text,
        elm,
        key,
        hook: CustomElementHook,
        ctor: Ctor,
        owner: invoker_1.vmBeingRendered,
        mode: 'open',
    };
    addVNodeToChildLWC(vnode);
    return vnode;
}
exports.c = c;
// [i]terable node
function i(iterable, factory) {
    const list = [];
    // marking the list as generated from iteration so we can optimize the diffing
    patch_1.markAsDynamicChildren(list);
    if (language_1.isUndefined(iterable) || iterable === null) {
        if (undefined !== 'production') {
            assert_1.default.logError(`Invalid template iteration for value "${language_1.toString(iterable)}" in ${invoker_1.vmBeingRendered}. It must be an Array or an iterable Object.`, invoker_1.vmBeingRendered.elm);
        }
        return list;
    }
    if (undefined !== 'production') {
        assert_1.default.isFalse(language_1.isUndefined(iterable[SymbolIterator]), `Invalid template iteration for value \`${language_1.toString(iterable)}\` in ${invoker_1.vmBeingRendered}. It must be an array-like object and not \`null\` nor \`undefined\`.`);
    }
    const iterator = iterable[SymbolIterator]();
    if (undefined !== 'production') {
        assert_1.default.isTrue(iterator && language_1.isFunction(iterator.next), `Invalid iterator function for "${language_1.toString(iterable)}" in ${invoker_1.vmBeingRendered}.`);
    }
    let next = iterator.next();
    let j = 0;
    let { value, done: last } = next;
    let keyMap;
    let iterationError;
    if (undefined !== 'production') {
        keyMap = language_1.create(null);
    }
    while (last === false) {
        // implementing a look-back-approach because we need to know if the element is the last
        next = iterator.next();
        last = next.done;
        // template factory logic based on the previous collected value
        const vnode = factory(value, j, j === 0, last);
        if (language_1.isArray(vnode)) {
            language_1.ArrayPush.apply(list, vnode);
        }
        else {
            language_1.ArrayPush.call(list, vnode);
        }
        if (undefined !== 'production') {
            const vnodes = language_1.isArray(vnode) ? vnode : [vnode];
            language_1.forEach.call(vnodes, (childVnode) => {
                if (!language_1.isNull(childVnode) && language_1.isObject(childVnode) && !language_1.isUndefined(childVnode.sel)) {
                    const { key } = childVnode;
                    if (language_1.isString(key) || language_1.isNumber(key)) {
                        if (keyMap[key] === 1 && language_1.isUndefined(iterationError)) {
                            iterationError = `Duplicated "key" attribute value for "<${childVnode.sel}>" in ${invoker_1.vmBeingRendered} for item number ${j}. A key with value "${childVnode.key}" appears more than once in the iteration. Key values must be unique numbers or strings.`;
                        }
                        keyMap[key] = 1;
                    }
                    else if (language_1.isUndefined(iterationError)) {
                        iterationError = `Invalid "key" attribute value in "<${childVnode.sel}>" in ${invoker_1.vmBeingRendered} for item number ${j}. Set a unique "key" value on all iterated child elements.`;
                    }
                }
            });
        }
        // preparing next value
        j += 1;
        value = next.value;
    }
    if (undefined !== 'production') {
        if (!language_1.isUndefined(iterationError)) {
            assert_1.default.logError(iterationError, invoker_1.vmBeingRendered.elm);
        }
    }
    return list;
}
exports.i = i;
/**
 * [f]lattening
 */
function f(items) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isArray(items), 'flattening api can only work with arrays.');
    }
    const len = items.length;
    const flattened = [];
    // all flattened nodes should be marked as dynamic because
    // flattened nodes are because of a conditional or iteration.
    // We have to mark as dynamic because this could switch from an
    // iterator to "static" text at any time.
    // TODO: #1276 - compiler should give us some sort of indicator to describe whether a vnode is dynamic or not
    patch_1.markAsDynamicChildren(flattened);
    for (let j = 0; j < len; j += 1) {
        const item = items[j];
        if (language_1.isArray(item)) {
            language_1.ArrayPush.apply(flattened, item);
        }
        else {
            language_1.ArrayPush.call(flattened, item);
        }
    }
    return flattened;
}
exports.f = f;
// [t]ext node
function t(text) {
    const data = utils_1.EmptyObject;
    let sel, children, key, elm;
    return {
        sel,
        data,
        children,
        text,
        elm,
        key,
        hook: TextHook,
        owner: invoker_1.vmBeingRendered,
    };
}
exports.t = t;
// comment node
function p(text) {
    const data = utils_1.EmptyObject;
    const sel = '!';
    let children, key, elm;
    return {
        sel,
        data,
        children,
        text,
        elm,
        key,
        hook: CommentHook,
        owner: invoker_1.vmBeingRendered,
    };
}
exports.p = p;
// [d]ynamic value to produce a text vnode
function d(value) {
    if (value == null) {
        return null;
    }
    return t(value);
}
exports.d = d;
// [b]ind function
function b(fn) {
    if (language_1.isNull(invoker_1.vmBeingRendered)) {
        throw new Error();
    }
    const vm = invoker_1.vmBeingRendered;
    return function (event) {
        invoker_1.invokeEventListener(vm, fn, vm.component, event);
    };
}
exports.b = b;
// [f]unction_[b]ind
function fb(fn) {
    if (language_1.isNull(invoker_1.vmBeingRendered)) {
        throw new Error();
    }
    const vm = invoker_1.vmBeingRendered;
    return function () {
        return invoker_1.invokeComponentCallback(vm, fn, language_1.ArraySlice.call(arguments));
    };
}
exports.fb = fb;
// [l]ocator_[l]istener function
function ll(originalHandler, id, context) {
    if (language_1.isNull(invoker_1.vmBeingRendered)) {
        throw new Error();
    }
    const vm = invoker_1.vmBeingRendered;
    // bind the original handler with b() so we can call it
    // after resolving the locator
    const eventListener = b(originalHandler);
    // create a wrapping handler to resolve locator, and
    // then invoke the original handler.
    return function (event) {
        // located service for the locator metadata
        const { context: { locator }, } = vm;
        if (!language_1.isUndefined(locator)) {
            const { locator: locatorService } = services_1.Services;
            if (locatorService) {
                locator.resolved = {
                    target: id,
                    host: locator.id,
                    targetContext: language_1.isFunction(context) && context(),
                    hostContext: language_1.isFunction(locator.context) && locator.context(),
                };
                // a registered `locator` service will be invoked with
                // access to the context.locator.resolved, which will contain:
                // outer id, outer context, inner id, and inner context
                services_1.invokeServiceHook(vm, locatorService);
            }
        }
        // invoke original event listener via b()
        eventListener(event);
    };
}
exports.ll = ll;
// [k]ey function
function k(compilerKey, obj) {
    switch (typeof obj) {
        case 'number':
        case 'string':
            return compilerKey + ':' + obj;
        case 'object':
            if (undefined !== 'production') {
                assert_1.default.fail(`Invalid key value "${obj}" in ${invoker_1.vmBeingRendered}. Key must be a string or number.`);
            }
    }
}
exports.k = k;
// [g]lobal [id] function
function gid(id) {
    if (language_1.isUndefined(id) || id === '') {
        if (undefined !== 'production') {
            assert_1.default.logError(`Invalid id value "${id}". The id attribute must contain a non-empty string.`, invoker_1.vmBeingRendered.elm);
        }
        return id;
    }
    // We remove attributes when they are assigned a value of null
    if (language_1.isNull(id)) {
        return null;
    }
    return `${id}-${invoker_1.vmBeingRendered.idx}`;
}
exports.gid = gid;
// [f]ragment [id] function
function fid(url) {
    if (language_1.isUndefined(url) || url === '') {
        if (undefined !== 'production') {
            if (language_1.isUndefined(url)) {
                assert_1.default.logError(`Undefined url value for "href" or "xlink:href" attribute. Expected a non-empty string.`, invoker_1.vmBeingRendered.elm);
            }
        }
        return url;
    }
    // We remove attributes when they are assigned a value of null
    if (language_1.isNull(url)) {
        return null;
    }
    // Apply transformation only for fragment-only-urls
    if (/^#/.test(url)) {
        return `${url}-${invoker_1.vmBeingRendered.idx}`;
    }
    return url;
}
exports.fid = fid;
//# sourceMappingURL=api.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/attributes.js":
/*!**************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/attributes.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const main_1 = __webpack_require__(/*! ../polyfills/aria-properties/main */ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/main.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
// These properties get added to LWCElement.prototype publicProps automatically
exports.defaultDefHTMLPropertyNames = [
    'dir',
    'id',
    'accessKey',
    'title',
    'lang',
    'hidden',
    'draggable',
    'tabIndex',
];
// Few more exceptions that are using the attribute name to match the property in lowercase.
// this list was compiled from https://msdn.microsoft.com/en-us/library/ms533062(v=vs.85).aspx
// and https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
// Note: this list most be in sync with the compiler as well.
const HTMLPropertyNamesWithLowercasedReflectiveAttributes = [
    'accessKey',
    'readOnly',
    'tabIndex',
    'bgColor',
    'colSpan',
    'rowSpan',
    'contentEditable',
    'dateTime',
    'formAction',
    'isMap',
    'maxLength',
    'useMap',
];
function offsetPropertyErrorMessage(name) {
    return `Using the \`${name}\` property is an anti-pattern because it rounds the value to an integer. Instead, use the \`getBoundingClientRect\` method to obtain fractional values for the size of an element and its position relative to the viewport.`;
}
// Global HTML Attributes & Properties
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
exports.globalHTMLProperties = language_1.assign(language_1.create(null), {
    id: {
        attribute: 'id',
    },
    accessKey: {
        attribute: 'accesskey',
    },
    accessKeyLabel: {
        readOnly: true,
    },
    className: {
        attribute: 'class',
        error: `Using the \`className\` property is an anti-pattern because of slow runtime behavior and potential conflicts with classes provided by the owner element. Use the \`classList\` API instead.`,
    },
    contentEditable: {
        attribute: 'contenteditable',
    },
    isContentEditable: {
        readOnly: true,
    },
    contextMenu: {
        attribute: 'contextmenu',
    },
    dataset: {
        readOnly: true,
        error: "Using the `dataset` property is an anti-pattern because it can't be statically analyzed. Expose each property individually using the `@api` decorator instead.",
    },
    dir: {
        attribute: 'dir',
    },
    draggable: {
        attribute: 'draggable',
    },
    dropzone: {
        attribute: 'dropzone',
        readOnly: true,
    },
    hidden: {
        attribute: 'hidden',
    },
    itemScope: {
        attribute: 'itemscope',
    },
    itemType: {
        attribute: 'itemtype',
        readOnly: true,
    },
    itemId: {
        attribute: 'itemid',
    },
    itemRef: {
        attribute: 'itemref',
        readOnly: true,
    },
    itemProp: {
        attribute: 'itemprop',
        readOnly: true,
    },
    lang: {
        attribute: 'lang',
    },
    offsetHeight: {
        readOnly: true,
        error: offsetPropertyErrorMessage('offsetHeight'),
    },
    offsetLeft: {
        readOnly: true,
        error: offsetPropertyErrorMessage('offsetLeft'),
    },
    offsetParent: {
        readOnly: true,
    },
    offsetTop: {
        readOnly: true,
        error: offsetPropertyErrorMessage('offsetTop'),
    },
    offsetWidth: {
        readOnly: true,
        error: offsetPropertyErrorMessage('offsetWidth'),
    },
    properties: {
        readOnly: true,
    },
    spellcheck: {
        attribute: 'spellcheck',
    },
    style: {
        attribute: 'style',
    },
    tabIndex: {
        attribute: 'tabindex',
    },
    title: {
        attribute: 'title',
    },
    // additional global attributes that are not present in the link above.
    role: {
        attribute: 'role',
    },
    slot: {
        attribute: 'slot',
        error: 'Using the `slot` attribute is an anti-pattern.',
    },
});
const AttrNameToPropNameMap = language_1.create(null);
const PropNameToAttrNameMap = language_1.create(null);
// Synthetic creation of all AOM property descriptors for Custom Elements
language_1.forEach.call(main_1.ElementPrototypeAriaPropertyNames, (propName) => {
    // Typescript is inferring the wrong function type for this particular
    // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
    // @ts-ignore type-mismatch
    const attrName = language_1.StringToLowerCase.call(language_1.StringReplace.call(propName, /^aria/, 'aria-'));
    AttrNameToPropNameMap[attrName] = propName;
    PropNameToAttrNameMap[propName] = attrName;
});
language_1.forEach.call(exports.defaultDefHTMLPropertyNames, propName => {
    const attrName = language_1.StringToLowerCase.call(propName);
    AttrNameToPropNameMap[attrName] = propName;
    PropNameToAttrNameMap[propName] = attrName;
});
language_1.forEach.call(HTMLPropertyNamesWithLowercasedReflectiveAttributes, propName => {
    const attrName = language_1.StringToLowerCase.call(propName);
    AttrNameToPropNameMap[attrName] = propName;
    PropNameToAttrNameMap[propName] = attrName;
});
const CAMEL_REGEX = /-([a-z])/g;
/**
 * This method maps between attribute names
 * and the corresponding property name.
 */
function getPropNameFromAttrName(attrName) {
    if (language_1.isUndefined(AttrNameToPropNameMap[attrName])) {
        AttrNameToPropNameMap[attrName] = language_1.StringReplace.call(attrName, CAMEL_REGEX, (g) => g[1].toUpperCase());
    }
    return AttrNameToPropNameMap[attrName];
}
exports.getPropNameFromAttrName = getPropNameFromAttrName;
const CAPS_REGEX = /[A-Z]/g;
/**
 * This method maps between property names
 * and the corresponding attribute name.
 */
function getAttrNameFromPropName(propName) {
    if (language_1.isUndefined(PropNameToAttrNameMap[propName])) {
        PropNameToAttrNameMap[propName] = language_1.StringReplace.call(propName, CAPS_REGEX, (match) => '-' + match.toLowerCase());
    }
    return PropNameToAttrNameMap[propName];
}
exports.getAttrNameFromPropName = getAttrNameFromPropName;
let controlledElement = null;
let controlledAttributeName;
function isAttributeLocked(elm, attrName) {
    return elm !== controlledElement || attrName !== controlledAttributeName;
}
exports.isAttributeLocked = isAttributeLocked;
function lockAttribute(_elm, _key) {
    controlledElement = null;
    controlledAttributeName = undefined;
}
exports.lockAttribute = lockAttribute;
function unlockAttribute(elm, key) {
    controlledElement = elm;
    controlledAttributeName = key;
}
exports.unlockAttribute = unlockAttribute;
//# sourceMappingURL=attributes.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/base-bridge-element.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/base-bridge-element.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * This module is responsible for creating the base bridge class BaseBridgeElement
 * that represents the HTMLElement extension used for any LWC inserted in the DOM.
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const html_properties_1 = __webpack_require__(/*! ./html-properties */ "./node_modules/@lwc/engine/lib/framework/html-properties.js");
const membrane_1 = __webpack_require__(/*! ./membrane */ "./node_modules/@lwc/engine/lib/framework/membrane.js");
function prepareForPropUpdate(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
}
exports.prepareForPropUpdate = prepareForPropUpdate;
// A bridge descriptor is a descriptor whose job is just to get the component instance
// from the element instance, and get the value or set a new value on the component.
// This means that across different elements, similar names can get the exact same
// descriptor, so we can cache them:
const cachedGetterByKey = language_1.create(null);
const cachedSetterByKey = language_1.create(null);
function createGetter(key) {
    let fn = cachedGetterByKey[key];
    if (language_1.isUndefined(fn)) {
        fn = cachedGetterByKey[key] = function () {
            const vm = vm_1.getCustomElementVM(this);
            const { getHook } = vm;
            return getHook(vm.component, key);
        };
    }
    return fn;
}
function createSetter(key) {
    let fn = cachedSetterByKey[key];
    if (language_1.isUndefined(fn)) {
        fn = cachedSetterByKey[key] = function (newValue) {
            const vm = vm_1.getCustomElementVM(this);
            const { setHook } = vm;
            newValue = membrane_1.reactiveMembrane.getReadOnlyProxy(newValue);
            setHook(vm.component, key, newValue);
        };
    }
    return fn;
}
function createMethodCaller(methodName) {
    return function () {
        const vm = vm_1.getCustomElementVM(this);
        const { callHook, component } = vm;
        const fn = component[methodName];
        return callHook(vm.component, fn, language_1.ArraySlice.call(arguments));
    };
}
function HTMLBridgeElementFactory(SuperClass, props, methods) {
    let HTMLBridgeElement;
    /**
     * Modern browsers will have all Native Constructors as regular Classes
     * and must be instantiated with the new keyword. In older browsers,
     * specifically IE11, those are objects with a prototype property defined,
     * since they are not supposed to be extended or instantiated with the
     * new keyword. This forking logic supports both cases, specifically because
     * wc.ts relies on the construction path of the bridges to create new
     * fully qualifying web components.
     */
    if (language_1.isFunction(SuperClass)) {
        HTMLBridgeElement = class extends SuperClass {
        };
    }
    else {
        HTMLBridgeElement = function () {
            // Bridge classes are not supposed to be instantiated directly in
            // browsers that do not support web components.
            throw new TypeError('Illegal constructor');
        };
        // prototype inheritance dance
        language_1.setPrototypeOf(HTMLBridgeElement, SuperClass);
        language_1.setPrototypeOf(HTMLBridgeElement.prototype, SuperClass.prototype);
        language_1.defineProperty(HTMLBridgeElement.prototype, 'constructor', {
            writable: true,
            configurable: true,
            value: HTMLBridgeElement,
        });
    }
    const descriptors = language_1.create(null);
    // expose getters and setters for each public props on the new Element Bridge
    for (let i = 0, len = props.length; i < len; i += 1) {
        const propName = props[i];
        descriptors[propName] = {
            get: createGetter(propName),
            set: createSetter(propName),
            enumerable: true,
            configurable: true,
        };
    }
    // expose public methods as props on the new Element Bridge
    for (let i = 0, len = methods.length; i < len; i += 1) {
        const methodName = methods[i];
        descriptors[methodName] = {
            value: createMethodCaller(methodName),
            writable: true,
            configurable: true,
        };
    }
    language_1.defineProperties(HTMLBridgeElement.prototype, descriptors);
    return HTMLBridgeElement;
}
exports.HTMLBridgeElementFactory = HTMLBridgeElementFactory;
exports.BaseBridgeElement = HTMLBridgeElementFactory(HTMLElement, language_1.getOwnPropertyNames(html_properties_1.HTMLElementOriginalDescriptors), []);
language_1.freeze(exports.BaseBridgeElement);
language_1.seal(exports.BaseBridgeElement.prototype);
//# sourceMappingURL=base-bridge-element.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/base-lightning-element.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/base-lightning-element.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * This module is responsible for producing the ComponentDef object that is always
 * accessible via `vm.def`. This is lazily created during the creation of the first
 * instance of a component class, and shared across all instances.
 *
 * This structure can be used to synthetically create proxies, and understand the
 * shape of a component. It is also used internally to apply extra optimizations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const html_properties_1 = __webpack_require__(/*! ./html-properties */ "./node_modules/@lwc/engine/lib/framework/html-properties.js");
const restrictions_1 = __webpack_require__(/*! ./restrictions */ "./node_modules/@lwc/engine/lib/framework/restrictions.js");
const component_1 = __webpack_require__(/*! ./component */ "./node_modules/@lwc/engine/lib/framework/component.js");
const fields_1 = __webpack_require__(/*! ../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const invoker_1 = __webpack_require__(/*! ./invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const watcher_1 = __webpack_require__(/*! ./watcher */ "./node_modules/@lwc/engine/lib/framework/watcher.js");
const dom_1 = __webpack_require__(/*! ../env/dom */ "./node_modules/@lwc/engine/lib/env/dom.js");
const restrictions_2 = __webpack_require__(/*! ./restrictions */ "./node_modules/@lwc/engine/lib/framework/restrictions.js");
const attributes_1 = __webpack_require__(/*! ./attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const secure_template_1 = __webpack_require__(/*! ./secure-template */ "./node_modules/@lwc/engine/lib/framework/secure-template.js");
const GlobalEvent = Event; // caching global reference to avoid poisoning
/**
 * This operation is called with a descriptor of an standard html property
 * that a Custom Element can support (including AOM properties), which
 * determines what kind of capabilities the Base Lightning Element should support. When producing the new descriptors
 * for the Base Lightning Element, it also include the reactivity bit, so the standard property is reactive.
 */
function createBridgeToElementDescriptor(propName, descriptor) {
    const { get, set, enumerable, configurable } = descriptor;
    if (!language_1.isFunction(get)) {
        if (undefined !== 'production') {
            assert_1.default.fail(`Detected invalid public property descriptor for HTMLElement.prototype.${propName} definition. Missing the standard getter.`);
        }
        throw new TypeError();
    }
    if (!language_1.isFunction(set)) {
        if (undefined !== 'production') {
            assert_1.default.fail(`Detected invalid public property descriptor for HTMLElement.prototype.${propName} definition. Missing the standard setter.`);
        }
        throw new TypeError();
    }
    return {
        enumerable,
        configurable,
        get() {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
            }
            if (invoker_1.isBeingConstructed(vm)) {
                if (undefined !== 'production') {
                    const name = vm.elm.constructor.name;
                    assert_1.default.logError(`\`${name}\` constructor can't read the value of property \`${propName}\` because the owner component hasn't set the value yet. Instead, use the \`${name}\` constructor to set a default value for the property.`, vm.elm);
                }
                return;
            }
            watcher_1.observeMutation(this, propName);
            return get.call(vm.elm);
        },
        set(newValue) {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
                assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${vm}.${propName}`);
                assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `Failed to construct '${component_1.getComponentAsString(this)}': The result must not have attributes.`);
                assert_1.default.invariant(!language_1.isObject(newValue) || language_1.isNull(newValue), `Invalid value "${newValue}" for "${propName}" of ${vm}. Value cannot be an object, must be a primitive value.`);
            }
            if (newValue !== vm.cmpProps[propName]) {
                vm.cmpProps[propName] = newValue;
                if (language_1.isFalse(vm.isDirty)) {
                    // perf optimization to skip this step if not in the DOM
                    watcher_1.notifyMutation(this, propName);
                }
            }
            return set.call(vm.elm, newValue);
        },
    };
}
function getLinkedElement(cmp) {
    return vm_1.getComponentVM(cmp).elm;
}
/**
 * This class is the base class for any LWC element.
 * Some elements directly extends this class, others implement it via inheritance.
 **/
function BaseLightningElement() {
    // This should be as performant as possible, while any initialization should be done lazily
    if (language_1.isNull(invoker_1.vmBeingConstructed)) {
        throw new ReferenceError();
    }
    if (undefined !== 'production') {
        assert_1.default.isTrue('cmpProps' in invoker_1.vmBeingConstructed, `${invoker_1.vmBeingConstructed} is not a vm.`);
        assert_1.default.invariant(invoker_1.vmBeingConstructed.elm instanceof HTMLElement, `Component creation requires a DOM element to be associated to ${invoker_1.vmBeingConstructed}.`);
    }
    const vm = invoker_1.vmBeingConstructed;
    const { elm, mode, def: { ctor }, } = vm;
    const component = this;
    vm.component = component;
    // interaction hooks
    // We are intentionally hiding this argument from the formal API of LWCElement because
    // we don't want folks to know about it just yet.
    if (arguments.length === 1) {
        const { callHook, setHook, getHook } = arguments[0];
        vm.callHook = callHook;
        vm.setHook = setHook;
        vm.getHook = getHook;
    }
    // attaching the shadowRoot
    const shadowRootOptions = {
        mode,
        delegatesFocus: !!ctor.delegatesFocus,
    };
    const cmpRoot = elm.attachShadow(shadowRootOptions);
    // linking elm, shadow root and component with the VM
    fields_1.setHiddenField(component, utils_1.ViewModelReflection, vm);
    fields_1.setInternalField(elm, utils_1.ViewModelReflection, vm);
    fields_1.setInternalField(cmpRoot, utils_1.ViewModelReflection, vm);
    // VM is now initialized
    vm.cmpRoot = cmpRoot;
    if (undefined !== 'production') {
        restrictions_2.patchComponentWithRestrictions(component);
        restrictions_2.patchShadowRootWithRestrictions(cmpRoot, utils_1.EmptyObject);
    }
}
exports.BaseLightningElement = BaseLightningElement;
// HTML Element - The Good Parts
BaseLightningElement.prototype = {
    constructor: BaseLightningElement,
    dispatchEvent(event) {
        const elm = getLinkedElement(this);
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            if (arguments.length === 0) {
                throw new Error(`Failed to execute 'dispatchEvent' on ${component_1.getComponentAsString(this)}: 1 argument required, but only 0 present.`);
            }
            if (!(event instanceof GlobalEvent)) {
                throw new Error(`Failed to execute 'dispatchEvent' on ${component_1.getComponentAsString(this)}: parameter 1 is not of type 'Event'.`);
            }
            const { type: evtName } = event;
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.dispatchEvent() should not be called during the construction of the custom element for ${component_1.getComponentAsString(this)} because no one is listening for the event "${evtName}" just yet.`);
            if (!/^[a-z][a-z0-9_]*$/.test(evtName)) {
                assert_1.default.logError(`Invalid event type "${evtName}" dispatched in element ${component_1.getComponentAsString(this)}. Event name must ${[
                    '1) Start with a lowercase letter',
                    '2) Contain only lowercase letters, numbers, and underscores',
                ].join(' ')}`, elm);
            }
        }
        return dom_1.dispatchEvent.call(elm, event);
    },
    addEventListener(type, listener, options) {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
            assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${vm} by adding an event listener for "${type}".`);
            assert_1.default.invariant(language_1.isFunction(listener), `Invalid second argument for this.addEventListener() in ${vm} for event "${type}". Expected an EventListener but received ${listener}.`);
        }
        const wrappedListener = component_1.getWrappedComponentsListener(vm, listener);
        vm.elm.addEventListener(type, wrappedListener, options);
    },
    removeEventListener(type, listener, options) {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        }
        const wrappedListener = component_1.getWrappedComponentsListener(vm, listener);
        vm.elm.removeEventListener(type, wrappedListener, options);
    },
    setAttributeNS(ns, attrName, _value) {
        const elm = getLinkedElement(this);
        if (undefined !== 'production') {
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm_1.getComponentVM(this)), `Failed to construct '${component_1.getComponentAsString(this)}': The result must not have attributes.`);
        }
        attributes_1.unlockAttribute(elm, attrName);
        // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch
        elm.setAttributeNS.apply(elm, arguments);
        attributes_1.lockAttribute(elm, attrName);
    },
    removeAttributeNS(ns, attrName) {
        const elm = getLinkedElement(this);
        attributes_1.unlockAttribute(elm, attrName);
        // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch
        elm.removeAttributeNS.apply(elm, arguments);
        attributes_1.lockAttribute(elm, attrName);
    },
    removeAttribute(attrName) {
        const elm = getLinkedElement(this);
        attributes_1.unlockAttribute(elm, attrName);
        // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch
        elm.removeAttribute.apply(elm, arguments);
        attributes_1.lockAttribute(elm, attrName);
    },
    setAttribute(attrName, _value) {
        const elm = getLinkedElement(this);
        if (undefined !== 'production') {
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm_1.getComponentVM(this)), `Failed to construct '${component_1.getComponentAsString(this)}': The result must not have attributes.`);
        }
        attributes_1.unlockAttribute(elm, attrName);
        // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch
        elm.setAttribute.apply(elm, arguments);
        attributes_1.lockAttribute(elm, attrName);
    },
    getAttribute(attrName) {
        const elm = getLinkedElement(this);
        attributes_1.unlockAttribute(elm, attrName);
        // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch
        const value = elm.getAttribute.apply(elm, arguments);
        attributes_1.lockAttribute(elm, attrName);
        return value;
    },
    getAttributeNS(ns, attrName) {
        const elm = getLinkedElement(this);
        attributes_1.unlockAttribute(elm, attrName);
        // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch
        const value = elm.getAttributeNS.apply(elm, arguments);
        attributes_1.lockAttribute(elm, attrName);
        return value;
    },
    getBoundingClientRect() {
        const elm = getLinkedElement(this);
        if (undefined !== 'production') {
            const vm = vm_1.getComponentVM(this);
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.getBoundingClientRect() should not be called during the construction of the custom element for ${component_1.getComponentAsString(this)} because the element is not yet in the DOM, instead, you can use it in one of the available life-cycle hooks.`);
        }
        return elm.getBoundingClientRect();
    },
    /**
     * Returns the first element that is a descendant of node that
     * matches selectors.
     */
    // querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
    // querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
    querySelector(selectors) {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.querySelector() cannot be called during the construction of the custom element for ${component_1.getComponentAsString(this)} because no children has been added to this element yet.`);
        }
        const { elm } = vm;
        return elm.querySelector(selectors);
    },
    /**
     * Returns all element descendants of node that
     * match selectors.
     */
    // querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>,
    // querySelectorAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>,
    querySelectorAll(selectors) {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.querySelectorAll() cannot be called during the construction of the custom element for ${component_1.getComponentAsString(this)} because no children has been added to this element yet.`);
        }
        const { elm } = vm;
        return elm.querySelectorAll(selectors);
    },
    /**
     * Returns all element descendants of node that
     * match the provided tagName.
     */
    getElementsByTagName(tagNameOrWildCard) {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.getElementsByTagName() cannot be called during the construction of the custom element for ${component_1.getComponentAsString(this)} because no children has been added to this element yet.`);
        }
        const { elm } = vm;
        return elm.getElementsByTagName(tagNameOrWildCard);
    },
    /**
     * Returns all element descendants of node that
     * match the provide classnames.
     */
    getElementsByClassName(names) {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.getElementsByClassName() cannot be called during the construction of the custom element for ${component_1.getComponentAsString(this)} because no children has been added to this element yet.`);
        }
        const { elm } = vm;
        return elm.getElementsByClassName(names);
    },
    get classList() {
        if (undefined !== 'production') {
            const vm = vm_1.getComponentVM(this);
            // TODO: #1290 - this still fails in dev but works in production, eventually, we should just throw in all modes
            assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `Failed to construct ${vm}: The result must not have attributes. Adding or tampering with classname in constructor is not allowed in a web component, use connectedCallback() instead.`);
        }
        return getLinkedElement(this).classList;
    },
    get template() {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        }
        return vm.cmpRoot;
    },
    get shadowRoot() {
        // From within the component instance, the shadowRoot is always
        // reported as "closed". Authors should rely on this.template instead.
        return null;
    },
    render() {
        const vm = vm_1.getComponentVM(this);
        const { template } = vm.def;
        return language_1.isUndefined(template) ? secure_template_1.defaultEmptyTemplate : template;
    },
    toString() {
        const vm = vm_1.getComponentVM(this);
        if (undefined !== 'production') {
            assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        }
        return `[object ${vm.def.name}]`;
    },
};
// Typescript is inferring the wrong function type for this particular
// overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
// @ts-ignore type-mismatch
const baseDescriptors = language_1.ArrayReduce.call(language_1.getOwnPropertyNames(html_properties_1.HTMLElementOriginalDescriptors), (descriptors, propName) => {
    descriptors[propName] = createBridgeToElementDescriptor(propName, html_properties_1.HTMLElementOriginalDescriptors[propName]);
    return descriptors;
}, language_1.create(null));
language_1.defineProperties(BaseLightningElement.prototype, baseDescriptors);
if (undefined !== 'production') {
    restrictions_1.patchLightningElementPrototypeWithRestrictions(BaseLightningElement.prototype);
}
language_1.freeze(BaseLightningElement);
language_1.seal(BaseLightningElement.prototype);
//# sourceMappingURL=base-lightning-element.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/component.js":
/*!*************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/component.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const invoker_1 = __webpack_require__(/*! ./invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const services_1 = __webpack_require__(/*! ./services */ "./node_modules/@lwc/engine/lib/framework/services.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
const signedComponentToMetaMap = new Map();
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */
function registerComponent(Ctor, { name, tmpl: template }) {
    signedComponentToMetaMap.set(Ctor, { name, template });
    // chaining this method as a way to wrap existing
    // assignment of component constructor easily, without too much transformation
    return Ctor;
}
exports.registerComponent = registerComponent;
function getComponentRegisteredMeta(Ctor) {
    return signedComponentToMetaMap.get(Ctor);
}
exports.getComponentRegisteredMeta = getComponentRegisteredMeta;
function createComponent(uninitializedVm, Ctor) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(uninitializedVm && 'cmpProps' in uninitializedVm, `${uninitializedVm} is not a vm.`);
    }
    // create the component instance
    invoker_1.invokeComponentConstructor(uninitializedVm, Ctor);
    const initializedVm = uninitializedVm;
    if (language_1.isUndefined(initializedVm.component)) {
        throw new ReferenceError(`Invalid construction for ${Ctor}, you must extend LightningElement.`);
    }
}
exports.createComponent = createComponent;
function linkComponent(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    // wiring service
    const { def: { wire }, } = vm;
    if (wire) {
        const { wiring } = services_1.Services;
        if (wiring) {
            services_1.invokeServiceHook(vm, wiring);
        }
    }
}
exports.linkComponent = linkComponent;
function clearReactiveListeners(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { deps } = vm;
    const len = deps.length;
    if (len > 0) {
        for (let i = 0; i < len; i += 1) {
            const set = deps[i];
            const pos = language_1.ArrayIndexOf.call(deps[i], vm);
            if (undefined !== 'production') {
                assert_1.default.invariant(pos > -1, `when clearing up deps, the vm must be part of the collection.`);
            }
            language_1.ArraySplice.call(set, pos, 1);
        }
        deps.length = 0;
    }
}
exports.clearReactiveListeners = clearReactiveListeners;
function clearChildLWC(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    vm.velements = [];
}
function renderComponent(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.invariant(vm.isDirty, `${vm} is not dirty.`);
    }
    clearReactiveListeners(vm);
    clearChildLWC(vm);
    const vnodes = invoker_1.invokeComponentRenderMethod(vm);
    vm.isDirty = false;
    vm.isScheduled = false;
    if (undefined !== 'production') {
        assert_1.default.invariant(language_1.isArray(vnodes), `${vm}.render() should always return an array of vnodes instead of ${vnodes}`);
    }
    return vnodes;
}
exports.renderComponent = renderComponent;
function markComponentAsDirty(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isFalse(vm.isDirty, `markComponentAsDirty() for ${vm} should not be called when the component is already dirty.`);
        assert_1.default.isFalse(invoker_1.isRendering, `markComponentAsDirty() for ${vm} cannot be called during rendering of ${invoker_1.vmBeingRendered}.`);
    }
    vm.isDirty = true;
}
exports.markComponentAsDirty = markComponentAsDirty;
const cmpEventListenerMap = new WeakMap();
function getWrappedComponentsListener(vm, listener) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    if (!language_1.isFunction(listener)) {
        throw new TypeError(); // avoiding problems with non-valid listeners
    }
    let wrappedListener = cmpEventListenerMap.get(listener);
    if (language_1.isUndefined(wrappedListener)) {
        wrappedListener = function (event) {
            invoker_1.invokeEventListener(vm, listener, undefined, event);
        };
        cmpEventListenerMap.set(listener, wrappedListener);
    }
    return wrappedListener;
}
exports.getWrappedComponentsListener = getWrappedComponentsListener;
function getComponentAsString(component) {
    if (undefined === 'production') {
        throw new ReferenceError();
    }
    const vm = vm_1.getComponentVM(component);
    return `<${language_1.StringToLowerCase.call(element_1.tagNameGetter.call(vm.elm))}>`;
}
exports.getComponentAsString = getComponentAsString;
//# sourceMappingURL=component.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/context.js":
/*!***********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/context.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.currentContext = {};
function establishContext(ctx) {
    exports.currentContext = ctx;
}
exports.establishContext = establishContext;
//# sourceMappingURL=context.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/decorators/api.js":
/*!******************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/decorators/api.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const invoker_1 = __webpack_require__(/*! ../invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const watcher_1 = __webpack_require__(/*! ../watcher */ "./node_modules/@lwc/engine/lib/framework/watcher.js");
const vm_1 = __webpack_require__(/*! ../vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const language_2 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const register_1 = __webpack_require__(/*! ./register */ "./node_modules/@lwc/engine/lib/framework/decorators/register.js");
/**
 * @api decorator to mark public fields and public methods in
 * LWC Components. This function implements the internals of this
 * decorator.
 */
function api(target, propName, descriptor) {
    if (undefined !== 'production') {
        if (arguments.length !== 3) {
            assert_1.default.fail(`@api decorator can only be used as a decorator function.`);
        }
    }
    if (undefined !== 'production') {
        assert_1.default.invariant(!descriptor || (language_2.isFunction(descriptor.get) || language_2.isFunction(descriptor.set)), `Invalid property ${language_1.toString(propName)} definition in ${target}, it cannot be a prototype definition if it is a public property. Instead use the constructor to define it.`);
        if (language_1.isObject(descriptor) && language_2.isFunction(descriptor.set)) {
            assert_1.default.isTrue(language_1.isObject(descriptor) && language_2.isFunction(descriptor.get), `Missing getter for property ${language_1.toString(propName)} decorated with @api in ${target}. You cannot have a setter without the corresponding getter.`);
        }
    }
    const meta = register_1.getDecoratorsRegisteredMeta(target);
    // initializing getters and setters for each public prop on the target prototype
    if (language_1.isObject(descriptor) && (language_2.isFunction(descriptor.get) || language_2.isFunction(descriptor.set))) {
        // if it is configured as an accessor it must have a descriptor
        // @ts-ignore it must always be set before calling this method
        meta.props[propName].config = language_2.isFunction(descriptor.set) ? 3 : 1;
        return createPublicAccessorDescriptor(target, propName, descriptor);
    }
    else {
        // @ts-ignore it must always be set before calling this method
        meta.props[propName].config = 0;
        return createPublicPropertyDescriptor(target, propName, descriptor);
    }
}
exports.default = api;
function createPublicPropertyDescriptor(proto, key, descriptor) {
    return {
        get() {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
            }
            if (invoker_1.isBeingConstructed(vm)) {
                if (undefined !== 'production') {
                    const name = vm.elm.constructor.name;
                    assert_1.default.logError(`\`${name}\` constructor can’t read the value of property \`${language_1.toString(key)}\` because the owner component hasn’t set the value yet. Instead, use the \`${name}\` constructor to set a default value for the property.`, vm.elm);
                }
                return;
            }
            watcher_1.observeMutation(this, key);
            return vm.cmpProps[key];
        },
        set(newValue) {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
                assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${vm}.${language_1.toString(key)}`);
            }
            vm.cmpProps[key] = newValue;
            // avoid notification of observability if the instance is already dirty
            if (language_1.isFalse(vm.isDirty)) {
                // perf optimization to skip this step if the component is dirty already.
                watcher_1.notifyMutation(this, key);
            }
        },
        enumerable: language_2.isUndefined(descriptor) ? true : descriptor.enumerable,
    };
}
function createPublicAccessorDescriptor(Ctor, key, descriptor) {
    const { get, set, enumerable } = descriptor;
    if (!language_2.isFunction(get)) {
        if (undefined !== 'production') {
            assert_1.default.fail(`Invalid attempt to create public property descriptor ${language_1.toString(key)} in ${Ctor}. It is missing the getter declaration with @api get ${language_1.toString(key)}() {} syntax.`);
        }
        throw new TypeError();
    }
    return {
        get() {
            if (undefined !== 'production') {
                const vm = vm_1.getComponentVM(this);
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
            }
            return get.call(this);
        },
        set(newValue) {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
                assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${vm}.${language_1.toString(key)}`);
            }
            if (set) {
                set.call(this, newValue);
            }
            else if (undefined !== 'production') {
                assert_1.default.fail(`Invalid attempt to set a new value for property ${language_1.toString(key)} of ${vm} that does not has a setter decorated with @api.`);
            }
        },
        enumerable,
    };
}
//# sourceMappingURL=api.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/decorators/decorate.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/decorators/decorate.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
/**
 * EXPERIMENTAL: This function allows for the registration of "services" in
 * LWC by exposing hooks into the component life-cycle. This API is subject
 * to change or being removed.
 */
function decorate(Ctor, decorators) {
    // intentionally comparing decorators with null and undefined
    if (!language_1.isFunction(Ctor) || decorators == null) {
        throw new TypeError();
    }
    const props = language_1.getOwnPropertyNames(decorators);
    // intentionally allowing decoration of classes only for now
    const target = Ctor.prototype;
    for (let i = 0, len = props.length; i < len; i += 1) {
        const propName = props[i];
        const decorator = decorators[propName];
        if (!language_1.isFunction(decorator)) {
            throw new TypeError();
        }
        const originalDescriptor = language_1.getOwnPropertyDescriptor(target, propName);
        const descriptor = decorator(Ctor, propName, originalDescriptor);
        if (!language_1.isUndefined(descriptor)) {
            language_1.defineProperty(target, propName, descriptor);
        }
    }
    return Ctor; // chaining
}
exports.default = decorate;
//# sourceMappingURL=decorate.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/decorators/readonly.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/decorators/readonly.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const membrane_1 = __webpack_require__(/*! ../membrane */ "./node_modules/@lwc/engine/lib/framework/membrane.js");
/**
 * EXPERIMENTAL: This function allows you to create a reactive readonly
 * membrane around any object value. This API is subject to change or
 * being removed.
 */
function readonly(obj) {
    if (undefined !== 'production') {
        // TODO: #1292 - Remove the readonly decorator
        if (arguments.length !== 1) {
            assert_1.default.fail('@readonly cannot be used as a decorator just yet, use it as a function with one argument to produce a readonly version of the provided value.');
        }
    }
    return membrane_1.reactiveMembrane.getReadOnlyProxy(obj);
}
exports.default = readonly;
//# sourceMappingURL=readonly.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/decorators/register.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/decorators/register.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const wire_1 = __importDefault(__webpack_require__(/*! ./wire */ "./node_modules/@lwc/engine/lib/framework/decorators/wire.js"));
const track_1 = __importDefault(__webpack_require__(/*! ./track */ "./node_modules/@lwc/engine/lib/framework/decorators/track.js"));
const api_1 = __importDefault(__webpack_require__(/*! ./api */ "./node_modules/@lwc/engine/lib/framework/decorators/api.js"));
const utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const attributes_1 = __webpack_require__(/*! ../attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const decorate_1 = __importDefault(__webpack_require__(/*! ./decorate */ "./node_modules/@lwc/engine/lib/framework/decorators/decorate.js"));
const signedDecoratorToMetaMap = new Map();
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */
function registerDecorators(Ctor, meta) {
    const decoratorMap = language_1.create(null);
    const props = getPublicPropertiesHash(Ctor, meta.publicProps);
    const methods = getPublicMethodsHash(Ctor, meta.publicMethods);
    const wire = getWireHash(Ctor, meta.wire);
    const track = getTrackHash(Ctor, meta.track);
    signedDecoratorToMetaMap.set(Ctor, {
        props,
        methods,
        wire,
        track,
    });
    for (const propName in props) {
        decoratorMap[propName] = api_1.default;
    }
    if (wire) {
        for (const propName in wire) {
            const wireDef = wire[propName];
            if (wireDef.method) {
                // for decorated methods we need to do nothing
                continue;
            }
            decoratorMap[propName] = wire_1.default(wireDef.adapter, wireDef.params);
        }
    }
    if (track) {
        for (const propName in track) {
            decoratorMap[propName] = track_1.default;
        }
    }
    decorate_1.default(Ctor, decoratorMap);
    return Ctor;
}
exports.registerDecorators = registerDecorators;
function getDecoratorsRegisteredMeta(Ctor) {
    return signedDecoratorToMetaMap.get(Ctor);
}
exports.getDecoratorsRegisteredMeta = getDecoratorsRegisteredMeta;
function getTrackHash(target, track) {
    if (language_1.isUndefined(track) || language_1.getOwnPropertyNames(track).length === 0) {
        return utils_1.EmptyObject;
    }
    // TODO: #1302 - check that anything in `track` is correctly defined in the prototype
    return language_1.assign(language_1.create(null), track);
}
function getWireHash(target, wire) {
    if (language_1.isUndefined(wire) || language_1.getOwnPropertyNames(wire).length === 0) {
        return;
    }
    // TODO: #1302 - check that anything in `wire` is correctly defined in the prototype
    return language_1.assign(language_1.create(null), wire);
}
function getPublicPropertiesHash(target, props) {
    if (language_1.isUndefined(props) || language_1.getOwnPropertyNames(props).length === 0) {
        return utils_1.EmptyObject;
    }
    return language_1.getOwnPropertyNames(props).reduce((propsHash, propName) => {
        const attr = attributes_1.getAttrNameFromPropName(propName);
        propsHash[propName] = language_1.assign({
            config: 0,
            type: 'any',
            attr,
        }, props[propName]);
        return propsHash;
    }, language_1.create(null));
}
function getPublicMethodsHash(target, publicMethods) {
    if (language_1.isUndefined(publicMethods) || publicMethods.length === 0) {
        return utils_1.EmptyObject;
    }
    return publicMethods.reduce((methodsHash, methodName) => {
        if (undefined !== 'production') {
            assert_1.default.isTrue(language_1.isFunction(target.prototype[methodName]), `Component "${target.name}" should have a method \`${methodName}\` instead of ${target.prototype[methodName]}.`);
        }
        methodsHash[methodName] = target.prototype[methodName];
        return methodsHash;
    }, language_1.create(null));
}
//# sourceMappingURL=register.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/decorators/track.js":
/*!********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/decorators/track.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const invoker_1 = __webpack_require__(/*! ../invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const watcher_1 = __webpack_require__(/*! ../watcher */ "./node_modules/@lwc/engine/lib/framework/watcher.js");
const vm_1 = __webpack_require__(/*! ../vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const membrane_1 = __webpack_require__(/*! ../membrane */ "./node_modules/@lwc/engine/lib/framework/membrane.js");
function track(target, prop, descriptor) {
    if (arguments.length === 1) {
        return membrane_1.reactiveMembrane.getProxy(target);
    }
    if (undefined !== 'production') {
        if (arguments.length !== 3) {
            assert_1.default.fail(`@track decorator can only be used with one argument to return a trackable object, or as a decorator function.`);
        }
        if (!language_1.isUndefined(descriptor)) {
            const { get, set, configurable, writable } = descriptor;
            assert_1.default.isTrue(!get && !set, `Compiler Error: A @track decorator can only be applied to a public field.`);
            assert_1.default.isTrue(configurable !== false, `Compiler Error: A @track decorator can only be applied to a configurable property.`);
            assert_1.default.isTrue(writable !== false, `Compiler Error: A @track decorator can only be applied to a writable property.`);
        }
    }
    return createTrackedPropertyDescriptor(target, prop, language_1.isUndefined(descriptor) ? true : descriptor.enumerable === true);
}
exports.default = track;
function createTrackedPropertyDescriptor(Ctor, key, enumerable) {
    return {
        get() {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
            }
            watcher_1.observeMutation(this, key);
            return vm.cmpTrack[key];
        },
        set(newValue) {
            const vm = vm_1.getComponentVM(this);
            if (undefined !== 'production') {
                assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
                assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${vm}.${String(key)}`);
            }
            const reactiveOrAnyValue = membrane_1.reactiveMembrane.getProxy(newValue);
            if (reactiveOrAnyValue !== vm.cmpTrack[key]) {
                vm.cmpTrack[key] = reactiveOrAnyValue;
                if (language_1.isFalse(vm.isDirty)) {
                    // perf optimization to skip this step if the track property is on a component that is already dirty
                    watcher_1.notifyMutation(this, key);
                }
            }
        },
        enumerable,
        configurable: true,
    };
}
exports.createTrackedPropertyDescriptor = createTrackedPropertyDescriptor;
//# sourceMappingURL=track.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/decorators/wire.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/decorators/wire.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const track_1 = __webpack_require__(/*! ./track */ "./node_modules/@lwc/engine/lib/framework/decorators/track.js");
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
function wireDecorator(target, prop, descriptor) {
    if (undefined !== 'production') {
        if (!language_1.isUndefined(descriptor)) {
            const { get, set, configurable, writable } = descriptor;
            assert_1.default.isTrue(!get && !set, `Compiler Error: A @wire decorator can only be applied to a public field.`);
            assert_1.default.isTrue(configurable !== false, `Compiler Error: A @wire decorator can only be applied to a configurable property.`);
            assert_1.default.isTrue(writable !== false, `Compiler Error: A @wire decorator can only be applied to a writable property.`);
        }
    }
    return track_1.createTrackedPropertyDescriptor(target, prop, language_1.isObject(descriptor) ? descriptor.enumerable === true : true);
}
/**
 * @wire decorator to wire fields and methods to a wire adapter in
 * LWC Components. This function implements the internals of this
 * decorator.
 */
function wire(_adapter, _config) {
    const len = arguments.length;
    if (len > 0 && len < 3) {
        return wireDecorator;
    }
    else {
        if (undefined !== 'production') {
            assert_1.default.fail('@wire(adapter, config?) may only be used as a decorator.');
        }
        throw new TypeError();
    }
}
exports.default = wire;
//# sourceMappingURL=wire.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/def.js":
/*!*******************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/def.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * This module is responsible for producing the ComponentDef object that is always
 * accessible via `vm.def`. This is lazily created during the creation of the first
 * instance of a component class, and shared across all instances.
 *
 * This structure can be used to synthetically create proxies, and understand the
 * shape of a component. It is also used internally to apply extra optimizations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const fields_1 = __webpack_require__(/*! ../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
const attributes_1 = __webpack_require__(/*! ./attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const component_1 = __webpack_require__(/*! ./component */ "./node_modules/@lwc/engine/lib/framework/component.js");
const CtorToDefMap = new WeakMap();
function getCtorProto(Ctor, subclassComponentName) {
    let proto = language_1.getPrototypeOf(Ctor);
    if (language_1.isNull(proto)) {
        throw new ReferenceError(`Invalid prototype chain for ${subclassComponentName}, you must extend LightningElement.`);
    }
    // covering the cases where the ref is circular in AMD
    if (utils_1.isCircularModuleDependency(proto)) {
        const p = utils_1.resolveCircularModuleDependency(proto);
        if (undefined !== 'production') {
            if (language_1.isNull(p)) {
                throw new ReferenceError(`Circular module dependency for ${subclassComponentName}, must resolve to a constructor that extends LightningElement.`);
            }
        }
        // escape hatch for Locker and other abstractions to provide their own base class instead
        // of our Base class without having to leak it to user-land. If the circular function returns
        // itself, that's the signal that we have hit the end of the proto chain, which must always
        // be base.
        proto = p === proto ? base_lightning_element_1.BaseLightningElement : p;
    }
    return proto;
}
function createComponentDef(Ctor, meta, subclassComponentName) {
    if (undefined !== 'production') {
        // local to dev block
        const ctorName = Ctor.name;
        // Removing the following assert until https://bugs.webkit.org/show_bug.cgi?id=190140 is fixed.
        // assert.isTrue(ctorName && isString(ctorName), `${toString(Ctor)} should have a "name" property with string value, but found ${ctorName}.`);
        assert_1.default.isTrue(Ctor.constructor, `Missing ${ctorName}.constructor, ${ctorName} should have a "constructor" property.`);
    }
    const { name, template } = meta;
    let decoratorsMeta = register_1.getDecoratorsRegisteredMeta(Ctor);
    // TODO: #1295 - refactor tests that are using this declaration manually
    if (language_1.isUndefined(decoratorsMeta)) {
        register_1.registerDecorators(Ctor, {
            publicMethods: getOwnValue(Ctor, 'publicMethods'),
            publicProps: getOwnValue(Ctor, 'publicProps'),
            track: getOwnValue(Ctor, 'track'),
            wire: getOwnValue(Ctor, 'wire'),
        });
        decoratorsMeta = register_1.getDecoratorsRegisteredMeta(Ctor);
    }
    let { props, methods, wire, track } = decoratorsMeta || utils_1.EmptyObject;
    const proto = Ctor.prototype;
    let { connectedCallback, disconnectedCallback, renderedCallback, errorCallback, render, } = proto;
    const superProto = getCtorProto(Ctor, subclassComponentName);
    const superDef = superProto !== base_lightning_element_1.BaseLightningElement
        ? getComponentDef(superProto, subclassComponentName)
        : null;
    const SuperBridge = language_1.isNull(superDef) ? base_bridge_element_1.BaseBridgeElement : superDef.bridge;
    const bridge = base_bridge_element_1.HTMLBridgeElementFactory(SuperBridge, language_1.getOwnPropertyNames(props), language_1.getOwnPropertyNames(methods));
    if (!language_1.isNull(superDef)) {
        props = language_1.assign(language_1.create(null), superDef.props, props);
        methods = language_1.assign(language_1.create(null), superDef.methods, methods);
        wire = superDef.wire || wire ? language_1.assign(language_1.create(null), superDef.wire, wire) : undefined;
        track = language_1.assign(language_1.create(null), superDef.track, track);
        connectedCallback = connectedCallback || superDef.connectedCallback;
        disconnectedCallback = disconnectedCallback || superDef.disconnectedCallback;
        renderedCallback = renderedCallback || superDef.renderedCallback;
        errorCallback = errorCallback || superDef.errorCallback;
        render = render || superDef.render;
    }
    props = language_1.assign(language_1.create(null), HTML_PROPS, props);
    const def = {
        ctor: Ctor,
        name,
        wire,
        track,
        props,
        methods,
        bridge,
        template,
        connectedCallback,
        disconnectedCallback,
        renderedCallback,
        errorCallback,
        render,
    };
    if (undefined !== 'production') {
        language_1.freeze(Ctor.prototype);
    }
    return def;
}
/**
 * EXPERIMENTAL: This function allows for the identification of LWC
 * constructors. This API is subject to change or being removed.
 */
function isComponentConstructor(ctor) {
    if (!language_1.isFunction(ctor)) {
        return false;
    }
    // Fast path: LightningElement is part of the prototype chain of the constructor.
    if (ctor.prototype instanceof base_lightning_element_1.BaseLightningElement) {
        return true;
    }
    // Slow path: LightningElement is not part of the prototype chain of the constructor, we need
    // climb up the constructor prototype chain to check in case there are circular dependencies
    // to resolve.
    let current = ctor;
    do {
        if (utils_1.isCircularModuleDependency(current)) {
            const circularResolved = utils_1.resolveCircularModuleDependency(current);
            // If the circular function returns itself, that's the signal that we have hit the end of the proto chain,
            // which must always be a valid base constructor.
            if (circularResolved === current) {
                return true;
            }
            current = circularResolved;
        }
        if (current === base_lightning_element_1.BaseLightningElement) {
            return true;
        }
    } while (!language_1.isNull(current) && (current = language_1.getPrototypeOf(current)));
    // Finally return false if the LightningElement is not part of the prototype chain.
    return false;
}
exports.isComponentConstructor = isComponentConstructor;
function getOwnValue(o, key) {
    const d = language_1.getOwnPropertyDescriptor(o, key);
    return d && d.value;
}
/**
 * EXPERIMENTAL: This function allows for the collection of internal
 * component metadata. This API is subject to change or being removed.
 */
function getComponentDef(Ctor, subclassComponentName) {
    let def = CtorToDefMap.get(Ctor);
    if (language_1.isUndefined(def)) {
        if (!isComponentConstructor(Ctor)) {
            throw new TypeError(`${Ctor} is not a valid component, or does not extends LightningElement from "lwc". You probably forgot to add the extend clause on the class declaration.`);
        }
        let meta = component_1.getComponentRegisteredMeta(Ctor);
        if (language_1.isUndefined(meta)) {
            // TODO: #1295 - remove this workaround after refactoring tests
            meta = {
                template: undefined,
                name: Ctor.name,
            };
        }
        def = createComponentDef(Ctor, meta, subclassComponentName || Ctor.name);
        CtorToDefMap.set(Ctor, def);
    }
    return def;
}
exports.getComponentDef = getComponentDef;
/**
 * EXPERIMENTAL: This function provides access to the component constructor,
 * given an HTMLElement. This API is subject to change or being removed.
 */
function getComponentConstructor(elm) {
    let ctor = null;
    if (elm instanceof HTMLElement) {
        const vm = fields_1.getInternalField(elm, utils_1.ViewModelReflection);
        if (!language_1.isUndefined(vm)) {
            ctor = vm.def.ctor;
        }
    }
    return ctor;
}
exports.getComponentConstructor = getComponentConstructor;
// Only set prototype for public methods and properties
// No DOM Patching occurs here
function setElementProto(elm, def) {
    language_1.setPrototypeOf(elm, def.bridge.prototype);
}
exports.setElementProto = setElementProto;
const html_properties_1 = __webpack_require__(/*! ./html-properties */ "./node_modules/@lwc/engine/lib/framework/html-properties.js");
const base_lightning_element_1 = __webpack_require__(/*! ./base-lightning-element */ "./node_modules/@lwc/engine/lib/framework/base-lightning-element.js");
const base_bridge_element_1 = __webpack_require__(/*! ./base-bridge-element */ "./node_modules/@lwc/engine/lib/framework/base-bridge-element.js");
const register_1 = __webpack_require__(/*! ./decorators/register */ "./node_modules/@lwc/engine/lib/framework/decorators/register.js");
// Typescript is inferring the wrong function type for this particular
// overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
// @ts-ignore type-mismatch
const HTML_PROPS = language_1.ArrayReduce.call(language_1.getOwnPropertyNames(html_properties_1.HTMLElementOriginalDescriptors), (props, propName) => {
    const attrName = attributes_1.getAttrNameFromPropName(propName);
    props[propName] = {
        config: 3,
        type: 'any',
        attr: attrName,
    };
    return props;
}, language_1.create(null));
//# sourceMappingURL=def.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/hooks.js":
/*!*********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/hooks.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const events_1 = __importDefault(__webpack_require__(/*! ./modules/events */ "./node_modules/@lwc/engine/lib/framework/modules/events.js"));
const attrs_1 = __importDefault(__webpack_require__(/*! ./modules/attrs */ "./node_modules/@lwc/engine/lib/framework/modules/attrs.js"));
const props_1 = __importDefault(__webpack_require__(/*! ./modules/props */ "./node_modules/@lwc/engine/lib/framework/modules/props.js"));
const computed_class_attr_1 = __importDefault(__webpack_require__(/*! ./modules/computed-class-attr */ "./node_modules/@lwc/engine/lib/framework/modules/computed-class-attr.js"));
const computed_style_attr_1 = __importDefault(__webpack_require__(/*! ./modules/computed-style-attr */ "./node_modules/@lwc/engine/lib/framework/modules/computed-style-attr.js"));
const static_class_attr_1 = __importDefault(__webpack_require__(/*! ./modules/static-class-attr */ "./node_modules/@lwc/engine/lib/framework/modules/static-class-attr.js"));
const static_style_attr_1 = __importDefault(__webpack_require__(/*! ./modules/static-style-attr */ "./node_modules/@lwc/engine/lib/framework/modules/static-style-attr.js"));
const context_1 = __importDefault(__webpack_require__(/*! ./modules/context */ "./node_modules/@lwc/engine/lib/framework/modules/context.js"));
const patch_1 = __webpack_require__(/*! ./patch */ "./node_modules/@lwc/engine/lib/framework/patch.js");
const snabbdom_1 = __webpack_require__(/*! ../3rdparty/snabbdom/snabbdom */ "./node_modules/@lwc/engine/lib/3rdparty/snabbdom/snabbdom.js");
const restrictions_1 = __webpack_require__(/*! ./restrictions */ "./node_modules/@lwc/engine/lib/framework/restrictions.js");
const patch_2 = __webpack_require__(/*! ./patch */ "./node_modules/@lwc/engine/lib/framework/patch.js");
const def_1 = __webpack_require__(/*! ./def */ "./node_modules/@lwc/engine/lib/framework/def.js");
const noop = () => void 0;
function observeElementChildNodes(elm) {
    elm.$domManual$ = true;
}
function setElementShadowToken(elm, token) {
    elm.$shadowToken$ = token;
}
function updateNodeHook(oldVnode, vnode) {
    const { text } = vnode;
    if (oldVnode.text !== text) {
        if (undefined !== 'production') {
            restrictions_1.unlockDomMutation();
        }
        /**
         * Compiler will never produce a text property that is not string
         */
        vnode.elm.nodeValue = text;
        if (undefined !== 'production') {
            restrictions_1.lockDomMutation();
        }
    }
}
exports.updateNodeHook = updateNodeHook;
function insertNodeHook(vnode, parentNode, referenceNode) {
    if (undefined !== 'production') {
        restrictions_1.unlockDomMutation();
    }
    parentNode.insertBefore(vnode.elm, referenceNode);
    if (undefined !== 'production') {
        restrictions_1.lockDomMutation();
    }
}
exports.insertNodeHook = insertNodeHook;
function removeNodeHook(vnode, parentNode) {
    if (undefined !== 'production') {
        restrictions_1.unlockDomMutation();
    }
    parentNode.removeChild(vnode.elm);
    if (undefined !== 'production') {
        restrictions_1.lockDomMutation();
    }
}
exports.removeNodeHook = removeNodeHook;
function createTextHook(vnode) {
    const text = vnode.elm;
    if (language_1.isTrue(utils_1.useSyntheticShadow)) {
        patch_2.patchTextNodeProto(text);
    }
}
exports.createTextHook = createTextHook;
function createCommentHook(vnode) {
    const comment = vnode.elm;
    if (language_1.isTrue(utils_1.useSyntheticShadow)) {
        patch_2.patchCommentNodeProto(comment);
    }
}
exports.createCommentHook = createCommentHook;
function createElmHook(vnode) {
    events_1.default.create(vnode);
    // Attrs need to be applied to element before props
    // IE11 will wipe out value on radio inputs if value
    // is set before type=radio.
    attrs_1.default.create(vnode);
    props_1.default.create(vnode);
    static_class_attr_1.default.create(vnode);
    static_style_attr_1.default.create(vnode);
    computed_class_attr_1.default.create(vnode);
    computed_style_attr_1.default.create(vnode);
    context_1.default.create(vnode);
}
exports.createElmHook = createElmHook;
var LWCDOMMode;
(function (LWCDOMMode) {
    LWCDOMMode["manual"] = "manual";
})(LWCDOMMode || (LWCDOMMode = {}));
function fallbackElmHook(vnode) {
    const { owner, sel } = vnode;
    const elm = vnode.elm;
    if (language_1.isTrue(utils_1.useSyntheticShadow)) {
        const { data: { context }, } = vnode;
        const { shadowAttribute } = owner.context;
        if (!language_1.isUndefined(context) &&
            !language_1.isUndefined(context.lwc) &&
            context.lwc.dom === LWCDOMMode.manual) {
            // this element will now accept any manual content inserted into it
            observeElementChildNodes(elm);
        }
        // when running in synthetic shadow mode, we need to set the shadowToken value
        // into each element from the template, so they can be styled accordingly.
        setElementShadowToken(elm, shadowAttribute);
        patch_2.patchElementProto(elm, { sel });
    }
    if (undefined !== 'production') {
        const { data: { context }, } = vnode;
        const isPortal = !language_1.isUndefined(context) &&
            !language_1.isUndefined(context.lwc) &&
            context.lwc.dom === LWCDOMMode.manual;
        restrictions_1.patchElementWithRestrictions(elm, { isPortal });
    }
}
exports.fallbackElmHook = fallbackElmHook;
function updateElmHook(oldVnode, vnode) {
    // Attrs need to be applied to element before props
    // IE11 will wipe out value on radio inputs if value
    // is set before type=radio.
    attrs_1.default.update(oldVnode, vnode);
    props_1.default.update(oldVnode, vnode);
    computed_class_attr_1.default.update(oldVnode, vnode);
    computed_style_attr_1.default.update(oldVnode, vnode);
}
exports.updateElmHook = updateElmHook;
function insertCustomElmHook(vnode) {
    const vm = vm_1.getCustomElementVM(vnode.elm);
    vm_1.appendVM(vm);
}
exports.insertCustomElmHook = insertCustomElmHook;
function updateChildrenHook(oldVnode, vnode) {
    const { children, owner } = vnode;
    const fn = patch_1.hasDynamicChildren(children) ? snabbdom_1.updateDynamicChildren : snabbdom_1.updateStaticChildren;
    vm_1.runWithBoundaryProtection(owner, owner.owner, noop, () => {
        fn(vnode.elm, oldVnode.children, children);
    }, noop);
}
exports.updateChildrenHook = updateChildrenHook;
function allocateChildrenHook(vnode) {
    const elm = vnode.elm;
    const vm = vm_1.getCustomElementVM(elm);
    const { children } = vnode;
    vm.aChildren = children;
    if (language_1.isTrue(utils_1.useSyntheticShadow)) {
        // slow path
        vm_1.allocateInSlot(vm, children);
        // every child vnode is now allocated, and the host should receive none directly, it receives them via the shadow!
        vnode.children = utils_1.EmptyArray;
    }
}
exports.allocateChildrenHook = allocateChildrenHook;
function createViewModelHook(vnode) {
    const elm = vnode.elm;
    if (language_1.hasOwnProperty.call(elm, utils_1.ViewModelReflection)) {
        // There is a possibility that a custom element is registered under tagName,
        // in which case, the initialization is already carry on, and there is nothing else
        // to do here since this hook is called right after invoking `document.createElement`.
        return;
    }
    const { mode, ctor, owner } = vnode;
    const def = def_1.getComponentDef(ctor);
    def_1.setElementProto(elm, def);
    if (language_1.isTrue(utils_1.useSyntheticShadow)) {
        const { shadowAttribute } = owner.context;
        // when running in synthetic shadow mode, we need to set the shadowToken value
        // into each element from the template, so they can be styled accordingly.
        setElementShadowToken(elm, shadowAttribute);
        patch_2.patchCustomElementProto(elm, { def });
    }
    vm_1.createVM(elm, ctor, {
        mode,
        owner,
    });
    const vm = vm_1.getCustomElementVM(elm);
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(language_1.isArray(vnode.children), `Invalid vnode for a custom element, it must have children defined.`);
    }
    if (undefined !== 'production') {
        restrictions_1.patchCustomElementWithRestrictions(elm, utils_1.EmptyObject);
    }
}
exports.createViewModelHook = createViewModelHook;
function createCustomElmHook(vnode) {
    events_1.default.create(vnode);
    // Attrs need to be applied to element before props
    // IE11 will wipe out value on radio inputs if value
    // is set before type=radio.
    attrs_1.default.create(vnode);
    props_1.default.create(vnode);
    static_class_attr_1.default.create(vnode);
    static_style_attr_1.default.create(vnode);
    computed_class_attr_1.default.create(vnode);
    computed_style_attr_1.default.create(vnode);
    context_1.default.create(vnode);
}
exports.createCustomElmHook = createCustomElmHook;
function createChildrenHook(vnode) {
    const { elm, children } = vnode;
    for (let j = 0; j < children.length; ++j) {
        const ch = children[j];
        if (ch != null) {
            ch.hook.create(ch);
            ch.hook.insert(ch, elm, null);
        }
    }
}
exports.createChildrenHook = createChildrenHook;
function rerenderCustomElmHook(vnode) {
    const vm = vm_1.getCustomElementVM(vnode.elm);
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(language_1.isArray(vnode.children), `Invalid vnode for a custom element, it must have children defined.`);
    }
    vm_1.rerenderVM(vm);
}
exports.rerenderCustomElmHook = rerenderCustomElmHook;
function updateCustomElmHook(oldVnode, vnode) {
    // Attrs need to be applied to element before props
    // IE11 will wipe out value on radio inputs if value
    // is set before type=radio.
    attrs_1.default.update(oldVnode, vnode);
    props_1.default.update(oldVnode, vnode);
    computed_class_attr_1.default.update(oldVnode, vnode);
    computed_style_attr_1.default.update(oldVnode, vnode);
}
exports.updateCustomElmHook = updateCustomElmHook;
function removeElmHook(vnode) {
    // this method only needs to search on child vnodes from template
    // to trigger the remove hook just in case some of those children
    // are custom elements.
    const { children, elm } = vnode;
    for (let j = 0, len = children.length; j < len; ++j) {
        const ch = children[j];
        if (!language_1.isNull(ch)) {
            ch.hook.remove(ch, elm);
        }
    }
}
exports.removeElmHook = removeElmHook;
function removeCustomElmHook(vnode) {
    // for custom elements we don't have to go recursively because the removeVM routine
    // will take care of disconnecting any child VM attached to its shadow as well.
    vm_1.removeVM(vm_1.getCustomElementVM(vnode.elm));
}
exports.removeCustomElmHook = removeCustomElmHook;
//# sourceMappingURL=hooks.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/html-properties.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/html-properties.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const attributes_1 = __webpack_require__(/*! ./attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const main_1 = __webpack_require__(/*! ../polyfills/aria-properties/main */ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/main.js");
/**
 * This is a descriptor map that contains
 * all standard properties that a Custom Element can support (including AOM properties), which
 * determines what kind of capabilities the Base HTML Element and
 * Base Lightning Element should support.
 */
exports.HTMLElementOriginalDescriptors = language_1.create(null);
language_1.forEach.call(main_1.ElementPrototypeAriaPropertyNames, (propName) => {
    // Note: intentionally using our in-house getPropertyDescriptor instead of getOwnPropertyDescriptor here because
    // in IE11, some properties are on Element.prototype instead of HTMLElement, just to be sure.
    const descriptor = language_1.getPropertyDescriptor(HTMLElement.prototype, propName);
    if (!language_1.isUndefined(descriptor)) {
        exports.HTMLElementOriginalDescriptors[propName] = descriptor;
    }
});
language_1.forEach.call(attributes_1.defaultDefHTMLPropertyNames, propName => {
    // Note: intentionally using our in-house getPropertyDescriptor instead of getOwnPropertyDescriptor here because
    // in IE11, id property is on Element.prototype instead of HTMLElement, and we suspect that more will fall into
    // this category, so, better to be sure.
    const descriptor = language_1.getPropertyDescriptor(HTMLElement.prototype, propName);
    if (!language_1.isUndefined(descriptor)) {
        exports.HTMLElementOriginalDescriptors[propName] = descriptor;
    }
});
//# sourceMappingURL=html-properties.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/invoker.js":
/*!***********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/invoker.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const context_1 = __webpack_require__(/*! ./context */ "./node_modules/@lwc/engine/lib/framework/context.js");
const template_1 = __webpack_require__(/*! ./template */ "./node_modules/@lwc/engine/lib/framework/template.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const performance_timing_1 = __webpack_require__(/*! ./performance-timing */ "./node_modules/@lwc/engine/lib/framework/performance-timing.js");
exports.isRendering = false;
exports.vmBeingRendered = null;
exports.vmBeingConstructed = null;
function isBeingConstructed(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpProps' in vm, `${vm} is not a vm.`);
    }
    return exports.vmBeingConstructed === vm;
}
exports.isBeingConstructed = isBeingConstructed;
function invokeComponentCallback(vm, fn, args) {
    const { component, callHook, context, owner } = vm;
    const ctx = context_1.currentContext;
    let result;
    vm_1.runWithBoundaryProtection(vm, owner, () => {
        // pre
        context_1.establishContext(context);
    }, () => {
        // job
        result = callHook(component, fn, args);
    }, () => {
        // post
        context_1.establishContext(ctx);
    });
    return result;
}
exports.invokeComponentCallback = invokeComponentCallback;
function invokeComponentConstructor(vm, Ctor) {
    const vmBeingConstructedInception = exports.vmBeingConstructed;
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpProps' in vm, `${vm} is not a vm.`);
    }
    const { context } = vm;
    const ctx = context_1.currentContext;
    context_1.establishContext(context);
    let error;
    if (undefined !== 'production') {
        performance_timing_1.startMeasure('constructor', vm);
    }
    exports.vmBeingConstructed = vm;
    /**
     * Constructors don't need to be wrapped with a boundary because for root elements
     * it should throw, while elements from template are already wrapped by a boundary
     * associated to the diffing algo.
     */
    try {
        // job
        const result = new Ctor();
        // Check indirectly if the constructor result is an instance of LightningElement. Using
        // the "instanceof" operator would not work here since Locker Service provides its own
        // implementation of LightningElement, so we indirectly check if the base constructor is
        // invoked by accessing the component on the vm.
        if (exports.vmBeingConstructed.component !== result) {
            throw new TypeError('Invalid component constructor, the class should extend LightningElement.');
        }
    }
    catch (e) {
        error = Object(e);
    }
    finally {
        context_1.establishContext(ctx);
        if (undefined !== 'production') {
            performance_timing_1.endMeasure('constructor', vm);
        }
        exports.vmBeingConstructed = vmBeingConstructedInception;
        if (!language_1.isUndefined(error)) {
            error.wcStack = vm_1.getErrorComponentStack(vm.elm);
            // re-throwing the original error annotated after restoring the context
            throw error; // eslint-disable-line no-unsafe-finally
        }
    }
}
exports.invokeComponentConstructor = invokeComponentConstructor;
function invokeComponentRenderMethod(vm) {
    const { def: { render }, callHook, component, context, owner, } = vm;
    const ctx = context_1.currentContext;
    const isRenderingInception = exports.isRendering;
    const vmBeingRenderedInception = exports.vmBeingRendered;
    exports.isRendering = true;
    exports.vmBeingRendered = vm;
    let result;
    vm_1.runWithBoundaryProtection(vm, owner, () => {
        // pre
        context_1.establishContext(context);
        if (undefined !== 'production') {
            performance_timing_1.startMeasure('render', vm);
        }
        exports.isRendering = true;
        exports.vmBeingRendered = vm;
    }, () => {
        // job
        const html = callHook(component, render);
        result = template_1.evaluateTemplate(vm, html);
    }, () => {
        context_1.establishContext(ctx);
        // post
        if (undefined !== 'production') {
            performance_timing_1.endMeasure('render', vm);
        }
        exports.isRendering = isRenderingInception;
        exports.vmBeingRendered = vmBeingRenderedInception;
    });
    return result || [];
}
exports.invokeComponentRenderMethod = invokeComponentRenderMethod;
function invokeEventListener(vm, fn, thisValue, event) {
    const { callHook, owner, context } = vm;
    const ctx = context_1.currentContext;
    vm_1.runWithBoundaryProtection(vm, owner, () => {
        // pre
        context_1.establishContext(context);
    }, () => {
        // job
        if (undefined !== 'production') {
            assert_1.default.isTrue(language_1.isFunction(fn), `Invalid event handler for event '${event.type}' on ${vm}.`);
        }
        callHook(thisValue, fn, [event]);
    }, () => {
        // post
        context_1.establishContext(ctx);
    });
}
exports.invokeEventListener = invokeEventListener;
//# sourceMappingURL=invoker.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/main.js":
/*!********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/main.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Polyfills
__webpack_require__(/*! ../polyfills/proxy-concat/main */ "./node_modules/@lwc/engine/lib/polyfills/proxy-concat/main.js");
__webpack_require__(/*! ../polyfills/aria-properties/main */ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/main.js");
// TODO: #1296 - Revisit these exports and figure out a better separation
var upgrade_1 = __webpack_require__(/*! ./upgrade */ "./node_modules/@lwc/engine/lib/framework/upgrade.js");
exports.createElement = upgrade_1.createElement;
var def_1 = __webpack_require__(/*! ./def */ "./node_modules/@lwc/engine/lib/framework/def.js");
exports.getComponentDef = def_1.getComponentDef;
exports.isComponentConstructor = def_1.isComponentConstructor;
exports.getComponentConstructor = def_1.getComponentConstructor;
var base_lightning_element_1 = __webpack_require__(/*! ./base-lightning-element */ "./node_modules/@lwc/engine/lib/framework/base-lightning-element.js");
exports.LightningElement = base_lightning_element_1.BaseLightningElement;
var services_1 = __webpack_require__(/*! ./services */ "./node_modules/@lwc/engine/lib/framework/services.js");
exports.register = services_1.register;
var membrane_1 = __webpack_require__(/*! ./membrane */ "./node_modules/@lwc/engine/lib/framework/membrane.js");
exports.unwrap = membrane_1.unwrap;
var secure_template_1 = __webpack_require__(/*! ./secure-template */ "./node_modules/@lwc/engine/lib/framework/secure-template.js");
exports.registerTemplate = secure_template_1.registerTemplate;
exports.sanitizeAttribute = secure_template_1.sanitizeAttribute;
var component_1 = __webpack_require__(/*! ./component */ "./node_modules/@lwc/engine/lib/framework/component.js");
exports.registerComponent = component_1.registerComponent;
var register_1 = __webpack_require__(/*! ./decorators/register */ "./node_modules/@lwc/engine/lib/framework/decorators/register.js");
exports.registerDecorators = register_1.registerDecorators;
var vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
exports.isNodeFromTemplate = vm_1.isNodeFromTemplate;
var api_1 = __webpack_require__(/*! ./decorators/api */ "./node_modules/@lwc/engine/lib/framework/decorators/api.js");
exports.api = api_1.default;
var track_1 = __webpack_require__(/*! ./decorators/track */ "./node_modules/@lwc/engine/lib/framework/decorators/track.js");
exports.track = track_1.default;
var readonly_1 = __webpack_require__(/*! ./decorators/readonly */ "./node_modules/@lwc/engine/lib/framework/decorators/readonly.js");
exports.readonly = readonly_1.default;
var wire_1 = __webpack_require__(/*! ./decorators/wire */ "./node_modules/@lwc/engine/lib/framework/decorators/wire.js");
exports.wire = wire_1.default;
var decorate_1 = __webpack_require__(/*! ./decorators/decorate */ "./node_modules/@lwc/engine/lib/framework/decorators/decorate.js");
exports.decorate = decorate_1.default;
var wc_1 = __webpack_require__(/*! ./wc */ "./node_modules/@lwc/engine/lib/framework/wc.js");
exports.buildCustomElementConstructor = wc_1.buildCustomElementConstructor;
//# sourceMappingURL=main.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/membrane.js":
/*!************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/membrane.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const observable_membrane_1 = __importDefault(__webpack_require__(/*! observable-membrane */ "./node_modules/observable-membrane/dist/modules/observable-membrane.js"));
const watcher_1 = __webpack_require__(/*! ./watcher */ "./node_modules/@lwc/engine/lib/framework/watcher.js");
function valueDistortion(value) {
    return value;
}
exports.reactiveMembrane = new observable_membrane_1.default({
    valueObserved: watcher_1.observeMutation,
    valueMutated: watcher_1.notifyMutation,
    valueDistortion,
});
/**
 * EXPERIMENTAL: This function implements an unwrap mechanism that
 * works for observable membrane objects. This API is subject to
 * change or being removed.
 */
exports.unwrap = function (value) {
    const unwrapped = exports.reactiveMembrane.unwrapProxy(value);
    if (unwrapped !== value) {
        // if value is a proxy, unwrap to access original value and apply distortion
        return valueDistortion(unwrapped);
    }
    return value;
};
//# sourceMappingURL=membrane.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/attrs.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/attrs.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const attributes_1 = __webpack_require__(/*! ../attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const ColonCharCode = 58;
function updateAttrs(oldVnode, vnode) {
    const { data: { attrs }, } = vnode;
    if (language_1.isUndefined(attrs)) {
        return;
    }
    let { data: { attrs: oldAttrs }, } = oldVnode;
    if (oldAttrs === attrs) {
        return;
    }
    if (undefined !== 'production') {
        assert_1.default.invariant(language_1.isUndefined(oldAttrs) || language_1.keys(oldAttrs).join(',') === language_1.keys(attrs).join(','), `vnode.data.attrs cannot change shape.`);
    }
    const elm = vnode.elm;
    let key;
    oldAttrs = language_1.isUndefined(oldAttrs) ? utils_1.EmptyObject : oldAttrs;
    // update modified attributes, add new attributes
    // this routine is only useful for data-* attributes in all kind of elements
    // and aria-* in standard elements (custom elements will use props for these)
    for (key in attrs) {
        const cur = attrs[key];
        const old = oldAttrs[key];
        if (old !== cur) {
            attributes_1.unlockAttribute(elm, key);
            if (language_1.StringCharCodeAt.call(key, 3) === ColonCharCode) {
                // Assume xml namespace
                elm.setAttributeNS(xmlNS, key, cur);
            }
            else if (language_1.StringCharCodeAt.call(key, 5) === ColonCharCode) {
                // Assume xlink namespace
                elm.setAttributeNS(xlinkNS, key, cur);
            }
            else if (language_1.isNull(cur)) {
                elm.removeAttribute(key);
            }
            else {
                elm.setAttribute(key, cur);
            }
            attributes_1.lockAttribute(elm, key);
        }
    }
}
const emptyVNode = { data: {} };
exports.default = {
    create: (vnode) => updateAttrs(emptyVNode, vnode),
    update: updateAttrs,
};
//# sourceMappingURL=attrs.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/computed-class-attr.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/computed-class-attr.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const classNameToClassMap = language_1.create(null);
function getMapFromClassName(className) {
    // Intentionally using == to match undefined and null values from computed style attribute
    if (className == null) {
        return utils_1.EmptyObject;
    }
    // computed class names must be string
    className = language_1.isString(className) ? className : className + '';
    let map = classNameToClassMap[className];
    if (map) {
        return map;
    }
    map = language_1.create(null);
    let start = 0;
    let o;
    const len = className.length;
    for (o = 0; o < len; o++) {
        if (language_1.StringCharCodeAt.call(className, o) === utils_1.SPACE_CHAR) {
            if (o > start) {
                map[language_1.StringSlice.call(className, start, o)] = true;
            }
            start = o + 1;
        }
    }
    if (o > start) {
        map[language_1.StringSlice.call(className, start, o)] = true;
    }
    classNameToClassMap[className] = map;
    if (undefined !== 'production') {
        // just to make sure that this object never changes as part of the diffing algo
        language_1.freeze(map);
    }
    return map;
}
function updateClassAttribute(oldVnode, vnode) {
    const { elm, data: { className: newClass }, } = vnode;
    const { data: { className: oldClass }, } = oldVnode;
    if (oldClass === newClass) {
        return;
    }
    const { classList } = elm;
    const newClassMap = getMapFromClassName(newClass);
    const oldClassMap = getMapFromClassName(oldClass);
    let name;
    for (name in oldClassMap) {
        // remove only if it is not in the new class collection and it is not set from within the instance
        if (language_1.isUndefined(newClassMap[name])) {
            classList.remove(name);
        }
    }
    for (name in newClassMap) {
        if (language_1.isUndefined(oldClassMap[name])) {
            classList.add(name);
        }
    }
}
const emptyVNode = { data: {} };
exports.default = {
    create: (vnode) => updateClassAttribute(emptyVNode, vnode),
    update: updateClassAttribute,
};
//# sourceMappingURL=computed-class-attr.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/computed-style-attr.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/computed-style-attr.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const element_1 = __webpack_require__(/*! ../../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
// The style property is a string when defined via an expression in the template.
function updateStyleAttribute(oldVnode, vnode) {
    const { style: newStyle } = vnode.data;
    if (oldVnode.data.style === newStyle) {
        return;
    }
    const elm = vnode.elm;
    const { style } = elm;
    if (!language_1.isString(newStyle) || newStyle === '') {
        element_1.removeAttribute.call(elm, 'style');
    }
    else {
        style.cssText = newStyle;
    }
}
const emptyVNode = { data: {} };
exports.default = {
    create: (vnode) => updateStyleAttribute(emptyVNode, vnode),
    update: updateStyleAttribute,
};
//# sourceMappingURL=computed-style-attr.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/context.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/context.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const fields_1 = __webpack_require__(/*! ../../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
function createContext(vnode) {
    const { data: { context }, } = vnode;
    if (language_1.isUndefined(context)) {
        return;
    }
    const elm = vnode.elm;
    const vm = fields_1.getInternalField(elm, utils_1.ViewModelReflection);
    if (!language_1.isUndefined(vm)) {
        language_1.assign(vm.context, context);
    }
}
const contextModule = {
    create: createContext,
};
exports.default = contextModule;
//# sourceMappingURL=context.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/events.js":
/*!******************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/events.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
function handleEvent(event, vnode) {
    const { type } = event;
    const { data: { on }, } = vnode;
    const handler = on && on[type];
    // call event handler if exists
    if (handler) {
        handler.call(undefined, event);
    }
}
function createListener() {
    return function handler(event) {
        handleEvent(event, handler.vnode);
    };
}
function updateAllEventListeners(oldVnode, vnode) {
    if (language_1.isUndefined(oldVnode.listener)) {
        createAllEventListeners(vnode);
    }
    else {
        vnode.listener = oldVnode.listener;
        vnode.listener.vnode = vnode;
    }
}
function createAllEventListeners(vnode) {
    const { data: { on }, } = vnode;
    if (language_1.isUndefined(on)) {
        return;
    }
    const elm = vnode.elm;
    const listener = (vnode.listener = createListener());
    listener.vnode = vnode;
    let name;
    for (name in on) {
        elm.addEventListener(name, listener);
    }
}
exports.default = {
    update: updateAllEventListeners,
    create: createAllEventListeners,
};
//# sourceMappingURL=events.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/props.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/props.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const fields_1 = __webpack_require__(/*! ../../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
const utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const base_bridge_element_1 = __webpack_require__(/*! ../base-bridge-element */ "./node_modules/@lwc/engine/lib/framework/base-bridge-element.js");
const attributes_1 = __webpack_require__(/*! ../attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
function isLiveBindingProp(sel, key) {
    // For special whitelisted properties, we check against the actual property value on the DOM element instead of
    // relying on tracked property values.
    return sel === 'input' && (key === 'value' || key === 'checked');
}
function update(oldVnode, vnode) {
    const props = vnode.data.props;
    if (language_1.isUndefined(props)) {
        return;
    }
    const oldProps = oldVnode.data.props;
    if (oldProps === props) {
        return;
    }
    if (undefined !== 'production') {
        assert_1.default.invariant(language_1.isUndefined(oldProps) || language_1.keys(oldProps).join(',') === language_1.keys(props).join(','), 'vnode.data.props cannot change shape.');
    }
    const elm = vnode.elm;
    const vm = fields_1.getInternalField(elm, utils_1.ViewModelReflection);
    const isFirstPatch = language_1.isUndefined(oldProps);
    const isCustomElement = !language_1.isUndefined(vm);
    const { sel } = vnode;
    for (const key in props) {
        const cur = props[key];
        if (undefined !== 'production') {
            if (!(key in elm)) {
                // TODO: #1297 - Move this validation to the compiler
                assert_1.default.fail(`Unknown public property "${key}" of element <${sel}>. This is likely a typo on the corresponding attribute "${attributes_1.getAttrNameFromPropName(key)}".`);
            }
        }
        // if it is the first time this element is patched, or the current value is different to the previous value...
        if (isFirstPatch ||
            cur !== (isLiveBindingProp(sel, key) ? elm[key] : oldProps[key])) {
            if (isCustomElement) {
                base_bridge_element_1.prepareForPropUpdate(vm); // this is just in case the vnode is actually a custom element
            }
            elm[key] = cur;
        }
    }
}
const emptyVNode = { data: {} };
exports.default = {
    create: (vnode) => update(emptyVNode, vnode),
    update,
};
//# sourceMappingURL=props.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/static-class-attr.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/static-class-attr.js ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
// The HTML class property becomes the vnode.data.classMap object when defined as a string in the template.
// The compiler takes care of transforming the inline classnames into an object. It's faster to set the
// different classnames properties individually instead of via a string.
function createClassAttribute(vnode) {
    const { elm, data: { classMap }, } = vnode;
    if (language_1.isUndefined(classMap)) {
        return;
    }
    const { classList } = elm;
    for (const name in classMap) {
        classList.add(name);
    }
}
exports.default = {
    create: createClassAttribute,
};
//# sourceMappingURL=static-class-attr.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/modules/static-style-attr.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/modules/static-style-attr.js ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
// The HTML style property becomes the vnode.data.styleMap object when defined as a string in the template.
// The compiler takes care of transforming the inline style into an object. It's faster to set the
// different style properties individually instead of via a string.
function createStyleAttribute(vnode) {
    const { elm, data: { styleMap }, } = vnode;
    if (language_1.isUndefined(styleMap)) {
        return;
    }
    const { style } = elm;
    for (const name in styleMap) {
        style[name] = styleMap[name];
    }
}
exports.default = {
    create: createStyleAttribute,
};
//# sourceMappingURL=static-style-attr.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/patch.js":
/*!*********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/patch.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
// TODO: #1164 - eventually the engine should not do any of this work,
// it should just interact with the DOM, and the polyfill should
// take care of all these operation
const { PatchedElement, PatchedSlotElement, PatchedNode } = utils_1.useSyntheticShadow
    ? Element.prototype.$lwcPolyfill$
    : {};
// Using a WeakMap instead of a WeakSet because this one works in IE11 :(
const FromIteration = new WeakMap();
// dynamic children means it was generated by an iteration
// in a template, and will require a more complex diffing algo.
function markAsDynamicChildren(children) {
    FromIteration.set(children, 1);
}
exports.markAsDynamicChildren = markAsDynamicChildren;
function hasDynamicChildren(children) {
    return FromIteration.has(children);
}
exports.hasDynamicChildren = hasDynamicChildren;
let TextNodeProto;
// this method is supposed to be invoked when in fallback mode only
// to patch text nodes generated by a template.
function patchTextNodeProto(text) {
    if (language_1.isUndefined(TextNodeProto)) {
        TextNodeProto = PatchedNode(text).prototype;
    }
    language_1.setPrototypeOf(text, TextNodeProto);
}
exports.patchTextNodeProto = patchTextNodeProto;
let CommentNodeProto;
// this method is supposed to be invoked when in fallback mode only
// to patch comment nodes generated by a template.
function patchCommentNodeProto(comment) {
    if (language_1.isUndefined(CommentNodeProto)) {
        CommentNodeProto = PatchedNode(comment).prototype;
    }
    language_1.setPrototypeOf(comment, CommentNodeProto);
}
exports.patchCommentNodeProto = patchCommentNodeProto;
const TagToProtoCache = language_1.create(null);
function getPatchedElementClass(elm) {
    switch (element_1.tagNameGetter.call(elm)) {
        case 'SLOT':
            return PatchedSlotElement(elm);
    }
    return PatchedElement(elm);
}
// this method is supposed to be invoked when in fallback mode only
// to patch elements generated by a template.
function patchElementProto(elm, options) {
    const { sel } = options;
    let proto = TagToProtoCache[sel];
    if (language_1.isUndefined(proto)) {
        proto = TagToProtoCache[sel] = getPatchedElementClass(elm).prototype;
    }
    language_1.setPrototypeOf(elm, proto);
}
exports.patchElementProto = patchElementProto;
function patchCustomElementProto(elm, options) {
    const { def } = options;
    let patchedBridge = def.patchedBridge;
    if (language_1.isUndefined(patchedBridge)) {
        patchedBridge = def.patchedBridge = PatchedElement(elm);
    }
    // temporary patching the proto, eventually this should be just more nodes in the proto chain
    language_1.setPrototypeOf(elm, patchedBridge.prototype);
}
exports.patchCustomElementProto = patchCustomElementProto;
//# sourceMappingURL=patch.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/performance-timing.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/performance-timing.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
var GlobalMeasurementPhase;
(function (GlobalMeasurementPhase) {
    GlobalMeasurementPhase["REHYDRATE"] = "lwc-rehydrate";
    GlobalMeasurementPhase["HYDRATE"] = "lwc-hydrate";
})(GlobalMeasurementPhase = exports.GlobalMeasurementPhase || (exports.GlobalMeasurementPhase = {}));
// Even if all the browser the engine supports implements the UserTiming API, we need to guard the measure APIs.
// JSDom (used in Jest) for example doesn't implement the UserTiming APIs.
const isUserTimingSupported = typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    typeof performance.clearMarks === 'function' &&
    typeof performance.measure === 'function' &&
    typeof performance.clearMeasures === 'function';
function getMarkName(phase, vm) {
    return `<${language_1.StringToLowerCase.call(element_1.tagNameGetter.call(vm.elm))} (${vm.idx})> - ${phase}`;
}
function start(markName) {
    performance.mark(markName);
}
function end(measureName, markName) {
    performance.measure(measureName, markName);
    // Clear the created marks and measure to avoid filling the performance entries buffer.
    // Note: Even if the entries get deleted, existing PerformanceObservers preserve a copy of those entries.
    performance.clearMarks(markName);
    performance.clearMarks(measureName);
}
function noop() {
    /* do nothing */
}
exports.startMeasure = !isUserTimingSupported
    ? noop
    : function (phase, vm) {
        const markName = getMarkName(phase, vm);
        start(markName);
    };
exports.endMeasure = !isUserTimingSupported
    ? noop
    : function (phase, vm) {
        const markName = getMarkName(phase, vm);
        end(markName, markName);
    };
// Global measurements can be nested into each others (e.g. nested component creation via createElement). In those cases
// the VM is used to create unique mark names at each level.
exports.startGlobalMeasure = !isUserTimingSupported
    ? noop
    : function (phase, vm) {
        const markName = language_1.isUndefined(vm) ? phase : getMarkName(phase, vm);
        start(markName);
    };
exports.endGlobalMeasure = !isUserTimingSupported
    ? noop
    : function (phase, vm) {
        const markName = language_1.isUndefined(vm) ? phase : getMarkName(phase, vm);
        end(phase, markName);
    };
//# sourceMappingURL=performance-timing.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/restrictions.js":
/*!****************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/restrictions.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint no-production-assert: "off" */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const attributes_1 = __webpack_require__(/*! ./attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const invoker_1 = __webpack_require__(/*! ./invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
function generateDataDescriptor(options) {
    return language_1.assign({
        configurable: true,
        enumerable: true,
        writable: true,
    }, options);
}
function generateAccessorDescriptor(options) {
    return language_1.assign({
        configurable: true,
        enumerable: true,
    }, options);
}
let isDomMutationAllowed = false;
function unlockDomMutation() {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    isDomMutationAllowed = true;
}
exports.unlockDomMutation = unlockDomMutation;
function lockDomMutation() {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    isDomMutationAllowed = false;
}
exports.lockDomMutation = lockDomMutation;
function portalRestrictionErrorMessage(name, type) {
    return `The \`${name}\` ${type} is available only on elements that use the \`lwc:dom="manual"\` directive.`;
}
function getNodeRestrictionsDescriptors(node, options) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    // getPropertyDescriptor here recursively looks up the prototype chain
    // and returns the first descriptor for the property
    const originalTextContentDescriptor = language_1.getPropertyDescriptor(node, 'textContent');
    const originalNodeValueDescriptor = language_1.getPropertyDescriptor(node, 'nodeValue');
    const { appendChild, insertBefore, removeChild, replaceChild } = node;
    return {
        appendChild: generateDataDescriptor({
            value(aChild) {
                if (this instanceof Element && language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('appendChild', 'method'), this);
                }
                return appendChild.call(this, aChild);
            },
        }),
        insertBefore: generateDataDescriptor({
            value(newNode, referenceNode) {
                if (!isDomMutationAllowed && this instanceof Element && language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('insertBefore', 'method'), this);
                }
                return insertBefore.call(this, newNode, referenceNode);
            },
        }),
        removeChild: generateDataDescriptor({
            value(aChild) {
                if (!isDomMutationAllowed && this instanceof Element && language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('removeChild', 'method'), this);
                }
                return removeChild.call(this, aChild);
            },
        }),
        replaceChild: generateDataDescriptor({
            value(newChild, oldChild) {
                if (this instanceof Element && language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('replaceChild', 'method'), this);
                }
                return replaceChild.call(this, newChild, oldChild);
            },
        }),
        nodeValue: generateAccessorDescriptor({
            get() {
                return originalNodeValueDescriptor.get.call(this);
            },
            set(value) {
                if (!isDomMutationAllowed && this instanceof Element && language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('nodeValue', 'property'), this);
                }
                originalNodeValueDescriptor.set.call(this, value);
            },
        }),
        textContent: generateAccessorDescriptor({
            get() {
                return originalTextContentDescriptor.get.call(this);
            },
            set(value) {
                if (this instanceof Element && language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('textContent', 'property'), this);
                }
                originalTextContentDescriptor.set.call(this, value);
            },
        }),
    };
}
function getElementRestrictionsDescriptors(elm, options) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const descriptors = getNodeRestrictionsDescriptors(elm, options);
    const originalInnerHTMLDescriptor = language_1.getPropertyDescriptor(elm, 'innerHTML');
    const originalOuterHTMLDescriptor = language_1.getPropertyDescriptor(elm, 'outerHTML');
    language_1.assign(descriptors, {
        innerHTML: generateAccessorDescriptor({
            get() {
                return originalInnerHTMLDescriptor.get.call(this);
            },
            set(value) {
                if (language_1.isFalse(options.isPortal)) {
                    assert_1.default.logError(portalRestrictionErrorMessage('innerHTML', 'property'), this);
                }
                return originalInnerHTMLDescriptor.set.call(this, value);
            },
        }),
        outerHTML: generateAccessorDescriptor({
            get() {
                return originalOuterHTMLDescriptor.get.call(this);
            },
            set(_value) {
                throw new TypeError(`Invalid attempt to set outerHTML on Element.`);
            },
        }),
    });
    return descriptors;
}
function getShadowRootRestrictionsDescriptors(sr, options) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    // blacklisting properties in dev mode only to avoid people doing the wrong
    // thing when using the real shadow root, because if that's the case,
    // the component will not work when running with synthetic shadow.
    const originalQuerySelector = sr.querySelector;
    const originalQuerySelectorAll = sr.querySelectorAll;
    const originalAddEventListener = sr.addEventListener;
    const descriptors = getNodeRestrictionsDescriptors(sr, options);
    const originalInnerHTMLDescriptor = language_1.getPropertyDescriptor(sr, 'innerHTML');
    const originalTextContentDescriptor = language_1.getPropertyDescriptor(sr, 'textContent');
    language_1.assign(descriptors, {
        innerHTML: generateAccessorDescriptor({
            get() {
                return originalInnerHTMLDescriptor.get.call(this);
            },
            set(_value) {
                throw new TypeError(`Invalid attempt to set innerHTML on ShadowRoot.`);
            },
        }),
        textContent: generateAccessorDescriptor({
            get() {
                return originalTextContentDescriptor.get.call(this);
            },
            set(_value) {
                throw new TypeError(`Invalid attempt to set textContent on ShadowRoot.`);
            },
        }),
        addEventListener: generateDataDescriptor({
            value(type) {
                assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${language_1.toString(sr)} by adding an event listener for "${type}".`);
                // Typescript does not like it when you treat the `arguments` object as an array
                // @ts-ignore type-mismatch
                return originalAddEventListener.apply(this, arguments);
            },
        }),
        querySelector: generateDataDescriptor({
            value() {
                const vm = vm_1.getShadowRootVM(this);
                assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.template.querySelector() cannot be called during the construction of the custom element for ${vm} because no content has been rendered yet.`);
                // Typescript does not like it when you treat the `arguments` object as an array
                // @ts-ignore type-mismatch
                return originalQuerySelector.apply(this, arguments);
            },
        }),
        querySelectorAll: generateDataDescriptor({
            value() {
                const vm = vm_1.getShadowRootVM(this);
                assert_1.default.isFalse(invoker_1.isBeingConstructed(vm), `this.template.querySelectorAll() cannot be called during the construction of the custom element for ${vm} because no content has been rendered yet.`);
                // Typescript does not like it when you treat the `arguments` object as an array
                // @ts-ignore type-mismatch
                return originalQuerySelectorAll.apply(this, arguments);
            },
        }),
    });
    const BlackListedShadowRootMethods = {
        cloneNode: 0,
        getElementById: 0,
        getSelection: 0,
        elementsFromPoint: 0,
        dispatchEvent: 0,
    };
    language_1.forEach.call(language_1.getOwnPropertyNames(BlackListedShadowRootMethods), (methodName) => {
        const descriptor = generateAccessorDescriptor({
            get() {
                throw new Error(`Disallowed method "${methodName}" in ShadowRoot.`);
            },
        });
        descriptors[methodName] = descriptor;
    });
    return descriptors;
}
// Custom Elements Restrictions:
// -----------------------------
function getAttributePatched(attrName) {
    if (undefined !== 'production') {
        const vm = vm_1.getCustomElementVM(this);
        assertAttributeReflectionCapability(vm, attrName);
    }
    return element_1.getAttribute.apply(this, language_1.ArraySlice.call(arguments));
}
function setAttributePatched(attrName, _newValue) {
    const vm = vm_1.getCustomElementVM(this);
    if (undefined !== 'production') {
        assertAttributeReflectionCapability(vm, attrName);
    }
    element_1.setAttribute.apply(this, language_1.ArraySlice.call(arguments));
}
function setAttributeNSPatched(attrNameSpace, attrName, _newValue) {
    const vm = vm_1.getCustomElementVM(this);
    if (undefined !== 'production') {
        assertAttributeReflectionCapability(vm, attrName);
    }
    element_1.setAttributeNS.apply(this, language_1.ArraySlice.call(arguments));
}
function removeAttributePatched(attrName) {
    const vm = vm_1.getCustomElementVM(this);
    // marking the set is needed for the AOM polyfill
    if (undefined !== 'production') {
        assertAttributeReflectionCapability(vm, attrName);
    }
    element_1.removeAttribute.apply(this, language_1.ArraySlice.call(arguments));
}
function removeAttributeNSPatched(attrNameSpace, attrName) {
    const vm = vm_1.getCustomElementVM(this);
    if (undefined !== 'production') {
        assertAttributeReflectionCapability(vm, attrName);
    }
    element_1.removeAttributeNS.apply(this, language_1.ArraySlice.call(arguments));
}
function assertAttributeReflectionCapability(vm, attrName) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const propName = language_1.isString(attrName)
        ? attributes_1.getPropNameFromAttrName(language_1.StringToLowerCase.call(attrName))
        : null;
    const { elm, def: { props: propsConfig }, } = vm;
    if (isNodeFromVNode(elm) &&
        attributes_1.isAttributeLocked(elm, attrName) &&
        propsConfig &&
        propName &&
        propsConfig[propName]) {
        assert_1.default.logError(`Invalid attribute access for \`${attrName}\`. Use the corresponding property \`${propName}\` instead.`, elm);
    }
}
function getCustomElementRestrictionsDescriptors(elm, options) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const descriptors = getNodeRestrictionsDescriptors(elm, options);
    const originalAddEventListener = elm.addEventListener;
    const originalInnerHTMLDescriptor = language_1.getPropertyDescriptor(elm, 'innerHTML');
    const originalOuterHTMLDescriptor = language_1.getPropertyDescriptor(elm, 'outerHTML');
    const originalTextContentDescriptor = language_1.getPropertyDescriptor(elm, 'textContent');
    return language_1.assign(descriptors, {
        innerHTML: generateAccessorDescriptor({
            get() {
                return originalInnerHTMLDescriptor.get.call(this);
            },
            set(_value) {
                throw new TypeError(`Invalid attempt to set innerHTML on HTMLElement.`);
            },
        }),
        outerHTML: generateAccessorDescriptor({
            get() {
                return originalOuterHTMLDescriptor.get.call(this);
            },
            set(_value) {
                throw new TypeError(`Invalid attempt to set outerHTML on HTMLElement.`);
            },
        }),
        textContent: generateAccessorDescriptor({
            get() {
                return originalTextContentDescriptor.get.call(this);
            },
            set(_value) {
                throw new TypeError(`Invalid attempt to set textContent on HTMLElement.`);
            },
        }),
        addEventListener: generateDataDescriptor({
            value(type) {
                assert_1.default.invariant(!invoker_1.isRendering, `${invoker_1.vmBeingRendered}.render() method has side effects on the state of ${language_1.toString(elm)} by adding an event listener for "${type}".`);
                // Typescript does not like it when you treat the `arguments` object as an array
                // @ts-ignore type-mismatch
                return originalAddEventListener.apply(this, arguments);
            },
        }),
        // replacing mutators and accessors on the element itself to catch any mutation
        getAttribute: generateDataDescriptor({
            value: getAttributePatched,
        }),
        setAttribute: generateDataDescriptor({
            value: setAttributePatched,
        }),
        setAttributeNS: generateDataDescriptor({
            value: setAttributeNSPatched,
        }),
        removeAttribute: generateDataDescriptor({
            value: removeAttributePatched,
        }),
        removeAttributeNS: generateDataDescriptor({
            value: removeAttributeNSPatched,
        }),
    });
}
function getComponentRestrictionsDescriptors(cmp) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const originalSetAttribute = cmp.setAttribute;
    return {
        setAttribute: generateDataDescriptor({
            value(attrName, _value) {
                if (language_1.isString(attrName)) {
                    const propName = attributes_1.getPropNameFromAttrName(attrName);
                    const globalAttrName = attributes_1.globalHTMLProperties[propName] && attributes_1.globalHTMLProperties[propName].attribute;
                    // Check that the attribute name of the global property is the same as the
                    // attribute name being set by setAttribute.
                    if (attrName === globalAttrName) {
                        const { error } = attributes_1.globalHTMLProperties[propName];
                        if (error) {
                            assert_1.default.logError(error, vm_1.getComponentVM(this).elm);
                        }
                    }
                }
                // Typescript does not like it when you treat the `arguments` object as an array
                // @ts-ignore type-mismatch
                originalSetAttribute.apply(this, arguments);
            },
            configurable: true,
            enumerable: false,
        }),
        tagName: generateAccessorDescriptor({
            get() {
                throw new Error(`Usage of property \`tagName\` is disallowed because the component itself does not know which tagName will be used to create the element, therefore writing code that check for that value is error prone.`);
            },
            configurable: true,
            enumerable: false,
        }),
    };
}
function getLightingElementProtypeRestrictionsDescriptors(proto) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const descriptors = {};
    language_1.forEach.call(language_1.getOwnPropertyNames(attributes_1.globalHTMLProperties), (propName) => {
        if (propName in proto) {
            return; // no need to redefine something that we are already exposing
        }
        descriptors[propName] = generateAccessorDescriptor({
            get() {
                const { error, attribute } = attributes_1.globalHTMLProperties[propName];
                const msg = [];
                msg.push(`Accessing the global HTML property "${propName}" is disabled.`);
                if (error) {
                    msg.push(error);
                }
                else if (attribute) {
                    msg.push(`Instead access it via \`this.getAttribute("${attribute}")\`.`);
                }
                assert_1.default.logError(msg.join('\n'), vm_1.getComponentVM(this).elm);
            },
            set() {
                const { readOnly } = attributes_1.globalHTMLProperties[propName];
                if (readOnly) {
                    assert_1.default.logError(`The global HTML property \`${propName}\` is read-only.`);
                }
            },
        });
    });
    return descriptors;
}
function isNodeFromVNode(node) {
    return !!node.$fromTemplate$;
}
function markNodeFromVNode(node) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    node.$fromTemplate$ = true;
}
exports.markNodeFromVNode = markNodeFromVNode;
function patchElementWithRestrictions(elm, options) {
    language_1.defineProperties(elm, getElementRestrictionsDescriptors(elm, options));
}
exports.patchElementWithRestrictions = patchElementWithRestrictions;
// This routine will prevent access to certain properties on a shadow root instance to guarantee
// that all components will work fine in IE11 and other browsers without shadow dom support.
function patchShadowRootWithRestrictions(sr, options) {
    language_1.defineProperties(sr, getShadowRootRestrictionsDescriptors(sr, options));
}
exports.patchShadowRootWithRestrictions = patchShadowRootWithRestrictions;
function patchCustomElementWithRestrictions(elm, options) {
    const restrictionsDescriptors = getCustomElementRestrictionsDescriptors(elm, options);
    const elmProto = language_1.getPrototypeOf(elm);
    language_1.setPrototypeOf(elm, language_1.create(elmProto, restrictionsDescriptors));
}
exports.patchCustomElementWithRestrictions = patchCustomElementWithRestrictions;
function patchComponentWithRestrictions(cmp) {
    language_1.defineProperties(cmp, getComponentRestrictionsDescriptors(cmp));
}
exports.patchComponentWithRestrictions = patchComponentWithRestrictions;
function patchLightningElementPrototypeWithRestrictions(proto) {
    language_1.defineProperties(proto, getLightingElementProtypeRestrictionsDescriptors(proto));
}
exports.patchLightningElementPrototypeWithRestrictions = patchLightningElementPrototypeWithRestrictions;
//# sourceMappingURL=restrictions.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/secure-template.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/secure-template.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const signedTemplateSet = new Set();
function defaultEmptyTemplate() {
    return [];
}
exports.defaultEmptyTemplate = defaultEmptyTemplate;
signedTemplateSet.add(defaultEmptyTemplate);
function isTemplateRegistered(tpl) {
    return signedTemplateSet.has(tpl);
}
exports.isTemplateRegistered = isTemplateRegistered;
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */
function registerTemplate(tpl) {
    signedTemplateSet.add(tpl);
    // chaining this method as a way to wrap existing
    // assignment of templates easily, without too much transformation
    return tpl;
}
exports.registerTemplate = registerTemplate;
/**
 * EXPERIMENTAL: This function acts like a hook for Lightning Locker
 * Service and other similar libraries to sanitize vulnerable attributes.
 * This API is subject to change or being removed.
 */
function sanitizeAttribute(tagName, namespaceUri, attrName, attrValue) {
    // locker-service patches this function during runtime to sanitize vulnerable attributes.
    // when ran off-core this function becomes a noop and returns the user authored value.
    return attrValue;
}
exports.sanitizeAttribute = sanitizeAttribute;
//# sourceMappingURL=secure-template.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/services.js":
/*!************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/services.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
exports.Services = language_1.create(null);
const hooks = [
    'wiring',
    'locator',
    'rendered',
    'connected',
    'disconnected',
];
/**
 * EXPERIMENTAL: This function allows for the registration of "services"
 * in LWC by exposing hooks into the component life-cycle. This API is
 * subject to change or being removed.
 */
function register(service) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isObject(service), `Invalid service declaration, ${service}: service must be an object`);
    }
    for (let i = 0; i < hooks.length; ++i) {
        const hookName = hooks[i];
        if (hookName in service) {
            let l = exports.Services[hookName];
            if (language_1.isUndefined(l)) {
                exports.Services[hookName] = l = [];
            }
            language_1.ArrayPush.call(l, service[hookName]);
        }
    }
}
exports.register = register;
function invokeServiceHook(vm, cbs) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(language_1.isArray(cbs) && cbs.length > 0, `Optimize invokeServiceHook() to be invoked only when needed`);
    }
    const { component, data, def, context } = vm;
    for (let i = 0, len = cbs.length; i < len; ++i) {
        cbs[i].call(undefined, component, data, def, context);
    }
}
exports.invokeServiceHook = invokeServiceHook;
//# sourceMappingURL=services.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/stylesheet.js":
/*!**************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/stylesheet.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const api = __importStar(__webpack_require__(/*! ./api */ "./node_modules/@lwc/engine/lib/framework/api.js"));
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
const CachedStyleFragments = language_1.create(null);
function createStyleElement(styleContent) {
    const elm = document.createElement('style');
    elm.type = 'text/css';
    elm.textContent = styleContent;
    return elm;
}
function getCachedStyleElement(styleContent) {
    let fragment = CachedStyleFragments[styleContent];
    if (language_1.isUndefined(fragment)) {
        fragment = document.createDocumentFragment();
        const styleElm = createStyleElement(styleContent);
        fragment.appendChild(styleElm);
        CachedStyleFragments[styleContent] = fragment;
    }
    return fragment.cloneNode(true).firstChild;
}
const globalStyleParent = document.head || document.body || document;
const InsertedGlobalStyleContent = language_1.create(null);
function insertGlobalStyle(styleContent) {
    // inserts the global style when needed, otherwise does nothing
    if (language_1.isUndefined(InsertedGlobalStyleContent[styleContent])) {
        InsertedGlobalStyleContent[styleContent] = true;
        const elm = createStyleElement(styleContent);
        globalStyleParent.appendChild(elm);
    }
}
function createStyleVNode(elm) {
    const vnode = api.h('style', {
        key: 'style',
    }, utils_1.EmptyArray);
    // Force the diffing algo to use the cloned style.
    vnode.elm = elm;
    return vnode;
}
/**
 * Reset the styling token applied to the host element.
 */
function resetStyleAttributes(vm) {
    const { context, elm } = vm;
    // Remove the style attribute currently applied to the host element.
    const oldHostAttribute = context.hostAttribute;
    if (!language_1.isUndefined(oldHostAttribute)) {
        element_1.removeAttribute.call(elm, oldHostAttribute);
    }
    // Reset the scoping attributes associated to the context.
    context.hostAttribute = context.shadowAttribute = undefined;
}
exports.resetStyleAttributes = resetStyleAttributes;
/**
 * Apply/Update the styling token applied to the host element.
 */
function applyStyleAttributes(vm, hostAttribute, shadowAttribute) {
    const { context, elm } = vm;
    // Remove the style attribute currently applied to the host element.
    element_1.setAttribute.call(elm, hostAttribute, '');
    context.hostAttribute = hostAttribute;
    context.shadowAttribute = shadowAttribute;
}
exports.applyStyleAttributes = applyStyleAttributes;
function collectStylesheets(stylesheets, hostSelector, shadowSelector, isNative, aggregatorFn) {
    language_1.forEach.call(stylesheets, sheet => {
        if (language_1.isArray(sheet)) {
            collectStylesheets(sheet, hostSelector, shadowSelector, isNative, aggregatorFn);
        }
        else {
            aggregatorFn(sheet(hostSelector, shadowSelector, isNative));
        }
    });
}
function evaluateCSS(vm, stylesheets, hostAttribute, shadowAttribute) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(language_1.isArray(stylesheets), `Invalid stylesheets.`);
    }
    if (utils_1.useSyntheticShadow) {
        const hostSelector = `[${hostAttribute}]`;
        const shadowSelector = `[${shadowAttribute}]`;
        collectStylesheets(stylesheets, hostSelector, shadowSelector, false, textContent => {
            insertGlobalStyle(textContent);
        });
        return null;
    }
    else {
        // Native shadow in place, we need to act accordingly by using the `:host` selector, and an
        // empty shadow selector since it is not really needed.
        let buffer = '';
        collectStylesheets(stylesheets, language_1.emptyString, language_1.emptyString, true, textContent => {
            buffer += textContent;
        });
        return createStyleVNode(getCachedStyleElement(buffer));
    }
}
exports.evaluateCSS = evaluateCSS;
//# sourceMappingURL=stylesheet.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/template.js":
/*!************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/template.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const api = __importStar(__webpack_require__(/*! ./api */ "./node_modules/@lwc/engine/lib/framework/api.js"));
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const secure_template_1 = __webpack_require__(/*! ./secure-template */ "./node_modules/@lwc/engine/lib/framework/secure-template.js");
exports.registerTemplate = secure_template_1.registerTemplate;
const stylesheet_1 = __webpack_require__(/*! ./stylesheet */ "./node_modules/@lwc/engine/lib/framework/stylesheet.js");
const EmptySlots = language_1.create(null);
function validateSlots(vm, html) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const { cmpSlots = EmptySlots } = vm;
    const { slots = utils_1.EmptyArray } = html;
    for (const slotName in cmpSlots) {
        // eslint-disable-next-line no-production-assert
        assert_1.default.isTrue(language_1.isArray(cmpSlots[slotName]), `Slots can only be set to an array, instead received ${language_1.toString(cmpSlots[slotName])} for slot "${slotName}" in ${vm}.`);
        if (slotName !== '' && language_1.ArrayIndexOf.call(slots, slotName) === -1) {
            // TODO: #1297 - this should never really happen because the compiler should always validate
            // eslint-disable-next-line no-production-assert
            assert_1.default.logError(`Ignoring unknown provided slot name "${slotName}" in ${vm}. Check for a typo on the slot attribute.`, vm.elm);
        }
    }
}
function validateFields(vm, html) {
    if (undefined === 'production') {
        // this method should never leak to prod
        throw new ReferenceError();
    }
    const { component } = vm;
    // validating identifiers used by template that should be provided by the component
    const { ids = [] } = html;
    language_1.forEach.call(ids, (propName) => {
        if (!(propName in component)) {
            // eslint-disable-next-line no-production-assert
            assert_1.default.logError(`The template rendered by ${vm} references \`this.${propName}\`, which is not declared. Check for a typo in the template.`, vm.elm);
        }
    });
}
function evaluateTemplate(vm, html) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(language_1.isFunction(html), `evaluateTemplate() second argument must be an imported template instead of ${language_1.toString(html)}`);
    }
    const { component, context, cmpSlots, cmpTemplate } = vm;
    // reset the cache memoizer for template when needed
    if (html !== cmpTemplate) {
        // perf opt: do not reset the shadow root during the first rendering (there is nothing to reset)
        if (!language_1.isUndefined(cmpTemplate)) {
            // It is important to reset the content to avoid reusing similar elements generated from a different
            // template, because they could have similar IDs, and snabbdom just rely on the IDs.
            vm_1.resetShadowRoot(vm);
        }
        // Check that the template was built by the compiler
        if (!secure_template_1.isTemplateRegistered(html)) {
            throw new TypeError(`Invalid template returned by the render() method on ${vm}. It must return an imported template (e.g.: \`import html from "./${vm.def.name}.html"\`), instead, it has returned: ${language_1.toString(html)}.`);
        }
        vm.cmpTemplate = html;
        // Populate context with template information
        context.tplCache = language_1.create(null);
        stylesheet_1.resetStyleAttributes(vm);
        const { stylesheets, stylesheetTokens } = html;
        if (language_1.isUndefined(stylesheets) || stylesheets.length === 0) {
            context.styleVNode = null;
        }
        else if (!language_1.isUndefined(stylesheetTokens)) {
            const { hostAttribute, shadowAttribute } = stylesheetTokens;
            stylesheet_1.applyStyleAttributes(vm, hostAttribute, shadowAttribute);
            // Caching style vnode so it can be reused on every render
            context.styleVNode = stylesheet_1.evaluateCSS(vm, stylesheets, hostAttribute, shadowAttribute);
        }
        if (undefined !== 'production') {
            // one time operation for any new template returned by render()
            // so we can warn if the template is attempting to use a binding
            // that is not provided by the component instance.
            validateFields(vm, html);
        }
    }
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isObject(context.tplCache), `vm.context.tplCache must be an object associated to ${cmpTemplate}.`);
        // validating slots in every rendering since the allocated content might change over time
        validateSlots(vm, html);
    }
    const vnodes = html.call(undefined, api, component, cmpSlots, context.tplCache);
    const { styleVNode } = context;
    if (!language_1.isNull(styleVNode)) {
        language_1.ArrayUnshift.call(vnodes, styleVNode);
    }
    if (undefined !== 'production') {
        assert_1.default.invariant(language_1.isArray(vnodes), `Compiler should produce html functions that always return an array.`);
    }
    return vnodes;
}
exports.evaluateTemplate = evaluateTemplate;
//# sourceMappingURL=template.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/upgrade.js":
/*!***********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/upgrade.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const fields_1 = __webpack_require__(/*! ../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
const patch_1 = __webpack_require__(/*! ./patch */ "./node_modules/@lwc/engine/lib/framework/patch.js");
const def_1 = __webpack_require__(/*! ./def */ "./node_modules/@lwc/engine/lib/framework/def.js");
const restrictions_1 = __webpack_require__(/*! ./restrictions */ "./node_modules/@lwc/engine/lib/framework/restrictions.js");
const performance_timing_1 = __webpack_require__(/*! ./performance-timing */ "./node_modules/@lwc/engine/lib/framework/performance-timing.js");
const node_1 = __webpack_require__(/*! ../env/node */ "./node_modules/@lwc/engine/lib/env/node.js");
const ConnectingSlot = fields_1.createFieldName('connecting');
const DisconnectingSlot = fields_1.createFieldName('disconnecting');
function callNodeSlot(node, slot) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(node, `callNodeSlot() should not be called for a non-object`);
    }
    const fn = fields_1.getInternalField(node, slot);
    if (!language_1.isUndefined(fn)) {
        fn();
    }
    return node; // for convenience
}
// monkey patching Node methods to be able to detect the insertions and removal of
// root elements created via createElement.
language_1.assign(Node.prototype, {
    appendChild(newChild) {
        const appendedNode = node_1.appendChild.call(this, newChild);
        return callNodeSlot(appendedNode, ConnectingSlot);
    },
    insertBefore(newChild, referenceNode) {
        const insertedNode = node_1.insertBefore.call(this, newChild, referenceNode);
        return callNodeSlot(insertedNode, ConnectingSlot);
    },
    removeChild(oldChild) {
        const removedNode = node_1.removeChild.call(this, oldChild);
        return callNodeSlot(removedNode, DisconnectingSlot);
    },
    replaceChild(newChild, oldChild) {
        const replacedNode = node_1.replaceChild.call(this, newChild, oldChild);
        callNodeSlot(replacedNode, DisconnectingSlot);
        callNodeSlot(newChild, ConnectingSlot);
        return replacedNode;
    },
});
/**
 * EXPERIMENTAL: This function is almost identical to document.createElement
 * (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
 * with the slightly difference that in the options, you can pass the `is`
 * property set to a Constructor instead of just a string value. The intent
 * is to allow the creation of an element controlled by LWC without having
 * to register the element as a custom element. E.g.:
 *
 * const el = createElement('x-foo', { is: FooCtor });
 *
 * If the value of `is` attribute is not a constructor,
 * then it throws a TypeError.
 */
function createElement(sel, options) {
    if (!language_1.isObject(options) || language_1.isNull(options)) {
        throw new TypeError(`"createElement" function expects an object as second parameter but received "${language_1.toString(options)}".`);
    }
    let Ctor = options.is;
    if (!language_1.isFunction(Ctor)) {
        throw new TypeError(`"createElement" function expects a "is" option with a valid component constructor.`);
    }
    const mode = options.mode !== 'closed' ? 'open' : 'closed';
    // Create element with correct tagName
    const element = document.createElement(sel);
    if (!language_1.isUndefined(fields_1.getInternalField(element, utils_1.ViewModelReflection))) {
        // There is a possibility that a custom element is registered under tagName,
        // in which case, the initialization is already carry on, and there is nothing else
        // to do here.
        return element;
    }
    if (utils_1.isCircularModuleDependency(Ctor)) {
        Ctor = utils_1.resolveCircularModuleDependency(Ctor);
    }
    const def = def_1.getComponentDef(Ctor);
    def_1.setElementProto(element, def);
    if (language_1.isTrue(utils_1.useSyntheticShadow)) {
        patch_1.patchCustomElementProto(element, {
            def,
        });
    }
    if (undefined !== 'production') {
        restrictions_1.patchCustomElementWithRestrictions(element, utils_1.EmptyObject);
    }
    // In case the element is not initialized already, we need to carry on the manual creation
    vm_1.createVM(element, Ctor, { mode, isRoot: true, owner: null });
    // Handle insertion and removal from the DOM manually
    fields_1.setInternalField(element, ConnectingSlot, () => {
        const vm = vm_1.getCustomElementVM(element);
        performance_timing_1.startGlobalMeasure(performance_timing_1.GlobalMeasurementPhase.HYDRATE, vm);
        if (vm.state === vm_1.VMState.connected) {
            // usually means moving the element from one place to another, which is observable via life-cycle hooks
            vm_1.removeRootVM(vm);
        }
        vm_1.appendRootVM(vm);
        performance_timing_1.endGlobalMeasure(performance_timing_1.GlobalMeasurementPhase.HYDRATE, vm);
    });
    fields_1.setInternalField(element, DisconnectingSlot, () => {
        const vm = vm_1.getCustomElementVM(element);
        vm_1.removeRootVM(vm);
    });
    return element;
}
exports.createElement = createElement;
//# sourceMappingURL=upgrade.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/utils.js":
/*!*********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/utils.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const fields_1 = __webpack_require__(/*! ../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
let nextTickCallbackQueue = [];
exports.SPACE_CHAR = 32;
exports.EmptyObject = language_1.seal(language_1.create(null));
exports.EmptyArray = language_1.seal([]);
exports.ViewModelReflection = fields_1.createFieldName('ViewModel');
function flushCallbackQueue() {
    if (undefined !== 'production') {
        if (nextTickCallbackQueue.length === 0) {
            throw new Error(`Internal Error: If callbackQueue is scheduled, it is because there must be at least one callback on this pending queue.`);
        }
    }
    const callbacks = nextTickCallbackQueue;
    nextTickCallbackQueue = []; // reset to a new queue
    for (let i = 0, len = callbacks.length; i < len; i += 1) {
        callbacks[i]();
    }
}
function addCallbackToNextTick(callback) {
    if (undefined !== 'production') {
        if (!language_1.isFunction(callback)) {
            throw new Error(`Internal Error: addCallbackToNextTick() can only accept a function callback`);
        }
    }
    if (nextTickCallbackQueue.length === 0) {
        Promise.resolve().then(flushCallbackQueue);
    }
    language_1.ArrayPush.call(nextTickCallbackQueue, callback);
}
exports.addCallbackToNextTick = addCallbackToNextTick;
function isCircularModuleDependency(value) {
    return language_1.hasOwnProperty.call(value, '__circular__');
}
exports.isCircularModuleDependency = isCircularModuleDependency;
/**
 * When LWC is used in the context of an Aura application, the compiler produces AMD
 * modules, that doesn't resolve properly circular dependencies between modules. In order
 * to circumvent this issue, the module loader returns a factory with a symbol attached
 * to it.
 *
 * This method returns the resolved value if it received a factory as argument. Otherwise
 * it returns the original value.
 */
function resolveCircularModuleDependency(fn) {
    if (undefined !== 'production') {
        if (!language_1.isFunction(fn)) {
            throw new TypeError(`Circular module dependency must be a function.`);
        }
    }
    return fn();
}
exports.resolveCircularModuleDependency = resolveCircularModuleDependency;
exports.useSyntheticShadow = language_1.hasOwnProperty.call(Element.prototype, '$shadowToken$');
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/vm.js":
/*!******************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/vm.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const def_1 = __webpack_require__(/*! ./def */ "./node_modules/@lwc/engine/lib/framework/def.js");
const component_1 = __webpack_require__(/*! ./component */ "./node_modules/@lwc/engine/lib/framework/component.js");
const patch_1 = __webpack_require__(/*! ./patch */ "./node_modules/@lwc/engine/lib/framework/patch.js");
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const fields_1 = __webpack_require__(/*! ../shared/fields */ "./node_modules/@lwc/engine/lib/shared/fields.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const services_1 = __webpack_require__(/*! ./services */ "./node_modules/@lwc/engine/lib/framework/services.js");
const invoker_1 = __webpack_require__(/*! ./invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
const dom_1 = __webpack_require__(/*! ../env/dom */ "./node_modules/@lwc/engine/lib/env/dom.js");
const performance_timing_1 = __webpack_require__(/*! ./performance-timing */ "./node_modules/@lwc/engine/lib/framework/performance-timing.js");
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
const node_1 = __webpack_require__(/*! ../env/node */ "./node_modules/@lwc/engine/lib/env/node.js");
const snabbdom_1 = __webpack_require__(/*! ../3rdparty/snabbdom/snabbdom */ "./node_modules/@lwc/engine/lib/3rdparty/snabbdom/snabbdom.js");
// Object of type ShadowRoot for instance checks
const GlobalShadowRoot = window.ShadowRoot;
var VMState;
(function (VMState) {
    VMState[VMState["created"] = 0] = "created";
    VMState[VMState["connected"] = 1] = "connected";
    VMState[VMState["disconnected"] = 2] = "disconnected";
})(VMState = exports.VMState || (exports.VMState = {}));
let idx = 0;
function callHook(cmp, fn, args = []) {
    return fn.apply(cmp, args);
}
function setHook(cmp, prop, newValue) {
    cmp[prop] = newValue;
}
function getHook(cmp, prop) {
    return cmp[prop];
}
function rerenderVM(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    rehydrate(vm);
}
exports.rerenderVM = rerenderVM;
function appendRootVM(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    runConnectedCallback(vm);
    rehydrate(vm);
}
exports.appendRootVM = appendRootVM;
function appendVM(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(vm.state === VMState.created, `${vm} cannot be recycled.`);
    }
    runConnectedCallback(vm);
    rehydrate(vm);
}
exports.appendVM = appendVM;
// just in case the component comes back, with this we guarantee re-rendering it
// while preventing any attempt to rehydration until after reinsertion.
function resetComponentStateWhenRemoved(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { state } = vm;
    if (state !== VMState.disconnected) {
        runDisconnectedCallback(vm);
        // Spec: https://dom.spec.whatwg.org/#concept-node-remove (step 14-15)
        runShadowChildNodesDisconnectedCallback(vm);
        runLightChildNodesDisconnectedCallback(vm);
    }
}
// this method is triggered by the diffing algo only when a vnode from the
// old vnode.children is removed from the DOM.
function removeVM(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(vm.state === VMState.connected, `${vm} must be inserted.`);
    }
    resetComponentStateWhenRemoved(vm);
}
exports.removeVM = removeVM;
// this method is triggered by the removal of a root element from the DOM.
function removeRootVM(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    resetComponentStateWhenRemoved(vm);
}
exports.removeRootVM = removeRootVM;
function createVM(elm, Ctor, options) {
    if (undefined !== 'production') {
        assert_1.default.invariant(elm instanceof HTMLElement, `VM creation requires a DOM element instead of ${elm}.`);
    }
    const def = def_1.getComponentDef(Ctor);
    const { isRoot, mode, owner } = options;
    idx += 1;
    const uninitializedVm = {
        // component creation index is defined once, and never reset, it can
        // be preserved from one insertion to another without any issue
        idx,
        state: VMState.created,
        isScheduled: false,
        isDirty: true,
        isRoot: language_1.isTrue(isRoot),
        mode,
        def,
        owner,
        elm,
        data: utils_1.EmptyObject,
        context: language_1.create(null),
        cmpTemplate: undefined,
        cmpProps: language_1.create(null),
        cmpTrack: language_1.create(null),
        cmpSlots: utils_1.useSyntheticShadow ? language_1.create(null) : undefined,
        callHook,
        setHook,
        getHook,
        component: undefined,
        children: utils_1.EmptyArray,
        aChildren: utils_1.EmptyArray,
        velements: utils_1.EmptyArray,
        // used to track down all object-key pairs that makes this vm reactive
        deps: [],
    };
    if (undefined !== 'production') {
        uninitializedVm.toString = () => {
            return `[object:vm ${def.name} (${uninitializedVm.idx})]`;
        };
    }
    // create component instance associated to the vm and the element
    component_1.createComponent(uninitializedVm, Ctor);
    // link component to the wire service
    const initializedVm = uninitializedVm;
    component_1.linkComponent(initializedVm);
}
exports.createVM = createVM;
function rehydrate(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(vm.elm instanceof HTMLElement, `rehydration can only happen after ${vm} was patched the first time.`);
    }
    if (language_1.isTrue(vm.isDirty)) {
        const children = component_1.renderComponent(vm);
        patchShadowRoot(vm, children);
    }
}
function patchShadowRoot(vm, newCh) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { cmpRoot, children: oldCh } = vm;
    vm.children = newCh; // caching the new children collection
    if (newCh.length > 0 || oldCh.length > 0) {
        // patch function mutates vnodes by adding the element reference,
        // however, if patching fails it contains partial changes.
        if (oldCh !== newCh) {
            const fn = patch_1.hasDynamicChildren(newCh) ? snabbdom_1.updateDynamicChildren : snabbdom_1.updateStaticChildren;
            runWithBoundaryProtection(vm, vm, () => {
                // pre
                if (undefined !== 'production') {
                    performance_timing_1.startMeasure('patch', vm);
                }
            }, () => {
                // job
                fn(cmpRoot, oldCh, newCh);
            }, () => {
                // post
                if (undefined !== 'production') {
                    performance_timing_1.endMeasure('patch', vm);
                }
            });
        }
    }
    if (vm.state === VMState.connected) {
        // If the element is connected, that means connectedCallback was already issued, and
        // any successive rendering should finish with the call to renderedCallback, otherwise
        // the connectedCallback will take care of calling it in the right order at the end of
        // the current rehydration process.
        runRenderedCallback(vm);
    }
}
function runRenderedCallback(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { rendered } = services_1.Services;
    if (rendered) {
        services_1.invokeServiceHook(vm, rendered);
    }
    const { renderedCallback } = vm.def;
    if (!language_1.isUndefined(renderedCallback)) {
        if (undefined !== 'production') {
            performance_timing_1.startMeasure('renderedCallback', vm);
        }
        invoker_1.invokeComponentCallback(vm, renderedCallback);
        if (undefined !== 'production') {
            performance_timing_1.endMeasure('renderedCallback', vm);
        }
    }
}
let rehydrateQueue = [];
function flushRehydrationQueue() {
    performance_timing_1.startGlobalMeasure(performance_timing_1.GlobalMeasurementPhase.REHYDRATE);
    if (undefined !== 'production') {
        assert_1.default.invariant(rehydrateQueue.length, `If rehydrateQueue was scheduled, it is because there must be at least one VM on this pending queue instead of ${rehydrateQueue}.`);
    }
    const vms = rehydrateQueue.sort((a, b) => a.idx - b.idx);
    rehydrateQueue = []; // reset to a new queue
    for (let i = 0, len = vms.length; i < len; i += 1) {
        const vm = vms[i];
        try {
            rehydrate(vm);
        }
        catch (error) {
            if (i + 1 < len) {
                // pieces of the queue are still pending to be rehydrated, those should have priority
                if (rehydrateQueue.length === 0) {
                    utils_1.addCallbackToNextTick(flushRehydrationQueue);
                }
                language_1.ArrayUnshift.apply(rehydrateQueue, language_1.ArraySlice.call(vms, i + 1));
            }
            // we need to end the measure before throwing.
            performance_timing_1.endGlobalMeasure(performance_timing_1.GlobalMeasurementPhase.REHYDRATE);
            // re-throwing the original error will break the current tick, but since the next tick is
            // already scheduled, it should continue patching the rest.
            throw error; // eslint-disable-line no-unsafe-finally
        }
    }
    performance_timing_1.endGlobalMeasure(performance_timing_1.GlobalMeasurementPhase.REHYDRATE);
}
function runConnectedCallback(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { state } = vm;
    if (state === VMState.connected) {
        return; // nothing to do since it was already connected
    }
    vm.state = VMState.connected;
    // reporting connection
    const { connected } = services_1.Services;
    if (connected) {
        services_1.invokeServiceHook(vm, connected);
    }
    const { connectedCallback } = vm.def;
    if (!language_1.isUndefined(connectedCallback)) {
        if (undefined !== 'production') {
            performance_timing_1.startMeasure('connectedCallback', vm);
        }
        invoker_1.invokeComponentCallback(vm, connectedCallback);
        if (undefined !== 'production') {
            performance_timing_1.endMeasure('connectedCallback', vm);
        }
    }
}
function runDisconnectedCallback(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.isTrue(vm.state !== VMState.disconnected, `${vm} must be inserted.`);
    }
    if (language_1.isFalse(vm.isDirty)) {
        // this guarantees that if the component is reused/reinserted,
        // it will be re-rendered because we are disconnecting the reactivity
        // linking, so mutations are not automatically reflected on the state
        // of disconnected components.
        component_1.markComponentAsDirty(vm);
    }
    component_1.clearReactiveListeners(vm);
    vm.state = VMState.disconnected;
    // reporting disconnection
    const { disconnected } = services_1.Services;
    if (disconnected) {
        services_1.invokeServiceHook(vm, disconnected);
    }
    const { disconnectedCallback } = vm.def;
    if (!language_1.isUndefined(disconnectedCallback)) {
        if (undefined !== 'production') {
            performance_timing_1.startMeasure('disconnectedCallback', vm);
        }
        invoker_1.invokeComponentCallback(vm, disconnectedCallback);
        if (undefined !== 'production') {
            performance_timing_1.endMeasure('disconnectedCallback', vm);
        }
    }
}
function runShadowChildNodesDisconnectedCallback(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { velements: vCustomElementCollection } = vm;
    // reporting disconnection for every child in inverse order since they are inserted in reserved order
    for (let i = vCustomElementCollection.length - 1; i >= 0; i -= 1) {
        const elm = vCustomElementCollection[i].elm;
        // There are two cases where the element could be undefined:
        // * when there is an error during the construction phase, and an
        //   error boundary picks it, there is a possibility that the VCustomElement
        //   is not properly initialized, and therefore is should be ignored.
        // * when slotted custom element is not used by the element where it is slotted
        //   into it, as a result, the custom element was never initialized.
        if (!language_1.isUndefined(elm)) {
            const childVM = getCustomElementVM(elm);
            resetComponentStateWhenRemoved(childVM);
        }
    }
}
function runLightChildNodesDisconnectedCallback(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { aChildren: adoptedChildren } = vm;
    recursivelyDisconnectChildren(adoptedChildren);
}
/**
 * The recursion doesn't need to be a complete traversal of the vnode graph,
 * instead it can be partial, when a custom element vnode is found, we don't
 * need to continue into its children because by attempting to disconnect the
 * custom element itself will trigger the removal of anything slotted or anything
 * defined on its shadow.
 */
function recursivelyDisconnectChildren(vnodes) {
    for (let i = 0, len = vnodes.length; i < len; i += 1) {
        const vnode = vnodes[i];
        if (!language_1.isNull(vnode) && language_1.isArray(vnode.children) && !language_1.isUndefined(vnode.elm)) {
            // vnode is a VElement with children
            if (language_1.isUndefined(vnode.ctor)) {
                // it is a VElement, just keep looking (recursively)
                recursivelyDisconnectChildren(vnode.children);
            }
            else {
                // it is a VCustomElement, disconnect it and ignore its children
                resetComponentStateWhenRemoved(getCustomElementVM(vnode.elm));
            }
        }
    }
}
// This is a super optimized mechanism to remove the content of the shadowRoot
// without having to go into snabbdom. Especially useful when the reset is a consequence
// of an error, in which case the children VNodes might not be representing the current
// state of the DOM
function resetShadowRoot(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    vm.children = utils_1.EmptyArray;
    dom_1.ShadowRootInnerHTMLSetter.call(vm.cmpRoot, '');
    // disconnecting any known custom element inside the shadow of the this vm
    runShadowChildNodesDisconnectedCallback(vm);
}
exports.resetShadowRoot = resetShadowRoot;
function scheduleRehydration(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    if (!vm.isScheduled) {
        vm.isScheduled = true;
        if (rehydrateQueue.length === 0) {
            utils_1.addCallbackToNextTick(flushRehydrationQueue);
        }
        language_1.ArrayPush.call(rehydrateQueue, vm);
    }
}
exports.scheduleRehydration = scheduleRehydration;
function getErrorBoundaryVMFromOwnElement(vm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    const { elm } = vm;
    return getErrorBoundaryVM(elm);
}
function getErrorBoundaryVM(startingElement) {
    let elm = startingElement;
    let vm;
    while (!language_1.isNull(elm)) {
        vm = fields_1.getInternalField(elm, utils_1.ViewModelReflection);
        if (!language_1.isUndefined(vm) && !language_1.isUndefined(vm.def.errorCallback)) {
            return vm;
        }
        elm = getParentOrHostElement(elm);
    }
}
/**
 * Returns the component stack. Used for errors messages only.
 *
 * @param {Element} startingElement
 *
 * @return {string} The component stack for errors.
 */
function getErrorComponentStack(startingElement) {
    const wcStack = [];
    let elm = startingElement;
    do {
        const currentVm = fields_1.getInternalField(elm, utils_1.ViewModelReflection);
        if (!language_1.isUndefined(currentVm)) {
            const tagName = element_1.tagNameGetter.call(elm);
            const is = elm.getAttribute('is');
            language_1.ArrayPush.call(wcStack, `<${language_1.StringToLowerCase.call(tagName)}${is ? ' is="${is}' : ''}>`);
        }
        elm = getParentOrHostElement(elm);
    } while (!language_1.isNull(elm));
    return wcStack.reverse().join('\n\t');
}
exports.getErrorComponentStack = getErrorComponentStack;
/**
 * Finds the parent of the specified element. If shadow DOM is enabled, finds
 * the host of the shadow root to escape the shadow boundary.
 */
function getParentOrHostElement(elm) {
    const parentElement = node_1.parentElementGetter.call(elm);
    // If parentElement is a shadow root, find the host instead
    return language_1.isNull(parentElement) ? getHostElement(elm) : parentElement;
}
/**
 * Finds the host element, if it exists.
 */
function getHostElement(elm) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(language_1.isNull(node_1.parentElementGetter.call(elm)), `getHostElement should only be called if the parent element of ${elm} is null`);
    }
    const parentNode = node_1.parentNodeGetter.call(elm);
    return parentNode instanceof GlobalShadowRoot
        ? dom_1.ShadowRootHostGetter.call(parentNode)
        : null;
}
/**
 * EXPERIMENTAL: This function detects whether or not a Node is
 * controlled by a LWC template. This API is subject to
 * change or being removed.
 */
function isNodeFromTemplate(node) {
    if (language_1.isFalse(node instanceof Node)) {
        return false;
    }
    // TODO: #1250 - skipping the shadowRoot instances itself makes no sense, we need to revisit this with locker
    if (node instanceof GlobalShadowRoot) {
        return false;
    }
    if (utils_1.useSyntheticShadow) {
        // TODO: #1252 - old behavior that is still used by some pieces of the platform, specifically, nodes inserted
        // manually on places where `lwc:dom="manual"` directive is not used, will be considered global elements.
        if (language_1.isUndefined(node.$shadowResolver$)) {
            return false;
        }
    }
    const root = node.getRootNode();
    return root instanceof GlobalShadowRoot;
}
exports.isNodeFromTemplate = isNodeFromTemplate;
function getCustomElementVM(elm) {
    if (undefined !== 'production') {
        const vm = fields_1.getInternalField(elm, utils_1.ViewModelReflection);
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    return fields_1.getInternalField(elm, utils_1.ViewModelReflection);
}
exports.getCustomElementVM = getCustomElementVM;
function getComponentVM(component) {
    if (undefined !== 'production') {
        const vm = fields_1.getHiddenField(component, utils_1.ViewModelReflection);
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    return fields_1.getHiddenField(component, utils_1.ViewModelReflection);
}
exports.getComponentVM = getComponentVM;
function getShadowRootVM(root) {
    // TODO: #1299 - use a weak map instead of an internal field
    if (undefined !== 'production') {
        const vm = fields_1.getInternalField(root, utils_1.ViewModelReflection);
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    return fields_1.getInternalField(root, utils_1.ViewModelReflection);
}
exports.getShadowRootVM = getShadowRootVM;
// slow path routine
// NOTE: we should probably more this routine to the synthetic shadow folder
// and get the allocation to be cached by in the elm instead of in the VM
function allocateInSlot(vm, children) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        assert_1.default.invariant(language_1.isObject(vm.cmpSlots), `When doing manual allocation, there must be a cmpSlots object available.`);
    }
    const { cmpSlots: oldSlots } = vm;
    const cmpSlots = (vm.cmpSlots = language_1.create(null));
    for (let i = 0, len = children.length; i < len; i += 1) {
        const vnode = children[i];
        if (language_1.isNull(vnode)) {
            continue;
        }
        const { data } = vnode;
        const slotName = ((data.attrs && data.attrs.slot) || '');
        const vnodes = (cmpSlots[slotName] = cmpSlots[slotName] || []);
        // re-keying the vnodes is necessary to avoid conflicts with default content for the slot
        // which might have similar keys. Each vnode will always have a key that
        // starts with a numeric character from compiler. In this case, we add a unique
        // notation for slotted vnodes keys, e.g.: `@foo:1:1`
        vnode.key = `@${slotName}:${vnode.key}`;
        language_1.ArrayPush.call(vnodes, vnode);
    }
    if (language_1.isFalse(vm.isDirty)) {
        // We need to determine if the old allocation is really different from the new one
        // and mark the vm as dirty
        const oldKeys = language_1.keys(oldSlots);
        if (oldKeys.length !== language_1.keys(cmpSlots).length) {
            component_1.markComponentAsDirty(vm);
            return;
        }
        for (let i = 0, len = oldKeys.length; i < len; i += 1) {
            const key = oldKeys[i];
            if (language_1.isUndefined(cmpSlots[key]) || oldSlots[key].length !== cmpSlots[key].length) {
                component_1.markComponentAsDirty(vm);
                return;
            }
            const oldVNodes = oldSlots[key];
            const vnodes = cmpSlots[key];
            for (let j = 0, a = cmpSlots[key].length; j < a; j += 1) {
                if (oldVNodes[j] !== vnodes[j]) {
                    component_1.markComponentAsDirty(vm);
                    return;
                }
            }
        }
    }
}
exports.allocateInSlot = allocateInSlot;
function runWithBoundaryProtection(vm, owner, pre, job, post) {
    if (undefined !== 'production') {
        assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }
    let error;
    pre();
    try {
        job();
    }
    catch (e) {
        error = Object(e);
    }
    finally {
        post();
        if (!language_1.isUndefined(error)) {
            error.wcStack = error.wcStack || getErrorComponentStack(vm.elm);
            const errorBoundaryVm = language_1.isNull(owner)
                ? undefined
                : getErrorBoundaryVMFromOwnElement(owner);
            if (language_1.isUndefined(errorBoundaryVm)) {
                throw error; // eslint-disable-line no-unsafe-finally
            }
            resetShadowRoot(vm); // remove offenders
            if (undefined !== 'production') {
                performance_timing_1.startMeasure('errorCallback', errorBoundaryVm);
            }
            // error boundaries must have an ErrorCallback
            const errorCallback = errorBoundaryVm.def.errorCallback;
            invoker_1.invokeComponentCallback(errorBoundaryVm, errorCallback, [error, error.wcStack]);
            if (undefined !== 'production') {
                performance_timing_1.endMeasure('errorCallback', errorBoundaryVm);
            }
        }
    }
}
exports.runWithBoundaryProtection = runWithBoundaryProtection;
//# sourceMappingURL=vm.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/watcher.js":
/*!***********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/watcher.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const assert_1 = __importDefault(__webpack_require__(/*! ../shared/assert */ "./node_modules/@lwc/engine/lib/shared/assert.js"));
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const TargetToReactiveRecordMap = new WeakMap();
function notifyMutation(target, key) {
    if (undefined !== 'production') {
        assert_1.default.invariant(!invoker_1.isRendering, `Mutating property ${language_1.toString(key)} of ${language_1.toString(target)} is not allowed during the rendering life-cycle of ${invoker_1.vmBeingRendered}.`);
    }
    const reactiveRecord = TargetToReactiveRecordMap.get(target);
    if (!language_1.isUndefined(reactiveRecord)) {
        const value = reactiveRecord[key];
        if (value) {
            const len = value.length;
            for (let i = 0; i < len; i += 1) {
                const vm = value[i];
                if (undefined !== 'production') {
                    assert_1.default.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
                }
                if (language_1.isFalse(vm.isDirty)) {
                    component_1.markComponentAsDirty(vm);
                    vm_1.scheduleRehydration(vm);
                }
            }
        }
    }
}
exports.notifyMutation = notifyMutation;
function observeMutation(target, key) {
    if (language_1.isNull(invoker_1.vmBeingRendered)) {
        return; // nothing to subscribe to
    }
    const vm = invoker_1.vmBeingRendered;
    let reactiveRecord = TargetToReactiveRecordMap.get(target);
    if (language_1.isUndefined(reactiveRecord)) {
        const newRecord = language_1.create(null);
        reactiveRecord = newRecord;
        TargetToReactiveRecordMap.set(target, newRecord);
    }
    let value = reactiveRecord[key];
    if (language_1.isUndefined(value)) {
        value = [];
        reactiveRecord[key] = value;
    }
    else if (value[0] === vm) {
        return; // perf optimization considering that most subscriptions will come from the same vm
    }
    if (language_1.ArrayIndexOf.call(value, vm) === -1) {
        language_1.ArrayPush.call(value, vm);
        // we keep track of the sets that vm is listening from to be able to do some clean up later on
        language_1.ArrayPush.call(vm.deps, value);
    }
}
exports.observeMutation = observeMutation;
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const component_1 = __webpack_require__(/*! ./component */ "./node_modules/@lwc/engine/lib/framework/component.js");
const invoker_1 = __webpack_require__(/*! ./invoker */ "./node_modules/@lwc/engine/lib/framework/invoker.js");
//# sourceMappingURL=watcher.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/framework/wc.js":
/*!******************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/framework/wc.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const language_1 = __webpack_require__(/*! ../shared/language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const vm_1 = __webpack_require__(/*! ./vm */ "./node_modules/@lwc/engine/lib/framework/vm.js");
const utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/@lwc/engine/lib/framework/utils.js");
const def_1 = __webpack_require__(/*! ./def */ "./node_modules/@lwc/engine/lib/framework/def.js");
const attributes_1 = __webpack_require__(/*! ./attributes */ "./node_modules/@lwc/engine/lib/framework/attributes.js");
const patch_1 = __webpack_require__(/*! ./patch */ "./node_modules/@lwc/engine/lib/framework/patch.js");
const restrictions_1 = __webpack_require__(/*! ./restrictions */ "./node_modules/@lwc/engine/lib/framework/restrictions.js");
/**
 * This function builds a Web Component class from a LWC constructor
 * so it can be registered as a new element via customElements.define()
 * at any given time. E.g.:
 *
 *      import { buildCustomElementConstructor } from 'lwc';
 *      import Foo from 'ns/foo';
 *      const WC = buildCustomElementConstructor(Foo);
 *      customElements.define('x-foo', Foo);
 *      const elm = document.createElement('x-foo');
 *
 */
function buildCustomElementConstructor(Ctor, options) {
    var _a;
    const { props, bridge: BaseElement } = def_1.getComponentDef(Ctor);
    const normalizedOptions = {
        mode: 'open',
        isRoot: true,
        owner: null,
    };
    if (language_1.isObject(options) && !language_1.isNull(options)) {
        const { mode } = options;
        // TODO: #1300 - use a default value of 'closed'
        if (mode === 'closed') {
            normalizedOptions.mode = mode;
        }
    }
    return _a = class extends BaseElement {
            constructor() {
                super();
                if (language_1.isTrue(utils_1.useSyntheticShadow)) {
                    const def = def_1.getComponentDef(Ctor);
                    patch_1.patchCustomElementProto(this, {
                        def,
                    });
                }
                vm_1.createVM(this, Ctor, normalizedOptions);
                if (undefined !== 'production') {
                    restrictions_1.patchCustomElementWithRestrictions(this, utils_1.EmptyObject);
                }
            }
            connectedCallback() {
                const vm = vm_1.getCustomElementVM(this);
                vm_1.appendRootVM(vm);
            }
            disconnectedCallback() {
                const vm = vm_1.getCustomElementVM(this);
                vm_1.removeRootVM(vm);
            }
            attributeChangedCallback(attrName, oldValue, newValue) {
                if (oldValue === newValue) {
                    // ignoring similar values for better perf
                    return;
                }
                const propName = attributes_1.getPropNameFromAttrName(attrName);
                if (language_1.isUndefined(props[propName])) {
                    // ignoring unknown attributes
                    return;
                }
                if (!attributes_1.isAttributeLocked(this, attrName)) {
                    // ignoring changes triggered by the engine itself during:
                    // * diffing when public props are attempting to reflect to the DOM
                    // * component via `this.setAttribute()`, should never update the prop.
                    // Both cases, the the setAttribute call is always wrap by the unlocking
                    // of the attribute to be changed
                    return;
                }
                // reflect attribute change to the corresponding props when changed
                // from outside.
                this[propName] = newValue;
            }
        },
        // collecting all attribute names from all public props to apply
        // the reflection from attributes to props via attributeChangedCallback.
        _a.observedAttributes = language_1.ArrayMap.call(language_1.getOwnPropertyNames(props), propName => props[propName].attr),
        _a;
}
exports.buildCustomElementConstructor = buildCustomElementConstructor;
//# sourceMappingURL=wc.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/detect.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/polyfills/aria-properties/detect.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function detect(propName) {
    return Object.getOwnPropertyDescriptor(Element.prototype, propName) === undefined;
}
exports.detect = detect;
//# sourceMappingURL=detect.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/main.js":
/*!************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/polyfills/aria-properties/main.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const detect_1 = __webpack_require__(/*! ./detect */ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/detect.js");
const polyfill_1 = __webpack_require__(/*! ./polyfill */ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/polyfill.js");
// Global Aria and Role Properties derived from ARIA and Role Attributes.
// https://wicg.github.io/aom/spec/aria-reflection.html
exports.ElementPrototypeAriaPropertyNames = [
    'ariaAutoComplete',
    'ariaChecked',
    'ariaCurrent',
    'ariaDisabled',
    'ariaExpanded',
    'ariaHasPopup',
    'ariaHidden',
    'ariaInvalid',
    'ariaLabel',
    'ariaLevel',
    'ariaMultiLine',
    'ariaMultiSelectable',
    'ariaOrientation',
    'ariaPressed',
    'ariaReadOnly',
    'ariaRequired',
    'ariaSelected',
    'ariaSort',
    'ariaValueMax',
    'ariaValueMin',
    'ariaValueNow',
    'ariaValueText',
    'ariaLive',
    'ariaRelevant',
    'ariaAtomic',
    'ariaBusy',
    'ariaActiveDescendant',
    'ariaControls',
    'ariaDescribedBy',
    'ariaFlowTo',
    'ariaLabelledBy',
    'ariaOwns',
    'ariaPosInSet',
    'ariaSetSize',
    'ariaColCount',
    'ariaColIndex',
    'ariaDetails',
    'ariaErrorMessage',
    'ariaKeyShortcuts',
    'ariaModal',
    'ariaPlaceholder',
    'ariaRoleDescription',
    'ariaRowCount',
    'ariaRowIndex',
    'ariaRowSpan',
    'ariaColSpan',
    'role',
];
/**
 * Note: Attributes aria-dropeffect and aria-grabbed were deprecated in
 * ARIA 1.1 and do not have corresponding IDL attributes.
 */
for (let i = 0, len = exports.ElementPrototypeAriaPropertyNames.length; i < len; i += 1) {
    const propName = exports.ElementPrototypeAriaPropertyNames[i];
    if (detect_1.detect(propName)) {
        polyfill_1.patch(propName);
    }
}
//# sourceMappingURL=main.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/polyfills/aria-properties/polyfill.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/polyfills/aria-properties/polyfill.js ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const element_1 = __webpack_require__(/*! ../../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
// this regular expression is used to transform aria props into aria attributes because
// that doesn't follow the regular transformation process. e.g.: `aria-labeledby` <=> `ariaLabelBy`
const ARIA_REGEX = /^aria/;
const nodeToAriaPropertyValuesMap = new WeakMap();
const { hasOwnProperty } = Object.prototype;
const { replace: StringReplace, toLowerCase: StringToLowerCase } = String.prototype;
function getAriaPropertyMap(elm) {
    let map = nodeToAriaPropertyValuesMap.get(elm);
    if (map === undefined) {
        map = {};
        nodeToAriaPropertyValuesMap.set(elm, map);
    }
    return map;
}
function getNormalizedAriaPropertyValue(value) {
    return value == null ? null : value + '';
}
function createAriaPropertyPropertyDescriptor(propName, attrName) {
    return {
        get() {
            const map = getAriaPropertyMap(this);
            if (hasOwnProperty.call(map, propName)) {
                return map[propName];
            }
            // otherwise just reflect what's in the attribute
            return element_1.hasAttribute.call(this, attrName) ? element_1.getAttribute.call(this, attrName) : null;
        },
        set(newValue) {
            const normalizedValue = getNormalizedAriaPropertyValue(newValue);
            const map = getAriaPropertyMap(this);
            map[propName] = normalizedValue;
            // reflect into the corresponding attribute
            if (newValue === null) {
                element_1.removeAttribute.call(this, attrName);
            }
            else {
                element_1.setAttribute.call(this, attrName, newValue);
            }
        },
        configurable: true,
        enumerable: true,
    };
}
function patch(propName) {
    // Typescript is inferring the wrong function type for this particular
    // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
    // @ts-ignore type-mismatch
    const replaced = StringReplace.call(propName, ARIA_REGEX, 'aria-');
    const attrName = StringToLowerCase.call(replaced);
    const descriptor = createAriaPropertyPropertyDescriptor(propName, attrName);
    Object.defineProperty(Element.prototype, propName, descriptor);
}
exports.patch = patch;
//# sourceMappingURL=polyfill.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/polyfills/proxy-concat/detect.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/polyfills/proxy-concat/detect.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function detect() {
    // Don't apply polyfill when ProxyCompat is enabled.
    if ('getKey' in Proxy) {
        return false;
    }
    const proxy = new Proxy([3, 4], {});
    const res = [1, 2].concat(proxy);
    return res.length !== 4;
}
exports.default = detect;
//# sourceMappingURL=detect.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/polyfills/proxy-concat/main.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/polyfills/proxy-concat/main.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const detect_1 = __importDefault(__webpack_require__(/*! ./detect */ "./node_modules/@lwc/engine/lib/polyfills/proxy-concat/detect.js"));
const polyfill_1 = __importDefault(__webpack_require__(/*! ./polyfill */ "./node_modules/@lwc/engine/lib/polyfills/proxy-concat/polyfill.js"));
if (detect_1.default()) {
    polyfill_1.default();
}
//# sourceMappingURL=main.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/polyfills/proxy-concat/polyfill.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/polyfills/proxy-concat/polyfill.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const { isConcatSpreadable } = Symbol;
const { isArray } = Array;
const { slice: ArraySlice, unshift: ArrayUnshift, shift: ArrayShift } = Array.prototype;
function isObject(O) {
    return typeof O === 'object' ? O !== null : typeof O === 'function';
}
// https://www.ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable
function isSpreadable(O) {
    if (!isObject(O)) {
        return false;
    }
    const spreadable = O[isConcatSpreadable];
    return spreadable !== undefined ? Boolean(spreadable) : isArray(O);
}
// https://www.ecma-international.org/ecma-262/6.0/#sec-array.prototype.concat
function ArrayConcatPolyfill(..._args) {
    const O = Object(this);
    const A = [];
    let N = 0;
    const items = ArraySlice.call(arguments);
    ArrayUnshift.call(items, O);
    while (items.length) {
        const E = ArrayShift.call(items);
        if (isSpreadable(E)) {
            let k = 0;
            const length = E.length;
            for (k; k < length; k += 1, N += 1) {
                if (k in E) {
                    const subElement = E[k];
                    A[N] = subElement;
                }
            }
        }
        else {
            A[N] = E;
            N += 1;
        }
    }
    return A;
}
function apply() {
    Array.prototype.concat = ArrayConcatPolyfill;
}
exports.default = apply;
//# sourceMappingURL=polyfill.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/shared/assert.js":
/*!*******************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/shared/assert.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ./language */ "./node_modules/@lwc/engine/lib/shared/language.js");
const element_1 = __webpack_require__(/*! ../env/element */ "./node_modules/@lwc/engine/lib/env/element.js");
const node_1 = __webpack_require__(/*! ../env/node */ "./node_modules/@lwc/engine/lib/env/node.js");
const dom_1 = __webpack_require__(/*! ../env/dom */ "./node_modules/@lwc/engine/lib/env/dom.js");
function isLWC(element) {
    return element instanceof Element && element_1.tagNameGetter.call(element).indexOf('-') !== -1;
}
function isShadowRoot(elmOrShadow) {
    return !(elmOrShadow instanceof Element) && 'host' in elmOrShadow;
}
function getFormattedComponentStack(elm) {
    const componentStack = [];
    const indentationChar = '\t';
    let indentation = '';
    let currentElement = elm;
    do {
        if (isLWC(currentElement)) {
            language_1.ArrayPush.call(componentStack, `${indentation}<${language_1.StringToLowerCase.call(element_1.tagNameGetter.call(currentElement))}>`);
            indentation = indentation + indentationChar;
        }
        if (isShadowRoot(currentElement)) {
            // if at some point we find a ShadowRoot, it must be a native shadow root.
            currentElement = dom_1.ShadowRootHostGetter.call(currentElement);
        }
        else {
            currentElement = node_1.parentNodeGetter.call(currentElement);
        }
    } while (!language_1.isNull(currentElement));
    return language_1.ArrayJoin.call(componentStack, '\n');
}
const assert = {
    invariant(value, msg) {
        if (!value) {
            throw new Error(`Invariant Violation: ${msg}`);
        }
    },
    isTrue(value, msg) {
        if (!value) {
            throw new Error(`Assert Violation: ${msg}`);
        }
    },
    isFalse(value, msg) {
        if (value) {
            throw new Error(`Assert Violation: ${msg}`);
        }
    },
    fail(msg) {
        throw new Error(msg);
    },
    logError(message, elm) {
        let msg = `[LWC error]: ${message}`;
        if (elm) {
            msg = `${msg}\n${getFormattedComponentStack(elm)}`;
        }
        if (undefined === 'test') {
            /* eslint-disable-next-line no-console */
            console.error(msg);
            return;
        }
        try {
            throw new Error(msg);
        }
        catch (e) {
            /* eslint-disable-next-line no-console */
            console.error(e);
        }
    },
};
exports.default = assert;
//# sourceMappingURL=assert.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/shared/fields.js":
/*!*******************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/shared/fields.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const language_1 = __webpack_require__(/*! ./language */ "./node_modules/@lwc/engine/lib/shared/language.js");
/**
 * In IE11, symbols are expensive.
 * Due to the nature of the symbol polyfill. This method abstract the
 * creation of symbols, so we can fallback to string when native symbols
 * are not supported. Note that we can't use typeof since it will fail when transpiling.
 */
const hasNativeSymbolsSupport = Symbol('x').toString() === 'Symbol(x)';
function createFieldName(key) {
    // @ts-ignore: using a string as a symbol for perf reasons
    return hasNativeSymbolsSupport ? Symbol(key) : `$$lwc-${key}$$`;
}
exports.createFieldName = createFieldName;
function setInternalField(o, fieldName, value) {
    // TODO: #1299 - use a weak map instead
    language_1.defineProperty(o, fieldName, {
        value,
    });
}
exports.setInternalField = setInternalField;
function getInternalField(o, fieldName) {
    return o[fieldName];
}
exports.getInternalField = getInternalField;
/**
 * Store fields that should be hidden from outside world
 * hiddenFieldsMap is a WeakMap.
 * It stores a hash of any given objects associative relationships.
 * The hash uses the fieldName as the key, the value represents the other end of the association.
 *
 * For example, if the association is
 *              ViewModel
 * Component-A --------------> VM-1
 * then,
 * hiddenFieldsMap : (Component-A, { Symbol(ViewModel) : VM-1 })
 *
 */
const hiddenFieldsMap = new WeakMap();
exports.setHiddenField = hasNativeSymbolsSupport
    ? (o, fieldName, value) => {
        let valuesByField = hiddenFieldsMap.get(o);
        if (language_1.isUndefined(valuesByField)) {
            valuesByField = language_1.create(null);
            hiddenFieldsMap.set(o, valuesByField);
        }
        valuesByField[fieldName] = value;
    }
    : setInternalField; // Fall back to symbol based approach in compat mode
exports.getHiddenField = hasNativeSymbolsSupport
    ? (o, fieldName) => {
        const valuesByField = hiddenFieldsMap.get(o);
        return !language_1.isUndefined(valuesByField) && valuesByField[fieldName];
    }
    : getInternalField; // Fall back to symbol based approach in compat mode
//# sourceMappingURL=fields.js.map

/***/ }),

/***/ "./node_modules/@lwc/engine/lib/shared/language.js":
/*!*********************************************************!*\
  !*** ./node_modules/@lwc/engine/lib/shared/language.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const { freeze, seal, keys, create, assign, defineProperty, getPrototypeOf, setPrototypeOf, getOwnPropertyDescriptor, getOwnPropertyNames, defineProperties, hasOwnProperty, } = Object;
exports.freeze = freeze;
exports.seal = seal;
exports.keys = keys;
exports.create = create;
exports.assign = assign;
exports.defineProperty = defineProperty;
exports.getPrototypeOf = getPrototypeOf;
exports.setPrototypeOf = setPrototypeOf;
exports.getOwnPropertyDescriptor = getOwnPropertyDescriptor;
exports.getOwnPropertyNames = getOwnPropertyNames;
exports.defineProperties = defineProperties;
exports.hasOwnProperty = hasOwnProperty;
const { isArray } = Array;
exports.isArray = isArray;
const { slice: ArraySlice, splice: ArraySplice, unshift: ArrayUnshift, indexOf: ArrayIndexOf, push: ArrayPush, map: ArrayMap, join: ArrayJoin, forEach, reduce: ArrayReduce, } = Array.prototype;
exports.ArraySlice = ArraySlice;
exports.ArraySplice = ArraySplice;
exports.ArrayUnshift = ArrayUnshift;
exports.ArrayIndexOf = ArrayIndexOf;
exports.ArrayPush = ArrayPush;
exports.ArrayMap = ArrayMap;
exports.ArrayJoin = ArrayJoin;
exports.forEach = forEach;
exports.ArrayReduce = ArrayReduce;
const { replace: StringReplace, toLowerCase: StringToLowerCase, charCodeAt: StringCharCodeAt, slice: StringSlice, } = String.prototype;
exports.StringReplace = StringReplace;
exports.StringToLowerCase = StringToLowerCase;
exports.StringCharCodeAt = StringCharCodeAt;
exports.StringSlice = StringSlice;
function isUndefined(obj) {
    return obj === undefined;
}
exports.isUndefined = isUndefined;
function isNull(obj) {
    return obj === null;
}
exports.isNull = isNull;
function isTrue(obj) {
    return obj === true;
}
exports.isTrue = isTrue;
function isFalse(obj) {
    return obj === false;
}
exports.isFalse = isFalse;
function isFunction(obj) {
    return typeof obj === 'function';
}
exports.isFunction = isFunction;
function isObject(obj) {
    return typeof obj === 'object';
}
exports.isObject = isObject;
function isString(obj) {
    return typeof obj === 'string';
}
exports.isString = isString;
function isNumber(obj) {
    return typeof obj === 'number';
}
exports.isNumber = isNumber;
const OtS = {}.toString;
function toString(obj) {
    if (obj && obj.toString) {
        // Arrays might hold objects with "null" prototype
        // So using Array.prototype.toString directly will cause an error
        // Iterate through all the items and handle individually.
        if (isArray(obj)) {
            return ArrayJoin.call(ArrayMap.call(obj, toString), ',');
        }
        return obj.toString();
    }
    else if (typeof obj === 'object') {
        return OtS.call(obj);
    }
    else {
        return obj + exports.emptyString;
    }
}
exports.toString = toString;
function getPropertyDescriptor(o, p) {
    do {
        const d = getOwnPropertyDescriptor(o, p);
        if (!isUndefined(d)) {
            return d;
        }
        o = getPrototypeOf(o);
    } while (o !== null);
}
exports.getPropertyDescriptor = getPropertyDescriptor;
exports.emptyString = '';
//# sourceMappingURL=language.js.map

/***/ })

}]);
//# sourceMappingURL=lwc~main.app.js.map