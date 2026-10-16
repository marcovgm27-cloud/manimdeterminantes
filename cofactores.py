"""
Video: como se calcula un determinante por desarrollo de cofactores.

Continua la seccion 4 del video anterior (determinante.py, DeduccionFormula),
donde se dedujo que el determinante 2x2 es ad - bc.

Escenas (en orden):
    1. RepasoSeccion4     - recordamos ad - bc y planteamos el caso 3x3
    2. Menores            - que es el menor M_ij (tachar fila y columna)
    3. SignosCofactores   - C_ij = (-1)^(i+j) M_ij y el tablero de signos
    4. DesarrolloGeneral  - det(A) = a11 C11 + a12 C12 + a13 C13
    5. EjemploFila        - ejemplo numerico desarrollando por la fila 1
    6. EjemploColumna     - el mismo ejemplo por la columna 1 (aprovechando el 0)
    7. ResumenCofactores  - los pasos del metodo

Renderizar todo:
    manim -qh cofactores.py -a
"""

from manim import *

# Mismos colores que determinante.py
COLOR_I = GREEN_C
COLOR_J = RED_C
COLOR_AREA = YELLOW_C
COLOR_PIVOTE = YELLOW_C   # entrada a_ij que multiplica
COLOR_TACHADO = BLUE_C    # fila y columna eliminadas
COLOR_MENOR = TEAL_C      # submatriz que queda
COLOR_MAS = GREEN_C
COLOR_MENOS = RED_C

SIMBOLOS = [[f"a_{{{i}{j}}}" for j in range(1, 4)] for i in range(1, 4)]
EJEMPLO = [["2", "1", "3"], ["0", "4", "-1"], ["5", "-2", "1"]]  # det = -61


def titulo(texto):
    t = Text(texto, font_size=40, weight=BOLD)
    t.to_edge(UP)
    return t


def barras(datos, **kwargs):
    """Matriz con barras verticales (notacion de determinante)."""
    return Matrix(datos, left_bracket="|", right_bracket="|", **kwargs)


def submatriz(datos, i, j):
    return [[datos[r][c] for c in range(len(datos)) if c != j]
            for r in range(len(datos)) if r != i]


class UtilidadesCofactores:
    """Mixin para resaltar el menor M_ij dentro de una matriz 3x3.

    No hereda de Scene para que `manim -a` no la renderice como escena.
    """

    def partes_menor(self, M, i, j, n=3):
        e = M.get_entries()
        pivote = e[i * n + j]
        tachadas = VGroup(*[
            e[r * n + c] for r in range(n) for c in range(n)
            if (r == i or c == j) and not (r == i and c == j)
        ])
        restantes = VGroup(*[
            e[r * n + c] for r in range(n) for c in range(n)
            if r != i and c != j
        ])
        rects = VGroup(
            SurroundingRectangle(M.get_rows()[i], color=COLOR_TACHADO, buff=0.12),
            SurroundingRectangle(M.get_columns()[j], color=COLOR_TACHADO, buff=0.12),
        )
        return pivote, tachadas, restantes, rects

    def tachar(self, M, i, j):
        pivote, tachadas, restantes, rects = self.partes_menor(M, i, j)
        self.play(
            Create(rects),
            pivote.animate.set_color(COLOR_PIVOTE),
            tachadas.animate.set_opacity(0.25),
            restantes.animate.set_color(COLOR_MENOR),
        )
        return pivote, tachadas, restantes, rects

    def restaurar(self, M, partes, *extras):
        pivote, tachadas, restantes, rects = partes
        self.play(
            FadeOut(rects),
            pivote.animate.set_color(WHITE),
            tachadas.animate.set_opacity(1),
            restantes.animate.set_color(WHITE),
            *[FadeOut(x) for x in extras],
        )

    def extraer_menor(self, restantes, menor):
        """Copia las entradas que quedan hacia la matriz `menor` (ya ubicada)."""
        menor.get_entries().set_color(COLOR_MENOR)
        self.play(
            TransformFromCopy(restantes, menor.get_entries()),
            FadeIn(menor.get_brackets()),
            run_time=1.5,
        )


