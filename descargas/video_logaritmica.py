"""
Video MATEM-UNA · Precálculo
Ecuación logarítmica: log₂(x) + log₂(x − 2) = 3

Una sola escena de Manim con seis bloques (máximo pedido: 6):
    1. Portada y planteamiento
    2. Repaso de P1, P2 y P3 (con ejemplos numéricos y gráfica de y = log₂x)
    3. Dominio en la recta numérica
    4. Resolución, pasos 1 a 4 (cadena con el paso anterior atenuado)
    5. Validación de los candidatos con el dominio
    6. Comprobación, S = {4} y cierre

No hay LaTeX en el equipo: todo se escribe con Text/MarkupText y caracteres
Unicode (log₂, x², 2³), sin MathTex ni include_numbers.

Voz integrada: cada bloque de narración se sintetiza con gTTS
(lang="es", tld="com.mx", español latinoamericano) y se inserta con
add_sound en el instante en que empieza su animación. Si gTTS no puede
conectarse, se usa como respaldo espeak-ng con la voz es-419 y se avisa
en consola; para forzar solo gTTS use VOZ=gtts.

Cada bloque deja registro (segundo de inicio, duración, motor y texto) en
media/voz_log.json, que se usa para verificar voz contra pantalla.

Render:
    manim -ql video_logaritmica.py EcuacionLogaritmica   # prueba
    manim -qm video_logaritmica.py EcuacionLogaritmica   # final 720p
"""

import hashlib
import json
import os
import shutil
import subprocess
import sys

from manim import *

# ---------------------------------------------------------------------------
# Paleta (no existe estilo_matia.py en la carpeta: se definen aquí los C_*)
# ---------------------------------------------------------------------------
C_FONDO = "#0E1A2B"
C_TEXTO = "#F2F2F2"
C_SUAVE = "#9AA5B1"
C_P1 = "#4FC3F7"       # P1 · Existencia (celeste)
C_P2 = "#FFB74D"       # P2 · Producto (naranja)
C_P3 = "#CE93D8"       # P3 · Definición (morado)
C_ALG = "#B0BEC5"      # pasos de álgebra (gris)
C_OK = "#66BB6A"       # aceptado
C_ALERTA = "#EF5350"   # rechazado
C_GRAF = "#FFF176"     # curvas

FUENTE = "DejaVu Sans"
ATENUADO = 0.35

config.background_color = C_FONDO
# Sin caché: con animaciones cacheadas Manim deja skip_animations activo y
# descarta en silencio los add_sound siguientes (la voz quedaba cortada).
config.disable_caching = True


def T(texto, size=34, color=C_TEXTO, **kw):
    return Text(texto, font=FUENTE, font_size=size, color=color, **kw)


def M(markup, size=34, color=C_TEXTO, **kw):
    return MarkupText(markup, font=FUENTE, font_size=size, color=color, **kw)


def etiqueta(texto, color, size=24):
    t = T(texto, size=size, color=color, weight=BOLD)
    caja = SurroundingRectangle(t, color=color, buff=0.12, corner_radius=0.1,
                                stroke_width=2.5)
    caja.set_fill(color, opacity=0.12)
    return VGroup(caja, t)


def titulo(texto):
    return T(texto, size=40, weight=BOLD).to_edge(UP, buff=0.35)


# ---------------------------------------------------------------------------
# Voz
# ---------------------------------------------------------------------------
DIR_VOZ = os.path.join("media", "voz")
_GTTS_OK = None   # None = sin probar; True/False tras el primer intento


