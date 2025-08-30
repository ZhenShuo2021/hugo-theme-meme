// drag and resize
document.addEventListener("DOMContentLoaded", () => {
    const tocFloating = document.querySelector(".toc-floating");
    const tocToggle = document.querySelector(".toc-fixed-display");
    const tocExpand = document.querySelector(".toc-expand");
    const tocHeader = document.querySelector(".toc-header");
    const resizeHandle = document.querySelector(".toc-resize-handle");

    if (!tocFloating) return;

    let headerPosition = { x: 0, y: 0 };
    let size = { width: 400, height: 0 };
    const defaultSize = { width: 400, height: 0 };

    initControls();

    function initControls() {
        loadState();
        bindEvents();
    }

    function bindEvents() {
        tocToggle?.addEventListener("click", handleTogglePin);
        tocExpand?.addEventListener("click", handleToggleExpand);
        document.addEventListener("keydown", handleKeydown);

        DragHandler({
            trigger: tocHeader,
            enable: () => tocFloating.classList.contains("toc-expanded"),
            onStart: (startX, startY, event) => {
                // 計算滑鼠相對於header中心的偏移量
                const headerRect = tocHeader.getBoundingClientRect();
                const headerCenterX = headerRect.left + headerRect.width / 2;
                const headerCenterY = headerRect.top + headerRect.height / 2;

                return {
                    x: event.clientX - headerCenterX,
                    y: event.clientY - headerCenterY,
                };
            },
            onMove: (newX, newY) => {
                // newX, newY 是滑鼠位置，減去偏移量得到header目標位置
                headerPosition = { x: newX, y: newY };
                applyHeaderPosition();
            },
            onEnd: () => {
                saveState();
            },
            onCursor: (active) => {
                tocHeader.style.cursor = active ? "grabbing" : "";
                document.body.style.userSelect = active ? "none" : "";
            },
        });

        ResizeHandler({
            trigger: resizeHandle,
            enable: () => tocFloating.classList.contains("toc-expanded"),
            onStart: () => {
                const rect = tocFloating.getBoundingClientRect();
                // 記錄左上角位置，用於固定左上角調整大小
                return {
                    width: rect.width,
                    height: rect.height,
                    left: rect.left,
                    top: rect.top,
                };
            },
            onResize: (newWidth, newHeight, startData) => {
                size = { width: newWidth, height: newHeight };
                applySize();

                // 固定左上角，調整header位置以保持左上角不動
                const currentRect = tocFloating.getBoundingClientRect();
                const leftOffset = startData.left - currentRect.left;
                const topOffset = startData.top - currentRect.top;

                if (leftOffset !== 0 || topOffset !== 0) {
                    const headerRect = tocHeader.getBoundingClientRect();
                    headerPosition = {
                        x: headerRect.left + headerRect.width / 2 + leftOffset,
                        y: headerRect.top + headerRect.height / 2 + topOffset,
                    };
                    applyHeaderPosition();
                }
            },
            onEnd: () => {
                saveState();
            },
            onCursor: (active) => {
                document.body.style.userSelect = active ? "none" : "";
            },
        });
    }

    function handleTogglePin() {
        tocFloating.classList.toggle("toc-pinned");
        tocToggle.classList.toggle("active");
        saveState();
    }

    function handleToggleExpand() {
        const isExpanded = tocFloating.classList.toggle("toc-expanded");
        tocExpand.classList.toggle("active");

        if (isExpanded) {
            size = { ...defaultSize };
            applySize();

            // 首次展開：讓整個容器在畫面中央，然後計算對應的header位置
            requestAnimationFrame(() => {
                // 如果沒有儲存位置，使用容器居中邏輯
                if (headerPosition.x === 0 && headerPosition.y === 0) {
                    tocFloating.style.transform = "translate(-50%, -50%)";

                    // 計算此時header的實際位置並記錄
                    requestAnimationFrame(() => {
                        const headerRect = tocHeader.getBoundingClientRect();
                        headerPosition = {
                            x: headerRect.left + headerRect.width / 2,
                            y: headerRect.top + headerRect.height / 2,
                        };
                    });
                } else {
                    // 有儲存位置，使用header定位
                    applyHeaderPosition();
                }
            });
        } else {
            resetPosition();
            resetSize();
        }
        saveState();
    }

    function handleKeydown(e) {
        if (e.key === "Escape" && tocFloating.classList.contains("toc-expanded")) {
            tocFloating.classList.remove("toc-expanded");
            tocExpand.classList.remove("active");
            resetPosition();
            resetSize();
            saveState();
        }
    }

    function resetPosition() {
        tocFloating.style.transform = "";
        headerPosition = { x: 0, y: 0 };
    }

    function resetSize() {
        tocFloating.style.width = "";
        tocFloating.style.height = "";
        tocFloating.style.maxHeight = "";
        size = { ...defaultSize };
    }

    // 定位方法始終以header為基準
    function applyHeaderPosition() {
        if (!tocFloating.classList.contains("toc-expanded")) return;

        requestAnimationFrame(() => {
            const headerRect = tocHeader.getBoundingClientRect();
            const containerRect = tocFloating.getBoundingClientRect();

            // 計算header相對於容器的位移
            const headerOffsetY = headerRect.top - containerRect.top + headerRect.height / 2;
            const headerOffsetX = headerRect.left - containerRect.left + headerRect.width / 2;

            // 計算容器需要的位移來讓header到達目標位置
            const targetContainerX = headerPosition.x - headerOffsetX;
            const targetContainerY = headerPosition.y - headerOffsetY;

            // 轉換為相對於畫面中央的偏移
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const offsetX = targetContainerX + containerRect.width / 2 - centerX;
            const offsetY = targetContainerY + containerRect.height / 2 - centerY;

            tocFloating.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
        });
    }

    function applySize() {
        if (tocFloating.classList.contains("toc-expanded")) {
            tocFloating.style.width = `${size.width}px`;
            if (size.height > 0) {
                // 用戶已調整過高度，使用固定高度
                tocFloating.style.height = `${size.height}px`;
                tocFloating.style.maxHeight = `${size.height}px`;
            } else {
                // 首次展開時設置最大高度限制
                tocFloating.style.maxHeight = "min(80vh, calc(100vh - 40px))";
            }
        }
    }

    function loadState() {
        const saved = JSON.parse(localStorage.getItem("toc-state") || "{}");

        if (saved.pinned) {
            tocFloating.classList.add("toc-pinned");
            tocToggle.classList.add("active");
        }

        if (saved.expanded) {
            headerPosition = {
                x: saved.headerX || 0,
                y: saved.headerY || 0,
            };
            size = {
                width: saved.sizeWidth || defaultSize.width,
                height: saved.sizeHeight || defaultSize.height,
            };

            tocFloating.style.visibility = "hidden";
            tocFloating.classList.add("toc-expanded");
            tocExpand.classList.add("active");

            requestAnimationFrame(() => {
                applySize();

                // 如果沒有儲存的header位置，使用容器居中
                if (headerPosition.x === 0 && headerPosition.y === 0) {
                    tocFloating.style.transform = "translate(-50%, -50%)";
                    requestAnimationFrame(() => {
                        const headerRect = tocHeader.getBoundingClientRect();
                        headerPosition = {
                            x: headerRect.left + headerRect.width / 2,
                            y: headerRect.top + headerRect.height / 2,
                        };
                    });
                } else {
                    // 有儲存位置，使用header定位
                    applyHeaderPosition();
                }

                tocFloating.style.visibility = "visible";
            });
        }
    }

    function saveState() {
        localStorage.setItem(
            "toc-state",
            JSON.stringify({
                pinned: tocFloating.classList.contains("toc-pinned"),
                expanded: tocFloating.classList.contains("toc-expanded"),
                headerX: headerPosition.x,
                headerY: headerPosition.y,
                sizeWidth: size.width,
                sizeHeight: size.height,
            }),
        );
    }
});