# ---------------------------------------------------------------------------
# 1. Repaso de la seccion 4
# ---------------------------------------------------------------------------
class RepasoSeccion4(Scene):
    def construct(self):
        t = Text("Desarrollo por cofactores", font_size=56, weight=BOLD)
        sub = Text("Cómo calcular determinantes de cualquier tamaño",
                   font_size=30, color=GREY_B).next_to(t, DOWN)
        self.play(Write(t))
        self.play(FadeIn(sub, shift=UP * 0.3))
        self.wait(1.5)
        self.play(FadeOut(sub), FadeOut(t))

        rec = titulo("Recordemos la sección 4")
        self.play(Write(rec))

        d2 = barras([["a", "b"], ["c", "d"]], h_buff=0.9).scale(1.2)
        igual = MathTex("=", "ad", "-", "bc").scale(1.4)
        igual[1].set_color(COLOR_MAS)
        igual[3].set_color(COLOR_MENOS)
        VGroup(d2, igual).arrange(RIGHT).shift(UP * 0.6)
        e = d2.get_entries()
        diag = Line(e[0].get_center(), e[3].get_center(), color=COLOR_MAS,
                    stroke_width=6).set_opacity(0.6)
        anti = Line(e[1].get_center(), e[2].get_center(), color=COLOR_MENOS,
                    stroke_width=6).set_opacity(0.6)
        self.play(Write(d2))
        self.play(Create(diag), Write(igual[:2]))
        self.play(Create(anti), Write(igual[2:]))

        nota = Text("Es el área (con signo) del paralelogramo",
                    font_size=28, color=COLOR_AREA).shift(DOWN * 1.2)
        self.play(FadeIn(nota))
        self.wait(2)

        grupo2 = VGroup(d2, igual, diag, anti)
        self.play(FadeOut(nota), grupo2.animate.scale(0.6).to_corner(UL).shift(DOWN * 0.9))

        pregunta = Text("¿Y si la matriz es 3×3?", font_size=36)
        pregunta.shift(UP * 1.6)
        etiqueta = VGroup(MathTex(r"\det(A) = "), barras(SIMBOLOS, h_buff=1.1))
        etiqueta.arrange(RIGHT).shift(DOWN * 0.6)
        self.play(Write(pregunta))
        self.play(Write(etiqueta))
        self.wait()

        idea = VGroup(
            Text("Idea: reducirlo a determinantes 2×2,", font_size=30),
            Text("que ya sabemos calcular.", font_size=30),
        ).arrange(DOWN).next_to(etiqueta, DOWN, buff=0.6)
        idea.set_color(COLOR_AREA)
        self.play(FadeIn(idea, shift=UP * 0.3))
        self.wait(2.5)
        self.play(*[FadeOut(m) for m in self.mobjects])


# ---------------------------------------------------------------------------
# 2. Menores
# ---------------------------------------------------------------------------
class Menores(UtilidadesCofactores, Scene):
    def construct(self):
        t = titulo("Paso 1: el menor  Mᵢⱼ")
        self.play(Write(t))

        A = Matrix(SIMBOLOS, h_buff=1.1)
        grupo = VGroup(MathTex("A ="), A).arrange(RIGHT)
        grupo.move_to([-3.5, 0.6, 0])
        self.play(Write(grupo))

        defin = VGroup(
            Text("El menor Mᵢⱼ es el determinante que queda", font_size=26),
            Text("al eliminar la fila i y la columna j.", font_size=26),
        ).arrange(DOWN).to_edge(DOWN, buff=0.6)
        self.play(FadeIn(defin))
        self.wait()

        for (i, j), espera in [((0, 0), 2.0), ((0, 1), 1.5), ((1, 2), 1.5)]:
            partes = self.tachar(A, i, j)
            explic = Text(f"fila {i + 1}, columna {j + 1}", font_size=26,
                          color=COLOR_TACHADO).next_to(A, UP, buff=0.4)
            menor = barras(submatriz(SIMBOLOS, i, j), h_buff=1.1)
            etiq = MathTex(f"M_{{{i + 1}{j + 1}}} =")
            res = VGroup(etiq, menor).arrange(RIGHT).move_to([3.2, 0.6, 0])
            self.play(FadeIn(explic), Write(etiq))
            self.extraer_menor(partes[2], menor)
            self.wait(espera)
            self.restaurar(A, partes, explic, res)

        cuantos = Text("Una matriz 3×3 tiene 9 menores, cada uno es un 2×2",
                       font_size=26, color=COLOR_AREA).next_to(A, UP, buff=0.4)
        cuantos.set_x(0)
        self.play(FadeIn(cuantos))
        self.wait(2)
        self.play(*[FadeOut(m) for m in self.mobjects])


