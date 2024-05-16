

let ogVolume = 1;
let pbRate = 1;

class OnMatch {
    constructor(matchFunc, actionFunc, descption=null) {
        this._match = matchFunc;
        this._action = actionFunc;
        this._description = descption;
    }
    
    on(item) {
        if (this._match(item)) {
            this._action(item);
            return true;
        }
        return false;
    }
}

const traverser = (function() {
    function toAttribName (name) {
        return "__traverser_" + name; 
    }

    function getAttribute(item, name) {
        return item[toAttribName(name)];
    }

    function setAttribute(item, name, value) {
        item[toAttribName(name)] = value;
        return item;
    }

    function traverse(root, callback, context) {
        root = callback(root)
        if (getAttribute(root, "skip") === true) return;
    
        if (root && "children" in root) { 
            for(const child of root.children) {
                traverse(child, callback, context);
            }    
        }
    }

    return {'traverse': traverse, setAttribute: setAttribute};
})();


function classContainsAnyOf(item, anys) {
    try
    {
        if (item.hasAttribute('class')) {
            let c = item.getAttribute('class');
            if (c === null || c === undefined) return false;
            return anys.find(p => c.includes(p));
        }
    } catch (e) {
        console.log(item, e);
        return false;
    }

}

const actions = [
    new OnMatch(
        (item) => {
            return classContainsAnyOf(item, ['ytp-ad-overlay-close-button', 'ytp-ad-text ytp-ad-skip-button-text', 'ytp-skip-ad-button']);
        }, 
        (item) => {
            item.click();
            traverser.setAttribute(item, 'skip', true);
        },
        "ytp-ad-skip-button-text"
    ),
    new OnMatch(
        (item) => {
            return classContainsAnyOf(item, [
                "style-scope ytd-watch-next-secondary-results-renderer sparkles-light-cta GoogleActiveViewElement",
                "style-scope ytd-item-section-renderer sparkles-light-cta",
                "ytp-ad-message-container"
            ]);
        }, 
        (item) => {
            item.style.display = "none";
            traverser.setAttribute(item, 'skip', true);
        },
        'ytp-ad-message-container'
    ),
    new OnMatch(
        (item) => {
            return item.tagName.toLowerCase() === "yt-confirm-dialog-renderer";
        }, 
        (item) => {
            traverser.setAttribute(item, 'skip', true);
            item.querySelector('button[aria-label="Yes"]').click();
        },
        "ClickOnVideoPaused"
    ),
    new OnMatch(
        (item) => {
            return classContainsAnyOf(item, [
                "style-scope ytd-companion-slot-renderer",
            ]) && item.hasAttribute("label") && item.getAttribute("label").toLowerCase() === "yes";
        }, 
        (item) => {
            item.remove();
            traverser.setAttribute(item, 'skip', true);
        },
        'style-scope ytd-companion-slot-renderer'
    ),
];

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

    if (ad !== undefined) {
        if (ad.children.length > 0) {
            if (document.getElementsByClassName("ytp-ad-text ytp-ad-preview-text")[0] !== undefined) {
                vid.playbackRate = 16;
                vid.muted = true;
            }

            // const skipAdButton = document.getElementsByClassName('ytp-skip-ad-button')[0];
            // if (skipAdButton) {
            //     skipAdButton.click();
            // }
        }
    }

    if (ad !== undefined || document.getElementsByName('yt-confirm-dialog-renderer')) {
        traverser.traverse(document.body, (item) => {
            for(const action of actions) {
                if (action.on(item)) break;
            }
            return item;
        });
    }
}

/* TODO: execute skip after navigation event */
let isBusy = false;
const m_skipAdsInterval = setInterval(() => {
    if (isBusy) return;
    isBusy = true;
    skipAds();
    isBusy = false;
}, 3000);


document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                for(const child of mutation.addedNodes) {
                    traverser.traverse(child, (item) => {
                        for(const action of actions) {
                            if (action.on(item)) break;
                        }
                        return item;
                    });
                }
            } else if (mutation.type === "attributes") {
                // console.log(`The ${mutation.attributeName} attribute was modified.`);
            }
        }
    });

    observer.observe(window.document.body, { attributes: false, childList: true, subtree: true }); 
});
