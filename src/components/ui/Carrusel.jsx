import { useEffect, useState } from "react";

/**
 * Carrusel simple, sin librerías externas.
 *
 * Uso:
 * <Carrusel
 *   imagenes={[
 *     { src: "/assets/clinica-1.jpg", titulo: "Atención de calidad", texto: "..." },
 *     { src: "/assets/clinica-2.jpg", titulo: "Tecnología moderna", texto: "..." },
 *   ]}
 * />
 *
 * Las imágenes deben vivir en /public/assets/ (o importarse desde src/assets/
 * y pasarlas como import). No se incluyen imágenes por defecto: agrega las
 * tuyas con licencia libre (Unsplash, Pexels) o fotos propias del proyecto.
 */
export default function Carrusel({ imagenes, intervaloMs = 5000 }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, intervaloMs);
    return () => clearInterval(timer);
  }, [imagenes.length, intervaloMs]);

  if (!imagenes || imagenes.length === 0) return null;

  const actual = imagenes[indice];

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden">
      <img
        src={actual.src}
        alt={actual.titulo}
        className="w-full h-full object-cover transition-opacity duration-500"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

      <div className="absolute bottom-0 left-0 p-6 text-white">
        <h3 className="text-xl font-semibold">{actual.titulo}</h3>
        {actual.texto && <p className="text-sm text-white/80 mt-1">{actual.texto}</p>}
      </div>

      {imagenes.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {imagenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === indice ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Ir a la imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
