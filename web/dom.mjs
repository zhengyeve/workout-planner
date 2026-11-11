export const byId = (id) => document.getElementById(id);

export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function button(text, action, className = 'secondary') {
  const node = element('button', text, className);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

export function notice(text) {
  byId('notice').textContent = text;
}

export function changeTab(tab) {
  for (const node of document.querySelectorAll('[data-tab]')) {
    const active = node.dataset.tab === tab;
    byId(node.dataset.tab).hidden = !active;
    if (active) node.setAttribute('aria-current', 'page');
    else node.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
}
