const userSetting = localStorage.getItem('theme') || '{{ .Site.Params.defaultTheme }}' || 'auto';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const actualTheme = userSetting === 'auto' ? (systemDark ? 'dark' : 'light') : userSetting;

document.documentElement.setAttribute('data-theme', actualTheme);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentSetting = localStorage.getItem('theme') || '{{ .Site.Params.defaultTheme }}' || 'auto';
    if (currentSetting === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateThemeEffects();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    updateThemeEffects();

    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (e) => {
            e.preventDefault();
            
            const currentTheme = getCurrentTheme();
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            localStorage.setItem('theme', nextTheme);
            document.documentElement.setAttribute('data-theme', nextTheme);
            updateThemeEffects();
        });
    }
}, {once: true});

// 跨分頁同步
window.addEventListener('storage', function (event) {
    if (event.key === 'theme' && event.newValue) {
        const newTheme = event.newValue === 'auto' ? 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
            event.newValue;
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeEffects();
    }
});

function updateThemeEffects() {
    const isDark = getCurrentTheme() === 'dark';

    const themeColor = isDark ? '{{ .Site.Params.themeColorDark }}' : '{{ .Site.Params.themeColor }}';
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta && themeColor) {
        themeColorMeta.setAttribute('content', themeColor);
    }

    {{ if and .Site.Params.enableGiscus (eq hugo.Environment "production") }}
    const giscusTheme = isDark ? '{{ .Site.Params.giscusThemeDark | default "dark" }}' : '{{ .Site.Params.giscusTheme | default "light" }}';
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
        iframe.contentWindow.postMessage({
            giscus: {
                setConfig: {
                    theme: giscusTheme,
                },
            }
        }, 'https://giscus.app');
    }
    {{ end }}

    if (typeof mermaidConfig !== 'undefined') {
        const mermaids = document.querySelectorAll('.mermaid');
        mermaids.forEach(e => {
            if (e.getAttribute('data-processed')) {
                e.removeAttribute('data-processed');
                e.innerHTML = e.getAttribute('data-graph');
            } else {
                e.setAttribute('data-graph', e.textContent);
            }
        });

        mermaidConfig.theme = isDark ? '{{ .Site.Params.mermaidThemeDark | default "dark" }}' : '{{ .Site.Params.mermaidTheme | default "default" }}';
        mermaid.initialize(mermaidConfig);
        mermaid.init();
    }
}

function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
}
