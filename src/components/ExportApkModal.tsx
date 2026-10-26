import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  QrCode,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Copy,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface ExportApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportApkModal: React.FC<ExportApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const appUrl = window.location.origin;

  useEffect(() => {
    // Check if already in standalone/installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    audioEngine.playSFX('levelup');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // If prompt not available, show alert guidance
      alert(
        'Para instalar LiaMp3 en tu Android:\n1. Toca el menú de tres puntos (⋮) en Chrome.\n2. Selecciona "Instalar aplicación" o "Agregar a pantalla principal".'
      );
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setIsCopied(true);
    audioEngine.playSFX('coin');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/publish?url=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0c0c18] border border-cyan-500/50 rounded-2xl shadow-2xl neon-glow-cyan overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#08080e]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                  EXPORTAR APK // INSTALAR LIAMP3
                </h2>
                <span className="text-[10px] font-mono-cyber text-pink-400 font-bold bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  ANDROID WEBAPK
                </span>
              </div>
              <p className="text-xs text-cyan-400/80 font-mono-cyber">
                INSTALACIÓN NATIVA EN ANDROID CON ICONO LIAMP3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* App Preview Card with Logo */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#12122b] to-[#1d102e] border border-cyan-500/30">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20 bg-black">
              <img
                src="/src/assets/images/liamp3_logo_icon_1793051852636.jpg"
                alt="LiaMp3 Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black font-cyber text-white tracking-wider">
                  Lia<span className="text-cyan-400">Mp3</span>
                </h3>
                <span className="text-[10px] font-mono-cyber px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">
                  v1.0.0 APK
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono-cyber mt-0.5">
                Reproductor Gamer & Cyber Anime con 10 videos silenciosos de fondo, ecualizador DSP y soporte offline.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-mono-cyber text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Compatible con Android 8.0 a Android 15+</span>
              </div>
            </div>
          </div>

          {/* Option 1: Instalar Directo en Android (WebAPK Nativo) */}
          <div className="p-4 rounded-xl bg-[#090912] border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-cyber tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                OPCIÓN 1: INSTALAR DIRECTO EN TU TELÉFONO
              </span>
              <span className="text-[10px] font-mono-cyber text-emerald-400 font-bold">RECOMENDADO</span>
            </div>
            <p className="text-xs text-slate-400 font-mono-cyber">
              Instala LiaMp3 en tu pantalla de inicio como una aplicación Android nativa con su icono, pantalla completa y acceso a almacenamiento local.
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-cyber font-bold tracking-wider text-sm shadow-lg shadow-cyan-400/25 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              {isInstalled ? '¡LiaMp3 Ya está Instalada!' : 'Instalar LiaMp3 en mi Android'}
            </button>
          </div>

          {/* Option 2: Generar y Descargar APK (PWABuilder / Google Play Package) */}
          <div className="p-4 rounded-xl bg-[#090912] border border-pink-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-cyber tracking-wider text-pink-300 uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-pink-400" />
                OPCIÓN 2: GENERAR ARCHIVO .APK / .AAB
              </span>
              <span className="text-[10px] font-mono-cyber text-slate-500">PAQUETE NATIVO</span>
            </div>
            <p className="text-xs text-slate-400 font-mono-cyber">
              Genera un archivo ejecutable <strong>.apk</strong> o <strong>.aab</strong> firmado para instalar manualmente (sideload) o subir a tiendas Android.
            </p>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-cyber font-bold tracking-wider text-sm shadow-lg shadow-pink-600/25 transition-transform active:scale-95 text-center"
            >
              <ExternalLink className="w-4 h-4" />
              Compilar y Descargar APK en PWABuilder (1-Clic)
            </a>
          </div>

          {/* Option 3: Descargar Paquete Nativo Android (.ZIP) */}
          <div className="p-4 rounded-xl bg-[#090912] border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-cyber tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
                <Download className="w-4 h-4 text-cyan-400" />
                OPCIÓN 3: DESCARGAR PROYECTO ANDROID (.ZIP)
              </span>
              <span className="text-[10px] font-mono-cyber text-cyan-400 font-bold">CÓDIGO FUENTE APK</span>
            </div>
            <p className="text-xs text-slate-400 font-mono-cyber">
              Descarga el paquete completo de Android Studio con `build.gradle`, `AndroidManifest.xml`, WebView acelerada por GPU e iconos oficiales listo para compilar con `./gradlew assembleDebug`.
            </p>

            <a
              href="/LiaMp3-Android-Package.zip"
              download="LiaMp3-Android-Package.zip"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-cyber font-bold tracking-wider text-sm transition-transform active:scale-95 text-center"
            >
              <Download className="w-4 h-4" />
              Descargar LiaMp3-Android-Package.zip (668 KB)
            </a>
          </div>

          {/* Option 3: Abrir en el Teléfono (Copiar Enlace) */}
          <div className="p-4 rounded-xl bg-[#090912] border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold font-cyber tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-yellow-400" />
              ABRIR DIRECTAMENTE EN TU TELÉFONO
            </span>
            <p className="text-xs text-slate-400 font-mono-cyber">
              Abre este enlace en el navegador Chrome de tu teléfono para probar e instalar:
            </p>
            <div className="flex items-center gap-2 p-2 bg-black border border-slate-700 rounded-lg">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="w-full bg-transparent text-xs text-cyan-300 font-mono-cyber focus:outline-none"
              />
              <button
                onClick={copyUrl}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-cyber font-bold shrink-0 flex items-center gap-1"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#08080e] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono-cyber text-slate-400">
            LiaMp3 Audio System · 100% Sin Publicidad ni Rastreadores
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-cyber font-bold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
