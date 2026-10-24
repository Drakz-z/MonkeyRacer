export const THEMES = {
  serika_dark: {
    name: 'Serika Dark',
    bg: '#323437',
    main: '#e2b714',
    caret: '#e2b714',
    sub: '#646669',
    subAlt: '#2c2e31',
    text: '#d1d0c5',
    error: '#ca4754',
    errorExtra: '#7e2a33',
    colorfulError: '#ca4754',
    colorfulErrorExtra: '#7e2a33',
  },
  carbon: {
    name: 'Carbon',
    bg: '#313131',
    main: '#f66e0d',
    caret: '#f66e0d',
    sub: '#616161',
    subAlt: '#2b2b2b',
    text: '#f5e6c8',
    error: '#e45c5c',
    errorExtra: '#803030',
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36',
    main: '#bd93f9',
    caret: '#bd93f9',
    sub: '#6272a4',
    subAlt: '#21222c',
    text: '#f8f8f2',
    error: '#ff5555',
    errorExtra: '#b33939',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bg: '#181a20',
    main: '#00ffc2',
    caret: '#ff007f',
    sub: '#5a627a',
    subAlt: '#121317',
    text: '#eef1f7',
    error: '#ff007f',
    errorExtra: '#99004d',
  },
  nord: {
    name: 'Nord',
    bg: '#2e3440',
    main: '#88c0d0',
    caret: '#88c0d0',
    sub: '#4c566a',
    subAlt: '#242933',
    text: '#eceff4',
    error: '#bf616a',
    errorExtra: '#7a393f',
  },
  botanical: {
    name: 'Botanical',
    bg: '#1c2826',
    main: '#93b794',
    caret: '#93b794',
    sub: '#4d655f',
    subAlt: '#16201e',
    text: '#e1ded6',
    error: '#d95d5d',
    errorExtra: '#8a3b3b',
  },
  sunset: {
    name: 'Sunset',
    bg: '#1b1c2b',
    main: '#f39c12',
    caret: '#f39c12',
    sub: '#5a5b75',
    subAlt: '#13141f',
    text: '#e0e0e0',
    error: '#e74c3c',
    errorExtra: '#8e281b',
  },
  chalk: {
    name: 'Chalk',
    bg: '#222426',
    main: '#e89e47',
    caret: '#e89e47',
    sub: '#55595c',
    subAlt: '#1b1d1e',
    text: '#e3e4e6',
    error: '#d75454',
    errorExtra: '#833333',
  },
};

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.serika_dark;
  const root = document.documentElement;
  root.style.setProperty('--bg-color', theme.bg);
  root.style.setProperty('--main-color', theme.main);
  root.style.setProperty('--caret-color', theme.caret);
  root.style.setProperty('--sub-color', theme.sub);
  root.style.setProperty('--sub-alt-color', theme.subAlt);
  root.style.setProperty('--text-color', theme.text);
  root.style.setProperty('--error-color', theme.error);
  root.style.setProperty('--error-extra-color', theme.errorExtra);
  root.style.setProperty('--card-bg', theme.subAlt);
  root.style.setProperty('--card-border', `${theme.sub}40`);
}
