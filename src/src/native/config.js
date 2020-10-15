const Store = window.electronStore;

module.exports = new Store({
  defaults: {
    userId: '',
    lolDir: '',
    lolVer: '',
    appLang: 'zh-CN',
    keepOldItems: true,
    selectedSources: [],
    ignoreSystemScale: false,
  },
});
