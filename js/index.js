

let ogVolume = 1;
let pbRate = 1;

function skipAdsOnSelectors(selectors, callback) {
    selectors.map(selector => { Array.from(document.body.querySelectorAll(selector)).forEach(item => callback(item)); });
}


function skipAdsOnSelectorFunc(selectorFunc, callback) {
    selectorFunc().map(selector => { Array.from(document.body.querySelectorAll(selector)).forEach(item => callback(item)); });
}

function skipAds() {
    let ad = document.getElementsByClassName("video-ads ytp-ad-module")[0];
    let vid = document.getElementsByClassName("video-stream html5-main-video")[0];

    if (ad === undefined && vid && vid.playbackRate) { pbRate = vid.playbackRate; }
    const closeBtnSelectors = [
        '[class*="ytp-ad-overlay-close-button"]',
        '[class*="ytp-ad-text ytp-ad-skip-button-text"]',
        // '[class*="yt-spec-button-shape-next yt-spec-button-shape-next--text yt-spec-button-shape-next--call-to-action"]', /* leads to https://www.google.com/get/videoqualityreport/?v=eZEczfSAjVQ */
    ];
    skipAdsOnSelectors(closeBtnSelectors, (item) => {
        console.log("Clicking on", item);
        item.click()
    });

    const sideAdSelectors = [
        '[class*="style-scope ytd-watch-next-secondary-results-renderer sparkles-light-cta GoogleActiveViewElement"]',
        '[class*="style-scope ytd-item-section-renderer sparkles-light-cta"]',
        '[class*="ytp-ad-message-container"]',
    ];
    skipAdsOnSelectors(sideAdSelectors, (item) => item.style.display = "none");

    const removeSelectors = [
        '[class*="style-scope ytd-companion-slot-renderer"]'
    ];
    skipAdsOnSelectors(removeSelectors, (item) => item.remove());

    if (ad !== undefined) {
        if (ad.children.length > 0) {
            if (document.getElementsByClassName("ytp-ad-text ytp-ad-preview-text")[0] !== undefined) {
                vid.playbackRate = 16;
                vid.muted = true;
            }
        }
    }
}

/* TODO: execute skip after navigation event */
let isBusy = false;
const m_skipAdsInterval = setInterval(() => {
    if (isBusy) return;
    isBusy = true;
    skipAds();
    isBusy = false;
}, 5000);

