/* -------------------------------------------------------------------------- */
/*                              Config                                        */
/* -------------------------------------------------------------------------- */
const CONFIG = {
  isNavbarVerticalCollapsed: false,
  theme: 'dark',
  isRTL: false,
  isFluid: false,
  navbarStyle: 'transparent',
  navbarPosition: 'vertical'
};

Object.keys(CONFIG).forEach(key => {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, CONFIG[key]);
  }
});

if (!!JSON.parse(localStorage.getItem('isNavbarVerticalCollapsed'))) {
  document.documentElement.classList.add('navbar-vertical-collapsed');
}

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-bs-theme', 'dark');
} else if (localStorage.getItem('theme') === 'auto') {
  document.documentElement.setAttribute(
    'data-bs-theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
}

export default CONFIG;
