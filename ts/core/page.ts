/**
 * @file Handle page hash
 * @name page.ts
 * @license MIT
 */

// <3 https://github.com/0aoq/nbin/blob/master/public/shared/lib/core/page.ts

export let storedHash = ""; // previous hash
export let searchParams = new URLSearchParams(window.location.search);

/**
 * @function handleHash
 * @returns {void}
 */
const handleHash = () => {
    const h = window.location.hash.slice(2).split("%")[0];
    if (storedHash === h) return;

    // hide old page
    if (document.getElementById(`page/${storedHash}`)) {
        document.getElementById(`page/${storedHash}`)!.style.display = "none";
    }

    // update hash
    storedHash = h;

    // show new page
    if (document.getElementById(`page/${h}`)) {
        document.getElementById(`page/${h}`)!.style.display = "block";
    }
};

// add event
window.addEventListener("hashchange", handleHash);

// initial call
handleHash();
