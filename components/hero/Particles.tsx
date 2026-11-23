/* eslint-disable react-hooks/immutability */
"use client";

/* Brilhos e vapor subindo do hambúrguer pronto (loop por tempo). */

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";
import { spriteTexture } from "./geo";

type Props = { act: MutableRefObject<number>; mobile: boolean; centro: number };

export default function Particles({ act, mobile, centro }: Props) {
  const sprite = useMemo(() => spriteTexture(), []);
  const nSpark = mobile ? 34 : 72;
  const nSteam = mobile ? 10 : 22;

  const data = useMemo(() => {
    const rnd = mulberry32(404);
    const mk = (n: number) =>
      Array.from({ length: n }, () => ({
        a: rnd() * Math.PI * 2, r: rnd(), ph: rnd(), sp: 0.5 + rnd() * 0.9, dr: (rnd() - 0.5) * 0.8,
      }));
    return { spark: mk(nSpark), steam: mk(nSteam) };
  }, [nSpark, nSteam]);

  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nSpark * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nSpark * 3), 3));
    return g;
  }, [nSpark]);
  const steamGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nSteam * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nSteam * 3), 3));
    return g;
  }, [nSteam]);

  const time = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const a = act.current;
    if (a <= 0.001) {
      sparkGeo.setDrawRange(0, 0);
      steamGeo.setDrawRange(0, 0);
      return;
    }
    time.current += dt;
    const tt = time.current;
    sparkGeo.setDrawRange(0, nSpark);
    steamGeo.setDrawRange(0, nSteam);

    const sp = sparkGeo.attributes.position as THREE.BufferAttribute;
    const sc = sparkGeo.attributes.color as THREE.BufferAttribute;
    data.spark.forEach((p, i) => {
      const life = (tt * 0.22 * p.sp + p.ph) % 1;
      const fade = Math.sin(Math.PI * life);
      const rr = 0.4 + p.r * 1.5;
      sp.setXYZ(i, Math.cos(p.a + tt * 0.25) * rr + Math.sin(tt * 1.2 + p.ph * 9) * 0.06, -centro + 0.9 + life * 3.6, Math.sin(p.a + tt * 0.25) * rr);
      const k = fade * a * 0.95;
      sc.setXYZ(i, 1.0 * k, 0.62 * k, 0.16 * k);
    });
    sp.needsUpdate = true;
    sc.needsUpdate = true;

    const tp = steamGeo.attributes.position as THREE.BufferAttribute;
    const tc = steamGeo.attributes.color as THREE.BufferAttribute;
    data.steam.forEach((p, i) => {
      const life = (tt * 0.12 * p.sp + p.ph) % 1;
      const fade = Math.sin(Math.PI * life);
      const rr = 0.1 + p.r * 0.7 + life * 0.5;
      tp.setXYZ(i, Math.cos(p.a) * rr + p.dr * life, -centro + 2.1 + life * 2.6, Math.sin(p.a) * rr);
      const k = fade * a * 0.07;
      tc.setXYZ(i, 1.0 * k, 0.86 * k, 0.7 * k);
    });
    tp.needsUpdate = true;
    tc.needsUpdate = true;
  });

  return (
    <>
      <points geometry={steamGeo} frustumCulled={false}>
        <pointsMaterial map={sprite} size={1.5} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <points geometry={sparkGeo} frustumCulled={false}>
        <pointsMaterial map={sprite} size={0.09} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </>
  );
}
