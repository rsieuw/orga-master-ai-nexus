# Technische Schuld / Known Issues

## esbuild Kwetsbaarheid (gevonden via npm audit op 2025-07-05)

- **Pakket:** `esbuild` (<=0.24.2)
- **Afhankelijkheid via:** `vite`
- **Ernst:** Moderate
- **Beschrijving:** De kwetsbaarheid stelt potentieel externe websites in staat om verzoeken naar de lokale development server te sturen en de response te lezen. Zie [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) voor details.
- **Voorgestelde Oplossing (door npm audit):** `npm audit fix --force`
- **Waarschuwing:** Het uitvoeren van `npm audit fix --force` zal `vite` updaten naar v6.3.5 (of hoger), wat een **breaking change** is. Dit vereist mogelijk aanpassingen in de codebase.
- **Status:** Uitgesteld - Handmatig aanpakken wanneer het uitkomt om potentiële breaking changes te beheren.
