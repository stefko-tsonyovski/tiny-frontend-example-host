import React from "react";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
class TinyClientFetchError extends Error {
  constructor(tinyFrontendName2, contractVersion, message) {
    super(`Failed to fetch tiny frontend ${tinyFrontendName2} version ${contractVersion} from API, ${message}`);
    this.name = "TinyClientFetchError";
  }
}
class TinyClientLoadBundleError extends Error {
  constructor(tinyFrontendName2) {
    super(`Failed to load script for tiny frontend ${tinyFrontendName2}`);
    this.name = "TinyClientLoadBundleError";
  }
}
const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const retry = async (fnToRetry, retryPolicy) => {
  const { maxRetries, delayInMs } = retryPolicy;
  const onError = (error) => {
    if (maxRetries <= 0) {
      throw error;
    }
    return wait(delayInMs).then(() => retry(fnToRetry, {
      delayInMs: delayInMs * 2,
      maxRetries: maxRetries - 1
    }));
  };
  try {
    return await fnToRetry();
  } catch (error) {
    return onError(error);
  }
};
const isCacheItemValid = ({
  timestamp,
  ttlInMs
}) => ttlInMs == null || Date.now() - timestamp < ttlInMs;
const moduleConfigPromiseCacheMap = new Map();
const getTinyFrontendModuleConfig = async ({
  tinyFrontendName: tinyFrontendName2,
  contractVersion,
  hostname,
  retryPolicy = {
    maxRetries: 0,
    delayInMs: 0
  },
  cacheTtlInMs
}) => {
  const cacheKey = `${tinyFrontendName2}-${contractVersion}-${hostname}`;
  const cacheItem = moduleConfigPromiseCacheMap.get(cacheKey);
  if (cacheItem && isCacheItemValid({
    ttlInMs: cacheTtlInMs,
    timestamp: cacheItem.timestamp
  })) {
    return cacheItem.promise;
  }
  const moduleConfigPromise = retry(() => getTinyFrontendModuleConfigBase({
    tinyFrontendName: tinyFrontendName2,
    contractVersion,
    hostname
  }), retryPolicy).catch((err) => {
    moduleConfigPromiseCacheMap.delete(cacheKey);
    throw err;
  });
  moduleConfigPromiseCacheMap.set(cacheKey, {
    promise: moduleConfigPromise,
    timestamp: Date.now()
  });
  return moduleConfigPromise;
};
const getTinyFrontendModuleConfigBase = async ({
  tinyFrontendName: tinyFrontendName2,
  contractVersion,
  hostname
}) => {
  let response;
  try {
    response = await fetch(`${hostname}/tiny/latest/${tinyFrontendName2}/${contractVersion}`, { mode: "cors" });
  } catch (err) {
    throw new TinyClientFetchError(tinyFrontendName2, contractVersion, `with error: ${err == null ? void 0 : err.message}`);
  }
  if (response.status >= 400) {
    throw new TinyClientFetchError(tinyFrontendName2, contractVersion, `with status ${response.status} and body '${await response.text()}'`);
  }
  let responseJson;
  try {
    responseJson = await response.json();
  } catch (err) {
    throw new TinyClientFetchError(tinyFrontendName2, contractVersion, `while getting JSON body`);
  }
  return responseJson;
};
(function(Object2) {
  typeof globalThis !== "object" && (this ? get() : (Object2.defineProperty(Object2.prototype, "_T_", {
    configurable: true,
    get
  }), _T_));
  function get() {
    var global = this || self;
    global.globalThis = global;
    delete Object2.prototype._T_;
  }
})(Object);
const umdBundlesPromiseCacheMap = new Map();
const loadUmdBundleServerWithCache = (props) => loadUmdBundleWithCache(__spreadProps(__spreadValues({}, props), {
  bundleLoader: bundleLoaderServer
}));
const loadUmdBundleClientWithCache = (props) => loadUmdBundleWithCache(__spreadProps(__spreadValues({}, props), {
  bundleLoader: bundleLoaderClient
}));
const loadUmdBundleWithCache = async ({
  bundleUrl,
  tinyFrontendName: tinyFrontendName2,
  dependenciesMap,
  baseCacheKey,
  bundleLoader,
  retryPolicy = {
    maxRetries: 0,
    delayInMs: 0
  }
}) => {
  const cacheItem = umdBundlesPromiseCacheMap.get(baseCacheKey);
  if (cacheItem && cacheItem.bundleUrl === bundleUrl) {
    return cacheItem.promise;
  }
  const umdBundlePromise = retry(() => bundleLoader({
    bundleUrl,
    dependenciesMap,
    tinyFrontendName: tinyFrontendName2
  }), retryPolicy).catch((err) => {
    umdBundlesPromiseCacheMap.delete(baseCacheKey);
    throw err;
  });
  umdBundlesPromiseCacheMap.set(baseCacheKey, {
    bundleUrl,
    promise: umdBundlePromise
  });
  return umdBundlePromise;
};
const bundleLoaderServer = async ({
  bundleUrl,
  dependenciesMap
}) => {
  const umdBundleSourceResponse = await fetch(bundleUrl);
  if (umdBundleSourceResponse.status >= 400) {
    throw new Error(`Failed to fetch umd bundle at URL ${bundleUrl} with status ${umdBundleSourceResponse.status}`);
  }
  const umdBundleSource = await umdBundleSourceResponse.text();
  return evalUmdBundle(umdBundleSource, dependenciesMap);
};
const evalUmdBundle = (umdBundleSource, dependenciesMap) => {
  const previousDefine = globalThis.define;
  let module = void 0;
  globalThis.define = (dependenciesName, moduleFactory) => {
    module = moduleFactory(...dependenciesName.map((dependencyName) => {
      const dependency = dependenciesMap[dependencyName];
      if (!dependency) {
        console.error(`Couldn't find dependency ${dependencyName} in provided dependencies map`, dependenciesMap);
      }
      return dependency;
    }));
  };
  globalThis.define["amd"] = true;
  try {
    new Function(umdBundleSource)();
  } finally {
    globalThis.define = previousDefine;
  }
  if (!module) {
    throw new Error("Couldn't load umd bundle");
  }
  return module;
};
const bundleLoaderClient = async ({
  bundleUrl,
  tinyFrontendName: tinyFrontendName2,
  dependenciesMap
}) => {
  const script = document.createElement("script");
  script.src = bundleUrl;
  const loadPromise = new Promise((resolve, reject) => {
    script.addEventListener("load", () => {
      resolve(window.tinyFrontendExports[tinyFrontendName2]);
    });
    script.addEventListener("error", (event) => {
      try {
        document.head.removeChild(script);
      } finally {
        reject(event.error);
      }
    });
  });
  window.tinyFrontendDeps = __spreadValues(__spreadValues({}, window.tinyFrontendDeps), dependenciesMap);
  document.head.appendChild(script);
  return loadPromise;
};
const loadTinyFrontendClient = async ({
  name,
  contractVersion,
  tinyApiEndpoint,
  dependenciesMap = {},
  loadingOptions = {}
}) => {
  const { retryPolicy, cacheTtlInMs = 2 * 60 * 1e3 } = loadingOptions;
  const tinyFrontendModuleConfigFromSsr = window[`tinyFrontend${name}Config`];
  const tinyFrontendModuleConfig = tinyFrontendModuleConfigFromSsr != null ? tinyFrontendModuleConfigFromSsr : await getTinyFrontendModuleConfig({
    tinyFrontendName: name,
    contractVersion,
    hostname: tinyApiEndpoint,
    retryPolicy,
    cacheTtlInMs
  });
  if (tinyFrontendModuleConfig.cssBundle) {
    const cssBundleUrl = `${tinyApiEndpoint}/tiny/bundle/${tinyFrontendModuleConfig.cssBundle}`;
    if (!hasStylesheet(cssBundleUrl)) {
      const cssElement = document.createElement("link");
      cssElement.rel = "stylesheet";
      cssElement.href = cssBundleUrl;
      document.head.appendChild(cssElement);
    }
  }
  try {
    return await loadUmdBundleClientWithCache({
      bundleUrl: `${tinyApiEndpoint}/tiny/bundle/${tinyFrontendModuleConfig.umdBundle}`,
      tinyFrontendName: name,
      dependenciesMap,
      baseCacheKey: `${name}-${contractVersion}`,
      retryPolicy
    });
  } catch (err) {
    console.error(err);
    throw new TinyClientLoadBundleError(name);
  }
};
const hasStylesheet = (stylesheetHref) => !!document.querySelector(`link[rel="stylesheet"][href="${stylesheetHref}"]`);
const loadTinyFrontendServer = async ({
  name,
  contractVersion,
  tinyApiEndpoint,
  dependenciesMap = {},
  loadingOptions = {}
}) => {
  const { retryPolicy, cacheTtlInMs = 2 * 60 * 1e3 } = loadingOptions;
  const tinyFrontendModuleConfig = await getTinyFrontendModuleConfig({
    tinyFrontendName: name,
    contractVersion,
    hostname: tinyApiEndpoint,
    retryPolicy,
    cacheTtlInMs
  });
  const umdBundleUrl = `${tinyApiEndpoint}/tiny/bundle/${tinyFrontendModuleConfig.umdBundle}`;
  const cssBundleUrl = tinyFrontendModuleConfig.cssBundle ? `${tinyApiEndpoint}/tiny/bundle/${tinyFrontendModuleConfig.cssBundle}` : void 0;
  try {
    const tinyFrontend = await loadUmdBundleServerWithCache({
      bundleUrl: umdBundleUrl,
      tinyFrontendName: name,
      dependenciesMap,
      baseCacheKey: `${name}-${contractVersion}`,
      retryPolicy
    });
    const moduleConfigScript = `window["tinyFrontend${name}Config"] = ${JSON.stringify(tinyFrontendModuleConfig)}`;
    const tinyFrontendStringToAddToSsrResult = `
${cssBundleUrl ? `<link rel="stylesheet" href="${cssBundleUrl}">` : ""}
<link rel="preload" href="${umdBundleUrl}" as="script">
<script>${moduleConfigScript}<\/script>`;
    const tinyFrontendSsrConfig = {
      cssBundle: cssBundleUrl,
      jsBundle: umdBundleUrl,
      moduleConfigScript
    };
    return {
      tinyFrontend,
      tinyFrontendStringToAddToSsrResult,
      tinyFrontendSsrConfig
    };
  } catch (err) {
    console.error(err);
    throw new TinyClientLoadBundleError(name);
  }
};
const tinyFrontendName = "ExampleTinyFrontend";
const version = "0.0.5";
const loadExampleTinyFrontendServer = async (tinyApiEndpoint) => await loadTinyFrontendServer({
  tinyApiEndpoint,
  name: tinyFrontendName,
  contractVersion: version,
  dependenciesMap: {
    react: React
  }
});
const loadExampleTinyFrontendClient = async (tinyApiEndpoint) => await loadTinyFrontendClient({
  tinyApiEndpoint,
  name: tinyFrontendName,
  contractVersion: version,
  dependenciesMap: {
    react: React
  }
});
export { loadExampleTinyFrontendClient, loadExampleTinyFrontendServer };
