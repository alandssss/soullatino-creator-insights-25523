import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebGLFallback } from "./WebGLFallback";

interface Creator {
  id: string;
  nombre: string;
  diamantes: number;
  views: number;
  hito_diamantes: number;
}

interface DiamondsBars3DProps {
  creators: Creator[];
  title?: string;
}

function Bar({ 
  position, 
  height, 
  color, 
  label, 
  value,
  onClick 
}: { 
  position: [number, number, number]; 
  height: number; 
  color: string;
  label: string;
  value: number;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const targetY = hovered ? 0.1 : 0;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {label}
      </Text>
      {hovered && (
        <Text
          position={[0, height + 0.5, 0]}
          fontSize={0.4}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
        >
          {value.toLocaleString()} 💎
        </Text>
      )}
    </group>
  );
}

function Scene({ creators, onCreatorClick }: { creators: Creator[], onCreatorClick: (id: string) => void }) {
  const maxDiamonds = Math.max(...creators.map(c => c.diamantes || 0), 1);
  
  const getColor = (hito: number) => {
    if (hito >= 300000) return "#10b981"; // green
    if (hito >= 100000) return "#fbbf24"; // yellow
    return "#ef4444"; // red
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {creators.slice(0, 10).map((creator, index) => {
        const height = Math.max((creator.diamantes || 0) / maxDiamonds * 5, 0.1);
        const xPos = (index - 4.5) * 1.5;
        
        return (
          <Bar
            key={creator.id}
            position={[xPos, height / 2, 0]}
            height={height}
            color={getColor(creator.hito_diamantes)}
            label={creator.nombre.substring(0, 8)}
            value={creator.diamantes || 0}
            onClick={() => onCreatorClick(creator.id)}
          />
        );
      })}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
      />
      
      <gridHelper args={[20, 20, "#444", "#222"]} />
    </>
  );
}

export default function DiamondsBars3D({ creators, title = "Top 10 Creadores - Diamantes 3D" }: DiamondsBars3DProps) {
  const [renderError, setRenderError] = useState(false);
  
  const handleCreatorClick = (id: string) => {
    console.log("Clicked creator:", id);
  };

  if (renderError) {
    return <WebGLFallback message="Error al renderizar gráficos 3D. Tu dispositivo podría no soportar WebGL." />;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[500px] bg-background/50 rounded-lg overflow-hidden">
          <Canvas
            camera={{ position: [0, 5, 12], fov: 50 }}
            shadows
            onCreated={(state) => {
              if (!state.gl) {
                setRenderError(true);
              }
            }}
            gl={{ 
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true 
            }}
          >
            <Suspense fallback={null}>
              <Scene creators={creators} onCreatorClick={handleCreatorClick} />
            </Suspense>
          </Canvas>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#ef4444]" />
            <span>&lt; 100k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#fbbf24]" />
            <span>100k - 300k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#10b981]" />
            <span>&gt; 300k</span>
          </div>
          <span className="ml-4">🖱️ Arrastra para rotar | 🔍 Scroll para zoom | 👆 Click en barra para detalles</span>
        </div>
      </CardContent>
    </Card>
  );
}
