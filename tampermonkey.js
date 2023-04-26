// ==UserScript==
// @name         laf-func-sync
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  管理Laf云函数的本地缓存
// @author       一只蟹酱
// @match        https://laf.run/*
// @match        https://laf.dev/*
// @icon         https://ddb9jl-laf-func-sync.site.laf.run/laf-logo.png
// @license      MIT
// ==/UserScript==

/**
 * @license
 * Vue.js v2.7.14
 * (c) 2014-2022 Evan You
 * Released under the MIT License.
 */
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

;(function () {
  'use strict';
  // var serve = 'http://localhost:8080/'
  var serve = 'https://ddb9jl-laf-func-sync.site.laf.run/'
  if (location.href === serve) return
  var script = document.createElement('script')
  script.src = `${serve}app.bundle.js`
  document.body.appendChild(script)
})()