function DragHandler({ trigger, enable, onStart, onMove, onEnd, onCursor }) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    trigger?.addEventListener("mousedown", (e) => {
        if (e.button !== 0 || !enable()) return;

        isDragging = true;
        dragOffset = onStart?.(e.clientX, e.clientY, e) || { x: 0, y: 0 };
        onCursor?.(true);
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        // 滑鼠位置減去偏移量，得到header目標位置
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        onMove?.(newX, newY);
    });

    document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        onCursor?.(false);
        onEnd?.();
    });
}

function ResizeHandler({ trigger, enable, onStart, onResize, onEnd, onCursor }) {
    let isResizing = false;
    let startData = null;
    let startMouse = { x: 0, y: 0 };

    trigger?.addEventListener("mousedown", (e) => {
        if (e.button !== 0 || !enable()) return;

        isResizing = true;
        startData = onStart?.() || { width: 0, height: 0 };
        startMouse = { x: e.clientX, y: e.clientY };
        onCursor?.(true);
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startMouse.x;
        const deltaY = e.clientY - startMouse.y;
        const newWidth = Math.max(100, startData.width + deltaX);
        const newHeight = Math.max(100, startData.height + deltaY);

        onResize?.(newWidth, newHeight, startData);
    });

    document.addEventListener("mouseup", () => {
        if (!isResizing) return;
        isResizing = false;
        onCursor?.(false);
        onEnd?.();
    });
}

// 容器移動以外的功能，包含標籤切換和自動 highlight
document.addEventListener("DOMContentLoaded", () => {
    initSeriesTabLinks();
    initTabFromStorage();
    initScrollHighlight();

    function initSeriesTabLinks() {
        const seriesLinks = document.querySelectorAll(".series-list a[data-series-tab]");
        seriesLinks.forEach((link) => {
            link.addEventListener("click", () => {
                sessionStorage.setItem("activeTab", "series");
            });
        });
    }

    function initTabFromStorage() {
        const seriesTab = document.querySelector("#tab-series");
        const activeTab = sessionStorage.getItem("activeTab");
        if (activeTab === "series" && seriesTab) {
            seriesTab.checked = true;
            sessionStorage.removeItem("activeTab");
        }
    }

    function initScrollHighlight() {
        const tocLinks = Array.from(document.querySelectorAll(".toc-floating a[href^='#']"));
        const headings = tocLinks
            .map((link) => {
                const element = document.getElementById(link.getAttribute("href").substring(1));
                return element ? { element, link } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.element.offsetTop - b.element.offsetTop);

        if (headings.length) {
            window.addEventListener("scroll", () => updateScrollHighlight(headings, tocLinks));
        }
    }

    function updateScrollHighlight(headings, tocLinks) {
        const scrollTop = window.pageYOffset;
        const isAtBottom = scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 10;

        const current = isAtBottom
            ? headings[headings.length - 1]
            : headings.reduceRight((found, h) => found || (scrollTop >= h.element.offsetTop - 100 ? h : null), null);

        tocLinks.forEach((link) => link.classList.remove("active"));
        if (current) {
            current.link.classList.add("active");
        }
    }
});
