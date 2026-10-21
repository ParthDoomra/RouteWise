import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';

interface GraticulePath {
  coords: [number, number][];
}

// Generate cartographic latitude & longitude grid lines for antique engraved globe look
function generateGraticules(): GraticulePath[] {
  const paths: GraticulePath[] = [];

  // Parallels (Latitude lines)
  for (let lat = -75; lat <= 75; lat += 30) {
    const coords: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 5) {
      coords.push([lat, lng]);
    }
    paths.push({ coords });
  }

  // Meridians (Longitude lines)
  for (let lng = -180; lng < 180; lng += 30) {
    const coords: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 5) {
      coords.push([lat, lng]);
    }
    paths.push({ coords });
  }

  return paths;
}

const CARTOGRAPHIC_GRATICULES = generateGraticules();

export const InteractiveGlobe: React.FC<{ className?: string }> = ({ className = '' }) => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] });

  // Signature modern olive/forest green sphere base material (#4A5D3A matching "Modern" branding)
  const globeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4A5D3A'), // Modern olive/forest green ocean surface
      roughness: 0.62,
      metalness: 0.14,
    });
  }, []);

  // Fetch low-res GeoJSON countries for landmass contours
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch(() => {
        // Fallback gracefully if offline
      });
  }, []);

  // Responsive dimensions handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 800,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Configure initial orientation centered on India (lat: 20.5, lng: 78.5) & gentle auto-rotation
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20.5, lng: 78.5, altitude: 2.05 }, 0);

      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.45; // Gentle, smooth rotation
        controls.enableZoom = false;     // Fixed zoom for clean hero framing
      }

      // Add directional lighting & ambient fill to sculpt 3D spherical highlights and curvature
      const scene = globeRef.current.scene();
      if (scene) {
        const dirLight = new THREE.DirectionalLight(0xfffbe8, 2.2);
        dirLight.position.set(3, 4, 3);
        scene.add(dirLight);

        const ambLight = new THREE.AmbientLight(0x35432a, 1.3);
        scene.add(ambLight);
      }
    }
  }, [globeRef]);

  return (
    <div
      ref={containerRef}
      className={`interactive-globe-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)" // Transparent canvas over light cream page
        globeMaterial={globeMaterial}
        showAtmosphere={true}
        atmosphereColor="#657F4F" // Matching green atmospheric rim halo
        atmosphereAltitude={0.12}

        // Cartographic Graticule Grid Lines (Lat/Long lines on olive-green ocean)
        pathsData={CARTOGRAPHIC_GRATICULES}
        pathPoints="coords"
        pathPointLat={(p: [number, number]) => p[0]}
        pathPointLng={(p: [number, number]) => p[1]}
        pathColor={() => 'rgba(255, 255, 255, 0.20)'} // Subtle crisp white/cream cartographic grid lines
        pathStroke={0.8}
        pathPointAlt={0.002}

        // Bold black continents with crisp border outlines (clean, minimal engraved cartography)
        polygonsData={countries.features}
        polygonCapColor={() => '#181411'}       // Bold black engraved continent fill
        polygonSideColor={() => '#0F0C0A'}
        polygonStrokeColor={() => '#FAF7F2'}     // Crisp white/cream outline border
        polygonAltitude={0.007}
      />
    </div>
  );
};
