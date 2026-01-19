import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface MultiViewFood3DProps {
  topView: string;
  frontView: string;
  angleView: string;
}

function FoodPlateMulti({ topView, frontView, angleView }: MultiViewFood3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Load textures
  const topTexture = useLoader(THREE.TextureLoader, topView);
  const frontTexture = useLoader(THREE.TextureLoader, frontView);
  const angleTexture = useLoader(THREE.TextureLoader, angleView);
  [topTexture, frontTexture, angleTexture].forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));

  // Create cylinder for food
  const radius = 1.2;
  const height = 0.5;
  const radialSegments = 64;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments, 1, false);

  // Triplanar shader material (blends three projections)
  const triplanarMaterial = useMemo(() => {
    const uniforms = {
      texTop: { value: topTexture },
      texFront: { value: frontTexture },
      texSide: { value: angleTexture },
      repeat: { value: 0.8 },
    };

    const vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D texTop;
      uniform sampler2D texFront;
      uniform sampler2D texSide;
      uniform float repeat;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      vec3 sampleTex(in sampler2D tex, in vec2 uv) {
        return texture2D(tex, fract(uv)).rgb;
      }

      void main() {
        vec3 n = normalize(vNormal);
        vec3 blend = abs(n);
        // sharpen blend a bit
        blend = max((blend - 0.2), 0.0);
        blend /= (blend.x + blend.y + blend.z + 1e-5);

        vec2 uvTop   = vWorldPos.xz * repeat;
        vec2 uvFront = vWorldPos.xy * repeat;
        vec2 uvSide  = vWorldPos.zy * repeat;

        vec3 cTop   = sampleTex(texTop, uvTop);
        vec3 cFront = sampleTex(texFront, uvFront);
        vec3 cSide  = sampleTex(texSide, uvSide);

        vec3 color = cTop * blend.y + cFront * blend.z + cSide * blend.x;

        // simple diffuse lighting
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float diff = max(dot(n, lightDir), 0.0);
        float ambient = 0.35;
        color *= ambient + diff * 0.65;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    mat.needsUpdate = true;
    return mat;
  }, [topTexture, frontTexture, angleTexture]);

  return (
    <group ref={groupRef}>
      {/* Food cylinder */}
      <mesh geometry={geometry} castShadow receiveShadow material={triplanarMaterial}>
        {/* geometry provided above */}
      </mesh>

      {/* Plate */}
      <mesh position={[0, -height / 2 - 0.05, 0]} receiveShadow>
        {/* <cylinderGeometry args={[radius * 1.5, radius * 1.5, 0.1, 64, 1, true]} /> */}
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading 3D View...</span>
      </div>
    </Html>
  );
}

export default function MultiViewFood3D({ topView, frontView, angleView }: MultiViewFood3DProps) {
  const [is3DMode, setIs3DMode] = useState(true);

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-red from-secondary to-background">
      {is3DMode ? (
        <>
          <Canvas camera={{ position: [0, 3, 5], fov: 45 }} shadows dpr={[1, 2]}>
            <Suspense fallback={<LoadingSpinner />}>
              <ambientLight intensity={0.5} />
              <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
              <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffa500" />

              {/* Food + Plate */}
              <FoodPlateMulti topView={topView} frontView={frontView} angleView={angleView} />

              <ContactShadows position={[0, -0.3, 0]} opacity={0.4} scale={10} blur={2} far={4} />
              <Environment preset="studio" />

              {/* OrbitControls */}
              <OrbitControls enableZoom enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} />
            </Suspense>
          </Canvas>

          {/* Hint */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground"
          >
            👆 Drag to rotate • Pinch to zoom
          </motion.div>
        </>
      ) : (
        <img src={frontView} alt="food" className="w-full h-full object-cover" />
      )}

      {/* Toggle */}
      <button
        onClick={() => setIs3DMode(!is3DMode)}
        className="absolute top-4 right-4 px-3 py-1.5 rounded-full glass-card text-sm font-medium hover:bg-secondary transition-colors"
      >
        {is3DMode ? '📷 2D View' : '🎮 3D View'}
      </button>
    </div>
  );
}












































// import { Canvas, useLoader } from '@react-three/fiber';
// import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
// import { Suspense, useState, useRef } from 'react';
// import * as THREE from 'three';
// import { motion } from 'framer-motion';

// interface Food3DViewerProps {
//   imageUrl: string;
//   name: string;
// }

// function FoodPlate({ imageUrl }: { imageUrl: string }) {
//   const meshRef = useRef<THREE.Mesh>(null);

//   // Load texture
//   const texture = useLoader(THREE.TextureLoader, imageUrl);
//   texture.colorSpace = THREE.SRGBColorSpace;

//   return (
//     <group>
//       {/* Food item */}
//       <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
//         <cylinderGeometry args={[1.2, 1.2, 0.4, 64]} />
//         <meshStandardMaterial map={texture} roughness={0.6} metalness={0} />
//       </mesh>

//       {/* Plate base only (no rim) */}
//       <mesh position={[0, -0.25, 0]} receiveShadow>
//         <cylinderGeometry args={[1.8, 1.8, 0.1, 64]} />
//         <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
//       </mesh>
//     </group>
//   );
// }

// function LoadingSpinner() {
//   return (
//     <Html center>
//       <div className="flex flex-col items-center gap-2">
//         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
//         <span className="text-sm text-muted-foreground">Loading 3D View...</span>
//       </div>
//     </Html>
//   );
// }

// export default function Food3DViewer({ imageUrl, name }: Food3DViewerProps) {
//   const [is3DMode, setIs3DMode] = useState(true);

//   return (
//     <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-b from-secondary to-background">
//       {is3DMode ? (
//         <>
//           <Canvas camera={{ position: [0, 3, 5], fov: 45 }} shadows dpr={[1, 2]}>
//             <Suspense fallback={<LoadingSpinner />}>
//               <ambientLight intensity={0.5} />
//               <spotLight
//                 position={[5, 10, 5]}
//                 angle={0.3}
//                 penumbra={1}
//                 intensity={1}
//                 castShadow
//               />
//               <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffa500" />

//               {/* Food + Plate */}
//               <FoodPlate imageUrl={imageUrl} />

//               <ContactShadows
//                 position={[0, -0.3, 0]}
//                 opacity={0.4}
//                 scale={10}
//                 blur={2}
//                 far={4}
//               />

//               <Environment preset="studio" />

//               {/* OrbitControls for drag rotation */}
//               <OrbitControls
//                 enableZoom={true}
//                 enablePan={false}
//                 minPolarAngle={0}
//                 maxPolarAngle={Math.PI}
//               />
//             </Suspense>
//           </Canvas>

//           {/* Controls hint */}
//           <motion.div
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5 }}
//             className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground"
//           >
//             👆 Drag to rotate • Pinch to zoom
//           </motion.div>
//         </>
//       ) : (
//         <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
//       )}

//       {/* Toggle button */}
//       <button
//         onClick={() => setIs3DMode(!is3DMode)}
//         className="absolute top-4 right-4 px-3 py-1.5 rounded-full glass-card text-sm font-medium hover:bg-secondary transition-colors"
//       >
//         {is3DMode ? '📷 2D View' : '🎮 3D View'}
//       </button>

//       {/* 3D Badge */}
//       {is3DMode && (
//         <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full warm-gradient text-primary-foreground text-sm font-semibold">
//           360° View
//         </div>
//       )}
//     </div>
//   );
// }
