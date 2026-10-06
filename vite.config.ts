import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The largest chunk is the country border data (~1.6 MB of GeoJSON, needed
    // up front for hover, search and pins); every code chunk stays under 750 kB
    chunkSizeWarningLimit: 1800,
    rolldownOptions: {
      output: {
        // Split the big libraries out so app updates don't bust their cache
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            {
              name: 'r3f',
              test: /node_modules[\\/](@react-three|@react-spring|three-stdlib|postprocessing|camera-controls|@monogrid)[\\/]/,
            },
            { name: 'geo-data', test: /src[\\/]data[\\/].*\.json$/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|zustand)[\\/]/ },
          ],
        },
      },
    },
  },
});
