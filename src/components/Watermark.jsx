import React, { useEffect } from 'react';

const Watermark = () => {
    // Base64 encoded: "Developed by Sayan Sarkar"
    const _0x1a2b = "RGV2ZWxvcGVkIGJ5IFNheWFuIFNhcmthcg==";

    useEffect(() => {
        const _0x3c4d = document.getElementById('sys-integrity-check');

        const enforceIntegrity = () => {
            const el = document.getElementById('sys-integrity-check');
            if (!el) {
                // If element is deleted, re-create it in the body naturally
                // This is a last-resort fallback if React unmounts or user deletes node
                const newEl = document.createElement('div');
                newEl.id = 'sys-integrity-check';
                newEl.innerText = atob(_0x1a2b);
                Object.assign(newEl.style, {
                    position: 'fixed',
                    bottom: '10px',
                    left: '0',
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'rgba(150, 150, 150, 0.5)',
                    pointerEvents: 'none',
                    zIndex: '2147483647',
                    userSelect: 'none',
                    fontFamily: 'monospace',
                    mixBlendMode: 'difference'
                });
                document.body.appendChild(newEl);
            } else {
                // Enforce styles and content
                if (el.innerText !== atob(_0x1a2b)) {
                    el.innerText = atob(_0x1a2b);
                }
                if (el.style.display === 'none' || el.style.visibility === 'hidden' || el.style.opacity === '0') {
                    el.style.display = 'block';
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                }
            }
        };

        // Watch for DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                enforceIntegrity();
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        // Periodic check
        const interval = setInterval(enforceIntegrity, 2000);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    return (
        <div
            id="sys-integrity-check"
            style={{
                position: 'fixed',
                bottom: '10px',
                left: '0',
                width: '100%',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                opacity: 0.5,
                pointerEvents: 'none',
                zIndex: 2147483647, // Max z-index
                userSelect: 'none',
                fontFamily: 'monospace',
                mixBlendMode: 'screen' // Makes it visible on dark/light backgrounds
            }}
        >
            {atob(_0x1a2b)}
        </div>
    );
};

export default Watermark;
