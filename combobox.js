const ctrlBindings = !!navigator.userAgent.match(/Macintosh/);
export default class Combobox {
    constructor(input, list) {
        this.input = input;
        this.list = list;
        this.isComposing = false;
        if (!list.id) {
            list.id = `combobox-${Math.random()
                .toString()
                .slice(2, 6)}`;
        }
        this.keyboardEventHandler = event => keyboardBindings(event, this);
        this.compositionEventHandler = event => trackComposition(event, this);
        this.inputHandler = this.clearSelection.bind(this);
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-controls', list.id);
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
    }
    destroy() {
        this.clearSelection();
        this.stop();
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-controls');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-haspopup');
    }
    start() {
        this.input.setAttribute('aria-expanded', 'true');
        this.input.addEventListener('compositionstart', this.compositionEventHandler);
        this.input.addEventListener('compositionend', this.compositionEventHandler);
        this.input.addEventListener('input', this.inputHandler);
        this.input.addEventListener('keydown', this.keyboardEventHandler);
        this.list.addEventListener('click', commitWithElement);
    }
    stop() {
        this.clearSelection();
        this.input.setAttribute('aria-expanded', 'false');
        this.input.removeEventListener('compositionstart', this.compositionEventHandler);
        this.input.removeEventListener('compositionend', this.compositionEventHandler);
        this.input.removeEventListener('input', this.inputHandler);
        this.input.removeEventListener('keydown', this.keyboardEventHandler);
        this.list.removeEventListener('click', commitWithElement);
    }
    navigate(indexDiff = 1) {
        const focusElId = this.input.getAttribute('aria-activedescendant');
        const focusEl = Array.from([document.querySelector(`#${focusElId}`)]).filter(visible)[0];
        const els = Array.from(this.list.querySelectorAll('[role="option"]')).filter(visible);
        const focusIndex = els.indexOf(focusEl);
        if ((focusIndex === els.length - 1 && indexDiff === 1) || (focusIndex === 0 && indexDiff === -1)) {
            this.clearSelection();
            this.input.focus();
            return;
        }
        let indexOfItem = indexDiff === 1 ? 0 : els.length - 1;
        if (focusEl && focusIndex >= 0) {
            const newIndex = focusIndex + indexDiff;
            if (newIndex >= 0 && newIndex < els.length)
                indexOfItem = newIndex;
        }
        const target = els[indexOfItem];
        if (!target)
            return;
        for (const el of els) {
            if (target === el) {
                this.input.setAttribute('aria-activedescendant', target.id);
                scrollTo(this.list, target);
            }
        }
    }
    clearSelection() {
        this.input.removeAttribute('aria-activedescendant');
    }
}
function keyboardBindings(event, combobox) {
    if (event.shiftKey || event.metaKey || event.altKey)
        return;
    if (!ctrlBindings && event.ctrlKey)
        return;
    if (combobox.isComposing)
        return;
    switch (event.key) {
        case 'Space':
            const focusElId = this.input.getAttribute('aria-activedescendant');
            const focusEl = document.querySelector(`#${focusElId}`);
            const checked = focusEl.getAttribute('aria-checked') == 'true';
            if(checked) {
                focusEl.setAttribute('aria-checked', 'false');
            } else {
                focusEl.setAttribute('aria-checked', 'true');
            }
        case 'Enter':
        case 'Tab':
            if (commit(combobox.input, combobox.list)) {
                event.preventDefault();
            }
            break;
        case 'Escape':
            combobox.clearSelection();
            break;
        case 'ArrowDown':
            combobox.navigate(1);
            event.preventDefault();
            break;
        case 'ArrowUp':
            combobox.navigate(-1);
            event.preventDefault();
            break;
        case 'n':
            if (ctrlBindings && event.ctrlKey) {
                combobox.navigate(1);
                event.preventDefault();
            }
            break;
        case 'p':
            if (ctrlBindings && event.ctrlKey) {
                combobox.navigate(-1);
                event.preventDefault();
            }
            break;
        default:
            if (event.ctrlKey)
                break;
            combobox.clearSelection();
    }
}
function commitWithElement(event) {
    if (!(event.target instanceof Element))
        return;
    const target = event.target.closest('[role="option"]');
    if (!target)
        return;
    if (target.getAttribute('aria-disabled') === 'true')
        return;
    fireCommitEvent(target);
}
function commit(input, list) {
    const target = list.querySelector('[aria-checked="true"]');
    if (!target)
        return false;
    if (target.getAttribute('aria-disabled') === 'true')
        return true;
    target.click();
    return true;
}
function fireCommitEvent(target) {
    target.dispatchEvent(new CustomEvent('combobox-commit', { bubbles: true }));
}
function visible(el) {
    return (!el.hidden &&
        !(el instanceof HTMLInputElement && el.type === 'hidden') &&
        (el.offsetWidth > 0 || el.offsetHeight > 0));
}
function trackComposition(event, combobox) {
    combobox.isComposing = event.type === 'compositionstart';
    const list = document.getElementById(combobox.input.getAttribute('aria-controls') || '');
    if (!list)
        return;
    combobox.clearSelection();
}
function scrollTo(container, target) {
    if (!inViewport(container, target)) {
        container.scrollTop = target.offsetTop;
    }
}
function inViewport(container, element) {
    const scrollTop = container.scrollTop;
    const containerBottom = scrollTop + container.clientHeight;
    const top = element.offsetTop;
    const bottom = top + element.clientHeight;
    return top >= scrollTop && bottom <= containerBottom;
}