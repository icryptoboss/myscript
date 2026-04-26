// ==UserScript==
// @name         Rarestudy / Tipsguru Instant Redirect Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Bypass timer and redirect instantly
// @match        https://tipsguru.in/*
// @match        http://tipsguru.in/*
// @match        https://tipsguru.site/*
// @match        http://tipsguru.site/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Stop any existing timers (extra safety)
    window.setInterval = function() {};
    window.setTimeout = function() {};

    // Instant redirect
    window.location.replace("https://rarestudy.in/keyloginsuccess");

})();
