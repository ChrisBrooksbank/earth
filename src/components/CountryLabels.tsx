import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { lonLatToXYZ } from '../lib/geo-utils';
import { MAJOR_COUNTRIES, type MajorCountry } from '../data/majorCountries';

const LABEL_RADIUS = 1.02;

/** Create a canvas texture with the country name rendered as white text. */
function createLabelTexture(name: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 48;
  const font = `${fontSize}px sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(name);
  const width = Math.ceil(metrics.width) + 16;
  const height = fontSize + 16;
  canvas.width = width;
  canvas.height = height;

  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow for readability
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(name, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

interface LabelData {
  country: MajorCountry;
  position: THREE.Vector3;
  texture: THREE.Texture;
  aspect: number;
}

/** Pre-build all label data once. */
const allLabels: LabelData[] = MAJOR_COUNTRIES.map(country => {
  const [x, y, z] = lonLatToXYZ(country.lon, country.lat, LABEL_RADIUS);
  const texture = createLabelTexture(country.name);
  const img = texture.image as HTMLCanvasElement;
  const aspect = img.width / img.height;
  return { country, position: new THREE.Vector3(x, y, z), texture, aspect };
});

const SCALE = 0.06;
const _worldPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();

type LabelTier = 'none' | 'tier1' | 'all';

function selectLabelTier(s: { cameraDistance: number; cameraMode: string }): LabelTier {
  if (s.cameraMode !== 'planet' || s.cameraDistance > 4.5) return 'none';
  if (s.cameraDistance > 2.8) return 'tier1';
  return 'all';
}

const LABELS_BY_TIER: Record<LabelTier, LabelData[]> = {
  none: [],
  tier1: allLabels.filter(l => l.country.tier === 1),
  all: allLabels,
};

export default function CountryLabels() {
  const labelTier = useAppStore(selectLabelTier);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const visibleLabels = LABELS_BY_TIER[labelTier];

  // Hide sprites on the back side of the globe each frame
  useFrame(() => {
    if (!groupRef.current) return;
    const children = groupRef.current.children;
    _camDir.copy(camera.position).normalize();

    for (let i = 0; i < children.length; i++) {
      const sprite = children[i] as THREE.Sprite;
      // Get world position of the sprite (accounts for parent group rotation)
      sprite.getWorldPosition(_worldPos);
      _worldPos.normalize();
      // Visible if facing camera (dot product > 0)
      sprite.visible = _worldPos.dot(_camDir) > 0.1;
    }
  });

  if (visibleLabels.length === 0) return null;

  return (
    <group ref={groupRef}>
      {visibleLabels.map(label => (
        <sprite
          key={label.country.name}
          position={label.position}
          scale={[SCALE * label.aspect, SCALE, 1]}
        >
          <spriteMaterial
            map={label.texture}
            transparent
            depthWrite={false}
            depthTest={false}
            sizeAttenuation
          />
        </sprite>
      ))}
    </group>
  );
}