# ---------------------------------------------------------------------------
# 3. Signos y cofactores
# ---------------------------------------------------------------------------
class SignosCofactores(UtilidadesCofactores, Scene):
    def construct(self):
        t = titulo("Paso 2: el cofactor  Cᵢⱼ")
        self.play(Write(t))

        formula = MathTex(r"C_{ij}", "=", r"(-1)^{i+j}", r"M_{ij}").scale(1.4)
        formula[2].set_color(COLOR_AREA)
        formula.shift(UP * 1.8)
        self.play(Write(formula))
        self.wait()

        expl = VGroup(
            Text("Si i + j es par:     (−1)ⁱ⁺ʲ = +1", font_size=28, color=COLOR_MAS),
            Text("Si i + j es impar:  (−1)ⁱ⁺ʲ = −1", font_size=28, color=COLOR_MENOS),
        ).arrange(DOWN, aligned_edge=LEFT).next_to(formula, DOWN, buff=0.5)
        self.play(FadeIn(expl[0]))
        self.play(FadeIn(expl[1]))
        self.wait(1.5)
        self.play(FadeOut(expl))

        signos = [["+", "-", "+"], ["-", "+", "-"], ["+", "-", "+"]]
        tablero = Matrix(signos, h_buff=1.0).scale(1.2).move_to([-3.5, -1.0, 0])
        for k, e in enumerate(tablero.get_entries()):
            e.set_color(COLOR_MAS if signos[k // 3][k % 3] == "+" else COLOR_MENOS)
        lbl = Text("Tablero de signos", font_size=26).next_to(tablero, DOWN)
        self.play(FadeIn(tablero.get_brackets()), FadeIn(lbl))
        self.play(LaggedStart(*[FadeIn(e, scale=1.5) for e in tablero.get_entries()],
                              lag_ratio=0.15))
        self.wait()

        nota = VGroup(
            Text("Empieza con + arriba a la izquierda", font_size=24),
            Text("y alterna como un tablero de ajedrez.", font_size=24),
        ).arrange(DOWN, aligned_edge=LEFT).move_to([2.8, -0.2, 0])
        self.play(FadeIn(nota))
        self.wait(1.5)

        ejemplos = [
            ((0, 0), r"C_{11} = (-1)^{1+1}M_{11} = +M_{11}"),
            ((0, 1), r"C_{12} = (-1)^{1+2}M_{12} = -M_{12}"),
            ((1, 2), r"C_{23} = (-1)^{2+3}M_{23} = -M_{23}"),
        ]
        prev = None
        for (i, j), tex in ejemplos:
            caja = SurroundingRectangle(tablero.get_entries()[3 * i + j],
                                        color=COLOR_AREA, buff=0.12)
            linea = MathTex(tex).scale(0.85).move_to([2.8, -1.8, 0])
            if prev is None:
                self.play(Create(caja), Write(linea))
            else:
                self.play(ReplacementTransform(prev[0], caja),
                          ReplacementTransform(prev[1], linea))
            self.wait(1.5)
            prev = (caja, linea)

        self.play(FadeOut(VGroup(*prev)))
        clave = Text("El cofactor es el menor con su signo.", font_size=30,
                     color=COLOR_AREA).move_to([2.8, -1.8, 0])
        self.play(Write(clave))
        self.wait(2)
        self.play(*[FadeOut(m) for m in self.mobjects])


# ---------------------------------------------------------------------------
# 4. La formula del desarrollo
# ---------------------------------------------------------------------------
class DesarrolloGeneral(UtilidadesCofactores, Scene):
    def construct(self):
        t = titulo("Paso 3: sumar entradas × cofactores")
        self.play(Write(t))

        A = Matrix(SIMBOLOS, h_buff=1.1).scale(0.85)
        grupo = VGroup(MathTex("A ="), A).arrange(RIGHT).move_to([1.8, 1.5, 0])
        self.play(Write(grupo))

        fila = Text("Desarrollamos por la fila 1:", font_size=28)
        fila.next_to(grupo, LEFT, buff=0.8)
        self.play(FadeIn(fila))

        f1 = MathTex(r"\det(A)", "=", "a_{11}", "C_{11}", "+", "a_{12}", "C_{12}",
                     "+", "a_{13}", "C_{13}").scale(0.95).move_to([0, -0.4, 0])
        self.play(Write(f1))
        self.wait()

        # Version con menores y signos visibles
        piezas = [MathTex(r"\det(A) =")]
        menores = []
        signos = ["+", "-", "+"]
        for j in range(3):
            if j > 0:
                s = MathTex(signos[j])
                s.set_color(COLOR_MAS if signos[j] == "+" else COLOR_MENOS)
                piezas.append(s)
            piezas.append(MathTex(SIMBOLOS[0][j], color=COLOR_PIVOTE))
            m = barras(submatriz(SIMBOLOS, 0, j), h_buff=1.0)
            menores.append(m)
            piezas.append(m)
        f2 = VGroup(*piezas).arrange(RIGHT, buff=0.15).scale(0.8)
        f2.move_to([0, -2.1, 0])

        self.play(Write(piezas[0]))
        idx = 1
        for j in range(3):
            partes = self.tachar(A, 0, j)
            anims = []
            if j > 0:
                anims.append(Write(piezas[idx]))
                idx += 1
            self.play(*anims, TransformFromCopy(partes[0], piezas[idx]))
            self.extraer_menor(partes[2], menores[j])
            idx += 2  # salta la entrada y su menor
            self.wait(0.8)
            self.restaurar(A, partes)

        ojo = VGroup(
            Text("¡Atención al signo − del segundo término!", font_size=26,
                 color=COLOR_MENOS),
            Text("Viene del tablero:  + − +", font_size=26),
        ).arrange(DOWN).to_edge(DOWN, buff=0.15)
        self.play(FadeIn(ojo))
        self.wait(2.5)
        self.play(FadeOut(ojo))

        general = VGroup(
            Text("Sirve cualquier fila i o cualquier columna j:", font_size=26),
            MathTex(r"\det(A) = \sum_{j=1}^{n} a_{ij}\,C_{ij}"
                    r"\qquad \det(A) = \sum_{i=1}^{n} a_{ij}\,C_{ij}",
                    color=COLOR_AREA).scale(0.85),
        ).arrange(DOWN).to_edge(DOWN, buff=0.15)
        self.play(FadeOut(f1), f2.animate.move_to([0, -0.4, 0]))
        self.play(FadeIn(general))
        self.wait(3)
        self.play(*[FadeOut(m) for m in self.mobjects])


# ---------------------------------------------------------------------------
# 5 y 6. Ejemplos numericos
# ---------------------------------------------------------------------------
class EjemploBase(UtilidadesCofactores):
    """Calcula det(EJEMPLO) desarrollando por las posiciones dadas."""

    texto_titulo = ""
    posiciones = []      # [(i, j), ...]
    expansion = []       # partes MathTex de la expansion simbolica
    expansion_num = []   # la misma expansion con numeros
    calculos = {}        # (i, j) -> (calculo, resultado) ; None = no se calcula
    final = ""

    def construct(self):
        t = titulo(self.texto_titulo)
        self.play(Write(t))

        A = Matrix(EJEMPLO, h_buff=0.9).scale(0.8)
        grupo = VGroup(MathTex("A ="), A).arrange(RIGHT).move_to([-4.6, 1.6, 0])
        self.play(Write(grupo))

        exp1 = MathTex(*self.expansion).scale(0.85)
        exp1.next_to(grupo, RIGHT, buff=0.8)
        self.play(Write(exp1))
        self.wait()
        exp2 = MathTex(*self.expansion_num).scale(0.85).move_to(exp1, aligned_edge=LEFT)
        self.play(TransformMatchingTex(exp1, exp2))
        self.wait()

        resultados = VGroup()
        for k, (i, j) in enumerate(self.posiciones):
            datos = self.calculos[(i, j)]
            partes = self.tachar(A, i, j)
            if datos is None:
                aviso = VGroup(
                    MathTex(rf"a_{{{i + 1}{j + 1}}} = 0", color=COLOR_PIVOTE),
                    Text("Ese término vale 0: ¡no hay que calcular nada!",
                         font_size=26),
                ).arrange(RIGHT).move_to([0.5, -0.2, 0])
                self.play(FadeIn(aviso))
                self.wait(2)
                res = MathTex(rf"a_{{{i + 1}{j + 1}}}C_{{{i + 1}{j + 1}}} = 0")
                self.restaurar(A, partes)
                self.play(ReplacementTransform(aviso, res))
            else:
                calculo, valor = datos
                ini = MathTex(rf"C_{{{i + 1}{j + 1}}} =",
                              rf"(-1)^{{{i + 1}+{j + 1}}}")
                ini[1].set_color(COLOR_MAS if (i + j) % 2 == 0 else COLOR_MENOS)
                menor = barras(submatriz(EJEMPLO, i, j), h_buff=0.9)
                fin = MathTex("=", calculo, "=", valor)
                fin[3].set_color(COLOR_AREA)
                linea = VGroup(ini, menor, fin).arrange(RIGHT).scale(0.95)
                linea.move_to([0, -0.3, 0])
                self.play(Write(ini))
                self.extraer_menor(partes[2], menor)
                self.wait(0.5)
                self.play(Write(fin[:2]))
                self.wait(1.2)
                self.play(Write(fin[2:]))
                self.wait(1.2)
                res = MathTex(rf"C_{{{i + 1}{j + 1}}} = {valor}")
                self.restaurar(A, partes)
                self.play(ReplacementTransform(linea, res))
            resultados.add(res)
            self.play(res.animate.move_to([-4 + 4 * k, -1.7, 0]))

        caja_res = SurroundingRectangle(resultados, color=GREY_B, buff=0.2)
        self.play(Create(caja_res))

        final = MathTex(self.final).scale(0.95).move_to([0, -2.9, 0])
        self.play(Write(final))
        recuadro = SurroundingRectangle(VGroup(*final[0].submobjects[-3:]), color=COLOR_AREA, buff=0.1)
        self.play(Create(recuadro))
        self.wait(2)
        self.cierre(final)

    def cierre(self, final):
        self.wait(1)
        self.play(*[FadeOut(m) for m in self.mobjects])


class EjemploFila(EjemploBase, Scene):
    texto_titulo = "Ejemplo: desarrollo por la fila 1"
    posiciones = [(0, 0), (0, 1), (0, 2)]
    expansion = [r"\det(A)", "=", "a_{11}", "C_{11}", "+", "a_{12}", "C_{12}",
                 "+", "a_{13}", "C_{13}"]
    expansion_num = [r"\det(A)", "=", "2", "C_{11}", "+", "1", "C_{12}",
                     "+", "3", "C_{13}"]
    calculos = {
        (0, 0): (r"+\big(4\cdot 1-(-1)(-2)\big)", "2"),
        (0, 1): (r"-\big(0\cdot 1-(-1)\cdot 5\big)", "-5"),
        (0, 2): (r"+\big(0\cdot(-2)-4\cdot 5\big)", "-20"),
    }
    final = r"\det(A) = 2(2) + 1(-5) + 3(-20) = 4 - 5 - 60 = -61"


class EjemploColumna(EjemploBase, Scene):
    texto_titulo = "Mismo ejemplo, por la columna 1"
    posiciones = [(0, 0), (1, 0), (2, 0)]
    expansion = [r"\det(A)", "=", "a_{11}", "C_{11}", "+", "a_{21}", "C_{21}",
                 "+", "a_{31}", "C_{31}"]
    expansion_num = [r"\det(A)", "=", "2", "C_{11}", "+", "0", "C_{21}",
                     "+", "5", "C_{31}"]
    calculos = {
        (0, 0): (r"+\big(4\cdot 1-(-1)(-2)\big)", "2"),
        (1, 0): None,
        (2, 0): (r"+\big(1\cdot(-1)-3\cdot 4\big)", "-13"),
    }
    final = r"\det(A) = 2(2) + 0 + 5(-13) = 4 - 65 = -61"

    def cierre(self, final):
        resto = [m for m in self.mobjects if m is not final]
        self.play(*[FadeOut(m) for m in resto], final.animate.move_to(UP * 1.0))
        igual = Text("¡El mismo resultado, con menos cuentas!",
                     font_size=32, color=COLOR_AREA).shift(DOWN * 0.2)
        consejo = Text("Consejo: desarrolla por la fila o columna con más ceros.",
                       font_size=28).next_to(igual, DOWN, buff=0.5)
        self.play(FadeIn(igual, shift=UP * 0.3))
        self.play(FadeIn(consejo))
        self.wait(3)
        self.play(*[FadeOut(m) for m in self.mobjects])


# ---------------------------------------------------------------------------
# 7. Resumen
# ---------------------------------------------------------------------------
class ResumenCofactores(Scene):
    def construct(self):
        t = titulo("En resumen")
        self.play(Write(t))

        pasos = VGroup(
            Text("1. Elige una fila o columna (la que tenga más ceros).",
                 font_size=28),
            VGroup(Text("2. Para cada entrada aᵢⱼ, tacha su fila y su columna:",
                        font_size=28),
                   Text("queda el menor Mᵢⱼ (un determinante más pequeño).",
                        font_size=28)).arrange(DOWN, aligned_edge=LEFT),
            Text("3. Pon el signo del tablero:  Cᵢⱼ = (−1)ⁱ⁺ʲ Mᵢⱼ", font_size=28),
            Text("4. Suma:  det(A) = Σ aᵢⱼ Cᵢⱼ", font_size=28, color=COLOR_AREA),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.4).shift(UP * 0.3)
        pasos[1][1].shift(RIGHT * 0.45)
        for p in pasos:
            self.play(FadeIn(p, shift=RIGHT * 0.3))
            self.wait(1.3)

        n4 = Text("Para una 4×4 los menores son 3×3, y se desarrollan igual.",
                  font_size=26, color=GREY_B).to_edge(DOWN, buff=0.6)
        self.play(FadeIn(n4))
        self.wait(3)
        self.play(*[FadeOut(m) for m in self.mobjects])
