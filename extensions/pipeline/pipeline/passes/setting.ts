
export let settings = {
    bakingReflection: false,
    outputRGBE: false,
    tonemapped: false,

    shadowPass: undefined,
    gbufferPass: undefined,

    renderProfiler: false,

    passPathName: '',

    passVersion: 0
}

globalThis.ppSettings = settings;
