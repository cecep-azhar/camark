export type AmbientMode = 'app-accent' | 'solid' | 'rgb-cycle' | 'aurora';
export type AmbientEffect = 'static' | 'breathing' | 'wave';

export interface AmbientConfig {
  enabled: boolean;
  mode: AmbientMode;
  customColor: string; // Hex color e.g. #06b6d4
  effect: AmbientEffect;
  intensity: number; // 0.1 to 1.0 (opacity)
  blurRadius: number; // 8 to 40 px
  speedSec: number; // 2 to 15 s
}

const STORAGE_KEY = 'camark-ambient-lighting-v1';

const DEFAULT_CONFIG: AmbientConfig = {
  enabled: true,
  mode: 'app-accent',
  customColor: '#06b6d4',
  effect: 'breathing',
  intensity: 0.65,
  blurRadius: 20,
  speedSec: 4
};

function loadStoredConfig(): AmbientConfig {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveStoredConfig(config: AmbientConfig): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

let instance: ReturnType<typeof createAmbientStore> | null = null;

function createAmbientStore() {
  let config = $state<AmbientConfig>(loadStoredConfig());

  function update(partial: Partial<AmbientConfig>) {
    config = { ...config, ...partial };
    saveStoredConfig(config);
  }

  return {
    get config() {
      return config;
    },
    setEnabled(enabled: boolean) {
      update({ enabled });
    },
    setMode(mode: AmbientMode) {
      update({ mode });
    },
    setCustomColor(customColor: string) {
      update({ customColor });
    },
    setEffect(effect: AmbientEffect) {
      update({ effect });
    },
    setIntensity(intensity: number) {
      update({ intensity: Math.max(0.1, Math.min(1.0, intensity)) });
    },
    setBlurRadius(blurRadius: number) {
      update({ blurRadius: Math.max(6, Math.min(60, blurRadius)) });
    },
    setSpeedSec(speedSec: number) {
      update({ speedSec: Math.max(1, Math.min(20, speedSec)) });
    },
    resetDefaults() {
      config = { ...DEFAULT_CONFIG };
      saveStoredConfig(config);
    }
  };
}

export function getAmbientStore() {
  if (!instance) {
    instance = createAmbientStore();
  }
  return instance;
}
