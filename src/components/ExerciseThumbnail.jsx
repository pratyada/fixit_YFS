import { useState, useEffect } from 'react';

// Mini SVG thumbnails for exercise list cards
const THUMBS = {
  'quad-sets': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <line x1={15} y1={48} x2={50} y2={49} stroke="#E8C4A0" strokeWidth={4} strokeLinecap="round" />
      <line x1={50} y1={49} x2={58} y2={47} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <circle cx={12} cy={46} r={5} fill="#E8C4A0" />
      <ellipse cx={35} cy={46} rx={10} ry={2.5} fill="rgba(212,168,83,0.3)" stroke="#D4A853" strokeWidth="0.5" />
    </g>
  ),
  'straight-leg-raise': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={12} cy={46} r={5} fill="#E8C4A0" />
      <line x1={18} y1={47} x2={32} y2={48} stroke="#B0C4BB" strokeWidth={6} strokeLinecap="round" />
      <line x1={32} y1={46} x2={48} y2={30} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={48} y1={30} x2={55} y2={27} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'heel-slides': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={12} cy={46} r={5} fill="#E8C4A0" />
      <line x1={18} y1={47} x2={32} y2={48} stroke="#B0C4BB" strokeWidth={6} strokeLinecap="round" />
      <line x1={32} y1={47} x2={43} y2={36} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={43} y1={36} x2={40} y2={50} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
      <path d="M 52,50 L 42,50" fill="none" stroke="#B7ACA0" strokeWidth="1" strokeDasharray="2 1" markerEnd="url(#th-arrow)" />
    </g>
  ),
  'wall-sits': (
    <g>
      <rect x={10} y={15} width={4} height={40} rx={1} fill="#E2E0DF" />
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={22} cy={24} r={5} fill="#E8C4A0" />
      <line x1={22} y1={30} x2={20} y2={42} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={20} y1={42} x2={28} y2={48} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={28} y1={48} x2={28} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'mini-squats': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={30} cy={20} r={5} fill="#E8C4A0" />
      <line x1={30} y1={26} x2={28} y2={40} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={28} y1={40} x2={22} y2={48} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={22} y1={48} x2={24} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={28} y1={40} x2={36} y2={48} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={36} y1={48} x2={36} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'step-ups': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <rect x={25} y={47} width={22} height={8} rx={2} fill="#B7ACA0" />
      <circle cx={30} cy={18} r={5} fill="#E8C4A0" />
      <line x1={30} y1={24} x2={30} y2={38} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={30} y1={38} x2={32} y2={46} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={30} y1={38} x2={22} y2={54} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  'hamstring-curls': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={30} cy={14} r={5} fill="#E8C4A0" />
      <line x1={30} y1={20} x2={30} y2={36} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={30} y1={36} x2={28} y2={48} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={28} y1={48} x2={28} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={30} y1={36} x2={34} y2={44} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={34} y1={44} x2={32} y2={36} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'clamshells': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={14} cy={42} r={5} fill="#E8C4A0" />
      <line x1={20} y1={44} x2={36} y2={45} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={36} y1={48} x2={44} y2={44} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={44} y1={44} x2={48} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={36} y1={44} x2={44} y2={32} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={44} y1={32} x2={48} y2={40} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'single-leg-balance': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={30} cy={14} r={5} fill="#E8C4A0" />
      <line x1={30} y1={20} x2={30} y2={36} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={30} y1={36} x2={28} y2={50} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={28} y1={50} x2={28} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={30} y1={36} x2={38} y2={44} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={38} y1={44} x2={36} y2={48} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={30} y1={24} x2={22} y2={30} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={30} y1={24} x2={38} y2={30} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  'bridge': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={12} cy={45} r={5} fill="#E8C4A0" />
      <line x1={16} y1={44} x2={32} y2={36} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={36} x2={40} y2={36} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={40} y1={36} x2={42} y2={50} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  'pendulum': (
    <g>
      <rect x={28} y={18} width={18} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={24} cy={18} r={5} fill="#E8C4A0" />
      <line x1={25} y1={24} x2={28} y2={38} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={25} y1={26} x2={40} y2={20} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={28} y1={28} x2={18} y2={46} stroke="#D4A878" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={17} cy={48} rx={6} ry={4} fill="none" stroke="#B7ACA0" strokeWidth="0.8" strokeDasharray="2 1" />
    </g>
  ),
  'wall-angels': (
    <g>
      <rect x={10} y={10} width={4} height={47} rx={1} fill="#E2E0DF" />
      <circle cx={22} cy={16} r={5} fill="#E8C4A0" />
      <line x1={22} y1={22} x2={22} y2={40} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={22} y1={26} x2={16} y2={20} stroke="#D4A878" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={16} y1={20} x2={17} y2={12} stroke="#D4A878" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={22} y1={26} x2={28} y2={20} stroke="#D4A878" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={28} y1={20} x2={27} y2={12} stroke="#D4A878" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={22} y1={40} x2={20} y2={54} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  'cat-cow': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={16} cy={30} r={4} fill="#E8C4A0" />
      <path d="M 20,34 Q 32,24 45,34" fill="none" stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={20} y1={37} x2={19} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={45} y1={37} x2={46} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'bird-dog': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={18} cy={30} r={4} fill="#E8C4A0" />
      <line x1={22} y1={33} x2={42} y2={34} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={22} y1={36} x2={24} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={42} y1={36} x2={44} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={22} y1={33} x2={8} y2={30} stroke="#D4A878" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={42} y1={33} x2={56} y2={30} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'ankle-abc': (
    <g>
      <rect x={15} y={36} width={20} height={14} rx={3} fill="#E2E0DF" />
      <circle cx={25} cy={22} r={5} fill="#E8C4A0" />
      <line x1={25} y1={28} x2={25} y2={36} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={25} y1={36} x2={30} y2={42} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={30} y1={42} x2={36} y2={48} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
      <text x={42} y={50} fontSize="10" fill="#708E86" fontFamily="Tenor Sans" opacity="0.5">ABC</text>
    </g>
  ),

  // ─── Runner exercises ───
  'leg-swings': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <rect x={8} y={10} width={3} height={47} rx={1} fill="#E2E0DF" />
      <circle cx={28} cy={16} r={5} fill="#E8C4A0" />
      <line x1={28} y1={22} x2={28} y2={40} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={28} y1={40} x2={26} y2={54} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={28} y1={40} x2={48} y2={30} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 20,52 Q 38,30 50,28" fill="none" stroke="#B7ACA0" strokeWidth="0.8" strokeDasharray="2 1" />
    </g>
  ),
  'world-greatest-stretch': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={26} cy={20} r={4} fill="#E8C4A0" />
      <line x1={26} y1={24} x2={32} y2={36} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={36} x2={44} y2={42} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={44} y1={42} x2={50} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={32} y1={36} x2={18} y2={48} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={18} y1={48} x2={8} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={26} y1={28} x2={42} y2={45} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={26} y1={28} x2={28} y2={10} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  'walking-lunges': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={32} cy={12} r={4} fill="#E8C4A0" />
      <line x1={32} y1={16} x2={32} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={32} x2={44} y2={42} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={44} y1={42} x2={48} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={32} y1={32} x2={20} y2={45} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={20} y1={45} x2={12} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'high-knees': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={32} cy={12} r={4} fill="#E8C4A0" />
      <line x1={32} y1={16} x2={32} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={28} y1={32} x2={22} y2={26} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={22} y1={26} x2={28} y2={36} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={36} y1={32} x2={36} y2={48} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={36} y1={48} x2={36} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'butt-kicks': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={32} cy={12} r={4} fill="#E8C4A0" />
      <line x1={32} y1={16} x2={32} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={28} y1={32} x2={28} y2={42} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={28} y1={42} x2={22} y2={32} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={36} y1={32} x2={36} y2={48} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={36} y1={48} x2={36} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'monster-walks': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={32} cy={14} r={4} fill="#E8C4A0" />
      <line x1={32} y1={18} x2={32} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={28} y1={32} x2={22} y2={42} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={22} y1={42} x2={24} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={36} y1={32} x2={42} y2={42} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={42} y1={42} x2={40} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={32} cy={38} rx={14} ry={2} fill="none" stroke="#D4A853" strokeWidth="1" strokeDasharray="2 1" />
    </g>
  ),
  'banded-clamshells': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={14} cy={42} r={5} fill="#E8C4A0" />
      <line x1={20} y1={44} x2={36} y2={45} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={36} y1={48} x2={44} y2={44} stroke="#E8C4A0" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={44} y1={44} x2={48} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={36} y1={44} x2={44} y2={32} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={44} y1={32} x2={48} y2={40} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={44} cy={38} rx={2} ry={6} fill="none" stroke="#D4A853" strokeWidth="1" strokeDasharray="2 1" />
    </g>
  ),
  'standing-quad-stretch': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <rect x={8} y={10} width={3} height={47} rx={1} fill="#E2E0DF" />
      <circle cx={28} cy={14} r={4} fill="#E8C4A0" />
      <line x1={28} y1={18} x2={28} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={26} y1={20} x2={14} y2={26} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={30} y1={20} x2={36} y2={36} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={28} y1={32} x2={26} y2={48} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={26} y1={48} x2={26} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={30} y1={32} x2={38} y2={38} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={38} y1={38} x2={32} y2={32} stroke="#D4A878" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'standing-hamstring-stretch': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <rect x={42} y={42} width={18} height={6} rx={1} fill="#B7ACA0" />
      <circle cx={20} cy={14} r={4} fill="#E8C4A0" />
      <line x1={20} y1={18} x2={24} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" transform="rotate(15 22 25)" />
      <line x1={24} y1={32} x2={22} y2={48} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={22} y1={48} x2={22} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={26} y1={32} x2={48} y2={42} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  'calf-stretch-wall': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <rect x={5} y={5} width={4} height={52} rx={1} fill="#E2E0DF" />
      <circle cx={22} cy={18} r={4} fill="#E8C4A0" />
      <line x1={22} y1={22} x2={28} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={20} y1={24} x2={10} y2={20} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={22} y1={28} x2={10} y2={26} stroke="#E8C4A0" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={28} y1={32} x2={32} y2={48} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={32} y1={48} x2={28} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={28} y1={32} x2={45} y2={50} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={45} y1={50} x2={54} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'pigeon-pose': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={12} cy={36} r={4} fill="#E8C4A0" />
      <line x1={16} y1={38} x2={32} y2={42} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={42} x2={42} y2={46} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={42} y1={46} x2={20} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={32} y1={42} x2={50} y2={48} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={50} y1={48} x2={58} y2={50} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'figure-4-stretch': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <circle cx={10} cy={42} r={4} fill="#E8C4A0" />
      <line x1={14} y1={44} x2={32} y2={46} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={46} x2={42} y2={32} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={42} y1={32} x2={50} y2={38} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={32} y1={46} x2={45} y2={36} stroke="#D4A878" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={45} y1={36} x2={52} y2={32} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'foam-roll-it-band': (
    <g>
      <rect x={5} y={52} width={55} height={3} rx={1} fill="#E2E0DF" />
      <ellipse cx={32} cy={48} rx={14} ry={4} fill="#B7ACA0" />
      <circle cx={10} cy={36} r={4} fill="#E8C4A0" />
      <line x1={14} y1={38} x2={32} y2={42} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={42} x2={50} y2={44} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={50} y1={44} x2={58} y2={46} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <path d="M 18,55 L 46,55" fill="none" stroke="#D4A853" strokeWidth="0.8" strokeDasharray="2 1" />
    </g>
  ),
  'hip-flexor-stretch': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <circle cx={28} cy={16} r={4} fill="#E8C4A0" />
      <line x1={28} y1={20} x2={30} y2={34} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={30} y1={34} x2={42} y2={42} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={42} y1={42} x2={44} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <line x1={28} y1={36} x2={16} y2={48} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={16} y1={48} x2={8} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'terminal-knee-extension': (
    <g>
      <rect x={5} y={55} width={55} height={2} rx={1} fill="#E2E0DF" />
      <rect x={5} y={20} width={4} height={37} rx={1} fill="#E2E0DF" />
      <circle cx={32} cy={12} r={4} fill="#E8C4A0" />
      <line x1={32} y1={16} x2={32} y2={32} stroke="#B0C4BB" strokeWidth={5} strokeLinecap="round" />
      <line x1={32} y1={32} x2={32} y2={44} stroke="#D4A878" strokeWidth={4} strokeLinecap="round" />
      <line x1={32} y1={44} x2={32} y2={54} stroke="#E8C4A0" strokeWidth={3} strokeLinecap="round" />
      <path d="M 9,38 Q 22,36 32,38" fill="none" stroke="#D4A853" strokeWidth="1.5" strokeDasharray="2 1" />
    </g>
  ),
};

export default function ExerciseThumbnail({ exerciseId }) {
  const thumb = THUMBS[exerciseId];
  if (!thumb) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
      }}>
        🏋️
      </div>
    );
  }

  return (
    <svg viewBox="0 0 64 58" style={{ width: '100%', height: '100%', display: 'block' }}>
      {thumb}
    </svg>
  );
}
