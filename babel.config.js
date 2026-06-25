module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin reemplaza a react-native-reanimated/plugin
    // a partir de Reanimated 4. Debe ir SIEMPRE al final de la lista.
    plugins: ['react-native-worklets/plugin'],
  };
};
