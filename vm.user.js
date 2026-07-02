// ==UserScript==
// @name         Tipsguru Blank + Timer Redirect
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Clears page, shows timer, then redirects
// @match        https://tipsguru.in/*
// @match        http://tipsguru.in/*
// @grant        none
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/573176/Tipsguru%20Blank%20%2B%20Timer%20Redirect.user.js
// @updateURL https://update.greasyfork.org/scripts/573176/Tipsguru%20Blank%20%2B%20Timer%20Redirect.meta.js
// ==/UserScript==

(function() {
    'use strict';

    let timeLeft = 240; // seconds

    // Wait until DOM is ready, then replace everything
    window.addEventListener('DOMContentLoaded', () => {

        // Clear entire page
        document.documentElement.innerHTML = "";

        // Create clean HTML
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.alignItems = "center";
        wrapper.style.height = "100vh";
        wrapper.style.background = "#0f0f0f";
        wrapper.style.color = "#fff";
        wrapper.style.fontFamily = "Arial, sans-serif";
        wrapper.style.flexDirection = "column";

        const title = document.createElement("h1");
        title.innerText = "Please Wait...";
        title.style.marginBottom = "10px";

        const timer = document.createElement("div");
        timer.style.fontSize = "28px";
        timer.style.fontWeight = "bold";

        wrapper.appendChild(title);
        wrapper.appendChild(timer);
        document.body.appendChild(wrapper);

        // Countdown logic
        const interval = setInterval(() => {
            timer.innerText = `Redirecting in ${timeLeft}s`;
            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(interval);
                window.location.href = "https://rarestudy.in/keyloginsuccess";
            }
        }, 1000);

    });

})();
