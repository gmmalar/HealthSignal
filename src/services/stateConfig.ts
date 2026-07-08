export interface StateConfig {
  label: string;
  airQuality: boolean;
  flu: boolean;
  diseaseOutbreaks: boolean;
}

export const STATE_CONFIG: Record<string, StateConfig> = {
  texas:            { label: "Texas",           airQuality: true,  flu: true,  diseaseOutbreaks: true  },
  california:       { label: "California",      airQuality: false, flu: true,  diseaseOutbreaks: true  },
  florida:          { label: "Florida",         airQuality: true,  flu: true,  diseaseOutbreaks: true  },
  arizona:          { label: "Arizona",         airQuality: true,  flu: true,  diseaseOutbreaks: true  },
  "north-carolina": { label: "North Carolina",  airQuality: true,  flu: true,  diseaseOutbreaks: true  },
  illinois:         { label: "Illinois",        airQuality: false, flu: true,  diseaseOutbreaks: true  },
  washington:       { label: "Washington",      airQuality: false, flu: true,  diseaseOutbreaks: false },
  virginia:         { label: "Virginia",        airQuality: false, flu: false, diseaseOutbreaks: true  },
  georgia:          { label: "Georgia",         airQuality: false, flu: false, diseaseOutbreaks: true  },
  colorado:         { label: "Colorado",        airQuality: false, flu: false, diseaseOutbreaks: true  },
  ohio:             { label: "Ohio",            airQuality: false, flu: false, diseaseOutbreaks: true  },
  michigan:         { label: "Michigan",        airQuality: false, flu: false, diseaseOutbreaks: true  },
  pennsylvania:     { label: "Pennsylvania",    airQuality: false, flu: false, diseaseOutbreaks: true  },
  massachusetts:    { label: "Massachusetts",   airQuality: false, flu: false, diseaseOutbreaks: true  },
};

export function getStatesForTopic(topic: string): Array<{ value: string; label: string }> {
  const key =
    topic === "air-quality" ? "airQuality" :
    topic === "flu" ? "flu" :
    topic === "disease-outbreaks" ? "diseaseOutbreaks" :
    null;
  if (!key) return [];
  return Object.entries(STATE_CONFIG)
    .filter(([, cfg]) => cfg[key as keyof StateConfig])
    .map(([value, cfg]) => ({ value, label: cfg.label }));
}