def _duracion(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def sintetizar(texto):
    """Devuelve (ruta, duración, motor). Cachea por hash del texto."""
    global _GTTS_OK
    os.makedirs(DIR_VOZ, exist_ok=True)
    h = hashlib.sha1(texto.encode("utf-8")).hexdigest()[:12]
    modo = os.environ.get("VOZ", "auto")

    ruta_g = os.path.join(DIR_VOZ, f"gtts_{h}.mp3")
    if os.path.exists(ruta_g):
        return ruta_g, _duracion(ruta_g), "gtts"
    if _GTTS_OK is not False:
        try:
            from gtts import gTTS
            gTTS(texto, lang="es", tld="com.mx", slow=False).save(ruta_g)
            _GTTS_OK = True
            return ruta_g, _duracion(ruta_g), "gtts"
        except Exception as e:  # sin red o servicio no disponible
            _GTTS_OK = False
            if os.path.exists(ruta_g):
                os.remove(ruta_g)
            if modo == "gtts":
                raise
            print(f"\n[AVISO] gTTS no disponible ({type(e).__name__}). "
                  "Se usa el respaldo espeak-ng es-419.\n", file=sys.stderr)

    ruta_e = os.path.join(DIR_VOZ, f"espeak_{h}.wav")
    if not os.path.exists(ruta_e):
        if not shutil.which("espeak-ng"):
            raise RuntimeError("Ni gTTS ni espeak-ng están disponibles.")
        subprocess.run(["espeak-ng", "-v", "es-419", "-s", "200", "-p", "45",
                        "-g", "3", "-w", ruta_e, texto], check=True)
    return ruta_e, _duracion(ruta_e), "espeak-ng"


# ---------------------------------------------------------------------------
# Escena
# ---------------------------------------------------------------------------
class EcuacionLogaritmica(Scene):

    # -- utilidades de narración ---------------------------------------------
    def setup(self):
        self.registro = []
        self.bloque = ""

    def narrar(self, texto, *anims, rt=None, pausa=0.15):
        """Inicia la voz y, en el mismo instante, las animaciones.
        Luego espera lo que falte para que termine la voz."""
        ruta, dur, motor = sintetizar(texto)
        t0 = self.renderer.time
        self.add_sound(ruta)
        self.registro.append({"escena": self.bloque, "inicio_s": round(t0, 2),
                              "dur_s": round(dur, 2), "motor": motor,
                              "texto": texto})
        usado = 0.0
        if anims:
            run = rt if rt is not None else min(1.2, max(0.6, dur * 0.5))
            self.play(*anims, run_time=run)
            usado = run
        if dur - usado > 0:
            self.wait(dur - usado)
        if pausa:
            self.wait(pausa)

    def limpiar(self, rt=0.5):
        if self.mobjects:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=rt)

    def recta(self, y=-0.4):
        """Recta numérica de −4 a 7 con números en Text."""
        nl = NumberLine(x_range=[-4, 7, 1], length=11, color=C_TEXTO,
                        include_tip=True, tip_width=0.2, tip_height=0.2,
                        stroke_width=3).shift(UP * y)
        nums = VGroup(*[
            T(str(n).replace("-", "−"), size=24, color=C_SUAVE)
            .next_to(nl.n2p(n), DOWN, buff=0.22)
            for n in range(-4, 7)])
        return nl, nums

    def intervalo(self, nl):
        """]2, +∞[ sombreado sobre la recta."""
        barra = Line(nl.n2p(2), nl.n2p(6.85), color=C_P1, stroke_width=10)
        barra.set_opacity(0.85)
        hueco = Circle(radius=0.12, color=C_P1, stroke_width=4)
        hueco.set_fill(C_FONDO, opacity=1).move_to(nl.n2p(2))
        lab = T("]2, +∞[", size=34, color=C_P1, weight=BOLD)
        lab.next_to(nl.n2p(4.5), UP, buff=0.45)
        return VGroup(barra, hueco), lab

    # -- guion -----------------------------------------------------------------
    def construct(self):
        self.escena_1()
        self.escena_2()
        self.escena_3()
        self.escena_4()
        self.escena_5()
        self.escena_6()
        os.makedirs("media", exist_ok=True)
        with open(os.path.join("media", "voz_log.json"), "w",
                  encoding="utf-8") as f:
            json.dump(self.registro, f, ensure_ascii=False, indent=2)

    # 1. Portada y planteamiento ------------------------------------------------
    def escena_1(self):
        self.bloque = "1 Portada"
        tit = T("Ecuaciones logarítmicas", size=56, weight=BOLD)
        sub = T("MATEM-UNA · Precálculo", size=30, color=C_SUAVE)
        sub.next_to(tit, DOWN, buff=0.35)
        VGroup(tit, sub).move_to(UP * 2.4)
        self.narrar("Resolvamos una ecuación logarítmica.",
                    Write(tit), FadeIn(sub, shift=UP * 0.3), rt=1.6)

        ec = T("log₂(x) + log₂(x − 2) = 3", size=48)
        ec.move_to(UP * 0.2)
        self.ec = ec
        self.narrar("Logaritmo en base dos de equis, más "
                    "logaritmo en base dos de equis menos dos, igual a tres.",
                    Write(ec), rt=1.8)

        preg = T("¿Para qué valores de x tiene sentido esta ecuación?",
                 size=32, color=C_P1)
        preg.next_to(ec, DOWN, buff=0.9)
        self.narrar("Piense: ¿para qué valores de equis "
                    "tiene sentido esta ecuación?",
                    FadeIn(preg, shift=UP * 0.2), pausa=2.1)
        self.limpiar()

    # 2. Repaso -----------------------------------------------------------------
    def escena_2(self):
        self.bloque = "2 Repaso"
        tit = titulo("Repaso de propiedades")
        base = M("base b &gt; 0,  b ≠ 1", size=24, color=C_SUAVE)
        base.next_to(tit, DOWN, buff=0.12)
        self.narrar("Primero, repasemos tres propiedades.",
                    FadeIn(tit), FadeIn(base), rt=0.8, pausa=0.1)

        x_izq = -6.7

        def fila(lbl, color, enunciado, ejemplo, y):
            e = etiqueta(lbl, color, size=24)
            e.move_to([0, y, 0]).align_to([x_izq, 0, 0], LEFT)
            enun = M(enunciado, size=27)
            enun.next_to(e, DOWN, buff=0.18).align_to(e, LEFT)
            ej = M(ejemplo, size=27, color=color)
            ej.next_to(enun, DOWN, buff=0.14).align_to(e, LEFT)
            return e, enun, ej

        # P1 · Existencia, con la gráfica de y = log₂x
        e1, n1, j1 = fila(
            "P1 · Existencia", C_P1,
            "log<sub>b</sub>(M) existe solo si M &gt; 0",
            "Ejemplo: log₂(−2) no existe", 1.75)
        self.narrar("Propiedad uno, existencia: el logaritmo de eme existe "
                    "solo si eme es positivo.",
                    FadeIn(e1), FadeIn(n1), rt=1.0)

        ax = Axes(x_range=[-3, 8, 1], y_range=[-3, 3.5, 1], x_length=4.7,
                  y_length=3.8, tips=False,
                  axis_config={"color": C_SUAVE, "stroke_width": 2})
        ax.move_to([4.5, -0.3, 0])
        xs = VGroup(*[T(str(n).replace("-", "−"), size=18, color=C_SUAVE)
                      .next_to(ax.c2p(n, 0), DOWN, buff=0.24)
                      for n in (-2, 2, 4, 8) if n <= 8])
        curva = ax.plot(lambda x: np.log2(x), x_range=[0.13, 8, 0.02],
                        color=C_GRAF, stroke_width=4)
        lab_c = T("y = log₂x", size=24, color=C_GRAF)
        lab_c.move_to(ax.c2p(3.2, 3.1))
        zona = Rectangle(width=ax.c2p(0, 0)[0] - ax.c2p(-3, 0)[0],
                         height=3.8, stroke_width=0)
        zona.set_fill(C_ALERTA, opacity=0.13)
        zona.move_to([(ax.c2p(-3, 0)[0] + ax.c2p(0, 0)[0]) / 2,
                      ax.get_center()[1], 0])
        self.narrar("Su gráfica en base dos vive solo a la derecha del cero.",
                    LaggedStart(AnimationGroup(Create(ax), FadeIn(xs),
                                               FadeIn(zona)),
                                AnimationGroup(Create(curva), FadeIn(lab_c)),
                                lag_ratio=0.45), rt=2.6)

        cruz = Cross(scale_factor=0.11, stroke_color=C_ALERTA,
                     stroke_width=5).move_to(ax.c2p(-2, 0))
        self.narrar("Por eso, logaritmo en base dos de menos dos no existe.",
                    Create(cruz), FadeIn(j1), rt=0.9)

        # P2 · Producto
        e2, n2, j2 = fila(
            "P2 · Producto", C_P2,
            "log<sub>b</sub>(M) + log<sub>b</sub>(N) = "
            "log<sub>b</sub>(M·N),  M, N &gt; 0",
            "Ejemplo: log₂4 + log₂2 = 2 + 1 = 3 = log₂8", -0.25)
        self.narrar("Propiedad dos, producto: la suma de logaritmos es el "
                    "logaritmo del producto.",
                    FadeIn(e2), FadeIn(n2), rt=1.0)
        self.narrar("Logaritmo en base dos de cuatro más el de dos: dos más "
                    "uno, tres, que es logaritmo en base dos de ocho.",
                    FadeIn(j2, shift=RIGHT * 0.2), rt=1.0)

        # P3 · Definición
        e3, n3, j3 = fila(
            "P3 · Definición", C_P3,
            "log<sub>b</sub>(M) = c   ⇔   b<sup>c</sup> = M",
            "Ejemplo: log₂8 = 3   ⇔   2³ = 8", -2.25)
        self.narrar("Propiedad tres, definición: logaritmo en base be de eme "
                    "igual a ce, equivale a be a la ce igual a eme.",
                    FadeIn(e3), FadeIn(n3), rt=1.0)
        self.narrar("Así, logaritmo en base dos de ocho es tres, porque dos "
                    "al cubo es ocho.",
                    FadeIn(j3, shift=RIGHT * 0.2), rt=1.0)
        self.limpiar()

    # 3. Dominio ----------------------------------------------------------------
    def escena_3(self):
        self.bloque = "3 Dominio"
        tit = titulo("Dominio")
        ec = T("log₂(x) + log₂(x − 2) = 3", size=38).next_to(tit, DOWN, buff=0.3)
        c1 = T("x > 0", size=34)
        c2 = T("x − 2 > 0", size=34)
        y_ = T("y", size=30, color=C_SUAVE)
        conds = VGroup(c1, y_, c2).arrange(RIGHT, buff=0.5).move_to(UP * 1.3)
        tag = etiqueta("P1", C_P1).next_to(conds, RIGHT, buff=0.6)
        self.narrar("Por la propiedad uno, equis mayor que cero, y equis "
                    "menos dos mayor que cero.",
                    FadeIn(tit), FadeIn(ec), FadeIn(conds), FadeIn(tag),
                    rt=1.2)

        res = T("⇒  x > 2", size=38, color=C_P1, weight=BOLD)
        res.next_to(conds, DOWN, buff=0.35)
        self.narrar("Ambas se cumplen si equis es mayor que dos.", Write(res), rt=1.0)

        nl, nums = self.recta(y=-1.6)
        som, lab = self.intervalo(nl)
        self.narrar("En la recta: el intervalo abierto de dos a más "
                    "infinito.",
                    LaggedStart(AnimationGroup(Create(nl), FadeIn(nums)),
                                AnimationGroup(Create(som), FadeIn(lab)),
                                lag_ratio=0.5), rt=2.0, pausa=0.5)
        self.limpiar()

    # 4. Resolución --------------------------------------------------------------
    def escena_4(self):
        self.bloque = "4 Resolucion"
        tit = titulo("Resolución")
        dom = T("Dominio: x > 2", size=24, color=C_P1).to_corner(UR, buff=0.4)
        x0, x_tag = -5.6, 5.9
        ys = [2.35, 1.35, 0.35, -0.65, -1.65]

        def linea(txt, y):
            return T(txt, size=36).move_to([0, y, 0]).align_to([x0, 0, 0], LEFT)

        def tag(txt, color, y):
            return etiqueta(txt, color).move_to([0, y, 0]) \
                .align_to([x_tag, 0, 0], RIGHT)

        l0 = linea("log₂(x) + log₂(x − 2) = 3", ys[0])

        pred = T("Predicción: ¿cuántas soluciones tendrá?", size=30,
                 color=C_GRAF).move_to(DOWN * 2.9)
        self.narrar("Antes de resolver, prediga: ¿cuántas soluciones "
                    "tendrá?", FadeIn(tit), FadeIn(dom), FadeIn(l0),
                    FadeIn(pred, shift=UP * 0.2), pausa=2.1)
        self.play(FadeOut(pred), run_time=0.4)

        pasos = [
            ("log₂(x(x − 2)) = 3", "P2", C_P2,
             "Paso uno, propiedad dos: logaritmo del producto."),
            ("x(x − 2) = 2³ = 8", "P3", C_P3,
             "Paso dos, propiedad tres: el producto es dos al cubo, ocho."),
            ("x² − 2x − 8 = 0", "álgebra", C_ALG,
             "Paso tres: equis al cuadrado, menos dos equis, menos ocho, "
             "igual a cero."),
            ("(x − 4)(x + 2) = 0  ⇒  x = 4  o  x = −2", "álgebra", C_ALG,
             "Paso cuatro: factorizamos. Candidatos: equis igual a "
             "cuatro, o menos dos."),
        ]
        visibles = VGroup(l0)
        for i, (txt, lbl, col, voz) in enumerate(pasos, start=1):
            li = linea(txt, ys[i])
            tg = tag(lbl, col, ys[i])
            self.narrar(voz,
                        visibles.animate.set_opacity(ATENUADO),
                        FadeIn(li, shift=DOWN * 0.25), FadeIn(tg), rt=1.1)
            visibles.add(li, tg)
        self.wait(0.4)
        self.limpiar()

    # 5. Validación -------------------------------------------------------------
    def escena_5(self):
        self.bloque = "5 Validacion"
        tit = titulo("Validación con el dominio")
        cand = T("Candidatos:  x = 4  o  x = −2", size=34).next_to(tit, DOWN,
                                                                   buff=0.4)
        nl, nums = self.recta(y=-0.6)
        som, lab = self.intervalo(nl)
        self.narrar("Validemos con el dominio en la recta numérica.",
                    FadeIn(tit), FadeIn(cand), Create(nl), FadeIn(nums),
                    FadeIn(som), FadeIn(lab), rt=1.4)

        p_m2 = Dot(nl.n2p(-2), radius=0.13, color=C_ALERTA)
        r_m2 = VGroup(T("x = −2", size=28, color=C_ALERTA, weight=BOLD),
                      T("fuera de ]2, +∞[", size=24, color=C_ALERTA),
                      T("✗ se rechaza", size=28, color=C_ALERTA, weight=BOLD)
                      ).arrange(DOWN, buff=0.12)
        r_m2.next_to(nl.n2p(-2), DOWN, buff=0.75)
        t_m2 = etiqueta("P1", C_P1).next_to(r_m2, LEFT, buff=0.3)
        self.narrar("Menos dos queda fuera: por la propiedad uno, se "
                    "rechaza.",
                    GrowFromCenter(p_m2), FadeIn(r_m2), FadeIn(t_m2), rt=1.1)

        p_4 = Dot(nl.n2p(4), radius=0.13, color=C_OK)
        r_4 = VGroup(T("x = 4", size=28, color=C_OK, weight=BOLD),
                     T("dentro de ]2, +∞[", size=24, color=C_OK),
                     T("✓ se acepta", size=28, color=C_OK, weight=BOLD)
                     ).arrange(DOWN, buff=0.12)
        r_4.next_to(nl.n2p(4), DOWN, buff=0.75)
        self.narrar("Cuatro está dentro: se acepta.",
                    GrowFromCenter(p_4), FadeIn(r_4), rt=1.0, pausa=0.8)
        self.limpiar()

    # 6. Comprobación y cierre --------------------------------------------------
    def escena_6(self):
        self.bloque = "6 Comprobacion"
        tit = titulo("Comprobación")
        a = T("x = 4:", size=36, color=C_OK).move_to([-4.8, 1.6, 0])
        l1 = T("log₂4 + log₂(4 − 2) = 3 ?", size=36)
        l1.next_to(a, RIGHT, buff=0.4)
        self.narrar("Comprobemos con equis igual a cuatro.",
                    FadeIn(tit), FadeIn(a), FadeIn(l1), rt=1.0)

        l2 = T("log₂4 + log₂2 = 2 + 1 = 3  ✓", size=40, color=C_TEXTO)
        l2[-1].set_color(C_OK)
        l2.move_to([0.3, 0.3, 0])
        tg = etiqueta("P3", C_P3).next_to(l2, RIGHT, buff=0.5)
        self.narrar("Logaritmo en base dos de cuatro más el de dos: dos "
                    "más uno, tres. Se cumple.",
                    l1.animate.set_opacity(ATENUADO), FadeIn(l2, shift=DOWN * 0.2),
                    FadeIn(tg), rt=1.2)

        sol = T("S = {4}", size=60, color=C_OK, weight=BOLD).move_to(DOWN * 1.7)
        caja = SurroundingRectangle(sol, color=C_OK, buff=0.25, corner_radius=0.15)
        self.narrar("El conjunto solución contiene solo al cuatro.",
                    Write(sol), Create(caja), rt=1.3, pausa=0.5)
        self.limpiar()

        fin1 = T("Siempre valide sus soluciones con el dominio.", size=34,
                 color=C_P1)
        fin2 = T("MATEM-UNA · Universidad Nacional, Costa Rica", size=26,
                 color=C_SUAVE)
        cierre = VGroup(fin1, fin2).arrange(DOWN, buff=0.5)
        self.narrar("Recuerde: siempre valide sus soluciones con el dominio.",
                    FadeIn(fin1), FadeIn(fin2), rt=1.2, pausa=1.3)
        self.play(FadeOut(cierre), run_time=0.8)
